import { IsString, IsOptional, IsArray, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateReportDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  authors: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  supervisors: string[];

  @ApiProperty()
  @IsString()
  university: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hostCompany?: string;

  @ApiProperty()
  @IsString()
  academicYear: string;

  @ApiPropertyOptional({ default: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ default: '1.0.0' })
  @IsOptional()
  @IsString()
  platformVersion?: string;
}
