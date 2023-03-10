import { Injectable } from '@nestjs/common';

import { getContentWhere } from '@constants/content-where';
import { PrismaService } from '@database/prisma.service';

import type { IAlbum, ISong } from './album.interface';
import type { Role } from '@prisma/client';

@Injectable()
export class ContentAlbumService {
  private readonly albumSelect = {
    id: true,
    name: true,
    cover: true,
    status: true,
    artist: { select: { id: true, name: true } },
  };

  private readonly songSelect = {
    id: true,
    name: true,
    text: true,
    listens: true,
    explicit: true,
    cover: true,
    audio: true,
    status: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  public async findAll(role?: Role, userId?: number): Promise<IAlbum[]> {
    return await this.prisma.album.findMany({
      where: getContentWhere(role, userId),
      select: this.albumSelect,
    });
  }

  public async findOne(
    albumId: number,
    role?: Role,
    userId?: number,
  ): Promise<IAlbum & { songs: ISong[] }> {
    return await this.prisma.album.findFirstOrThrow({
      where: { id: albumId, ...getContentWhere(role, userId) },
      select: {
        ...this.albumSelect,
        songs: {
          where: getContentWhere(role, userId),
          select: this.songSelect,
        },
      },
    });
  }
}
