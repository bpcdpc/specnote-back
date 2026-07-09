import { NOTIFICATION_TYPE } from '@prisma/client';

// 조회 뷰: 프론트 클릭 시 이동/하이라이트용 파생필드 포함
export type NotificationView = {
  id: number;
  type: NOTIFICATION_TYPE;
  isRead: boolean;
  createdAt: string;
  invitedProjectId: number | null; // INVITED
  mentionedCommentId: number | null; // MENTIONED
  projectId: number | null; // MENTIONED: mentionedCommentId 조인 파생
  endpointId: number | null; // MENTIONED: mentionedCommentId 조인 파생
};
