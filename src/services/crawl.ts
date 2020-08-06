import {
    compose,
    composeAsync,
    extractNumber,
    enforceHttpsUrl,
    fetchHtmlFromUrl,
    extractFromElems,
    getNumberFromUrl,
    fetchElemInnerText,
    fetchElemAttribute,
} from './helper';
import * as moment from 'moment';
import * as lodash from 'lodash';
import { CategoryService } from 'src/modules/category/category.service';
import { StoryService } from 'src/modules/story/story.service';
import { ChapterService } from 'src/modules/chapter/chapter.service';
import { Injectable } from '@nestjs/common';
import { LogSubscribe } from './socket';

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

    async getCateElements() {
        const $ = await fetchHtmlFromUrl(this.RelativeUrl('the-loai'));
        const categoriesEl = [];
        const categories = [];
        $('.cmszone .nav li').each(async (index, element) => {
            categoriesEl.push($(element));
        });
        categoriesEl.shift();
        LogSubscribe.next('Lấy danh sách category và lưu db');
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
        return this.cateService.findAll();
    }
    async startCrawl(categories: [string]) {
        for (const category of categories) {
            await new Promise(async resolve => {
                LogSubscribe.next(`Cập nhật chi tiết cho thể loại ${category}`);
                await this.getStoryElement(category);
                resolve();
            });
        }
    }
    async getStoryElement(category: any): Promise<any> {
        const linkCate = this.RelativeUrl(`the-loai/${category}`);
        console.log('CrawService -> linkCate', linkCate);
        return new Promise<any>(async resolve => {
            const $ = await fetchHtmlFromUrl(linkCate);
            let currentPage = parseInt(
                fetchElemInnerText($('.pagination li.active a')),
            );
            const totalPages = parseInt(
                getNumberFromUrl($('.pagination li:last-child a')),
            );
            while (currentPage <= totalPages) {
                const _$ = await fetchHtmlFromUrl(
                    categoryObj.link + '?page=' + currentPage,
                );
                const storyElements = [];
                const stories = [];
                _$('.items .item').each(async (index, element) => {
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
                        LogSubscribe.next(
                            `Đang thu thập dữ liệu truyện: ${story.title}`,
                        );
                        await this.getStoryDetails(story);
                        resolve();
                    });
                }
                currentPage++;
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
            LogSubscribe.next(`Đang thu thập số lượng chapter.`);
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
            let indexChapter = listChapter.length;
            LogSubscribe.next(`- Hoàn tất lưu dữ liệu truyện: ${story.name}`);
            LogSubscribe.next(`- Số lượng chapter: ${listChapter.length}`);
            for (const [index, element] of listChapter.entries()) {
                await new Promise(async resolve => {
                    if (
                        fetchElemAttribute('class')(element) !== 'row heading'
                    ) {
                        const link = fetchElemAttribute('href')(
                            element.find('chapter a'),
                        );
                        const nameChapter = fetchElemInnerText(
                            element.find('chapter a'),
                        );
                        await this.getChapterElement({
                            nameChapter,
                            link,
                            idStory: story._id,
                            indexChapter,
                            nameStory: storyObj.title,
                        });
                    }
                    indexChapter--;
                    resolve();
                });
            }
            resolve();
        });
    }

    async getChapterElement(chapterObj) {
        return new Promise(async resolve => {
            LogSubscribe.next(
                `Đang thu thập dữ liệu chapter của truyện: ${chapterObj.nameStory},  ${chapterObj.nameChapter}`,
            );
            const $ = await fetchHtmlFromUrl(chapterObj.link);
            const arrImg = [];
            const listImgElement = $('.reading-detail .page-chapter');
            for (const element of listImgElement) {
                return new Promise(async resolve => {
                    const name = fetchElemAttribute('alt')(element.find('img'));
                    const img = fetchElemAttribute('data-original')(
                        element.find('img'),
                    );
                    arrImg.push({ name, img });
                    resolve();
                });
            }
            const saveChapter = await this.chapterService.createOrUpdate(
                chapterObj.nameChapter,
                {
                    idStory: chapterObj.idStory,
                    name: chapterObj.nameChapter,
                    images: arrImg,
                    updated_at: moment()
                        .local()
                        .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
                },
            );
            LogSubscribe.next(
                `hoàn tất thu thập dữ liệu chapter của truyện: ${chapterObj.nameStory}, ${saveChapter.name}`,
            );
            resolve();
        });
    }
}
