import { ManangingSystemService } from './managing-system.service';
export declare class ManagingSystemController {
    private readonly manangingSystemService;
    constructor(manangingSystemService: ManangingSystemService);
    verifyAdaptation(mac: string): Promise<any>;
}
