import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Participant } from './participant.entity'

@Injectable()
export class ParticipantsService {
  constructor(
    @InjectRepository(Participant)
    private readonly participants: Repository<Participant>,
  ) {}

  findAll() {
    return this.participants.find({ order: { studyCode: 'ASC', code: 'ASC' } })
  }

  async findOne(id: string) {
    const participant = await this.participants.findOne({
      where: { id },
      relations: { visits: true },
    })

    if (!participant) {
      throw new NotFoundException(`Participant ${id} was not found`)
    }

    return participant
  }
}