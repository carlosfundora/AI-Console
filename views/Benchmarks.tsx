import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BenchmarkResult, Model, AdvancedBenchmarkConfig, BenchmarkStep, BenchmarkStepType, MockDataSource, ServerProfile } from '../types';
import { Play, Settings2, MessageSquare, Database, Binary, FileText, Wrench, Search, ChevronDown, ChevronRight, X, ArrowRight, Loader2, File, Code, Table, Plus, Trash2, Expand, Clock, Info, Layers, GripVertical, Save, FolderOpen, Flame, Box, Server, Edit2, GitFork, ScanSearch, Filter, Tag, ListChecks, CheckCircle2, Zap, TrendingUp, Cpu, Activity, Gauge, Terminal, GitBranch } from 'lucide-react';

interface BenchmarksProps {
  results: BenchmarkResult[];
  models: Model[];
  servers: ServerProfile[];
}

const DEFAULT_ADV_CONFIG: AdvancedBenchmarkConfig = {
    id: 'new-config',
    name: 'New Benchmark Pipeline',
    backend: 'ollama',
    modelId: '',
    hardware: 'GPU',
    scriptPath: './scripts/benchmark_template.py',
    parameters: {
        contextSize: 4096,
        temperature: 0.1,
        flashAttention: true,
        memoryLock: false,
        continuousBatching: false,
        keepAlive: '5m',
        gpuLayers: 99,
        warmup: true
    },
    steps: []
};

const MOCK_SAVED_CONFIGS: AdvancedBenchmarkConfig[] = [
    {
        id: 'cfg-1',
        name: 'Saul RAG Pipeline',
        backend: 'ollama',
        modelId: 'equall-saul-7b',
        hardware: 'GPU',
        scriptPath: './scripts/rag_eval_saul.py',
        parameters: { contextSize: 8192, temperature: 0.1, flashAttention: true, memoryLock: true, gpuLayers: 99, continuousBatching: false, warmup: true },
        steps: [
            { id: 's1', type: 'Custom', name: 'Ingest PDF', enabled: true, config: { docType: 'PDF', chunkSize: 512 } },
            { id: 's2', type: 'Embedding', name: 'Vectorize (Arctic)', enabled: true, modelId: 'snowflake-arctic', config: { embeddingStrategy: 'Single', primaryDims: 768, primaryRole: 'Dense' } },
            { id: 's3', type: 'Retrieval', name: 'Vector Search', enabled: true, config: { rerankTopK: 10 } },
            { id: 's4', type: 'ColBERT', name: 'Re-Rank', enabled: true, config: {} },
            { id: 's5', type: 'Generation', name: 'Answer Query', enabled: true, config: { metric: 'Throughput' } }
        ]
    }
];

const INITIAL_MOCK_DATA: MockDataSource[] = [
    { id: 'm1', name: 'Contract_Law_101.pdf', type: 'PDF', size: '4.2 MB', date: '2025-12-01', path: '/data/docs/Contract_Law_101.pdf' },
    { id: 'm2', name: 'Nvidia_10K_2025.pdf', type: 'PDF', size: '12.8 MB', date: '2026-01-10', path: '/data/docs/Nvidia_10K.pdf' },
    { id: 'm3', name: 'System_Prompts_v2.txt', type: 'Prompt', size: '12 KB', date: '2026-01-15', path: '/data/prompts/sys_v2.txt' },
    { id: 'm4', name: 'Customer_Support_Q4.sql', type: 'SQL', size: '450 MB', date: '2026-01-18', path: '/data/sql/cust_q4.db' },
];

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

