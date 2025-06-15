import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from 'src/cases/entities/case.entity';
import { TelegramModule } from 'src/telegram/telegram.module';
import { SchedulerController } from './scheduler.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Case]), TelegramModule],
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}
