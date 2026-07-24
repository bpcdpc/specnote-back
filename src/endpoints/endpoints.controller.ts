import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipGuard } from '../common/guards/membership.guard';
import { ProjectScope } from '../common/decorators/project-scope.decorator';
import { EndpointsService } from './endpoints.service';
import { ProjectRole } from '../common/decorators/project-role.decorator';
import { ROLE } from '@prisma/client';
import { CurrentProjectId } from '../common/decorators/current-project-id.decorator';
import { MoveCommentDto } from '../comments/dto/move-comment.dto';
import { CommentsService } from '../comments/comments.service';

@ApiTags('endpoints')
@ApiBearerAuth()
// 계층 3: :id 가 endpointId 일경우
// MembershipGuard 가 @ProjectScope 로 projectId 를 찾아야 함
@UseGuards(JwtAuthGuard, MembershipGuard)
@Controller('endpoints')
export class EndpointsController {
  constructor(
    private readonly endpointsService: EndpointsService,
    private readonly commentsService: CommentsService
  ) {}

  @ApiOperation({ summary: '엔드포인트 상세' })
  @ProjectScope('endpoint')
  @Get(':id')
  findEndpointDetail(@Param('id', ParseIntPipe) id: number) {
    return this.endpointsService.findEndpointDetail(id);
  }

  @ApiOperation({ summary: '[Owner] 엔드포인트 댓글 일괄 이동' })
  @ProjectScope('endpoint')
  @ProjectRole(ROLE.OWNER)
  @Patch(':id/comments/move')
  moveComments(
    @Param('id', ParseIntPipe) endpointId: number,
    @CurrentProjectId() projectId: number,
    @Body() dto: MoveCommentDto,
  ) {
    return this.commentsService.moveComments(endpointId, projectId, dto);
  }
}
