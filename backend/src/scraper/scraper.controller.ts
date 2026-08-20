import { Body, Controller, Get, Post } from '@nestjs/common';
import { ScraperService, EvaluatedScrapedJob } from './scraper.service';

export class SearchJobsDto {
  keywords?: string;
  location?: string;
  portals?: ('LINKEDIN' | 'JOBSTREET')[];
  past24Hours?: boolean;
}

@Controller('scraper')
export class ScraperController {
  constructor(private scraperService: ScraperService) {}

  @Get('saved')
  async getSavedJobs(): Promise<EvaluatedScrapedJob[]> {
    return this.scraperService.getStoredDiscoveredJobs();
  }

  @Post('search')
  async searchJobs(@Body() body: SearchJobsDto): Promise<EvaluatedScrapedJob[]> {
    const keywords = body.keywords || 'backend developer';
    const location = body.location || 'Indonesia';
    const portals: ('LINKEDIN' | 'JOBSTREET')[] =
      body.portals && body.portals.length > 0 ? body.portals : ['LINKEDIN', 'JOBSTREET'];
    const past24Hours = body.past24Hours !== undefined ? body.past24Hours : true;

    return this.scraperService.searchAndEvaluate(keywords, location, portals, past24Hours);
  }
}
