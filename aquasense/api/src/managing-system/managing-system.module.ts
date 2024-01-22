import { Module } from '@nestjs/common';
import { ManangingSystemService } from './managing-system.service';
import { DeviceModule } from '../device/device.module';
import { ManagingSystemController } from './managing-system.controller';

@Module({
  imports: [DeviceModule],
  providers: [ManangingSystemService],
  controllers: [ManagingSystemController],
})
export class ManangingSystemModule {}
