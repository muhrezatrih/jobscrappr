import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Subject, Observable } from 'rxjs';

export interface LogPayload {
  id?: string;
  timestamp?: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  source?: string;
  action: string;
  message: string;
  metadata?: any;
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private logSubject = new Subject<LogPayload>();

  constructor(private prisma: PrismaService) {}

  async log(payload: LogPayload) {
    const entry: LogPayload = {
      ...payload,
      id: payload.id || undefined,
      timestamp: payload.timestamp || new Date(),
      source: payload.source || 'WORKER',
    };

    // Print to console
    const formatted = `[${entry.source}] [${entry.action}] ${entry.message}`;
    if (entry.level === 'ERROR') {
      this.logger.error(formatted);
    } else if (entry.level === 'WARN') {
      this.logger.warn(formatted);
    } else {
      this.logger.log(formatted);
    }

    // Emit to real-time subscribers
    this.logSubject.next(entry);

    // Save to Database asynchronously
    try {
      await this.prisma.executionLog.create({
        data: {
          level: entry.level,
          source: entry.source || 'WORKER',
          action: entry.action,
          message: entry.message,
          metadata: entry.metadata ? JSON.parse(JSON.stringify(entry.metadata)) : undefined,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to persist log to DB: ${err.message}`);
    }
  }

  getLogStream(): Observable<LogPayload> {
    return this.logSubject.asObservable();
  }

  async getRecentLogs(limit = 100, level?: string) {
    const where: any = {};
    if (level && level !== 'ALL') {
      where.level = level;
    }
    return this.prisma.executionLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async clearLogs() {
    return this.prisma.executionLog.deleteMany({});
  }
}
