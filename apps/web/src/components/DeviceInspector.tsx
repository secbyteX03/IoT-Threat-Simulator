import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { Device } from '../../../server/src/types';

interface DeviceInspectorProps {
  device: Device;
  onClose: () => void;
}

const DeviceInspector: React.FC<DeviceInspectorProps> = ({ device, onClose }) => {
  const formatDeviceType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const calculateRiskScore = (device: Device) => {
    let score = 0;
    if (device.compromised) score += 70;
    if (device.integrityRisk) score += 50;
    if (device.weakPassword) score += 30;
    score += Math.min(device.metrics.cpu * 0.3, 20);
    score += Math.min(device.metrics.mem * 0.2, 15);
    return Math.min(Math.round(score), 100);
  };

  const riskScore = calculateRiskScore(device);
  const riskLevel = riskScore >= 75 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';
  const riskColor = riskScore >= 75 ? 'bg-red-500' : riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl overflow-y-auto"
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Device Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Device Header */}
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <div className="h-10 w-10 flex items-center justify-center">
                <span className="text-2xl">
                  {device.type === 'cctv' ? '📹' : 
                   device.type === 'smart_bulb' ? '💡' :
                   device.type === 'thermostat' ? '🌡️' :
                   device.type === 'door_lock' ? '🔒' : '📷'}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {device.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDeviceType(device.type)} • {device.firmwareVersion}
              </p>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Security Status
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${riskColor} text-white`}>
                {riskLevel} Risk
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${riskColor}`} 
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Score: {riskScore}/100
            </p>
          </div>

          {/* Device Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">CPU</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {Math.round(device.metrics.cpu)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Memory</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {Math.round(device.metrics.mem)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Network In</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {device.metrics.netIn.toFixed(1)} kbps
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">Network Out</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {device.metrics.netOut.toFixed(1)} kbps
              </p>
            </div>
          </div>

          {/* Device Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Device Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                <span className={`text-sm font-medium ${
                  device.compromised ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {device.compromised ? 'Compromised' : 'Secure'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Authentication</span>
                <span className={`text-sm font-medium ${
                  device.weakPassword ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {device.weakPassword ? 'Weak' : 'Strong'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Firmware</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {device.firmwareVersion}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeviceInspector;
