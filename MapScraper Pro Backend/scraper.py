"""
Google Maps Playwright scraper — v3
Speed optimized: phone + website fetched in ONE detail page visit.
Concurrent detail fetches with smart element-based waiting.
"""
import asyncio
import re
import math
from urllib.parse import quote
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

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
    Open a business detail page in a new tab.
    Returns {phone, website} — both in ONE visit for speed.
    Smart element-based waiting instead of fixed sleep.
    """
    page = await context.new_page()
    phone   = ""
    website = ""
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=15_000)

        # Smart wait: stop as soon as key elements appear (max 3s)
        try:
            await page.locator(
                '[data-item-id^="phone:tel:"], '
                '[data-item-id="authority"], '
                'a[href^="tel:"]'
            ).first.wait_for(timeout=3_000)
        except Exception:
            pass  # Elements not found in time — still try below

        # ── PHONE ─────────────────────────────────────────────────────────

        # Method 1: data-item-id="phone:tel:+XXXX"
        phone_item = page.locator('[data-item-id^="phone:tel:"]')
        if await phone_item.count() > 0:
            item_id = await phone_item.first.get_attribute("data-item-id") or ""
            phone = item_id.replace("phone:tel:", "").strip()

        # Method 2: button[aria-label="Phone: +XXXX"]
        if not phone:
            for sel in [
                'button[aria-label^="Phone:"]',
                'button[aria-label^="Telefon:"]',
                'button[aria-label*="phone" i]',
            ]:
                els = page.locator(sel)
                if await els.count() > 0:
                    lbl = await els.first.get_attribute("aria-label") or ""
                    m = re.search(r"[\+\d][\d\s\-\(\)\.]{6,}", lbl)
                    if m:
                        phone = m.group(0).strip()
                        break

        # Method 3: <a href="tel:+XXXX">
        if not phone:
            tel_link = page.locator('a[href^="tel:"]')
            if await tel_link.count() > 0:
                href = await tel_link.first.get_attribute("href") or ""
                phone = href.replace("tel:", "").strip()

        # ── WEBSITE ───────────────────────────────────────────────────────

        # Method 1: data-item-id="authority" (Google Maps official website btn)
        web_item = page.locator('[data-item-id="authority"]')
        if await web_item.count() > 0:
            website = await web_item.first.get_attribute("href") or ""

        # Method 2: aria-label containing "website"
        if not website:
            web_btn = page.locator('a[aria-label*="website" i], a[data-tooltip*="website" i]')
            if await web_btn.count() > 0:
                website = await web_btn.first.get_attribute("href") or ""

        # Method 3: any external http link in the detail panel (not google.com)
        if not website:
            links = page.locator('a[href^="http"]')
            for i in range(min(await links.count(), 10)):
                href = await links.nth(i).get_attribute("href") or ""
                if href and "google." not in href and "maps." not in href:
                    website = href
                    break

        # Clean website URL
        if website:
            website = website.split("?")[0].rstrip("/")

    except Exception:
        pass
    finally:
        await page.close()

    return {"phone": phone, "website": website}


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
    Phone + website fetched from detail page in one concurrent visit.
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

    # ── 5 concurrent detail-page fetches (was 3) ──────────────────────────
    sem = asyncio.Semaphore(5)

    async def fetch_detail(url: str) -> dict:
        async with sem:
            return await _get_detail_info(context, url)

    try:
        await page.goto(maps_url, wait_until="domcontentloaded", timeout=30_000)

        # Accept cookie banner if present
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
            await context.close()
            return

        seen          = set()
        count         = 0
        no_new_streak = 0

        while count < max_results and no_new_streak < 4:
            cards     = await page.locator('[role="feed"] > div > div[jsaction]').all()
            batch_new = 0

            # ── Collect basic info from list view ─────────────────────────
            batch_businesses = []

            for card in cards:
                if count + len(batch_businesses) >= max_results:
                    break
                try:
                    # Name
                    name_el = card.locator(".qBF1Pd")
                    if await name_el.count() == 0:
                        name_el = card.locator("div[class*='fontHeadlineSmall']")
                    if await name_el.count() == 0:
                        continue
                    name = (await name_el.first.inner_text()).strip()
                    if not name or name in seen:
                        continue

                    # Link / coords
                    link_el = card.locator('a[href*="/maps/place/"]')
                    href    = ""
                    if await link_el.count() > 0:
                        href = await link_el.first.get_attribute("href") or ""

                    b_lat, b_lng = _parse_coord(href)
                    if b_lat is None:
                        b_lat, b_lng = lat, lng

                    if _haversine_m(lat, lng, b_lat, b_lng) > radius_m * 1.5:
                        continue

                    seen.add(name)
                    batch_new += 1

                    # Rating
                    rating = 0.0
                    rating_el = card.locator(".MW4etd")
                    if await rating_el.count() > 0:
                        try:
                            rating = float((await rating_el.first.inner_text()).strip())
                        except ValueError:
                            pass

                    # Reviews
                    reviews = 0
                    rev_el  = card.locator(".UY7F9")
                    if await rev_el.count() > 0:
                        rev_raw = re.sub(r"[^\d]", "", await rev_el.first.inner_text())
                        reviews = int(rev_raw) if rev_raw else 0

                    # Address
                    spans   = await card.locator(".W4Efsd span").all_inner_texts()
                    address = ""
                    for s in spans:
                        s = s.strip().lstrip("·").strip()
                        if len(s) > 8 and not re.match(r"^\d+(\.\d+)?$", s):
                            address = s
                            break

                    # Quick phone/website from list card (fast, often empty)
                    phone   = ""
                    website = ""

                    ph_el = card.locator('[data-dtype="d3ph"]')
                    if await ph_el.count() > 0:
                        phone = (await ph_el.first.inner_text()).strip()
                    if not phone:
                        tel_el = card.locator('a[href^="tel:"]')
                        if await tel_el.count() > 0:
                            t = await tel_el.first.get_attribute("href") or ""
                            phone = t.replace("tel:", "").strip()

                    web_el = card.locator('a[data-value="Website"]')
                    if await web_el.count() > 0:
                        website = await web_el.first.get_attribute("href") or ""

                    # Maps link
                    maps_link = (
                        f"https://www.google.com/maps/search/"
                        f"{quote(name)}/@{b_lat},{b_lng},17z"
                    )
                    if href:
                        maps_link = (
                            "https://www.google.com" + href
                            if href.startswith("/maps") else href
                        )

                    batch_businesses.append({
                        "name":      name,
                        "maps_link": maps_link,
                        "phone":     phone,
                        "website":   website,
                        "rating":    rating,
                        "reviews":   reviews,
                        "address":   address,
                        "lat":       b_lat,
                        "lng":       b_lng,
                    })

                except Exception:
                    continue

            # ── Parallel detail fetch for phone+website ───────────────────
            # Only fetch for businesses missing phone OR website
            needs_detail = [
                b for b in batch_businesses
                if not b["phone"] or not b["website"]
            ]

            detail_tasks = {
                b["maps_link"]: asyncio.create_task(fetch_detail(b["maps_link"]))
                for b in needs_detail
            }

            # Yield businesses as detail tasks complete
            for b in batch_businesses:
                if count >= max_results:
                    break

                if b["maps_link"] in detail_tasks:
                    try:
                        detail = await detail_tasks[b["maps_link"]]
                        if not b["phone"]:
                            b["phone"] = detail.get("phone", "")
                        if not b["website"]:
                            b["website"] = detail.get("website", "")
                    except Exception:
                        pass

                business = {
                    "name":     b["name"],
                    "nameAr":   "",
                    "category": category,
                    "rating":   b["rating"],
                    "reviews":  b["reviews"],
                    "phone":    b["phone"],
                    "email":    "",
                    "website":  b["website"],
                    "address":  b["address"],
                    "status":   "open",
                    "price":    "$$",
                    "lat":      b["lat"],
                    "lng":      b["lng"],
                    "hours":    "",
                    "services": ["In-store"],
                    "desc":     "",
                    "mapsLink": b["maps_link"],
                    "source":   "google_maps",
                }
                count += 1
                yield business

            if batch_new == 0:
                no_new_streak += 1
            else:
                no_new_streak = 0

            if count >= max_results:
                break

            # Scroll feed to load more
            try:
                await feed.evaluate("el => el.scrollBy(0, 1200)")
                await asyncio.sleep(1.5)
            except Exception:
                break

    finally:
        await context.close()
