import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StorySchema } from './schema/story.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'stories', schema: StorySchema}])],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService]
})
export class StoryModule {}
