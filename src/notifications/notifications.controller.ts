import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type AuthUser } from '../common/types/auth.type';
import { NotificationsService } from './notifications.service';

// 계층 1: recipientId 본인 스코프, projectId 없음 → JwtAuthGuard 만
@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: '내 알림 목록' })
  @Get()
  findNotifications(@CurrentUser() user: AuthUser) {
    return this.notificationsService.findNotifications(user.id);
  }

  @ApiOperation({ summary: '알림 읽음 처리' })
  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(user.id, id);
  }
}
