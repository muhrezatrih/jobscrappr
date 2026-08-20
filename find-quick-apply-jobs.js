const { chromium } = require('playwright');

async function findQuickApply() {
  const targetDir = '/tmp/jobstreet-real-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    headless: true,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  const searchUrls = [
    'https://id.jobstreet.com/id/job-search/backend-developer-jobs',
    'https://id.jobstreet.com/id/job-search/golang-developer-jobs',
    'https://id.jobstreet.com/id/job-search/nodejs-developer-jobs',
    'https://id.jobstreet.com/id/job-search/python-backend-jobs',
    'https://id.jobstreet.com/id/job-search/software-engineer-backend-jobs',
  ];

  const quickApplyJobs = [];

  for (const sUrl of searchUrls) {
    console.log(`Searching: ${sUrl}...`);
    await page.goto(sUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(3000);

    const jobLinks = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('article[data-card-type="JobCard"]'));
      return cards.map(c => {
        const titleEl = c.querySelector('a[data-automation="jobTitle"]');
        const compEl = c.querySelector('a[data-automation="jobCompany"]');
        const locEl = c.querySelector('a[data-automation="jobLocation"]');
        const quickBadge = c.innerText.includes('Lamar Cepat') || c.innerText.includes('Quick apply');
        return {
          title: titleEl ? titleEl.innerText.trim() : '',
          company: compEl ? compEl.innerText.trim() : '',
          location: locEl ? locEl.innerText.trim() : '',
          url: titleEl ? titleEl.href : '',
          isQuickBadge: quickBadge,
        };
      }).filter(j => j.title && j.url);
    });

    console.log(`Found ${jobLinks.length} job cards.`);

    // Check each job detail
    for (const job of jobLinks.slice(0, 8)) {
      await page.goto(job.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(2000);

      const applyInfo = await page.evaluate(() => {
        const btn = document.querySelector('a[data-automation="job-detail-apply"]') || document.querySelector('button[data-automation="job-detail-apply"]');
        if (!btn) return { exists: false };
        const href = btn.getAttribute('href') || '';
        const text = btn.innerText.trim();
        const isExternal = href.includes('/apply/external') || href.startsWith('http') && !href.includes('jobstreet');
        return {
          exists: true,
          href,
          text,
          isExternal,
          dataAutomation: btn.getAttribute('data-automation'),
        };
      });

      console.log(`Job: "${job.title}" (${job.company}) -> Apply Type:`, applyInfo);

      if (applyInfo.exists && !applyInfo.isExternal) {
        quickApplyJobs.push({
          ...job,
          applyInfo,
        });
        console.log(`🎯 FOUND DIRECT JOBSTREET APPLY JOB: "${job.title}" at ${job.company}`);
      }

      if (quickApplyJobs.length >= 3) break;
    }

    if (quickApplyJobs.length >= 3) break;
  }

  console.log('\n--- Direct On-site Jobstreet Apply Candidates ---');
  console.log(JSON.stringify(quickApplyJobs, null, 2));

  await context.close();
}

findQuickApply().catch(console.error);
