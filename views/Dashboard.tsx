
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Legend } from 'recharts';
import { ServerConfig } from '../types';
import { ChevronLeft, ChevronRight, List, Trophy, Activity, ArrowRight, Bell, ExternalLink, CheckCircle, AlertTriangle, Medal, Star, TrendingUp } from 'lucide-react';

interface DashboardProps {
  serverConfig: ServerConfig;
}

const vramData = [
  { name: 'Used', value: 24, color: '#7c3aed' }, // Purple-600
  { name: 'Free', value: 56, color: '#1c1c24' }, // Darker placeholder
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
    { metric: 'Max Throughput', value: '142 t/s', model: 'Mistral-7b-v0.3', date: '2d ago', trend: '+12%', rank: 1 },
    { metric: 'Lowest Latency', value: '14 ms', model: 'Arctic-Embed', date: '5h ago', trend: '-2ms', rank: 2 },
    { metric: 'Highest Accuracy', value: '94.2%', model: 'Saul-7b (Legal)', date: '1w ago', trend: '+0.4%', rank: 1 },
    { metric: 'Max VRAM Usage', value: '23.8 GB', model: 'Llama-3-70b-Q4', date: 'Yesterday', trend: 'STABLE', rank: 3 },
];

export const Dashboard: React.FC<DashboardProps> = ({ serverConfig }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % 4);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + 4) % 4);

  return (
    <div className="h-full overflow-y-auto space-y-6 animate-fade-in p-8 custom-scrollbar">
      {/* Alerts Container - Vertical Gradient + Glass */}
      <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700">
            <Bell size={140} />
        </div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-bold flex items-center gap-3 text-white">
                <span className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/10 shadow-[0_0_10px_rgba(124,58,237,0.1)]">🚀</span>
                Recent System Alerts
            </h3>
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-400 bg-green-400/5 px-2.5 py-1 rounded border border-green-400/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Live Stream Active
                </span>
                <button className="text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 transition-colors group">
                    View Logs <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-purple-500/20 transition-colors group cursor-default backdrop-blur-sm">
            <div className="p-2.5 bg-green-500/10 rounded-lg shrink-0 border border-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
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
          
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-yellow-500/20 transition-colors group cursor-default backdrop-blur-sm">
            <div className="p-2.5 bg-yellow-500/10 rounded-lg shrink-0 border border-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
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
            <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 p-2 bg-nebula-900/80 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-nebula-800 shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 p-2 bg-nebula-900/80 border border-white/10 rounded-full text-gray-400 hover:text-white hover:bg-nebula-800 shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            >
                <ChevronRight size={24} />
            </button>

            {/* Slide 0: VRAM & Load */}
            {slideIndex === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[450px]">
                    <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(124,58,237,0.05)] transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <span className="text-6xl">💾</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-4 w-full text-left flex items-center gap-2 text-white">VRAM Distribution</h3>
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
                                contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
                                itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between w-full px-8 text-sm text-gray-400 font-medium">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div> Used (24GB)</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-nebula-700"></div> Free (56GB)</div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 lg:col-span-2 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-white">⚡ GPU Load History</h3>
                    <div className="h-full max-h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={activityData}>
                            <defs>
                            <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" vertical={false} />
                            <XAxis dataKey="time" stroke="#4b5563" tickLine={false} axisLine={false} />
                            <YAxis stroke="#4b5563" tickLine={false} axisLine={false} />
                            <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }}
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
                <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 h-[450px] animate-fade-in flex flex-col shadow-lg">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-white">
                        <List className="text-blue-500" /> Active Operations & Tasks
                    </h3>
                    <div className="flex-1 space-y-6 overflow-y-auto px-2 custom-scrollbar">
                        {activeTasks.map(task => (
                            <div key={task.id} className="bg-white/5 p-5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex justify-between text-sm mb-3">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-200">{task.name}</span>
                                        <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">{task.status}</span>
                                    </div>
                                    <span className="text-white font-mono bg-nebula-900 px-2.5 py-1 rounded-md border border-white/5 shadow-inner">{task.progress}%</span>
                                </div>
                                <div className="w-full bg-nebula-950 h-2.5 rounded-full overflow-hidden border border-white/5">
                                    <div className={`h-full ${task.color} relative transition-all duration-1000 ease-out`} style={{ width: `${task.progress}%` }}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 2: High Scores */}
            {slideIndex === 2 && (
                <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 h-[450px] animate-fade-in flex flex-col shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                        <Trophy size={200} />
                    </div>
                    
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h3 className="text-xl font-black flex items-center gap-3 tracking-tight text-white">
                            <Trophy className="text-yellow-500" /> Model High Scores
                        </h3>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border border-white/10 px-3 py-1 rounded bg-nebula-950">
                            Hall of Fame
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1 relative z-10">
                        {highScores.map((score, i) => (
                            <div key={i} className="bg-nebula-950/50 border border-white/5 p-6 rounded-2xl flex flex-col justify-between items-center text-center hover:border-yellow-500/30 transition-all group relative overflow-hidden shadow-md">
                                {score.rank === 1 && <Star size={16} className="absolute top-3 right-3 text-yellow-500 animate-pulse" />}
                                
                                <div className="space-y-4">
                                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">{score.metric}</div>
                                    <div className="text-4xl font-black text-white group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">{score.value}</div>
                                </div>

                                <div className="w-full mt-6 space-y-3">
                                    <div className="text-xs text-purple-400 font-bold px-3 py-1.5 bg-purple-900/10 rounded-lg border border-purple-500/20 truncate">
                                        {score.model}
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <div className="text-[10px] text-gray-600 font-medium flex items-center gap-1.5">
                                            <Activity size={10} /> {score.date}
                                        </div>
                                        <div className={`text-[10px] font-bold ${score.trend.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>
                                            {score.trend}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 3: Health & Throughput */}
            {slideIndex === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[450px] animate-fade-in">
                    <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 flex flex-col shadow-lg">
                        <h3 className="text-lg font-semibold mb-2 text-white">🛡️ System Health Matrix</h3>
                        <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-wider">Real-time telemetry distribution</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={healthData}>
                                    <PolarGrid stroke="#1c1c24" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Status"
                                        dataKey="A"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="#10b981"
                                        fillOpacity={0.25}
                                    />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-6 flex flex-col shadow-lg">
                        <h3 className="text-lg font-semibold mb-2 text-white">📊 Daily Token Throughput</h3>
                        <p className="text-xs text-gray-500 mb-4 font-bold uppercase tracking-wider">Output volume per model family</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={throughputData} layout="vertical" margin={{ left: 0, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" horizontal={false} />
                                    <XAxis type="number" stroke="#4b5563" tick={{fontSize: 10}} hide />
                                    <YAxis dataKey="name" type="category" width={80} stroke="#9ca3af" tick={{fontSize: 12, fontWeight: 700}} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#0a0a0e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px' }} />
                                    <Bar dataKey="tokens" fill="#7c3aed" radius={[0, 4, 4, 0]} barSize={24}>
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

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                {[0, 1, 2, 3].map(i => (
                    <button 
                        key={i} 
                        onClick={() => setSlideIndex(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${slideIndex === i ? 'bg-purple-600 w-8 shadow-[0_0_10px_#8b5cf6]' : 'bg-gray-700 w-2 hover:bg-gray-600'}`}
                    ></button>
                ))}
            </div>
      </div>
    </div>
  );
};
