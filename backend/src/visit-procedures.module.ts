import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Visit } from './visit.entity'
import { VisitProcedure } from './visit-procedure.entity'
import { VisitProceduresController } from './visit-procedures.controller'
import { VisitProceduresService } from './visit-procedures.service'

@Module({
  imports: [TypeOrmModule.forFeature([VisitProcedure, Visit])],
  controllers: [VisitProceduresController],
  providers: [VisitProceduresService],
  exports: [VisitProceduresService],
})
export class VisitProceduresModule {}