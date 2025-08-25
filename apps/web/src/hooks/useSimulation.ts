import { useSimulationStore } from '../store/useSimulationStore';
import { useEffect } from 'react';
import { Device } from '../../../server/src/types';

export function useSimulation() {
  const store = useSimulationStore();
  
  // Select specific state and actions to avoid unnecessary re-renders
  const {
    // State
    isConnected,
    isSimulationRunning,
    devices,
    selectedDeviceId,
    events,
    attackState,
    defenseState,
    currentScenario,
    
    // Actions
    connect,
    disconnect,
    selectDevice,
    updateDevice,
    startSimulation,
    stopSimulation,
    resetSimulation,
    loadScenario,
    updateAttack,
    updateDefense,
    addEvent,
    clearEvents,
  } = store;
  
  // Get the currently selected device
  const selectedDevice = selectedDeviceId 
    ? devices.find(device => device.id === selectedDeviceId) 
    : null;
  
  // Get devices by type
  const getDevicesByType = (type: string) => {
    return devices.filter(device => device.type === type);
  };
  
  // Get events by type
  const getEventsByType = (type: string) => {
    return events.filter(event => event.type === type);
  };
  
  // Get events for a specific device
  const getDeviceEvents = (deviceId: string) => {
    return events.filter(event => event.deviceId === deviceId);
  };
  
  // Get attack events
  const attackEvents = getEventsByType('attack');
  
  // Get defense events
  const defenseEvents = getEventsByType('defense');
  
  // Get system events
  const systemEvents = getEventsByType('system');
  
  // Get metrics for a device
  const getDeviceMetrics = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return null;
    
    return {
      cpu: device.metrics?.cpu || 0,
      memory: device.metrics?.mem || 0,
      networkIn: device.metrics?.netIn || 0,
      networkOut: device.metrics?.netOut || 0,
      battery: device.metrics?.battery,
      lastUpdated: device.metrics?.timestamp 
        ? new Date(device.metrics.timestamp) 
        : new Date(),
    };
  };
  
  // Get the current risk level based on attack state and device metrics
  const getCurrentRiskLevel = (deviceId?: string) => {
    if (attackState.isActive && attackState.targetDeviceId === deviceId) {
      return 'high';
    }
    
    if (deviceId) {
      const device = devices.find(d => d.id === deviceId);
      if (device?.compromised) return 'high';
      if (device?.integrityRisk) return 'medium';
      if (device?.weakPassword) return 'low';
    }
    
    return 'none';
  };
  
  // Check if a device is under attack
  const isDeviceUnderAttack = (deviceId: string) => {
    return attackState.isActive && attackState.targetDeviceId === deviceId;
  };
  
  // Get the current attack type for a device
  const getDeviceAttackType = (deviceId: string) => {
    if (attackState.targetDeviceId === deviceId) {
      return attackState.attackType;
    }
    return null;
  };
  
  // Get the current defense status
  const getDefenseStatus = () => ({
    isActive: defenseState.isActive,
    firewall: defenseState.firewallEnabled,
    encryption: defenseState.encryptionEnabled,
    rateLimiting: defenseState.rateLimitingEnabled,
    anomalyDetection: defenseState.anomalyDetectionEnabled,
    lastUpdated: new Date(defenseState.lastUpdated),
  });
  
  // Get the current attack status
  const getAttackStatus = () => ({
    isActive: attackState.isActive,
    type: attackState.attackType,
    intensity: attackState.intensity,
    targetDeviceId: attackState.targetDeviceId,
    isSuccessful: attackState.isSuccessful,
    lastAttempt: attackState.lastAttempt ? new Date(attackState.lastAttempt) : null,
  });
  
  // Get the current scenario
  const getCurrentScenario = () => currentScenario;
  
  // Check if a scenario is loaded
  const isScenarioLoaded = (scenarioId: string) => {
    return currentScenario?.id === scenarioId;
  };
  
  // Get the current connection status
  const getConnectionStatus = () => ({
    isConnected,
    lastUpdated: new Date(),
  });
  
  // Get the simulation status
  const getSimulationStatus = () => ({
    isRunning: isSimulationRunning,
    startTime: currentScenario?.startTime,
    endTime: currentScenario?.endTime,
    duration: currentScenario?.duration,
  });
  
  return {
    // State
    isConnected,
    isSimulationRunning,
    devices,
    selectedDevice,
    selectedDeviceId,
    events,
    attackState,
    defenseState,
    currentScenario,
    attackEvents,
    defenseEvents,
    systemEvents,
    
    // Actions
    connect,
    disconnect,
    selectDevice,
    updateDevice,
    startSimulation,
    stopSimulation,
    resetSimulation,
    loadScenario,
    updateAttack,
    updateDefense,
    addEvent,
    clearEvents,
    
    // Utility functions
    getDevicesByType,
    getDeviceEvents,
    getDeviceMetrics,
    getCurrentRiskLevel,
    isDeviceUnderAttack,
    getDeviceAttackType,
    getDefenseStatus,
    getAttackStatus,
    getCurrentScenario,
    isScenarioLoaded,
    getConnectionStatus,
    getSimulationStatus,
  };
}

