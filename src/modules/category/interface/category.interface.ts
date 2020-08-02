import { IsString, IsMongoId } from 'class-validator';

export class CategoryInterface {
    @IsString() @IsMongoId() _id: string;
    @IsString() name: string;
    @IsString() description: string;
    @IsString() updated_at?: string;
}