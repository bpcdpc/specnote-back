import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EndpointsService } from './endpoints.service';

@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @Get()
  findAll() {
    return this.endpointsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.endpointsService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.endpointsService.remove(+id);
  }
}
