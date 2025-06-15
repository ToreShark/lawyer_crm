import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  // Query,
  Patch,
  ParseIntPipe,
  UseGuards,
  Delete,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { CasesService } from './cases.service';
import { CreateCaseDto } from './dto/create-case.dto';
import { SetHearingDto } from './dto/set-hearing.dto';
import { UpdateAcceptedDateDto } from './dto/update-accepted-date.dto';
// import { CaseStatus } from './entities/case.entity';
import { UpdateCaseStatusDto } from './dto/update-case.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  // ✅ POST /cases
  @Post()
  create(@Body() dto: CreateCaseDto) {
    return this.casesService.create(dto);
  }

  // ✅ GET /cases?status=submitted&responsibleId=1
  // ✅ GET /cases (теперь без параметров - фильтры берутся из БД)
  @Get()
  findAll() {
    return this.casesService.findAll(); // Убираем параметры status и responsibleId
  }

  // ✅ GET /cases/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.casesService.findOne(id);
  }

  // ✅ PATCH /cases/:id/status
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCaseStatusDto,
    @Req() req,
  ) {
    return this.casesService.updateStatus(id, dto.status);
  }

  // ✅ PATCH /cases/:id/hearing
  @Patch(':id/hearing')
  setHearing(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetHearingDto,
  ) {
    return this.casesService.setHearing(id, dto);
  }

  // ✅ PATCH /cases/:id/accepted-date
  @Patch(':id/accepted-date')
  updateAcceptedDate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAcceptedDateDto,
  ) {
    return this.casesService.updateAcceptedDate(id, dto);
  }

  // ✅ DELETE /cases/:id (только для юристов)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
    if (req.user.role !== 'lawyer') {
      throw new ForbiddenException('Только юристы могут удалять дела');
    }
    return this.casesService.remove(id);
  }
}
