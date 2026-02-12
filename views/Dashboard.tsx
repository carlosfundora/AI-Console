
import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar } from 'recharts';
import { ServerConfig } from '../types';
import { ChevronLeft, ChevronRight, List, Trophy, Activity, ExternalLink, CheckCircle, AlertTriangle, Medal, Star, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

interface DashboardProps {
  serverConfig: ServerConfig;
}

const vramData = [
  { name: 'Used', value: 24, color: '#8b5cf6' },
  { name: 'Free', value: 56, color: '#1c1c2e' },
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

const activeTasks = [
    { id: 1, name: 'Llama-3-8b SFT (Epoch 2/3)', progress: 65, status: 'Training', color: 'bg-purple-600' },
    { id: 2, name: 'Legal Corpus Indexing', progress: 32, status: 'Indexing', color: 'bg-blue-600' },
    { id: 3, name: 'Evaluation: TruthfulQA', progress: 88, status: 'Benchmarking', color: 'bg-green-600' },
];

const highScores = [
    { metric: 'Max Throughput', value: '142 t/s', model: 'Mistral-7b-v0.3', date: '2d ago', trend: '+12%', rank: 1, color: 'text-blue-400' },
    { metric: 'Lowest Latency', value: '14 ms', model: 'Arctic-Embed', date: '5h ago', trend: '-2ms', rank: 2, color: 'text-purple-400' },
    { metric: 'Highest Accuracy', value: '94.2%', model: 'Saul-7b (Legal)', date: '1w ago', trend: '+0.4%', rank: 1, color: 'text-green-400' },
    { metric: 'Quant Efficiency', value: '0.84 bpw', model: 'LFM-1.2b-Q4', date: 'Yesterday', trend: 'STABLE', rank: 3, color: 'text-orange-400' },
];

export const Dashboard: React.FC<DashboardProps> = ({ serverConfig }) => {
  const [slideIndex, setSlideIndex] = useState(0);

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % 4);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + 4) % 4);

  return (
    <div className="h-full overflow-y-auto space-y-6 animate-fade-in p-8 custom-scrollbar">
      {/* Alerts Header */}
      <div className="bg-nebula-900 border border-nebula-700 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Zap size={140} />
        </div>
        
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-lg font-black flex items-center gap-3 uppercase tracking-tight">
                <span className="p-2 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20"><Activity size={20} /></span>
                System Telemetry
            </h3>
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-black text-green-400 bg-green-400/5 px-3 py-1.5 rounded-full border border-green-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    ROCm/Vulkan Online
                </span>
                <button className="text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 transition-colors group uppercase font-black tracking-widest">
                    Kernel Logs <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
            </div>
        </div>

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-4 p-4 bg-nebula-950/60 rounded-2xl border border-nebula-800/60 hover:border-nebula-700 transition-all group cursor-default">
            <div className="p-2.5 bg-green-500/10 rounded-xl shrink-0">
                <CheckCircle size={20} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-100 uppercase tracking-tight">SFT Objective Completed</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate uppercase tracking-widest font-bold">Model: Llama-3-8b-Legal-v2 // Epoch 3 // Loss: 1.14</p>
            </div>
            <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-gray-600 block uppercase font-black">T-Minus 10M</span>
                <button className="text-[10px] text-purple-400 font-black uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:underline underline-offset-4">Deploy Checkpoint</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-nebula-950/60 rounded-2xl border border-nebula-800/60 hover:border-nebula-700 transition-all group cursor-default">
            <div className="p-2.5 bg-yellow-500/10 rounded-xl shrink-0">
                <AlertTriangle size={20} className="text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-100 uppercase tracking-tight">VRAM Saturation Warning</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate uppercase tracking-widest font-bold">Ollama Thread Pool exhausting heap memory (11.4GB / 12GB)</p>
            </div>
            <div className="text-right shrink-0">
                <span className="text-[10px] font-mono text-gray-600 block uppercase font-black">T-Minus 1H</span>
                <button className="text-[10px] text-yellow-500 font-black uppercase mt-1 opacity-0 group-hover:opacity-100 transition-opacity hover:underline underline-offset-4">GC Reclaim</button>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative group">
            <button 
                onClick={prevSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-3 bg-nebula-800 border border-nebula-700 rounded-full text-gray-400 hover:text-white hover:bg-nebula-700 shadow-2xl transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={nextSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-3 bg-nebula-800 border border-nebula-700 rounded-full text-gray-400 hover:text-white hover:bg-nebula-700 shadow-2xl transition-all opacity-0 group-hover:opacity-100"
            >
                <ChevronRight size={24} />
            </button>

            {/* Slide 0: VRAM & Load */}
            {slideIndex === 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in h-[480px]">
                    <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-8 lg:col-span-1 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.02]">
                        <Target size={180} />
                    </div>
                    <h3 className="text-lg font-black mb-8 w-full text-left uppercase tracking-tight">Memory Distribution</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={vramData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                            >
                            {vramData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            </Pie>
                            <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #272730', borderRadius: '16px', fontWeight: 'bold' }}
                            itemStyle={{ color: '#e4e4e7' }}
                            />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 w-full px-4 mt-4">
                        <div className="flex justify-between items-center bg-nebula-950 p-3 rounded-xl border border-nebula-800">
                             <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_#8b5cf6]"></div> <span className="text-[10px] font-black uppercase text-gray-400">Reserved</span></div>
                             <span className="font-mono text-sm font-black">24 GB</span>
                        </div>
                        <div className="flex justify-between items-center bg-nebula-950 p-3 rounded-xl border border-nebula-800">
                             <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 rounded-full bg-nebula-700"></div> <span className="text-[10px] font-black uppercase text-gray-400">Available</span></div>
                             <span className="font-mono text-sm font-black">56 GB</span>
                        </div>
                    </div>
                    </div>

                    <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-8 lg:col-span-2 shadow-2xl flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Accelerator Load</h3>
                                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mt-1">Real-time GPU utilization history</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-black text-purple-400 font-mono">75.2%</span>
                                <span className="text-[10px] text-gray-600 block font-black uppercase">Mean Saturation</span>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" vertical={false} />
                                <XAxis dataKey="time" stroke="#4b5563" tickLine={false} axisLine={false} fontSize={10} tick={{fontWeight: 'bold'}} />
                                <YAxis stroke="#4b5563" tickLine={false} axisLine={false} fontSize={10} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #272730', borderRadius: '12px' }}
                                />
                                <Area type="monotone" dataKey="load" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorLoad)" />
                            </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Slide 1: Active Tasks */}
            {slideIndex === 1 && (
                <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-8 h-[480px] animate-fade-in flex flex-col shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <List className="text-blue-500" /> Operational Queue
                            </h3>
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">Active worker thread distribution</p>
                        </div>
                        <div className="bg-nebula-950 border border-nebula-800 px-4 py-2 rounded-xl flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase text-gray-500">Live Workers: 3</span>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto px-2 custom-scrollbar">
                        {activeTasks.map(task => (
                            <div key={task.id} className="bg-nebula-950 p-6 rounded-2xl border border-nebula-800/60 hover:border-blue-500/40 transition-all group">
                                <div className="flex justify-between text-sm mb-4 items-end">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Process Status: {task.status}</span>
                                        <span className="font-black text-gray-100 text-base uppercase tracking-tight group-hover:text-blue-400 transition-colors">{task.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-black font-mono text-white">{task.progress}%</span>
                                    </div>
                                </div>
                                <div className="w-full bg-nebula-900 h-3 rounded-full overflow-hidden border border-nebula-800/50 p-0.5">
                                    <div className={`h-full ${task.color} rounded-full relative transition-all duration-1000 ease-out`} style={{ width: `${task.progress}%` }}>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Slide 2: High Scores - REFINED */}
            {slideIndex === 2 && (
                <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-8 h-[480px] animate-fade-in flex flex-col shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none rotate-12">
                        <Trophy size={300} />
                    </div>
                    
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 className="text-2xl font-black flex items-center gap-3 tracking-tighter uppercase">
                                <Trophy className="text-yellow-500" size={28} /> High Score Matrix
                            </h3>
                            <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mt-1">Global observation records // Hall of Fame</p>
                        </div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] border border-nebula-700 px-5 py-2.5 rounded-2xl bg-nebula-950 shadow-inner">
                            System Version: 2.2.0-LAB
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-1 relative z-10">
                        {highScores.map((score, i) => (
                            <div key={i} className="bg-nebula-950 border border-nebula-800 p-8 rounded-[2rem] flex flex-col justify-between items-center text-center hover:border-yellow-500/50 transition-all group relative overflow-hidden shadow-lg">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                {score.rank === 1 && <Medal size={20} className="absolute top-4 right-4 text-yellow-500 animate-bounce" />}
                                
                                <div className="space-y-4">
                                    <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">{score.metric}</div>
                                    <div className={`text-4xl font-black ${score.color} group-hover:scale-110 transition-transform duration-500 font-mono tracking-tighter`}>{score.value}</div>
                                </div>

                                <div className="w-full mt-10 space-y-4">
                                    <div className="text-[10px] text-white font-black px-4 py-2 bg-nebula-900 rounded-xl border border-nebula-800 truncate uppercase tracking-tight">
                                        {score.model}
                                    </div>
                                    <div className="flex justify-between items-center px-2">
                                        <div className="text-[9px] text-gray-600 font-black uppercase flex items-center gap-2">
                                            <Activity size={10} /> {score.date}
                                        </div>
                                        <div className={`text-[10px] font-black tracking-widest ${score.trend.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[480px] animate-fade-in">
                    <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-8 flex flex-col shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                            <Target size={160} />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Core Health Matrix</h3>
                        <p className="text-[10px] text-gray-500 mb-6 font-black uppercase tracking-widest">Synthetic performance indicators</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={healthData}>
                                    <PolarGrid stroke="#272730" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="Health"
                                        dataKey="A"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fill="#10b981"
                                        fillOpacity={0.2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-8 flex flex-col shadow-2xl overflow-hidden">
                        <h3 className="text-lg font-black uppercase tracking-tight mb-2">Throughput Distribution</h3>
                        <p className="text-[10px] text-gray-500 mb-8 font-black uppercase tracking-widest">Comparative token volume per node</p>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={throughputData} layout="vertical" margin={{ left: 0, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={90} stroke="#9ca3af" tick={{fontSize: 12, fontWeight: 900, letterSpacing: '0.05em'}} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #272730', borderRadius: '12px' }} />
                                    <Bar dataKey="tokens" fill="#8884d8" radius={[0, 10, 10, 0]} barSize={28}>
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

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                {[0, 1, 2, 3].map(i => (
                    <button 
                        key={i} 
                        onClick={() => setSlideIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${slideIndex === i ? 'bg-purple-500 w-12 shadow-[0_0_15px_#8b5cf6]' : 'bg-nebula-700 w-4 hover:bg-nebula-600'}`}
                    ></button>
                ))}
            </div>
      </div>
    </div>
  );
};
