import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLE } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipGuard } from '../common/guards/membership.guard';
import { ProjectScope } from '../common/decorators/project-scope.decorator';
import { ProjectRole } from '../common/decorators/project-role.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type AuthUser } from '../common/types/auth.type';
import { CommentsService } from './comments.service';
import { ReactionsService } from './reactions.service';
import { AiSummaryService } from './ai-summary.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { MoveCommentDto } from './dto/move-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';

// 라우트가 두 종류의 base path 를 가짐 → 컨트롤러 데코의 경로는 비우고
// 각 메서드에서 전체 경로를 지정한다. (endpoints/:id/... 와 comments/:id/... 혼재)
//
// 계층 3 공통: JwtAuthGuard + MembershipGuard. 단 @ProjectScope 대상이 라우트마다 다름
//  - :id 가 endpointId 인 라우트 → @ProjectScope('endpoint')
//  - :id 가 commentId  인 라우트 → @ProjectScope('comment')
@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, MembershipGuard)
@Controller()
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly reactionsService: ReactionsService,
    private readonly aiSummaryService: AiSummaryService,
  ) {}

  // ── :id = endpointId (@ProjectScope('endpoint')) ──

  @ApiOperation({ summary: '댓글 목록' })
  @ProjectScope('endpoint')
  @Get('endpoints/:id/comments')
  findComments(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) endpointId: number,
  ) {
    return this.commentsService.findComments(user.id, endpointId);
  }

  @ApiOperation({ summary: '최상위 댓글 작성' })
  @ProjectScope('endpoint')
  @Post('endpoints/:id/comments')
  createComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) endpointId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(user.id, endpointId, dto);
  }

  @ApiOperation({ summary: '스레드 AI 요약' })
  @ProjectScope('endpoint')
  @Post('endpoints/:id/ai-summary')
  summarizeThread(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) endpointId: number,
  ) {
    return this.aiSummaryService.summarizeThread(user.id, endpointId);
  }

  // ── :id = commentId (@ProjectScope('comment')) ──

  @ApiOperation({ summary: '대댓글 작성' })
  @ProjectScope('comment')
  @Post('comments/:id/replies')
  createReply(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) parentId: number,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createReply(user.id, parentId, dto);
  }

  @ApiOperation({ summary: '댓글 수정 (작성자 본인)' })
  @ProjectScope('comment')
  @Patch('comments/:id')
  updateComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(user.id, id, dto);
  }

  @ApiOperation({ summary: '댓글 삭제 (작성자 본인, 소프트)' })
  @ProjectScope('comment')
  @Delete('comments/:id')
  softDeleteComment(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commentsService.softDeleteComment(user.id, id);
  }

  @ApiOperation({ summary: '[Owner] 스레드 이동' })
  @ProjectScope('comment')
  @ProjectRole(ROLE.OWNER)
  @Patch('comments/:id/move')
  moveThread(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveCommentDto,
  ) {
    return this.commentsService.moveThread(user.id, id, dto);
  }

  @ApiOperation({ summary: '리액션 토글' })
  @ProjectScope('comment')
  @Post('comments/:id/reactions')
  toggleReaction(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReactionDto,
  ) {
    return this.reactionsService.toggleReaction(user.id, id, dto);
  }
}
