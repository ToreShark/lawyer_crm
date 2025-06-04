// src/cases/dto/create-case.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  filing_date: string;

  @IsInt()
  @Min(1)
  responsible_id: number;

  @IsOptional()
  notifications_sent?: any;
}
