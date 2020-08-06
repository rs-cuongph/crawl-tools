import {
    compose,
    composeAsync,
    extractNumber,
    enforceHttpsUrl,
    fetchHtmlFromUrl,
    extractFromElems,
    fromPairsToObject,
    fetchElemInnerText,
    fetchElemAttribute,
} from './helper';
import * as lodash from 'lodash';
import { CategoryService } from 'src/modules/category/category.service';
import { StoryService } from 'src/modules/story/story.service';
import { ChapterService } from 'src/modules/chapter/chapter.service';
import { Injectable } from '@nestjs/common';
@Injectable()
export class CrawService {
    constructor(
        private cateService: CategoryService,
        private storyService: StoryService,
        private chapterService: ChapterService,
    ) {}
    SCOTCH_BASE = 'http://truyenchon.com';
    RelativeUrl(url) {
        return lodash.isString(url)
            ? `${this.SCOTCH_BASE}${url.replace(/^\/*?/, '/')}`
            : null;
    }
    async initCrawl() {
        const $ = await fetchHtmlFromUrl(this.RelativeUrl('the-loai/action'));
        this.getCateElements($);
    }

    async getCateElements($) {
        const categoriesEl = [];
        const categories = [];
        $('.cmszone .nav li').each(async (index, element) => {
            categoriesEl.push($(element));
        });
        categoriesEl.shift();
        for (const element of categoriesEl) {
            await new Promise(async resolve => {
                const txt = fetchElemInnerText(element.find('a'));
                const link = fetchElemAttribute('href')(element.find('a'));
                const category = await this.cateService.createOrUpdate(txt, {
                    name: txt,
                });
                categories.push({ txt, link, idCate: category._id });
                resolve();
            });
        }
        // console.log('CrawService -> getCateElements -> categories', categories);
        for (const category of categories) {
            await new Promise(async resolve => {
                await this.getStoryElement(category);
                resolve();
            });
        }
    }

    async getStoryElement(categoryObj: any): Promise<any> {
        return new Promise<any>(async resolve => {
            const $ = await fetchHtmlFromUrl(categoryObj.link);
            const storyElements = [];
            const stories = [];
            $('.items .item').each(async (index, element) => {
                storyElements.push($(element));
            });
            storyElements.map(async element => {
                const title = fetchElemAttribute('title')(
                    element.find('.image a'),
                );
                const link = fetchElemAttribute('href')(
                    element.find('.image a'),
                );
                const banner = fetchElemAttribute('data-original')(
                    element.find('.image a img'),
                );
                stories.push({ title, link, banner });
            });
            for (const story of stories) {
                await new Promise(async resolve => {
                    await this.getStoryDetails(story);
                    resolve();
                });
            }
            resolve();
        });
    }
    async getStoryDetails(storyObj: any) {
        return new Promise(async resolve => {
            const $ = await fetchHtmlFromUrl(storyObj.link);
            const author = fetchElemInnerText(
                $('#item-detail').find(
                    '.detail-info .list-info .author p:last-child',
                ),
            );
            const description = fetchElemInnerText(
                $('#item-detail').find(
                    ' .detail-info .list-info .status p:last-child',
                ),
            );
            const status = fetchElemInnerText(
                $('#item-detail').find('.detail-content p:last-child'),
            );
            const story = await this.storyService.createOrUpdate(
                storyObj.title,
                {
                    name: storyObj.title,
                    banner: storyObj.banner,
                    categoryId: storyObj.idCate,
                    author: author,
                    description: description,
                    status: status,
                },
            );
            const listChapter = $('#nt_listchapter nav ul li');
            for (const [index, element] of listChapter.entries()) {
                await new Promise(async resolve => {
                    if (
                        fetchElemAttribute('class')(element) !== 'row heading'
                    ) {
                        const link = fetchElemAttribute('href')(
                            element.find('chapter a'),
                        );
                        await this.getChapterElement({
                            link,
                            idStory: story._id,
                            index,
                        });
                    }
                    resolve();
                });
            }
            resolve();
        });
    }

    async getChapterElement(chapterObj) {
        const $ = await fetchHtmlFromUrl(chapterObj.link);
    }
}
