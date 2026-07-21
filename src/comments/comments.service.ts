import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Comment, Reaction } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { MentionsService } from './mentions.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { MoveCommentDto } from './dto/move-comment.dto';
import type { CommentTree, CommentView, ReactionSummary, ReplyParent } from './comments.type';

const DELETED_COMMENT_TEXT = '삭제된 댓글입니다.';

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
    // 1. 해당 endpoint 의 댓글 전량 조회 (삭제 포함, 작성자/리액션/멘션 조인)
    // 2. CommentView 로 매핑 — 삭제 댓글 content 는 "삭제된 댓글입니다" 로 마스킹
    //    reactions 는 ReactionSummary[] 로 집계, reactedByMe 는 userId 기준
    // 3. parentId 로 최상위/대댓글 갈라 CommentTree[] 조립 (2뎁스 고정, 시간순)

    const comments = await this.prisma.comment.findMany({
      where: {
        endpointId: endpointId,
        parentId: null, // 1. 최상위 댓글만 먼저 조회
      },
      include: {
        user: {
          select: {
            id: true,
            userName: true,
            email: true,
            isAi: true,
          },
        },
        replies: {
          include: {
            //replies: true, // 2. 대댓글 조회 
            user: {
              select: {
                id: true,
                userName: true,
                email: true,
                isAi: true,
              },
            },
            memberMentions: {
              include: {
                mentionedUser: {
                  select: {
                    id: true,
                    userName: true,
                    isAi: true,
                  },
                },
              },
            },
            endpointMentions: {
              include: {
                endpoint: {
                  select: {
                    id: true,
                    path: true,
                    method: true,
                  },
                },
              },
            },
            reactions: true, 
          },
          orderBy: {
            createdAt: 'asc', 
          },
        },
        memberMentions: {
          include: {
            mentionedUser: {
              select: {
                id: true,
                userName: true,
                isAi: true,
              },
            },
          },
        },
        endpointMentions: {
          include: {
            endpoint: {
              select: {
                  id: true,
                  path: true,
                  method: true,
                },
            },
          },
        },
        reactions: true,
      },
      orderBy: {
        createdAt: 'asc', 
      },
    });

    // 3. 리턴타입(CommentTree) 적용하여 리턴
    return comments.map((comment) => this.toCommentTree(userId, comment));
   
  }

  //댓글 포멧(CommentTree) 적용 - 최상위 전용: CommentView + replies
  private toCommentTree(curUserId: number, raw: any): CommentTree {
    return {
      ...(this.toCommentView(curUserId, raw)), 
      replies: (raw.replies??[]).map((reply: any) => this.toCommentView(curUserId, reply)),
    };
  }

  //댓글, 대댓글 포멧(CommentView) 적용 - 공통필드
  private toCommentView(curUserId: number, raw: any): CommentView {
    return {
      id: raw.id,
      endpointId: raw.endpointId,
      parentId: raw.parentId,
      // 삭제된 댓글인 경우 내용 처리 블라인드
      content: raw.isDeleted ? DELETED_COMMENT_TEXT : raw.content,
      isDeleted: raw.isDeleted,
      
      // PublicUser 정보 매핑
      author: {
        id: raw.user.id,
        userName: raw.user.userName,
        email: raw.user.email
      },
      isAiGenerated: raw.user.isAi,

      createdAt: raw.createdAt.toISOString(),
      updatedAt: raw.updatedAt.toISOString(),

      // 댓글 리액션 리턴타입 적용
      reactions: this.summarizeReactions(curUserId, raw.reactions),

      // 멤버 멘션 매핑
      memberMentions: (raw.memberMentions || []).map((m: any) => ({
        userId: m.mentionedUser.id,
        userName: m.mentionedUser.userName,
      })),

      // 엔드포인트 멘션 매핑
      endpointMentions: (raw.endpointMentions || []).map((e: any) => ({
        endpointId: e.endpoint.id,
        path: e.endpoint.path,
        method: e.endpoint.method,
      })),
    };
  }

  //댓글 리액션 리턴타입 생성 
  private summarizeReactions(
    currUserId: number, // 현재 로그인한 유저의 ID.
    reactions: Reaction[] = []
  ): ReactionSummary[] {
    
    const summaryMap = new Map<string, ReactionSummary>();

    reactions.forEach((react) => {
      const reactionType = react.type; // 예: 'DONE', 'CHECKING' 
      
      // 1. 이미 등록된 리액션 타입이 없다면 초기값 생성
      const existing = summaryMap.get(reactionType) || { 
        type: reactionType, 
        count: 0, 
        reactedByMe: false // 기본값은 false
      };

      // 2. 개수 누적
      existing.count += 1;

      // 3. 리액션을 남긴 유저가 현재 로그인한 유저와 일치하는지 확인
      if (react.userId === currUserId) {
        existing.reactedByMe = true;
      }

      summaryMap.set(reactionType, existing);
    });

    return Array.from(summaryMap.values());
  }

  // POST /endpoints/:id/comments — 최상위 댓글
  // projectId 는 @CurrentProjectId 주입값 (가드가 endpoint 테이블을 통해 projectId 역참조해둠).
  // endpoint 를 다시 조회해 projectId 를 얻지 말 것 — 이미 데코레이터로 전달됨.
  async createComment(
    userId: number,
    endpointId: number,
    projectId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // 1. 멘션 대상 검증 (댓글 생성 전 — 유효하지 않으면 400)
    //    - mentionedUserIds: 해당 프로젝트 멤버인지 (projectId 사용)
    //    - mentionedEndpointIds: 해당 프로젝트 소속이며 삭제되지 않았는지 (projectId 사용)
    // 2. 댓글 생성 (트랜잭션 아님 — 멘션 sync 실패로 본문 날리지 않기 위해)
    // 3. mentionsService.syncMemberMentions(commentId, projectId, ...) /
    //    syncEndpointMentions(commentId, projectId, ...) 호출

    //1. 멘션 대상 정규화 + 검증 (댓글 생성 전 — 400)
    const { mentionedUserIds, mentionedEndpointIds } = await this.resolveMentions(projectId, dto);

    //2. 댓글 생성 
    const comment = await this.prisma.comment.create({
      data: {
        endpointId,
        userId, 
        content: dto.content,
        projectId
      }
    });
    
    // 3. 멘션 동기화
    // 멘션 사용자 등록 
    await this.mentionsService.syncMemberMentions(userId, comment.id, projectId, mentionedUserIds);
    // 멘션 EndPoint 등록 
    await this.mentionsService.syncEndpointMentions(comment.id, projectId, mentionedEndpointIds);
    
    return comment;

  }

  // 멘션 대상 정규화(중복 제거) + 검증. 유효하지 않으면 400.
  // createComment / createReply / updateComment 공용.
  private async resolveMentions(
    projectId: number, 
    dto: Pick<CreateCommentDto, 'mentionedUserIds' | 'mentionedEndpointIds'>
  ): Promise<{ mentionedUserIds: number[];  mentionedEndpointIds: number[] }> {
    const userIds = [...new Set(dto.mentionedUserIds ?? [])];
    const endpointIds = [...new Set(dto.mentionedEndpointIds ?? [])];

    if (!(await this.checkMentionUsers(projectId, userIds))) {
      throw new BadRequestException(`유효하지 않은 멘션 멤버가 있습니다.`);
    }
    if (!(await this.checkMentionEndpoints(projectId, endpointIds))) {
      throw new BadRequestException(`유효하지 않은 EndPoint가 있습니다.`);
    }

    return { mentionedUserIds: userIds, mentionedEndpointIds: endpointIds };
  }
    
  // 멘션 대상 검증 (멤버십) — 정규화된 id 배열만 받는다
  private async checkMentionUsers(projectId: number, userIds: number[]): Promise<boolean> {
    if (userIds.length === 0) return true;

    // 프로젝트 멤버 필터 조회 
    const existing = await this.prisma.membership.findMany({
      where: {
        userId: {
          in: userIds,
        },
        projectId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });
    
    return existing.length === userIds.length;
  }

  // 멘션대상 검증 (EndPoint)
  async checkMentionEndpoints(projectId: number, endpointIds: number[]): Promise<boolean> {
    if (endpointIds.length === 0) return true;

    // 프로젝트 EndPoint 필터 조회 
    const existing = await this.prisma.endpoint.findMany({
      where: {
        id: {
          in: endpointIds,
        },
        projectId,
        isDeleted: false,
      },
      select: {
        id: true,
      },
    });

    return existing.length === endpointIds.length;
  }

  // POST /comments/:id/replies — 대댓글
  // projectId 는 @CurrentProjectId 주입값 (가드가 comment 테이블을 통해 projectId 역참조해둠).
  // 멘션 검증이 normalizeReply 보다 먼저라, parent 조회 결과가 아닌 주입값을 써야 함.
  async createReply(
    userId: number,
    parentId: number,
    projectId: number,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    // TODO
    // 1. 멘션 대상 검증 (댓글 생성 전 — 유효하지 않으면 400, createComment 와 동일)
    //    - mentionedUserIds: 해당 프로젝트 멤버인지 (projectId 사용)
    //    - mentionedEndpointIds: 해당 프로젝트 소속이며 삭제되지 않았는지 (projectId 사용)
    // 2. normalizeReply(parentId) → { parentId, endpointId } (2뎁스 고정 + endpointId 상속)
    // 3. 댓글 생성 (트랜잭션 아님 — 멘션 sync 실패로 본문 날리지 않기 위해)
    // 4. mentionsService.syncMemberMentions(commentId, projectId, ...) /
    //    syncEndpointMentions(commentId, projectId, ...) 호출
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
  // OWNER 검증은 가드(@ProjectRole(OWNER))가 이미 수행 → ownerId 인자 불필요.
  // projectId 도 주입받지 않음 — 아래 comment 조회(parentId 판정용)에서 함께 확보한다.
  async moveThread(commentId: number, dto: MoveCommentDto): Promise<void> {
    // TODO
    // [tx 밖 선검증]
    //  1. comment 조회 (parentId, projectId 확보 — select 로 함께 뽑음).
    //     parentId != null 이면 거부 (최상위만 이동 → 400)
    //  2. targetEndpoint 조회 — 아래 셋 모두 BadRequest(400) 로 통일
    //     - 없거나 isDeleted
    //     - projectId !== comment.projectId (다른 프로젝트 소속)
    //     세 경우를 400 하나로 뭉개는 이유: 400/404 로 구분하면
    //     endpointId 열거가 가능 → 리소스 은닉을 위해 400 통일
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
