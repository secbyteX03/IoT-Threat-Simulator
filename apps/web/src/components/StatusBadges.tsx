import { ShieldCheckIcon, ExclamationTriangleIcon, LockClosedIcon, LockOpenIcon, WifiIcon, CpuChipIcon, Battery50Icon } from '@heroicons/react/24/outline';
import { Device } from '../../../server/src/types';

interface StatusBadgesProps {
  device: Device;
  className?: string;
}

const StatusBadges: React.FC<StatusBadgesProps> = ({ device, className = '' }) => {
  // Calculate risk score (simplified version of the one in DeviceInspector)
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
  
  // Get risk level and color
  const getRiskLevel = () => {
    if (riskScore >= 75) return { level: 'High', color: 'bg-red-500' };
    if (riskScore >= 40) return { level: 'Medium', color: 'bg-yellow-500' };
    if (riskScore >= 20) return { level: 'Low', color: 'bg-blue-500' };
    return { level: 'Minimal', color: 'bg-green-500' };
  };
  
  const riskLevel = getRiskLevel();

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {/* Risk Level Badge */}
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskLevel.color === 'bg-red-500' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 
          riskLevel.color === 'bg-yellow-500' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
          riskLevel.color === 'bg-blue-500' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'} rounded-full`}
        title={`Risk Level: ${riskLevel.level} (${riskScore}/100)`}
      >
        <span className={`w-2 h-2 ${riskLevel.color} rounded-full mr-1.5`}></span>
        {riskLevel.level} Risk
      </span>
      
      {/* Compromised Status */}
      {device.compromised && (
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          title="Device has been compromised"
        >
          <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
          Compromised
        </span>
      )}
      
      {/* Integrity Risk */}
      {device.integrityRisk && (
        <span 
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
          title="Device integrity at risk"
        >
          <ShieldCheckIcon className="h-3 w-3 mr-1" />
          Integrity Risk
        </span>
      )}
      
      {/* Authentication Status */}
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          device.weakPassword 
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' 
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
        }`}
        title={device.weakPassword ? 'Weak authentication detected' : 'Secure authentication'}
      >
        {device.weakPassword ? (
          <LockOpenIcon className="h-3 w-3 mr-1" />
        ) : (
          <LockClosedIcon className="h-3 w-3 mr-1" />
        )}
        {device.weakPassword ? 'Weak Auth' : 'Secure Auth'}
      </span>
      
      {/* CPU Usage */}
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          device.metrics.cpu > 80 
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
            : device.metrics.cpu > 60 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        }`}
        title={`CPU Usage: ${Math.round(device.metrics.cpu)}%`}
      >
        <CpuChipIcon className="h-3 w-3 mr-1" />
        {Math.round(device.metrics.cpu)}%
      </span>
      
      {/* Memory Usage */}
      <span 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          device.metrics.mem > 80 
            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
            : device.metrics.mem > 60 
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
        }`}
        title={`Memory Usage: ${Math.round(device.metrics.mem)}%`}
      >
        <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6h2m7-6h2m2 6h2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
        </svg>
        {Math.round(device.metrics.mem)}%
      </span>
      
      {/* Network Activity */}
      <span 
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
        title={`Network: ${device.metrics.netIn.toFixed(1)}kbps in / ${device.metrics.netOut.toFixed(1)}kbps out`}
      >
        <WifiIcon className="h-3 w-3 mr-1" />
        {(device.metrics.netIn + device.metrics.netOut).toFixed(1)}kbps
      </span>
      
      {/* Battery (if applicable) */}
      {device.metrics.battery !== undefined && (
        <span 
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            device.metrics.battery < 20 
              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
              : device.metrics.battery < 50 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          }`}
          title={`Battery: ${Math.round(device.metrics.battery)}%`}
        >
          <Battery50Icon className="h-3 w-3 mr-1" />
          {Math.round(device.metrics.battery)}%
        </span>
      )}
    </div>
  );
};

export default StatusBadges;
