"""
Google Maps Playwright scraper — v3 (Optimized & Reliable)
Streams business results as dicts; caller handles SSE formatting.
Concurrent detail fetches with asyncio.Queue and in-page JS evaluation.
"""
import asyncio
import re
import math
import random
import logging
from urllib.parse import quote
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

log = logging.getLogger(__name__)

_BROWSER = None
_PW      = None


async def get_browser():
    global _BROWSER, _PW
    if _BROWSER and _BROWSER.is_connected():
        return _BROWSER
    _PW = await async_playwright().start()
    _BROWSER = await _PW.chromium.launch(
        headless=True,
        args=[
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-blink-features=AutomationControlled",
            "--lang=en-US",
        ],
    )
    return _BROWSER


def _haversine_m(lat1, lng1, lat2, lng2):
    R = 6_371_000
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _parse_coord(href: str):
    m = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", href)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"/@(-?\d+\.\d+),(-?\d+\.\d+)", href)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


async def _get_detail_info(context, url: str) -> dict:
    """
    Open a business detail page in a new tab and extract both the phone number
    and full address using stable selectors executed in-page in JS.
    Returns {"phone": str, "address": str}.
    """
    page = await context.new_page()
    
    # Speed Optimization: Abort heavy assets (images, media, fonts) to load faster
    try:
        await page.route(
            "**/*",
            lambda route: route.abort()
            if route.request.resource_type in ["image", "media", "font"]
            else route.continue_()
        )
    except Exception:
        pass

    result = {"phone": "", "address": ""}
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=15_000)
        
        # Wait for the main detail title to render
        try:
            await page.wait_for_selector("h1.DUwDvf", timeout=4_000)
        except Exception:
            pass

        # Give it a tiny moment to render dynamic widgets
        await page.wait_for_timeout(300)

        # Extract details in single in-page JS evaluate
        extracted = await page.evaluate("""
            () => {
                // 1. Phone extraction
                let phone = "";
                const phoneItem = document.querySelector('[data-item-id^="phone:tel:"]');
                if (phoneItem) {
                    const itemId = phoneItem.getAttribute("data-item-id") || "";
                    phone = itemId.replace("phone:tel:", "").trim();
                }
                
                if (!phone) {
                    const phoneBtn = document.querySelector('button[aria-label*="phone" i], button[aria-label^="Phone:"], button[aria-label^="Telefon:"], button[aria-label^="Téléphone:"]');
                    if (phoneBtn) {
                        const label = phoneBtn.getAttribute("aria-label") || "";
                        const m = label.match(/[\\+\\d][\\d\\s\\-\\(\\)\\.]{6,}/);
                        if (m) phone = m[0].trim();
                    }
                }
                
                if (!phone) {
                    const telLink = document.querySelector('a[href^="tel:"]');
                    if (telLink) {
                        const href = telLink.getAttribute("href") || "";
                        phone = href.replace("tel:", "").trim();
                    }
                }
                
                if (!phone) {
                    const spans = Array.from(document.querySelectorAll('[data-tooltip*="phone" i] span, [aria-label*="phone" i] span'));
                    for (const span of spans) {
                        const text = span.innerText.trim();
                        if (/[\\+\\d][\\d\\s\\-\\(\\)]{6,}/.test(text)) {
                            phone = text;
                            break;
                        }
                    }
                }
                
                // 2. Address extraction
                let address = "";
                const addressItem = document.querySelector('[data-item-id="address"]');
                if (addressItem) {
                    address = addressItem.innerText.trim().replace(/^\\ue0c8\\n/, '').trim();
                }
                
                return { phone, address };
            }
        """)
        if extracted:
            result.update(extracted)

    except Exception:
        pass
    finally:
        await page.close()

    return result


