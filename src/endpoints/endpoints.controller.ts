import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipGuard } from '../common/guards/membership.guard';
import { ProjectScope } from '../common/decorators/project-scope.decorator';
import { EndpointsService } from './endpoints.service';
import { CurrentProjectId } from '../common/decorators/current-project-id.decorator';

@ApiTags('endpoints')
@ApiBearerAuth()
// 계층 3: :id 가 endpointId 일경우
// MembershipGuard 가 @ProjectScope 로 projectId 를 찾아야 함
@UseGuards(JwtAuthGuard, MembershipGuard)
@Controller('endpoints')
export class EndpointsController {
  constructor(private readonly endpointsService: EndpointsService) {}

  @ApiOperation({ summary: '엔드포인트 상세' })
  // @ApiQuery({
  //   name: 'snapshotId',
  //   required: false,
  //   type: Number,
  //   description:
  //     '값을 지정하면 그 스냅샷 기준으로 응답. 없거나 최신보다 높으면 최신으로 응답',
  // })
  @ProjectScope('endpoint')
  @Get(':id')
  findEndpointDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentProjectId() projectId: number,
    @Query('snapshotId', new ParseIntPipe({ optional: true }))
    snapshotId?: number,
  ) {
    return this.endpointsService.findEndpointDetail(id, projectId, snapshotId);
  }
}
