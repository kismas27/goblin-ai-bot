import { Controller, Get } from '@nestjs/common';
import { DialogsService } from './dialogs.service';

@Controller('dialogs')
export class DialogsController {
  constructor(private readonly dialogsService: DialogsService) {}

  @Get()
  async getDialogs() {
    // For admin
    return [];
  }
}