import { User as AppUser } from '../users/entities/user.entity';

declare global {
  namespace Express {
    // Заполняется в SessionAuthGuard; тип нужен для request.user во всём приложении.
    // Именно interface (не type): он мержится с interface User из @types/passport.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AppUser {}
  }
}
