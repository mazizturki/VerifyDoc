import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@university.tn' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword' })
  @IsString()
  @MinLength(6)
  password: string;
}
