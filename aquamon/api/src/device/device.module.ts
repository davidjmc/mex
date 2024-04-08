import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MexModule } from '../mex/mex.module';
import { MqttModule } from '../mqtt/mqtt.module';
import { DeviceController } from './controller/device.controller';
import { DeviceHistory } from './entity/device-history.entity';
import { Device } from './entity/device.entity';
import { DeviceHistoryService } from './service/device-history.service';
import { DeviceService } from './service/device.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Device, DeviceHistory]),
    MqttModule,
    MexModule,
  ],
  controllers: [DeviceController],
  providers: [DeviceService, DeviceHistoryService],
  exports: [DeviceService],
})
export class DeviceModule {}
