const { chromium } = require('playwright');

async function inspectJob() {
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
  await page.goto(jobUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const title = await page.textContent('h1[data-automation="job-detail-title"], h1');
  console.log('Title:', title?.trim());

  const applyBtns = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('a, button'));
    return btns
      .filter(b => (b.innerText || '').toLowerCase().includes('lamar') || (b.getAttribute('data-automation') || '').includes('apply') || (b.getAttribute('data-automation') || '').includes('job-detail-apply'))
      .map(b => ({
        tag: b.tagName,
        text: b.innerText.trim(),
        dataAutomation: b.getAttribute('data-automation'),
        href: b.getAttribute('href'),
      }));
  });

  console.log('Apply Buttons detected:', JSON.stringify(applyBtns, null, 2));

  // Extract description
  const description = await page.evaluate(() => {
    const descEl = document.querySelector('div[data-automation="jobAdDetails"]') || document.querySelector('div[data-automation="jobDescription"]');
    return descEl ? descEl.innerText.trim() : '';
  });

  console.log('Job Description Preview:', description.slice(0, 300));
  await page.screenshot({ path: '/tmp/jobstreet_job_detail_94025255.png' });
  await context.close();
}

inspectJob().catch(console.error);
