import { Module } from '@nestjs/common';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from './entities/case.entity';
import { User } from 'src/users/entities/user.entity';
import { TelegramModule } from 'src/telegram/telegram.module';
import { TeamFiltersModule } from 'src/team-filters/team-filters.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, User]),
    TelegramModule,
    TeamFiltersModule,
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [TypeOrmModule],
})
export class CasesModule {}
