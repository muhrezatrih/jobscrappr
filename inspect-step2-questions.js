const { chromium } = require('playwright');

async function inspectStep2() {
  const targetDir = '/tmp/jobstreet-final-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    headless: false,
    viewport: { width: 1280, height: 950 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://id.jobstreet.com/id/job/93798194', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click Lamaran Cepat
  const applyBtn = page.locator('a[data-automation="job-detail-apply"], a:has-text("Lamaran Cepat"), button:has-text("Lamaran Cepat")').first();
  await applyBtn.click();
  await page.waitForTimeout(3000);

  // Step 1 -> Click Lanjut
  const lanjut1 = page.locator('button').filter({ hasText: /^Lanjut/ }).first();
  await lanjut1.click({ force: true });
  await page.waitForTimeout(3000);

  console.log('Now on Step 2 URL:', page.url());

  // Inspect all selects, comboboxes, buttons, inputs on this page
  const detailedElements = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('select, input, [role="combobox"], [data-automation], label'));
    return items.map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.getAttribute('id'),
      role: el.getAttribute('role'),
      dataAutomation: el.getAttribute('data-automation'),
      options: el.tagName === 'SELECT' ? Array.from(el.options).map(o => ({ value: o.value, text: o.text })) : undefined,
      text: (el.innerText || el.textContent || '').trim().slice(0, 80),
    }));
  });

  console.log('Step 2 Detailed Elements:');
  console.log(JSON.stringify(detailedElements.filter(x => x.tag === 'SELECT' || x.role === 'combobox' || x.type === 'checkbox' || x.name || x.options), null, 2));

  await context.close();
}

inspectStep2().catch(console.error);
