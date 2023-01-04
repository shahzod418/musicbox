import { Injectable } from '@nestjs/common';

import { PrismaService } from '@database/prisma.service';
import { FileService } from '@services/file/file.service';

import { RoleType } from '@interfaces/file';

import type { Success } from '@interfaces/response';
import type { Role, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly file: FileService,
  ) {}

  public async findAll(): Promise<User[]> {
    return await this.prisma.user.findMany();
  }

  public async updateRole(id: number, role: Role): Promise<Success> {
    try {
      await this.prisma.user.update({
        data: {
          role,
        },
        where: { id },
      });

      return { success: true };
    } catch {
      return { success: false };
    }
  }

  public async remove(id: number): Promise<Success> {
    try {
      const { artist } = await this.prisma.user.delete({
        where: { id },
        include: {
          artist: true,
        },
      });

      if (artist) {
        await this.file.removeResources(artist.id, RoleType.Artist);
      }
      await this.file.removeResources(id, RoleType.User);

      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
