// src/cases/dto/set-hearing.dto.ts
import { IsDateString } from 'class-validator';

export class SetHearingDto {
  @IsDateString()
  hearing_date: string;
}
