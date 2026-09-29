import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'HEAD', 'OPTIONS', 'PATCH'],
  })

  await app.listen(Number(process.env.PORT ?? 3000))
}

void bootstrap()