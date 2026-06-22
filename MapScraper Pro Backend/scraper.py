"""
Google Maps Playwright scraper.
Streams business results as dicts; caller handles SSE formatting.
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
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _parse_coord(href: str):
    m = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", href)
    if m:
        return float(m.group(1)), float(m.group(2))
    m = re.search(r"/@(-?\d+\.\d+),(-?\d+\.\d+)", href)
    if m:
        return float(m.group(1)), float(m.group(2))
    return None, None


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
    """
    query = f"{category} near {location}" if location else category
    zoom = 14
    maps_url = f"https://www.google.com/maps/search/{quote(query)}/@{lat},{lng},{zoom}z?hl=en"

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

        seen = set()
        count = 0
        no_new_streak = 0

        while count < max_results and no_new_streak < 4:
            cards = await page.locator('[role="feed"] > div > div[jsaction]').all()
            batch_new = 0

            for card in cards:
                if count >= max_results:
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

                    # Link for coords
                    link_el = card.locator('a[href*="/maps/place/"]')
                    href = ""
                    if await link_el.count() > 0:
                        href = await link_el.first.get_attribute("href") or ""

                    b_lat, b_lng = _parse_coord(href)
                    if b_lat is None:
                        b_lat, b_lng = lat, lng

                    # Filter by radius
                    dist = _haversine_m(lat, lng, b_lat, b_lng)
                    if dist > radius_m * 1.5:
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
                    rev_el = card.locator(".UY7F9")
                    if await rev_el.count() > 0:
                        rev_raw = re.sub(r"[^\d]", "", await rev_el.first.inner_text())
                        reviews = int(rev_raw) if rev_raw else 0

                    # Address / extra text lines
                    spans = await card.locator(".W4Efsd span").all_inner_texts()
                    address = ""
                    for s in spans:
                        s = s.strip().lstrip("·").strip()
                        if len(s) > 8 and not re.match(r"^\d+(\.\d+)?$", s):
                            address = s
                            break

                    # Phone
                    phone = ""
                    phone_el = card.locator('[data-dtype="d3ph"]')
                    if await phone_el.count() > 0:
                        phone = (await phone_el.first.inner_text()).strip()

                    # Website
                    website = ""
                    web_el = card.locator('a[data-value="Website"]')
                    if await web_el.count() > 0:
                        website = await web_el.first.get_attribute("href") or ""

                    maps_link = f"https://www.google.com/maps/search/{quote(name)}/@{b_lat},{b_lng},17z"
                    if href:
                        maps_link = "https://www.google.com" + href if href.startswith("/maps") else href

                    business = {
                        "name": name,
                        "nameAr": "",
                        "category": category,
                        "rating": rating,
                        "reviews": reviews,
                        "phone": phone,
                        "email": "",
                        "website": website,
                        "address": address,
                        "status": "open",
                        "price": "$$",
                        "lat": b_lat,
                        "lng": b_lng,
                        "hours": "",
                        "services": ["In-store"],
                        "desc": "",
                        "mapsLink": maps_link,
                        "source": "google_maps",
                    }
                    count += 1
                    yield business

                except Exception:
                    continue

            if batch_new == 0:
                no_new_streak += 1
            else:
                no_new_streak = 0

            if count >= max_results:
                break

            # Scroll the feed
            try:
                await feed.evaluate("el => el.scrollBy(0, 1200)")
                await asyncio.sleep(1.8)
            except Exception:
                break

    finally:
        await context.close()
