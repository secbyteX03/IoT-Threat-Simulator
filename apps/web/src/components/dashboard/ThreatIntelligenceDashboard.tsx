import React, { useEffect, useState, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  useTheme, 
  Button, 
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
  useMediaQuery
} from '@mui/material';
import { 
  DashboardState, 
  ThreatIntelData, 
  ThreatMetric, 
  ThreatCategory, 
  ThreatActivity 
} from '@/types/dashboard';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Device } from '@/types/simulation';
import { formatDistanceToNow } from 'date-fns';
import { SeverityPill } from '../common/SeverityPill';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import RefreshIcon from '@mui/icons-material/Refresh';
import SecurityIcon from '@mui/icons-material/Security';
import TimelineIcon from '@mui/icons-material/Timeline';
import DevicesIcon from '@mui/icons-material/Devices';
import WarningIcon from '@mui/icons-material/Warning';
import ShieldIcon from '@mui/icons-material/Shield';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Types for threat analysis
interface ThreatAnalysis {
  totalThreats: number;
  devicesAtRisk: number;
  threatsByType: Record<string, number>;
  recentThreats: ThreatActivity[];
  threatTrend: 'up' | 'down' | 'stable';
  threatTrendValue: number;
}

// Time ranges for filtering data
const TIME_RANGES = [
  { value: '1h', label: 'Last hour' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' }
];

interface ThreatIntelligenceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatIntelligenceDashboard: React.FC<ThreatIntelligenceDashboardProps> = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { devices, events, connected } = useSimulationStore();
  
  const [dashboardState, setDashboardState] = useState<DashboardState>({
    isOpen,
    timeRange: '24h',
    isLoading: false,
    error: null,
    data: getInitialDashboardData(devices, events)
  });

  // Analyze threats from events and devices
  const analyzeThreats = useCallback((timeRange: string = '24h'): ThreatAnalysis => {
    const now = Date.now();
    let timeFilter = (date: Date): boolean => true;
    
    // Set time filter based on selected range
    switch (timeRange) {
      case '1h':
        timeFilter = (date) => date.getTime() > now - 3600000; // 1 hour
        break;
      case '24h':
        timeFilter = (date) => date.getTime() > now - 86400000; // 24 hours
        break;
      case '7d':
        timeFilter = (date) => date.getTime() > now - 604800000; // 7 days
        break;
      case '30d':
        timeFilter = (date) => date.getTime() > now - 2592000000; // 30 days
        break;
    }

    // Filter events by time range and type
    const relevantEvents = events.filter(event => 
      timeFilter(new Date(event.timestamp)) && 
      (event.type === 'attack' || event.type === 'alert' || event.type === 'warning')
    );

    // Count threats by type
    const threatsByType: Record<string, number> = {};
    relevantEvents.forEach(event => {
      const type = event.type === 'attack' ? (event.subType || 'attack') : event.type;
      threatsByType[type] = (threatsByType[type] || 0) + 1;
    });

    // Get recent threats (last 10)
    const recentThreats = relevantEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        type: event.type,
        deviceId: event.deviceId,
        deviceName: devices.find(d => d.id === event.deviceId)?.name || 'Unknown Device',
        severity: event.severity || 'medium',
        description: event.message || `Detected ${event.type} activity`,
        sourceIp: event.sourceIp || 'Unknown',
        targetPort: event.targetPort || 0
      }));

    // Calculate trend (simplified for example)
    const threatCount = relevantEvents.length;
    const previousPeriodCount = Math.floor(threatCount * 0.7); // Simulate previous period
    const trendValue = threatCount > 0 
      ? Math.round(((threatCount - previousPeriodCount) / previousPeriodCount) * 100) 
      : 0;

    return {
      totalThreats: threatCount,
      devicesAtRisk: devices.filter(d => d.compromised || d.integrityRisk).length,
      threatsByType,
      recentThreats,
      threatTrend: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'stable',
      threatTrendValue: Math.abs(trendValue)
    };
  }, [devices, events]);

  // Update dashboard data when dependencies change
  useEffect(() => {
    if (!isOpen) return;
    
    setDashboardState(prev => ({
      ...prev,
      isLoading: true
    }));

    // Simulate API call delay
    const timer = setTimeout(() => {
      try {
        const analysis = analyzeThreats(dashboardState.timeRange);
        const categories = Object.entries(analysis.threatsByType)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count], index, arr) => ({
            id: type,
            name: type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            count,
            percentage: Math.round((count / analysis.totalThreats) * 100) || 0
          }));
        
        // Ensure we have at least some categories
        if (categories.length === 0) {
          categories.push(
            { id: 'no-threats', name: 'No Threats Detected', count: 0, percentage: 0 }
          );
        }

        setDashboardState(prev => ({
          ...prev,
          isLoading: false,
          data: {
            metrics: [
              { 
                id: 'devices-at-risk', 
                name: 'Devices at Risk', 
                value: analysis.devicesAtRisk, 
                unit: '', 
                trend: analysis.threatTrend,
                trendValue: analysis.threatTrendValue
              },
              { 
                id: 'total-threats', 
                name: 'Total Threats', 
                value: analysis.totalThreats, 
                unit: '', 
                trend: analysis.threatTrend,
                trendValue: analysis.threatTrendValue
              },
              { 
                id: 'mitigated', 
                name: 'Mitigated', 
                value: Math.floor(analysis.totalThreats * 0.7), // Simulated mitigation
                unit: '', 
                trend: 'down',
                trendValue: 15
              },
              { 
                id: 'response-time', 
                name: 'Avg. Response', 
                value: 2.4, 
                unit: 'min', 
                trend: 'down',
                trendValue: 8
              },
            ],
            categories,
            recentActivities: analysis.recentThreats,
            lastUpdated: Date.now()
          },
          error: null
        }));
      } catch (error) {
        console.error('Error updating dashboard:', error);
        setDashboardState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to update dashboard'
        }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isOpen, devices, events, dashboardState.timeRange, analyzeThreats]);

  // Handle time range change
  const handleTimeRangeChange = (range: string) => {
    setDashboardState(prev => ({
      ...prev,
      timeRange: range as any
    }));
  };

  // Handle manual refresh
  const handleRefresh = () => {
    setDashboardState(prev => ({
      ...prev,
      data: getInitialDashboardData(devices, events)
    }));
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (dashboardState.isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (dashboardState.error) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          Error loading dashboard data: {dashboardState.error}
        </Alert>
      );
    }

    return (
      <>
        {/* Header with title and controls */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Threat Intelligence Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {new Date(dashboardState.data.lastUpdated).toLocaleTimeString()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" variant="outlined" sx={{ minWidth: 180 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={dashboardState.timeRange}
                onChange={(e) => handleTimeRangeChange(e.target.value)}
                label="Time Range"
              >
                {TIME_RANGES.map((range) => (
                  <MenuItem key={range.value} value={range.value}>
                    {range.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              disabled={dashboardState.isLoading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* Metrics Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {dashboardState.data.metrics.map((metric) => (
            <Grid item xs={12} sm={6} md={3} key={metric.id}>
              <MetricCard 
                title={metric.name}
                value={metric.value}
                unit={metric.unit}
                trend={metric.trend}
                trendValue={metric.trendValue}
                icon={getMetricIcon(metric.id)}
              />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Threat Categories */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h6" component="h3">
                  Threat Categories
                </Typography>
                <Chip 
                  label={`${dashboardState.data.categories.length} types`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </Box>
              
              <List disablePadding>
                {dashboardState.data.categories.map((category) => (
                  <CategoryItem 
                    key={category.id}
                    name={category.name}
                    count={category.count}
                    percentage={category.percentage}
                    onClick={() => {}}
                  />
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}>
                <Typography variant="h6" component="h3">
                  Recent Threat Activities
                </Typography>
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIosIcon fontSize="small" />}
                  onClick={() => {}}
                >
                  View All
                </Button>
              </Box>
              
              <List disablePadding>
                {dashboardState.data.recentActivities.length > 0 ? (
                  dashboardState.data.recentActivities.map((activity) => (
                    <ActivityItem 
                      key={activity.id}
                      timestamp={activity.timestamp}
                      deviceName={activity.deviceName}
                      description={activity.description}
                      severity={activity.severity}
                      sourceIp={activity.sourceIp}
                      targetPort={activity.targetPort}
                    />
                  ))
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SecurityIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      No threat activities detected in the selected time range
                    </Typography>
                  </Box>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </>
    );
  };

  // Helper function to get appropriate icon for each metric
  const getMetricIcon = (metricId: string) => {
    switch (metricId) {
      case 'devices-at-risk':
        return <DevicesIcon color="error" />;
      case 'total-threats':
        return <WarningIcon color="warning" />;
      case 'mitigated':
        return <ShieldIcon color="success" />;
      case 'response-time':
        return <TimelineIcon color="info" />;
      default:
        return <AnalyticsIcon color="primary" />;
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      {/* Main content */}
      {renderContent()}

      {/* Close button */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          startIcon={<ArrowBackIcon />}
          sx={{
            borderRadius: 28,
            boxShadow: theme.shadows[8],
            '&:hover': {
              boxShadow: theme.shadows[12],
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit = '', 
  trend, 
  trendValue,
  icon 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUpIcon color="error" />;
    if (trend === 'down') return <TrendingDownIcon color="success" />;
    return <TrendingFlatIcon color="disabled" />;
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getTrendIcon()}
            {trendValue !== undefined && (
              <Typography variant="caption" color={trend === 'up' ? 'error' : 'success'}>
                {trendValue}%
              </Typography>
            )}
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        {icon && icon}
        <Typography variant="h4">
          {typeof value === 'number' ? value.toLocaleString() : value} {unit}
        </Typography>
      </Box>
    </Paper>
  );
};

interface CategoryItemProps {
  name: string;
  count: number;
  percentage: number;
  onClick?: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ name, count, percentage, onClick }) => (
  <Box sx={{ mb: 2 }} onClick={onClick}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2">{name}</Typography>
      <Typography variant="body2" fontWeight="medium">{count}</Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={Math.min(100, Math.max(0, percentage))} // Ensure percentage is between 0-100
      sx={{
        height: 8,
        borderRadius: 4,
        backgroundColor: 'action.disabledBackground',
        '& .MuiLinearProgress-bar': {
          borderRadius: 4,
        },
      }}
    />
  </Box>
);

interface ActivityItemProps {
  timestamp: number | string;
  deviceName: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIp?: string;
  targetPort?: number;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ 
  timestamp, 
  deviceName, 
  description, 
  severity, 
  sourceIp, 
  targetPort 
}) => (
  <ListItem 
    divider 
    sx={{ 
      px: 2, 
      py: 1.5,
      '&:hover': {
        backgroundColor: 'action.hover',
      },
    }}
  >
    <ListItemIcon sx={{ minWidth: 40 }}>
      <SeverityPill severity={severity} />
    </ListItemIcon>
    <ListItemText
      primary={
        <Typography variant="body2" component="span" display="block">
          {description}
        </Typography>
      }
      secondary={
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(timestamp), { addSuffix: true })} • {deviceName}
          {sourceIp && ` • ${sourceIp}`}
          {targetPort && `:${targetPort}`}
        </Typography>
      }
      sx={{ m: 0 }}
    />
  </ListItem>
);

// Helper function to generate initial dashboard data
const getInitialDashboardData = (devices: Device[], events: any[]): ThreatIntelData => {
  const devicesAtRisk = devices.filter(d => d.compromised || d.integrityRisk).length;
  const totalThreats = events.filter(e => e.type === 'attack' || e.type === 'alert').length;
  
  return {
    metrics: [
      { id: 'devices-at-risk', name: 'Devices at Risk', value: devicesAtRisk, unit: '', trend: 'up', trendValue: 12 },
      { id: 'total-threats', name: 'Total Threats', value: totalThreats, unit: '', trend: 'up', trendValue: 8 },
      { id: 'mitigated', name: 'Threats Mitigated', value: Math.floor(totalThreats * 0.7), unit: '', trend: 'down', trendValue: 5 },
      { id: 'avg-response', name: 'Avg. Response Time', value: 2.4, unit: 'min', trend: 'down', trendValue: 15 },
    ],
    categories: [
      { id: 'brute-force', name: 'Brute Force', count: 42, percentage: 35 },
      { id: 'dos', name: 'Denial of Service', count: 28, percentage: 23 },
      { id: 'malware', name: 'Malware', count: 25, percentage: 21 },
      { id: 'exploits', name: 'Exploits', count: 15, percentage: 13 },
      { id: 'other', name: 'Other', count: 10, percentage: 8 },
    ],
    recentActivities: [
      {
        id: '1',
        timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
        type: 'brute_force',
        deviceId: 'device-1',
        deviceName: 'Front Door Camera',
        severity: 'high',
        description: 'Multiple failed login attempts detected',
        sourceIp: '192.168.1.100',
        targetPort: 22
      },
      {
        id: '2',
        timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
        type: 'dos',
        deviceId: 'device-2',
        deviceName: 'Smart Thermostat',
        severity: 'critical',
        description: 'Potential DoS attack detected',
        sourceIp: '45.33.15.78',
        targetPort: 80
      },
      {
        id: '3',
        timestamp: Date.now() - 1000 * 60 * 45, // 45 minutes ago
        type: 'malware',
        deviceId: 'device-3',
        deviceName: 'Living Room TV',
        severity: 'medium',
        description: 'Suspicious network activity detected',
        sourceIp: '10.0.0.15'
      },
    ],
    devicesAtRisk,
    totalThreats,
    lastUpdated: Date.now()
  };
};
