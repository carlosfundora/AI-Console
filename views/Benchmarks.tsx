
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BenchmarkResult, Model, AdvancedBenchmarkConfig, BenchmarkStep, BenchmarkStepType, MockDataSource, ServerProfile } from '../types';
// Fixed missing Terminal and GitBranch imports from lucide-react
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
  
  // Data Management State
  const [mockData, setMockData] = useState<MockDataSource[]>(INITIAL_MOCK_DATA);

  // Detail Modal State
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null);
  
  // Test Editor State
  const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);
  const [draggingTag, setDraggingTag] = useState<BenchmarkStepType | null>(null);

  // Trend Filters
  const [trendModelFilter, setTrendModelFilter] = useState<string[]>([]); 
  const [trendDatasetFilter, setTrendDatasetFilter] = useState<string>('All');

  const availableModels = useMemo(() => Array.from(new Set(results.map(r => r.modelId))), [results]);
  const availableDatasets = useMemo(() => Array.from(new Set(results.map(r => r.dataset))), [results]);

  // Initializing filters with all models if empty
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
    // 1. Filter raw results
    const filtered = results.filter(r => {
        const modelMatch = trendModelFilter.length === 0 || trendModelFilter.includes(r.modelId);
        const datasetMatch = trendDatasetFilter === 'All' || r.dataset === trendDatasetFilter;
        return modelMatch && datasetMatch;
    });

    // 2. Group by Date for Recharts (X-Axis)
    const dataByDate: Record<string, any> = {};
    
    // Sort chronologically first
    const sorted = [...filtered].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(r => {
        if (!dataByDate[r.date]) {
            dataByDate[r.date] = { date: r.date };
        }
        // We use modelId as the key for the lines
        // For Throughput
        if (r.tokensPerSecond) dataByDate[r.date][`${r.modelId}_tps`] = r.tokensPerSecond;
        // For Latency
        if (r.latency) dataByDate[r.date][`${r.modelId}_lat`] = r.latency;
        // For Score
        if (r.score) dataByDate[r.date][`${r.modelId}_score`] = r.score;
    });

    return Object.values(dataByDate);
  }, [results, trendModelFilter, trendDatasetFilter]);

  // Derived Trend Aggregates
  const trendSummary = useMemo(() => {
    const activeResults = results.filter(r => trendModelFilter.includes(r.modelId));
    if (activeResults.length === 0) return null;

    const avgTps = activeResults.reduce((sum, r) => sum + (r.tokensPerSecond || 0), 0) / activeResults.length;
    const peakTps = Math.max(...activeResults.map(r => r.tokensPerSecond || 0));
    const avgLat = activeResults.reduce((sum, r) => sum + r.latency, 0) / activeResults.length;
    
    return { avgTps, peakTps, avgLat };
  }, [results, trendModelFilter]);

  // --- CRUD Operations for Tests ---

  const handleNewConfig = () => {
      const newConfig = { 
          ...DEFAULT_ADV_CONFIG, 
          id: `cfg-${Date.now()}`,
          name: 'Untitled Test Pipeline' 
      };
      setSavedConfigs([newConfig, ...savedConfigs]);
      setExpandedConfigId(newConfig.id);
  };

  const handleUpdateConfig = (id: string, updates: Partial<AdvancedBenchmarkConfig>) => {
      setSavedConfigs(savedConfigs.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteConfig = (id: string) => {
      if (confirm('Are you sure you want to delete this test pipeline?')) {
          setSavedConfigs(savedConfigs.filter(c => c.id !== id));
          if (expandedConfigId === id) setExpandedConfigId(null);
      }
  };

  const handleUpdateParameter = (configId: string, key: keyof AdvancedBenchmarkConfig['parameters'], value: any) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (config) {
          handleUpdateConfig(configId, {
              parameters: { ...config.parameters, [key]: value }
          });
      }
  };

  // --- Step Management inside a Test ---

  const addStepToConfig = (configId: string, type: BenchmarkStepType) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (!config) return;

      const newStep: BenchmarkStep = {
          id: `step-${Date.now()}`,
          type,
          name: `${type} Step`,
          enabled: true,
          config: { embeddingStrategy: 'Single' }
      };

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
      handleUpdateConfig(configId, {
          steps: config.steps.map(s => s.id === stepId ? { ...s, ...updates } : s)
      });
  };
  
  const updateStepConfigInConfig = (configId: string, stepId: string, configUpdates: any) => {
      const config = savedConfigs.find(c => c.id === configId);
      if (!config) return;
      handleUpdateConfig(configId, {
          steps: config.steps.map(s => s.id === stepId ? { ...s, config: { ...s.config, ...configUpdates } } : s)
      });
  };

  // --- Drag & Drop ---

  const handleDragStart = (e: React.DragEvent, type: BenchmarkStepType) => {
      setDraggingTag(type);
      e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropOnConfig = (e: React.DragEvent, configId: string) => {
      e.preventDefault();
      if (draggingTag) {
          addStepToConfig(configId, draggingTag);
          setDraggingTag(null);
          // Auto expand if dropping onto a collapsed card
          setExpandedConfigId(configId); 
      }
  };

  // --- Helpers ---

  // Mock Data Management
  const addMockData = (type: 'PDF' | 'Prompt' | 'SQL') => {
      const name = prompt(`Enter ${type} filename:`);
      if (name) {
          setMockData([...mockData, {
              id: `m-${Date.now()}`,
              name,
              type,
              size: '0 KB',
              date: new Date().toISOString().split('T')[0],
              path: `/data/mock/${name}`
          }]);
      }
  };

  const removeMockData = (id: string) => {
      setMockData(mockData.filter(m => m.id !== id));
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

  const renderStepConfigFields = (step: BenchmarkStep, configId: string) => {
      const updateConfig = (updates: any) => updateStepConfigInConfig(configId, step.id, updates);

      if (step.type === 'Embedding') {
          return (
              <div className="space-y-space-md pt-2">
                  <div className="flex gap-space-md">
                      <div className="flex items-center gap-space-sm">
                          <input 
                              type="radio" 
                              id={`single-${step.id}`}
                              checked={step.config.embeddingStrategy !== 'Dual'} 
                              onChange={() => updateConfig({ embeddingStrategy: 'Single' })}
                              className="accent-purple-500 cursor-pointer"
                          />
                          <label htmlFor={`single-${step.id}`} className="text-type-caption text-gray-300 cursor-pointer">Single</label>
                      </div>
                      <div className="flex items-center gap-space-sm">
                          <input 
                              type="radio" 
                              id={`dual-${step.id}`}
                              checked={step.config.embeddingStrategy === 'Dual'} 
                              onChange={() => updateConfig({ embeddingStrategy: 'Dual' })}
                              className="accent-purple-500 cursor-pointer"
                          />
                          <label htmlFor={`dual-${step.id}`} className="text-type-caption text-gray-300 cursor-pointer">Dual (Hybrid)</label>
                      </div>
                  </div>

                  {/* Primary Model */}
                  <div className="bg-nebula-900/50 p-space-sm rounded border border-nebula-800 grid grid-cols-2 gap-space-sm">
                      <div className="col-span-2 text-type-tiny uppercase font-bold text-blue-400">Primary Model</div>
                      <div className="col-span-2">
                          <select 
                            value={step.config.primaryModelId || ''} 
                            onChange={(e) => updateConfig({ primaryModelId: e.target.value })}
                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-gray-300 focus:border-purple-500 outline-none"
                          >
                              <option value="">Select Model...</option>
                              {models.filter(m => m.tags.includes('Embedding') || m.family === 'Bert').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>
                      <input 
                        type="number" 
                        placeholder="Dims (e.g. 768)" 
                        value={step.config.primaryDims || ''}
                        onChange={(e) => updateConfig({ primaryDims: parseInt(e.target.value) })}
                        className="bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-white outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Role (e.g. Dense)" 
                        value={step.config.primaryRole || ''}
                        onChange={(e) => updateConfig({ primaryRole: e.target.value })}
                        className="bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-white outline-none"
                      />
                  </div>

                  {/* Secondary Model (Only if Dual) */}
                  {step.config.embeddingStrategy === 'Dual' && (
                      <div className="bg-nebula-900/50 p-space-sm rounded border border-nebula-800 grid grid-cols-2 gap-space-sm">
                          <div className="col-span-2 text-type-tiny uppercase font-bold text-orange-400">Secondary Model</div>
                          <div className="col-span-2">
                              <select 
                                value={step.config.secondaryModelId || ''} 
                                onChange={(e) => updateConfig({ secondaryModelId: e.target.value })}
                                className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-gray-300 focus:border-purple-500 outline-none"
                              >
                                  <option value="">Select Model...</option>
                                  {models.filter(m => m.tags.includes('Embedding') || m.family === 'Bert').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                          </div>
                          <input 
                            type="number" 
                            placeholder="Dims (e.g. 384)" 
                            value={step.config.secondaryDims || ''}
                            onChange={(e) => updateConfig({ secondaryDims: parseInt(e.target.value) })}
                            className="bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-white outline-none"
                          />
                          <input 
                            type="text" 
                            placeholder="Role (e.g. Sparse)" 
                            value={step.config.secondaryRole || ''}
                            onChange={(e) => updateConfig({ secondaryRole: e.target.value })}
                            className="bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-white outline-none"
                          />
                      </div>
                  )}
              </div>
          );
      }

      if (step.type === 'Classification') {
          return (
              <div className="space-y-space-md pt-2">
                  <div className="bg-nebula-900/50 p-space-sm rounded border border-nebula-800 space-y-space-sm">
                      <div>
                          <label className="text-type-tiny uppercase font-bold text-indigo-400 block mb-1">Classifier Model</label>
                          <select 
                            value={step.modelId || ''} 
                            onChange={(e) => updateStepInConfig(configId, step.id, { modelId: e.target.value })}
                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-gray-300 focus:border-purple-500 outline-none"
                          >
                              <option value="">Select Model...</option>
                              {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-type-tiny uppercase font-bold text-gray-500 block mb-1">Evaluation Metric</label>
                          <select 
                            value={step.config.metric || 'Accuracy'} 
                            onChange={(e) => updateConfig({ metric: e.target.value })}
                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-gray-300 focus:border-purple-500 outline-none"
                          >
                              <option value="Accuracy">Accuracy (Exact Match)</option>
                              <option value="F1">F1 Score (Weighted)</option>
                              <option value="Precision">Precision</option>
                              <option value="Recall">Recall</option>
                          </select>
                      </div>
                  </div>
              </div>
          );
      }

      return null;
  };

  const renderDataView = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg animate-fade-in h-full overflow-hidden pb-4">
          <div className="bg-nebula-900 border border-nebula-700 rounded p-space-md flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-space-md border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-space-sm uppercase tracking-widest text-type-tiny"><FileText size={16} className="text-blue-400" /> Documents</h3>
                  <button onClick={() => addMockData('PDF')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-space-sm custom-scrollbar pr-1">
                  {mockData.filter(m => m.type === 'PDF').map(m => (
                      <div key={m.id} className="p-space-sm bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors border border-nebula-800/50 hover:border-blue-500/30">
                          <div>
                              <div className="text-type-body text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-type-tiny text-gray-500 font-mono uppercase">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-nebula-900 border border-nebula-700 rounded p-space-md flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-space-md border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-space-sm uppercase tracking-widest text-type-tiny"><Code size={16} className="text-green-400" /> Ground Truths</h3>
                  <button onClick={() => addMockData('Prompt')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-space-sm custom-scrollbar pr-1">
                  {mockData.filter(m => m.type === 'Prompt').map(m => (
                      <div key={m.id} className="p-space-sm bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors border border-nebula-800/50 hover:border-green-500/30">
                          <div>
                              <div className="text-type-body text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-type-tiny text-gray-500 font-mono uppercase">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-nebula-900 border border-nebula-700 rounded p-space-md flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-space-md border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-space-sm uppercase tracking-widest text-type-tiny"><Table size={16} className="text-orange-400" /> Evaluation Sets</h3>
                  <button onClick={() => addMockData('SQL')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-space-sm custom-scrollbar pr-1">
                  {mockData.filter(m => m.type === 'SQL').map(m => (
                      <div key={m.id} className="p-space-sm bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors border border-nebula-800/50 hover:border-orange-500/30">
                          <div>
                              <div className="text-type-body text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-type-tiny text-gray-500 font-mono uppercase">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-space-lg h-full flex flex-col relative overflow-hidden p-space-xl">
      {/* Header Controls */}
      <div className="flex justify-between items-center shrink-0">
        <h2 className="text-type-heading-lg font-bold flex items-center gap-3 uppercase tracking-tight">
            <Gauge className="text-purple-500" size={28} /> 
            Analytics Engine
        </h2>
        <div className="flex bg-nebula-900 rounded-lg p-1 border border-nebula-700 shadow-inner">
             <button 
                onClick={() => setActiveView('matrix')}
                className={`px-4 py-2 rounded-md text-type-tiny font-black uppercase tracking-widest transition-all ${activeView === 'matrix' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveView('trends')}
                className={`px-4 py-2 rounded-md text-type-tiny font-black uppercase tracking-widest transition-all ${activeView === 'trends' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                Trends
            </button>
            <button 
                onClick={() => setActiveView('data')}
                className={`px-4 py-2 rounded-md text-type-tiny font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'data' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                 Data Sources
            </button>
            <button 
                onClick={() => setActiveView('config')}
                className={`px-4 py-2 rounded-md text-type-tiny font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeView === 'config' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
                 Test Pipelines
            </button>
        </div>
      </div>

      {activeView === 'matrix' && (
        <div className="space-y-space-lg animate-fade-in flex-1 overflow-y-auto">
            <div className="overflow-x-auto rounded-xl border border-nebula-800 shadow-2xl">
              <table className="w-full text-left bg-nebula-900 border-collapse">
                <thead className="bg-nebula-950 text-gray-500 uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="px-space-lg py-5 border-b border-nebula-800">Model Specimen</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800">Commit</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800">Dataset</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800">Metric Type</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800 text-right">Score</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800 text-right">Throughput</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800 text-right">Latency</th>
                    <th className="px-space-lg py-5 border-b border-nebula-800"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nebula-800/50">
                  {results.map((row) => (
                    <tr 
                        key={row.id} 
                        onClick={() => setSelectedResult(row)}
                        className="hover:bg-nebula-800/30 transition-all cursor-pointer group"
                    >
                      <td className="px-space-lg py-space-md font-bold text-gray-200 uppercase tracking-tight text-type-body">{row.modelId}</td>
                      <td className="px-space-lg py-space-md text-gray-500 font-mono text-xs uppercase">{row.versionId}</td>
                      <td className="px-space-lg py-space-md text-gray-500 uppercase tracking-widest text-[10px]">{row.dataset}</td>
                      <td className="px-space-lg py-space-md text-purple-400/80 font-bold uppercase text-[10px] tracking-widest">{row.metric}</td>
                      <td className="px-space-lg py-space-md text-right text-green-400 font-mono font-black">{row.score}</td>
                      <td className="px-space-lg py-space-md text-right text-blue-400 font-mono text-xs">{row.tokensPerSecond?.toFixed(2) || '-'} T/S</td>
                      <td className="px-space-lg py-space-md text-right text-purple-300 font-mono text-xs">{row.latency}MS</td>
                      <td className="px-space-lg py-space-md text-right">
                          <Expand size={16} className="text-gray-700 group-hover:text-purple-400 transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* Result Detail Modal */}
      {selectedResult && (
          <div className="absolute inset-0 bg-nebula-950/95 backdrop-blur-md z-50 flex items-center justify-center p-space-xl animate-fade-in">
              <div className="bg-nebula-900 border border-nebula-700 rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="p-space-lg border-b border-nebula-800 flex justify-between items-start bg-nebula-950/50">
                      <div>
                          <div className="flex items-center gap-space-sm mb-1">
                              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedResult.modelId}</h2>
                              <span className="text-[10px] bg-purple-900/20 px-3 py-1 rounded-full text-purple-400 border border-purple-500/30 font-black uppercase tracking-widest">{selectedResult.type} Protocol</span>
                          </div>
                          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] flex items-center gap-space-md mt-2">
                              <span><Binary size={12} className="inline mr-1 text-purple-400"/> {selectedResult.versionId}</span>
                              <span><Database size={12} className="inline mr-1 text-blue-400"/> {selectedResult.dataset}</span>
                              <span><Clock size={12} className="inline mr-1 text-orange-400"/> {selectedResult.date}</span>
                          </p>
                      </div>
                      <button onClick={() => setSelectedResult(null)} className="p-2 bg-nebula-950 border border-nebula-800 rounded-full text-gray-500 hover:text-white transition-all hover:scale-110">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-space-xl custom-scrollbar">
                      {/* Top Level Metrics */}
                      <div className="grid grid-cols-4 gap-space-lg mb-space-xl">
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-2xl relative group overflow-hidden">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-green-500/40"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Quality Score ({selectedResult.metric})</div>
                              <div className="text-4xl font-black text-white">{selectedResult.score}</div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-2xl relative group overflow-hidden">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500/40"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Processing Speed</div>
                              <div className="text-4xl font-black text-white">{selectedResult.tokensPerSecond ? selectedResult.tokensPerSecond.toFixed(1) : '-'} <span className="text-xs text-gray-600 font-bold uppercase tracking-widest ml-1">T/S</span></div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-2xl relative group overflow-hidden">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-purple-500/40"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Total Latency</div>
                              <div className="text-4xl font-black text-white">{selectedResult.latency}<span className="text-xs text-gray-600 font-bold uppercase tracking-widest ml-1">MS</span></div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-2xl relative group overflow-hidden">
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-orange-500/40"></div>
                              <div className="text-[9px] text-gray-500 uppercase font-black mb-1 tracking-widest">Hardware Target</div>
                              <div className="text-base font-black text-gray-200 mt-2 uppercase truncate">{selectedResult.hardwareName}</div>
                          </div>
                      </div>

                      {/* Detailed Segments / Pipeline Steps */}
                      {selectedResult.segments && selectedResult.segments.length > 0 ? (
                          <div className="space-y-space-md">
                              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-space-sm mb-6"><Layers size={18} className="text-yellow-500"/> Pipeline Execution Trace</h3>
                              <div className="bg-nebula-950 rounded-3xl border border-nebula-800 overflow-hidden shadow-inner">
                                  <div className="grid grid-cols-12 gap-space-md p-6 bg-nebula-900 border-b border-nebula-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                      <div className="col-span-4">Execution Block</div>
                                      <div className="col-span-2">Op Type</div>
                                      <div className="col-span-2 text-right">Duration</div>
                                      <div className="col-span-4 text-right">Compute Cost %</div>
                                  </div>
                                  {selectedResult.segments.map((seg, idx) => (
                                      <div key={idx} className="grid grid-cols-12 gap-space-md p-6 border-b border-nebula-800 last:border-0 hover:bg-nebula-900/50 transition-colors">
                                          <div className="col-span-4 font-bold text-gray-200 text-type-body uppercase tracking-tight">{seg.stepName}</div>
                                          <div className="col-span-2 text-[10px] text-gray-500 font-black uppercase flex items-center gap-space-sm tracking-widest">
                                              <div className="p-1.5 bg-nebula-900 rounded-lg border border-nebula-800">
                                                  {getStepIcon(seg.type)}
                                              </div>
                                              {seg.type}
                                          </div>
                                          <div className="col-span-2 text-right font-mono font-bold text-purple-300">{seg.duration}ms</div>
                                          <div className="col-span-4 flex items-center gap-space-sm pl-8">
                                              <div className="flex-1 h-1.5 bg-nebula-900 rounded-full overflow-hidden p-0.5">
                                                  <div 
                                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full" 
                                                    style={{ width: `${Math.max(5, (seg.duration / selectedResult.latency) * 100)}%` }}
                                                  ></div>
                                              </div>
                                              <span className="text-[10px] font-mono text-gray-600 w-12 text-right">{((seg.duration / selectedResult.latency) * 100).toFixed(1)}%</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div className="p-space-xl bg-nebula-950/50 border border-nebula-800 border-dashed rounded-3xl flex flex-col items-center justify-center text-gray-600">
                              <Info size={48} className="mb-4 opacity-20" />
                              <p className="uppercase tracking-widest font-black text-xs opacity-50">No granular execution trace found</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeView === 'trends' && (
         <div className="flex-1 overflow-y-auto animate-fade-in flex flex-col gap-space-lg custom-scrollbar pr-1">
             
             {/* Summary Metric Board - NEW for Trend View */}
             {trendSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg animate-fade-in">
                    <div className="bg-nebula-900/50 border border-nebula-800 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform"><TrendingUp size={80} /></div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Global Avg Throughput</div>
                        <div className="text-4xl font-black text-blue-400 font-mono">{trendSummary.avgTps.toFixed(2)} <span className="text-xs text-gray-600">T/S</span></div>
                    </div>
                    <div className="bg-nebula-900/50 border border-nebula-800 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform"><Activity size={80} /></div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Peak Observation</div>
                        <div className="text-4xl font-black text-purple-400 font-mono">{trendSummary.peakTps.toFixed(2)} <span className="text-xs text-gray-600">T/S</span></div>
                    </div>
                    <div className="bg-nebula-900/50 border border-nebula-800 p-6 rounded-3xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:rotate-0 transition-transform"><Clock size={80} /></div>
                        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">System Avg Latency</div>
                        <div className="text-4xl font-black text-green-400 font-mono">{Math.round(trendSummary.avgLat)} <span className="text-xs text-gray-600">MS</span></div>
                    </div>
                </div>
             )}

             {/* Trend Controls */}
             <div className="bg-nebula-900 border border-nebula-700 rounded-3xl p-6 flex flex-wrap gap-8 items-center shadow-xl">
                 <div className="flex items-center gap-4 border-r border-nebula-800 pr-8">
                     <Filter size={20} className="text-purple-400" />
                     <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-300">Observation Filters</span>
                 </div>
                 
                 <div className="flex flex-col gap-1.5">
                     <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Active Test Protocol</label>
                     <select 
                        value={trendDatasetFilter}
                        onChange={(e) => setTrendDatasetFilter(e.target.value)}
                        className="bg-nebula-950 border border-nebula-800 rounded-xl px-4 py-2 text-xs font-bold text-gray-200 outline-none focus:border-purple-500 transition-all cursor-pointer min-w-[200px]"
                     >
                         <option value="All">All Evaluation Sets</option>
                         {availableDatasets.map(ds => <option key={ds} value={ds}>{ds}</option>)}
                     </select>
                 </div>

                 <div className="flex-1 flex flex-wrap gap-3 items-center pl-8 border-l border-nebula-800">
                     <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest block w-full mb-1">Target Model Samples:</span>
                     {availableModels.map((m, i) => (
                         <button 
                            key={m}
                            onClick={() => toggleModelFilter(m)}
                            className={`px-4 py-2 rounded-xl text-[10px] border font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                                trendModelFilter.includes(m) 
                                ? 'bg-purple-900/20 border-purple-500 text-purple-200 shadow-lg' 
                                : 'bg-nebula-950 border-nebula-800 text-gray-500 hover:text-gray-300 hover:border-nebula-600'
                            }`}
                         >
                            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{backgroundColor: COLORS[i % COLORS.length], color: COLORS[i % COLORS.length]}}></div>
                            {m}
                         </button>
                     ))}
                 </div>
             </div>

             <div className="grid grid-cols-1 gap-space-lg pb-10">
                {/* Throughput Chart - ENHANCED */}
                <div className="bg-nebula-900 border border-nebula-800 rounded-3xl p-8 h-[450px] shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-2xl text-blue-400">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Throughput Evolution</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Tokens per second analysis over discrete run intervals</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-nebula-950 rounded-xl border border-nebula-800">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Realtime Sync</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={processedTrendData}>
                            <defs>
                                {trendModelFilter.map((modelId, i) => (
                                    <linearGradient key={`grad_${modelId}`} id={`grad_${modelId}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" vertical={false} />
                            <XAxis dataKey="date" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} tick={{fontFamily: 'ui-monospace', fontWeight: 600}} />
                            <YAxis stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} tick={{fontFamily: 'ui-monospace'}} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#1c1c24', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontSize: '12px', fontWeight: 'bold' }} 
                                cursor={{ stroke: '#4b5563', strokeWidth: 1 }}
                            />
                            {trendModelFilter.map((modelId, i) => (
                                <Area 
                                    key={modelId}
                                    type="monotone" 
                                    dataKey={`${modelId}_tps`} 
                                    stroke={COLORS[i % COLORS.length]} 
                                    strokeWidth={3} 
                                    fill={`url(#grad_${modelId})`}
                                    name={modelId.toUpperCase()}
                                    connectNulls
                                    animationDuration={1500}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                 {/* Latency Chart - ENHANCED */}
                 <div className="bg-nebula-900 border border-nebula-800 rounded-3xl p-8 h-[450px] shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-2xl text-purple-400">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Latency Analysis</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">End-to-end inference delay in milliseconds</p>
                            </div>
                        </div>
                    </div>
                     <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={processedTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1c1c24" vertical={false} />
                            <XAxis dataKey="date" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} tick={{fontFamily: 'ui-monospace', fontWeight: 600}} />
                            <YAxis stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} tick={{fontFamily: 'ui-monospace'}} />
                            <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#1c1c24', borderRadius: '16px', fontSize: '12px' }} />
                            {trendModelFilter.map((modelId, i) => (
                                <Line 
                                    key={modelId}
                                    type="monotone" 
                                    dataKey={`${modelId}_lat`} 
                                    stroke={COLORS[i % COLORS.length]} 
                                    strokeWidth={3} 
                                    dot={{ r: 4, strokeWidth: 2, fill: '#0a0a0f' }} 
                                    activeDot={{ r: 8, strokeWidth: 0 }} 
                                    name={modelId.toUpperCase()}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                 </div>
             </div>
         </div>
      )}

      {activeView === 'config' && (
          <div className="flex flex-1 min-h-0 gap-space-lg animate-fade-in overflow-hidden">
              {/* Left Sidebar: Tag Palette */}
              <div className="w-64 flex flex-col gap-space-md shrink-0">
                  <div className="p-space-md bg-nebula-900 border border-nebula-700 rounded-2xl h-full flex flex-col shadow-xl">
                      <h3 className="text-[10px] font-black text-gray-500 mb-space-md uppercase tracking-[0.2em] border-b border-nebula-800 pb-4">Test Components</h3>
                      <div className="space-y-space-sm flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          {(['Custom', 'Retrieval', 'Embedding', 'Tool Calling', 'Generation', 'ColBERT', 'Extraction', 'Routing', 'Classification'] as BenchmarkStepType[]).map(tag => (
                              <div
                                  key={tag}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, tag)}
                                  className="w-full flex items-center gap-space-sm p-4 bg-nebula-950 border border-nebula-800 rounded-xl hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-xs font-black uppercase tracking-widest group text-left cursor-grab active:cursor-grabbing shadow-sm"
                              >
                                  <div className="p-1.5 bg-nebula-900 rounded-lg border border-nebula-800 group-hover:border-purple-500/30 transition-colors">
                                    {getStepIcon(tag)}
                                  </div>
                                  <span className="text-gray-500 group-hover:text-purple-300 transition-colors">{tag}</span>
                              </div>
                          ))}
                      </div>
                      <p className="text-[10px] text-gray-600 mt-space-md px-1 italic text-center font-bold">
                          Drag components onto a pipeline canvas to build your evaluation flow.
                      </p>
                  </div>
                  
                  {/* Create New Button in Sidebar */}
                  <button 
                      onClick={handleNewConfig}
                      className="p-5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-space-sm shadow-2xl transition-all shrink-0 border-t border-white/10"
                  >
                      <Plus size={20} /> Create Pipeline
                  </button>
              </div>

              {/* Main Canvas: List of Tests */}
              <div className="flex-1 flex flex-col min-w-0 bg-transparent overflow-y-auto space-y-space-md pr-2 custom-scrollbar">
                  {savedConfigs.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 border-2 border-dashed border-nebula-800 rounded-3xl bg-nebula-900/20">
                          <Layers size={64} className="mb-6 opacity-5" />
                          <p className="uppercase tracking-[0.3em] font-black text-xs opacity-50">Empty Sandbox</p>
                      </div>
                  )}

                  {savedConfigs.map(config => (
                      <div 
                          key={config.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropOnConfig(e, config.id)}
                          className={`bg-nebula-900 border ${expandedConfigId === config.id ? 'border-purple-500 ring-4 ring-purple-500/5 shadow-2xl' : 'border-nebula-800'} rounded-3xl transition-all overflow-hidden`}
                      >
                          {/* Test Header */}
                          <div 
                              className={`p-6 flex justify-between items-center cursor-pointer transition-colors ${expandedConfigId === config.id ? 'bg-nebula-950/80' : 'hover:bg-nebula-800/50'}`}
                              onClick={() => setExpandedConfigId(expandedConfigId === config.id ? null : config.id)}
                          >
                              <div className="flex items-center gap-6">
                                  <div className={`p-4 rounded-2xl bg-nebula-900 border border-nebula-800 shadow-inner ${expandedConfigId === config.id ? 'text-purple-400' : 'text-gray-600'}`}>
                                      <GitFork size={24} />
                                  </div>
                                  <div>
                                      {expandedConfigId === config.id ? (
                                          <input 
                                              value={config.name}
                                              onChange={(e) => handleUpdateConfig(config.id, { name: e.target.value })}
                                              onClick={(e) => e.stopPropagation()}
                                              className="bg-transparent text-white font-black text-xl uppercase tracking-tight outline-none placeholder-gray-700 w-full"
                                              placeholder="UNTITLED PIPELINE"
                                          />
                                      ) : (
                                          <h3 className="text-lg font-black text-gray-200 uppercase tracking-tight">{config.name}</h3>
                                      )}
                                      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                                          <span className="flex items-center gap-1.5"><Box size={10} /> {config.steps.length} Steps</span>
                                          <span className="opacity-20">•</span>
                                          <span className="flex items-center gap-1.5 truncate max-w-[250px]"><FileText size={10} /> {config.scriptPath || 'No sequence script'}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); }} className="p-3 text-gray-500 hover:text-white hover:bg-nebula-950 rounded-xl transition-all"><Save size={18}/></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteConfig(config.id); }} className="p-3 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all"><Trash2 size={18}/></button>
                                  <div className="ml-4 p-2 bg-nebula-950 rounded-lg">
                                    {expandedConfigId === config.id ? <ChevronDown size={20} className="text-purple-500"/> : <ChevronRight size={20} className="text-gray-600"/>}
                                  </div>
                              </div>
                          </div>

                          {/* Expanded Content */}
                          {expandedConfigId === config.id && (
                              <div className="p-10 border-t border-nebula-800 bg-nebula-950/40 animate-fade-in space-y-12">
                                  
                                  {/* Script Path */}
                                  <div className="space-y-4">
                                      <label className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em] flex items-center gap-3">
                                          <Terminal size={14} className="text-purple-400" /> Pipeline Execution Root
                                      </label>
                                      <div className="flex gap-4">
                                          <input 
                                              type="text" 
                                              value={config.scriptPath || ''}
                                              onChange={(e) => handleUpdateConfig(config.id, { scriptPath: e.target.value })}
                                              className="flex-1 bg-nebula-900 border border-nebula-800 rounded-2xl p-4 text-xs text-gray-300 font-mono placeholder-gray-800 focus:border-purple-500 outline-none shadow-inner"
                                              placeholder="~/research/core_eval_v2.py"
                                          />
                                          <button className="px-6 bg-nebula-900 border border-nebula-800 rounded-2xl hover:bg-nebula-800 text-gray-500 hover:text-white transition-all shadow-sm">
                                              <FolderOpen size={18} />
                                          </button>
                                      </div>
                                  </div>

                                  {/* Hyperparameters - Redesigned */}
                                  <div className="bg-nebula-900/40 p-8 rounded-3xl border border-nebula-800 shadow-inner grid grid-cols-4 gap-12">
                                      <div className="space-y-3">
                                          <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Context Horizon</label>
                                          <input 
                                              type="number" 
                                              value={config.parameters.contextSize} 
                                              onChange={(e) => handleUpdateParameter(config.id, 'contextSize', parseInt(e.target.value))}
                                              className="w-full bg-nebula-950 border border-nebula-800 rounded-xl p-3 text-xs font-black text-white outline-none focus:border-purple-500"
                                          />
                                      </div>
                                      <div className="space-y-3">
                                          <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Sampling Temp</label>
                                          <input 
                                              type="number" step="0.1" 
                                              value={config.parameters.temperature} 
                                              onChange={(e) => handleUpdateParameter(config.id, 'temperature', parseFloat(e.target.value))}
                                              className="w-full bg-nebula-950 border border-nebula-800 rounded-xl p-3 text-xs font-black text-white outline-none focus:border-purple-500"
                                          />
                                      </div>
                                      <div className="flex flex-col justify-end gap-3">
                                          <label className="flex items-center gap-3 cursor-pointer group">
                                              <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    checked={config.parameters.flashAttention} 
                                                    onChange={(e) => handleUpdateParameter(config.id, 'flashAttention', e.target.checked)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-10 h-5 bg-nebula-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                                              </div>
                                              <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 tracking-widest transition-colors">Flash Attn</span>
                                          </label>
                                      </div>
                                      <div className="flex flex-col justify-end gap-3">
                                          <label className="flex items-center gap-3 cursor-pointer group">
                                               <div className="relative">
                                                <input 
                                                    type="checkbox" 
                                                    checked={config.parameters.warmup} 
                                                    onChange={(e) => handleUpdateParameter(config.id, 'warmup', e.target.checked)}
                                                    className="sr-only peer" 
                                                />
                                                <div className="w-10 h-5 bg-nebula-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white"></div>
                                              </div>
                                              <span className="text-[10px] font-black uppercase text-gray-500 group-hover:text-gray-300 tracking-widest transition-colors flex items-center gap-2">Preload <Flame size={12} /></span>
                                          </label>
                                      </div>
                                  </div>

                                  {/* Steps List */}
                                  <div className="space-y-6">
                                      <div className="flex justify-between items-end">
                                          <label className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em] flex items-center gap-3">
                                            <GitBranch size={14} className="text-blue-400" /> Pipeline Sequence
                                          </label>
                                          <span className="text-[9px] text-gray-700 uppercase font-bold italic tracking-widest">Rearrangeable topology</span>
                                      </div>
                                      
                                      <div className="space-y-4 p-8 border-2 border-dashed border-nebula-800/50 rounded-3xl bg-nebula-900/10 shadow-inner min-h-[150px]">
                                          {config.steps.length === 0 && (
                                              <div className="flex items-center justify-center h-full py-12 text-gray-800 text-[10px] font-black uppercase tracking-[0.4em]">
                                                  Drop components here to begin synthesis
                                              </div>
                                          )}
                                          {config.steps.map((step, idx) => (
                                              <div key={step.id} className="relative group/step animate-fade-in">
                                                  {idx > 0 && <div className="absolute -top-4 left-9 w-0.5 h-4 bg-nebula-800/30 z-0"></div>}
                                                  
                                                  <div className="relative z-10 bg-nebula-950 border border-nebula-800 rounded-2xl p-6 hover:border-purple-500/40 transition-all shadow-lg group-hover/step:translate-x-1 transition-transform">
                                                      <div className="flex items-start gap-6">
                                                          <div className="mt-1 p-3 bg-nebula-900 rounded-xl border border-nebula-800 text-gray-500 group-hover/step:text-purple-400 transition-colors">
                                                              {getStepIcon(step.type)}
                                                          </div>
                                                          <div className="flex-1 space-y-5">
                                                              <div className="flex justify-between items-center">
                                                                  <input 
                                                                      value={step.name} 
                                                                      onChange={(e) => updateStepInConfig(config.id, step.id, { name: e.target.value })}
                                                                      className="bg-transparent text-sm font-black text-gray-100 uppercase tracking-tight outline-none w-full"
                                                                  />
                                                                  <div className="flex items-center gap-4">
                                                                      <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-nebula-900 rounded-lg text-gray-600 border border-nebula-800">{step.type}</span>
                                                                      <button onClick={() => removeStepFromConfig(config.id, step.id)} className="text-gray-700 hover:text-red-500 transition-colors"><X size={18}/></button>
                                                                  </div>
                                                              </div>
                                                              
                                                              <div className="flex gap-6">
                                                                  <div className="flex-1">
                                                                      <select 
                                                                          value={step.serverId || ''} 
                                                                          onChange={(e) => updateStepInConfig(config.id, step.id, { serverId: e.target.value })}
                                                                          className="w-full bg-nebula-900 border border-nebula-800 rounded-xl px-4 py-2.5 text-[10px] font-bold text-gray-500 focus:text-gray-100 uppercase tracking-widest outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                                                                      >
                                                                          <option value="">Cluster: Global Default</option>
                                                                          {servers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                                                                      </select>
                                                                  </div>
                                                                  <div className="flex-1">
                                                                      <select 
                                                                          value={step.modelId || ''} 
                                                                          onChange={(e) => updateStepInConfig(config.id, step.id, { modelId: e.target.value })}
                                                                          className="w-full bg-nebula-900 border border-nebula-800 rounded-xl px-4 py-2.5 text-[10px] font-bold text-gray-500 focus:text-gray-100 uppercase tracking-widest outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                                                                      >
                                                                          <option value="">Model: Inheritance</option>
                                                                          {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                                                      </select>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      </div>
                                                      
                                                      {/* Specific Step Configs */}
                                                      {renderStepConfigFields(step, config.id)}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>

                                  <div className="flex justify-end pt-6">
                                      <button className="px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl flex items-center gap-4 shadow-2xl transition-all hover:scale-[1.02] border-t border-white/10 active:scale-95">
                                          <Play size={18} fill="currentColor" /> Initialize Run
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
