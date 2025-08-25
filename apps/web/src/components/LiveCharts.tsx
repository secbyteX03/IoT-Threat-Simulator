import { useEffect, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { Device } from '../../../server/src/types';
import { useStore } from '../store';
import { motion } from 'framer-motion';

// Maximum number of data points to show in the chart
const MAX_DATA_POINTS = 30;

interface MetricDataPoint {
  timestamp: number;
  value: number;
}

interface MetricHistory {
  cpu: MetricDataPoint[];
  mem: MetricDataPoint[];
  netIn: MetricDataPoint[];
  netOut: MetricDataPoint[];
  msgRate?: MetricDataPoint[];
  battery?: MetricDataPoint[];
  failedAuth?: MetricDataPoint[];
}

interface ChartDataPoint {
  name: string;
  timestamp: number;
  cpu: number;
  mem: number;
  netIn: number;
  netOut: number;
  msgRate?: number;
  battery?: number;
  failedAuth?: number;
}

const LiveCharts: React.FC<{ device: Device }> = ({ device }) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<{
    [key: string]: boolean;
  }>({
    cpu: true,
    mem: true,
    netIn: true,
    netOut: true,
    msgRate: true,
    battery: true,
    failedAuth: true,
  });
  
  const [timeRange, setTimeRange] = useState(60); // seconds
  const [activeTab, setActiveTab] = useState('metrics');
  const prevDeviceIdRef = useRef<string | null>(null);
  const state = useStore((s) => s.state);

  // Initialize or reset chart data when device changes
  useEffect(() => {
    if (prevDeviceIdRef.current !== device.id) {
      setChartData([]);
      prevDeviceIdRef.current = device.id;
    }
  }, [device.id]);

  // Update chart data when device metrics change
  useEffect(() => {
    const now = Date.now();
    const newDataPoint: ChartDataPoint = {
      name: new Date(now).toLocaleTimeString(),
      timestamp: now,
      cpu: device.metrics.cpu,
      mem: device.metrics.mem,
      netIn: device.metrics.netIn,
      netOut: device.metrics.netOut,
    };

    if (device.metrics.msgRate !== undefined) {
      newDataPoint.msgRate = device.metrics.msgRate;
    }
    if (device.metrics.battery !== undefined) {
      newDataPoint.battery = device.metrics.battery;
    }
    if (device.metrics.failedAuth !== undefined) {
      newDataPoint.failedAuth = device.metrics.failedAuth;
    }

    setChartData((prevData) => {
      // Filter out old data points outside the time range
      const timeThreshold = now - timeRange * 1000;
      const filteredData = prevData.filter(
        (point) => point.timestamp >= timeThreshold
      );
      
      // Add new data point
      return [...filteredData, newDataPoint].slice(-MAX_DATA_POINTS);
    });
  }, [device.metrics, timeRange]);

  // Toggle metric visibility
  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {new Date(payload[0].payload.timestamp).toLocaleTimeString()}
          </p>
          {payload.map((entry: any) => (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between text-xs"
              style={{ color: entry.color }}
            >
              <div className="flex items-center">
                <div
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="capitalize">{entry.dataKey}:</span>
              </div>
              <span className="font-mono ml-2">
                {entry.dataKey.includes('net')
                  ? `${entry.value.toFixed(2)} kbps`
                  : entry.dataKey === 'battery'
                  ? `${entry.value.toFixed(1)}%`
                  : entry.dataKey === 'msgRate'
                  ? `${Math.round(entry.value)} msgs/s`
                  : `${entry.value.toFixed(1)}%`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const renderColorfulLegendText = (value: string, entry: any) => {
    const { color } = entry;
    return (
      <span
        className={`text-xs cursor-pointer ${
          selectedMetrics[value] ? 'opacity-100' : 'opacity-40'
        }`}
        style={{ color }}
        onClick={() => toggleMetric(value)}
      >
        {value}
      </span>
    );
  };

  // Chart colors
  const colors = {
    cpu: '#3b82f6', // blue-500
    mem: '#10b981', // emerald-500
    netIn: '#f59e0b', // amber-500
    netOut: '#8b5cf6', // violet-500
    msgRate: '#ec4899', // pink-500
    battery: '#06b6d4', // cyan-500
    failedAuth: '#ef4444', // red-500
  };

  // Render appropriate chart based on active tab
  const renderChart = () => {
    if (activeTab === 'metrics') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={30}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={renderColorfulLegendText} />
            
            {selectedMetrics.cpu && (
              <Area
                type="monotone"
                dataKey="cpu"
                name="CPU"
                stroke={colors.cpu}
                fill={colors.cpu}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {selectedMetrics.mem && (
              <Area
                type="monotone"
                dataKey="mem"
                name="Memory"
                stroke={colors.mem}
                fill={colors.mem}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {selectedMetrics.battery && device.metrics.battery !== undefined && (
              <Area
                type="monotone"
                dataKey="battery"
                name="Battery"
                stroke={colors.battery}
                fill={colors.battery}
                fillOpacity={0.2}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (activeTab === 'network') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(value) => `${value} kbps`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={renderColorfulLegendText} />
            
            {selectedMetrics.netIn && (
              <Line
                type="monotone"
                dataKey="netIn"
                name="Network In"
                stroke={colors.netIn}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {selectedMetrics.netOut && (
              <Line
                type="monotone"
                dataKey="netOut"
                name="Network Out"
                stroke={colors.netOut}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
            
            {selectedMetrics.msgRate && device.metrics.msgRate !== undefined && (
              <Line
                type="monotone"
                dataKey="msgRate"
                name="Message Rate"
                stroke={colors.msgRate}
                strokeWidth={2}
                dot={false}
                yAxisId="right"
                isAnimationActive={false}
              />
            )}
            
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(value) => `${value}/s`}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (activeTab === 'security') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData.slice(-10)} // Show only recent data for better visibility
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={10}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={renderColorfulLegendText} />
            
            {selectedMetrics.failedAuth && device.metrics.failedAuth !== undefined && (
              <Bar
                dataKey="failedAuth"
                name="Failed Auth"
                fill={colors.failedAuth}
                radius={[4, 4, 0, 0]}
              />
            )}
            
            {/* Add reference lines for attack thresholds */}
            {state.attack.dictionaryAttack > 50 && (
              <ReferenceLine
                y={10}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: 'Danger Threshold',
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 12,
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Chart Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {device.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {device.type.replace('_', ' ')} • {device.firmwareVersion}
            {device.compromised && (
              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full dark:bg-red-900/30 dark:text-red-300">
                Compromised
              </span>
            )}
            {device.integrityRisk && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full dark:bg-yellow-900/30 dark:text-yellow-300">
                Integrity Risk
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={30}>Last 30s</option>
            <option value={60}>Last 1m</option>
            <option value={300}>Last 5m</option>
            <option value={600}>Last 10m</option>
          </select>
        </div>
      </div>
      
      {/* Chart Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          {[
            { id: 'metrics', label: 'Metrics' },
            { id: 'network', label: 'Network' },
            { id: 'security', label: 'Security' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Chart Container */}
      <div className="flex-1 p-4">
        {chartData.length > 0 ? (
          renderChart()
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>Collecting data... {chartData.length === 0 ? '(waiting for updates)' : ''}</p>
          </div>
        )}
      </div>
      
      {/* Metrics Summary */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-gray-500 dark:text-gray-400">CPU:</span>
            <span className="ml-1 font-medium">{Math.round(device.metrics.cpu)}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
            <span className="text-gray-500 dark:text-gray-400">Mem:</span>
            <span className="ml-1 font-medium">{Math.round(device.metrics.mem)}%</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
            <span className="text-gray-500 dark:text-gray-400">Net In:</span>
            <span className="ml-1 font-mono">{device.metrics.netIn.toFixed(2)} kbps</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-violet-500 mr-2"></div>
            <span className="text-gray-500 dark:text-gray-400">Net Out:</span>
            <span className="ml-1 font-mono">{device.metrics.netOut.toFixed(2)} kbps</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCharts;
