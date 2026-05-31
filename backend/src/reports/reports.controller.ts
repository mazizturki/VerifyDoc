import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
  UseGuards, Request, UploadedFile, UseInterceptors, Res, ParseIntPipe,
  DefaultValuePipe, Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { AddVersionDto } from './dto/add-version.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { memoryStorage } from 'multer';

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files allowed'), false);
};

const upload = { storage: memoryStorage(), fileFilter: pdfFilter, limits: { fileSize: 50 * 1024 * 1024 } };

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ─── Admin endpoints ───────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('pdf', upload))
  create(@Body() dto: CreateReportDto, @UploadedFile() file: Express.Multer.File, @Request() req) {
    return this.reportsService.create(dto, file, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reportsService.findAll(page, limit);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() dto: Partial<CreateReportDto>, @Request() req) {
    return this.reportsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Request() req) {
    return this.reportsService.remove(id, req.user.id);
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('pdf', upload))
  addVersion(
    @Param('id') id: string,
    @Body() dto: AddVersionDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.reportsService.addVersion(id, dto, file, req.user.id);
  }

  @Get(':id/qrcode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getQrCode(@Param('id') id: string, @Query('format') format: 'png' | 'svg' = 'png', @Res() res: Response) {
    if (format === 'svg') {
      const svg = await this.reportsService.getQrCode(id, 'svg');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qrcode-${id}.svg"`);
      return res.send(svg);
    }
    const buf = await this.reportsService.getQrCode(id, 'png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qrcode-${id}.png"`);
    return res.send(buf);
  }

  // ─── Public endpoints ──────────────────────────────────────────────────────

  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post('public/:id/verify')
  @UseInterceptors(FileInterceptor('pdf', upload))
  verifyHash(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.reportsService.verifyHash(id, file.buffer);
  }

  @Get('public/version/:versionId/download')
  async download(@Param('versionId') versionId: string, @Res() res: Response) {
    const { stream, name, size } = await this.reportsService.downloadPdf(versionId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Content-Length', size.toString());
    stream.pipe(res);
  }
}
