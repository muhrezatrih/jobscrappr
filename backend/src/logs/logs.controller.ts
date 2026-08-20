import { Controller, Get, Sse, MessageEvent, Query, Delete } from '@nestjs/common';
import { LogsService } from './logs.service';
import { Observable, map } from 'rxjs';

@Controller('api/logs')
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Sse('stream')
  streamLogs(): Observable<MessageEvent> {
    return this.logsService.getLogStream().pipe(
      map((log) => ({
        data: JSON.stringify(log),
      } as MessageEvent)),
    );
  }

  @Get()
  async getLogs(
    @Query('limit') limit?: string,
    @Query('level') level?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 100;
    return this.logsService.getRecentLogs(take, level);
  }

  @Delete()
  async clearLogs() {
    await this.logsService.clearLogs();
    return { success: true, message: 'Logs cleared successfully' };
  }
}
