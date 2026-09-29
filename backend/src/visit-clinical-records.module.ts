import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Visit } from './visit.entity'
import { VisitClinicalRecord } from './visit-clinical-record.entity'
import { VisitClinicalRecordsController } from './visit-clinical-records.controller'
import { VisitClinicalRecordsService } from './visit-clinical-records.service'

@Module({
  imports: [TypeOrmModule.forFeature([VisitClinicalRecord, Visit])],
  controllers: [VisitClinicalRecordsController],
  providers: [VisitClinicalRecordsService],
})
export class VisitClinicalRecordsModule {}