import { Module } from '@nestjs/common';
import { LinkedinScraperService } from './linkedin-scraper.service';
import { JobstreetScraperService } from './jobstreet-scraper.service';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AiModule, PrismaModule],
  providers: [LinkedinScraperService, JobstreetScraperService, ScraperService],
  controllers: [ScraperController],
  exports: [ScraperService, LinkedinScraperService, JobstreetScraperService],
})
export class ScraperModule {}
