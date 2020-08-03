import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as moment from 'moment';
import { Category } from 'src/modules/category/schemas/category.schema';
@Schema()
export class Story extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'categories' })
    categories : Array<Category>;

    @Prop()
    name: string;

    @Prop()
    banner: string;

    @Prop()
    author: string;

    @Prop()
    View: string;

    @Prop()
    rate: number;
    //status = 0 => chua hoan thanh , 1 => hoan thanh
    @Prop()
    status: number;

    @Prop()
    description: string;

    @Prop()
    follower: number;

    @Prop({
        default: moment()
          .local()
          .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    })
    created_at: string;
    
    @Prop({
    default: moment()
        .local()
        .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
    })
    updated_at: string;


}
export const StorySchema = SchemaFactory.createForClass(Story);
