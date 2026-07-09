import { NOTIFICATION_TYPE } from '@prisma/client';
import { IsEnum, IsInt, IsOptional } from 'class-validator';

// 내부 호출 전용 (라우트 없음). memberships(초대) / mentions(멘션)가 사용.
//  - INVITED  : invitedProjectId 채움
//  - MENTIONED: mentionedCommentId 채움
export class CreateNotificationDto {
  @IsInt()
  recipientId: number;

  @IsEnum(NOTIFICATION_TYPE)
  type: NOTIFICATION_TYPE;

  @IsInt()
  senderId: number;

  @IsOptional()
  @IsInt()
  invitedProjectId?: number;

  @IsOptional()
  @IsInt()
  mentionedCommentId?: number;
}
