import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SocketProviders } from './socket.provider';
import { CategoryModule } from './modules/category/category.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StoryModule } from './modules/story/story.module';
import { ChapterModule } from './modules/chapter/chapter.module';
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/truyenchon', {
      useFindAndModify: false,
    }),
    CategoryModule,
    StoryModule,
    ChapterModule,
  ],
  controllers: [AppController],
  providers: [AppService, ...SocketProviders],
})
export class AppModule {}
