import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CateDto } from './dto/category.dto';
import { Model } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CategoryInterface } from './interface/category.interface';
@Injectable()
export class CategoryService {
    constructor(@InjectModel('categories') private cateModel: Model<Category>) {}

    async create(CateObj: CateDto): Promise<CategoryInterface> {
        const createdCate = new this.cateModel(CateObj);
        const saveCate = await createdCate.save();
        console.log(saveCate);
        return saveCate.toObject({ versionKey: false })
    }

    async update(_id: string, cate: CateDto): Promise<CategoryInterface> {
        const changes = cate;
        return this.cateModel.findOneAndUpdate({ _id: _id }, { ...changes }, { new: true });
    }

    async find(name: string): Promise<CategoryInterface[]> {
        const result = this.cateModel.findOne({name: name});
        console.log(result)
        return result;
    }
}
