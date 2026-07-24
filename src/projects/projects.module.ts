import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MembershipsService } from './memberships.service';
import { MembershipGuard } from '../common/guards/membership.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectCommentService } from './project-comment.service';

@Module({
  imports: [NotificationsModule], // memberships에서 NotificationService 필요
  controllers: [ProjectsController],
  providers: [ProjectsService, MembershipsService, MembershipGuard, ProjectCommentService],
  // endpoints 등 다른 모듈이 getLatestSnapshotVersion 을 쓰므로 export
  exports: [ProjectsService],
})
export class ProjectsModule {}