export const Benchmarks: React.FC<BenchmarksProps> = ({ results, models, servers }) => {
  const [activeView, setActiveView] = useState<'matrix' | 'trends' | 'config' | 'data'>('matrix');
  const [savedConfigs, setSavedConfigs] = useState<AdvancedBenchmarkConfig[]>(MOCK_SAVED_CONFIGS);
  const [mockData, setMockData] = useState<MockDataSource[]>(INITIAL_MOCK_DATA);
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null);
  const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);
  const [draggingTag, setDraggingTag] = useState<BenchmarkStepType | null>(null);

  // Trend Filters
  const [trendModelFilter, setTrendModelFilter] = useState<string[]>([]); 
  const [trendDatasetFilter, setTrendDatasetFilter] = useState<string>('All');

  const availableModels = useMemo(() => Array.from(new Set(results.map(r => r.modelId))), [results]);
  const availableDatasets = useMemo(() => Array.from(new Set(results.map(r => r.dataset))), [results]);

  useMemo(() => {
      if (trendModelFilter.length === 0 && availableModels.length > 0) {
          setTrendModelFilter(availableModels);
      }
  }, [availableModels]);

  const toggleModelFilter = (modelId: string) => {
      if (trendModelFilter.includes(modelId)) {
          setTrendModelFilter(trendModelFilter.filter(m => m !== modelId));
      } else {
          setTrendModelFilter([...trendModelFilter, modelId]);
      }
  };

  const processedTrendData = useMemo(() => {
    const filtered = results.filter(r => {
        const modelMatch = trendModelFilter.length === 0 || trendModelFilter.includes(r.modelId);
        const datasetMatch = trendDatasetFilter === 'All' || r.dataset === trendDatasetFilter;
        return modelMatch && datasetMatch;
    });
    const dataByDate: Record<string, any> = {};
    const sorted = [...filtered].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(r => {
        if (!dataByDate[r.date]) dataByDate[r.date] = { date: r.date };
        if (r.tokensPerSecond) dataByDate[r.date][`${r.modelId}_tps`] = r.tokensPerSecond;
        if (r.latency) dataByDate[r.date][`${r.modelId}_lat`] = r.latency;
        if (r.score) dataByDate[r.date][`${r.modelId}_score`] = r.score;
    });
    return Object.values(dataByDate);
  }, [results, trendModelFilter, trendDatasetFilter]);

  const trendSummary = useMemo(() => {
    const activeResults = results.filter(r => trendModelFilter.includes(r.modelId));
    if (activeResults.length === 0) return null;
    const avgTps = activeResults.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) / activeResults.length;
    const peakTps = Math.max(...activeResults.map(r => r.tokensPerSecond || 0));
    const avgLat = activeResults.reduce((sum, r) => sum + r.latency, 0) / activeResults.length;
    return { avgTps, peakTps, avgLat };
  }, [results, trendModelFilter]);

  const handleNewConfig = () => {
      const newConfig = { ...DEFAULT_ADV_CONFIG, id: `cfg-${Date.now()}`, name: 'New Pipeline Analysis' };
      setSavedConfigs([newConfig, ...savedConfigs]);
      setExpandedConfigId(newConfig.id);
  };

  const handleUpdateConfig = (id: string, updates: Partial<AdvancedBenchmarkConfig>) => {
      setSavedConfigs(savedConfigs.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteConfig = (id: string) => {
      if (confirm('Erase this pipeline?')) {
          setSavedConfigs(savedConfigs.filter(c => c.id !== id));
          if (expandedConfigId === id) setExpandedConfigId(null);
      }
  };

  const handleUpdateParameter = (configId: string, key: keyof AdvancedBenchmarkConfig['parameters'], value: any) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (config) {
          handleUpdateConfig(configId, { parameters: { ...config.parameters, [key]: value } });
      }
  };

  const addStepToConfig = (configId: string, type: BenchmarkStepType) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (!config) return;
      const newStep: BenchmarkStep = { id: `step-${Date.now()}`, type, name: `${type} Module`, enabled: true, config: { embeddingStrategy: 'Single' } };
      handleUpdateConfig(configId, { steps: [...config.steps, newStep] });
  };

  const removeStepFromConfig = (configId: string, stepId: string) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (!config) return;
      handleUpdateConfig(configId, { steps: config.steps.filter(s => s.id !== stepId) });
  };

  const updateStepInConfig = (configId: string, stepId: string, updates: Partial<BenchmarkStep>) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (!config) return;
      handleUpdateConfig(configId, { steps: config.steps.map(s => s.id === stepId ? { ...s, ...updates } : s) });
  };
  
  const updateStepConfigInConfig = (configId: string, stepId: string, configUpdates: any) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (!config) return;
      handleUpdateConfig(configId, { steps: config.steps.map(s => s.id === stepId ? { ...s, config: { ...s.config, ...configUpdates } } : s) });
  };

  const handleDragStart = (e: React.DragEvent, type: BenchmarkStepType) => {
      setDraggingTag(type);
      e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnConfig = (e: React.DragEvent, configId: string) => {
      e.preventDefault();
      if (draggingTag) {
          addStepToConfig(configId, draggingTag);
          setDraggingTag(null);
          setExpandedConfigId(configId); 
      }
  };

  const getStepIcon = (type: BenchmarkStepType) => {
      switch(type) {
          case 'Generation': return <MessageSquare size={16} className="text-blue-400"/>;
          case 'Retrieval': return <Database size={16} className="text-purple-400"/>;
          case 'Embedding': return <Binary size={16} className="text-green-400"/>;
          case 'Custom': return <FileText size={16} className="text-yellow-400"/>;
          case 'Tool Calling': return <Wrench size={16} className="text-orange-400"/>;
          case 'ColBERT': return <ScanSearch size={16} className="text-pink-400"/>;
          case 'Extraction': return <Filter size={16} className="text-teal-400"/>;
          case 'Routing': return <GitFork size={16} className="text-cyan-400"/>;
          case 'Classification': return <ListChecks size={16} className="text-indigo-400"/>;
          default: return <Box size={16} />;
      }
  };

  // Helper function to render configuration fields based on benchmark step type
  const renderStepConfigFields = (step: BenchmarkStep, configId: string) => {
      switch(step.type) {
          case 'Embedding':
              return (
                  <div className="grid grid-cols-2 gap-6 p-4 bg-nebula-900/50 rounded-2xl border border-nebula-800/50 shadow-inner">
                      <div className="space-y-2">
                          <label className="text-[9px] text-gray-600 uppercase font-black">Strategy</label>
                          <select 
                              value={step.config.embeddingStrategy} 
                              onChange={(e) => updateStepConfigInConfig(configId, step.id, { embeddingStrategy: e.target.value })}
                              className="w-full bg-nebula-950 border border-nebula-800 rounded-lg p-2 text-xs text-white outline-none"
                          >
                              <option value="Single">Single Model</option>
                              <option value="Dual">Dual Model (Rerank)</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] text-gray-600 uppercase font-black">Dimensions</label>
                          <input 
                              type="number" 
                              value={step.config.primaryDims || 768} 
                              onChange={(e) => updateStepConfigInConfig(configId, step.id, { primaryDims: parseInt(e.target.value) })}
                              className="w-full bg-nebula-950 border border-nebula-800 rounded-lg p-2 text-xs text-white outline-none" 
                          />
                      </div>
                  </div>
              );
          case 'Retrieval':
              return (
                  <div className="grid grid-cols-2 gap-6 p-4 bg-nebula-900/50 rounded-2xl border border-nebula-800/50 shadow-inner">
                      <div className="space-y-2">
                          <label className="text-[9px] text-gray-600 uppercase font-black">Rerank Top K</label>
                          <input 
                              type="number" 
                              value={step.config.rerankTopK || 10} 
                              onChange={(e) => updateStepConfigInConfig(configId, step.id, { rerankTopK: parseInt(e.target.value) })}
                              className="w-full bg-nebula-950 border border-nebula-800 rounded-lg p-2 text-xs text-white outline-none" 
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[9px] text-gray-600 uppercase font-black">Vector Store</label>
                          <select 
                              value={step.config.vectorStore || 'ChromaDB'} 
                              onChange={(e) => updateStepConfigInConfig(configId, step.id, { vectorStore: e.target.value })}
                              className="w-full bg-nebula-950 border border-nebula-800 rounded-lg p-2 text-xs text-white outline-none"
                          >
                              <option value="ChromaDB">ChromaDB</option>
                              <option value="FAISS">FAISS</option>
                              <option value="Pinecone">Pinecone</option>
                          </select>
                      </div>
                  </div>
              );
          case 'Generation':
              return (
                  <div className="grid grid-cols-2 gap-6 p-4 bg-nebula-900/50 rounded-2xl border border-nebula-800/50 shadow-inner">
                      <div className="space-y-2">
                          <label className="text-[9px] text-gray-600 uppercase font-black">Success Metric</label>
                          <select 
                              value={step.config.metric || 'Throughput'} 
                              onChange={(e) => updateStepConfigInConfig(configId, step.id, { metric: e.target.value })}
                              className="w-full bg-nebula-950 border border-nebula-800 rounded-lg p-2 text-xs text-white outline-none"
                          >
                              <option value="Throughput">Throughput</option>
                              <option value="ExactMatch">Exact Match</option>
                              <option value="Semantic">Semantic similarity</option>
                          </select>
                      </div>
                  </div>
              );
          default:
              return null;
      }
  };

  const renderDataView = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg animate-fade-in h-full overflow-hidden pb-4">
          <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-6 flex flex-col h-full overflow-hidden shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-nebula-800 pb-4">
                  <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-widest text-[10px]"><FileText size={16} className="text-blue-400" /> Documents</h3>
                  <button onClick={() => {}} className="p-2 hover:bg-nebula-800 rounded-xl text-gray-500 hover:text-white transition-colors"><Plus size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {mockData.filter(m => m.type === 'PDF').map(m => (
                      <div key={m.id} className="p-4 bg-nebula-950 rounded-2xl flex justify-between items-start group hover:bg-nebula-800 transition-all border border-nebula-800/60 hover:border-blue-500/30">
                          <div className="min-w-0">
                              <div className="text-xs font-black text-gray-200 uppercase truncate mb-1" title={m.name}>{m.name}</div>
                              <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{m.size} // {m.date}</div>
                          </div>
                          <button className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>
          <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-6 flex flex-col h-full overflow-hidden shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-nebula-800 pb-4">
                  <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-widest text-[10px]"><Code size={16} className="text-green-400" /> Ground Truths</h3>
                  <button onClick={() => {}} className="p-2 hover:bg-nebula-800 rounded-xl text-gray-500 hover:text-white transition-colors"><Plus size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {mockData.filter(m => m.type === 'Prompt').map(m => (
                      <div key={m.id} className="p-4 bg-nebula-950 rounded-2xl flex justify-between items-start group hover:bg-nebula-800 transition-all border border-nebula-800/60 hover:border-green-500/30">
                          <div className="min-w-0">
                              <div className="text-xs font-black text-gray-200 uppercase truncate mb-1">{m.name}</div>
                              <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{m.size} // {m.date}</div>
                          </div>
                          <button className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>
          <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-6 flex flex-col h-full overflow-hidden shadow-xl">
              <div className="flex justify-between items-center mb-6 border-b border-nebula-800 pb-4">
                  <h3 className="font-black text-white flex items-center gap-3 uppercase tracking-widest text-[10px]"><Table size={16} className="text-orange-400" /> Evaluation Sets</h3>
                  <button onClick={() => {}} className="p-2 hover:bg-nebula-800 rounded-xl text-gray-500 hover:text-white transition-colors"><Plus size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  {mockData.filter(m => m.type === 'SQL').map(m => (
                      <div key={m.id} className="p-4 bg-nebula-950 rounded-2xl flex justify-between items-start group hover:bg-nebula-800 transition-all border border-nebula-800/60 hover:border-orange-500/30">
                          <div className="min-w-0">
                              <div className="text-xs font-black text-gray-200 uppercase truncate mb-1">{m.name}</div>
                              <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{m.size} // {m.date}</div>
                          </div>
                          <button className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-space-lg h-full flex flex-col relative overflow-hidden p-space-xl">
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-type-heading-lg font-black flex items-center gap-4 uppercase tracking-tighter">
            <Gauge className="text-purple-500" size={32} /> 
            Analytics Engine
        </h2>
        <div className="flex bg-nebula-900 rounded-2xl p-1.5 border border-nebula-700 shadow-inner">
             <button onClick={() => setActiveView('matrix')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'matrix' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Matrix</button>
            <button onClick={() => setActiveView('trends')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'trends' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Trends</button>
            <button onClick={() => setActiveView('data')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'data' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Sources</button>
            <button onClick={() => setActiveView('config')} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'config' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>Pipelines</button>
        </div>
      </div>

      {activeView === 'matrix' && (
        <div className="space-y-space-lg animate-fade-in flex-1 overflow-y-auto">
            <div className="overflow-x-auto rounded-[2rem] border border-nebula-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
              <table className="w-full text-left bg-nebula-900 border-collapse">
                <thead className="bg-nebula-950 text-gray-500 uppercase text-[9px] font-black tracking-[0.2em]">
                  <tr>
                    <th className="px-space-lg py-6 border-b border-nebula-800">Model Specimen</th>
                    <th className="px-space-lg py-6 border-b border-nebula-800">Commit</th>
                    <th className="px-space-lg py-6 border-b border-nebula-800">Protocol</th>
                    <th className="px-space-lg py-6 border-b border-nebula-800 text-right">Score</th>
                    <th className="px-space-lg py-6 border-b border-nebula-800 text-right">T/S Speed</th>
                    <th className="px-space-lg py-6 border-b border-nebula-800 text-right">Latency</th>
                    <th className="px-space-lg py-6 border-b border-nebula-800 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nebula-800/50">
                  {results.map((row) => (
                    <tr key={row.id} onClick={() => setSelectedResult(row)} className="hover:bg-nebula-800/40 transition-all cursor-pointer group">
                      <td className="px-space-lg py-5 font-black text-gray-200 uppercase tracking-tight text-sm">{row.modelId}</td>
                      <td className="px-space-lg py-5 text-gray-500 font-mono text-[10px] uppercase font-black">{row.versionId}</td>
                      <td className="px-space-lg py-5 text-gray-600 uppercase tracking-widest text-[9px] font-black">{row.dataset}</td>
                      <td className="px-space-lg py-5 text-right text-green-400 font-mono font-black">{row.score}</td>
                      <td className="px-space-lg py-5 text-right text-blue-400 font-mono text-[10px] font-black">{row.tokensPerSecond?.toFixed(2) || '-'}</td>
                      <td className="px-space-lg py-5 text-right text-purple-400 font-mono text-[10px] font-black">{row.latency}MS</td>
                      <td className="px-space-lg py-5 text-right"><Expand size={14} className="text-gray-700 group-hover:text-purple-500 transition-colors" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {selectedResult && (
          <div className="absolute inset-0 bg-nebula-950/95 backdrop-blur-md z-50 flex items-center justify-center p-space-xl animate-fade-in">
              <div className="bg-nebula-900 border border-nebula-700 rounded-[2.5rem] w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="p-10 border-b border-nebula-800 flex justify-between items-start bg-nebula-950/50">
                      <div>
                          <div className="flex items-center gap-4 mb-2">
                              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedResult.modelId}</h2>
                              <span className="text-[10px] bg-purple-950 px-4 py-1.5 rounded-full text-purple-400 border border-purple-500/20 font-black uppercase tracking-[0.2em]">{selectedResult.type} Protocol</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] flex items-center gap-6 mt-3">
                              <span className="flex items-center gap-2"><Binary size={14} className="text-purple-400"/> {selectedResult.versionId}</span>
                              <span className="flex items-center gap-2"><Database size={14} className="text-blue-400"/> {selectedResult.dataset}</span>
                              <span className="flex items-center gap-2"><Clock size={14} className="text-orange-400"/> {selectedResult.date}</span>
                          </p>
                      </div>
                      <button onClick={() => setSelectedResult(null)} className="p-3 bg-nebula-950 border border-nebula-800 rounded-full text-gray-500 hover:text-white transition-all hover:scale-110 shadow-lg"><X size={28} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                      <div className="grid grid-cols-4 gap-6 mb-12">
                          <div className="bg-nebula-950 border border-nebula-800 p-8 rounded-3xl relative overflow-hidden shadow-inner group">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-green-500/30 group-hover:bg-green-500/60 transition-colors"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-[0.2em]">Quality Index</div>
                              <div className="text-5xl font-black text-white tracking-tighter">{selectedResult.score}</div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-8 rounded-3xl relative overflow-hidden shadow-inner group">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500/30 group-hover:bg-blue-500/60 transition-colors"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-[0.2em]">Gen Throughput</div>
                              <div className="text-5xl font-black text-white tracking-tighter">{selectedResult.tokensPerSecond ? selectedResult.tokensPerSecond.toFixed(1) : '-'}<span className="text-xs text-gray-600 font-black ml-1">T/S</span></div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-8 rounded-3xl relative overflow-hidden shadow-inner group">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500/30 group-hover:bg-purple-500/60 transition-colors"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-[0.2em]">Response Latency</div>
                              <div className="text-5xl font-black text-white tracking-tighter">{selectedResult.latency}<span className="text-xs text-gray-600 font-black ml-1">MS</span></div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-8 rounded-3xl relative overflow-hidden shadow-inner group">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-500/30 group-hover:bg-orange-500/60 transition-colors"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-2 tracking-[0.2em]">Hardware Profile</div>
                              <div className="text-lg font-black text-gray-200 mt-4 uppercase truncate tracking-tight">{selectedResult.hardwareName}</div>
                          </div>
                      </div>

                      {selectedResult.segments && selectedResult.segments.length > 0 && (
                          <div className="space-y-6">
                              <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-[0.4em] flex items-center gap-4"><Layers size={20} className="text-yellow-500"/> Block Execution Trace</h3>
                              <div className="bg-nebula-950 rounded-[2rem] border border-nebula-800 overflow-hidden shadow-2xl">
                                  <div className="grid grid-cols-12 gap-6 p-6 bg-nebula-900/80 border-b border-nebula-800 text-[10px] font-black text-gray-600 uppercase tracking-widest">
                                      <div className="col-span-4">Execution Block</div>
                                      <div className="col-span-2">Protocol</div>
                                      <div className="col-span-2 text-right">Delta</div>
                                      <div className="col-span-4 text-right">Cost Heatmap</div>
                                  </div>
                                  {selectedResult.segments.map((seg, idx) => (
                                      <div key={idx} className="grid grid-cols-12 gap-6 p-6 border-b border-nebula-800 last:border-0 hover:bg-nebula-800/30 transition-colors group">
                                          <div className="col-span-4 font-black text-gray-200 text-sm uppercase tracking-tight group-hover:text-purple-400 transition-colors">{seg.stepName}</div>
                                          <div className="col-span-2 text-[10px] text-gray-500 font-black uppercase flex items-center gap-3">
                                              {getStepIcon(seg.type)}
                                              {seg.type}
                                          </div>
                                          <div className="col-span-2 text-right font-mono font-black text-purple-300 text-xs">{seg.duration}ms</div>
                                          <div className="col-span-4 flex items-center gap-4 pl-10">
                                              <div className="flex-1 h-2 bg-nebula-900 rounded-full overflow-hidden p-0.5 shadow-inner">
                                                  <div className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full" style={{ width: `${(seg.duration / selectedResult.latency) * 100}%` }}></div>
                                              </div>
                                              <span className="text-[10px] font-mono font-black text-gray-600 w-12 text-right">{((seg.duration / selectedResult.latency) * 100).toFixed(1)}%</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeView === 'trends' && (
         <div className="flex-1 overflow-y-auto animate-fade-in flex flex-col gap-space-lg custom-scrollbar pr-1">
             {trendSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    <div className="bg-nebula-900/60 border border-nebula-800 p-8 rounded-[2rem] relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform"><TrendingUp size={100} /></div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Fleet Avg Throughput</div>
                        <div className="text-5xl font-black text-blue-400 font-mono tracking-tighter">{trendSummary.avgTps.toFixed(2)} <span className="text-xs text-gray-700 font-black ml-1 uppercase">T/S</span></div>
                    </div>
                    <div className="bg-nebula-900/60 border border-nebula-800 p-8 rounded-[2rem] relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform"><Zap size={100} /></div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Peak Burst Observed</div>
                        <div className="text-5xl font-black text-purple-400 font-mono tracking-tighter">{trendSummary.peakTps.toFixed(2)} <span className="text-xs text-gray-700 font-black ml-1 uppercase">T/S</span></div>
                    </div>
                    <div className="bg-nebula-900/60 border border-nebula-800 p-8 rounded-[2rem] relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform"><Clock size={100} /></div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-2">Fleet Mean Latency</div>
                        <div className="text-5xl font-black text-green-400 font-mono tracking-tighter">{Math.round(trendSummary.avgLat)} <span className="text-xs text-gray-700 font-black ml-1 uppercase">MS</span></div>
                    </div>
                </div>
             )}

             <div className="bg-nebula-900 border border-nebula-700 rounded-[2rem] p-8 flex flex-wrap gap-10 items-center shadow-2xl relative overflow-hidden">
                 <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-purple-500/5 blur-3xl rounded-full"></div>
                 <div className="flex items-center gap-5 border-r border-nebula-800 pr-10">
                     <Filter size={24} className="text-purple-500" />
                     <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-200">Test Filters</span>
                 </div>
                 <div className="flex flex-col gap-2">
                     <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Target Protocol</label>
                     <select value={trendDatasetFilter} onChange={(e) => setTrendDatasetFilter(e.target.value)} className="bg-nebula-950 border border-nebula-800 rounded-xl px-5 py-2.5 text-xs font-black uppercase text-gray-300 outline-none focus:border-purple-500 transition-all cursor-pointer min-w-[240px] shadow-inner">
                         <option value="All">All Observation Sets</option>
                         {availableDatasets.map(ds => <option key={ds} value={ds}>{ds.toUpperCase()}</option>)}
                     </select>
                 </div>
                 <div className="flex-1 flex flex-wrap gap-4 items-center pl-10 border-l border-nebula-800">
                     <span className="text-[9px] text-gray-600 uppercase font-black tracking-widest block w-full mb-2">Subject Samples</span>
                     {availableModels.map((m, i) => (
                         <button key={m} onClick={() => toggleModelFilter(m)} className={`px-5 py-2.5 rounded-xl text-[10px] border font-black uppercase tracking-widest flex items-center gap-3 transition-all ${trendModelFilter.includes(m) ? 'bg-purple-900/30 border-purple-500 text-purple-200 shadow-xl' : 'bg-nebula-950 border-nebula-800 text-gray-600 hover:text-gray-300'}`}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                            {m}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="grid grid-cols-1 gap-8 pb-10">
                <div className="bg-nebula-900 border border-nebula-800 rounded-[2.5rem] p-10 h-[480px] shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-12 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-2xl text-blue-400"><Zap size={28} /></div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Throughput Gradient</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Comparative token emission velocity</p>
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={processedTrendData}>
                            <defs>
                                {trendModelFilter.map((modelId, i) => (
                                    <linearGradient key={`grad_${modelId}`} id={`grad_${modelId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" vertical={false} />
                            <XAxis dataKey="date" stroke="#4b5563" fontSize={9} axisLine={false} tickLine={false} tick={{fontWeight: '900', letterSpacing: '0.1em'}} />
                            <YAxis stroke="#4b5563" fontSize={9} axisLine={false} tickLine={false} tick={{fontWeight: '900'}} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#272730', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', fontSize: '12px', fontWeight: '900' }} />
                            {trendModelFilter.map((modelId, i) => (
                                <Area key={modelId} type="monotone" dataKey={`${modelId}_tps`} stroke={COLORS[i % COLORS.length]} strokeWidth={4} fill={`url(#grad_${modelId})`} name={modelId.toUpperCase()} connectNulls animationDuration={2000} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-nebula-900 border border-nebula-800 rounded-[2.5rem] p-10 h-[480px] shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-12 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-2xl text-purple-400"><Clock size={28} /></div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Latency Deviation</h3>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">End-to-end inference delay analysis</p>
                            </div>
                        </div>
                    </div>
                     <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={processedTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" vertical={false} />
                            <XAxis dataKey="date" stroke="#4b5563" fontSize={9} axisLine={false} tickLine={false} tick={{fontWeight: '900', letterSpacing: '0.1em'}} />
                            <YAxis stroke="#4b5563" fontSize={9} axisLine={false} tickLine={false} tick={{fontWeight: '900'}} />
                            <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #272730', borderRadius: '16px' }} />
                            {trendModelFilter.map((modelId, i) => (
                                <Line key={modelId} type="monotone" dataKey={`${modelId}_lat`} stroke={COLORS[i % COLORS.length]} strokeWidth={4} dot={{ r: 6, strokeWidth: 3, fill: '#09090b' }} activeDot={{ r: 9, strokeWidth: 0 }} name={modelId.toUpperCase()} connectNulls />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
             </div>
         </div>
      )}

      {activeView === 'data' && (
          <div className="flex-1 overflow-hidden h-full">
             {renderDataView()}
          </div>
      )}

      {activeView === 'config' && (
          <div className="flex flex-1 min-h-0 gap-space-lg animate-fade-in overflow-hidden">
              <div className="w-64 flex flex-col gap-6 shrink-0">
                  <div className="p-6 bg-nebula-900 border border-nebula-700 rounded-[2rem] h-full flex flex-col shadow-2xl overflow-hidden">
                      <h3 className="text-[10px] font-black text-gray-600 mb-6 uppercase tracking-[0.3em] border-b border-nebula-800 pb-4">Genomic Tags</h3>
                      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          {(['Custom', 'Retrieval', 'Embedding', 'Tool Calling', 'Generation', 'ColBERT', 'Extraction', 'Routing', 'Classification'] as BenchmarkStepType[]).map(tag => (
                              <div key={tag} draggable onDragStart={(e) => handleDragStart(e, tag)} className="w-full flex items-center gap-4 p-4 bg-nebula-950 border border-nebula-800 rounded-2xl hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-[10px] font-black uppercase tracking-widest group text-left cursor-grab active:cursor-grabbing shadow-lg">
                                  <div className="p-2 bg-nebula-900 rounded-xl border border-nebula-800 group-hover:border-purple-500/40 transition-colors">{getStepIcon(tag)}</div>
                                  <span className="text-gray-500 group-hover:text-purple-300 transition-colors">{tag}</span>
                              </div>
                          ))}
                      </div>
                  </div>
                  <button onClick={handleNewConfig} className="p-6 bg-purple-600 hover:bg-purple-500 text-white rounded-[1.75rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl transition-all shrink-0 border-t border-white/20 active:scale-95"><Plus size={24} /> New Pipeline</button>
              </div>

              <div className="flex-1 flex flex-col min-w-0 space-y-6 pr-2 overflow-y-auto custom-scrollbar">
                  {savedConfigs.map(config => (
                      <div key={config.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDropOnConfig(e, config.id)} className={`bg-nebula-900 border ${expandedConfigId === config.id ? 'border-purple-500 ring-8 ring-purple-500/5 shadow-[0_0_100px_rgba(0,0,0,0.6)]' : 'border-nebula-800'} rounded-[2.5rem] transition-all overflow-hidden`}>
                          <div className={`p-8 flex justify-between items-center cursor-pointer transition-colors ${expandedConfigId === config.id ? 'bg-nebula-950/90' : 'hover:bg-nebula-800/50'}`} onClick={() => setExpandedConfigId(expandedConfigId === config.id ? null : config.id)}>
                              <div className="flex items-center gap-8">
                                  <div className={`p-5 rounded-2xl bg-nebula-900 border border-nebula-800 shadow-inner ${expandedConfigId === config.id ? 'text-purple-400' : 'text-gray-600'}`}><GitFork size={32} /></div>
                                  <div>
                                      {expandedConfigId === config.id ? (
                                          <input value={config.name} onChange={(e) => handleUpdateConfig(config.id, { name: e.target.value })} onClick={(e) => e.stopPropagation()} className="bg-transparent text-white font-black text-2xl uppercase tracking-tighter outline-none placeholder-gray-800 w-full" />
                                      ) : (
                                          <h3 className="text-xl font-black text-gray-200 uppercase tracking-tight">{config.name}</h3>
                                      )}
                                      <div className="flex items-center gap-6 text-[10px] text-gray-600 font-black uppercase tracking-widest mt-2">
                                          <span className="flex items-center gap-2"><Box size={14} /> {config.steps.length} Protocol Blocks</span>
                                          <span className="flex items-center gap-2 max-w-[300px] truncate"><FileText size={14} /> {config.scriptPath || 'ROOT_EMPTY'}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteConfig(config.id); }} className="p-4 text-gray-700 hover:text-red-400 hover:bg-red-950 rounded-2xl transition-all"><Trash2 size={24}/></button>
                                  <div className="ml-6 p-3 bg-nebula-950 rounded-2xl shadow-inner">{expandedConfigId === config.id ? <ChevronDown size={28} className="text-purple-500"/> : <ChevronRight size={28} className="text-gray-700"/>}</div>
                              </div>
                          </div>
                          {expandedConfigId === config.id && (
                              <div className="p-12 border-t border-nebula-800 bg-nebula-950/40 animate-fade-in space-y-16">
                                  <div className="space-y-6">
                                      <label className="text-[10px] text-gray-600 uppercase font-black tracking-[0.4em] flex items-center gap-4"><Terminal size={18} className="text-purple-400" /> Executive Endpoint</label>
                                      <input type="text" value={config.scriptPath || ''} onChange={(e) => handleUpdateConfig(config.id, { scriptPath: e.target.value })} className="w-full bg-nebula-900 border border-nebula-800 rounded-2xl p-5 text-sm text-gray-200 font-mono focus:border-purple-500 outline-none shadow-inner" placeholder="~/cluster/analysis_v1.py" />
                                  </div>
                                  <div className="grid grid-cols-4 gap-12 bg-nebula-900/40 p-10 rounded-[2rem] border border-nebula-800 shadow-inner">
                                      <div className="space-y-4">
                                          <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Horizon Context</label>
                                          <input type="number" value={config.parameters.contextSize} onChange={(e) => handleUpdateParameter(config.id, 'contextSize', parseInt(e.target.value))} className="w-full bg-nebula-950 border border-nebula-800 rounded-xl p-4 text-sm font-black text-white outline-none focus:border-purple-500" />
                                      </div>
                                      <div className="space-y-4">
                                          <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Temperature</label>
                                          <input type="number" step="0.1" value={config.parameters.temperature} onChange={(e) => handleUpdateParameter(config.id, 'temperature', parseFloat(e.target.value))} className="w-full bg-nebula-950 border border-nebula-800 rounded-xl p-4 text-sm font-black text-white outline-none focus:border-purple-500" />
                                      </div>
                                      <div className="flex flex-col justify-end gap-5">
                                          <label className="flex items-center gap-4 cursor-pointer group">
                                              <div className="relative"><input type="checkbox" checked={config.parameters.flashAttention} onChange={(e) => handleUpdateParameter(config.id, 'flashAttention', e.target.checked)} className="sr-only peer" /><div className="w-14 h-7 bg-nebula-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-500 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div></div>
                                              <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-gray-200 tracking-widest">Flash Attn</span>
                                          </label>
                                      </div>
                                      <div className="flex flex-col justify-end gap-5">
                                          <label className="flex items-center gap-4 cursor-pointer group">
                                               <div className="relative"><input type="checkbox" checked={config.parameters.warmup} onChange={(e) => handleUpdateParameter(config.id, 'warmup', e.target.checked)} className="sr-only peer" /><div className="w-14 h-7 bg-nebula-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-gray-500 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white"></div></div>
                                              <span className="text-[10px] font-black uppercase text-gray-600 group-hover:text-gray-200 tracking-widest flex items-center gap-2">Preload <Flame size={14} className="text-orange-500" /></span>
                                          </label>
                                      </div>
                                  </div>
                                  <div className="space-y-8">
                                      <label className="text-[11px] text-gray-600 uppercase font-black tracking-[0.4em] flex items-center gap-4"><GitBranch size={20} className="text-blue-400" /> Topology Stack</label>
                                      <div className="space-y-6 p-10 border-2 border-dashed border-nebula-800/40 rounded-[2.5rem] bg-nebula-900/10 min-h-[200px]">
                                          {config.steps.map((step, idx) => (
                                              <div key={step.id} className="relative animate-fade-in group/step">
                                                  {idx > 0 && <div className="absolute -top-6 left-11 w-0.5 h-6 bg-nebula-800/40"></div>}
                                                  <div className="bg-nebula-950 border border-nebula-800 rounded-3xl p-8 hover:border-purple-500/50 transition-all shadow-2xl relative group-hover/step:translate-x-2 transition-transform">
                                                      <div className="flex items-start gap-8">
                                                          <div className="p-4 bg-nebula-900 rounded-2xl border border-nebula-800 text-gray-600 group-hover/step:text-purple-400 transition-colors">{getStepIcon(step.type)}</div>
                                                          <div className="flex-1 space-y-6">
                                                              <div className="flex justify-between items-center">
                                                                  <input value={step.name} onChange={(e) => updateStepInConfig(config.id, step.id, { name: e.target.value })} className="bg-transparent text-lg font-black text-white uppercase tracking-tight outline-none" />
                                                                  <div className="flex items-center gap-6">
                                                                      <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 bg-nebula-900 rounded-full text-gray-600 border border-nebula-800">{step.type}</span>
                                                                      <button onClick={() => removeStepFromConfig(config.id, step.id)} className="text-gray-700 hover:text-red-500 transition-colors"><X size={20}/></button>
                                                                  </div>
                                                              </div>
                                                              <div className="grid grid-cols-2 gap-8">
                                                                  <select value={step.serverId || ''} onChange={(e) => updateStepInConfig(config.id, step.id, { serverId: e.target.value })} className="bg-nebula-900 border border-nebula-800 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:text-white outline-none focus:border-purple-500/50 appearance-none shadow-inner cursor-pointer">
                                                                      <option value="">CLUSTER_DEFAULT</option>
                                                                      {servers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                                                  </select>
                                                                  <select value={step.modelId || ''} onChange={(e) => updateStepInConfig(config.id, step.id, { modelId: e.target.value })} className="bg-nebula-900 border border-nebula-800 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 focus:text-white outline-none focus:border-purple-500/50 appearance-none shadow-inner cursor-pointer">
                                                                      <option value="">MODEL_INHERIT</option>
                                                                      {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                                                  </select>
                                                              </div>
                                                              {renderStepConfigFields(step, config.id)}
                                                          </div>
                                                      </div>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  <div className="flex justify-center">
                                      <button className="px-20 py-6 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-[0.4em] rounded-[1.5rem] flex items-center gap-6 shadow-[0_30px_60px_-15px_rgba(139,92,246,0.5)] transition-all hover:scale-105 border-t border-white/20 active:scale-95">
                                          <Play size={24} fill="currentColor" /> Execute Protocol
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};
