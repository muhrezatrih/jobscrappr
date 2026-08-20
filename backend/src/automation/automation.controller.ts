import { Controller, Post, Get, Body } from '@nestjs/common';
import { JobstreetWorkerService } from './jobstreet-worker.service';

@Controller('api/automation')
export class AutomationController {
  constructor(private worker: JobstreetWorkerService) {}

  @Get('status')
  getStatus() {
    return this.worker.getStatus();
  }

  @Post('start')
  start(@Body() body: { dryRun?: boolean }) {
    return this.worker.startWorker(body);
  }

  @Post('pause')
  pause() {
    return this.worker.pauseWorker();
  }

  @Post('resume')
  resume() {
    return this.worker.resumeWorker();
  }

  @Post('stop')
  stop() {
    return this.worker.stopWorker();
  }

  @Post('test-single')
  testSingle(@Body() body: { jobTitle?: string; companyName?: string }) {
    return this.worker.runSingleJobTest(body.jobTitle, body.companyName);
  }
}
