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
  // @Post('tool/get-category')
  // getCate(@Req() req, @Res() res) {

  // }
  @Post('tool/start')
  async start(@Req() req, @Res() res) {
    const action =  req.body.action;
    console.log(req.body);
    LogSubscribe.next(action == 'start' ? 'Start Crawl': 'Stop Crawl');
    const options = {
      action,
      headless: req.body.headless,
      url: req.body.url
    };
    res.status(201).json({
      status: 200
    })
    await this.appService.step0(options);
  }
}
