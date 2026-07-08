import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { EndpointsModule } from './endpoints/endpoints.module';
import { CommentsModule } from './comments/comments.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ProjectsModule,
    EndpointsModule,
    CommentsModule,
    AiModule,
    NotificationsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
