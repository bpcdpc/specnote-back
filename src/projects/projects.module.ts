import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MembershipsService } from './memberships.service';
import { MembershipGuard } from '../common/guards/membership.guard';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, MembershipsService, MembershipGuard],
})
export class ProjectsModule {}
