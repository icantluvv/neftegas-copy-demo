import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

function toDto(notification: Notification) {
  return {
    id: notification.id,
    userId: notification.userId,
    correctionId: notification.correctionId,
    correctionHumanId: notification.correction?.humanId ?? '',
    text: notification.text,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notifications: Repository<Notification>,
  ) {}

  async findForUser(user: User) {
    const rows = await this.notifications.find({
      where: { userId: user.id },
      relations: ['correction'],
      order: { createdAt: 'DESC' },
    });
    return rows.map(toDto);
  }

  async open(user: User, id: number) {
    const notification = await this.notifications.findOne({
      where: { id },
      relations: ['correction'],
    });
    if (!notification) throw new NotFoundException();
    if (notification.userId !== user.id) throw new ForbiddenException();
    notification.isRead = true;
    await this.notifications.save(notification);
    return toDto(notification);
  }

  async markAllRead(user: User) {
    const result = await this.notifications.update(
      { userId: user.id, isRead: false },
      { isRead: true },
    );
    return { updatedCount: result.affected ?? 0 };
  }

  /**
   * Открытие карточки корректировки помечает прочитанными все связанные с
   * ней уведомления текущего пользователя, независимо от того, попал ли он
   * на карточку через клик по уведомлению или напрямую (docs/tz/filial-cabinet.md,
   * раздел 6.6).
   */
  async markReadByCorrection(user: User, correctionId: number) {
    const result = await this.notifications.update(
      { userId: user.id, correctionId, isRead: false },
      { isRead: true },
    );
    return { updatedCount: result.affected ?? 0 };
  }
}
