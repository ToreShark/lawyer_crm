import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamFilter } from './entities/team-filter.entity';
import { TeamFiltersController } from './team-filters.controller';
import { TeamFiltersService } from './team-filters.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamFilter])],
  controllers: [TeamFiltersController],
  providers: [TeamFiltersService],
  exports: [TeamFiltersService], // Экспортируем чтобы использовать в CasesModule
})
export class TeamFiltersModule {}