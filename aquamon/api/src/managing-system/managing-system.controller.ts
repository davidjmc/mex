import { Controller, Get, Param } from '@nestjs/common';
import { ManangingSystemService } from './managing-system.service';

@Controller('managing-system')
export class ManagingSystemController {
  constructor(
    private readonly manangingSystemService: ManangingSystemService,
  ) {}

  @Get('/:mac')
  async verifyAdaptation(@Param('mac') mac: string): Promise<any> {
    return await this.manangingSystemService.monitor(mac);
  }
}
