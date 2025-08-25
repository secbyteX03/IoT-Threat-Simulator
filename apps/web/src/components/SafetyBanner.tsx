import { motion } from 'framer-motion';
import { ShieldExclamationIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SafetyBannerProps {
  onDismiss?: () => void;
  className?: string;
}

const SafetyBanner: React.FC<SafetyBannerProps> = ({ onDismiss, className = '' }) => {
  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 ${className}`}
    >
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="w-0 flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800/50">
              <ShieldExclamationIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
            </span>
            <p className="ml-3 font-medium text-yellow-800 dark:text-yellow-200">
              <span className="md:hidden">This is a simulation only.</span>
              <span className="hidden md:inline">
                This is a simulation only. No real devices or networks are being accessed or compromised.
              </span>
            </p>
          </div>
          {onDismiss && (
            <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
              <button
                type="button"
                onClick={onDismiss}
                className="-mr-1 flex p-2 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/50 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SafetyBanner;
