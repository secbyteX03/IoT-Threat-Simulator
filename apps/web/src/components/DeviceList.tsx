import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Device } from '../../../server/src/types';
import { ShieldCheckIcon, ExclamationTriangleIcon, LockClosedIcon, LockOpenIcon, EyeIcon } from '@heroicons/react/24/outline';

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string) => void;
  onInspect: (deviceId: string) => void;
}

const deviceIcons: Record<string, string> = {
  cctv: '📹',
  smart_bulb: '💡',
  thermostat: '🌡️',
  door_lock: '🔒',
  ip_camera: '📷',
};

const DeviceList: React.FC<DeviceListProps> = ({ devices, selectedDeviceId, onSelect, onInspect }) => {
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  const toggleDeviceExpansion = (deviceId: string) => {
    setExpandedDevice(expandedDevice === deviceId ? null : deviceId);
  };

  const getDeviceStatus = (device: Device) => {
    if (device.compromised) return 'compromised';
    if (device.metrics.cpu > 90 || device.metrics.mem > 90) return 'warning';
    return 'healthy';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'compromised':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Secure';
      case 'warning':
        return 'Warning';
      case 'compromised':
        return 'Compromised';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-2">
      {devices.map((device) => {
        const status = getDeviceStatus(device);
        const isSelected = device.id === selectedDeviceId;
        const isExpanded = expandedDevice === device.id;

        return (
          <div 
            key={device.id}
            className={`rounded-lg overflow-hidden border ${
              isSelected 
                ? 'border-primary-500 ring-2 ring-primary-500 ring-opacity-50' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            } transition-colors duration-150`}
          >
            <div 
              className={`p-3 cursor-pointer ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-white dark:bg-gray-800'} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
              onClick={() => onSelect(device.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xl" aria-hidden="true">
                    {deviceIcons[device.type] || '📱'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white truncate max-w-[120px]">
                    {device.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(status)} bg-opacity-20 ${status === 'healthy' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {getStatusLabel(status)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDeviceExpansion(device.id);
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                    aria-label={isExpanded ? 'Collapse device details' : 'Expand device details'}
                  >
                    <svg
                      className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-500 dark:text-gray-400">Type:</div>
                      <div className="font-medium text-right text-gray-700 dark:text-gray-300 capitalize">
                        {device.type.replace('_', ' ')}
                      </div>
                      
                      <div className="text-gray-500 dark:text-gray-400">Firmware:</div>
                      <div className="font-mono text-right text-gray-700 dark:text-gray-300">
                        {device.firmwareVersion}
                      </div>
                      
                      <div className="text-gray-500 dark:text-gray-400">CPU:</div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          device.metrics.cpu > 90 ? 'text-red-600 dark:text-red-400' : 
                          device.metrics.cpu > 70 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {Math.round(device.metrics.cpu)}%
                        </span>
                      </div>
                      
                      <div className="text-gray-500 dark:text-gray-400">Memory:</div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          device.metrics.mem > 90 ? 'text-red-600 dark:text-red-400' : 
                          device.metrics.mem > 70 ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-green-600 dark:text-green-400'
                        }`}>
                          {Math.round(device.metrics.mem)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2 flex justify-between space-x-2">
                      <button
                        onClick={() => onInspect(device.id)}
                        className="flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-1" />
                        Inspect
                      </button>
                      
                      <button
                        onClick={() => {
                          // Toggle device selection
                          onSelect(isSelected ? '' : device.id);
                        }}
                        className={`flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${
                          isSelected
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default DeviceList;
