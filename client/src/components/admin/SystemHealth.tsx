import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Clock, Database, Server, AlertTriangle } from 'lucide-react';

interface QueueMetrics {
  name: string;
  active: number;
  waiting: number;
  failed: number;
  completed: number;
  latency: number;
}

interface SystemMetrics {
  uptime: number;
  timestamp: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  db: {
    status: string;
    latency: number;
  };
  queues: {
    image: QueueMetrics;
    ai: QueueMetrics;
    audit: QueueMetrics;
  };
}

const SystemHealth: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [latencyHistory, setLatencyHistory] = useState<any[]>([]);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/system-health');
      const data: SystemMetrics = await response.json();
      setMetrics(data);
      updateHistory(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch system metrics', error);
      setLoading(false);
    }
  };

  const updateHistory = (data: SystemMetrics) => {
    setLatencyHistory(prev => {
      const newPoint = {
        time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        'Image Latency': data.queues.image.latency,
        'AI Latency': data.queues.ai.latency,
        'Audit Latency': data.queues.audit.latency,
        'DB Latency': data.db.latency,
      };
      const newHistory = [...prev, newPoint];
      if (newHistory.length > 20) return newHistory.slice(newHistory.length - 20);
      return newHistory;
    });
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-6 text-center text-gray-500 animate-pulse">
        Loading system health...
      </div>
    );
  }

  const queueData = [
    { name: 'Image', ...metrics.queues.image },
    { name: 'AI', ...metrics.queues.ai },
    { name: 'Audit', ...metrics.queues.audit },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Activity className="w-6 h-6 text-emerald-600" />
        System Health Monitor
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Server className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Heap Usage</p>
            <p className="text-xl font-bold text-gray-800">
              {metrics.memory.heapUsed} MB
            </p>
            <p className="text-xs text-blue-600">
              {Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)}% of Allocated
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-lg">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Uptime</p>
            <p className="text-xl font-bold text-gray-800">
              {Math.floor(metrics.uptime / 60)} m {Math.floor(metrics.uptime % 60)} s
            </p>
            <p className="text-xs text-purple-600">Since last restart</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-lg">
            <Database className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Database</p>
            <p className="text-xl font-bold text-gray-800">
              {metrics.db.latency} ms
            </p>
            <p className={`text-xs ${metrics.db.status === 'connected' ? 'text-green-600' : 'text-red-500'}`}>
              {metrics.db.status === 'connected' ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Jobs</p>
            <p className="text-xl font-bold text-emerald-600">
              {queueData.reduce((acc, q) => acc + q.completed + q.failed + q.waiting + q.active, 0)}
            </p>
            <p className="text-xs text-emerald-600 uppercase font-bold">
               {queueData.reduce((acc, q) => acc + q.active, 0) > 0 ? 'Processing...' : 'Idle'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency History Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Job & DB Latency (ms)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Image Latency" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="AI Latency" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="DB Latency" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Queue Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Queue Job Status
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: '#F3F4F6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend />
                <Bar dataKey="active" stackId="a" fill="#3B82F6" name="Active" radius={[0, 0, 4, 4]} />
                <Bar dataKey="waiting" stackId="a" fill="#F59E0B" name="Waiting" />
                <Bar dataKey="failed" stackId="a" fill="#EF4444" name="Failed" />
                <Bar dataKey="completed" stackId="a" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
       
        {/* Failed Jobs Alert Area */}
       {queueData.some(q => q.failed > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
             <div>
                 <h4 className="font-semibold text-red-900">Failed Jobs Detected</h4>
                 <p className="text-sm text-red-700 mt-1">
                     There are failed jobs in the queues. 
                     {queueData.filter(q => q.failed > 0).map(q => ` ${q.name}: ${q.failed}`).join(',')}
                 </p>
             </div>
        </div>
       )}
    </div>
  );
};

export default SystemHealth;
