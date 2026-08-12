import { Role, User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let notifications: { update: jest.Mock };
  let service: NotificationsService;

  const user = { id: 7, role: Role.FILIAL } as User;

  beforeEach(() => {
    notifications = {
      update: jest.fn(),
    };
    service = new NotificationsService(notifications as never);
  });

  describe('markAllRead', () => {
    it('помечает прочитанными только непрочитанные уведомления текущего пользователя', async () => {
      notifications.update.mockResolvedValue({ affected: 3 });

      const result = await service.markAllRead(user);

      expect(notifications.update).toHaveBeenCalledWith(
        { userId: user.id, isRead: false },
        { isRead: true },
      );
      expect(result).toEqual({ updatedCount: 3 });
    });

    it('идемпотентен: повторный вызов без непрочитанных возвращает 0 без ошибки', async () => {
      notifications.update.mockResolvedValue({ affected: 0 });

      const result = await service.markAllRead(user);

      expect(result).toEqual({ updatedCount: 0 });
    });
  });
});
