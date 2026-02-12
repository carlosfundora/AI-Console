
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Legend } from 'recharts';
import { ServerConfig } from '../types';
import { ChevronLeft, ChevronRight, List, Trophy, Activity, ArrowRight, Bell, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';

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
      {/* Alerts Container - Cleaned up by removing stats and refining UI */}
      <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle Background Element */}
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Bell size={140} />
        </div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold flex items-center gap-3">
                <span className="p-2 bg-purple-500/10 rounded-lg text-purple-400">🚀</span>
                Recent System Alerts
            </h3>
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-400 bg-green-400/5 px-2.5 py-1 rounded border border-green-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live Stream Active
                </span>
                <button className="text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 transition-colors group">
                    View Logs <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-nebula-950/40 rounded-xl border border-nebula-800/60 hover:border-nebula-700 transition-colors group cursor-default">
            <div className="p-2.5 bg-green-500/10 rounded-lg shrink-0">
                <CheckCircle size={20} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200">Fine-tuning Completed</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">Llama-3-8b-SFT-v2 finished successfully in 4h 20m.</p>
            </div>
            <div className="text-right shrink-0">
                <span className="text-xs font-mono text-gray-600 block">10m ago</span>
                <button className="text-[10px] text-purple-400 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:underline decoration-2 underline-offset-2">Deploy</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-nebula-950/40 rounded-xl border border-nebula-800/60 hover:border-nebula-700 transition-colors group cursor-default">
            <div className="p-2.5 bg-yellow-500/10 rounded-lg shrink-0">
                <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200">High VRAM Pressure</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">Process ID 4590 consumed 11.4GB / 12GB.</p>
            </div>
            <div className="text-right shrink-0">
                <span className="text-xs font-mono text-gray-600 block">1h ago</span>
                <button className="text-[10px] text-yellow-500 font-bold uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:underline decoration-2 underline-offset-2">Profile</button>
            </div>
          </div>
        </div>
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
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
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
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div> Used (24GB)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-nebula-700"></div> Free (56GB)</div>
                    </div>
                    </div>

                    {/* GPU Load History */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 lg:col-span-2 shadow-lg">
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
                <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 h-[450px] animate-fade-in flex flex-col shadow-lg">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <List className="text-blue-500" /> Active Operations & Tasks
                    </h3>
                    <div className="flex-1 space-y-6 overflow-y-auto px-2 custom-scrollbar">
                        {activeTasks.map(task => (
                            <div key={task.id} className="bg-nebula-950/50 p-5 rounded-xl border border-nebula-800 hover:border-nebula-700 transition-colors">
                                <div className="flex justify-between text-sm mb-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-200">{task.name}</span>
                                        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{task.status}</span>
                                    </div>
                                    <span className="text-white font-mono bg-nebula-900 px-2.5 py-1 rounded-md border border-nebula-800">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-nebula-900 h-2.5 rounded-full overflow-hidden border border-nebula-800">
                                    <div className={`h-full ${task.color} relative transition-all duration-1000 ease-out`} style={{ width: `${task.progress}%` }}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 2: High Scores */}
            {slideIndex === 2 && (
                <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 h-[450px] animate-fade-in flex flex-col shadow-lg">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Laboratory Records
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                        {highScores.map((score, i) => (
                            <div key={i} className="bg-nebula-950/50 border border-nebula-800 p-6 rounded-2xl flex flex-col justify-center items-center text-center hover:border-yellow-500/30 hover:bg-yellow-900/5 transition-all group">
                                <div className="text-[10px] text-gray-500 uppercase font-black mb-4 tracking-widest">{score.metric}</div>
                                <div className="text-4xl font-black text-white mb-3 group-hover:scale-110 transition-transform">{score.value}</div>
                                <div className="text-xs text-purple-400 font-bold px-3 py-1.5 bg-purple-900/20 rounded-lg border border-purple-500/20">{score.model}</div>
                                <div className="text-[10px] text-gray-600 mt-5 flex items-center gap-1.5 font-medium">
                                    <Activity size={10} /> Recorded {score.date}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 3: Health & Throughput */}
            {slideIndex === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[450px] animate-fade-in">
                    {/* System Health Radar */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">🛡️ System Health Matrix</h3>
                        <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-wider">Real-time telemetry distribution</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={healthData}>
                                    <PolarGrid stroke="#272730" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Status"
                                        dataKey="A"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="#10b981"
                                        fillOpacity={0.25}
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Model Throughput Bar */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">📊 Daily Token Throughput</h3>
                        <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-wider">Output volume per model family</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={throughputData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" horizontal={false} />
                                    <XAxis type="number" stroke="#4b5563" tick={{fontSize: 10}} hide />
                                    <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" tick={{fontSize: 12, fontWeight: 700}} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }} />
                                    <Bar dataKey="tokens" fill="#8884d8" radius={[0, 6, 6, 0]} barSize={24}>
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                {[0, 1, 2, 3].map(i => (
                    <button 
                        key={i} 
                        onClick={() => setSlideIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${slideIndex === i ? 'bg-purple-500 w-8 shadow-[0_0_10px_#8b5cf6]' : 'bg-gray-700 hover:bg-gray-600'}`}
                    ></button>
                ))}
            </div>
      </div>
    </div>
  );
};
