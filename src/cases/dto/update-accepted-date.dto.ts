// src/cases/dto/update-accepted-date.dto.ts
import { IsDateString } from 'class-validator';

export class UpdateAcceptedDateDto {
  @IsDateString()
  accepted_date: string;
}