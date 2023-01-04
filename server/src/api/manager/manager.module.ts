import { Module } from '@nestjs/common';

import { AlbumModule } from './album/album.module';
import { ArtistModule } from './artist/artist.module';

@Module({
  imports: [AlbumModule, ArtistModule],
})
export class ManagerModule {}
