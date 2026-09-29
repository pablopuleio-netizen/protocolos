import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import { ParticipantsService } from './participants.service'

@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}

  @Get()
  findAll() {
    return this.participants.findAll()
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.participants.findOne(id)
  }
}