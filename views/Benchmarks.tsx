import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { BenchmarkResult, Model, RAGConfig } from '../types';
import { analyzeBenchmarks } from '../services/geminiService';

interface BenchmarksProps {
  results: BenchmarkResult[];
  models: Model[];
}

const DEFAULT_RAG_CONFIG: RAGConfig = {
    id: 'rag-default',
    name: 'Standard RAG',
    chunkingStrategy: 'Recursive',
    chunkSize: 512,
    chunkOverlap: 50,
    vectorStore: 'FAISS',
    retrievalAlgo: 'Hybrid',
    k: 5
};

export const Benchmarks: React.FC<BenchmarksProps> = ({ results, models }) => {
  const [activeView, setActiveView] = useState<'matrix' | 'trends' | 'rag-config'>('matrix');
  const [ragConfig, setRagConfig] = useState<RAGConfig>(DEFAULT_RAG_CONFIG);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Prepare Data for Charts
  const trendData = results
    .filter(r => r.metric === 'Accuracy' || r.metric === 'F1 Score')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Hardware Comparison Data
  const hardwareData = results.reduce((acc: any[], curr) => {
    // Find if we have both CPU and GPU runs for same model/version/dataset
    // For simplicitly in mock, let's just group by Model + Hardware
    const key = `${curr.modelId}-${curr.versionId}`;
    let item = acc.find(i => i.key === key);
    if (!item) {
        item = { key, model: curr.modelId, version: curr.versionId };
        acc.push(item);
    }
    if (curr.hardware === 'GPU') item.gpuLatency = curr.latency;
    if (curr.hardware === 'CPU') item.cpuLatency = curr.latency;
    return acc;
  }, []).filter(i => i.gpuLatency && i.cpuLatency);

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    const text = await analyzeBenchmarks(results, models);
    setAnalysis(text || "No analysis returned.");
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📊 Benchmarks & Analytics</h2>
        <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700">
             <button 
                onClick={() => setActiveView('matrix')}
                className={`px-3 py-1.5 rounded text-sm transition-all ${activeView === 'matrix' ? 'bg-nebula-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveView('trends')}
                className={`px-3 py-1.5 rounded text-sm transition-all ${activeView === 'trends' ? 'bg-nebula-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Trends & Hardware
            </button>
            <button 
                onClick={() => setActiveView('rag-config')}
                className={`px-3 py-1.5 rounded text-sm transition-all ${activeView === 'rag-config' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                RAG Config
            </button>
        </div>
      </div>

      {activeView === 'matrix' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto">
             <div className="flex justify-end">
                <button 
                    onClick={handleAnalysis}
                    disabled={isAnalyzing}
                    className="bg-nebula-500 hover:bg-nebula-400 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                >
                    <span>✨</span> {isAnalyzing ? 'Analyzing...' : 'Gemini Analysis'}
                </button>
             </div>

            {analysis && (
                <div className="bg-nebula-900 border border-purple-500/30 p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-transparent"></div>
                    <h3 className="text-purple-400 font-bold mb-2 text-sm uppercase tracking-wider">Gemini Insights</h3>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0 border-0">{analysis}</pre>
                    </div>
                </div>
            )}
            
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-nebula-950 text-gray-200 uppercase font-medium text-xs">
                        <tr>
                            <th className="px-6 py-4">Model</th>
                            <th className="px-6 py-4">Version</th>
                            <th className="px-6 py-4">Dataset</th>
                            <th className="px-6 py-4">Hardware</th>
                            <th className="px-6 py-4">Score</th>
                            <th className="px-6 py-4">Latency</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-nebula-800">
                        {results.map(res => (
                            <tr key={res.id} className="hover:bg-nebula-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-white">{res.modelId}</td>
                                <td className="px-6 py-4 font-mono text-xs">{res.versionId}</td>
                                <td className="px-6 py-4">{res.dataset}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs border ${res.hardware === 'GPU' ? 'border-purple-500/30 text-purple-300 bg-purple-900/10' : 'border-gray-600 text-gray-400'}`}>
                                        {res.hardware}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-white font-bold">{res.score.toFixed(1)}</td>
                                <td className="px-6 py-4 font-mono">{res.latency}ms</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeView === 'trends' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in flex-1 min-h-0 overflow-y-auto">
             {/* Trend Chart */}
             <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col min-h-[300px]">
                <h3 className="text-lg font-semibold mb-6">📈 Performance History</h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" vertical={false} />
                            <XAxis dataKey="date" stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                            <YAxis stroke="#6b7280" tick={{fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }} />
                            <Legend />
                            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={{fill: '#8b5cf6'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
             </div>

             {/* CPU vs GPU Comparison */}
             <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col min-h-[300px]">
                <h3 className="text-lg font-semibold mb-6">⚡ CPU vs ROCm GPU Latency</h3>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hardwareData} layout="vertical">
                             <CartesianGrid strokeDasharray="3 3" stroke="#1c1c2e" horizontal={false} />
                             <XAxis type="number" stroke="#6b7280" />
                             <YAxis dataKey="model" type="category" width={100} stroke="#9ca3af" tick={{fontSize: 10}} />
                             <Tooltip contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e', borderRadius: '8px' }} cursor={{fill: 'transparent'}} />
                             <Legend />
                             <Bar dataKey="cpuLatency" name="CPU (ms)" fill="#374151" radius={[0, 4, 4, 0]} barSize={20} />
                             <Bar dataKey="gpuLatency" name="GPU (ROCm) (ms)" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>
             
             {/* Radar Chart for Metrics */}
             <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 flex flex-col min-h-[300px] lg:col-span-2">
                 <h3 className="text-lg font-semibold mb-6">🕸️ Distillation Efficiency</h3>
                 <div className="flex-1">
                     <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                             { subject: 'Accuracy', A: 120, B: 110, fullMark: 150 },
                             { subject: 'Speed', A: 98, B: 130, fullMark: 150 },
                             { subject: 'VRAM', A: 86, B: 130, fullMark: 150 },
                             { subject: 'Throughput', A: 99, B: 100, fullMark: 150 },
                             { subject: 'Quality', A: 85, B: 90, fullMark: 150 },
                             { subject: 'Cost', A: 65, B: 85, fullMark: 150 },
                         ]}>
                             <PolarGrid stroke="#1c1c2e" />
                             <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af' }} />
                             <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                             <Radar name="Teacher (Llama-70b)" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                             <Radar name="Student (LFM 1.2b)" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                             <Legend />
                             <Tooltip contentStyle={{ backgroundColor: '#0a0a12', border: '1px solid #1c1c2e' }} />
                         </RadarChart>
                     </ResponsiveContainer>
                 </div>
             </div>
          </div>
      )}

      {activeView === 'rag-config' && (
          <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-8 animate-fade-in overflow-y-auto">
                <div className="max-w-2xl mx-auto space-y-8">
                    <div>
                        <h3 className="text-xl font-bold mb-2">RAG Benchmark Configuration</h3>
                        <p className="text-gray-400 text-sm">Customize how your embedding models are tested against your vector store stack.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Chunking Strategy</label>
                            <select 
                                value={ragConfig.chunkingStrategy}
                                onChange={(e) => setRagConfig({...ragConfig, chunkingStrategy: e.target.value as any})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="Fixed">Fixed Size</option>
                                <option value="Recursive">Recursive Character</option>
                                <option value="Semantic">Semantic (AI)</option>
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Chunk Size (tokens)</label>
                            <input 
                                type="number" 
                                value={ragConfig.chunkSize}
                                onChange={(e) => setRagConfig({...ragConfig, chunkSize: Number(e.target.value)})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>
                         <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Vector Store</label>
                            <select 
                                value={ragConfig.vectorStore}
                                onChange={(e) => setRagConfig({...ragConfig, vectorStore: e.target.value as any})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="FAISS">FAISS (Local)</option>
                                <option value="ChromaDB">ChromaDB</option>
                                <option value="Pinecone">Pinecone (Cloud)</option>
                                <option value="Milvus">Milvus</option>
                            </select>
                        </div>
                         <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Retrieval Algorithm</label>
                            <select 
                                value={ragConfig.retrievalAlgo}
                                onChange={(e) => setRagConfig({...ragConfig, retrievalAlgo: e.target.value as any})}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="Cosine">Cosine Similarity</option>
                                <option value="MMR">Max Marginal Relevance (MMR)</option>
                                <option value="BM25">BM25 (Keyword)</option>
                                <option value="Hybrid">Hybrid (Vector + Keyword)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-nebula-800 flex justify-end gap-3">
                        <button className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-transparent hover:border-nebula-700">Reset Default</button>
                        <button className="px-6 py-2 rounded-lg text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20">Save Configuration</button>
                    </div>
                </div>
          </div>
      )}
    </div>
  );
};