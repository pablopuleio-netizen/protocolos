import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common'
import { VisitProceduresService } from './visit-procedures.service'

type CompleteVisitProcedureBody = {
  performedAt?: string
  recordedBy?: string
}

@Controller()
export class VisitProceduresController {
  constructor(private readonly visitProcedures: VisitProceduresService) {}

  @Get('visits/:visitId/procedures')
  findForVisit(@Param('visitId', new ParseUUIDPipe()) visitId: string) {
    return this.visitProcedures.findForVisit(visitId)
  }

  @Get('visit-procedures/:id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.visitProcedures.findOne(id)
  }

  @Patch('visit-procedures/:id/start')
  start(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.visitProcedures.start(id)
  }

  @Patch('visit-procedures/:id/complete')
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body?: CompleteVisitProcedureBody,
  ) {
    return this.visitProcedures.complete(id, body)
  }
}