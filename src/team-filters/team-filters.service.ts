import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamFilter } from './entities/team-filter.entity';

@Injectable()
export class TeamFiltersService {
  constructor(
    @InjectRepository(TeamFilter)
    private readonly teamFilterRepo: Repository<TeamFilter>,
  ) {}

  // Получить текущие фильтры команды (всегда будет одна запись)
  async getCurrentFilters(): Promise<TeamFilter> {
    let filters = await this.teamFilterRepo.findOne({ where: {} });
    
    // Если фильтров нет - создаем дефолтные
    if (!filters) {
      filters = this.teamFilterRepo.create({
        status_filter: null, // показывать все статусы по умолчанию
        responsible_id: null, // показывать всех ответственных
      });
      await this.teamFilterRepo.save(filters);
    }
    
    return filters;
  }

  // Обновить фильтры команды
  async updateFilters(filterData: Partial<TeamFilter>): Promise<TeamFilter> {
    const currentFilters = await this.getCurrentFilters();
    
    // Обновляем только переданные поля
    Object.assign(currentFilters, filterData);
    
    return this.teamFilterRepo.save(currentFilters);
  }
}