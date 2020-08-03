import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as moment from 'moment';
import { Story } from 'src/modules/story/schema/story.schema';

@Schema()
export class Chapter extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Story' })
    idStory : Story;

    @Prop()
    name: string;

    @Prop()
    images: Array<String>;

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
export const ChapterSchema = SchemaFactory.createForClass(Chapter);
