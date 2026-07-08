import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  findAll() {
    return `This action returns all ai`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ai`;
  }

  remove(id: number) {
    return `This action removes a #${id} ai`;
  }
}
