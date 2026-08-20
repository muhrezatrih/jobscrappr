import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { LogsModule } from './logs/logs.module';
import { AiModule } from './ai/ai.module';
import { CandidateModule } from './candidate/candidate.module';
import { AutomationModule } from './automation/automation.module';
import { JobsModule } from './jobs/jobs.module';
import { ScraperModule } from './scraper/scraper.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    LogsModule,
    AiModule,
    CandidateModule,
    AutomationModule,
    JobsModule,
    ScraperModule,
  ],
})
export class AppModule {}
