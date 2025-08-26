import React from 'react';
import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface SeverityPillProps {
  severity: Severity;
  size?: 'small' | 'medium';
}

export const SeverityPill: React.FC<SeverityPillProps> = ({ 
  severity, 
  size = 'small' 
}) => {
  const theme = useTheme();
  
  const getColor = () => {
    switch (severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.dark;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
      default:
        return theme.palette.success.main;
    }
  };

  const getLabel = () => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <Chip
      label={getLabel()}
      size={size}
      sx={{
        backgroundColor: `${getColor()}15`, // 15% opacity
        color: getColor(),
        fontWeight: 600,
        '& .MuiChip-label': {
          px: 1,
        },
      }}
    />
  );
};
