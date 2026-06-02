import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AddVersionDto } from './dto/add-version.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private filesService: FilesService,
  ) {}

  async create(dto: CreateReportDto, file: Express.Multer.File | undefined, adminId: string) {
    const reportData: any = {
      title: dto.title,
      subtitle: dto.subtitle,
      authors: dto.authors,
      supervisors: dto.supervisors,
      university: dto.university,
      hostCompany: dto.hostCompany,
      academicYear: dto.academicYear,
    };

    if (file) {
      const { fileId, sha256 } = await this.filesService.uploadPdf(file);
      reportData.versions = {
        create: {
          version: dto.version || '1.0',
          platformVersion: dto.platformVersion || '1.0.0',
          sha256Hash: sha256,
          fileId,
        },
      };
    }

    const report = await this.prisma.report.create({
      data: reportData,
      include: { versions: { include: { file: true } } },
    });

    if (report.versions.length > 0) {
      await this.prisma.report.update({
        where: { id: report.id },
        data: { currentVersionId: report.versions[0].id },
      });
    }

    await this.prisma.auditLog.create({
      data: { adminId, reportId: report.id, action: 'CREATE_REPORT', ipAddress: null },
    });

    return this.findOne(report.id);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        skip,
        take: limit,
        include: {
          versions: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.report.count(),
    ]);
    return { data: reports, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          include: { file: { select: { originalName: true, size: true } } },
        },
      },
    });
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async update(id: string, dto: Partial<CreateReportDto>, adminId: string) {
    await this.findOne(id);
    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        authors: dto.authors,
        supervisors: dto.supervisors,
        university: dto.university,
        hostCompany: dto.hostCompany,
        academicYear: dto.academicYear,
      },
    });
    await this.prisma.auditLog.create({
      data: { adminId, reportId: id, action: 'UPDATE_REPORT' },
    });
    return updated;
  }

  async remove(id: string, adminId: string) {
    const report = await this.findOne(id);

    for (const v of report.versions) {
      await this.prisma.reportVersion.delete({ where: { id: v.id } });
      await this.filesService.deleteFile(v.fileId);
    }

    await this.prisma.report.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { adminId, reportId: id, action: 'DELETE_REPORT' },
    });
    return { deleted: true };
  }

  async addVersion(reportId: string, dto: AddVersionDto, file: Express.Multer.File, adminId: string) {
    await this.findOne(reportId);

    const existing = await this.prisma.reportVersion.findUnique({
      where: { reportId_version: { reportId, version: dto.version } },
    });
    if (existing) throw new ConflictException(`Version ${dto.version} already exists`);

    const { fileId, sha256 } = await this.filesService.uploadPdf(file);

    const version = await this.prisma.reportVersion.create({
      data: {
        reportId,
        version: dto.version,
        platformVersion: dto.platformVersion || '1.0.0',
        sha256Hash: sha256,
        fileId,
      },
    });

    await this.prisma.report.update({
      where: { id: reportId },
      data: { currentVersionId: version.id },
    });

    await this.prisma.auditLog.create({
      data: { adminId, reportId, action: 'ADD_VERSION', details: { version: dto.version } },
    });

    return version;
  }

  async getQrCode(id: string, format: 'png' | 'svg' = 'png') {
    await this.findOne(id);
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/r/${id}`;

    if (format === 'svg') {
      return QRCode.toString(verifyUrl, { type: 'svg', width: 300, margin: 2 });
    }
    return QRCode.toBuffer(verifyUrl, { width: 300, margin: 2 });
  }

  async verifyHash(reportId: string, fileBuffer: Buffer) {
    const report = await this.findOne(reportId);

    // Prioritise currentVersionId; fall back to most-recent version
    const currentVersion = report.currentVersionId
      ? (report.versions.find((v: any) => v.id === report.currentVersionId) ?? report.versions[0])
      : report.versions[0];

    if (!currentVersion) {
      throw new NotFoundException(
        'Aucune version officielle disponible. Uploadez le PDF final via "Uploader PDF final".',
      );
    }

    const providedHash = this.filesService.computeHash(fileBuffer);
    const match = providedHash === currentVersion.sha256Hash;

    return {
      match,
      providedHash,
      officialHash: currentVersion.sha256Hash,
      version: currentVersion.version,
    };
  }

  async downloadPdf(versionId: string) {
    const version = await this.prisma.reportVersion.findUniqueOrThrow({
      where: { id: versionId },
    });
    return this.filesService.getFileStream(version.fileId);
  }
}