// Create a hook for device-specific functionality
export function useDevice(deviceId: string) {
  const { 
    devices, 
    selectedDeviceId, 
    selectDevice, 
    updateDevice,
    isDeviceUnderAttack,
    getDeviceAttackType,
    getDeviceMetrics,
    getDeviceEvents,
    getCurrentRiskLevel,
  } = useSimulation();
  
  const device = devices.find(d => d.id === deviceId);
  const isSelected = selectedDeviceId === deviceId;
  const isUnderAttack = isDeviceUnderAttack(deviceId);
  const attackType = getDeviceAttackType(deviceId);
  const metrics = getDeviceMetrics(deviceId);
  const events = getDeviceEvents(deviceId);
  const riskLevel = getCurrentRiskLevel(deviceId);
  
  return {
    device,
    isSelected,
    isUnderAttack,
    attackType,
    metrics,
    events,
    riskLevel,
    selectDevice: () => selectDevice(deviceId),
    updateDevice: (updates: Partial<Device>) => updateDevice({ ...device, ...updates } as Device),
  };
}

// Create a hook for attack-related functionality
export function useAttack() {
  const { 
    attackState, 
    updateAttack, 
    startSimulation, 
    stopSimulation,
    isSimulationRunning,
    getAttackStatus,
  } = useSimulation();
  
  return {
    attackState,
    updateAttack,
    startAttack: (attack: Parameters<typeof updateAttack>[0]) => {
      updateAttack({ ...attack, isActive: true });
      if (!isSimulationRunning) {
        startSimulation();
      }
    },
    stopAttack: () => {
      updateAttack({ isActive: false });
    },
    getAttackStatus,
  };
}

// Create a hook for defense-related functionality
export function useDefense() {
  const { 
    defenseState, 
    updateDefense, 
    getDefenseStatus,
  } = useSimulation();
  
  return {
    defenseState,
    updateDefense,
    enableDefense: (type: keyof Omit<typeof defenseState, 'isActive' | 'lastUpdated'>) => {
      updateDefense({ [type]: true });
    },
    disableDefense: (type: keyof Omit<typeof defenseState, 'isActive' | 'lastUpdated'>) => {
      updateDefense({ [type]: false });
    },
    toggleDefense: (type: keyof Omit<typeof defenseState, 'isActive' | 'lastUpdated'>) => {
      updateDefense({ [type]: !defenseState[type] });
    },
    getDefenseStatus,
  };
}

// Create a hook for scenario management
export function useScenarios() {
  const { 
    currentScenario, 
    loadScenario, 
    isScenarioLoaded,
    getCurrentScenario,
  } = useSimulation();
  
  return {
    currentScenario,
    loadScenario,
    isScenarioLoaded,
    getCurrentScenario,
  };
}
