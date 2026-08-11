import { User } from '../users/entities/user.entity';

export function toAuthUserDto(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    filialId: user.filialId,
    cfoId: user.cfoId,
    position: user.position,
    phone: user.phone,
    isLocked: user.isLocked,
  };
}
