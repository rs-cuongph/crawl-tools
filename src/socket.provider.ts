import { Server } from 'ws';
import { Subject } from 'rxjs';
import { Logger } from '@nestjs/common';
export const LogSubscribe = new Subject<string>();
export  const SocketProviders = [
    {
        provide: 'SOCKET_CONNECTION',
        useFactory: async () => {
            const logger = new Logger();
            logger.log('Start socket successfully!', 'Socket');
            const connection = new Server({
                port: 3001,
            });

            connection.on('connection', ws => {
                console.log('CLIENT CONNECTED');
                ws.on('message', data => {
                    console.log(data);
                });
                LogSubscribe.subscribe(data => {
                    console.log('SEND DATA ...');
                    ws.send(data);
                })
            });
        }
    }
]