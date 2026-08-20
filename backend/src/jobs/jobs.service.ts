import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async getApplications(query: {
    search?: string;
    status?: string;
    portal?: string;
    minScore?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.portal && query.portal !== 'ALL') {
      where.portal = query.portal;
    }

    if (query.minScore) {
      where.matchScore = { gte: parseInt(query.minScore, 10) };
    }

    const [total, items] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async getApplicationById(id: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
    });
    if (!app) {
      throw new NotFoundException('Lamaran tidak ditemukan.');
    }
    return app;
  }

  async deleteApplication(id: string) {
    return this.prisma.jobApplication.delete({
      where: { id },
    });
  }

  async getDashboardKPIs() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalApplications,
      todayApplications,
      appliedCount,
      simulatedCount,
      skippedCount,
      failedCount,
      avgScoreResult,
      recentApplications,
    ] = await Promise.all([
      this.prisma.jobApplication.count(),
      this.prisma.jobApplication.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      this.prisma.jobApplication.count({ where: { status: 'APPLIED' } }),
      this.prisma.jobApplication.count({ where: { status: 'SIMULATED' } }),
      this.prisma.jobApplication.count({ where: { status: 'SKIPPED' } }),
      this.prisma.jobApplication.count({ where: { status: 'FAILED' } }),
      this.prisma.jobApplication.aggregate({
        _avg: { matchScore: true },
        where: { matchScore: { gt: 0 } },
      }),
      this.prisma.jobApplication.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const averageMatchScore = Math.round(avgScoreResult._avg.matchScore || 0);

    return {
      totalApplications,
      todayApplications,
      appliedCount,
      simulatedCount,
      skippedCount,
      failedCount,
      averageMatchScore,
      recentApplications,
    };
  }
}
