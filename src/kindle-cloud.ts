import * as puppeteer from 'puppeteer-core';
import * as fs from 'fs';

const urlToCrawl = 'https://read.amazon.com/?asin=B0BGQYFBCJ';
const CHROME_EXECUTABLE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const downloadFolder = 'kindle';
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

(async () => {
    console.log(`let the fun begin: ${new Date().toISOString()}`);
    const browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        executablePath: CHROME_EXECUTABLE_PATH,
    });
    const page = await browser.newPage();
    await page.goto(urlToCrawl, { waitUntil: 'networkidle2' });

    console.log('Signing in');
    await page.type('#ap_email', 'mrtrandinhvn@gmail.com', { delay: 100 });
    await page.type('#ap_password', 'Forg3tM3!', { delay: 100 });

    await Promise.all([
        page.waitForNavigation(), // The promise resolves after navigation has finished
        page.click('#signInSubmit'), // Clicking the link will indirectly cause a navigation
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const crawlPromise = new Promise<void>((resolve) => {
        console.log("Waiting for responses...");
        // eslint-disable-next-line @typescript-eslint/require-await
        page.on('response', async (response) => {
            const request = response.request();
            if (isTargetedRequest(request)) {
                const buffer = (await response.buffer());
                const fileName = request.url().split('/').pop() + '.png';
                console.log(`Downloading ${fileName}`);

                // const bufferString = await downloadAsBinaryString(page, fileInfo);
                // console.log("Begin writing to local directory...");
                writeFileSync(`${downloadFolder}\\${fileName}`, buffer);

                console.log(`Finish writing file ${fileName} to local directory...`);
                console.log("======================================");
            }
        });

        const clickNextInterval = setInterval(async () => {
            const nextButtonClicked = await page.evaluate(() => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                const nextButton: HTMLButtonElement = document.querySelector('#kr-chevron-right');
                if (nextButton) {
                    nextButton.click();
                    return true;
                }

                return false;
            });

            if (!nextButtonClicked) {
                clearInterval(clickNextInterval);
            }
        }, 5000);
    });

    await crawlPromise;
    console.log("Closing browser");
    await browser.close();
})().catch((reason: unknown) => {
    console.error(reason);
});

function isTargetedRequest(request: puppeteer.HTTPRequest) {
    return request.url().indexOf('blob:https://read.amazon.com') >= 0;
}

// async function downloadAsBinaryString(page, fileInfo) {
//     const bufferString: string = await page.evaluate(async (fileUrl: string) => {
//         const fileResponse = await fetch(fileUrl);
//         const blob = await fileResponse.blob();
//         const reader = new FileReader();
//         reader.readAsBinaryString(blob);
//         return new Promise(resolve => {
//             reader.onload = () => resolve(reader.result);
//         });
//     }, fileInfo.source);

//     return bufferString;
// }

function writeFileSync(fileName: string, bufferString: ArrayBuffer) {
    const buffer = Buffer.from(bufferString);
    fs.writeFileSync(fileName, buffer);
}
