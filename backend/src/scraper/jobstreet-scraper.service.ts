import { Injectable, Logger } from '@nestjs/common';
import { chromium, Browser } from 'playwright';
import { ScrapedJobItem } from './linkedin-scraper.service';

@Injectable()
export class JobstreetScraperService {
  private readonly logger = new Logger(JobstreetScraperService.name);

  async scrapeJobs(
    keywords: string = 'backend developer',
    location: string = 'Indonesia',
    past24Hours: boolean = true,
  ): Promise<ScrapedJobItem[]> {
    let browser: Browser | null = null;
    try {
      const slug = encodeURIComponent(keywords.toLowerCase().replace(/\s+/g, '-'));
      const timeParam = past24Hours ? '&createdAt=1d' : '';
      const searchUrl = `https://id.jobstreet.com/id/job-search/${slug}-jobs?sortmode=ListedDate${timeParam}`;

      this.logger.log(`Launching Playwright to scrape Jobstreet from: ${searchUrl}`);
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 },
      });

      const page = await context.newPage();
      await page.goto(searchUrl, { timeout: 25000, waitUntil: 'domcontentloaded' });

      // Wait briefly for job cards to render
      await page.waitForTimeout(1500);

      const scrapedCards = await page.evaluate(() => {
        const articles = Array.from(document.querySelectorAll('article'));
        return articles.slice(0, 15).map((card) => {
          const titleEl = card.querySelector('[data-automation="jobTitle"]');
          const compEl = card.querySelector('[data-automation="jobCompany"]');
          const locEl = card.querySelector('[data-automation="jobLocation"]');
          const salaryEl = card.querySelector('[data-automation="jobSalary"]');
          const linkEl =
            card.querySelector('a[data-automation="jobTitle"]') ||
            card.querySelector('a[href*="/job/"]');
          const teaserEl =
            card.querySelector('[data-automation="jobTeaser"]') ||
            card.querySelector('[data-automation="jobCardBulletPoints"]');

          return {
            title: titleEl ? (titleEl as HTMLElement).innerText.trim() : '',
            company: compEl ? (compEl as HTMLElement).innerText.trim() : 'Company via Jobstreet',
            location: locEl ? (locEl as HTMLElement).innerText.trim() : 'Indonesia',
            salary: salaryEl ? (salaryEl as HTMLElement).innerText.trim() : '',
            jobUrl: linkEl ? (linkEl as HTMLAnchorElement).href : '',
            teaser: teaserEl ? (teaserEl as HTMLElement).innerText.trim() : '',
          };
        });
      });

      await browser.close();
      browser = null;

      const jobs: ScrapedJobItem[] = [];
      for (const item of scrapedCards) {
        if (item.title && item.jobUrl) {
          const idMatch = item.jobUrl.match(/\/job\/(\d+)/);
          const jobId = idMatch
            ? idMatch[1]
            : `js-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

          jobs.push({
            jobId,
            title: item.title,
            company: item.company,
            location: item.location,
            salary: item.salary || undefined,
            jobUrl: item.jobUrl,
            portal: 'JOBSTREET',
            postedAt: 'Past 24h',
            description: item.teaser
              ? `Position: ${item.title} at ${item.company}.\nLocation: ${item.location}.\nKey Highlights:\n${item.teaser}`
              : `Position: ${item.title} at ${item.company}.\nLocation: ${item.location}.\nListed recently on Jobstreet. Apply directly on Jobstreet.`,
          });
        }
      }

      this.logger.log(`Parsed ${jobs.length} valid Jobstreet postings via Playwright.`);
      return jobs;
    } catch (e) {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
      this.logger.warn(`Jobstreet Playwright scrape failed: ${e.message}`);
      return [];
    }
  }
}
