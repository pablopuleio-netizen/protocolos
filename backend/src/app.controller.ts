import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'cemedic-backend',
    }
  }

  @Get('health/db')
  async databaseHealth() {
    try {
      await this.dataSource.query('SELECT 1')
      return {
        status: 'ok',
        database: 'connected',
      }
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
      })
    }
  }
}