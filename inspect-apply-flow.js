const { chromium } = require('playwright');

async function inspectApply() {
  const targetDir = '/tmp/jobstreet-chrome-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  const applyUrl = 'https://id.jobstreet.com/id/job/94025255/apply';
  console.log(`Navigating to application flow: ${applyUrl}...`);
  await page.goto(applyUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('Current Apply Step URL:', page.url());

  const pageText = await page.textContent('body');
  console.log('Page Title / Heading:', await page.title());

  // Check inputs, textareas, buttons, radio buttons
  const formElements = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select, button'));
    return inputs.map(el => ({
      tag: el.tagName,
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.getAttribute('id'),
      dataAutomation: el.getAttribute('data-automation'),
      placeholder: el.getAttribute('placeholder'),
      text: el.innerText ? el.innerText.trim() : (el.value || ''),
    })).filter(x => x.text || x.name || x.dataAutomation || x.id);
  });

  console.log('Form elements found:', JSON.stringify(formElements, null, 2));

  await page.screenshot({ path: '/tmp/jobstreet_apply_step1.png' });
  await context.close();
}

inspectApply().catch(console.error);
