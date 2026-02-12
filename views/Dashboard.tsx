
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Legend } from 'recharts';
import { StatCard } from '../components/StatCard';
import { ServerConfig } from '../types';
import { ChevronLeft, ChevronRight, List, Trophy, Activity, ArrowRight } from 'lucide-react';

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

// Mock Data for Slides
const activeTasks = [
    { id: 1, name: 'Llama-3-8b SFT (Epoch 2/3)', progress: 65, status: 'Training', color: 'bg-purple-600' },
    { id: 2, name: 'Legal Corpus Indexing', progress: 32, status: 'Indexing', color: 'bg-blue-600' },
    { id: 3, name: 'Evaluation: TruthfulQA', progress: 88, status: 'Benchmarking', color: 'bg-green-600' },
];

const highScores = [
    { metric: 'Max Throughput', value: '142 t/s', model: 'Mistral-7b-v0.3', date: '2d ago' },
    { metric: 'Lowest Latency', value: '14 ms', model: 'Arctic-Embed', date: '5h ago' },
    { metric: 'Highest Accuracy', value: '94.2%', model: 'Saul-7b (Legal)', date: '1w ago' },
    { metric: 'Max VRAM Usage', value: '23.8 GB', model: 'Llama-3-70b-Q4', date: 'Yesterday' },
];

export const Dashboard: React.FC<DashboardProps> = ({ serverConfig }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % 4);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + 4) % 4);

  return (
    <div className="h-full overflow-y-auto space-y-6 animate-fade-in p-8 custom-scrollbar">
      {/* Alerts Moved to Top */}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Models" value="3" icon="🧠" trend="+1 Loaded" trendUp={true} />
        <StatCard title="Total VRAM" value={`${serverConfig.vramTotal} GB`} icon="💾" />
        <StatCard title="GPU Temp" value="68°C" icon="🌡️" trend="Nominal" trendUp={true} />
        <StatCard title="Daily Tokens" value="85.2k" icon="⚡" trend="+12% vs avg" trendUp={true} />
      </div>

      {/* Visualization Carousel */}
      <div className="relative group">
           {/* Navigation Arrows */}
            <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 p-2 bg-nebula-800 border border-nebula-700 rounded-full text-gray-400 hover:text-white hover:bg-nebula-700 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 p-2 bg-nebula-800 border border-nebula-700 rounded-full text-gray-400 hover:text-white hover:bg-nebula-700 shadow-lg transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={24} />
            </button>

            {/* Slide 0: VRAM & Load */}
            {slideIndex === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[450px]">
                    {/* VRAM Usage */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <span className="text-6xl">💾</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-4 w-full text-left flex items-center gap-2">VRAM Distribution</h3>
                    <div className="h-56 w-full">
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
                    <div className="flex justify-between w-full px-8 text-sm text-gray-400">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div> Used (24GB)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-nebula-700"></div> Free (56GB)</div>
                    </div>
                    </div>

                    {/* GPU Load History */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">⚡ GPU Load History</h3>
                    <div className="h-full max-h-[350px] w-full">
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
            )}

            {/* Slide 1: Active Tasks */}
            {slideIndex === 1 && (
                <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 h-[450px] animate-fade-in flex flex-col">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <List className="text-blue-500" /> Active Operations & Tasks
                    </h3>
                    <div className="flex-1 space-y-6 overflow-y-auto px-2">
                        {activeTasks.map(task => (
                            <div key={task.id} className="bg-nebula-950/50 p-4 rounded-lg border border-nebula-800">
                                <div className="flex justify-between text-sm mb-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-200">{task.name}</span>
                                        <span className="text-xs text-gray-500 mt-0.5">{task.status}</span>
                                    </div>
                                    <span className="text-white font-mono">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-nebula-900 h-3 rounded-full overflow-hidden border border-nebula-800">
                                    <div className={`h-full ${task.color} relative transition-all duration-1000`} style={{ width: `${task.progress}%` }}>
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 2: High Scores */}
            {slideIndex === 2 && (
                <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 h-[450px] animate-fade-in flex flex-col">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Laboratory Records
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                        {highScores.map((score, i) => (
                            <div key={i} className="bg-nebula-950/50 border border-nebula-800 p-4 rounded-xl flex flex-col justify-center items-center text-center hover:border-yellow-500/30 hover:bg-yellow-900/5 transition-all group">
                                <div className="text-[10px] text-gray-500 uppercase font-bold mb-3 tracking-wider">{score.metric}</div>
                                <div className="text-3xl font-black text-white mb-2 group-hover:scale-110 transition-transform">{score.value}</div>
                                <div className="text-xs text-purple-400 font-medium px-2 py-1 bg-purple-900/20 rounded border border-purple-500/20">{score.model}</div>
                                <div className="text-[10px] text-gray-600 mt-3 flex items-center gap-1">
                                    <Activity size={10} /> {score.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 3: Health & Throughput (Moved from bottom row) */}
            {slideIndex === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[450px] animate-fade-in">
                    {/* System Health Radar */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col">
                        <h3 className="text-lg font-semibold mb-2">🛡️ System Health Matrix</h3>
                        <p className="text-xs text-gray-500 mb-4">Real-time telemetry across sub-systems</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={healthData}>
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
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col">
                        <h3 className="text-lg font-semibold mb-2">📊 Daily Token Throughput</h3>
                        <p className="text-xs text-gray-500 mb-4">Total generation output by model family</p>
                        <div className="flex-1 min-h-0">
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
            )}

            {/* Pagination Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${slideIndex === i ? 'bg-purple-500 w-4' : 'bg-gray-700'}`}></div>
                ))}
            </div>
      </div>
    </div>
  );
};
