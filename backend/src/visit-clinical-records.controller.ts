import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { VisitClinicalRecordsService } from './visit-clinical-records.service'

@Controller('visits/:visitId/clinical-record')
export class VisitClinicalRecordsController {
  constructor(private readonly records: VisitClinicalRecordsService) {}

  @Get()
  findOrCreate(@Param('visitId', new ParseUUIDPipe()) visitId: string) {
    return this.records.findOrCreate(visitId)
  }

  @Patch()
  update(
    @Param('visitId', new ParseUUIDPipe()) visitId: string,
    @Body() body: unknown,
  ) {
    return this.records.update(visitId, body)
  }
}