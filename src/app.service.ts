import { Injectable, Catch } from '@nestjs/common';
import * as pupperteer from 'puppeteer';
import { LogSubscribe } from './socket.provider';
import { CategoryService } from './modules/category/category.service';

@Injectable()
export class AppService {
  constructor(private cateService: CategoryService){};
  getHello(): string {
    return 'Hello World!';
  }

  saveCate(options) {
    return new Promise(async(resolve) => {
      const browser = await pupperteer.launch({
        headless: options.headless === 'true' ? true : false,
        // executablePath: '/usr/bin/google-chrome'
      });
      try {
        LogSubscribe.next('Open Browser');
        const page = await browser.newPage();
        console.log(options.action);
        // if(options.action == 'stop') {
        //   LogSubscribe.next('Stop process');
        //   await pupperteer.
        // } else {
          LogSubscribe.next('Go to website: ' + options.url);
          await page.goto(options.url);
          // const result = await page.evaluateHandle(() => {
          //   return document.querySelectorAll('.dropdown-menu.megamenu li div.clearfix ul.nav li a')
          // })
          this.step1(page);
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
          setTimeout(() => {
            LogSubscribe.next('Close Browser');
            browser.close();
          }, 10000);
        // }
        resolve(true);
      } catch (e) {
        LogSubscribe.next('PROCESS FAIL!');
        browser.close();
        resolve(false);
    }
      
    })
  }
  //save Category
  async step1(page: any): Promise<any> {
    const arrayElement = await page.$$(".dropdown-menu.megamenu li div.clearfix ul.nav li a");
    arrayElement.forEach(async element => {
      const text = await page.evaluate(element => element.textContent, element);
      console.log(text.trim());
      const resultFind = this.cateService.find(text.trim());
      console.log(resultFind)
      // if(resultFind) {
        
      //   // this.cateService.update();
      // } else {
      //   this.cateService.create({
      //     name: text.trim(),
      //     description: "null"
      //   })
      // }
    });
   
    return ;
  }
}
