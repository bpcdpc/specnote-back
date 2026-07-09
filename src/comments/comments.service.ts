import { Injectable } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MentionsService } from './mentions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { MoveCommentDto } from './dto/move-comment.dto';
import type { CommentTree, ReplyParent } from './comments.type';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mentionsService: MentionsService,
  ) {}

  // GET /endpoints/:id/comments — 전체 댓글 목록(2뎁스 트리)
  async findComments(
    userId: number,
    endpointId: number,
  ): Promise<CommentTree[]> {
    // TODO
    // 1. 해당 endpoint 의 댓글 전량 조회 (삭제 포함, 작성자/리액션/멘션 조인)
    // 2. CommentView 로 매핑 — 삭제 댓글 content 는 "삭제된 댓글입니다" 로 마스킹
    //    reactions 는 ReactionSummary[] 로 집계, reactedByMe 는 userId 기준
    // 3. parentId 로 최상위/대댓글 갈라 CommentTree[] 조립 (2뎁스 고정, 시간순)
    throw new Error('not implemented');
  }

  // POST /endpoints/:id/comments — 최상위 댓글
  async createComment(
    userId: number,
    endpointId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // TODO
    // 1. parentId=null 로 댓글 생성 (트랜잭션으로 묶지 않음 — 멘션 실패로 본문 날리지 않기 위해)
    // 2. mentionsService.syncMemberMentions / syncEndpointMentions 호출
    throw new Error('not implemented');
  }

  // POST /comments/:id/replies — 대댓글
  async createReply(
    userId: number,
    parentId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // TODO
    // 1. normalizeReply(parentId) → { parentId, endpointId } (2뎁스 고정 + endpointId 상속)
    // 2. 댓글 생성 후 멘션 sync (createComment 와 동일)
    throw new Error('not implemented');
  }

  // PATCH /comments/:id — 수정 (작성자 본인, content 만)
  async updateComment(
    userId: number,
    commentId: number,
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    // TODO: 댓글 조회 → assertAuthor(comment, userId) → content update
    throw new Error('not implemented');
  }

  // DELETE /comments/:id — 소프트 삭제 (작성자 본인)
  async softDeleteComment(userId: number, commentId: number): Promise<Comment> {
    // TODO: 댓글 조회 → assertAuthor → isDeleted=true → 마스킹된 형태로 반환 (0-7)
    throw new Error('not implemented');
  }

  // PATCH /comments/:id/move — 스레드 이동 [Owner]
  async moveThread(
    ownerId: number,
    commentId: number,
    dto: MoveCommentDto,
  ): Promise<void> {
    // TODO
    // [tx 밖 선검증]
    //  1. comment 조회(projectId 확보). parentId != null 이면 거부 (최상위만 이동)
    //  2. targetEndpoint 조회 — 없거나 isDeleted → BadRequest
    //     targetEndpoint.projectId !== comment.projectId → Forbidden
    // [tx]
    //  3. 최상위 + 대댓글 endpointId 를 targetEndpointId 로 일괄 갱신
    throw new Error('not implemented');
  }

  // update/softDelete 공용: 작성자 본인 아니면 403
  private assertAuthor(comment: Comment, userId: number): void {
    // TODO: comment.userId !== userId 면 ForbiddenException
    throw new Error('not implemented');
  }

  // parentId 정규화: 넘어온 게 대댓글이면 그 부모(최상위)로 승격 + endpointId 상속 (FR-6.2)
  private async normalizeReply(parentId: number): Promise<ReplyParent> {
    // TODO: parent 조회 → parent.parentId 있으면 그 값으로 승격, endpointId 함께 반환
    throw new Error('not implemented');
  }
}
