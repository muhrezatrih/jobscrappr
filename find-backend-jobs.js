const { chromium } = require('playwright');

async function findJobs() {
  const targetDir = '/tmp/jobstreet-chrome-session';
  const context = await chromium.launchPersistentContext(targetDir, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  console.log('Navigating to Jobstreet backend developer search...');
  await page.goto('https://id.jobstreet.com/id/job-search/backend-developer-jobs?sortmode=ListedDate', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });

  await page.waitForTimeout(3000);

  // Extract job cards
  const jobs = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article[data-card-type="JobCard"]'));
    return articles.slice(0, 10).map((art) => {
      const titleEl = art.querySelector('a[data-automation="jobTitle"]');
      const companyEl = art.querySelector('a[data-automation="jobCompany"]');
      const locationEl = art.querySelector('a[data-automation="jobLocation"]');
      const salaryEl = art.querySelector('span[data-automation="jobSalary"]');
      const applyBtn = art.querySelector('button, a[data-automation="jobTitle"]');
      return {
        title: titleEl ? titleEl.innerText.trim() : '',
        company: companyEl ? companyEl.innerText.trim() : '',
        location: locationEl ? locationEl.innerText.trim() : '',
        salary: salaryEl ? salaryEl.innerText.trim() : '',
        url: titleEl ? titleEl.href : '',
      };
    });
  });

  console.log(`Found ${jobs.length} jobs on first page:`);
  console.log(JSON.stringify(jobs, null, 2));

  await page.screenshot({ path: '/tmp/jobstreet_search_results.png' });
  await context.close();
}

findJobs().catch(console.error);
