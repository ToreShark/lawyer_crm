// src/cases/cases.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case, CaseStatus } from './entities/case.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { SetHearingDto } from './dto/set-hearing.dto';
import { User } from '../users/entities/user.entity';
import { UpdateCaseStatusDto } from './dto/update-case.dto';
import { TelegramService } from '../telegram/telegram.service';
import { addBusinessDays } from '../utils/addBusinessDays';
import { TeamFiltersService } from 'src/team-filters/team-filters.service';

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private caseRepo: Repository<Case>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly telegramService: TelegramService,
    private readonly teamFiltersService: TeamFiltersService,
  ) {}

  async create(dto: CreateCaseDto): Promise<Case> {
    const responsible = await this.userRepo.findOneBy({
      id: dto.responsible_id,
    });
    if (!responsible) {
      throw new NotFoundException('Ответственный пользователь не найден');
    }

    const filingDate = new Date(dto.filing_date);
    const checkDeadline = addBusinessDays(filingDate, 5);

    const caseEntity = this.caseRepo.create({
      ...dto,
      filing_date: filingDate,
      check_deadline: checkDeadline,
      responsible,
    });

    return this.caseRepo.save(caseEntity);
  }

  async findAll(): Promise<Case[]> {
    // Получаем текущие глобальные фильтры команды
    const teamFilters = await this.teamFiltersService.getCurrentFilters();

    const query = this.caseRepo
      .createQueryBuilder('case')
      .leftJoinAndSelect('case.responsible', 'user');

    // Применяем фильтры из БД
    if (teamFilters.status_filter) {
      query.andWhere('case.status = :status', {
        status: teamFilters.status_filter,
      });
    }

    if (teamFilters.responsible_id) {
      query.andWhere('user.id = :responsibleId', {
        responsibleId: teamFilters.responsible_id,
      });
    }

    return query.getMany();
  }

  async updateStatus(
    id: number,
    status: CaseStatus,
    changedByUser?: any,
  ): Promise<Case> {
    const caseEntity = await this.caseRepo.findOne({
      where: { id },
      relations: ['responsible'],
    });

    if (!caseEntity) {
      throw new NotFoundException('Дело не найдено');
    }

    // Сохраняем старый статус для уведомления
    const oldStatus = caseEntity.status;
    const changedBy = changedByUser?.name || 'Неизвестный пользователь';

    caseEntity.status = status;
    caseEntity.updated_at = new Date();

    const updated = await this.caseRepo.save(caseEntity);

    // 🔔 Отправка уведомления при возврате (старая логика)
    if (status === CaseStatus.RETURNED) {
      console.log('🔔 Отправляем уведомление о возврате...');
      await this.telegramService.sendReturnNotification(updated);
    }

    // 🔔 НОВОЕ: Отправка уведомления всей команде о любом изменении статуса
    if (oldStatus !== status) {
      await this.telegramService.sendStatusChangeToTeam(
        updated,
        oldStatus,
        status,
        changedBy,
      );
    }

    return updated;
  }

  async setHearing(id: number, dto: SetHearingDto): Promise<Case> {
    const found = await this.findOne(id);
    if (found.status !== CaseStatus.ACCEPTED) {
      throw new Error('Нельзя назначить дату заседания для непринятого дела');
    }

    // found.hearing_date = new Date(dto.hearing_date);
    found.hearing_date = new Date(dto.hearing_date + '+05:00');
    return this.caseRepo.save(found);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id); // Проверяем существование (выбросит ошибку если не найдено)
    await this.caseRepo.delete(id);
  }

  async findOne(id: number): Promise<Case> {
    const found = await this.caseRepo.findOne({
      where: { id },
      relations: ['responsible'],
    });

    if (!found) {
      throw new NotFoundException(`Дело с id ${id} не найдено`);
    }

    return found;
  }
}
