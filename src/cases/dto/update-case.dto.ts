// src/cases/dto/update-case-status.dto.ts
import { IsEnum } from 'class-validator';
import { CaseStatus } from '../entities/case.entity';

export class UpdateCaseStatusDto {
  @IsEnum(CaseStatus)
  status: CaseStatus;
}