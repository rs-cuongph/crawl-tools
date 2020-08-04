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

  async saveCate(options) {
    this.browser = await pupperteer.launch({
      headless: options.headless === 'true' ? true : false,
      // executablePath: '/usr/bin/google-chrome'
    });
    // try {
    LogSubscribe.next('Open Browser');
    this.page = await this.browser.newPage();
    this.page.on('console', msg => {
      for (let i = 0; i < msg.args.length; ++i)
        console.log(`${i}: ${msg.args[i]}`);
    });
    // if(options.action == 'stop') {
    //   LogSubscribe.next('Stop process');
    //   await pupperteer.
    // } else {
    LogSubscribe.next('Go to website: ' + options.url);
    await this.page.goto(options.url);
    // await page.waitForNavigation({ waitUntil: 'networkidle0' });
    // await this.step1();
    await this.step2();
    // const listCateDom = await page.evaluate(() => {
    //   // return document.body.querySelectorAll('.dropdown-menu.megamenu li div.clearfix');
    //   return {
    //           'cate': document.querySelector('.dropdown-menu.megamenu li div.clearfix') as HTMLInputElement,
    //           'body': document.body.innerText
    //       };
    //   });
    // let cate = await page.$('.dropdown-menu.megamenu li div.clearfix');
    // console.log('body:', listCateDom);
    // const source = await page.content();
    // console.log(source);
    // setTimeout(() => {
    //   LogSubscribe.next('Close Browser');
    //   browser.close();
    // }, 10000);
    // // }
    // } catch (e) {
    //   LogSubscribe.next('PROCESS FAIL!');
    //   browser.close();
    // }
  }
  //save Category
  async step1(): Promise<any> {
    const arrayElement = await this.page.$$(
      '.dropdown-menu.megamenu li div.clearfix ul.nav li a',
    );
    try {
      LogSubscribe.next('Start step 1');
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
          resolve();
        });
      }
    } catch (e) {}
  }
  //get story
  async step2() {
    return new Promise<any>(async resolve => {
      LogSubscribe.next('Start step 2');
      const arrCateDB = await this.cateService.findAll();
      let temp = 0;
      for (const cate of arrCateDB) {
        if (temp === 0) {
          await this.page.waitForSelector('.dropdown');
          await this.page.hover('.dropdown');
          await this.page.waitForSelector('.dropdown.open');
          const elWithText = await this.page.$x(
            `//a[contains(., "${cate['name']}")]`,
          );
          elWithText[0].click();
          await this.page.waitForSelector('.description .info');
          // await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
          // await this.page.reload();
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
        }
        temp++;
      }
      resolve();
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
    for (let i = 0; i <= 2 || Math.floor(stories.length / this.loop); i++) {
      await new Promise(async resolve => {
        if (i == Math.floor(stories.length / this.loop)) {
          for (let j = 0; j < stories.length % this.loop; j++) {
            console.log(stories[i * 5 + j], i * 5 + j);
            // newPage[i] = await this.browser.newPage();
            // await newPage[i].goto('https://google.com');
          }
        } else {
          let newPage = 0;
          const listPromise = [];
          for (let j = 0; j < this.loop; j++) {
            console.log(stories[i * 5 + j], i * 5 + j);
            listPromise.push(this.step4(stories[i * 5 + j], idCate));
          }
          if (newPage == 0) {
            await Promise.all(listPromise);
            newPage++;
          }
        }
        resolve();
      });
    }
  }

  async step4(storyObj, idCate) {
    return new Promise(async resolve => {
      const page = await this.browser.newPage();
      await page.goto(storyObj.link, {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });
      const storyService = this.storyService;
      const dataStory = await this.page.evaluate(async () => {
        const author = document.querySelector('.list-info .author p:last-child')
          .textContent;
        const status = document.querySelector('.list-info .status p:last-child')
          .textContent;
        const description = document.querySelector('.detail-content p')
          .textContent;
        return { author, status, description };
      });
      console.log('AppService -> dataStory', dataStory);
      // const story = await storyService.createOrUpdate(storyObj.name, {
      //   name: storyObj.name,
      //   banner: storyObj.banner,
      //   categoryId: idCate,
      //   author: dataStory.author,
      //   description: dataStory.description,
      //   status: dataStory.status,
      // });
      // console.log('AppService -> story', story);
      // const listChapter = await this.page.evaluate(async story => {
      //   const list = [];
      //   document.querySelectorAll('.list-chapter nav ul li').forEach(element => {
      //     if (!element.classList.contains('heading')) {
      //       const linkChapter = element.querySelector('.chapter a')['href'];
      //       const nameChapter = element.querySelector('.chapter a').textContent;
      //       list.push({
      //         linkChapter,
      //         nameChapter,
      //         idStory: story._id,
      //       });
      //     }
      //   });
      //   return list;
      // }, story);
      // for (const index in listChapter.reverse()) {
      //   await new Promise(async resolve => {
      //     await this.step5(this.page, listChapter[index]);
      //     resolve();
      //   });
      // }
      resolve('loaded');
    });
  }

  async step5(page, dataChapter) {
    await page.goto(dataChapter.linkChapter);
    const listImagesChapter = await this.page.evaluate(async () => {
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
    // console.log('AppService -> listImagesChapter', listImagesChapter);

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
  }
}
