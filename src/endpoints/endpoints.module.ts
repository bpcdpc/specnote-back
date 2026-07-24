import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { EndpointsController } from './endpoints.controller';
import { EndpointsService } from './endpoints.service';
import { MembershipGuard } from '../common/guards/membership.guard';
import { CommentsModule } from '../comments/comments.module';

@Module({
  // ProjectsService(getLatestSnapshotVersion) 를 쓰기 위해 ProjectsModule import
  // ProjectsModule에서 ProjectsService를 exports 해줘야지 받아서 쓸 수 있음
  imports: [ProjectsModule, CommentsModule],
  controllers: [EndpointsController],
  providers: [EndpointsService, MembershipGuard],
})
export class EndpointsModule {}
