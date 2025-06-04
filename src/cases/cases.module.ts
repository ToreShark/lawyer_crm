import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { User } from 'src/users/entities/user.entity';
import { TelegramModule } from 'src/telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([Case, User]), TelegramModule],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [TypeOrmModule],
})
export class CasesModule {}
