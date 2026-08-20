import { Controller, Get, Param, Query, Delete } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('api/jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get('dashboard/kpis')
  getDashboardKPIs() {
    return this.jobsService.getDashboardKPIs();
  }

  @Get('applications')
  getApplications(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('portal') portal?: string,
    @Query('minScore') minScore?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.jobsService.getApplications({
      search,
      status,
      portal,
      minScore,
      page,
      limit,
    });
  }

  @Get('applications/:id')
  getApplicationById(@Param('id') id: string) {
    return this.jobsService.getApplicationById(id);
  }

  @Delete('applications/:id')
  deleteApplication(@Param('id') id: string) {
    return this.jobsService.deleteApplication(id);
  }
}
