import { Device } from './../device/entity/device.entity';
import { Injectable } from '@nestjs/common';
import { DeviceService } from '../device/service/device.service';
@Injectable()
export class ManangingSystemService {
  constructor(private readonly deviceService: DeviceService) {}

  async monitor(mac: string) {
    const device = await this.deviceService.findByMac(mac);

    return this.analiser(device);
  }

  async analiser(device: Device) {
    if (device.percentage > 50) {
      // 1 hora
      return this.planner(10);
    }

    if (device.percentage < 50 && device.percentage > 25) {
      // 30 minutos
      return this.planner(5);
    }

    if (device.percentage < 25) {
      // 15 minutos
      return this.planner(2);
    }
  }

  async planner(value: null | number) {
    return { deepSleep: value };
  }
}
