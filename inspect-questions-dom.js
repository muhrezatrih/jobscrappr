const { chromium } = require('playwright');

async function inspectQuestions() {
  const targetDir = '/tmp/jobstreet-final-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  const applyUrl = 'https://id.jobstreet.com/id/job/93798194/apply/role-requirements';
  await page.goto(applyUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const elements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('select, [role="combobox"], [data-automation*="select"], [data-automation*="question"], fieldset, input, button'));
    return all.map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      id: el.getAttribute('id'),
      name: el.getAttribute('name'),
      dataAutomation: el.getAttribute('data-automation'),
      role: el.getAttribute('role'),
      options: el.tagName === 'SELECT' ? Array.from(el.options).map(o => ({ value: o.value, text: o.text })) : undefined,
      text: (el.innerText || '').trim().slice(0, 100),
    })).filter(x => x.tag === 'SELECT' || x.role === 'combobox' || x.dataAutomation || x.name);
  });

  console.log('Detected Elements:', JSON.stringify(elements, null, 2));
  await context.close();
}

inspectQuestions().catch(console.error);
