import { UserRole } from "src/users/enum/user.role";

export interface TelegramAuthData {
  id: string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: string; // UNIX timestamp как строка
  hash: string;
}

export interface JwtPayload {
  sub: number; 
  telegram_id: string;
  role: UserRole;
  name: string;
}