import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';

@Injectable()
export class FilesService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    this.bucket = this.config.get('MINIO_BUCKET', 'verifydoc');
    this.client = new Minio.Client({
      endPoint: this.config.get('MINIO_ENDPOINT', 'minio'),
      port: parseInt(this.config.get('MINIO_PORT', '9000')),
      useSSL: this.config.get('MINIO_USE_SSL', 'false') === 'true',
      accessKey: this.config.get('MINIO_ACCESS_KEY'),
      secretKey: this.config.get('MINIO_SECRET_KEY'),
      region: 'eu-central-003',
      pathStyle: true,
    });
    await this.ensureBucket();
  }

  private async ensureBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket '${this.bucket}' created`);
      }
    } catch (err) {
      this.logger.error('MinIO bucket init error', err);
    }
  }

  async uploadPdf(file: Express.Multer.File): Promise<{ fileId: string; sha256: string }> {
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    const objectName = `pdfs/${Date.now()}-${hash}.pdf`;
    await this.client.putObject(this.bucket, objectName, file.buffer, file.size, {
      'Content-Type': 'application/pdf',
    });
    const fileRecord = await this.prisma.file.create({
      data: {
        originalName: file.originalname,
        storagePath: objectName,
        mimeType: 'application/pdf',
        size: BigInt(file.size),
      },
    });
    return { fileId: fileRecord.id, sha256: hash };
  }

  async getFileStream(fileId: string): Promise<{ stream: Readable; name: string; size: bigint }> {
    const file = await this.prisma.file.findUniqueOrThrow({ where: { id: fileId } });
    const stream = await this.client.getObject(this.bucket, file.storagePath);
    return { stream, name: file.originalName, size: file.size };
  }

  async deleteFile(fileId: string) {
    const file = await this.prisma.file.findUnique({ where: { id: fileId } });
    if (file) {
      await this.client.removeObject(this.bucket, file.storagePath);
      await this.prisma.file.delete({ where: { id: fileId } });
    }
  }

  computeHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}