import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Legend } from 'recharts';
import { StatCard } from '../components/StatCard';
import { ServerConfig } from '../types';

interface DashboardProps {
  serverConfig: ServerConfig;
}

const vramData = [
  { name: 'Used', value: 24, color: '#8b5cf6' }, // Purple
  { name: 'Free', value: 56, color: '#1c1c2e' }, // Dark
];

const activityData = [
  { time: '10:00', load: 20 },
  { time: '11:00', load: 45 },
  { time: '12:00', load: 80 },
  { time: '13:00', load: 60 },
  { time: '14:00', load: 90 },
  { time: '15:00', load: 75 },
];

const throughputData = [
  { name: 'LFM-2.5', tokens: 45000, color: '#8b5cf6' },
  { name: 'Saul-7B', tokens: 28000, color: '#10b981' },
  { name: 'Mistral', tokens: 12000, color: '#3b82f6' },
];

const healthData = [
  { subject: 'Thermal', A: 85, fullMark: 100 },
  { subject: 'Power', A: 65, fullMark: 100 },
  { subject: 'Memory', A: 90, fullMark: 100 },
  { subject: 'Compute', A: 45, fullMark: 100 },
  { subject: 'I/O', A: 70, fullMark: 100 },
  { subject: 'Network', A: 30, fullMark: 100 },
];

export const Dashboard: React.FC<DashboardProps> = ({ serverConfig }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Models" value="3" icon="🧠" trend="+1 Loaded" trendUp={true} />
        <StatCard title="Total VRAM" value={`${serverConfig.vramTotal} GB`} icon="💾" />
        <StatCard title="GPU Temp" value="68°C" icon="🌡️" trend="Nominal" trendUp={true} />
        <StatCard title="Daily Tokens" value="85.2k" icon="⚡" trend="+12% vs avg" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VRAM Usage */}
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <span className="text-6xl">💾</span>
          </div>
          <h3 className="text-lg font-semibold mb-4 w-full text-left flex items-center gap-2">VRAM Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vramData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {vramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between w-full px-8 mt-2 text-sm text-gray-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Used (24GB)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-nebula-700"></div> Free (56GB)</div>
          </div>
        </div>

        {/* GPU Load History */}
        <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">⚡ GPU Load History</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" vertical={false} />
                <XAxis dataKey="time" stroke="#4b5563" tickLine={false} axisLine={false} />
                <YAxis stroke="#4b5563" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="load" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLoad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Visualization Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Health Radar */}
          <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">🛡️ System Health Matrix</h3>
              <p className="text-xs text-gray-500 mb-4">Real-time telemetry across sub-systems</p>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={healthData}>
                          <PolarGrid stroke="#272730" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                              name="Status"
                              dataKey="A"
                              stroke="#10b981"
                              strokeWidth={2}
                              fill="#10b981"
                              fillOpacity={0.3}
                          />
                          <Tooltip contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }} />
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Model Throughput Bar */}
           <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">📊 Daily Token Throughput</h3>
              <p className="text-xs text-gray-500 mb-4">Total generation output by model family</p>
              <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={throughputData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" horizontal={false} />
                          <XAxis type="number" stroke="#4b5563" tick={{fontSize: 10}} />
                          <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" tick={{fontSize: 11}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }} />
                          <Bar dataKey="tokens" fill="#8884d8" radius={[0, 4, 4, 0]}>
                            {throughputData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">🚀 Recent Alerts</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 bg-nebula-950/50 rounded-lg border border-nebula-700/50">
            <span className="text-green-400 text-xl">✅</span>
            <div>
              <p className="text-sm font-medium">Fine-tuning Completed</p>
              <p className="text-xs text-gray-500">Llama-3-8b-SFT-v2 finished successfully in 4h 20m.</p>
            </div>
            <span className="ml-auto text-xs text-gray-600">10m ago</span>
          </div>
          <div className="flex items-center gap-4 p-3 bg-nebula-950/50 rounded-lg border border-nebula-700/50">
            <span className="text-yellow-400 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-medium">High VRAM Usage</p>
              <p className="text-xs text-gray-500">Process ID 4590 spiked to 95% VRAM usage.</p>
            </div>
            <span className="ml-auto text-xs text-gray-600">1h ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};