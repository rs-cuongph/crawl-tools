import { Module } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChapterSchema } from './schema/chapter.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'chapters', schema: ChapterSchema}])],
  providers: [ChapterService],
  exports: [ChapterService]
})
export class ChapterModule {}
