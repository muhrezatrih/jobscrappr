import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

export interface ScrapedJobItem {
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobUrl: string;
  portal: 'LINKEDIN' | 'JOBSTREET';
  description?: string;
  requirements?: string;
  postedAt?: string;
}

@Injectable()
export class LinkedinScraperService {
  private readonly logger = new Logger(LinkedinScraperService.name);

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
            'Accept-Language': 'en-US,en;q=0.9',
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
        reject(new Error('LinkedIn request timeout'));
      });
    });
  }

  async scrapeJobs(
    keywords: string = 'backend developer',
    location: string = 'Indonesia',
    past24Hours: boolean = true,
  ): Promise<ScrapedJobItem[]> {
    try {
      const timeFilter = past24Hours ? '&f_TPR=r86400' : '';
      const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(
        keywords,
      )}&location=${encodeURIComponent(location)}${timeFilter}&start=0`;

      this.logger.log(`Fetching LinkedIn 24h jobs from: ${searchUrl}`);
      const html = await this.fetchHtml(searchUrl);

      const jobs: ScrapedJobItem[] = [];
      const cardRegex = /<li[\s\S]*?<\/li>/g;
      const cards = html.match(cardRegex) || [];

      for (const card of cards.slice(0, 15)) {
        try {
          const titleMatch = card.match(/<h3[^>]*base-search-card__title[^>]*>([\s\S]*?)<\/h3>/i);
          const companyMatch = card.match(/<h4[^>]*base-search-card__subtitle[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                               card.match(/<h4[^>]*base-search-card__subtitle[^>]*>([\s\S]*?)<\/h4>/i);
          const locationMatch = card.match(/<span[^>]*job-search-card__location[^>]*>([\s\S]*?)<\/span>/i);
          const linkMatch = card.match(/<a[^>]*base-card__full-link[^>]*href="([^"]*)"/i);
          const dateMatch = card.match(/<time[^>]*datetime="([^"]*)"[^>]*>([\s\S]*?)<\/time>/i);
          const urnMatch = card.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/i);

          const title = titleMatch ? titleMatch[1].trim() : '';
          const company = companyMatch ? companyMatch[1].trim().replace(/<[^>]*>/g, '') : '';
          const loc = locationMatch ? locationMatch[1].trim() : location;
          let jobUrl = linkMatch ? linkMatch[1].split('?')[0] : '';
          const jobId = urnMatch ? urnMatch[1] : `li-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const postedAt = dateMatch ? (dateMatch[2] || dateMatch[1]).trim() : 'Past 24h';

          if (title && jobUrl) {
            jobs.push({
              jobId,
              title,
              company: company || 'Company via LinkedIn',
              location: loc,
              jobUrl,
              portal: 'LINKEDIN',
              postedAt,
              description: `Position: ${title} at ${company}. Location: ${loc}. Posted recently on LinkedIn (${postedAt}).`,
            });
          }
        } catch (err) {
          this.logger.debug(`Error parsing single LinkedIn card: ${err.message}`);
        }
      }

      this.logger.log(`Parsed ${jobs.length} valid LinkedIn job postings. Fetching detailed descriptions...`);

      // Fetch full descriptions and workplace details in parallel batches of 5
      const jobsWithDetails = await Promise.all(
        jobs.slice(0, 10).map(async (job) => {
          try {
            const detail = await this.fetchJobDetail(job.jobId);
            if (detail) {
              return {
                ...job,
                location: detail.workplaceType ? `${job.location} (${detail.workplaceType})` : job.location,
                description: detail.description || job.description,
              };
            }
            return job;
          } catch {
            return job;
          }
        }),
      );

      return jobsWithDetails;
    } catch (e) {
      this.logger.warn(`LinkedIn scrape failed or timed out: ${e.message}`);
      return [];
    }
  }

  async fetchJobDetail(jobId: string): Promise<{ description: string; workplaceType?: 'REMOTE' | 'HYBRID' | 'ONSITE' } | null> {
    try {
      const detailUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
      const html = await this.fetchHtml(detailUrl);
      const descMatch = html.match(/<div[^>]*class="show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i);
      const fullText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');

      let workplaceType: 'REMOTE' | 'HYBRID' | 'ONSITE' | undefined = undefined;
      const lower = fullText.toLowerCase();

      if (lower.includes('remote') || lower.includes('work from home') || lower.includes('wfh')) {
        if (!lower.includes('non-remote') && !lower.includes('not remote') && !lower.includes('no remote')) {
          workplaceType = 'REMOTE';
        }
      }
      if (lower.includes('hybrid') || lower.includes('wfh & wfo') || lower.includes('wfo & wfh')) {
        workplaceType = 'HYBRID';
      }
      if (lower.includes('on-site') || lower.includes('onsite') || lower.includes('work from office') || lower.includes('wfo full')) {
        if (!workplaceType) {
          workplaceType = 'ONSITE';
        }
      }

      const description = descMatch
        ? descMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        : '';

      return {
        description: description || fullText.slice(0, 1500),
        workplaceType,
      };
    } catch {
      return null;
    }
  }

  async fetchJobDescription(jobId: string): Promise<string> {
    const detail = await this.fetchJobDetail(jobId);
    return detail ? detail.description : '';
  }
}
