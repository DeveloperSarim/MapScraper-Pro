"""
Google Maps Playwright scraper — v2
Streams business results as dicts; caller handles SSE formatting.
Phone numbers are extracted from detail pages for maximum reliability.
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


async def _get_phone_from_detail(context, url: str) -> str:
    """
    Open a business detail page in a new tab and extract the phone number
    using multiple fallback selectors. Returns empty string if not found.
    """
    page = await context.new_page()
    phone = ""
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20_000)
        # Wait for the detail panel content to settle
        await page.wait_for_timeout(2_500)

        # ── Method 1: data-item-id="phone:tel:+XXXX" ──────────────────────
        phone_item = page.locator('[data-item-id^="phone:tel:"]')
        if await phone_item.count() > 0:
            item_id = await phone_item.first.get_attribute("data-item-id") or ""
            phone = item_id.replace("phone:tel:", "").strip()

        # ── Method 2: aria-label="Phone: +XXXX" on button ─────────────────
        if not phone:
            for sel in [
                'button[aria-label^="Phone:"]',
                'button[aria-label^="Telefon:"]',
                'button[aria-label^="Téléphone:"]',
                'button[aria-label*="phone" i]',
            ]:
                els = page.locator(sel)
                if await els.count() > 0:
                    label = await els.first.get_attribute("aria-label") or ""
                    m = re.search(r"[\+\d][\d\s\-\(\)\.]{6,}", label)
                    if m:
                        phone = m.group(0).strip()
                        break

        # ── Method 3: <a href="tel:+XXXX"> ───────────────────────────────
        if not phone:
            tel_link = page.locator('a[href^="tel:"]')
            if await tel_link.count() > 0:
                href = await tel_link.first.get_attribute("href") or ""
                phone = href.replace("tel:", "").strip()

        # ── Method 4: visible span near a phone-icon section ──────────────
        if not phone:
            spans = page.locator(
                '[data-tooltip*="phone" i] span, '
                '[aria-label*="phone" i] span'
            )
            for i in range(min(await spans.count(), 5)):
                text = (await spans.nth(i).inner_text()).strip()
                if re.match(r"[\+\d][\d\s\-\(\)]{6,}", text):
                    phone = text
                    break

    except Exception:
        pass
    finally:
        await page.close()

    return phone


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
    Phone numbers are fetched from each business's detail page.
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
    sem = asyncio.Semaphore(3)

    async def fetch_phone(url: str) -> str:
        async with sem:
            return await _get_phone_from_detail(context, url)

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
            await context.close()
            return

        seen          = set()
        count         = 0
        no_new_streak = 0

        while count < max_results and no_new_streak < 4:
            cards    = await page.locator('[role="feed"] > div > div[jsaction]').all()
            batch_new = 0

            for card in cards:
                if count >= max_results:
                    break

                try:
                    # ── Name ──────────────────────────────────────────────
                    name_el = card.locator(".qBF1Pd")
                    if await name_el.count() == 0:
                        name_el = card.locator("div[class*='fontHeadlineSmall']")
                    if await name_el.count() == 0:
                        continue
                    name = (await name_el.first.inner_text()).strip()
                    if not name or name in seen:
                        continue

                    # ── Maps link / coords ────────────────────────────────
                    link_el = card.locator('a[href*="/maps/place/"]')
                    href    = ""
                    if await link_el.count() > 0:
                        href = await link_el.first.get_attribute("href") or ""

                    b_lat, b_lng = _parse_coord(href)
                    if b_lat is None:
                        b_lat, b_lng = lat, lng

                    # Radius filter
                    if _haversine_m(lat, lng, b_lat, b_lng) > radius_m * 1.5:
                        continue

                    seen.add(name)
                    batch_new += 1

                    # ── Rating ────────────────────────────────────────────
                    rating = 0.0
                    rating_el = card.locator(".MW4etd")
                    if await rating_el.count() > 0:
                        try:
                            rating = float((await rating_el.first.inner_text()).strip())
                        except ValueError:
                            pass

                    # ── Reviews ───────────────────────────────────────────
                    reviews = 0
                    rev_el  = card.locator(".UY7F9")
                    if await rev_el.count() > 0:
                        rev_raw = re.sub(r"[^\d]", "", await rev_el.first.inner_text())
                        reviews = int(rev_raw) if rev_raw else 0

                    # ── Address ───────────────────────────────────────────
                    spans   = await card.locator(".W4Efsd span").all_inner_texts()
                    address = ""
                    for s in spans:
                        s = s.strip().lstrip("·").strip()
                        if len(s) > 8 and not re.match(r"^\d+(\.\d+)?$", s):
                            address = s
                            break

                    # ── Phone — list view (fast, often empty on new Maps) ─
                    phone = ""

                    # Try data-dtype (legacy selector)
                    ph_el = card.locator('[data-dtype="d3ph"]')
                    if await ph_el.count() > 0:
                        phone = (await ph_el.first.inner_text()).strip()

                    # Try tel: link in card
                    if not phone:
                        tel_el = card.locator('a[href^="tel:"]')
                        if await tel_el.count() > 0:
                            t = await tel_el.first.get_attribute("href") or ""
                            phone = t.replace("tel:", "").strip()

                    # Try aria-label in card
                    if not phone:
                        aria_el = card.locator('[aria-label*="phone" i]')
                        if await aria_el.count() > 0:
                            lbl = await aria_el.first.get_attribute("aria-label") or ""
                            m = re.search(r"[\+\d][\d\s\-\(\)]{6,}", lbl)
                            if m:
                                phone = m.group(0).strip()

                    # ── Website ───────────────────────────────────────────
                    website = ""
                    web_el  = card.locator('a[data-value="Website"]')
                    if await web_el.count() > 0:
                        website = await web_el.first.get_attribute("href") or ""

                    # ── Maps link ─────────────────────────────────────────
                    maps_link = (
                        f"https://www.google.com/maps/search/"
                        f"{quote(name)}/@{b_lat},{b_lng},17z"
                    )
                    if href:
                        maps_link = (
                            "https://www.google.com" + href
                            if href.startswith("/maps") else href
                        )

                    # ── Fetch phone from detail page if still missing ──────
                    if not phone and maps_link:
                        try:
                            phone = await fetch_phone(maps_link)
                        except Exception:
                            phone = ""

                    business = {
                        "name":     name,
                        "nameAr":   "",
                        "category": category,
                        "rating":   rating,
                        "reviews":  reviews,
                        "phone":    phone,
                        "email":    "",
                        "website":  website,
                        "address":  address,
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

            # Scroll the feed to load more results
            try:
                await feed.evaluate("el => el.scrollBy(0, 1200)")
                await asyncio.sleep(1.8)
            except Exception:
                break

    finally:
        await context.close()
