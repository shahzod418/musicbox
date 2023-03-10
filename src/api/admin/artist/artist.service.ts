import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '@database/prisma.service';
import { FileService } from '@services/file/file.service';

import { FileType } from '@interfaces/file';

import type {
  IAlbum,
  IArtist,
  IArtistFiles,
  ICreateArtist,
  ISong,
  IUpdateArtist,
} from './artist.interface';
import type { IShortArtist } from '@interfaces/artist';
import type { ISuccess } from '@interfaces/response';

@Injectable()
export class AdminArtistService {
  private readonly artistSelect = {
    id: true,
    name: true,
    avatar: true,
    description: true,
    status: true,
    cover: true,
  };

  private readonly albumSelect = {
    id: true,
    name: true,
    cover: true,
    status: true,
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly file: FileService,
  ) {}

  public async create(
    data: ICreateArtist,
    files: IArtistFiles,
  ): Promise<IArtist> {
    const { userId, ...payload } = data;
    const { avatar, cover } = files;

    const artist = await this.prisma.artist.create({
      data: {
        ...(avatar && { avatar: avatar.name }),
        ...(cover && { cover: cover.name }),
        ...payload,
        user: { connect: { id: userId } },
      },
      select: this.artistSelect,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: { set: Role.Artist } },
    });

    if (avatar) {
      const addAvatarArgs = {
        id: artist.id,
        role: Role.Artist,
        type: FileType.Avatar,
        file: avatar,
      };

      await this.file.addFile(addAvatarArgs);
    }

    if (cover) {
      const addCoverArgs = {
        id: artist.id,
        role: Role.Artist,
        type: FileType.Cover,
        file: cover,
      };

      await this.file.addFile(addCoverArgs);
    }

    return artist;
  }

  public async findAll(): Promise<IArtist[]> {
    return await this.prisma.artist.findMany({
      select: this.artistSelect,
    });
  }

  public async findOne(artistId: number): Promise<IArtist> {
    return await this.prisma.artist.findFirstOrThrow({
      where: { id: artistId },
      select: this.artistSelect,
    });
  }

  public async findAllAlbum(artistId: number): Promise<IAlbum[]> {
    return await this.prisma.album.findMany({
      where: { artistId },
      select: this.albumSelect,
    });
  }

  public async findOneAlbum(
    albumId: number,
  ): Promise<IAlbum & IShortArtist & { songs: ISong[] }> {
    return await this.prisma.album.findFirstOrThrow({
      where: { id: albumId },
      select: {
        ...this.albumSelect,
        artist: { select: { id: true, name: true } },
        songs: { select: this.songSelect },
      },
    });
  }

  public async findAllSong(artistId: number): Promise<ISong[]> {
    return await this.prisma.song.findMany({
      where: { artistId },
      select: this.songSelect,
    });
  }

  public async update(
    artistId: number,
    payload: IUpdateArtist,
    files: IArtistFiles,
  ): Promise<IArtist> {
    const { avatar, cover } = files;

    const { avatar: previousAvatar, cover: previousCover } =
      await this.prisma.artist.findFirstOrThrow({
        where: { id: artistId },
        select: { avatar: true, cover: true },
      });

    const artist = await this.prisma.artist.update({
      data: {
        ...payload,
        ...(avatar && { avatar: { set: avatar.name } }),
        ...(cover && { cover: { set: cover.name } }),
      },
      where: { id: artistId },
      select: this.artistSelect,
    });

    if (avatar) {
      const updateAvatarArgs = {
        id: artistId,
        role: Role.Artist,
        type: FileType.Avatar,
        currentFile: avatar,
        previousFilename: previousAvatar,
      };

      await this.file.updateFile(updateAvatarArgs);
    }

    if (cover) {
      const updateCoverArgs = {
        id: artistId,
        role: Role.Artist,
        type: FileType.Cover,
        currentFile: cover,
        previousFilename: previousCover,
      };

      await this.file.updateFile(updateCoverArgs);
    }

    return artist;
  }

  public async remove(artistId: number): Promise<ISuccess> {
    const { userId } = await this.prisma.artist.delete({
      where: { id: artistId },
      select: { userId: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: { set: Role.User } },
    });

    await this.file.removeResources(artistId, Role.Artist);

    return { success: true };
  }

  public async removeAvatar(artistId: number): Promise<ISuccess> {
    const { avatar } = await this.prisma.artist.findFirstOrThrow({
      where: { id: artistId },
      select: { avatar: true },
    });

    if (avatar) {
      await this.prisma.artist.update({
        where: { id: artistId },
        data: { avatar: { set: null } },
      });

      const removeAvatarArgs = {
        id: artistId,
        role: Role.Artist,
        type: FileType.Avatar,
        filename: avatar,
      };

      await this.file.removeFile(removeAvatarArgs);
    }

    return { success: true };
  }

  public async removeCover(artistId: number): Promise<ISuccess> {
    const { cover } = await this.prisma.artist.findFirstOrThrow({
      where: { id: artistId },
      select: { cover: true },
    });

    if (cover) {
      await this.prisma.artist.update({
        where: { id: artistId },
        data: { cover: { set: null } },
      });

      const removeCoverArgs = {
        id: artistId,
        role: Role.Artist,
        type: FileType.Cover,
        filename: cover,
      };

      await this.file.removeFile(removeCoverArgs);
    }

    return { success: true };
  }
}
