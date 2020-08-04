import { IsMongoId, IsString, IsArray } from 'class-validator';

export class ChapterInterface {
  @IsString() @IsMongoId() _id: string;
  @IsString() @IsMongoId() idStory: string;
  @IsString() name: string;
  @IsArray() images: Array<string>;
  @IsString() created_at: string;
  @IsString() updated_at: string;
}
