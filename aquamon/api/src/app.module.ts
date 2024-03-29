import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceModule } from './device/device.module';
import { DeviceHistory } from './device/entity/device-history.entity';
import { Device } from './device/entity/device.entity';
import { ManangingSystemModule } from './managing-system/managing-system.module';
import { MexModule } from './mex/mex.module';
import { MqttModule } from './mqtt/mqtt.module';

@Module({
  imports: [
    // ConfigModule.forRoot({ envFilePath: '../.env' }),
    // TypeOrmModule.forRoot({
    //   type: 'postgres',
    //   port: 5432,
    //   username: 'dev',
    //   password: 'dev_pass',
    //   database: 'water_db',
    //   entities: [Device, DeviceHistory],
    //   synchronize: true,
    // }),
    // DeviceModule,
    // MqttModule,
    // ManangingSystemModule,
    MexModule,
  ],
  providers: [],
})
export class AppModule {}
