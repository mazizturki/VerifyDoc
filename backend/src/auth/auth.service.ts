import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwt.sign({ sub: admin.id, email: admin.email });
    return { access_token: token, admin: { id: admin.id, email: admin.email, name: admin.name } };
  }

  async createAdmin(dto: CreateAdminDto) {
    const exists = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Admin already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const admin = await this.prisma.admin.create({
      data: { email: dto.email, passwordHash, name: dto.name },
    });
    return { id: admin.id, email: admin.email, name: admin.name };
  }

  async validateAdmin(id: string) {
    return this.prisma.admin.findUnique({ where: { id } });
  }

  async getProfile(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    return admin;
  }
}
