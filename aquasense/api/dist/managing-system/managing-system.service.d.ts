import { Device } from './../device/entity/device.entity';
import { DeviceService } from '../device/service/device.service';
export declare class ManangingSystemService {
    private readonly deviceService;
    constructor(deviceService: DeviceService);
    monitor(mac: string): Promise<{
        deepSleep: number;
    }>;
    analiser(device: Device): Promise<{
        deepSleep: number;
    }>;
    planner(value: null | number): Promise<{
        deepSleep: number;
    }>;
}
