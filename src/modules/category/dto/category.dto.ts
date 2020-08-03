import { Story } from "src/modules/story/schema/story.schema";

export class CateDto {
    name?: string;
    storys?: Array<Story>;
    description?: string;
    updated_at?: string;
}

