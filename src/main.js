import { Actor } from 'apify';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin
chromium.use(StealthPlugin());

// ============================================
// FILTER AUTOMATION HELPERS
// ============================================

async function applyFilters(page, filters, searchRadius) {
    console.log('🎯 Applying UI filters...');

    // 1. SEARCH RADIUS (Nationwide)
    await setSearchRadius(page, searchRadius);

    // 2. BODY TYPE FILTER (Add Pickup Truck)
    await applyBodyTypeFilter(page, filters.bodyTypes);

    // 3. MAKE & MODEL FILTER (Ford, GMC, Chevrolet, Cadillac)
    if (filters.makes && filters.makes.length > 0) {
        await applyMakeFilter(page, filters.makes);
    }

    // 4. PRICE FILTER (Minimum $35,000)
    await applyPriceFilter(page);

    // 5. DEAL RATING FILTER (Great/Good/Fair) - LAST
    await applyDealRatingFilter(page, filters.dealRatings);

    console.log('✅ All filters applied successfully!');
}

async function setSearchRadius(page, searchRadius) {
    try {
        console.log(`🌍 Setting search radius to: ${searchRadius === 50000 ? 'Nationwide' : searchRadius + ' km'}`);

        // Select the search distance dropdown (6-minute timeout)
        const dropdown = await page.locator('select[data-testid="select-filter-distance"]');
        await dropdown.waitFor({ state: 'visible', timeout: 360000 });

        // Select the value (50000 for Nationwide, or specific km value)
        await dropdown.selectOption(searchRadius.toString(), { timeout: 360000 });

        console.log(`  ✅ Search radius set successfully`);

        // Wait for results to update
        await page.waitForTimeout(2000);

    } catch (error) {
        console.log(`  ⚠️ Search radius error: ${error.message} (continuing...)`);
    }
}

async function applyBodyTypeFilter(page, bodyTypes) {
    try {
        console.log(`🚗 Setting body types: ${bodyTypes.join(', ')}`);

        // Open Body Style accordion (6-minute timeout)
        await page.click('#BodyStyle-accordion-trigger', { timeout: 360000 });
        await page.waitForTimeout(1000);

        // Click checkboxes for each body type
        for (const bodyType of bodyTypes) {
            if (bodyType.includes('Pickup')) {
                // Find and click Pickup Truck checkbox (6-minute timeout)
                await page.click('button[id*="PICKUP"], label:has-text("Pickup Truck")', { timeout: 360000 });
                await page.waitForTimeout(500);
                console.log('  ✅ Added Pickup Truck');
            }
            // SUV/Crossover is already selected by default on the base URL
        }

        await page.waitForTimeout(2000); // Wait for results to update
    } catch (error) {
        console.log(`  ⚠️ Body type filter error: ${error.message} (continuing...)`);
    }
}

async function applyMakeFilter(page, makes) {
    try {
        console.log(`🏭 Setting makes: ${makes.join(', ')}`);

        // Open Make & Model accordion
        await page.click('#MakeAndModel-accordion-trigger', { timeout: 360000 });
        await page.waitForTimeout(1000);

        // Click checkbox for each make (stable approach)
        for (const make of makes) {
            try {
                // Handle special case: RAM needs to be uppercase to match button ID
                const makeId = make.toUpperCase() === 'RAM' ? 'RAM' : make;

                // Click the make button (escape dots in ID selector) with 6-minute timeout
                await page.click(`#FILTER\\.MAKE_MODEL\\.${makeId}`, { timeout: 360000 });
                console.log(`  ✅ Added ${make}`);
                await page.waitForTimeout(500);
            } catch (error) {
                console.log(`  ⚠️ Could not click ${make}: ${error.message}`);
            }
        }

        await page.waitForTimeout(2000); // Wait for results to update
    } catch (error) {
        console.log(`  ⚠️ Make filter error: ${error.message} (continuing...)`);
    }
}

