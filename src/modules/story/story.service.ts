import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Story } from './schema/story.schema';
import { Model } from 'mongoose';
import { StoryDto } from './dto/story.dto';
import { StoryInterface } from './interface/story.interface';

@Injectable()
export class StoryService {
  constructor(@InjectModel('stories') private storyModel: Model<Story>) {}
  async createOrUpdate(name: string, dataStory: StoryDto) {
    const findResult = await this.find(name);
    if (findResult) {
      // console.log(findResult.categories);
      // if (!findResult.categories.includes(dataStory.categoryId)) {
      //   await this.addCateToStory(findResult._id, dataStory.categoryId);
      // }
      return this.update(findResult._id, dataStory);
    } else {
      return this.create(dataStory);
    }
  }
  async create(dataStory: StoryDto): Promise<StoryInterface> {
    const createdStory = new this.storyModel(dataStory);
    const saveStory = await createdStory.save();
    await this.addCateToStory(saveStory._id, dataStory.categoryId);
    return saveStory.toObject({ versionKey: false });
  }

  async update(_id: string, dataStory: StoryDto): Promise<StoryInterface> {
    delete dataStory.categoryId;
    const changes = dataStory;
    return this.storyModel.findOneAndUpdate(
      { _id: _id },
      { ...changes },
      { new: true },
    );
  }

  async find(name: string): Promise<StoryInterface> {
    return this.storyModel.findOne({ name: name }).populate('categories');
  }

  async findAll(): Promise<StoryInterface[]> {
    return this.storyModel.find();
  }

  async addCateToStory(storyId, categoryId) {
    return this.storyModel.findByIdAndUpdate(
      storyId,
      { $push: { categories: categoryId } },
      { new: true, useFindAndModify: false },
    );
  }
}
