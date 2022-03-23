const puppeteer = require('puppeteer');
const fs = require('fs');

const urlToCrawl = 'https://sachtienganhhn.net/audio-stream/cambridge-global-english-4-audio-cd-2.html';
const downloadFolder = `.\\audio\\${urlToCrawl.split('/').pop()}`;
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

(async () => {
    console.log(`let the fun begin: ${new Date()}`)
    const browser = await puppeteer.launch({
        headless: true,
        devtools: false,
    });
    const page = await browser.newPage();
    await page.goto(urlToCrawl, { waitUntil: 'networkidle2' });
    await page.evaluate(() => {
        document.getElementById("ShareoneDrive").scrollIntoView();
    });
    const crawlAudioPromise = new Promise((resolve) => {
        console.log("Waiting for responses...")
        page.on('response', async (response) => {
            const request = response.request();
            const requestBody = request.postData();
            if (!requestBody) {
                return;
            }

            if (requestBody.indexOf("action=shareonedrive-get-playlist") >= 0) {
                const fileInfos = (await response.json());
                // const fileInfos = (await response.json()).slice(0, 1);

                for (let i = 0; i < fileInfos.length; i++) {
                    const fileInfo = fileInfos[i];
                    const fileIndex = `[${i + 1}/${fileInfos.length}]`;
                    console.log(`Downloading ${fileIndex}`);
                    const bufferString = await downloadAsBinaryString(page, fileInfo);
                    console.log("Begin writing to local directory...")
                    writeFileSync(`${downloadFolder}\\${fileInfo.title}.mp3`, bufferString);
                    console.log(`Finish writing file ${fileIndex}to local directory...`);
                    console.log("======================================");
                }

                console.log(`Download completed. `)
                resolve();
            }
        });
    });

    // await page.waitFor(10000);
    await crawlAudioPromise;
    console.log("closing browser")
    await browser.close();
})();

async function downloadAsBinaryString(page, fileInfo) {
    const bufferString = await page.evaluate(async (fileUrl) => {
        const fileResponse = await fetch(fileUrl);
        const blob = await fileResponse.blob();
        const reader = new FileReader();
        reader.readAsBinaryString(blob);
        return new Promise(async resolve => {
            reader.onload = () => resolve(reader.result);
        });
    }, fileInfo.source);

    return bufferString;
}

function writeFileSync(fileName, bufferString) {
    const buffer = Buffer.from(bufferString, 'binary');
    fs.writeFileSync(fileName, buffer);
}
