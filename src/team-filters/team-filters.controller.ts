import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TeamFilter } from './entities/team-filter.entity';
import { TeamFiltersService } from './team-filters.service';

@UseGuards(AuthGuard('jwt'))
@Controller('team-filters')
export class TeamFiltersController {
  constructor(private readonly teamFiltersService: TeamFiltersService) {}

  // GET /team-filters - получить текущие фильтры команды
  @Get()
  async getCurrentFilters(): Promise<TeamFilter> {
    return this.teamFiltersService.getCurrentFilters();
  }

  // PATCH /team-filters - обновить фильтры команды
  @Patch()
  async updateFilters(
    @Body() filterData: Partial<TeamFilter>,
  ): Promise<TeamFilter> {
    return this.teamFiltersService.updateFilters(filterData);
  }
}