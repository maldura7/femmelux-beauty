'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui';

interface StatusDataPoint {
  status: string;
  count: number;
  label?: string;
}

interface OrdersStatusChartProps {
  data: StatusDataPoint[];
  title?: string;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',     // Yellow/Warning
  confirmed: '#3B82F6',   // Blue
  processing: '#8B5CF6',  // Purple
  shipped: '#F97316',     // Orange
  delivered: '#10B981',   // Green/Success
  cancelled: '#EF4444',   // Red/Error
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-600">
          {data.label || STATUS_LABELS[data.status] || data.status}
        </p>
        <p className="text-lg font-bold text-secondary-800">
          {data.count} orders
        </p>
        <p className="text-sm text-gray-500">
          {data.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">
            {entry.payload.label || STATUS_LABELS[entry.payload.status] || entry.payload.status}
          </span>
        </div>
      ))}
    </div>
  );
};

export function OrdersStatusChart({
  data,
  title = 'Orders by Status',
  isLoading = false,
}: OrdersStatusChartProps) {
  // Calculate percentages and add colors
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const chartData = data.map((item) => ({
    ...item,
    label: item.label || STATUS_LABELS[item.status] || item.status,
    percentage: total > 0 ? ((item.count / total) * 100).toFixed(1) : '0',
    color: STATUS_COLORS[item.status] || '#6B7280',
  }));

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart...</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (data.length === 0 || total === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No order data available
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: '-40px' }}>
          <div className="text-center">
            <p className="text-3xl font-bold text-secondary-800">{total}</p>
            <p className="text-sm text-gray-500">Total Orders</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default OrdersStatusChart;
