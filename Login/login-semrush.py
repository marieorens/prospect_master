"""
Playwright-based Python script - MANUAL ASSISTED MODE
You log into RankerFox manually, then the script automates Semrush data extraction.

Install:
    pip install playwright
    python -m playwright install msedge

How it works:
1. Script opens browser
2. YOU manually log into RankerFox
3. YOU manually click the Semrush button
4. Script automatically extracts all data from Semrush
"""

import asyncio
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError
import json
from datetime import datetime

SEARCH_URL_TO_ENTER = "https://makers-agency.com/"


async def manual_assisted_semrush():
    print("▶️ Starting Playwright in MANUAL ASSISTED mode...")
    print("=" * 60)
    print("📋 INSTRUCTIONS:")
    print("1. The browser will open")
    print("2. YOU will manually log into RankerFox")
    print("3. YOU will manually click the Semrush button")
    print("4. The script will take over and extract data automatically")
    print("=" * 60)

    async with async_playwright() as p:
        # Launch Microsoft Edge browser
        print("\n⏳ Launching Microsoft Edge...")
        browser = await p.chromium.launch(
            channel="msedge",
            headless=False,
            args=["--start-maximized"]
        )
        print("✅ Browser launched successfully.")

        # Create context
        context = await browser.new_context(
            no_viewport=True,
            user_agent='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            locale='fr-FR',
            timezone_id='Europe/Paris'
        )
        page = await context.new_page()

        try:
            # Step 1: Navigate to RankerFox
            print("\n⏳ Opening RankerFox login page...")
            await page.goto("https://rankerfox.com/login", timeout=60000)
            print("✅ RankerFox page opened")

            # Step 2: Wait for user to log in manually
            print("\n" + "="*60)
            print("👤 MANUAL STEP 1: Please log into RankerFox now")
            print("   Press Enter in the terminal when you're logged in...")
            print("="*60)
            input()  # Wait for user to press Enter

            # Step 3: Wait for user to click Semrush button
            print("\n" + "="*60)
            print("🔘 MANUAL STEP 2: Please click the 'Semrush' button")
            print("   The script will detect when Semrush opens...")
            print("="*60)

            # Wait for new Semrush page to open
            print("\n⏳ Waiting for Semrush page to open...")
            async with context.expect_page(timeout=120000) as new_page_info:
                pass  # Just wait for the page event

            semrush_page = await new_page_info.value
            print(f"✅ Semrush page detected: {semrush_page.url}")

            # Wait for page to load
            await semrush_page.wait_for_load_state("domcontentloaded", timeout=30000)
            await asyncio.sleep(3)
            print("✅ Semrush page loaded")

            # Step 4: AUTOMATION STARTS HERE
            print("\n" + "="*60)
            print("🤖 AUTOMATION STARTING - No more manual steps!")
            print("="*60)

            # Wait for search bar
            print("\n⏳ Waiting for Semrush search bar...")
            await semrush_page.wait_for_selector('[data-test="searchbar_input"]', timeout=15000)
            print("✅ Search bar found")

            # Fill and submit search
            search_input = semrush_page.locator('[data-test="searchbar_input"]')
            await search_input.click()
            print("✅ Clicked on search bar")

            # Clear any existing content first
            await search_input.clear()
            await semrush_page.wait_for_timeout(500)
            
            await search_input.fill(SEARCH_URL_TO_ENTER)
            print(f"✅ Filled search bar with: {SEARCH_URL_TO_ENTER}")
            
            # Wait a bit for the UI to update
            await semrush_page.wait_for_timeout(1000)

            # Try to find and click the search button
            print("⏳ Looking for search button...")
            search_clicked = False

            # Try multiple selectors for the search button
            selectors_to_try = [
                'button[data-test="searchbar_search_submit"]',  # Most specific
                'button[type="submit"]',
                'button[aria-label*="Search"]',
                'button:has-text("Search")',
            ]

            for selector in selectors_to_try:
                try:
                    button = semrush_page.locator(selector).first
                    if await button.is_visible(timeout=2000):
                        # Try clicking with force to ensure it works
                        await button.click(force=True)
                        print(f"✅ Clicked search button using selector: {selector}")
                        search_clicked = True
                        await semrush_page.wait_for_timeout(500)
                        break
                except Exception as e:
                    continue

            # Fallback to pressing Enter if button click didn't work
            if not search_clicked:
                print("⚠️ Search button not found, using Enter key instead...")
                await search_input.press("Enter")
                print("✅ Pressed Enter to start search")


            # Wait for results to load
            print("\n⏳ Waiting for Semrush results to load...")
            try:
                await semrush_page.wait_for_url("**/analytics/overview/**", timeout=15000)
                print("✅ Search results page loaded")
            except Exception:
                print("⚠️ URL didn't change to overview page, continuing anyway...")

            # Wait for data to actually appear on the page
            print("⏳ Waiting for data to load (this may take 15-30 seconds)...")

            # Wait for Authority Score link to appear (indicates data is loaded)
            try:
                await semrush_page.wait_for_selector('a[aria-label*="Authority Score"]', timeout=30000)
                print("✅ Authority Score detected - data is loading...")
            except Exception:
                print("⚠️ Authority Score not found, but continuing...")

            # Extra wait to ensure all dynamic content is fully loaded
            print("⏳ Waiting for all metrics to load...")
            await asyncio.sleep(15)  # Increased from 8 to 15 seconds

            # Save HTML for inspection
            print("\n💾 Saving page HTML for inspection...")
            html_content = await semrush_page.content()
            with open('/home/audry-musk/PROJECTS RENDU/prospect_master/Login/semrush_page.html', 'w', encoding='utf-8') as f:
                f.write(html_content)
            print("✅ Page HTML saved to semrush_page.html")

            # Extract data
            print("\n📊 Extracting data from Semrush dashboard...")

            stats = await semrush_page.evaluate("""
                () => {
                    const data = {};

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

                    // Find Paid Traffic (NEW)
                    const ptLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('Paid Traffic'));
                    if (ptLink) {
                        const numberSpan = ptLink.querySelector('span');
                        if (numberSpan) {
                            data.paid_traffic = numberSpan.textContent.trim();
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

                    // Find Paid Keywords (NEW)
                    const pkLink = allLinks.find(a => a.getAttribute('aria-label')?.includes('paid keywords'));
                    if (pkLink) {
                        const numberSpan = pkLink.querySelector('span');
                        if (numberSpan) {
                            data.paid_keywords = numberSpan.textContent.trim();
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

                    // === NEW: AI Search Data ===
                    
                    // AI Visibility
                    const aiVisibilityElement = document.querySelector('[data-at="ai-chart-value"]');
                    if (aiVisibilityElement) {
                        data.ai_visibility = aiVisibilityElement.textContent.trim();
                    }

                    // AI Mentions
                    const aiMentionsElement = document.querySelector('[data-at="ai-mentions-value"]');
                    if (aiMentionsElement) {
                        data.ai_mentions = aiMentionsElement.textContent.trim();
                    }

                    // AI Cited Pages
                    const aiCitedPagesElement = document.querySelector('[data-at="ai-cited-pages-value"]');
                    if (aiCitedPagesElement) {
                        data.ai_cited_pages = aiCitedPagesElement.textContent.trim();
                    }

                    // === NEW: Top Cited Sources ===
                    const topCitedSources = [];
                    const citedSourcesTable = document.querySelector('[data-at="do-top-cited-sources"]');
                    if (citedSourcesTable) {
                        const sourceRows = citedSourcesTable.querySelectorAll('[data-ui-name="Body.Row"]');
                        sourceRows.forEach(row => {
                            const cells = row.querySelectorAll('[data-ui-name="Row.Cell"]');
                            if (cells.length >= 2) {
                                topCitedSources.push({
                                    domain: cells[0].textContent.trim(),
                                    mentions: cells[1].textContent.trim()
                                });
                            }
                        });
                    }
                    if (topCitedSources.length > 0) {
                        data.top_cited_sources = topCitedSources;
                    }

                    // === NEW: Country Distribution ===
                    const countries = [];
                    const countryTable = document.querySelector('[data-at="country-distribution-table"]');
                    if (countryTable) {
                        const countryRows = countryTable.querySelectorAll('[data-ui-name="Body.Row"]');
                        countryRows.forEach(row => {
                            const cells = row.querySelectorAll('[data-ui-name="Row.Cell"]');
                            if (cells.length >= 3) {
                                countries.push({
                                    country: cells[0].textContent.trim(),
                                    visibility: cells[1].textContent.trim(),
                                    mentions: cells[2].textContent.trim()
                                });
                            }
                        });
                    }
                    if (countries.length > 0) {
                        data.countries = countries;
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

            # === SEO Metrics ===
            print("\n🔍 SEO METRICS:")
            if stats.get('authority_score'):
                print(f"  🎯 Authority Score: {stats['authority_score']}", end="")
                if stats.get('authority_level'):
                    print(f" ({stats['authority_level']})")
                else:
                    print()

            if stats.get('organic_traffic'):
                print(f"  📊 Organic Traffic: {stats['organic_traffic']}")
            
            if stats.get('paid_traffic'):
                print(f"  💰 Paid Traffic: {stats['paid_traffic']}")

            if stats.get('organic_keywords'):
                print(f"  🔑 Organic Keywords: {stats['organic_keywords']}")
            
            if stats.get('paid_keywords'):
                print(f"  💳 Paid Keywords: {stats['paid_keywords']}")

            if stats.get('backlinks'):
                print(f"  🔗 Backlinks: {stats['backlinks']}")

            if stats.get('referring_domains'):
                print(f"  🌐 Referring Domains: {stats['referring_domains']}")

            # === AI Search Data ===
            if stats.get('ai_visibility') or stats.get('ai_mentions') or stats.get('ai_cited_pages'):
                print("\n🤖 AI SEARCH DATA:")
                if stats.get('ai_visibility'):
                    print(f"  ✨ AI Visibility: {stats['ai_visibility']}")
                if stats.get('ai_mentions'):
                    print(f"  💬 AI Mentions: {stats['ai_mentions']}")
                if stats.get('ai_cited_pages'):
                    print(f"  📄 AI Cited Pages: {stats['ai_cited_pages']}")

            # === Top Cited Sources ===
            if stats.get('top_cited_sources'):
                print(f"\n📌 TOP CITED SOURCES:")
                for i, source in enumerate(stats['top_cited_sources'], 1):
                    print(f"  {i}. {source['domain']} - {source['mentions']} mention(s)")

            # === Country Distribution ===
            if stats.get('countries'):
                print(f"\n🌍 COUNTRY DISTRIBUTION:")
                for country in stats['countries'][:5]:  # Show top 5 countries
                    print(f"  {country['country']}: Visibility={country['visibility']}, Mentions={country['mentions']}")

            # === Top Keywords ===
            if stats.get('top_keywords'):
                print(f"\n📋 TOP KEYWORDS:")
                for i, kw in enumerate(stats['top_keywords'], 1):
                    print(f"  {i}. {kw['keyword']}")
                    print(f"     Volume: {kw['volume']} | Position: {kw['position']}")

            print("\n" + "="*60 + "\n")

            # Save data to JSON file
            print("💾 Saving data to JSON file...")
            json_filename = f'/home/audry-musk/PROJECTS RENDU/prospect_master/Login/semrush_data_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            json_data = {
                'url': SEARCH_URL_TO_ENTER,
                'extraction_date': datetime.now().isoformat(),
                'data': stats
            }
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
            print(f"✅ Data saved to: {json_filename}")

            print("\n✅ Data extraction complete!")
            print("🚀 Browser left open for manual inspection.")
            print("   Press Ctrl+C to close and exit.")

            # Keep the browser open for manual interaction
            await asyncio.get_event_loop().create_future()

        except KeyboardInterrupt:
            print("\n\n🛑 Interrupted by user, closing...")
        except Exception as err:
            print(f"\n💥 Critical error: {err}")
            import traceback
            traceback.print_exc()
        finally:
            print("\n👋 Goodbye!")


if __name__ == "__main__":
    try:
        asyncio.run(manual_assisted_semrush())
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user, exiting.")
    except Exception as e:
        print(f"💥 Script failed: {e}")
