import { Controller, Get, Render, Post, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { LogSubscribe } from './socket.provider';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Render('index')
  root() {
    return { message: 'Hello world!' };
  }
  @Post('tool/get-cate')
  async getCate(@Req() req, @Res() res) {
    const options = {
      headless: req.body.headless,
      url: req.body.url,
    };
    LogSubscribe.next('Đang thu thập danh sách danh mục');
    const result = await this.appService.getCate(options);
    return res.status(200).json({
      status: 200,
      data: result,
    });
  }
  @Post('tool/start')
  async start(@Req() req, @Res() res) {
    const options = {
      headless: req.body.headless,
      url: req.body.url,
      category: req.body.category,
    };

    res.status(201).json({
      status: 200,
    });
    await this.appService.step0(options);
  }
}
