import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  // memberships(초대) / mentions(멘션)가 createNotification 을 호출하므로 export
  exports: [NotificationsService],
})
export class NotificationsModule {}
