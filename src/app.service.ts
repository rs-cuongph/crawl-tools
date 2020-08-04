import { Injectable, Catch } from '@nestjs/common';
import * as pupperteer from 'puppeteer';
import { LogSubscribe } from './socket.provider';
import { CategoryService } from './modules/category/category.service';
import moment = require('moment');
import { StoryService } from './modules/story/story.service';
import { ChapterService } from './modules/chapter/chapter.service';

@Injectable()
export class AppService {
  page: any;
  browser: any;
  loop: number = 5;
  constructor(
    private cateService: CategoryService,
    private storyService: StoryService,
    private chapterService: ChapterService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }

  async step0(options) {
    this.browser = await pupperteer.launch({
      headless: options.headless === 'true' ? true : false,
      // executablePath: '/usr/bin/google-chrome'
    });
    try {
      LogSubscribe.next('Mở chromenium');
      this.page = await this.browser.newPage();
      this.page.on('console', msg => {
        for (let i = 0; i < msg.args.length; ++i)
          console.log(`${i}: ${msg.args[i]}`);
      });
      LogSubscribe.next('đi đến link: ' + options.url);
      await this.page.goto(options.url);
      await this.step1();
      await this.step2();
      LogSubscribe.next('thu thập dữ liệu hoàn tất. đóng browser');
      await this.browser.close();
    } catch(e) {
      LogSubscribe.next('đã có lỗi xảy ra: ' + e);
    }
  }
  //save Category
  async step1(): Promise<any> {
    const arrayElement = await this.page.$$(
      '.dropdown-menu.megamenu li div.clearfix ul.nav li a',
    );
    try {
      LogSubscribe.next('Lấy danh sách category và lưu db');
      for (const element of arrayElement) {
        await new Promise(async resolve => {
          const text = await this.page.evaluate(
            element => element.textContent,
            element,
          );
          if (text.trim() != 'Tất cả') {
            await this.cateService.createOrUpdate(text.trim(), {
              name: text.trim(),
            });
          }
          resolve('step1: done');
        });
      }
    } catch (e) {}
  }
  //get story
  async step2() {
    return new Promise<any>(async resolve => {
      const arrCateDB = await this.cateService.findAll();
      // let temp = 0;
      for (const cate of arrCateDB) {
        // if (temp === 0) {
          LogSubscribe.next(`Cập nhật chi tiết cho thể loại ${cate['name']}`)
          await this.page.waitForSelector('.dropdown');
          await this.page.hover('.dropdown');
          await this.page.waitForSelector('.dropdown.open');
          const elWithText = await this.page.$x(
            `//a[contains(., "${cate['name']}")]`,
          );
          elWithText[0].click();
          await this.page.waitForSelector('.description .info');
          const elDescription = await this.page.$('.description .info');
          const description = await this.page.evaluate(
            element => element.textContent,
            elDescription,
          );
          const category = await this.cateService.createOrUpdate(cate['name'], {
            description: description,
            updated_at: moment()
              .local()
              .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
          });
          await this.step3(category._id);
          await this.page.waitFor(1000);
        // }
        // temp++;
      }
      resolve('step2: done');
    });
  }
  //get information story
  async step3(idCate) {
    const currentPage = await this.page.$eval(
      '.pagination li.active',
      el => el.innerText,
    );
    const stories = await this.page.evaluate(() => {
      const arr = [];
      document.querySelectorAll('.item .image').forEach(async element => {
        const name = element
          .querySelector('a')
          .title.replace('Truyện tranh', '');
        const banner = element
          .querySelector('a img')
          .getAttribute('data-original');
        const link = element.querySelector('a').href;
        arr.push({
          name,
          banner,
          link,
        });
      });

      return arr;
    });
    for (let i = 0; i <= Math.floor(stories.length / this.loop) ; i++) {
      await new Promise(async resolve => {
        const listPromise = [];
        if (i == Math.floor(stories.length / this.loop)) {
          for (let j = 0; j < stories.length % this.loop; j++) {
            console.log(stories[i * 5 + j], i * 5 + j);
            listPromise.push(this.step4(stories[i * 5 + j], idCate));
          }
        } else {
          for (let j = 0; j < this.loop; j++) {
            console.log(stories[i * 5 + j], i * 5 + j);
            listPromise.push(this.step4(stories[i * 5 + j], idCate));
          }
        }
        await Promise.all(listPromise);
        resolve('step3: done');
      });
    }
  }

  async step4(storyObj, idCate) {
    return new Promise(async resolve => {
      LogSubscribe.next(`Đang thu thập dữ liệu truyện: ${storyObj.name}`);
      const page = await this.browser.newPage();
      await page.goto(storyObj.link, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });
      const dataStory = await page.evaluate(async () => {
        const author = document.querySelector('.list-info .author p:last-child')
          .textContent;
        const status = document.querySelector('.list-info .status p:last-child')
          .textContent;
        const description = document.querySelector('.detail-content p')
          .textContent;
        return { author, status, description };
      });
      const story = await this.storyService.createOrUpdate(storyObj.name, {
        name: storyObj.name,
        banner: storyObj.banner,
        categoryId: idCate,
        author: dataStory.author,
        description: dataStory.description,
        status: dataStory.status,
      });
      console.log('AppService -> story', story);
      LogSubscribe.next(`Đang thu thập số lượng chapter.`);
      const listChapter = await page.evaluate(async story => {
        const list = [];
        document.querySelectorAll('.list-chapter nav ul li').forEach(element => {
          if (!element.classList.contains('heading')) {
            const linkChapter = element.querySelector('.chapter a')['href'];
            const nameChapter = element.querySelector('.chapter a').textContent;
            list.push({
              linkChapter,
              nameChapter,
              idStory: story._id,
            });
          }
        });
        return list;
      }, story);
      LogSubscribe.next(`Hoàn tất lưu dữ liệu truyện: `);
      LogSubscribe.next(`- Tên: ${story.name}`);
      LogSubscribe.next(`- Số lượng chapter: ${listChapter.length}`);
      for (const index in listChapter.reverse()) {
        await new Promise(async resolve => {
          await this.step5(listChapter[index]);
          resolve();
        });
      }
      await page.close();
      resolve('step4: done');
    });
  }

  async step5(dataChapter) {
    return new Promise(async resolve => {
      LogSubscribe.next(`Đang thu thập dữ liệu của chapter: ${dataChapter.nameChapter}`);
      const page = await this.browser.newPage();
      await page.goto(dataChapter.linkChapter, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });
      const listImagesChapter = await page.evaluate(async () => {
        const list = [];
        document
          .querySelectorAll('.reading-detail .page-chapter')
          .forEach(element => {
            const linkImg = element
              .querySelector('img')
              .getAttribute('data-original');
            const nameImg = element.querySelector('img').getAttribute('alt');
            list.push({ linkImg, nameImg });
          });
  
        return list;
      });
      const saveChapter = await this.chapterService.createOrUpdate(
        dataChapter.nameChapter,
        {
          idStory: dataChapter.idStory,
          name: dataChapter.nameChapter,
          images: listImagesChapter,
          updated_at: moment()
            .local()
            .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        },
      );
      console.log('AppService -> saveChapter', saveChapter);
      LogSubscribe.next(`hoàn tất thu thập dữ liệu của chapter: ${saveChapter.name}, đóng tab`);
      await page.close();
      resolve('step5: done');
    });
  }
}
