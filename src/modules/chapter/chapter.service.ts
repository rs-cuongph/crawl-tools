import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Chapter } from './schema/chapter.schema';
import { ChapterInterface } from './interface/chapter.interface';
import { ChapterDto } from './dto/chapter.dto';

@Injectable()
export class ChapterService {
  constructor(@InjectModel('chapters') private chapterModel: Model<Chapter>) {}
  async createOrUpdate(name: string, obj: ChapterDto) {
    const findResult = await this.find(name);
    if (findResult) {
      return this.update(findResult._id, obj);
    } else {
      delete obj.updated_at;
      return this.create(obj);
    }
  }
  async find(name: string): Promise<ChapterInterface> {
    return this.chapterModel.findOne({ name: name });
  }
  async create(ChapterObj: ChapterDto): Promise<ChapterInterface> {
    const createdChapter = new this.chapterModel(ChapterObj);
    const saveChapter = await createdChapter.save();
    await this.addStoryToChapter(saveChapter._id, saveChapter.idStory);
    return saveChapter.toObject({ versionKey: false });
  }

  async update(_id: string, cate: ChapterDto): Promise<ChapterInterface> {
    const changes = cate;
    return this.chapterModel.findOneAndUpdate(
      { _id: _id },
      { ...changes },
      { new: true },
    );
  }

  async addStoryToChapter(chapterId, idStory) {
    return this.chapterModel.findByIdAndUpdate(
      chapterId,
      { $push: { stories: idStory } },
      { new: true, useFindAndModify: false },
    );
  }
}
