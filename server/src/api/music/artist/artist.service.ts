import { Injectable } from '@nestjs/common';
import { Status } from '@prisma/client';

import { PrismaService } from '@database/prisma.service';
import { FileService } from '@services/file/file.service';

import { FileType, RoleType } from '@interfaces/file';

import type { Album, Artist, Song } from '@prisma/client';

@Injectable()
export class ArtistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly file: FileService,
  ) {}

  public async findAll(): Promise<Artist[]> {
    return await this.prisma.artist.findMany({
      where: { OR: [{ status: Status.APPROVED }, { status: Status.DELETED }] },
    });
  }

  public async findOne(
    artistId: number,
  ): Promise<Artist & { songs: Song[]; albums: Album[] }> {
    return await this.prisma.artist.findFirstOrThrow({
      where: {
        id: artistId,
        OR: [{ status: Status.APPROVED }, { status: Status.DELETED }],
      },
      include: {
        albums: true,
        songs: true,
      },
    });
  }

  public async getAvatar(artistId: number): Promise<Buffer> {
    const { avatar } = await this.prisma.artist.findFirstOrThrow({
      where: {
        id: artistId,
        OR: [{ status: Status.APPROVED }, { status: Status.DELETED }],
      },
      select: { avatar: true },
    });

    return await this.file.getFile(
      artistId,
      RoleType.Artist,
      FileType.Avatar,
      avatar,
    );
  }

  public async getCover(artistId: number): Promise<Buffer> {
    const { cover } = await this.prisma.artist.findFirstOrThrow({
      where: {
        id: artistId,
        OR: [{ status: Status.APPROVED }, { status: Status.DELETED }],
      },
      select: { cover: true },
    });

    return await this.file.getFile(
      artistId,
      RoleType.Artist,
      FileType.Cover,
      cover,
    );
  }
}
