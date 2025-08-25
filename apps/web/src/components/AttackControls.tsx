import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldExclamationIcon, 
  KeyIcon, 
  CloudIcon, 
  CodeBracketIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface AttackControlsProps {
  attack: {
    synFlood: number;
    dictionaryAttack: number;
    mqttFlood: number;
    firmwareTamper: boolean;
  };
  onChange: (attack: any) => void;
}

const AttackControls: React.FC<AttackControlsProps> = ({ attack, onChange }) => {
  const [localAttack, setLocalAttack] = useState(attack);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync with parent state
  useEffect(() => {
    setLocalAttack(attack);
  }, [attack]);

  const handleChange = (key: string, value: number | boolean) => {
    const updated = { ...localAttack, [key]: value };
    setLocalAttack(updated);
    onChange(updated);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const AttackSlider = ({
    label,
    value,
    onChange,
    icon: Icon,
    description,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon: React.ElementType;
    description: string;
  }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <Icon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <div className="relative group ml-1">
            <InformationCircleIcon className="h-4 w-4 text-gray-400" />
            <div className="absolute z-10 hidden group-hover:block w-64 p-2 -left-32 -top-10 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
              {description}
            </div>
          </div>
        </div>
        <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {value}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>Off</span>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
        <span>Max</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <button
        onClick={toggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
      >
        <div className="flex items-center">
          <ShieldExclamationIcon className="h-5 w-5 mr-2 text-red-500" />
          <span>Attack Vectors</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>
      
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="p-4 pt-2 border-t border-gray-200 dark:border-gray-700">
          <AttackSlider
            label="SYN Flood"
            value={localAttack.synFlood}
            onChange={(value) => handleChange('synFlood', value)}
            icon={CloudIcon}
            description="Simulates a SYN flood attack, overwhelming the device with TCP connection requests, causing high CPU usage and network congestion."
          />
          
          <AttackSlider
            label="Dictionary Attack"
            value={localAttack.dictionaryAttack}
            onChange={(value) => handleChange('dictionaryAttack', value)}
            icon={KeyIcon}
            description="Simulates brute force login attempts. If the device has weak credentials, it will be marked as compromised after multiple failed attempts."
          />
          
          <AttackSlider
            label="MQTT Flood"
            value={localAttack.mqttFlood}
            onChange={(value) => handleChange('mqttFlood', value)}
            icon={CloudIcon}
            description="Simulates a flood of MQTT messages, causing high memory usage and potentially disrupting device communication."
          />
          
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CodeBracketIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Firmware Tampering
              </span>
              <div className="relative group ml-1">
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                <div className="absolute z-10 hidden group-hover:block w-64 p-2 -left-32 -top-16 bg-white dark:bg-gray-800 shadow-lg rounded-md border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300">
                  Simulates unauthorized firmware modifications, potentially introducing vulnerabilities or backdoors into the device.
                </div>
              </div>
            </div>
            <button
              type="button"
              className={`${
                localAttack.firmwareTamper
                  ? 'bg-red-600 dark:bg-red-700'
                  : 'bg-gray-200 dark:bg-gray-700'
              } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
              role="switch"
              aria-checked={localAttack.firmwareTamper}
              onClick={() => handleChange('firmwareTamper', !localAttack.firmwareTamper)}
            >
              <span className="sr-only">Toggle firmware tampering</span>
              <span
                aria-hidden="true"
                className={`${
                  localAttack.firmwareTamper ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
              />
            </button>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              <strong>Note:</strong> These are simulated attacks with no real network impact. 
              The simulation demonstrates how different attack vectors affect device metrics.
            </div>
            <div className="flex items-center text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded">
              <InformationCircleIcon className="h-4 w-4 mr-1 flex-shrink-0" />
              <span>Monitor the device metrics to see the impact of each attack vector.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttackControls;
