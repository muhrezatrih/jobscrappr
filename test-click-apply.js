const { chromium } = require('playwright');

async function testClickApply() {
  const targetDir = '/tmp/jobstreet-chrome-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  const jobUrl = 'https://id.jobstreet.com/id/job/94025255';
  console.log(`Navigating to ${jobUrl}...`);
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);

  console.log('Finding Apply / Daftar button...');
  const applyBtn = page.locator('a[data-automation="job-detail-apply"], a:has-text("Daftar"), button:has-text("Lamar")').first();
  
  if (await applyBtn.count() > 0) {
    console.log('Clicking Apply button...');
    await applyBtn.click();
    await page.waitForTimeout(4000);

    console.log('Current URL after click:', page.url());
    console.log('Page Title:', await page.title());

    // Check visible elements on the application page/modal
    const elements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select, button, label'));
      return inputs.map(el => ({
        tag: el.tagName,
        type: el.getAttribute('type'),
        id: el.getAttribute('id'),
        dataAutomation: el.getAttribute('data-automation'),
        text: (el.innerText || el.textContent || '').trim().slice(0, 100),
      })).filter(x => x.text || x.dataAutomation || x.id);
    });

    console.log('Interactive form elements on apply page:', JSON.stringify(elements.slice(0, 25), null, 2));

    await page.screenshot({ path: '/tmp/jobstreet_apply_modal_step.png' });
    console.log('Screenshot saved to /tmp/jobstreet_apply_modal_step.png');
  } else {
    console.log('Apply button not found!');
  }

  await context.close();
}

testClickApply().catch(console.error);