async function applyPriceFilter(page) {
    try {
        console.log(`💰 Setting minimum price to: $35,000 CAD`);

        // Open Price accordion (6-minute timeout)
        await page.click('#Price-accordion-trigger', { timeout: 360000 });
        await page.waitForTimeout(1000);

        // Find the MINIMUM slider specifically (not maximum)
        const minSlider = page.locator('[role="slider"][aria-label="Minimum"]');
        await minSlider.waitFor({ state: 'visible', timeout: 360000 });

        // Click on the minimum slider to focus it
        await minSlider.click({ timeout: 360000 });
        await page.waitForTimeout(500);

        // Set the slider value to 24 (which equals $35,000 CAD)
        // Using keyboard arrow keys: press Home to go to 0, then Right arrow 24 times
        await page.keyboard.press('Home'); // Reset to 0
        await page.waitForTimeout(300);

        // Press Right arrow 24 times to reach position 24 ($35,000)
        for (let i = 0; i < 24; i++) {
            await page.keyboard.press('ArrowRight');
            await page.waitForTimeout(50); // Small delay between presses
        }

        console.log(`  ✅ Minimum price set to $35,000`);
        await page.waitForTimeout(2000); // Wait for results to update

    } catch (error) {
        console.log(`  ⚠️ Price filter error: ${error.message} (continuing...)`);
    }
}

async function applyDealRatingFilter(page, dealRatings) {
    try {
        console.log(`⭐ Setting deal ratings: ${dealRatings.join(', ')}`);

        // Open Deal Rating accordion (6-minute timeout)
        await page.click('#DealRating-accordion-trigger', { timeout: 360000 });
        await page.waitForTimeout(1000);

        // Click checkboxes for each deal rating
        for (const rating of dealRatings) {
            try {
                // Click with 6-minute timeout
                await page.click(`#FILTER\\.DEAL_RATING\\.${rating}`, { timeout: 360000 });
                console.log(`  ✅ Added ${rating.replace('_', ' ')}`);
                await page.waitForTimeout(300);
            } catch (error) {
                console.log(`  ⚠️ Could not click ${rating}: ${error.message}`);
            }
        }

        await page.waitForTimeout(2000); // Wait for results to update
    } catch (error) {
        console.log(`  ⚠️ Deal rating filter error: ${error.message} (continuing...)`);
    }
}

// ============================================
// MAIN SCRAPER
// ============================================

