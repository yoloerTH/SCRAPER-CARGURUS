# 🚗 CarGurus Stealth Scraper

Advanced Apify Actor for scraping CarGurus.ca with maximum stealth and network interception.

## 🎯 Features

### **Advanced Anti-Detection**
- ✅ **Playwright-Extra + Stealth Plugin** - Removes automation fingerprints
- ✅ **Network Interception** - Captures API responses with car data
- ✅ **Realistic Browser Fingerprints** - Toronto timezone, Canadian locale
- ✅ **Human Behavior Simulation** - Random mouse movements, delays
- ✅ **Residential Proxies** - Canadian IPs only

### **Data Extraction**
- ✅ VIN (17-digit vehicle identification number)
- ✅ Title, Year, Make, Model, Trim
- ✅ Price (CAD)
- ✅ Mileage (KM)
- ✅ Dealer Name & City
- ✅ Deal Rating
- ✅ Body Type
- ✅ Direct listing URL

### **Network Interception (SECRET WEAPON)**
Captures real API responses from CarGurus backend:
- Intercepts XHR/Fetch calls
- Saves raw JSON data
- Bypasses DOM scraping limitations

## 📦 Installation

### Option 1: Deploy to Apify from GitHub

1. **Push to GitHub**:
```bash
cd custom-actor
git init
git add .
git commit -m "Initial commit - CarGurus Stealth Scraper"
git remote add origin https://github.com/YOUR_USERNAME/cargurus-stealth-scraper.git
git push -u origin main
```

2. **Link to Apify**:
   - Go to Apify Console → Actors
   - Click "Create new" → "From GitHub"
   - Enter your repo URL
   - Apify will build automatically

### Option 2: Upload Directly to Apify

1. Zip the `custom-actor` folder
2. Go to Apify Console → Actors → Create new
3. Upload the ZIP file

## 🚀 Usage

### Basic Input

```json
{
  "startUrls": [
    {
      "url": "https://www.cargurus.ca/Cars/l-Used-SUV-Crossover-bg7"
    }
  ],
  "maxConcurrency": 1,
  "maxResults": 10,
  "proxyConfiguration": {
    "useApifyProxy": true,
    "apifyProxyGroups": ["RESIDENTIAL"],
    "apifyProxyCountry": "CA"
  }
}
```

### Advanced Input (Multiple URLs)

```json
{
  "startUrls": [
    {
      "url": "https://www.cargurus.ca/Cars/l-Used-SUV-Crossover-bg7"
    },
    {
      "url": "https://www.cargurus.ca/Cars/l-Used-Pickup-Truck-bg5"
    }
  ],
  "maxConcurrency": 1,
  "maxResults": 50
}
```

## 📊 Output

### Car Listing Example

```json
{
  "type": "car_listing",
  "vin": "1FTEW1E55MFA12345",
  "title": "2021 Ford F-150 Lariat",
  "price": 54900,
  "priceString": "$54,900",
  "year": 2021,
  "make": "Ford",
  "model": "F-150",
  "trim": "Lariat",
  "mileage": 86000,
  "dealerName": "AutoNation Ford",
  "dealerCity": "Toronto",
  "dealRating": "GOOD DEAL",
  "bodyType": "Pickup Truck",
  "url": "https://www.cargurus.ca/Cars/...",
  "scrapedAt": "2025-01-08T20:00:00.000Z"
}
```

### API Response Example (Bonus Data!)

```json
{
  "type": "api_response",
  "url": "https://www.cargurus.ca/api/...",
  "data": {
    "listings": [...],
    "totalResults": 1234
  },
  "timestamp": "2025-01-08T20:00:00.000Z"
}
```

## 🔧 Configuration

### Proxy Settings (REQUIRED)

**Always use RESIDENTIAL proxies** for best results:
```json
{
  "useApifyProxy": true,
  "apifyProxyGroups": ["RESIDENTIAL"],
  "apifyProxyCountry": "CA"
}
```

### Performance Tuning

- **`maxConcurrency: 1`** - Safer, more stealthy (recommended)
- **`maxConcurrency: 2-3`** - Faster, but higher detection risk
- **`maxResults`** - Limit total cars scraped

## 🕵️ How It Works

1. **Launches Chrome with Stealth Plugin**
   - Removes `navigator.webdriver`
   - Spoofs browser fingerprints
   - Adds realistic headers

2. **Network Interception**
   - Listens for API calls
   - Captures JSON responses
   - Saves raw data

3. **Simulates Human Behavior**
   - Random mouse movements
   - Smooth scrolling
   - Variable delays

4. **Extracts Car Data**
   - From `window.__PREFLIGHT__` object
   - From intercepted API responses
   - From DOM as fallback

## 🐛 Troubleshooting

### "No data found"
- Check if proxies are enabled
- Try reducing `maxConcurrency` to 1
- Increase timeouts in code

### "Navigation timeout"
- CarGurus might be blocking
- Check proxy settings
- Add longer delays

### "VIN not found"
- Some listings don't show VINs publicly
- Check `api_response` type data for raw info

## 📈 Best Practices

1. ✅ **Always use Residential proxies**
2. ✅ **Keep maxConcurrency = 1** for maximum stealth
3. ✅ **Add random delays** between runs
4. ✅ **Monitor API responses** - they contain rich data
5. ✅ **Don't scrape too fast** - respect rate limits

## 🔄 Integration with n8n

Export dataset as JSON and send to n8n webhook:

```javascript
// In n8n, use HTTP Request node
GET https://api.apify.com/v2/datasets/{DATASET_ID}/items
```

## 📝 License

MIT

## 🆘 Support

If the scraper gets blocked:
1. Check proxy configuration
2. Increase delays in `main.js`
3. Reduce concurrency to 1
4. Contact Apify support for help with detection
