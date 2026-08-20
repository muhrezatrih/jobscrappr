const { chromium } = require('playwright');

async function inspectQuickApply() {
  const targetDir = '/tmp/jobstreet-real-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  const jobUrl = 'https://id.jobstreet.com/id/job/93798194';
  console.log(`Navigating to Job with Lamaran Cepat: ${jobUrl}...`);
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const applyBtn = page.locator('a[data-automation="job-detail-apply"], a:has-text("Lamaran Cepat"), button:has-text("Lamaran Cepat"), a:has-text("Daftar")').first();
  console.log('Apply button count:', await applyBtn.count());

  if (await applyBtn.count() > 0) {
    console.log('Clicking "Lamaran Cepat" Apply button...');
    await applyBtn.click();
    await page.waitForTimeout(5000);

    console.log('URL after Apply click:', page.url());
    console.log('Page Title:', await page.title());

    // Check visible elements on the application page/modal
    const elements = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select, button, label, h1, h2, h3, [role="dialog"], [data-automation]'));
      return inputs.map(el => ({
        tag: el.tagName,
        type: el.getAttribute('type'),
        id: el.getAttribute('id'),
        dataAutomation: el.getAttribute('data-automation'),
        text: (el.innerText || el.textContent || '').trim().slice(0, 100),
      })).filter(x => x.text || x.dataAutomation || x.id);
    });

    console.log('Interactive form elements on apply modal:', JSON.stringify(elements.slice(0, 30), null, 2));

    await page.screenshot({ path: '/tmp/jobstreet_quick_apply_modal.png' });
    console.log('Screenshot saved to /tmp/jobstreet_quick_apply_modal.png');
  }

  await context.close();
}

inspectQuickApply().catch(console.error);
