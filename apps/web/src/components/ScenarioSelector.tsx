import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BeakerIcon, 
  BoltIcon, 
  ShieldExclamationIcon, 
  LockClosedIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface ScenarioSelectorProps {
  onSelect: (scenario: any) => void;
}

const scenarios = [
  {
    id: 'quiet-lab',
    name: 'Quiet Lab',
    description: 'No active attacks, all devices operating normally',
    icon: BeakerIcon,
    attack: {
      synFlood: 0,
      dictionaryAttack: 0,
      mqttFlood: 0,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: true,
      accountLockout: true,
      signatureCheck: true,
    },
    start: true
  },
  {
    id: 'dos-attack',
    name: 'Denial of Service',
    description: 'SYN flood attack on vulnerable devices',
    icon: BoltIcon,
    attack: {
      synFlood: 80,
      dictionaryAttack: 0,
      mqttFlood: 0,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: false,
      accountLockout: false,
      signatureCheck: true,
    },
    start: true
  },
  {
    id: 'credential-stuffing',
    name: 'Credential Stuffing',
    description: 'Dictionary attack on devices with weak credentials',
    icon: ShieldExclamationIcon,
    attack: {
      synFlood: 0,
      dictionaryAttack: 70,
      mqttFlood: 0,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: false,
      accountLockout: false,
      signatureCheck: true,
    },
    start: true
  },
  {
    id: 'mqtt-exploit',
    name: 'MQTT Exploit',
    description: 'Flooding MQTT broker with messages',
    icon: CloudIcon,
    attack: {
      synFlood: 0,
      dictionaryAttack: 0,
      mqttFlood: 85,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: false,
      accountLockout: true,
      signatureCheck: true,
    },
    start: true
  },
  {
    id: 'firmware-tampering',
    name: 'Firmware Tampering',
    description: 'Unauthorized firmware modification',
    icon: LockClosedIcon,
    attack: {
      synFlood: 0,
      dictionaryAttack: 0,
      mqttFlood: 0,
      firmwareTamper: true,
    },
    defense: {
      rateLimiting: true,
      accountLockout: true,
      signatureCheck: false,
    },
    start: true
  },
  {
    id: 'full-defense',
    name: 'Full Defense',
    description: 'All security measures enabled',
    icon: ShieldCheckIcon,
    attack: {
      synFlood: 0,
      dictionaryAttack: 0,
      mqttFlood: 0,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: true,
      accountLockout: true,
      signatureCheck: true,
    },
    start: false
  },
  {
    id: 'reset',
    name: 'Reset Simulation',
    description: 'Reset all devices and clear attack states',
    icon: ArrowPathIcon,
    attack: {
      synFlood: 0,
      dictionaryAttack: 0,
      mqttFlood: 0,
      firmwareTamper: false,
    },
    defense: {
      rateLimiting: false,
      accountLockout: false,
      signatureCheck: false,
    },
    start: false,
    reset: true
  }
];

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelect }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelect = (scenario: any) => {
    setSelectedId(scenario.id);
    onSelect(scenario);
    
    // Auto-collapse after selection
    setTimeout(() => setIsExpanded(false), 300);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <button
        onClick={toggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
      >
        <div className="flex items-center">
          <BeakerIcon className="h-5 w-5 mr-2 text-purple-500" />
          <span>Scenarios</span>
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

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                {scenarios.map((scenario) => {
                  const Icon = scenario.icon;
                  const isSelected = selectedId === scenario.id;
                  
                  return (
                    <motion.button
                      key={scenario.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
                      }`}
                      onClick={() => handleSelect(scenario)}
                    >
                      <div className="flex items-start">
                        <div className={`p-2 rounded-md ${
                          isSelected 
                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className={`text-sm font-medium ${
                              isSelected 
                                ? 'text-blue-800 dark:text-blue-200' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {scenario.name}
                            </h3>
                            {scenario.reset && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                Reset
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${
                            isSelected 
                              ? 'text-blue-700 dark:text-blue-300' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {scenario.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start text-sm text-gray-600 dark:text-gray-300">
                  <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 mr-1" />
                  <p className="text-xs">
                    <span className="font-medium">Tip:</span> Select a scenario to quickly apply a set of attack and defense configurations. 
                    Monitor the device metrics to see the impact of each scenario.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Fix for the missing CloudIcon
export function CloudIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
    </svg>
  );
}

// Fix for the missing ShieldCheckIcon
export function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

export default ScenarioSelector;
