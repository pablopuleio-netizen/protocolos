import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common'
import { VisitsService } from './visits.service'

@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get()
  findAll(
    @Query('date') date?: string,
    @Query('studyCode') studyCode?: string,
    @Query('doctor') doctor?: string,
  ) {
    return this.visits.findAll({ date, studyCode, doctor })
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.visits.findOne(id)
  }

  @Patch(':id/arrival')
  registerArrival(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.visits.registerArrival(id)
  }
}