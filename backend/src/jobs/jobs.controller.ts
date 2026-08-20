import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { JobsService, TrackJobDto, UpdateJobDetailsDto } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get('dashboard/kpis')
  async getDashboardKPIs() {
    return this.jobsService.getDashboardKPIs();
  }

  @Get('analytics/sankey')
  async getSankeyAnalytics() {
    return this.jobsService.getSankeyAnalytics();
  }

  @Get('applications')
  async getApplications(
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

  @Post('applications/track')
  async trackJob(@Body() dto: TrackJobDto) {
    return this.jobsService.trackJob(dto);
  }

  @Get('applications/:id')
  async getApplicationById(@Param('id') id: string) {
    return this.jobsService.getApplicationById(id);
  }

  @Patch('applications/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note?: string,
  ) {
    return this.jobsService.updateStatus(id, status, note);
  }

  @Patch('applications/:id/details')
  async updateDetails(
    @Param('id') id: string,
    @Body() dto: UpdateJobDetailsDto,
  ) {
    return this.jobsService.updateDetails(id, dto);
  }

  @Delete('applications/:id')
  async deleteApplication(@Param('id') id: string) {
    return this.jobsService.deleteApplication(id);
  }
}
