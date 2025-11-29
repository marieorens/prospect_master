"""
Playwright-based Python script that logs into RankerFox and keeps the Semrush tab open.

Install:
    pip install playwright
    python -m playwright install msedge

Notes:
- The script launches Microsoft Edge browser.
- It waits for the new page created by the Semrush click and keeps that page open instead of closing it.
- Browser is left open for manual inspection. Ctrl+C to stop the script.
- For safety, load credentials from env vars in production.
"""

import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

RANKERFOX_URL = "https://rankerfox.com/login"
SEARCH_URL_TO_ENTER = "https://makers-agency.com/"
USERNAME = "Spybox"
PASSWORD = "NOoD41ZJp0RZc3m"


async def login_to_rankerfox():
    print("▶️ Starting Playwright...")
    async with async_playwright() as p:
        # Launch Microsoft Edge browser
        print("⏳ Launching Microsoft Edge...")
        browser = await p.chromium.launch(channel="msedge", headless=False, args=["--start-maximized"])
        print("✅ Edge browser launched successfully.")

        # Create context with realistic browser fingerprint to avoid detection
        context = await browser.new_context(
            no_viewport=True,
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            locale='fr-FR',
            timezone_id='Europe/Paris'
        )
        page = await context.new_page()
        page.set_default_timeout(60_000)  # Increased to 60 seconds

        async def on_dialog(dialog):
            try:
                print("⚠️ Pop-up detected:", dialog.message)
                await dialog.accept()
                print("✅ Pop-up accepted.")
            except Exception as ex:
                print("⚠️ Failed to handle dialog:", ex)

        page.on("dialog", on_dialog)

        try:
            # 1) Login
            print(f"⏳ Navigating to {RANKERFOX_URL} ...")

            # Try multiple times in case of gateway timeout
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    await page.goto(RANKERFOX_URL, wait_until="load", timeout=90000)
                    print("✅ Page loaded successfully")
                    break
                except Exception as e:
                    if attempt < max_retries - 1:
                        print(f"⚠️ Attempt {attempt + 1} failed: {e}")
                        print(f"🔄 Retrying... ({attempt + 2}/{max_retries})")
                        await asyncio.sleep(3)
                    else:
                        raise

            # Wait a bit for page to stabilize
            await asyncio.sleep(2)

            # Wait for login form to be ready
            print("⏳ Waiting for login form...")
            await page.wait_for_selector('input[name="log"]', timeout=30000)
            print("✅ Login form found")

            await page.fill('input[name="log"]', USERNAME)
            await page.fill('input[name="pwd"]', PASSWORD)
            await asyncio.sleep(1)  # Small delay to mimic human behavior

            print("⏳ Submitting login form...")
            await page.click('.impu-form-submit input[type="submit"][value="Log In"]')

            # Wait for navigation after login
            await page.wait_for_load_state("networkidle", timeout=60000)
            print("✅ Connected to RankerFox")

            # 2) Click semrush and wait for the new page (if it opens in a new tab/window)
            try:
                await page.wait_for_selector('input[type="submit"][value="semrush"]', timeout=10000)
                print("✅ Found Semrush button")
            except PlaywrightTimeoutError:
                print("⚠️ semrush button not found within 10s. Continuing anyway...")

            # Before clicking, start waiting for a new page event with timeout
            print("⏳ Clicking Semrush button...")
            async with context.expect_page(timeout=30000) as new_page_info:
                await page.click('input[type="submit"][value="semrush"]')

            new_page = await new_page_info.value
            print(f"✅ New Semrush page opened: {new_page.url}")

            # Wait for the new page to load
            await new_page.wait_for_load_state("domcontentloaded", timeout=10000)
            print("✅ Semrush page loaded")

            # Wait a bit more for dynamic content
            await asyncio.sleep(3)
            semrush_page = new_page
            print("✅ Semrush page ready")

            # Optionally close other pages except semrush_page (uncomment if desired)
            # for p in context.pages:
            #     if p != semrush_page:
            #         try:
            #             await p.close()
            #         except Exception:
            #             pass
            # print("✅ Closed other tabs (except Semrush)")

            # 4) Wait for Semrush full load and search bar
            print("⏳ Waiting for Semrush search bar...")
            await semrush_page.wait_for_selector('[data-test="searchbar_input"]', timeout=15000)
            print("✅ Search bar found")

            # 5) Click and fill the search bar
            search_input = semrush_page.locator('[data-test="searchbar_input"]')
            await search_input.click()
            print("✅ Clicked on search bar")

            await search_input.fill(SEARCH_URL_TO_ENTER)
            print(f"✅ Filled search bar with: {SEARCH_URL_TO_ENTER}")

            # Try to find and click the search button
            try:
                search_button = semrush_page.locator('button[type="submit"], button[data-test*="search"], button:has-text("Search")')
                await search_button.first.click(timeout=3000)
                print("✅ Clicked search button")
            except Exception:
                # Fallback to pressing Enter if no button found
                await search_input.press("Enter")
                print("✅ Pressed Enter to start search")

            # 6) Wait for results to load and extract data
            print("⏳ Waiting for Semrush results to load...")

            # Wait for URL to change (indicates search started)
            try:
                await semrush_page.wait_for_url("**/analytics/overview/**", timeout=15000)
                print("✅ Search results page loaded")
            except Exception:
                print("⚠️ URL didn't change to overview page, continuing anyway...")

            # Wait for the overview data to appear
            await asyncio.sleep(8)  # Wait for dynamic content to fully render

            # Save page HTML for inspection
            print("💾 Saving page HTML for inspection...")
            html_content = await semrush_page.content()
            with open('/home/audry-musk/PROJECTS RENDU/prospect_master/Login/semrush_page.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            print("✅ Page HTML saved to semrush_page.html")

            # Extract all stats from the dashboard
            print("📊 Extracting data from Semrush dashboard...")

            stats = await semrush_page.evaluate("""
                () => {
                    const data = {};

                    // Helper function to find element by text content
                    const findByText = (text) => {
                        return Array.from(document.querySelectorAll('*')).find(el =>
                            el.textContent.trim() === text && el.children.length === 0
                        );
                    };

                    // Extract all numbers that could be metrics
                    const allLinks = Array.from(document.querySelectorAll('a[aria-label]'));

                    // Find Authority Score
                    const asLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('Authority Score'));
                    if (asLink) {
                        const match = asLink.getAttribute('aria-label').match(/Authority Score is (\\d+)/);
                        if (match) {
                            data.authority_score = match[1];
                        }
                        // Look for authority level nearby
                        const parent = asLink.closest('[data-ui-name]');
                        if (parent) {
                            const ellipsis = parent.querySelector('[data-ui-name="Ellipsis"]');
                            if (ellipsis) {
                                data.authority_level = ellipsis.textContent.trim();
                            }
                        }
                    }

                    // Find Organic Traffic
                    const otLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('Organic Traffic'));
                    if (otLink) {
                        const numberSpan = otLink.querySelector('span');
                        if (numberSpan) {
                            data.organic_traffic = numberSpan.textContent.trim();
                        }
                    }

                    // Find Organic Keywords
                    const okLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('Organic Keywords'));
                    if (okLink) {
                        const numberSpan = okLink.querySelector('span');
                        if (numberSpan) {
                            data.organic_keywords = numberSpan.textContent.trim();
                        }
                    }

                    // Find Backlinks
                    const blLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('Backlinks'));
                    if (blLink) {
                        const numberSpan = blLink.querySelector('span');
                        if (numberSpan) {
                            data.backlinks = numberSpan.textContent.trim();
                        }
                    }

                    // Find Referring Domains
                    const rdLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('Ref. Domains') || a.getAttribute('aria-label')?.includes('Referring Domains'));
                    if (rdLink) {
                        const numberSpan = rdLink.querySelector('span');
                        if (numberSpan) {
                            data.referring_domains = numberSpan.textContent.trim();
                        }
                    }

                    // Extract top keywords from tables
                    const topKeywords = [];
                    const tables = document.querySelectorAll('table');
                    tables.forEach(table => {
                        const rows = table.querySelectorAll('tbody tr');
                        rows.forEach((row, index) => {
                            if (index < 5 && topKeywords.length < 5) {
                                const cells = row.querySelectorAll('td');
                                if (cells.length >= 2) {
                                    const firstCell = cells[0]?.textContent.trim();
                                    // Check if it looks like a keyword (not a number)
                                    if (firstCell && isNaN(firstCell)) {
                                        const volume = cells[1]?.textContent.trim() || 'N/A';
                                        topKeywords.push({
                                            keyword: firstCell,
                                            volume: volume,
                                            position: cells[2]?.textContent.trim() || 'N/A'
                                        });
                                    }
                                }
                            }
                        });
                    });

                    if (topKeywords.length > 0) {
                        data.top_keywords = topKeywords;
                    }

                    return data;
                }
            """)

            # Display extracted data
            print("\n" + "="*60)
            print(f"📈 SEMRUSH DATA FOR: {SEARCH_URL_TO_ENTER}")
            print("="*60)

            if stats.get('authority_score'):
                print(f"\n🎯 Authority Score: {stats['authority_score']}", end="")
                if stats.get('authority_level'):
                    print(f" ({stats['authority_level']})")
                else:
                    print()

            if stats.get('organic_traffic'):
                print(f"📊 Organic Traffic: {stats['organic_traffic']}")

            if stats.get('organic_keywords'):
                print(f"🔑 Organic Keywords: {stats['organic_keywords']}")

            if stats.get('backlinks'):
                print(f"🔗 Backlinks: {stats['backlinks']}")

            if stats.get('referring_domains'):
                print(f"🌐 Referring Domains: {stats['referring_domains']}")

            if stats.get('top_keywords'):
                print(f"\n📋 Top Keywords:")
                for i, kw in enumerate(stats['top_keywords'], 1):
                    print(f"   {i}. {kw['keyword']}")
                    print(f"      Volume: {kw['volume']} | Position: {kw['position']}")

            print("\n" + "="*60 + "\n")

            print("🚀 Script finished; Semrush tab left open for manual action.")
            # Keep the browser open for manual interaction
            await asyncio.get_event_loop().create_future()

        except Exception as err:
            print("💥 Critical error:", err)
            raise


if __name__ == "__main__":
    try:
        asyncio.run(login_to_rankerfox())
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user, exiting.")
    except Exception as e:
        print("💥 Script failed:", e)