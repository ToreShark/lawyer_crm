import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { UserRole } from 'src/users/enum/user.role';

// 📋 Интерфейс для JWT payload (такой же как в AuthService)
interface JwtPayload {
  sub: number; // user.id
  telegram_id: string;
  role: string;
  name: string;
  iat?: number; // issued at
  exp?: number; // expires at
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      // 🔍 Откуда извлекать токен - из заголовка Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // ⏰ НЕ игнорировать истекшие токены
      ignoreExpiration: false,

      // 🔑 Секретный ключ для проверки подписи (тот же что при создании токена)
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * 🔍 Валидация токена
   *
   * Этот метод вызывается автоматически после того, как passport-jwt
   * проверил подпись токена и убедился, что он не истек.
   *
   * @param payload - расшифрованные данные из токена
   * @returns User объект, который будет доступен в req.user
   */
  async validate(payload: JwtPayload) {
    try {
      // 🔍 Проверяем, существует ли пользователь в базе данных
      const user = await this.authService.validateUser({
        ...payload,
        role: payload.role as UserRole, // <-- безопасно, если ты контролируешь генерацию токена
      });

      // ✅ Если пользователь найден, он будет доступен в req.user во всех защищенных роутах
      return user;
    } catch (error) {
      // ❌ Если пользователь не найден или произошла ошибка
      throw new UnauthorizedException('Неверный токен авторизации');
    }
  }
}
