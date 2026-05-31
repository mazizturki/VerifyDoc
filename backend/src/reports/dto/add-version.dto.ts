import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddVersionDto {
  @ApiProperty({ example: '2.0' })
  @IsString()
  version: string;

  @ApiPropertyOptional({ default: '1.0.0' })
  @IsOptional()
  @IsString()
  platformVersion?: string;
}
