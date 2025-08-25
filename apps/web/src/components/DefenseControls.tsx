import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  DocumentCheckIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface DefenseControlsProps {
  defense: {
    rateLimiting: boolean;
    accountLockout: boolean;
    signatureCheck: boolean;
  };
  onChange: (defense: any) => void;
}

const DefenseControls: React.FC<DefenseControlsProps> = ({ defense, onChange }) => {
  const [localDefense, setLocalDefense] = useState(defense);
  const [isExpanded, setIsExpanded] = useState(true);

  // Sync with parent state
  useEffect(() => {
    setLocalDefense(defense);
  }, [defense]);

  const handleChange = (key: string, value: boolean) => {
    const updated = { ...localDefense, [key]: value };
    setLocalDefense(updated);
    onChange(updated);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const DefenseToggle = ({
    label,
    description,
    icon: Icon,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    icon: React.ElementType;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center">
        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-3">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {label}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        className={`${
          checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <button
        onClick={toggleExpand}
        className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
      >
        <div className="flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2 text-blue-500" />
          <span>Defense Mechanisms</span>
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
          <DefenseToggle
            label="Rate Limiting"
            description="Limits the rate of incoming requests"
            icon={LockClosedIcon}
            checked={localDefense.rateLimiting}
            onChange={(checked) => handleChange('rateLimiting', checked)}
          />
          
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
          
          <DefenseToggle
            label="Account Lockout"
            description="Locks accounts after multiple failed attempts"
            icon={LockClosedIcon}
            checked={localDefense.accountLockout}
            onChange={(checked) => handleChange('accountLockout', checked)}
          />
          
          <div className="h-px bg-gray-200 dark:bg-gray-700 my-2"></div>
          
          <DefenseToggle
            label="Firmware Signature Check"
            description="Verifies firmware integrity"
            icon={DocumentCheckIcon}
            checked={localDefense.signatureCheck}
            onChange={(checked) => handleChange('signatureCheck', checked)}
          />
          
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 mr-1" />
              <p className="text-xs text-gray-600 dark:text-gray-300">
                <strong>Tip:</strong> Toggle these defenses to see how they mitigate different attack vectors. 
                For example, enable "Rate Limiting" to reduce the impact of SYN Flood attacks, or "Account Lockout" 
                to prevent dictionary attacks.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DefenseControls;
