import { Role } from '../users/entities/user.entity';

export interface SessionData {
  userId: number;
  role: Role;
  createdAt: string;
  lastSeenAt: string;
  ip: string | null;
  userAgent: string | null;
}
