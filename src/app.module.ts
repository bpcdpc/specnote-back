import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProjectsModule,
    CommentsModule,
    AiModule,
    NotificationsModule,
    PrismaModule,
  ],
})
export class AppModule {}
