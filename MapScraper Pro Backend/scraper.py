"""
Google Maps Playwright scraper — v3 (Optimized)
Streams business results as dicts; caller handles SSE formatting.
Concurrent detail fetches with asyncio.Queue and in-page JS evaluation.
"""
import asyncio
import re
import math
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


async def _get_phone_from_detail(context, url: str) -> str:
    """
    Open a business detail page in a new tab and extract the phone number
    using multiple fallback selectors executed in-page in JS.
    Returns empty string if not found.
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

    phone = ""
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20_000)
        
        # Wait for the main detail title to render
        try:
            await page.wait_for_selector("h1.DUwDvf", timeout=5_000)
        except Exception:
            pass

        # Give it a tiny moment to render dynamic widgets
        await page.wait_for_timeout(500)

        # Extract phone number in single in-page JS evaluate
        phone = await page.evaluate("""
            () => {
                // 1. data-item-id="phone:tel:+XXXX"
                const phoneItem = document.querySelector('[data-item-id^="phone:tel:"]');
                if (phoneItem) {
                    const itemId = phoneItem.getAttribute("data-item-id") || "";
                    const val = itemId.replace("phone:tel:", "").trim();
                    if (val) return val;
                }
                
                // 2. aria-label="Phone: +XXXX" or similar
                const phoneBtn = document.querySelector('button[aria-label*="phone" i], button[aria-label^="Phone:"], button[aria-label^="Telefon:"], button[aria-label^="Téléphone:"]');
                if (phoneBtn) {
                    const label = phoneBtn.getAttribute("aria-label") || "";
                    const m = label.match(/[\\+\\d][\\d\\s\\-\\(\\)\\.]{6,}/);
                    if (m) return m[0].trim();
                }
                
                // 3. tel: link
                const telLink = document.querySelector('a[href^="tel:"]');
                if (telLink) {
                    const href = telLink.getAttribute("href") || "";
                    const val = href.replace("tel:", "").trim();
                    if (val) return val;
                }
                
                // 4. visible span inside phone tooltip sections
                const spans = Array.from(document.querySelectorAll('[data-tooltip*="phone" i] span, [aria-label*="phone" i] span'));
                for (const span of spans) {
                    const text = span.innerText.trim();
                    if (/[\\+\\d][\\d\\s\\-\\(\\)]{6,}/.test(text)) {
                        return text;
                    }
                }
                
                return "";
            }
        """)

    except Exception:
        pass
    finally:
        await page.close()

    return phone or ""


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
    Fetches phone numbers concurrently in the background using asyncio.Queue.
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

    # Limit concurrent detail-page fetches to avoid overloading
    sem = asyncio.Semaphore(5)

    async def fetch_phone(url: str) -> str:
        async with sem:
            return await _get_phone_from_detail(context, url)

    queue = asyncio.Queue()
    pending_tasks = set()
    scheduled_count = 0
    seen = set()

    async def parse_card_task(biz_data):
        maps_link = biz_data["mapsLink"]
        phone = ""
        if maps_link:
            try:
                phone = await fetch_phone(maps_link)
            except Exception:
                pass
        biz_data["phone"] = phone or biz_data["phone"]
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
                            
                            const spans = Array.from(card.querySelectorAll(".W4Efsd span")).map(s => s.innerText);
                            let address = "";
                            for (let s of spans) {
                                s = s.trim().replace(/^·/, '').trim();
                                if (s.length > 8 && !/^\\d+(\\.\\d+)?$/.test(s)) {
                                    address = s;
                                    break;
                                }
                            }
                            
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
                                    const m = lbl.match(/[\\+\\d][\\d\\s\\-\\(\\)]{6,}/);
                                    if (m) phone = m[0].trim();
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

                    # Fetch phone number concurrently if missing
                    if not business["phone"] and maps_link:
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
                    await asyncio.sleep(1.8)
                except Exception:
                    break

        except Exception as e:
            log.exception("Error in main scraping loop: %s", e)
        finally:
            # Wait for all running phone tasks to complete before closing queue
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
