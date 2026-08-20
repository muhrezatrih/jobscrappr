const { chromium } = require('playwright');
const fs = require('fs');

async function testIsolated() {
  const targetDir = '/tmp/jobstreet-chrome-session';
  
  // Launch context once to read cookies
  console.log('Extracting authenticated cookies from session clone...');
  const setupContext = await chromium.launchPersistentContext(targetDir, {
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const cookies = await setupContext.cookies();
  const jobstreetCookies = cookies.filter(c => c.domain.includes('jobstreet') || c.domain.includes('seek'));
  console.log(`Extracted ${jobstreetCookies.length} Jobstreet authentication cookies.`);
  fs.writeFileSync('/tmp/jobstreet_cookies.json', JSON.stringify(jobstreetCookies, null, 2));
  await setupContext.close();

  // Now launch clean browser with saved cookies
  console.log('Launching clean browser and injecting cookies...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  });

  await context.addCookies(jobstreetCookies);
  const page = await context.newPage();

  console.log('Navigating to https://id.jobstreet.com/id/my-activity/applied-jobs...');
  await page.goto('https://id.jobstreet.com/id/my-activity/applied-jobs', { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(4000);

  console.log('Current URL:', page.url());
  const bodyText = await page.textContent('body');
  const isLoggedIn = !page.url().includes('/login') && (bodyText.includes('Aktivitas') || bodyText.includes('Dilamar'));
  console.log('Is Logged In with Injected Cookies:', isLoggedIn);

  // Now navigate to Job Detail
  const jobUrl = 'https://id.jobstreet.com/id/job/94025255';
  console.log(`Navigating to Job Detail: ${jobUrl}...`);
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
  await page.waitForTimeout(3000);

  const applyBtn = page.locator('a[data-automation="job-detail-apply"], a:has-text("Daftar"), button:has-text("Lamar")').first();
  console.log('Apply button count:', await applyBtn.count());

  if (await applyBtn.count() > 0) {
    console.log('Clicking Apply button...');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    console.log('URL after Apply click:', page.url());
    console.log('Page Title:', await page.title());

    // Check visible elements
    const elements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select, button, label, h1, h2, h3'));
      return inputs.map(el => ({
        tag: el.tagName,
        type: el.getAttribute('type'),
        id: el.getAttribute('id'),
        dataAutomation: el.getAttribute('data-automation'),
        text: (el.innerText || el.textContent || '').trim().slice(0, 80),
      })).filter(x => x.text || x.dataAutomation || x.id);
    });

    console.log('Form elements on apply modal/page:', JSON.stringify(elements.slice(0, 30), null, 2));
    await page.screenshot({ path: '/tmp/jobstreet_apply_step_clean.png' });
    console.log('Screenshot saved to /tmp/jobstreet_apply_step_clean.png');
  }

  await browser.close();
}

testIsolated().catch(console.error);
