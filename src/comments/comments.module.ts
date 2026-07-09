import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { ReactionsService } from './reactions.service';
import { MentionsService } from './mentions.service';
import { AiSummaryService } from './ai-summary.service';
import { MembershipGuard } from '../common/guards/membership.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AiModule, NotificationsModule], // ai-summary에서 AiService 필요, mentioins에서 NotificationService 필요
  controllers: [CommentsController],
  providers: [
    CommentsService,
    ReactionsService,
    MentionsService,
    AiSummaryService,
    MembershipGuard, // 계층 3 가드 (projects/endpoints 에 이어 3번째 중복 — 아래 참고)
  ],
})
export class CommentsModule {}
