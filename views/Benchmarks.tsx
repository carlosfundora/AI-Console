
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { BenchmarkResult, Model, AdvancedBenchmarkConfig, BenchmarkStep, BenchmarkStepType, MockDataSource, ServerProfile } from '../types';
import { Play, Settings2, MessageSquare, Database, Binary, FileText, Wrench, Search, ChevronDown, ChevronRight, X, ArrowRight, Loader2, File, Code, Table, Plus, Trash2, Expand, Clock, Info, Layers, GripVertical, Save, FolderOpen, Flame, Box, Server, Edit2, GitFork, ScanSearch, Filter, Tag, ListChecks, CheckCircle2, Zap, ChevronLeft, LayoutDashboard, History, FileStack, ArrowUp, ArrowDown, Calendar, Cpu } from 'lucide-react';

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

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

export const Benchmarks: React.FC<BenchmarksProps> = ({ results, models, servers }) => {
  const [activeView, setActiveView] = useState<'overview' | 'history' | 'config' | 'mock_data'>('overview');
  const [savedConfigs, setSavedConfigs] = useState<AdvancedBenchmarkConfig[]>(MOCK_SAVED_CONFIGS);
  
  // Data Management State
  const [mockData, setMockData] = useState<MockDataSource[]>(INITIAL_MOCK_DATA);

  // Detail Modal State
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null);
  
  // Test Editor State
  const [expandedConfigId, setExpandedConfigId] = useState<string | null>(null);
  const [draggingTag, setDraggingTag] = useState<BenchmarkStepType | null>(null);

  // Overview Carousel State
  const [slideIndex, setSlideIndex] = useState(0);

  // Trend Filters
  const [trendModelFilter, setTrendModelFilter] = useState<string[]>([]); 
  const [trendDatasetFilter, setTrendDatasetFilter] = useState<string>('All');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: keyof BenchmarkResult; direction: 'asc' | 'desc' } | null>(null);

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

  const nextSlide = () => setSlideIndex((prev) => (prev + 1) % 3);
  const prevSlide = () => setSlideIndex((prev) => (prev - 1 + 3) % 3);

  // --- Sorting Logic ---
  const handleSort = (key: keyof BenchmarkResult) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedResults = useMemo(() => {
      if (!sortConfig) return results;
      return [...results].sort((a, b) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];

          if (aValue === undefined && bValue === undefined) return 0;
          if (aValue === undefined) return 1;
          if (bValue === undefined) return -1;

          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [results, sortConfig]);

  const renderSortIcon = (key: keyof BenchmarkResult) => {
      if (sortConfig?.key !== key) return <div className="w-3 h-3" />; // spacer
      return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-purple-400" /> : <ArrowDown size={12} className="text-purple-400" />;
  };

  // --- Data Processing for Visualizations ---

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

  const modelAggregatedStats = useMemo(() => {
      const stats: Record<string, { tps: number, score: number, count: number }> = {};
      results.forEach(r => {
          if (!stats[r.modelId]) stats[r.modelId] = { tps: 0, score: 0, count: 0 };
          stats[r.modelId].tps += r.tokensPerSecond || 0;
          stats[r.modelId].score += r.score;
          stats[r.modelId].count++;
      });
      return Object.keys(stats).map(k => ({
          name: k,
          tps: stats[k].tps / stats[k].count,
          score: stats[k].score / stats[k].count
      }));
  }, [results]);

  const categoryStats = useMemo(() => {
      const stats: Record<string, { count: number, avgScore: number }> = {};
      results.forEach(r => {
          const type = r.type || 'Unknown';
          if (!stats[type]) stats[type] = { count: 0, avgScore: 0 };
          stats[type].count++;
          stats[type].avgScore += r.score;
      });
      return Object.keys(stats).map(k => ({
          subject: k,
          A: stats[k].avgScore / stats[k].count,
          fullMark: 100
      }));
  }, [results]);

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

  // --- Drag and Drop ---

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

      if (step.type === 'Generation') {
          return (
              <div className="space-y-space-md pt-2">
                  <div className="bg-nebula-900/50 p-space-sm rounded border border-nebula-800 space-y-space-sm">
                      <div>
                          <label className="text-type-tiny uppercase font-bold text-blue-400 block mb-1">Evaluation Metric</label>
                          <select 
                            value={step.config.metric || 'Throughput'} 
                            onChange={(e) => updateConfig({ metric: e.target.value })}
                            className="w-full bg-nebula-950 border border-nebula-700 rounded p-space-xs text-type-caption text-gray-300 focus:border-purple-500 outline-none"
                          >
                              <option value="Throughput">Throughput (Tokens/s)</option>
                              <option value="Latency">Latency (TTFT)</option>
                              <option value="ROUGE-L">ROUGE-L (Summarization)</option>
                              <option value="BLEU">BLEU (Translation)</option>
                              <option value="METEOR">METEOR</option>
                              <option value="ExactMatch">Exact Match</option>
                          </select>
                      </div>
                  </div>
              </div>
          );
      }

      return null;
  };

  const renderMockDataView = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg animate-fade-in h-full overflow-hidden pb-4">
          <div className="bg-nebula-900 border border-nebula-700 rounded p-space-md flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-space-md border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-space-sm"><FileText size={16} className="text-blue-400" /> Documents (PDF/HTML)</h3>
                  <button onClick={() => addMockData('PDF')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-space-sm">
                  {mockData.filter(m => m.type === 'PDF').map(m => (
                      <div key={m.id} className="p-space-sm bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors">
                          <div>
                              <div className="text-type-body text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-type-tiny text-gray-500">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-nebula-900 border border-nebula-700 rounded p-space-md flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-space-md border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-space-sm"><Code size={16} className="text-green-400" /> Prompts (Txt/Json)</h3>
                  <button onClick={() => addMockData('Prompt')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-space-sm">
                  {mockData.filter(m => m.type === 'Prompt').map(m => (
                      <div key={m.id} className="p-space-sm bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors">
                          <div>
                              <div className="text-type-body text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-type-tiny text-gray-500">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-nebula-900 border border-nebula-700 rounded p-space-md flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-center mb-space-md border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-space-sm"><Table size={16} className="text-orange-400" /> Structured (SQL/CSV)</h3>
                  <button onClick={() => addMockData('SQL')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-space-sm">
                  {mockData.filter(m => m.type === 'SQL').map(m => (
                      <div key={m.id} className="p-space-sm bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors">
                          <div>
                              <div className="text-type-body text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-type-tiny text-gray-500">{m.size} • {m.date}</div>
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
        <h2 className="text-type-heading-lg font-bold">📊 Benchmarks & Analytics</h2>
        <div className="flex bg-nebula-900 rounded p-1 border border-nebula-700">
             <button 
                onClick={() => setActiveView('overview')}
                className={`px-3 py-1.5 rounded text-type-caption transition-all flex items-center gap-2 ${activeView === 'overview' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <LayoutDashboard size={14} /> Overview
            </button>
            <button 
                onClick={() => setActiveView('history')}
                className={`px-3 py-1.5 rounded text-type-caption transition-all flex items-center gap-2 ${activeView === 'history' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                <History size={14} /> History
            </button>
            <button 
                onClick={() => setActiveView('mock_data')}
                className={`px-3 py-1.5 rounded text-type-caption transition-all flex items-center gap-2 ${activeView === 'mock_data' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                 <FileStack size={14} /> Mock Data
            </button>
            <button 
                onClick={() => setActiveView('config')}
                className={`px-3 py-1.5 rounded text-type-caption transition-all flex items-center gap-2 ${activeView === 'config' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
                 <Settings2 size={14} /> Tests
            </button>
        </div>
      </div>

      {activeView === 'overview' && (
         <div className="flex-1 overflow-hidden relative animate-fade-in group">
             {/* Carousel Controls */}
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

            {/* Slide 0: Model Comparison (Styled) */}
            {slideIndex === 0 && (
                <div className="h-full bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-space-xl flex flex-col animate-fade-in shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    <h3 className="text-type-heading-md font-bold mb-space-lg flex items-center gap-space-sm text-white">
                        <Zap size={20} className="text-yellow-500" /> Model Performance Comparison
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={modelAggregatedStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left" stroke="#8b5cf6" fontSize={12} orientation="left" tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" stroke="#10b981" fontSize={12} orientation="right" tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{ backgroundColor: '#121217', borderColor: '#272730' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="tps" name="Throughput (t/s)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} fillOpacity={0.6} />
                                <Bar yAxisId="right" dataKey="score" name="Avg Score" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} fillOpacity={0.6} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Slide 1: Historical Trends (Styled) */}
            {slideIndex === 1 && (
                <div className="h-full bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-space-xl flex flex-col animate-fade-in relative shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <div className="flex justify-between items-center mb-space-lg">
                        <h3 className="text-type-heading-md font-bold flex items-center gap-space-sm text-white">
                            <Clock size={20} className="text-blue-500" /> Latency Trends Over Time
                        </h3>
                        {/* Inline Filters for Trend View */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 uppercase font-bold">Filter:</span>
                            {availableModels.slice(0,3).map((m, i) => (
                                <button 
                                    key={m}
                                    onClick={() => toggleModelFilter(m)}
                                    className={`px-2 py-1 rounded text-[10px] border transition-all ${
                                        trendModelFilter.includes(m) 
                                        ? 'bg-blue-900/30 border-blue-500 text-blue-200' 
                                        : 'bg-nebula-950 border-nebula-800 text-gray-500'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={processedTrendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#121217', borderColor: '#272730' }} />
                                <Legend />
                                {trendModelFilter.map((modelId, i) => (
                                    <Line 
                                        key={modelId}
                                        type="monotone" 
                                        dataKey={`${modelId}_lat`} 
                                        stroke={COLORS[i % COLORS.length]} 
                                        strokeWidth={3} 
                                        dot={{ r: 4 }} 
                                        activeDot={{ r: 6 }} 
                                        name={modelId}
                                        connectNulls
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Slide 2: Category Analysis (Styled) */}
            {slideIndex === 2 && (
                <div className="h-full bg-gradient-to-b from-nebula-900 to-nebula-950 border border-white/5 rounded-xl p-space-xl flex flex-col animate-fade-in shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                    <h3 className="text-type-heading-md font-bold mb-space-lg flex items-center gap-space-sm text-white">
                        <ScanSearch size={20} className="text-green-500" /> Quality by Category
                    </h3>
                    <div className="flex-1 min-h-0 flex justify-center items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={categoryStats}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Avg Score"
                                    dataKey="A"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fill="#10b981"
                                    fillOpacity={0.3}
                                />
                                <Tooltip contentStyle={{ backgroundColor: '#121217', borderColor: '#272730' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                {[0, 1, 2].map(i => (
                    <button 
                        key={i} 
                        onClick={() => setSlideIndex(i)}
                        className={`h-2 rounded-full transition-all duration-300 ${slideIndex === i ? 'bg-purple-600 w-8 shadow-[0_0_10px_#8b5cf6]' : 'bg-gray-700 w-2 hover:bg-gray-600'}`}
                    ></button>
                ))}
            </div>
         </div>
      )}

      {activeView === 'history' && (
        <div className="space-y-space-lg animate-fade-in flex-1 overflow-y-auto">
            <div className="overflow-x-auto rounded border border-nebula-800">
              <table className="w-full text-left bg-nebula-900">
                <thead className="bg-nebula-950 text-gray-400 uppercase text-type-caption font-bold sticky top-0 z-10">
                  <tr>
                    <th className="px-space-lg py-space-md cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('modelId')}>
                        <div className="flex items-center gap-1">Model {renderSortIcon('modelId')}</div>
                    </th>
                    <th className="px-space-lg py-space-md cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('versionId')}>
                        <div className="flex items-center gap-1">Version {renderSortIcon('versionId')}</div>
                    </th>
                    <th className="px-space-lg py-space-md cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('dataset')}>
                        <div className="flex items-center gap-1">Dataset {renderSortIcon('dataset')}</div>
                    </th>
                    <th className="px-space-lg py-space-md cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('metric')}>
                        <div className="flex items-center gap-1">Metric {renderSortIcon('metric')}</div>
                    </th>
                    <th className="px-space-lg py-space-md text-right cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('score')}>
                        <div className="flex items-center gap-1 justify-end">Score {renderSortIcon('score')}</div>
                    </th>
                    <th className="px-space-lg py-space-md text-right cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('tokensPerSecond')}>
                        <div className="flex items-center gap-1 justify-end">Tokens/s {renderSortIcon('tokensPerSecond')}</div>
                    </th>
                    <th className="px-space-lg py-space-md text-right cursor-pointer hover:bg-nebula-800/50 transition-colors" onClick={() => handleSort('latency')}>
                        <div className="flex items-center gap-1 justify-end">Latency {renderSortIcon('latency')}</div>
                    </th>
                    <th className="px-space-lg py-space-md"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nebula-800">
                  {sortedResults.map((row) => (
                    <tr 
                        key={row.id} 
                        onClick={() => setSelectedResult(row)}
                        className="hover:bg-nebula-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-space-lg py-space-md font-medium text-white">{row.modelId}</td>
                      <td className="px-space-lg py-space-md text-gray-400">{row.versionId}</td>
                      <td className="px-space-lg py-space-md text-gray-400">{row.dataset}</td>
                      <td className="px-space-lg py-space-md text-gray-400">{row.metric}</td>
                      <td className="px-space-lg py-space-md text-right text-green-400 font-mono font-bold">{row.score}</td>
                      <td className="px-space-lg py-space-md text-right text-blue-400 font-mono font-bold">{row.tokensPerSecond?.toFixed(2) || '-'}</td>
                      <td className="px-space-lg py-space-md text-right text-purple-400 font-mono font-bold">{row.latency}ms</td>
                      <td className="px-space-lg py-space-md text-right">
                          <Expand size={16} className="text-gray-600 group-hover:text-white" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

      {/* Result Detail Modal - Refined */}
      {selectedResult && (
          <div className="absolute inset-0 bg-nebula-950/95 backdrop-blur-md z-50 flex items-center justify-center p-space-lg animate-fade-in" onClick={() => setSelectedResult(null)}>
              <div 
                className="bg-nebula-900 border border-nebula-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                  {/* Modal Header */}
                  <div className="p-6 border-b border-nebula-700 flex justify-between items-start bg-nebula-950/80 backdrop-blur-md sticky top-0 z-10">
                      <div>
                          <div className="flex items-center gap-space-md mb-2">
                              <span className="text-[10px] uppercase font-black tracking-widest text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded bg-purple-900/10">{selectedResult.type} Benchmark</span>
                              <span className="text-[10px] text-gray-500 font-mono">{selectedResult.id}</span>
                          </div>
                          <h2 className="text-2xl font-black text-white tracking-tight">{selectedResult.modelId}</h2>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span className="flex items-center gap-1"><Binary size={12} className="text-blue-400"/> {selectedResult.versionId}</span>
                              <span className="flex items-center gap-1"><Database size={12} className="text-orange-400"/> {selectedResult.dataset}</span>
                          </div>
                      </div>
                      <button onClick={() => setSelectedResult(null)} className="p-2 bg-nebula-950 border border-nebula-800 rounded-lg text-gray-400 hover:text-white transition-colors hover:border-purple-500/50">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-gradient-to-b from-nebula-900 to-nebula-950">
                      {/* Primary Metrics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
                              <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                              <div className="relative z-10">
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">{selectedResult.metric}</div>
                                <div className="text-5xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">{selectedResult.score}</div>
                              </div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
                              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                              <div className="relative z-10">
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Throughput</div>
                                <div className="text-5xl font-black text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                                    {selectedResult.tokensPerSecond ? selectedResult.tokensPerSecond.toFixed(1) : '-'} <span className="text-lg font-bold text-gray-600">t/s</span>
                                </div>
                              </div>
                          </div>
                          <div className="bg-nebula-950 border border-nebula-800 p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden group">
                              <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                              <div className="relative z-10">
                                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Latency</div>
                                <div className="text-5xl font-black text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                                    {selectedResult.latency} <span className="text-lg font-bold text-gray-600">ms</span>
                                </div>
                              </div>
                          </div>
                      </div>

                      {/* Config & Notes Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-nebula-950/50 p-6 rounded-xl border border-nebula-800">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <Cpu size={14} className="text-yellow-500" /> Environment Details
                              </h4>
                              <div className="space-y-3">
                                  <div className="flex justify-between items-center pb-2 border-b border-nebula-800/50">
                                      <span className="text-sm text-gray-500">Hardware</span>
                                      <span className="text-sm font-mono text-gray-200">{selectedResult.hardwareName}</span>
                                  </div>
                                  <div className="flex justify-between items-center pb-2 border-b border-nebula-800/50">
                                      <span className="text-sm text-gray-500">Acceleration</span>
                                      <span className="text-sm font-mono text-gray-200">{selectedResult.hardware}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-500">Date</span>
                                      <span className="text-sm font-mono text-gray-200 flex items-center gap-2"><Calendar size={12}/> {selectedResult.date}</span>
                                  </div>
                              </div>
                          </div>

                          <div className="bg-nebula-950/50 p-6 rounded-xl border border-nebula-800">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                  <FileText size={14} className="text-blue-500" /> Execution Notes
                              </h4>
                              <p className="text-sm text-gray-300 leading-relaxed italic bg-nebula-900 p-3 rounded border border-nebula-800">
                                  "{selectedResult.notes || "No additional notes provided for this benchmark run."}"
                              </p>
                          </div>
                      </div>

                      {/* Detailed Segments / Pipeline Steps */}
                      {selectedResult.segments && selectedResult.segments.length > 0 ? (
                          <div className="space-y-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-space-sm">
                                  <Layers size={20} className="text-purple-500"/> Pipeline Execution Breakdown
                              </h3>
                              <div className="bg-nebula-950 rounded-xl border border-nebula-800 overflow-hidden shadow-md">
                                  <div className="grid grid-cols-12 gap-4 p-4 bg-nebula-900/80 border-b border-nebula-800 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                      <div className="col-span-4">Step Name</div>
                                      <div className="col-span-3">Type</div>
                                      <div className="col-span-2 text-right">Duration</div>
                                      <div className="col-span-3 text-right">Relative Impact</div>
                                  </div>
                                  <div className="divide-y divide-nebula-800/50">
                                      {selectedResult.segments.map((seg, idx) => (
                                          <div key={idx} className="grid grid-cols-12 gap-4 p-4 hover:bg-white/5 transition-colors items-center group">
                                              <div className="col-span-4 font-bold text-gray-200 text-sm">{seg.stepName}</div>
                                              <div className="col-span-3">
                                                  <span className="text-[10px] font-bold px-2 py-1 bg-nebula-900 rounded border border-nebula-800 text-gray-400 flex items-center gap-2 w-fit">
                                                      {getStepIcon(seg.type)} {seg.type}
                                                  </span>
                                              </div>
                                              <div className="col-span-2 text-right font-mono text-purple-300 text-sm">{seg.duration}ms</div>
                                              <div className="col-span-3 flex items-center gap-3">
                                                  <div className="flex-1 h-2 bg-nebula-900 rounded-full overflow-hidden border border-white/5">
                                                      <div 
                                                        className={`h-full rounded-full ${
                                                            seg.duration / selectedResult.latency > 0.5 ? 'bg-red-500' : 
                                                            seg.duration / selectedResult.latency > 0.2 ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                        style={{ width: `${Math.max(5, (seg.duration / selectedResult.latency) * 100)}%` }}
                                                      ></div>
                                                  </div>
                                                  <span className="text-[10px] font-bold text-gray-500 w-10 text-right">{((seg.duration / selectedResult.latency) * 100).toFixed(0)}%</span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="p-8 bg-nebula-950/30 border border-nebula-800 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-500">
                              <Info size={32} className="mb-3 opacity-30" />
                              <p className="text-sm font-bold uppercase tracking-widest opacity-60">No Segment Data Available</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeView === 'mock_data' && renderMockDataView()}

      {activeView === 'config' && (
          <div className="flex flex-1 min-h-0 gap-space-lg animate-fade-in overflow-hidden">
              {/* Left Sidebar: Tag Palette */}
              <div className="w-64 flex flex-col gap-space-md shrink-0">
                  <div className="p-space-md bg-nebula-900 border border-nebula-700 rounded h-full flex flex-col">
                      <h3 className="text-type-caption font-bold text-gray-300 mb-space-md uppercase tracking-wider">Components</h3>
                      <div className="space-y-space-sm flex-1 overflow-y-auto pr-2">
                          {(['Custom', 'Retrieval', 'Embedding', 'Tool Calling', 'Generation', 'ColBERT', 'Extraction', 'Routing', 'Classification'] as BenchmarkStepType[]).map(tag => (
                              <div
                                  key={tag}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, tag)}
                                  className="w-full flex items-center gap-space-sm p-space-sm bg-nebula-950 border border-nebula-800 rounded hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-type-caption group text-left cursor-grab text-gray-400 hover:text-white"
                              >
                                  {getStepIcon(tag)}
                                  <span>{tag}</span>
                              </div>
                          ))}
                      </div>
                      <p className="text-type-tiny text-gray-500 mt-space-md px-1 text-center">Drag onto tests to pipeline</p>
                  </div>
                  <button 
                      onClick={handleNewConfig}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold flex items-center justify-center gap-space-sm shadow-lg transition-all"
                  >
                      <Plus size={18} /> New Test
                  </button>
              </div>

              {/* Canvas */}
              <div className="flex-1 overflow-y-auto space-y-space-md pr-2 custom-scrollbar">
                  {savedConfigs.map(config => (
                      <div 
                          key={config.id}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropOnConfig(e, config.id)}
                          className={`bg-nebula-900 border ${expandedConfigId === config.id ? 'border-purple-500 ring-1 ring-purple-500/30' : 'border-nebula-700'} rounded transition-all overflow-hidden`}
                      >
                          <div 
                              className="p-space-md flex justify-between items-center cursor-pointer hover:bg-nebula-800/30"
                              onClick={() => setExpandedConfigId(expandedConfigId === config.id ? null : config.id)}
                          >
                              <div className="flex items-center gap-space-md">
                                  <div className="p-2 rounded bg-nebula-950 border border-nebula-800 text-purple-400">
                                      <Settings2 size={20} />
                                  </div>
                                  <div>
                                      <h3 className="font-bold text-gray-200">{config.name}</h3>
                                      <div className="flex gap-space-sm text-type-tiny text-gray-500 mt-0.5">
                                          <span>{config.backend}</span>
                                          <span>•</span>
                                          <span>{config.steps.length} steps</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-space-sm">
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteConfig(config.id); }} className="p-1.5 hover:bg-red-900/30 rounded text-gray-400 hover:text-red-400"><Trash2 size={16}/></button>
                                  {expandedConfigId === config.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                              </div>
                          </div>

                          {expandedConfigId === config.id && (
                              <div className="p-space-md border-t border-nebula-800 space-y-space-lg animate-fade-in bg-nebula-950/20">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
                                      <div className="space-y-space-md">
                                           <div>
                                              <label className="text-type-tiny text-gray-500 uppercase font-bold">Pipeline Name</label>
                                              <input 
                                                  value={config.name} 
                                                  onChange={(e) => handleUpdateConfig(config.id, { name: e.target.value })}
                                                  className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white mt-1" 
                                              />
                                          </div>
                                          <div>
                                              <label className="text-type-tiny text-gray-500 uppercase font-bold">Execution Script</label>
                                              <div className="flex gap-space-sm mt-1">
                                                  <input 
                                                      value={config.scriptPath || ''} 
                                                      onChange={(e) => handleUpdateConfig(config.id, { scriptPath: e.target.value })}
                                                      className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-2 text-gray-300 font-mono text-xs" 
                                                      placeholder="./scripts/custom_test.py"
                                                  />
                                                  <button className="p-2 bg-nebula-800 border border-nebula-700 rounded text-gray-400"><FolderOpen size={16}/></button>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-space-md">
                                          <div>
                                              <label className="text-type-tiny text-gray-500 uppercase font-bold">Context</label>
                                              <input 
                                                  type="number" 
                                                  value={config.parameters.contextSize} 
                                                  onChange={(e) => handleUpdateParameter(config.id, 'contextSize', parseInt(e.target.value))}
                                                  className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white mt-1" 
                                              />
                                          </div>
                                          <div>
                                              <label className="text-type-tiny text-gray-500 uppercase font-bold">Temp</label>
                                              <input 
                                                  type="number" step="0.1" 
                                                  value={config.parameters.temperature} 
                                                  onChange={(e) => handleUpdateParameter(config.id, 'temperature', parseFloat(e.target.value))}
                                                  className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white mt-1" 
                                              />
                                          </div>
                                          
                                          {/* NEW: GPU Layers */}
                                          <div>
                                              <label className="text-type-tiny text-gray-500 uppercase font-bold">GPU Layers</label>
                                              <input 
                                                  type="number" 
                                                  value={config.parameters.gpuLayers ?? 99} 
                                                  onChange={(e) => handleUpdateParameter(config.id, 'gpuLayers', parseInt(e.target.value))}
                                                  className="w-full bg-nebula-900 border border-nebula-700 rounded p-2 text-white mt-1" 
                                              />
                                          </div>

                                          {/* Expanded Toggles Grid */}
                                          <div className="col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                              <div className="flex items-center gap-space-sm">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={config.parameters.flashAttention} 
                                                      onChange={(e) => handleUpdateParameter(config.id, 'flashAttention', e.target.checked)}
                                                      className="accent-purple-500" 
                                                  />
                                                  <label className="text-type-caption text-gray-400">Flash Attn</label>
                                              </div>
                                              <div className="flex items-center gap-space-sm">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={config.parameters.warmup} 
                                                      onChange={(e) => handleUpdateParameter(config.id, 'warmup', e.target.checked)}
                                                      className="accent-purple-500" 
                                                  />
                                                  <label className="text-type-caption text-gray-400 flex items-center gap-1"><Flame size={12} className="text-orange-500"/> Warmup</label>
                                              </div>
                                              <div className="flex items-center gap-space-sm">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={config.parameters.memoryLock} 
                                                      onChange={(e) => handleUpdateParameter(config.id, 'memoryLock', e.target.checked)}
                                                      className="accent-purple-500" 
                                                  />
                                                  <label className="text-type-caption text-gray-400">Memory Lock</label>
                                              </div>
                                              <div className="flex items-center gap-space-sm">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={config.parameters.continuousBatching} 
                                                      onChange={(e) => handleUpdateParameter(config.id, 'continuousBatching', e.target.checked)}
                                                      className="accent-purple-500" 
                                                  />
                                                  <label className="text-type-caption text-gray-400">Cont. Batching</label>
                                              </div>
                                              <div className="flex items-center gap-space-sm">
                                                  <input 
                                                      type="checkbox" 
                                                      checked={!!config.parameters.keepAlive} 
                                                      onChange={(e) => handleUpdateParameter(config.id, 'keepAlive', e.target.checked ? '5m' : undefined)}
                                                      className="accent-purple-500" 
                                                  />
                                                  <label className="text-type-caption text-gray-400">Keep Alive</label>
                                              </div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="space-y-space-sm">
                                      <label className="text-type-tiny text-gray-500 uppercase font-bold">Execution Segments</label>
                                      <div className="min-h-[120px] bg-nebula-900/50 border-2 border-dashed border-nebula-800 rounded-lg p-space-md space-y-space-sm">
                                          {config.steps.length === 0 && <div className="text-center text-gray-600 py-6">Drag and drop components here</div>}
                                          {config.steps.map((step, idx) => (
                                              <div key={step.id} className="bg-nebula-950 border border-nebula-800 rounded-lg p-space-sm flex items-start gap-space-md animate-fade-in group">
                                                  <div className="p-2 bg-nebula-900 rounded border border-nebula-800 text-gray-400">
                                                      {getStepIcon(step.type)}
                                                  </div>
                                                  <div className="flex-1 space-y-space-sm">
                                                      <div className="flex justify-between items-center">
                                                          <input 
                                                              value={step.name} 
                                                              onChange={(e) => updateStepInConfig(config.id, step.id, { name: e.target.value })}
                                                              className="bg-transparent text-type-body font-bold text-white outline-none"
                                                          />
                                                          <div className="flex gap-space-sm">
                                                              <span className="text-type-tiny px-2 py-0.5 bg-nebula-900 rounded text-gray-500 border border-nebula-800">{step.type}</span>
                                                              <button onClick={() => removeStepFromConfig(config.id, step.id)} className="text-gray-600 hover:text-red-400"><X size={14}/></button>
                                                          </div>
                                                      </div>
                                                      {renderStepConfigFields(step, config.id)}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                                  
                                  <div className="flex justify-end pt-2">
                                      <button className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-sm flex items-center gap-2 shadow-lg">
                                          <Play size={14} fill="currentColor" /> Run Simulation
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
