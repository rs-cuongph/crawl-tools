import { Injectable, Catch } from '@nestjs/common';
import * as pupperteer from 'puppeteer';
import { LogSubscribe } from './socket.provider';
import { CategoryService } from './modules/category/category.service';
import moment = require('moment');

@Injectable()
export class AppService {
  constructor(private cateService: CategoryService) {}
  getHello(): string {
    return 'Hello World!';
  }

  async saveCate(options) {
    const browser = await pupperteer.launch({
      headless: options.headless === 'true' ? true : false,
      // executablePath: '/usr/bin/google-chrome'
    });
    // try {
    LogSubscribe.next('Open Browser');
    const page = await browser.newPage();
    // if(options.action == 'stop') {
    //   LogSubscribe.next('Stop process');
    //   await pupperteer.
    // } else {
    LogSubscribe.next('Go to website: ' + options.url);
    await page.goto(options.url);
    // await page.waitForNavigation({ waitUntil: 'networkidle0' });
    // await this.step1(page);
    await this.step2(page);
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
  async step1(page: any): Promise<any> {
    const arrayElement = await page.$$(
      '.dropdown-menu.megamenu li div.clearfix ul.nav li a',
    );
    try {
      LogSubscribe.next('Start step 1');
      for (const element of arrayElement) {
        await new Promise(async resolve => {
          const text = await page.evaluate(
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
  async step2(page) {
    LogSubscribe.next('Start step 2');
    const arrCateDB = await this.cateService.findAll();
    let temp = 0;
    for (const cate of arrCateDB) {
      if (temp === 0) {
        await page.hover('.dropdown');
        const elWithText = await page.$x(`//a[contains(., "${cate['name']}")]`);
        elWithText[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        // await page.reload();
        const elDescription = await page.$('.description .info');
        const description = await page.evaluate(
          element => element.textContent,
          elDescription,
        );
        // console.log('AppService -> constructor -> description', description);
        // await this.cateService.createOrUpdate(cate['name'], {
        //   description: description,
        //   updated_at: moment()
        //     .local()
        //     .format('YYYY-MM-DDTHH:mm:ss.sssZ'),
        // });
        await this.step3(page);
        await page.waitFor(1000);
      }
      temp++;
    }
  }
  //get information story
  async step3(page) {;
    page.on('console', msg => {
      for (let i = 0; i < msg.args.length; ++i)
        console.log(`${i}: ${msg.args[i]}`);
    });
    await page.evaluate(() => {
      
      document.querySelectorAll('.item .image').forEach(element => {
        const title = element.querySelector('a').title.replace('Truyện tranh', '');
        const banner = element.querySelector('a img')['src'];
        console.log(title, banner);
      })
    })
  } 
}
