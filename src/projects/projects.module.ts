import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MembershipsService } from './memberships.service';
import { MembershipGuard } from '../common/guards/membership.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, MembershipsService, MembershipGuard],
  // endpoints 등 다른 모듈이 getLatestSnapshotVersion 을 쓰므로 export
  exports: [ProjectsService],
})
export class ProjectsModule {}
