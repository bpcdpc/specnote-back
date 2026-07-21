import { REACTION_TYPE } from '@prisma/client';
import { type PublicUser } from '../common/types/auth.type';

export type ReactionSummary = {
  type: REACTION_TYPE;
  count: number;
  reactedByMe: boolean;
};

// 조회 뷰(findComments 전용). 삭제 댓글의 content 는 서버에서 마스킹.
export type CommentView = {
  id: number;
  endpointId: number;
  parentId: number | null;
  content: string;
  isDeleted: boolean;
  author: PublicUser;
  isAiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  reactions: ReactionSummary[];
  memberMentions: { userId: number; userName: string }[];
  endpointMentions: { endpointId: number; path: string; method: string }[];
};

// 댓글 + 대댓글 한 세트 (2뎁스 고정)
export type CommentTree = CommentView & { replies: CommentView[] };

// AI 요약 대상 수집용
export type SummaryInput = {
  author: string;
  content: string;
  createdAt: string;
};

// normalizeReply 반환: 정규화된 최상위 parentId + 상속할 endpointId
export type ReplyParent = {
  parentId: number;
  endpointId: number;
};
