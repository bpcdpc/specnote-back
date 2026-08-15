import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MembershipsService } from './memberships.service';
import { MembershipGuard } from '../common/guards/membership.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule], // memberships에서 NotificationService 필요
  controllers: [ProjectsController],
  providers: [ProjectsService, MembershipsService, MembershipGuard],
})
export class ProjectsModule {}
