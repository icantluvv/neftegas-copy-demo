import { User } from './entities/user.entity';

export function toUserDto(user: User) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    filialId: user.filialId,
    cfoId: user.cfoId,
    position: user.position,
    phone: user.phone,
    isActive: user.isActive,
    isLocked: user.isLocked,
    dateJoined: user.dateJoined,
  };
}

export function toUserSummaryDto(user: User) {
  return { id: user.id, username: user.username, fullName: user.fullName };
}
