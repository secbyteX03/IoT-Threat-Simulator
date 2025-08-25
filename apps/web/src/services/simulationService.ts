import { SocketService } from './socketService';
import { Device, AttackState, DefenseState, SimulationEvent, SimulationScenario } from '../../../server/src/types';

export class SimulationService {
  private socketService: SocketService;
  private static instance: SimulationService;

  private constructor() {
    this.socketService = SocketService.getInstance();
  }

  public static getInstance(): SimulationService {
    if (!SimulationService.instance) {
      SimulationService.instance = new SimulationService();
    }
    return SimulationService.instance;
  }

  // Connection Management
  public async connect(url: string = '/') {
    return this.socketService.connect(url);
  }

  public disconnect() {
    this.socketService.disconnect();
  }

  // Device Methods
  public getDevices(): Promise<Device[]> {
    return new Promise((resolve) => {
      const unsubscribe = this.socketService.onDevicesUpdate((devices) => {
        unsubscribe();
        resolve(devices);
      });
      
      // Request devices from server
      this.socketService.emit('devices:get');
    });
  }

  public onDevicesUpdate(callback: (devices: Device[]) => void) {
    return this.socketService.onDevicesUpdate(callback);
  }

  public onDeviceUpdate(callback: (device: Device) => void) {
    return this.socketService.onDeviceUpdate(callback);
  }

  // Simulation Control
  public startSimulation() {
    this.socketService.emit('simulation:start');
  }

  public stopSimulation() {
    this.socketService.emit('simulation:stop');
  }

  public resetSimulation() {
    this.socketService.emit('simulation:reset');
  }

  public onSimulationStart(callback: () => void) {
    return this.socketService.onSimulationStart(callback);
  }

  public onSimulationStop(callback: () => void) {
    return this.socketService.onSimulationStop(callback);
  }

  // Attack Management
  public updateAttack(attack: Partial<AttackState>) {
    this.socketService.emit('attack:update', attack);
  }

  public onAttackUpdate(callback: (attack: AttackState) => void) {
    return this.socketService.onAttackUpdate(callback);
  }

  // Defense Management
  public updateDefense(defense: Partial<DefenseState>) {
    this.socketService.emit('defense:update', defense);
  }

  public onDefenseUpdate(callback: (defense: DefenseState) => void) {
    return this.socketService.onDefenseUpdate(callback);
  }

  // Scenario Management
  public loadScenario(scenario: SimulationScenario) {
    this.socketService.emit('scenario:load', scenario);
  }

  public onScenarioLoaded(callback: (scenario: SimulationScenario) => void) {
    return this.socketService.on('scenario:loaded', callback);
  }

  // Event Logs
  public onEvent(callback: (event: SimulationEvent) => void) {
    return this.socketService.onEvent(callback);
  }

  // Connection Status
  public onConnect(callback: () => void) {
    return this.socketService.onConnect(callback);
  }

  public onDisconnect(callback: () => void) {
    return this.socketService.onDisconnect(callback);
  }

  public isConnected(): boolean {
    return this.socketService.isConnected();
  }

  // Metrics Subscription
  public subscribeToMetrics(deviceId: string, metrics: string[]) {
    this.socketService.emit('metrics:subscribe', { deviceId, metrics });
  }

  public unsubscribeFromMetrics(deviceId: string) {
    this.socketService.emit('metrics:unsubscribe', { deviceId });
  }

  public onMetricsUpdate(
    deviceId: string, 
    callback: (metrics: Record<string, any>) => void
  ) {
    return this.socketService.on(`metrics:update:${deviceId}`, callback);
  }
}
