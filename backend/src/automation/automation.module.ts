import { Module } from '@nestjs/common';
import { JobstreetWorkerService } from './jobstreet-worker.service';
import { AutomationController } from './automation.controller';

@Module({
  controllers: [AutomationController],
  providers: [JobstreetWorkerService],
  exports: [JobstreetWorkerService],
})
export class AutomationModule {}
