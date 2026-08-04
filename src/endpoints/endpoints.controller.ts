import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipGuard } from '../common/guards/membership.guard';
import { ProjectScope } from '../common/decorators/project-scope.decorator';
import { EndpointsService } from './endpoints.service';

@ApiTags('endpoints')
@ApiBearerAuth()
// 계층 3: :id 가 endpointId 일경우
// MembershipGuard 가 @ProjectScope 로 projectId 를 찾아야 함
@UseGuards(JwtAuthGuard, MembershipGuard)
@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @ApiOperation({ summary: '엔드포인트 상세' })
  @ProjectScope('endpoint')
  @Get(':id')
  findEndpointDetail(@Param('id', ParseIntPipe) id: number) {
    return this.endpointsService.findEndpointDetail(id);
  }
}
