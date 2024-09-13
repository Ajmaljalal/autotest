const test = async () => {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.facebook.com/login/');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="pass"]', 'mypassword');
  await page.click('button[name="login"]');
  const html = await page.content();
  console.log(html);
};

test();