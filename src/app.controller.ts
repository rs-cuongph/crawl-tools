import { Controller, Get, Render, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { LogSubscribe } from './services/socket';
import { PupperteerService } from './services/pupperteer';
import { CrawService } from './services/crawl';
import { sendResponse } from './services/helper';

@Controller()
export class AppController {
    constructor(
        private crawService: CrawService,
        private readonly appService: AppService,
        private readonly pupperteer: PupperteerService,
    ) {}

    @Get('/')
    @Render('index')
    index() {}

    @Post('pupperteer/get-cate')
    async getCate(@Req() req, @Res() res) {
        const options = {
            headless: req.body.headless,
            url: req.body.url,
        };
        LogSubscribe.next('Đang thu thập danh sách danh mục');
        const result = await this.pupperteer.getCate(options);
        return res.status(200).json({
            status: 200,
            data: result,
        });
    }

    @Post('pupperteer/start')
    async start(@Req() req, @Res() res) {
        const options = {
            headless: req.body.headless,
            url: req.body.url,
            category: req.body.category,
        };

        res.status(201).json({
            status: 200,
        });
        await this.pupperteer.step0(options);
    }

    @Get('test')
    async test(@Res() res) {
        // sendResponse(res)(this.crawService.crawlCate());
        this.crawService.initCrawl();
        // console.log('AppController -> test -> dom', dom);
        res.status(201).json({});
    }
}
