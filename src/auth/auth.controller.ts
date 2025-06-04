import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { TelegramAuthData } from './interfaces/auth.interface';
import { AccessTokenGuard } from './guards/access-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Telegram OAuth вход
  @Post('telegram')
  loginWithTelegram(@Body() authData: TelegramAuthData) {
    return this.authService.login(authData);
  }
  
  @Get('me')
  @UseGuards(AccessTokenGuard)
  async getCurrentUser(@Req() req: Request) {
    const user = req['user']; // или req[REQUEST_USER_KEY] если ты туда сохраняешь

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        username: user.username,
        telegram_id: user.telegram_id,
        role: user.role,
        created_at: user.created_at,
      },
    };
  }

  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }
}
