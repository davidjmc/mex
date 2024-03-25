"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManangingSystemModule = void 0;
const common_1 = require("@nestjs/common");
const managing_system_service_1 = require("./managing-system.service");
const device_module_1 = require("../device/device.module");
const managing_system_controller_1 = require("./managing-system.controller");
let ManangingSystemModule = class ManangingSystemModule {
};
ManangingSystemModule = __decorate([
    (0, common_1.Module)({
        imports: [device_module_1.DeviceModule],
        providers: [managing_system_service_1.ManangingSystemService],
        controllers: [managing_system_controller_1.ManagingSystemController],
    })
], ManangingSystemModule);
exports.ManangingSystemModule = ManangingSystemModule;
//# sourceMappingURL=managing-system.module.js.map