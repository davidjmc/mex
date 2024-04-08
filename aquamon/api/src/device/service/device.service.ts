import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { Repository } from 'typeorm';
import { MexService } from '../../mex/mex.service';
import { MqttService } from '../../mqtt/mqtt.service';
import { CreateUpdateDeviceDTO } from '../controller/device.controller';
import { DeviceHistory } from '../entity/device-history.entity';
import { Device } from '../entity/device.entity';
import { DeviceHistoryService } from './device-history.service';

interface AggregatedDeviceHistory {
  date: string;
  volume: number;
  battery: number;
}

interface DeviceWithAggregatedHistory extends Device {
  aggregatedHistory: AggregatedDeviceHistory[];
  remainingDays: number;
}

// Função auxiliar para formatar a data no formato 'DD/MM/YY'
function formatDate(dateString: string): string {
  const date = DateTime.fromISO(dateString);
  return date.toFormat('dd/LL/yy');
}

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    private readonly mqttService: MqttService,
    private readonly mexService: MexService,
    private readonly deviceHistoryService: DeviceHistoryService,
  ) {
    // TODO - Subscribe to MQTT topic of each one devices
    this.findAll().then((res) =>
      res.forEach((device) => {
        this.subscribeMex(device);
        // this.subscribeMqtt(device);
      }),
    );
  }

  async create(dto: CreateUpdateDeviceDTO): Promise<Device> {
    await this.verifyMac(dto.mac);

    const newDevice = await this.deviceRepository.save({ ...dto });

    this.subscribeMqtt(newDevice);

    return newDevice;
  }

  async update(dto: CreateUpdateDeviceDTO, id: string) {
    const oldDevice = await this.deviceRepository.findOneOrFail({
      where: { id },
    });

    if (oldDevice.mac !== dto.mac) {
      await this.verifyMac(dto.mac);
      await this.deviceRepository.update(id, dto);
      const updateddevice = await this.findOne(id);
      this.unsubscribeMqtt(oldDevice);
      this.subscribeMqtt(updateddevice);
    } else {
      await this.deviceRepository.update(id, dto);
    }
  }

  async delete(id: string): Promise<void> {
    const device = await this.deviceRepository.findOneOrFail({
      where: { id },
    });

    await this.deviceRepository.delete(id);

    this.unsubscribeMqtt(device);
  }

  async findByMac(mac: string): Promise<Device> {
    return await this.deviceRepository.findOne({ where: { mac } });
  }

  async findAll(): Promise<Device[]> {
    const devices = await this.deviceRepository
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.devicesHistory', 'history')
      .orderBy('history.timestamp', 'ASC')
      .getMany();

    return devices.map((device) => this.mapDeviceToAggregatedHistory(device));
  }

  async findOne(id: string): Promise<Device> {
    return this.deviceRepository.findOne({
      where: { id },
      relations: ['devicesHistory'],
    });
  }

  async verifyMac(mac: string): Promise<void> {
    const deviceAlreadyExists = await this.findByMac(mac);

    if (deviceAlreadyExists) {
      throw new ConflictException('Device already exists');
    }
  }

  async createHistory(
    dto: { distance: number; battery: number; timestamp: Date },
    deviceMac: string,
  ) {
    const device = await this.findByMac(deviceMac);

    const currentVolume = this.calcCurrentVolume(dto.distance, device);

    const currentPercentage = (
      (currentVolume * 100) /
      device.maxCapacity
    ).toFixed(2);

    Logger.log(
      `Receiving update from ${device.mac} - currentVolume: ${currentVolume} - currentPercentage: ${currentPercentage}`,
    );

    this.deviceHistoryService.create({
      water: Number(currentVolume),
      battery: Number(dto.battery),
      timestamp: new Date(dto.timestamp),
      device,
    });
    this.deviceRepository.update(device.id, {
      percentage: Number(currentPercentage),
      battery: Number(dto.battery),
      water: Number(currentVolume),
    });
  }

  calcCurrentVolume(distance: number, device: Device): number {
    const { height, baseRadius } = device;

    const currentHeight = height - distance / 100;

    const currentVolume = Math.PI * Math.pow(baseRadius, 2) * currentHeight;

    return Number((currentVolume * 1000).toFixed(2));
  }

  calcPercentBattery(voltage: number) {
    // Fator de ajuste para a relação entre as resistências do divisor de tensão
    const ratioFactor = 1.27;

    const vinMin = 2.8;
    const vinMax = 4.2;

    // Convert Voltage in 3.3v factor
    const rVoltage = (voltage / 1024.0) * 3.3;

    const fVoltage = rVoltage * ratioFactor;

    // Limitar a voltagem medida aos limites dados
    const measureVoltage = Math.min(Math.max(fVoltage, vinMin), vinMax);

    // Calcular a diferença total
    const totalDiff = vinMax - vinMin;

    // Calcular o percentual usando a fórmula de interpolação linear
    let percent = ((measureVoltage - vinMin) / totalDiff) * 100;

    // Garantir que o percentual está dentro do intervalo [0, 100]
    percent = Math.min(Math.max(percent, 0.0), 100.0);

    return percent;
  }

  mapDeviceToAggregatedHistory(device: Device): DeviceWithAggregatedHistory {
    const aggregatedHistory: AggregatedDeviceHistory[] = [];

    // Agrupa o histórico por dia
    const groupedHistory = device.devicesHistory.reduce((acc, history) => {
      const date = DateTime.fromJSDate(history.timestamp).toISODate(); // Obtém a data em formato 'YYYY-MM-DD'
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(history);
      return acc;
    }, {} as { [date: string]: DeviceHistory[] });

    // Calcula o volume máximo de água e nível de bateria por dia
    for (const date in groupedHistory) {
      const historyList = groupedHistory[date];
      aggregatedHistory.push({
        date: formatDate(date),
        volume: historyList[historyList.length - 1].water,
        battery: historyList[historyList.length - 1].battery,
      });
    }

    const remainingDays = () => {
      // Verifica se o consumo diário é válido
      if (device.water <= 0) {
        return 0;
      }
      // Calcula o número de dias restantes
      return Math.floor(device.water / 100);
    };

    const deviceWithAggregatedHistory: DeviceWithAggregatedHistory = {
      ...device,
      aggregatedHistory,
      remainingDays: remainingDays(),
    };

    return deviceWithAggregatedHistory;
  }

  subscribeMqtt(device: Device): void {
    Logger.log(`Subscribing to ${device.mac}`);
    this.mqttService.subscribe(device.mac, (msg) => {
      const dto = JSON.parse(msg);

      const currentVolume = this.calcCurrentVolume(dto.distance, device);

      const currentBattery = this.calcPercentBattery(dto.voltage);

      const currentPercentage = (
        (currentVolume * 100) /
        device.maxCapacity
      ).toFixed(2);

      Logger.log(
        `Receiving update from ${device.mac} - currentVolume: ${currentVolume} - currentPercentage: ${currentPercentage}`,
      );

      this.deviceHistoryService.create({
        water: Number(currentVolume),
        battery: Number(currentBattery),
        timestamp: new Date(dto.timestamp * 1000),
        device,
      });
      this.deviceRepository.update(device.id, {
        percentage: Number(currentPercentage),
        battery: Number(currentBattery),
        water: Number(currentVolume),
      });
    });
  }

  unsubscribeMqtt(device: Device): void {
    Logger.log(`Unsubscribing to ${device.mac}`);
    this.mqttService.unsubscribe(device.mac);
  }

  async subscribeMex(device: Device): Promise<void> {
    this.mexService.subcribe('water-level', (msg) => {
      const dto = JSON.parse(msg);

      console.log(dto);

      if (dto.MSG) {
        const string = JSON.stringify(dto).replace(/'(\{.*?\})'/g, '"$1"');

        const json = JSON.parse(string);

        const MSG = json.MSG;

        const MSGstring = MSG.replace(/'(\{.*?\})'/g, '"$1"');

        const waterLevel = JSON.parse(JSON.stringify(MSGstring));

        // Substituir as aspas simples por aspas duplas para obter um formato JSON válido
        const jsonCorrigido = waterLevel.replace(/'/g, '"');

        // Analisar a string JSON para obter um objeto
        const objeto = JSON.parse(jsonCorrigido);

        const msg = objeto['water-level'];

        if (msg) {
          const currentVolume = this.calcCurrentVolume(msg.distance, device);
          // const currentBattery = this.calcPercentBattery(4.2);
          const currentBattery = msg.battery;

          const timestamp = new Date(msg.timer);

          const currentPercentage = (
            (currentVolume * 100) /
            device.maxCapacity
          ).toFixed(2);

          Logger.log(
            `Receiving update from ${device.mac} - currentVolume: ${currentVolume} - currentPercentage: ${currentPercentage}`,
          );

          this.deviceHistoryService.create({
            water: Number(currentVolume),
            battery: Number(currentBattery),
            timestamp,
            device,
          });
          this.deviceRepository.update(device.id, {
            percentage: Number(currentPercentage),
            battery: Number(currentBattery),
            water: Number(currentVolume),
          });
        }
      }
    });
  }
}
