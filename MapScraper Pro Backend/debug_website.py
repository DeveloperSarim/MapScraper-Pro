"""
Debug v2: Save full page HTML to inspect what Google returns.
Uses same user-agent and setup as the main scraper.
"""
import asyncio
from playwright.async_api import async_playwright

# Use exact URL format from scraper (with data= params from a real search result)
# This is the href format from search result cards
URL = "https://www.google.com/maps/search/Restaurant+Jeddah/@21.4858,39.1925,14z?hl=en"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage",
                  "--disable-blink-features=AutomationControlled"]
        )
        ctx = await browser.new_context(
            locale="en-US",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        page = await ctx.new_page()

        print("Step 1: Open search results...")
        await page.goto(URL, wait_until="domcontentloaded", timeout=30_000)
        await page.wait_for_timeout(3_000)

        # Accept cookies
        try:
            btn = page.locator('button[aria-label*="Accept"]')
            if await btn.count() > 0:
                await btn.first.click()
                await page.wait_for_timeout(1_000)
        except Exception:
            pass

        # Get first card link
        print("Step 2: Find first result card...")
        feed = page.locator('[role="feed"]')
        try:
            await feed.wait_for(timeout=10_000)
        except Exception:
            print("  Feed not found! Saving HTML...")
            html = await page.content()
            with open("/tmp/maps_debug.html", "w") as f:
                f.write(html)
            print(f"  Saved to /tmp/maps_debug.html ({len(html)} bytes)")
            await browser.close()
            return

        cards = await page.locator('[role="feed"] > div > div[jsaction]').all()
        print(f"  Found {len(cards)} cards")
        if not cards:
            await browser.close()
            return

        # Get the href from first card
        first_card = cards[0]
        link = first_card.locator('a[href*="/maps/place/"]')
        href = ""
        if await link.count() > 0:
            href = await link.first.get_attribute("href") or ""
            name_el = first_card.locator(".qBF1Pd")
            if await name_el.count() > 0:
                name = (await name_el.first.inner_text()).strip()
                print(f"  First result: {name}")
        
        if not href:
            print("  No href found!")
            await browser.close()
            return

        detail_url = "https://www.google.com" + href if href.startswith("/maps") else href
        print(f"Step 3: Opening detail page:\n  {detail_url[:80]}")

        page2 = await ctx.new_page()
        await page2.goto(detail_url, wait_until="domcontentloaded", timeout=20_000)
        await page2.wait_for_timeout(4_000)

        print("\n── data-item-id elements ──────────────────────────────")
        items = await page2.locator("[data-item-id]").all()
        if not items:
            print("  NONE FOUND!")
        for el in items[:15]:
            iid  = await el.get_attribute("data-item-id") or ""
            href = await el.get_attribute("href") or ""
            text = (await el.inner_text()).strip()[:40]
            tag  = await el.evaluate("e => e.tagName")
            print(f"  {tag:6} | {iid:35} | {href[:35]} | {text}")

        print("\n── Non-Google http links ───────────────────────────────")
        links = await page2.locator("a[href^='http']").all()
        found = 0
        for el in links[:50]:
            href = (await el.get_attribute("href") or "")
            cls  = (await el.get_attribute("class") or "")[:25]
            text = (await el.inner_text()).strip()[:30]
            if "google." not in href and "goo.gl" not in href:
                print(f"  {cls:25} | {href[:55]} | {text}")
                found += 1
        if found == 0:
            print("  NONE FOUND!")

        # Save HTML for manual inspection
        html = await page2.content()
        with open("/tmp/maps_detail_debug.html", "w") as f:
            f.write(html)
        print(f"\nFull HTML saved: /tmp/maps_detail_debug.html ({len(html)} bytes)")
        print("Page title:", await page2.title())

        await browser.close()

asyncio.run(main())
