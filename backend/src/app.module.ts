import { resolve } from 'node:path'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm'
import { AppController } from './app.controller'
import { Participant } from './participant.entity'
import { ParticipantsModule } from './participants.module'
import { SystemCheck } from './system-check.entity'
import { Visit } from './visit.entity'
import { VisitsModule } from './visits.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '../.env'),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(config.get<string>('DATABASE_PORT', '5432')),
        database: config.get<string>('DATABASE_NAME', 'cemedic'),
        username: config.get<string>('DATABASE_USER', 'cemedic'),
        password: config.get<string>('DATABASE_PASSWORD', 'cemedic_dev'),
        entities: [SystemCheck, Participant, Visit],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    ParticipantsModule,
    VisitsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}