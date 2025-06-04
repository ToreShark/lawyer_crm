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

@Injectable()
export class CasesService {
  constructor(
    @InjectRepository(Case)
    private caseRepo: Repository<Case>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly telegramService: TelegramService,
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

  async findAll(status?: CaseStatus, responsibleId?: number): Promise<Case[]> {
    const query = this.caseRepo.createQueryBuilder('case')
      .leftJoinAndSelect('case.responsible', 'user');

    if (status) query.andWhere('case.status = :status', { status });
    if (responsibleId) query.andWhere('user.id = :responsibleId', { responsibleId });

    return query.getMany();
  }

  async findOne(id: number): Promise<Case> {
    const found = await this.caseRepo.findOne({
      where: { id },
      relations: ['responsible'],
    });
    if (!found) {
      throw new NotFoundException(`Дело с ID ${id} не найдено`);
    }
    return found;
  }

  async updateStatus(id: number, status: CaseStatus): Promise<Case> {
    const caseEntity = await this.caseRepo.findOne({
      where: { id },
      relations: ['responsible'],
    });

    if (!caseEntity) {
      throw new NotFoundException('Дело не найдено');
    }

    caseEntity.status = status;
    caseEntity.updated_at = new Date();

    const updated = await this.caseRepo.save(caseEntity);

    // 🔔 Отправка уведомления при возврате
    if (status === CaseStatus.RETURNED) {
      console.log('🔔 Отправляем уведомление о возврате...');
      await this.telegramService.sendReturnNotification(updated);
    }

    return updated;
  }


  async setHearing(id: number, dto: SetHearingDto): Promise<Case> {
    const found = await this.findOne(id);
    if (found.status !== CaseStatus.ACCEPTED) {
      throw new Error('Нельзя назначить дату заседания для непринятого дела');
    }

    found.hearing_date = new Date(dto.hearing_date);
    return this.caseRepo.save(found);
  }
}