async def scrape(
    category: str,
    location: str,
    lat: float,
    lng: float,
    radius_m: float,
    max_results: int = 60,
):
    """
    Async generator — yields business dicts one by one.
    Stays within radius_m metres of (lat, lng).
    Fetches phone numbers and full addresses concurrently in the background.
    """
    query    = f"{category} near {location}" if location else category
    zoom     = 14
    maps_url = (
        f"https://www.google.com/maps/search/{quote(query)}"
        f"/@{lat},{lng},{zoom}z?hl=en"
    )

    browser = await get_browser()
    context = await browser.new_context(
        locale="en-US",
        user_agent=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    )
    page = await context.new_page()

    # Moderate Semaphore count to prevent Google Map Captchas/Blocks
    sem = asyncio.Semaphore(4)

    async def fetch_details(url: str) -> dict:
        async with sem:
            # Jitter to avoid bot-like bulk requests
            await asyncio.sleep(random.uniform(0.1, 0.5))
            return await _get_detail_info(context, url)

    queue = asyncio.Queue()
    pending_tasks = set()
    scheduled_count = 0
    seen = set()

    async def parse_card_task(biz_data):
        maps_link = biz_data["mapsLink"]
        if maps_link:
            try:
                details = await fetch_details(maps_link)
                biz_data["phone"] = details.get("phone") or biz_data["phone"]
                # Update with the full address if fetched successfully
                biz_data["address"] = details.get("address") or biz_data["address"]
            except Exception:
                pass
        await queue.put(biz_data)

    async def main_loop():
        nonlocal scheduled_count
        try:
            await page.goto(maps_url, wait_until="domcontentloaded", timeout=30_000)

            # Accept cookie/consent banner if present
            try:
                btn = page.locator('button[aria-label*="Accept"]')
                if await btn.count() > 0:
                    await btn.first.click(timeout=3_000)
            except Exception:
                pass

            # Wait for results feed
            feed = page.locator('[role="feed"]')
            try:
                await feed.wait_for(timeout=15_000)
            except PWTimeout:
                return

            no_new_streak = 0

            while scheduled_count < max_results and no_new_streak < 4:
                # ── In-page JS Card Parsing to minimize IPC calls ──────────────────
                cards_data = await page.evaluate("""
                    () => {
                        const cards = document.querySelectorAll('[role="feed"] > div > div[jsaction]');
                        const results = [];
                        cards.forEach(card => {
                            let nameEl = card.querySelector(".qBF1Pd");
                            if (!nameEl) nameEl = card.querySelector("div[class*='fontHeadlineSmall']");
                            if (!nameEl) return;
                            const name = nameEl.innerText.trim();
                            
                            const linkEl = card.querySelector('a[href*="/maps/place/"]');
                            const href = linkEl ? linkEl.getAttribute('href') : '';
                            
                            const ratingEl = card.querySelector(".MW4etd");
                            const rating = ratingEl ? parseFloat(ratingEl.innerText.trim()) || 0.0 : 0.0;
                            
                            const revEl = card.querySelector(".UY7F9");
                            let reviews = 0;
                            if (revEl) {
                                const revRaw = revEl.innerText.replace(/[^\\d]/g, '');
                                reviews = parseInt(revRaw) || 0;
                            }
                            
                            // 1. Extract Address from Card spans (excluding category, hours, phone, rating)
                            let address = "";
                            const rows = Array.from(card.querySelectorAll(".W4Efsd"));
                            for (const row of rows) {
                                const text = row.innerText.trim();
                                if (text.includes("·") && !/^(open|closed|opens|closes|reopens|closed until|24 hours)/i.test(text)) {
                                    const parts = text.split("·").map(p => p.trim());
                                    if (parts.length >= 2) {
                                        for (let i = 1; i < parts.length; i++) {
                                            let part = parts[i].split('\\n')[0].trim();
                                            if (part.length > 3 && 
                                                !/^[\ue934\$\\¥\£\€\d\.\\s]+$/.test(part) && 
                                                !/^(open|closed|opens|closes|reopens|closed until|24 hours)/i.test(part) &&
                                                !/[\\+\\d][\\d\\s\\-]{7,}/.test(part)) {
                                                address = part;
                                                break;
                                            }
                                        }
                                        if (address) break;
                                    }
                                }
                            }
                            
                            if (!address) {
                                const allSpans = Array.from(card.querySelectorAll(".W4Efsd span")).map(s => s.innerText.trim());
                                for (let s of allSpans) {
                                    s = s.replace(/^·/, '').trim().split('\\n')[0].trim();
                                    if (s.length > 4 && 
                                        !/^(open|closed|opens|closes|reopens|closed until|24 hours|¥|\\$)/i.test(s) &&
                                        !/[\\+\\d][\\d\\s\\-]{7,}/.test(s) &&
                                        !/^\\d+(\\.\\d+)?$/.test(s) &&
                                        !s.toLowerCase().includes("restaurant") &&
                                        !s.toLowerCase().includes("cafe") &&
                                        !s.toLowerCase().includes("shop") &&
                                        !s.toLowerCase().includes("store")) {
                                        address = s;
                                        break;
                                    }
                                }
                            }
                            
                            // 2. Extract Phone directly from Card spans/text
                            let phone = "";
                            const phEl = card.querySelector('[data-dtype="d3ph"]');
                            if (phEl) phone = phEl.innerText.trim();
                            
                            if (!phone) {
                                const telEl = card.querySelector('a[href^="tel:"]');
                                if (telEl) phone = telEl.getAttribute('href').replace('tel:', '').trim();
                            }
                            
                            if (!phone) {
                                const ariaEl = card.querySelector('[aria-label*="phone" i]');
                                if (ariaEl) {
                                    const lbl = ariaEl.getAttribute('aria-label') || '';
                                    const m = lbl.match(/[\\+\\d][\\d\\s\\-\\(\\)]{7,}/);
                                    if (m) phone = m[0].trim();
                                }
                            }
                            
                            if (!phone) {
                                const cardSpans = Array.from(card.querySelectorAll("span")).map(s => s.innerText.trim());
                                for (const text of cardSpans) {
                                    const cleanText = text.replace(/^·/, '').trim();
                                    const match = cleanText.match(/(?:\\+?\\d{1,3}[- ]?)?\\(?\\d{2,4}\\)?[- ]?\\d{3,4}[- ]?\\d{3,4}/);
                                    if (match) {
                                        const digits = match[0].replace(/[^\\d]/g, '');
                                        if (digits.length >= 9 && digits.length <= 15) {
                                            phone = match[0].trim();
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            let website = "";
                            const webEl = card.querySelector('a[data-value="Website"]');
                            if (webEl) website = webEl.getAttribute('href') || '';
                            
                            results.push({
                                name,
                                href,
                                rating,
                                reviews,
                                address,
                                phone,
                                website
                            });
                        });
                        return results;
                    }
                """)

                batch_new = 0
                for c in cards_data:
                    if scheduled_count >= max_results:
                        break

                    name = c["name"]
                    if not name or name in seen:
                        continue

                    # Parse coordinates
                    b_lat, b_lng = _parse_coord(c["href"])
                    if b_lat is None:
                        b_lat, b_lng = lat, lng

                    # Radius filter
                    if _haversine_m(lat, lng, b_lat, b_lng) > radius_m * 1.5:
                        continue

                    seen.add(name)
                    batch_new += 1
                    scheduled_count += 1

                    # Maps link
                    maps_link = (
                        f"https://www.google.com/maps/search/"
                        f"{quote(name)}/@{b_lat},{b_lng},17z"
                    )
                    if c["href"]:
                        maps_link = (
                            "https://www.google.com" + c["href"]
                            if c["href"].startswith("/maps") else c["href"]
                        )

                    business = {
                        "name":     name,
                        "nameAr":   "",
                        "category": category,
                        "rating":   c["rating"],
                        "reviews":  c["reviews"],
                        "phone":    c["phone"],
                        "email":    "",
                        "website":  c["website"],
                        "address":  c["address"],
                        "status":   "open",
                        "price":    "$$",
                        "lat":      b_lat,
                        "lng":      b_lng,
                        "hours":    "",
                        "services": ["In-store"],
                        "desc":     "",
                        "mapsLink": maps_link,
                        "source":   "google_maps",
                    }

                    # Fetch detail info concurrently if missing phone or address
                    if (not business["phone"] or not business["address"]) and maps_link:
                        task = asyncio.create_task(parse_card_task(business))
                        pending_tasks.add(task)
                        task.add_done_callback(pending_tasks.discard)
                    else:
                        await queue.put(business)

                if batch_new == 0:
                    no_new_streak += 1
                else:
                    no_new_streak = 0

                if scheduled_count >= max_results:
                    break

                # Scroll the feed to load more results
                try:
                    await feed.evaluate("el => el.scrollBy(0, 1200)")
                    await asyncio.sleep(0.8)
                except Exception:
                    break

        except Exception as e:
            log.exception("Error in main scraping loop: %s", e)
        finally:
            # Wait for all running phone/address tasks to complete before closing queue
            if pending_tasks:
                await asyncio.gather(*pending_tasks, return_exceptions=True)
            await queue.put(None)

    loop_task = asyncio.create_task(main_loop())

    try:
        while True:
            item = await queue.get()
            if item is None:
                break
            yield item
    finally:
        # Cancel any active tasks if generator is closed early (e.g. client disconnect)
        loop_task.cancel()
        for t in pending_tasks:
            t.cancel()
        await context.close()
