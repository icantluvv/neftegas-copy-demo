import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { isEmail } from 'class-validator';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  /**
   * LocalAuthGuard выполняется на этапе Guards, раньше ValidationPipe для
   * @Body() LoginDto — поэтому формат email проверяется здесь же, до попытки
   * аутентификации, а не полагается на class-validator в DTO.
   */
  async validate(email: string, password: string) {
    if (!isEmail(email)) {
      throw new BadRequestException('Некорректный формат email');
    }
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    return user;
  }
}
