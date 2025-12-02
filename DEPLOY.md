# 🚀 Deployment Guide

## Quick Start: Deploy to Apify in 5 Minutes

### Step 1: Push to GitHub

```bash
# Navigate to the custom-actor folder
cd C:\Users\User\Downloads\cargurus\custom-actor

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - CarGurus Stealth Scraper"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/cargurus-stealth-scraper.git
git branch -M main
git push -u origin main
```

### Step 2: Link to Apify

1. Go to https://console.apify.com/actors
2. Click **"Create new"**
3. Select **"From GitHub repository"**
4. Enter your GitHub repo URL:
   ```
   https://github.com/YOUR_USERNAME/cargurus-stealth-scraper
   ```
5. Click **"Create"**
6. Apify will automatically build your Actor!

### Step 3: Test Run

1. Once built, click **"Start"**
2. Use this test input:
```json
{
  "startUrls": [
    {
      "url": "https://www.cargurus.ca/Cars/l-Used-SUV-Crossover-bg7"
    }
  ],
  "maxConcurrency": 1,
  "maxResults": 5,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"],
    "apifyProxyCountry": "CA"
  }
}
```
3. Click **"Start"** and watch the logs!

---

## Alternative: Upload Directly to Apify

If you don't want to use GitHub:

1. **Zip the folder**:
   - Right-click on `custom-actor` folder
   - Select "Compress to ZIP file"

2. **Upload to Apify**:
   - Go to Apify Console → Actors
   - Click "Create new" → "Upload ZIP"
   - Upload your ZIP file
   - Apify will build it

---

## 🎯 What Makes This Actor Special?

### 1. **Playwright-Extra Stealth Plugin**
```javascript
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
chromium.use(StealthPlugin());
```
- Removes `navigator.webdriver`
- Spoofs canvas fingerprints
- Evades detection

### 2. **Network Interception** (GAME CHANGER!)
```javascript
context.on('response', async (response) => {
    // Intercepts ALL API calls
    // Captures raw JSON data
    // No DOM scraping needed!
});
```

### 3. **Realistic Browser Config**
```javascript
const context = await browser.newContext({
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    geolocation: { longitude: -79.3832, latitude: 43.6532 }, // Toronto
});
```

---

## 📊 Expected Results

### What You'll Get:

1. **Car Listings** (type: `car_listing`):
   - VIN, title, price, year, make, model
   - Dealer info, mileage, deal rating
   - Direct URL

2. **API Responses** (type: `api_response`):
   - Raw JSON from CarGurus backend
   - May contain additional data not visible on page
   - Useful for debugging

### Success Indicators:

✅ "Intercepted API call" in logs
✅ "hasPreflight: true" in logs
✅ VINs being extracted
✅ Data appearing in Dataset

### Failure Indicators:

❌ "hasPreflight: false" → Bot detected
❌ "VIN: NOT FOUND" → Data not loading
❌ "Navigation timeout" → Proxies issue

---

## 🔧 Troubleshooting

### Issue: Still getting blocked

**Solutions**:
1. Ensure RESIDENTIAL proxies are enabled
2. Reduce `maxConcurrency` to 1
3. Add longer delays in `main.js`:
   ```javascript
   await page.waitForTimeout(10000); // Increase to 10 seconds
   ```

### Issue: No VIN found

**Check**:
1. Look at `api_response` type data
2. Some listings hide VINs until contact
3. Check if `window.__PREFLIGHT__` exists

### Issue: Build fails on Apify

**Common fixes**:
1. Make sure `package.json` has correct dependencies
2. Check Dockerfile syntax
3. Ensure `src/main.js` exists

---

## 🎉 You're Ready!

Your custom Actor is **100x better** than the generic playwright-scraper because:

1. ✅ **Stealth Plugin** - Bypasses most bot detection
2. ✅ **Network Interception** - Captures API data directly
3. ✅ **Custom Fingerprints** - Looks like real Canadian user
4. ✅ **Human Simulation** - Mouse movements, scrolling
5. ✅ **Full Control** - Modify any behavior you want

**Deploy it now and let's see if it works!** 🚀
