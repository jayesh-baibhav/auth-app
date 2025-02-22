import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import * as fastifyCookie from '@fastify/cookie';
import * as fastifySession from '@fastify/secure-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Get Fastify instance
  const fastifyInstance = app.getHttpAdapter().getInstance();

  // Single registration of each middleware
  await fastifyInstance.register(fastifyCookie);
  await fastifyInstance.register(fastifySession, {
    key: Buffer.from('11ac4b87b3b27b5d0b15ba4596abf6cc784a22440539369239c94b8d7bf52b23', 'hex'),
    cookie: {
      path: '/',
      httpOnly: true,
    },
  });

  fastifyInstance.addHook('onRequest', (request, reply, done) => {
    (reply as any).setHeader = function (key: string, value: string) {
      return this.header(key, value);
    };
    (reply as any).end = function () {
      return this.send();
    };
    (request as any).res = reply;
    done();
  });

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
