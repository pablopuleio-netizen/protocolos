import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Visit } from './visit.entity'
import { VisitsController } from './visits.controller'
import { VisitsService } from './visits.service'
import { VisitProceduresModule } from './visit-procedures.module'

@Module({
  imports: [TypeOrmModule.forFeature([Visit]), VisitProceduresModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}