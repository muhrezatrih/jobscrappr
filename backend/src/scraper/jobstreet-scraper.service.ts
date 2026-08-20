import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';
import { ScrapedJobItem } from './linkedin-scraper.service';

@Injectable()
export class JobstreetScraperService {
  private readonly logger = new Logger(JobstreetScraperService.name);

  private fetchHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const req = https.get(
        {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, url).toString();
            return this.fetchHtml(redirectUrl).then(resolve).catch(reject);
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        },
      );
      req.on('error', reject);
      req.setTimeout(12000, () => {
        req.destroy();
        reject(new Error('Jobstreet request timeout'));
      });
    });
  }

  async scrapeJobs(
    keywords: string = 'backend developer',
    location: string = 'Indonesia',
    past24Hours: boolean = true,
  ): Promise<ScrapedJobItem[]> {
    try {
      const slug = encodeURIComponent(keywords.toLowerCase().replace(/\s+/g, '-'));
      const timeParam = past24Hours ? '&createdAt=1d' : '';
      const searchUrl = `https://id.jobstreet.com/id/job-search/${slug}-jobs?sortmode=ListedDate${timeParam}`;

      this.logger.log(`Fetching Jobstreet 24h jobs from: ${searchUrl}`);
      const html = await this.fetchHtml(searchUrl);

      const jobs: ScrapedJobItem[] = [];

      // Extract JSON state if present or parse job cards
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
      if (nextDataMatch) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          const results = nextData?.props?.pageProps?.jobDetails?.results ||
                          nextData?.props?.pageProps?.results ||
                          nextData?.props?.pageProps?.data?.results || [];

          for (const item of results.slice(0, 15)) {
            const jobId = String(item.id || item.jobId || Math.random());
            const title = item.title || item.jobTitle || '';
            const company = item.advertiser?.description || item.company || 'Jobstreet Employer';
            const loc = item.location || location;
            const salary = item.salary || '';
            const jobUrl = `https://id.jobstreet.com/id/job/${jobId}`;

            if (title) {
              jobs.push({
                jobId,
                title,
                company,
                location: loc,
                salary,
                jobUrl,
                portal: 'JOBSTREET',
                postedAt: item.listingDate || 'Past 24h',
                description: item.teaser || `Position: ${title} at ${company}. Located in ${loc}. Listed in the past 24 hours on Jobstreet.`,
              });
            }
          }
        } catch (e) {
          this.logger.debug(`JSON parsing fallback for Jobstreet: ${e.message}`);
        }
      }

      // Regex fallback if JSON was not populated
      if (jobs.length === 0) {
        const cardRegex = /<article[\s\S]*?<\/article>/g;
        const cards = html.match(cardRegex) || [];
        for (const card of cards.slice(0, 15)) {
          const titleMatch = card.match(/data-automation="jobTitle"[^>]*>([\s\S]*?)<\/a>/i);
          const companyMatch = card.match(/data-automation="jobCompany"[^>]*>([\s\S]*?)<\/a>/i);
          const locMatch = card.match(/data-automation="jobLocation"[^>]*>([\s\S]*?)<\/a>/i);
          const salaryMatch = card.match(/data-automation="jobSalary"[^>]*>([\s\S]*?)<\/span>/i);
          const linkMatch = card.match(/href="(\/id\/job\/[^"]*)"/i);

          const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
          const company = companyMatch ? companyMatch[1].replace(/<[^>]*>/g, '').trim() : 'Company';
          const loc = locMatch ? locMatch[1].replace(/<[^>]*>/g, '').trim() : location;
          const salary = salaryMatch ? salaryMatch[1].replace(/<[^>]*>/g, '').trim() : undefined;
          const jobUrl = linkMatch ? `https://id.jobstreet.com${linkMatch[1].split('?')[0]}` : '';
          const jobId = linkMatch ? linkMatch[1].replace(/[^0-9]/g, '') : `js-${Date.now()}`;

          if (title && jobUrl) {
            jobs.push({
              jobId,
              title,
              company,
              location: loc,
              salary,
              jobUrl,
              portal: 'JOBSTREET',
              postedAt: 'Past 24h',
              description: `Position: ${title} at ${company}. Location: ${loc}. ${salary ? `Salary: ${salary}.` : ''} Listed in the past 24 hours on Jobstreet.`,
            });
          }
        }
      }

      this.logger.log(`Parsed ${jobs.length} valid Jobstreet postings.`);
      return jobs;
    } catch (e) {
      this.logger.warn(`Jobstreet scrape failed: ${e.message}`);
      return [];
    }
  }
}
