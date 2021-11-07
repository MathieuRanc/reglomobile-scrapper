require('dotenv').config();
const puppeteer = require('puppeteer');

function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

toto = async () => {
	console.log('Scrapping en cours..');
	// set some options, set headless to false so we can see the browser in action
	// use headless to true to hide the browser
	let launchOptions = { headless: false };
	// let launchOptions = { headless: true, args: ['--fast-start', '--disable-extensions', '--no-sandbox'] };

	// launch the browser with above options
	const browser = await puppeteer.launch(launchOptions);
	const page = await browser.newPage();

	// set viewport and user agent (just in case for nice viewing)
	await page.setViewport({ width: 1366, height: 768 });
	await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');

	// go to login page
	await page.goto('https://www.reglomobile.fr/');

	// reject cookies 🍪
	await page.waitForSelector('#onetrust-reject-all-handler');
	await page.click('#onetrust-reject-all-handler');

	// show login
	await page.hover('.utilisateurMainHeader span');

	// fill login
	await page.evaluate((val) => (document.querySelector('#ascHeader_blpConnexionNav_sidIdClient').value = val), process.env.USERNAME);

	// wait for login update
	await delay(1000);
	// validate login
	await page.waitForSelector('#ascHeader_blpConnexionNav_btnValider');
	await page.click('#ascHeader_blpConnexionNav_btnValider');

	await page.waitForNavigation();

	// reject cookies 🍪
	await page.waitForSelector('#onetrust-reject-all-handler');
	await page.click('#onetrust-reject-all-handler');

	// set password
	await page.evaluate((val) => (document.querySelector('#cphMain_blcConnexion_stxMdpConnexion').value = val), process.env.PASSWORD);

	// wait for update
	await delay(1000);
	// login
	await page.waitForSelector('#cphMain_blcConnexion_btnValider');
	await page.click('#cphMain_blcConnexion_btnValider');

	await page.waitForNavigation();

	// go to consomation page
	await page.waitForSelector('#cphMain_aliLignesClient_ctl00_btnSuiviConsommation');
	await page.click('#cphMain_aliLignesClient_ctl00_btnSuiviConsommation');

	await page.waitForNavigation();
	await delay(1000);

	// include SMS informations
	await page.waitForSelector('#cphMain_bpiReleveConsommation_cblReleveConsommation_chkSmsReleveConsommation');
	await page.click('#cphMain_bpiReleveConsommation_cblReleveConsommation_chkSmsReleveConsommation');

	// include Data informations
	await page.waitForSelector('#cphMain_bpiReleveConsommation_cblReleveConsommation_chkDataReleveConsommation');
	await page.click('#cphMain_bpiReleveConsommation_cblReleveConsommation_chkDataReleveConsommation');

	// select previous month
	await page.waitForSelector('#cphMain_bpiReleveConsommation_smrPeriodeReleveConso_ddlPeriodeReleveConso option:nth-child(1)');
	await page.evaluate(() => {
		document.querySelector('#cphMain_bpiReleveConsommation_smrPeriodeReleveConso_ddlPeriodeReleveConso option:nth-child(1)').selected = true;
	});

	// wait for update
	await delay(1000);
	// generate pdf
	await page.waitForSelector('#cphMain_bpiReleveConsommation_btnValider');
	await page.click('#cphMain_bpiReleveConsommation_btnValider');

	// wait for pdf
	await page.waitForSelector('#objetiPdf');
	// select pdf
	const elementHandle = await page.$('#objetiPdf');
	const frame = await elementHandle.contentFrame();

	// select consomation informations
	await frame.waitForSelector('#pageContainer1 div.textLayer div:nth-child(90)');

	// const linkHandlers = await frame.$x("//div[contains(text(), 'ko')]");
	const linkHandlers = await frame.$x("//div[contains(text(), 'ko')] | //div[contains(text(), 'Go')]");

	// let value = linkHandlers.map((el) => el.evaluate((name) => name.innerText));

	let value = [];
	linkHandlers.forEach(async (el) => {
		let text = await el.evaluate((name) => name.innerText);
		if (text.length < 10) value.push(text);
	});

	// close the browser
	await browser.close();

	console.log('Donnée récupérée');
	return value;
};

(async () => {
	let passed = false;
	while (!passed) {
		try {
			console.log(await toto());
			passed = true;
		} catch (error) {
			console.log(error.message);
		}
	}
})();
