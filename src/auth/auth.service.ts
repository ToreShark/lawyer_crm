import { Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { TelegramAuthData, JwtPayload } from './interfaces/auth.interface';
import jwtConfig from './strategies/jwt.config';
import { ConfigType } from '@nestjs/config';
import { UserRole } from 'src/users/enum/user.role';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BOT_TOKEN =
    process.env.TELEGRAM_BOT_TOKEN ||
    '8169522521:AAH8HXmpHTQ-fGp0RgdasplGE5T94R_eOQs';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  validateTelegramAuth(authData: TelegramAuthData): boolean {
    try {
      const { hash, ...dataWithoutHash } = authData;

      const dataCheckString = Object.keys(dataWithoutHash)
        .sort()
        .map(key => `${key}=${dataWithoutHash[key]}`)
        .join('\n');

      const secretKey = crypto
        .createHash('sha256')
        .update(this.BOT_TOKEN)
        .digest();

      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      const isValid = calculatedHash === hash;
      const authDate = new Date(parseInt(authData.auth_date) * 1000);
      const isRecent = Date.now() - authDate.getTime() < 86400000;

      this.logger.log(`🔍 Telegram auth validation: ${isValid && isRecent ? '✅' : '❌'}`);
      
      return isValid && isRecent;
    } catch (error) {
      this.logger.error('❌ Ошибка при проверке Telegram auth:', error.message);
      return false;
    }
  }

  // async login(authData: TelegramAuthData) {
  //   if (!this.validateTelegramAuth(authData)) {
  //     throw new UnauthorizedException('Неверные данные авторизации Telegram');
  //   }

  //   let user = await this.userRepo.findOne({
  //     where: { telegram_id: authData.id }
  //   });

  //   if (!user) {
  //     user = this.userRepo.create({
  //       telegram_id: authData.id,
  //       name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
  //       username: authData.username,
  //       role: UserRole.ASSISTANT,
  //     });
      
  //     await this.userRepo.save(user);
  //     this.logger.log(`👤 Создан новый пользователь: ${user.name} (${user.telegram_id})`);
  //   } else {
  //     user.name = `${authData.first_name} ${authData.last_name || ''}`.trim();
  //     user.username = authData.username;
  //     await this.userRepo.save(user);
  //     this.logger.log(`🔄 Обновлен пользователь: ${user.name} (${user.telegram_id})`);
  //   }

  //   const jwt = await this.generateJWT(user);

  //   return {
  //     user: {
  //       id: user.id,
  //       name: user.name,
  //       username: user.username,
  //       telegram_id: user.telegram_id,
  //       role: user.role,
  //     },
  //     access_token: jwt.access_token,
  //     refresh_token: jwt.refresh_token,
  //   };
  // }

  async login(authData: TelegramAuthData) {
    if (!this.validateTelegramAuth(authData)) {
      throw new UnauthorizedException('Неверные данные авторизации Telegram');
    }

    let user = await this.userRepo.findOne({
      where: { telegram_id: authData.id }
    });

    if (!user) {
      user = this.userRepo.create({
        telegram_id: authData.id,
        name: `${authData.first_name} ${authData.last_name || ''}`.trim(),
        username: authData.username,
        role: UserRole.ASSISTANT,
      });
      
      await this.userRepo.save(user);
      
      // 🔍 ДИАГНОСТИЧЕСКИЙ ЛОГ
      this.logger.log(`👤 Новый пользователь создан. ID: ${user.id}, Telegram ID: ${user.telegram_id}, Name: ${user.name}`);
      
      if (!user.id) {
        this.logger.error(`❌ КРИТИЧЕСКАЯ ОШИБКА: ID пользователя не сгенерирован!`);
        throw new Error('Ошибка создания пользователя - ID не сгенерирован');
      }
    } else {
      user.name = `${authData.first_name} ${authData.last_name || ''}`.trim();
      user.username = authData.username;
      await this.userRepo.save(user);
      
      // 🔍 ДИАГНОСТИЧЕСКИЙ ЛОГ
      this.logger.log(`🔄 Пользователь обновлен. ID: ${user.id}, Telegram ID: ${user.telegram_id}, Name: ${user.name}`);
      
      if (!user.id) {
        this.logger.error(`❌ КРИТИЧЕСКАЯ ОШИБКА: ID существующего пользователя потерян!`);
        throw new Error('Ошибка обновления пользователя - ID потерян');
      }
    }

    const jwt = await this.generateJWT(user);

    // 🔍 ДОПОЛНИТЕЛЬНЫЙ ЛОГ ПЕРЕД ВОЗВРАТОМ
    this.logger.log(`✅ Возвращаем данные пользователя: ID=${user.id}, role=${user.role}`);

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        telegram_id: user.telegram_id,
        role: user.role,
      },
      access_token: jwt.access_token,
      refresh_token: jwt.refresh_token,
    };
  }
  async generateJWT(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      telegram_id: user.telegram_id,
      role: user.role,
      name: user.name,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      secret: this.jwtConfiguration.secret,
      expiresIn: this.jwtConfiguration.accessTokenTtl,
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      audience: this.jwtConfiguration.audience,
      issuer: this.jwtConfiguration.issuer,
      secret: this.jwtConfiguration.secret,
      expiresIn: '7d', // refresh TTL можешь вынести отдельно в config, если нужно
    });

    return {
      access_token,
      refresh_token,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken) as JwtPayload;
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      return await this.generateJWT(user);
    } catch (error) {
      this.logger.error('❌ Ошибка при обновлении токена:', error.message);
      throw new UnauthorizedException('Неверный refresh token');
    }
  }

  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return user;
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.getUserById(payload.sub);

    if (user.telegram_id !== payload.telegram_id) {
      throw new UnauthorizedException('Несоответствие данных токена');
    }

    return user;
  }

  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
