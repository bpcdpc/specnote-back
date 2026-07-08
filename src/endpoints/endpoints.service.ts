import { Injectable } from '@nestjs/common';

@Injectable()
export class EndpointsService {
  findAll() {
    return `This action returns all endpoints`;
  }

  findOne(id: number) {
    return `This action returns a #${id} endpoint`;
  }

  remove(id: number) {
    return `This action removes a #${id} endpoint`;
  }
}
