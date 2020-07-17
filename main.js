const puppeteer = require('puppeteer');

(async () => {
    console.log("let the fun begin")
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
    });
    try {
        const page = await browser.newPage();
        await page.goto('https://sachtienganhhanoi.com/audio-cambridge-global-english-1-2-cd-audio/?fbclid=IwAR38gFOMsss2d-5EiCCz940T32s36MD05jBX596Seoy6dkvP1ITaRU3mTrk', { waitUntil: 'networkidle2' });
        await page.waitForSelector("li.wpcp__playlist-selector-list-item", { timeout: 60000 });

        const items = await page.evaluate(() => {
            return document.querySelectorAll("li.wpcp__playlist-selector-list-item");
        });
        console.log("items:", items[0]);
    } catch (e) {
        console.log("oops")
        console.log(e);
    }
    finally {
        console.log("closing browser")
        await browser.close();
    }
})();