await Actor.main(async () => {
    const input = await Actor.getInput();

    const {
        searchRadius = 50000,
        currentPage = null,
        maxPages = 73,
        maxResults = 24,
        filters = {
            makes: ['Ford', 'GMC', 'Chevrolet', 'Cadillac'],
            bodyTypes: ['SUV / Crossover', 'Pickup Truck'],
            maxMileage: 140000,
            minPrice: 35000,
            dealRatings: ['GREAT_PRICE', 'GOOD_PRICE', 'FAIR_PRICE']
        }
    } = input;

    console.log('🚀 Starting CarGurus Stealth Scraper with UI Filters...');

    // Open persistent Key-Value Store (survives between runs)
    const kv = await Actor.openKeyValueStore('scraper-state');

    // Get or initialize page state with daily reset
    let startPage = currentPage;
    if (!startPage) {
        const state = await kv.getValue('state') || {};
        const today = new Date().toISOString().split('T')[0]; // "2025-11-13"

        // Check if we need to reset (new day or first run)
        if (state.lastScrapedDate === today) {
            // Same day → continue from where we left off
            startPage = state.nextPage || 1;

            // If we've exceeded maxPages, restart from page 1
            if (startPage > maxPages) {
                startPage = 1;
                console.log(`📅 All pages completed! Restarting from page 1 (same day: ${today})`);
            } else {
                console.log(`📅 Continuing from page ${startPage} (same day: ${today})`);
            }
        } else {
            // Different day or first run → reset to page 1
            startPage = 1;
            if (state.lastScrapedDate) {
                console.log(`📅 New day detected! Resetting to page 1 (previous: ${state.lastScrapedDate}, today: ${today})`);
            } else {
                console.log(`📅 First run! Starting from page 1`);
            }
        }
    }

    // Calculate the 3-page batch
    const pagesToScrape = [];
    for (let i = 0; i < 3; i++) {
        const pageNum = startPage + i;
        if (pageNum <= maxPages) {
            pagesToScrape.push(pageNum);
        }
    }

    // Safety check
    if (pagesToScrape.length === 0) {
        console.log(`✅ All pages scraped! (Last page: ${maxPages})`);
        return;
    }

    console.log(`📄 Scraping ${pagesToScrape.length} pages this run: ${pagesToScrape.join(', ')} of ${maxPages} total`);
    console.log(`🌍 Search radius: ${searchRadius === 50000 ? 'Nationwide' : searchRadius + ' km'}`);
    console.log(`📊 Max results per page: ${maxResults}`);

    // Launch browser with stealth
    const browser = await chromium.launch({
        headless: true,
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
        ],
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-CA',
        timezoneId: 'America/Toronto',
        geolocation: { longitude: -79.3832, latitude: 43.6532 },
        permissions: ['geolocation'],
    });

    const page = await context.newPage();

    try {
        // STEP 1: Navigate to base SUV page
        const baseUrl = 'https://www.cargurus.ca/Cars/l-Used-SUV-Crossover-bg7';
        console.log(`\n🌐 Visiting base page: ${baseUrl}`);

        await page.goto(baseUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 90000
        });

        console.log('⏳ Waiting for page to load...');
        await page.waitForTimeout(5000);

        // Simulate human behavior
        console.log('🖱️ Simulating human behavior...');
        await page.mouse.move(100, 200);
        await page.waitForTimeout(500);
        await page.mouse.move(300, 400);
        await page.waitForTimeout(1000);

        // STEP 2: Apply all filters via UI (once for all pages)
        await applyFilters(page, filters, searchRadius);

        // STEP 3: Get the filtered URL with searchId
        await page.waitForTimeout(3000);
        const filteredUrl = page.url();
        const baseUrlWithFilters = filteredUrl.split('#')[0];

        console.log(`✅ Filters applied! Generated URL with searchId`);

        // Track current page (we start at page 1 after applying filters)
        let currentPageNumber = 1;

        // STEP 4-7: Loop through each page in the batch (3 pages)
        for (const pageToScrape of pagesToScrape) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📄 Processing page ${pageToScrape} of ${maxPages}`);
            console.log(`${'='.repeat(60)}\n`);

            // Navigate to specific page if needed by clicking Next button (human-like)
            if (pageToScrape !== currentPageNumber) {
                const clicksNeeded = pageToScrape - currentPageNumber;
                console.log(`🔄 Navigating from page ${currentPageNumber} to page ${pageToScrape} (${clicksNeeded} clicks)...`);

                for (let i = 0; i < clicksNeeded; i++) {
                    try {
                        // Scroll to bottom to make pagination visible
                        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
                        await page.waitForTimeout(800);

                        // Wait for and click the Next button (2-minute timeout)
                        const nextButton = page.locator('button[data-testid="srp-desktop-page-navigation-next-page"]');
                        await nextButton.waitFor({ state: 'visible', timeout: 120000 });
                        await nextButton.click({ timeout: 120000 });

                        console.log(`  ✅ Clicked Next button (${i + 1}/${clicksNeeded})`);

                        // Wait for new page to load
                        await page.waitForTimeout(4000);
                    } catch (error) {
                        console.log(`  ⚠️ Next button click failed: ${error.message}`);
                        // Fallback to hash navigation if Next button fails
                        console.log(`  🔄 Falling back to hash navigation...`);
                        await page.evaluate((pageNum) => {
                            window.location.hash = `resultsPage=${pageNum}`;
                        }, pageToScrape);
                        await page.waitForTimeout(5000);
                        break; // Exit the clicking loop since we used hash navigation
                    }
                }

                // Scroll to top after navigation
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.waitForTimeout(1000);

                // Update current page tracker
                currentPageNumber = pageToScrape;
            }

            // Scroll to load car links
            console.log('📜 Scrolling to load content...');
            for (let i = 0; i < 3; i++) {
                await page.evaluate((offset) => {
                    window.scrollTo({
                        top: offset,
                        behavior: 'smooth'
                    });
                }, (i + 1) * 1000);
                await page.waitForTimeout(2000);
            }

            await page.waitForTimeout(3000);

            // Count available car listings
            const totalListings = await page.evaluate(() => {
                return document.querySelectorAll('a[data-testid="car-blade-link"]').length;
            });

            console.log(`🚗 Found ${totalListings} car listings on page ${pageToScrape}`);

            // Debug if no links found
            if (totalListings === 0) {
                console.log('⚠️ No car listings found - debugging...');
                const currentUrl = page.url();
                const pageTitle = await page.title();
                console.log(`📍 Current URL: ${currentUrl}`);
                console.log(`📄 Page title: ${pageTitle}`);

                await Actor.setValue(`debug-screenshot-page${pageToScrape}.png`, await page.screenshot({ fullPage: false }), { contentType: 'image/png' });
                continue; // Skip to next page
            }

            // Process listings by clicking them (SPA-compatible)
            const listingsToProcess = Math.min(totalListings, maxResults);
            console.log(`📋 Will process ${listingsToProcess} car listings`);

        for (let listingIndex = 0; listingIndex < listingsToProcess; listingIndex++) {
            console.log(`\n🔍 Processing listing ${listingIndex + 1}/${listingsToProcess}...`);

            try {
                // Re-query the listing link by index (DOM may have changed)
                const linkExists = await page.evaluate((index) => {
                    const links = document.querySelectorAll('a[data-testid="car-blade-link"]');
                    return links[index] ? true : false;
                }, listingIndex);

                if (!linkExists) {
                    console.log(`  ⚠️ Listing ${listingIndex + 1} not found in DOM - skipping`);
                    continue;
                }

                // Click the listing to trigger SPA detail view
                await page.evaluate((index) => {
                    const links = document.querySelectorAll('a[data-testid="car-blade-link"]');
                    links[index].click();
                }, listingIndex);

                console.log(`  ✅ Clicked listing ${listingIndex + 1}`);

                // Wait for SPA detail view to load
                try {
                    await page.waitForSelector('div[data-cg-ft="listing-vdp-stats"]', { timeout: 10000 });
                    console.log(`  ✅ Detail view loaded`);
                } catch (e) {
                    console.log(`  ⚠️ Detail view not loaded: ${e.message}`);
                    // Try to go back to search results
                    await page.goBack();
                    await page.waitForTimeout(2000);
                    continue;
                }

                // Small delay to let detail view fully render
                await page.waitForTimeout(2000);

                // Extract data from DOM (SPA detail view)
                const carData = await page.evaluate(() => {
                    const preflight = window.__PREFLIGHT__ || {};
                    const listing = preflight.listing || {};

                        // Extract from new DOM structure first (data-cg-ft attributes)
                        const vinEl = document.querySelector('div[data-cg-ft="vin"] span._value_ujq1z_13');
                        const makeEl = document.querySelector('div[data-cg-ft="make"] span._value_ujq1z_13');
                        const modelEl = document.querySelector('div[data-cg-ft="model"] span._value_ujq1z_13');
                        const trimEl = document.querySelector('div[data-cg-ft="trim"] span._value_ujq1z_13');
                        const yearEl = document.querySelector('div[data-cg-ft="year"] span._value_ujq1z_13');
                        const bodyTypeEl = document.querySelector('div[data-cg-ft="bodyType"] span._value_ujq1z_13');
                        const fuelTypeEl = document.querySelector('div[data-cg-ft="fuelType"] span._value_ujq1z_13');
                        const mileageEl = document.querySelector('div[data-cg-ft="mileage"] span._value_ujq1z_13');

                        let vin = vinEl ? vinEl.textContent.trim() : (listing.vin || null);
                        if (!vin && listing.specs) {
                            const vinSpec = listing.specs.find(s =>
                                s.label && s.label.toLowerCase() === 'vin'
                            );
                            if (vinSpec) vin = vinSpec.value;
                        }

                        // Try to extract fuel type from specs if not in DOM
                        let fuelType = fuelTypeEl ? fuelTypeEl.textContent.trim() : null;
                        if (!fuelType && listing.specs) {
                            const fuelSpec = listing.specs.find(s =>
                                s.label && (
                                    s.label.toLowerCase().includes('fuel') ||
                                    s.label.toLowerCase().includes('engine')
                                )
                            );
                            if (fuelSpec) fuelType = fuelSpec.value;
                        }

                        const titleEl = document.querySelector('h1[data-cg-ft="vdp-listing-title"]');
                        const title = titleEl ? titleEl.textContent.trim() : '';

                        // Extract price
                        const priceEl = document.querySelector('div._price_1yep1_1 h2');
                        const priceText = priceEl ? priceEl.textContent.trim() : null;
                        const priceValue = priceText ? parseInt(priceText.replace(/[$,]/g, '')) : null;

                        // Extract dealer info
                        const dealerNameEl = document.querySelector('[data-testid="dealerName"]');
                        const locationFromTitle = document.querySelector('hgroup p.oqywn.sCSIz');
                        const dealerAddressEl = document.querySelector('[data-testid="dealerAddress"] span[data-track-ui="dealer-address"]');

                        return {
                            vin,
                            title: title || preflight.listingTitle,
                            price: priceValue || preflight.listingPriceValue || listing.price,
                            priceString: priceText || preflight.listingPriceString || listing.priceString,
                            year: yearEl ? yearEl.textContent.trim() : (listing.year || preflight.listingYear),
                            make: makeEl ? makeEl.textContent.trim() : (listing.make || preflight.listingMake),
                            model: modelEl ? modelEl.textContent.trim() : (listing.model || preflight.listingModel),
                            trim: trimEl ? trimEl.textContent.trim() : listing.trim,
                            mileage: mileageEl ? mileageEl.textContent.trim() : (listing.mileage || listing.odometer),
                            dealerName: dealerNameEl ? dealerNameEl.textContent.trim() : (listing.dealerName || preflight.listingSellerName),
                            dealerCity: locationFromTitle ? locationFromTitle.textContent.trim() : (listing.dealerCity || preflight.listingSellerCity),
                            dealerAddress: dealerAddressEl ? dealerAddressEl.textContent.trim() : null,
                            dealRating: listing.dealRating || listing.dealBadge,
                            bodyType: bodyTypeEl ? bodyTypeEl.textContent.trim() : listing.bodyType,
                            fuelType: fuelType,
                            url: window.location.href,
                            source: 'dom',
                            hasApiData: false
                        };
                    });

                // Add page metadata
                carData.pageNumber = pageToScrape;
                carData.searchRadius = searchRadius;

                console.log(`  VIN: ${carData.vin || 'NOT FOUND'}`);
                console.log(`  Title: ${carData.title || 'NOT FOUND'}`);
                console.log(`  Price: ${carData.priceString || carData.price || 'NOT FOUND'}`);
                console.log(`  Year: ${carData.year || 'NOT FOUND'}`);
                console.log(`  Mileage: ${carData.mileageString || carData.mileage || 'NOT FOUND'}`);
                console.log(`  Body Type: ${carData.bodyType || 'NOT FOUND'}`);
                console.log(`  Fuel Type: ${carData.fuelType || 'NOT FOUND'}`);
                console.log(`  Dealer: ${carData.dealerName || 'NOT FOUND'} - ${carData.dealerCity || 'NOT FOUND'}`);
                console.log(`  Source: ${carData.source}`);

                // Save car data
                if (carData.vin || carData.title) {
                    const dataToSave = {
                        type: 'car_listing',
                        ...carData,
                        scrapedAt: new Date().toISOString()
                    };

                    await Actor.pushData(dataToSave);
                    console.log(`  ✅ Saved to dataset`);

                    // Send to webhook
                    try {
                        const webhookUrl = 'https://n8nsaved-production.up.railway.app/webhook/cargurus';
                        const response = await fetch(webhookUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(dataToSave)
                        });

                        if (response.ok) {
                            console.log(`  📤 Sent to webhook (${response.status})`);
                        } else {
                            console.log(`  ⚠️ Webhook failed: ${response.status}`);
                        }
                    } catch (webhookError) {
                        console.log(`  ⚠️ Webhook error: ${webhookError.message}`);
                    }
                } else {
                    console.log(`  ⚠️ No data found - skipping`);
                }

                // Navigate back to search results
                console.log(`  ← Going back to search results...`);
                await page.goBack();

                // Wait for search results to load
                await page.waitForSelector('a[data-testid="car-blade-link"]', { timeout: 10000 });
                console.log(`  ✅ Back to search results`);

                // Random delay between cars
                await page.waitForTimeout(2000 + Math.random() * 3000);

            } catch (error) {
                console.error(`❌ Error processing listing ${listingIndex + 1}:`, error.message);
                // Try to go back to search results if error occurred
                try {
                    await page.goBack();
                    await page.waitForTimeout(2000);
                } catch (backError) {
                    console.error(`  ⚠️ Could not navigate back: ${backError.message}`);
                }
            }
        }

            // Save state after each page completes (more resilient to crashes)
            const nextPage = pageToScrape + 1;
            const today = new Date().toISOString().split('T')[0];

            await kv.setValue('state', {
                nextPage,
                lastScrapedDate: today,
                baseUrl: baseUrlWithFilters,
                searchRadius,
                lastScraped: new Date().toISOString(),
                lastPage: pageToScrape,
                pagesScraped: pagesToScrape.slice(0, pagesToScrape.indexOf(pageToScrape) + 1)
            });

            console.log(`💾 State saved: Page ${pageToScrape} complete. Next run will start at page ${nextPage} (date: ${today})`);

        } // End of page loop

    } catch (error) {
        console.error(`❌ Error processing pages ${pagesToScrape.join(', ')}:`, error.message);
    }

    await browser.close();
    console.log('\n✅ Scraping complete!');
});
