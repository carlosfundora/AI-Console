
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { BenchmarkResult, Model, AdvancedBenchmarkConfig, BenchmarkStep, BenchmarkStepType, MockDataSource, ServerProfile } from '../types';
import { Play, Settings2, MessageSquare, Database, Binary, FileText, Wrench, Search, ChevronDown, ChevronRight, X, ArrowRight, Loader2, File, Code, Table, Plus, Trash2, Expand, Clock, Info, Layers, GripVertical, Save, FolderOpen, Flame, Box, Server } from 'lucide-react';

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
        parameters: { contextSize: 8192, temperature: 0.1, flashAttention: true, memoryLock: true, gpuLayers: 99, continuousBatching: false, warmup: true },
        steps: [
            { id: 's1', type: 'Ingestion', name: 'Parse PDFs', enabled: true, config: { docType: 'PDF', chunkSize: 512 } },
            { id: 's2', type: 'Phase', name: 'Retrieval Phase', enabled: true, config: {}, substeps: [
                { id: 's2-1', type: 'Embedding', name: 'HyDE Gen', enabled: true, modelId: 'snowflake-arctic', config: {} },
                { id: 's2-2', type: 'RAG', name: 'Vector Search', enabled: true, config: { rerankTopK: 10 } }
            ]},
            { id: 's3', type: 'Generation', name: 'Answer Query', enabled: true, config: { metric: 'Throughput' } }
        ]
    }
];

const INITIAL_MOCK_DATA: MockDataSource[] = [
    { id: 'm1', name: 'Contract_Law_101.pdf', type: 'PDF', size: '4.2 MB', date: '2025-12-01', path: '/data/docs/Contract_Law_101.pdf' },
    { id: 'm2', name: 'Nvidia_10K_2025.pdf', type: 'PDF', size: '12.8 MB', date: '2026-01-10', path: '/data/docs/Nvidia_10K.pdf' },
    { id: 'm3', name: 'System_Prompts_v2.txt', type: 'Prompt', size: '12 KB', date: '2026-01-15', path: '/data/prompts/sys_v2.txt' },
    { id: 'm4', name: 'Customer_Support_Q4.sql', type: 'SQL', size: '450 MB', date: '2026-01-18', path: '/data/sql/cust_q4.db' },
];

export const Benchmarks: React.FC<BenchmarksProps> = ({ results, models, servers }) => {
  const [activeView, setActiveView] = useState<'matrix' | 'trends' | 'config' | 'data'>('matrix');
  const [currentConfig, setCurrentConfig] = useState<AdvancedBenchmarkConfig>(DEFAULT_ADV_CONFIG);
  const [savedConfigs, setSavedConfigs] = useState<AdvancedBenchmarkConfig[]>(MOCK_SAVED_CONFIGS);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  
  // Data Management State
  const [mockData, setMockData] = useState<MockDataSource[]>(INITIAL_MOCK_DATA);

  // Detail Modal State
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null);
  
  // Drag and Drop State
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Prepare Data for Charts
  const trendData = results
    .filter(r => r.tokensPerSecond || r.latency)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const addStep = (type: BenchmarkStepType, parentId?: string) => {
      const newStep: BenchmarkStep = {
          id: `step-${Date.now()}`,
          type,
          name: `New ${type} ${parentId ? 'Sub-step' : 'Step'}`,
          enabled: true,
          substeps: type === 'Phase' ? [] : undefined,
          config: {
              metric: 'Throughput',
              chunkSize: 512,
              overlap: 50,
          }
      };

      if (parentId) {
          // Add as substep
          setCurrentConfig({
              ...currentConfig,
              steps: currentConfig.steps.map(s => {
                  if (s.id === parentId && s.substeps) {
                      return { ...s, substeps: [...s.substeps, newStep] };
                  }
                  return s;
              })
          });
      } else {
          // Add as root step
          setCurrentConfig({ ...currentConfig, steps: [...currentConfig.steps, newStep] });
      }
      
      setExpandedStepId(newStep.id);
  };

  const updateStep = (id: string, updates: Partial<BenchmarkStep>) => {
      const updateRecursive = (steps: BenchmarkStep[]): BenchmarkStep[] => {
          return steps.map(s => {
              if (s.id === id) return { ...s, ...updates };
              if (s.substeps) return { ...s, substeps: updateRecursive(s.substeps) };
              return s;
          });
      };
      
      setCurrentConfig({
          ...currentConfig,
          steps: updateRecursive(currentConfig.steps)
      });
  };
  
  const updateStepConfig = (id: string, configUpdates: any) => {
      const updateRecursive = (steps: BenchmarkStep[]): BenchmarkStep[] => {
          return steps.map(s => {
              if (s.id === id) return { ...s, config: { ...s.config, ...configUpdates } };
              if (s.substeps) return { ...s, substeps: updateRecursive(s.substeps) };
              return s;
          });
      };

      setCurrentConfig({
          ...currentConfig,
          steps: updateRecursive(currentConfig.steps)
      });
  };

  const removeStep = (id: string) => {
      const removeRecursive = (steps: BenchmarkStep[]): BenchmarkStep[] => {
          return steps.filter(s => s.id !== id).map(s => ({
              ...s,
              substeps: s.substeps ? removeRecursive(s.substeps) : undefined
          }));
      };

      setCurrentConfig({
          ...currentConfig,
          steps: removeRecursive(currentConfig.steps)
      });
  };

  // Global Config Updates
  const updateParameter = (key: keyof AdvancedBenchmarkConfig['parameters'], value: any) => {
      setCurrentConfig({
          ...currentConfig,
          parameters: {
              ...currentConfig.parameters,
              [key]: value
          }
      });
  };

  const handleSaveConfig = () => {
      if (currentConfig.id === 'new-config' || !currentConfig.id) {
          const newId = `cfg-${Date.now()}`;
          const newConfig = { ...currentConfig, id: newId };
          setSavedConfigs([...savedConfigs, newConfig]);
          setCurrentConfig(newConfig);
      } else {
          setSavedConfigs(savedConfigs.map(c => c.id === currentConfig.id ? currentConfig : c));
      }
  };

  const handleLoadConfig = (config: AdvancedBenchmarkConfig) => {
      // Deep copy to prevent reference issues
      setCurrentConfig(JSON.parse(JSON.stringify(config)));
      setShowLoadMenu(false);
  };

  const handleNewConfig = () => {
      setCurrentConfig({
          ...DEFAULT_ADV_CONFIG,
          id: 'new-config',
          parameters: { ...DEFAULT_ADV_CONFIG.parameters },
          steps: []
      });
  };

  // Drag and Drop only supported for top-level steps for now to maintain stability
  const handleDragStart = (e: React.DragEvent, index: number) => {
      setDraggedStepIndex(index);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedStepIndex === null || draggedStepIndex === index) return;
      
      const newSteps = [...currentConfig.steps];
      const draggedItem = newSteps[draggedStepIndex];
      newSteps.splice(draggedStepIndex, 1);
      newSteps.splice(index, 0, draggedItem);
      
      setCurrentConfig({ ...currentConfig, steps: newSteps });
      setDraggedStepIndex(index);
  };

  const handleDrop = () => {
      setDraggedStepIndex(null);
  };

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
          case 'RAG': return <Database size={16} className="text-purple-400"/>;
          case 'Embedding': return <Binary size={16} className="text-green-400"/>;
          case 'Ingestion': return <FileText size={16} className="text-yellow-400"/>;
          case 'ToolUse': return <Wrench size={16} className="text-orange-400"/>;
          case 'ColBERT': return <Search size={16} className="text-red-400"/>;
          case 'Phase': return <Layers size={16} className="text-gray-300"/>;
      }
  };

  const renderStepConfig = (step: BenchmarkStep) => {
      return (
          <div className="space-y-4">
              {/* Common Server/Model Override */}
              <div className="grid grid-cols-2 gap-4 bg-nebula-950/50 p-3 rounded border border-nebula-800">
                  <div>
                      <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><Server size={10}/> Server Override</label>
                      <select 
                        value={step.serverId || ''} 
                        onChange={(e) => updateStep(step.id, { serverId: e.target.value })}
                        className="w-full bg-nebula-900 border border-nebula-800 rounded p-2 text-sm mt-1 text-gray-300"
                      >
                          <option value="">Default (Global)</option>
                          {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                  </div>
                   <div>
                      <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-1"><Box size={10}/> Model Override</label>
                      <select 
                        value={step.modelId || ''} 
                        onChange={(e) => updateStep(step.id, { modelId: e.target.value })}
                        className="w-full bg-nebula-900 border border-nebula-800 rounded p-2 text-sm mt-1 text-gray-300"
                      >
                          <option value="">Default (Global)</option>
                          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                  </div>
              </div>

              {step.type === 'Phase' && (
                  <div className="space-y-2">
                       <label className="text-xs text-gray-500 uppercase font-bold">Sub-steps</label>
                       <div className="space-y-2 pl-2 border-l-2 border-nebula-800">
                           {step.substeps?.map((sub, idx) => (
                               <div key={sub.id} className="bg-nebula-950 border border-nebula-800 rounded p-3 flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                       <span className="text-xs font-mono text-gray-500">{idx + 1}.</span>
                                       {getStepIcon(sub.type)}
                                       <span className="text-sm text-gray-300">{sub.name}</span>
                                   </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setExpandedStepId(expandedStepId === sub.id ? null : sub.id)} className="p-1 hover:bg-nebula-800 rounded text-gray-400">
                                            {expandedStepId === sub.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                        </button>
                                        <button onClick={() => removeStep(sub.id)} className="p-1 hover:text-red-400 text-gray-500"><X size={14}/></button>
                                    </div>
                               </div>
                           ))}
                           <div className="flex gap-2 mt-2 pt-2 border-t border-nebula-800 border-dashed">
                               {['Embedding', 'RAG', 'Generation'].map(t => (
                                   <button 
                                        key={t}
                                        onClick={() => addStep(t as BenchmarkStepType, step.id)}
                                        className="text-[10px] px-2 py-1 bg-nebula-900 hover:bg-nebula-800 border border-nebula-700 rounded text-gray-400"
                                   >
                                       + {t}
                                   </button>
                               ))}
                           </div>
                       </div>
                  </div>
              )}

              {step.type === 'Ingestion' && (
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Document Source Path</label>
                          <input type="text" value={step.config.sourcePath || ''} onChange={(e) => updateStepConfig(step.id, { sourcePath: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1" placeholder="/data/docs/legal" />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Document Type</label>
                          <select value={step.config.docType || 'PDF'} onChange={(e) => updateStepConfig(step.id, { docType: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1">
                              <option>PDF</option>
                              <option>Markdown</option>
                              <option>HTML</option>
                              <option>Text</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Chunk Size</label>
                          <input type="number" value={step.config.chunkSize || 512} onChange={(e) => updateStepConfig(step.id, { chunkSize: parseInt(e.target.value) })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1" />
                      </div>
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Overlap</label>
                          <input type="number" value={step.config.overlap || 50} onChange={(e) => updateStepConfig(step.id, { overlap: parseInt(e.target.value) })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1" />
                      </div>
                  </div>
              )}
              
              {step.type === 'Embedding' && (
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Vector Store Target</label>
                           <select value={step.config.vectorStore || 'ChromaDB'} onChange={(e) => updateStepConfig(step.id, { vectorStore: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1">
                              <option>ChromaDB</option>
                              <option>FAISS</option>
                              <option>Pinecone</option>
                              <option>Milvus</option>
                          </select>
                      </div>
                  </div>
              )}

              {step.type === 'RAG' && (
                  <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Top K Retrieval</label>
                          <input type="number" value={step.config.rerankTopK || 5} onChange={(e) => updateStepConfig(step.id, { rerankTopK: parseInt(e.target.value) })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1" />
                      </div>
                       <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Metric</label>
                           <select value={step.config.metric || 'Semantic'} onChange={(e) => updateStepConfig(step.id, { metric: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1">
                              <option>Semantic Similarity</option>
                              <option>Exact Match</option>
                              <option>Retrieval Latency</option>
                          </select>
                      </div>
                  </div>
              )}

            {step.type === 'ToolUse' && (
                    <div className="space-y-4">
                         <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Tool Schema Definition (JSON/URL)</label>
                            <input type="text" value={step.config.toolSchemaUrl || ''} onChange={(e) => updateStepConfig(step.id, { toolSchemaUrl: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1" placeholder="https://api.example.com/openapi.json" />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 uppercase font-bold">Success Metric</label>
                             <select value={step.config.metric || 'FunctionCallValidity'} onChange={(e) => updateStepConfig(step.id, { metric: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1">
                                <option value="FunctionCallValidity">Valid JSON / Schema Compliance</option>
                                <option value="ExactMatch">Argument Exact Match</option>
                                <option value="Throughput">Call Latency</option>
                            </select>
                        </div>
                    </div>
                )}
          </div>
      );
  };

  const renderDataView = () => (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in h-full overflow-hidden pb-4">
          <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-2"><FileText size={16} className="text-blue-400" /> Documents (PDF/HTML)</h3>
                  <button onClick={() => addMockData('PDF')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                  {mockData.filter(m => m.type === 'PDF').map(m => (
                      <div key={m.id} className="p-3 bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors">
                          <div>
                              <div className="text-sm text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-[10px] text-gray-500">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-2"><Code size={16} className="text-green-400" /> Prompts (Txt/Json)</h3>
                  <button onClick={() => addMockData('Prompt')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                  {mockData.filter(m => m.type === 'Prompt').map(m => (
                      <div key={m.id} className="p-3 bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors">
                          <div>
                              <div className="text-sm text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-[10px] text-gray-500">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4 border-b border-nebula-800 pb-2">
                  <h3 className="font-bold text-gray-200 flex items-center gap-2"><Table size={16} className="text-orange-400" /> Structured (SQL/CSV)</h3>
                  <button onClick={() => addMockData('SQL')} className="p-1 hover:bg-nebula-800 rounded text-gray-400 hover:text-white"><Plus size={16}/></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2">
                  {mockData.filter(m => m.type === 'SQL').map(m => (
                      <div key={m.id} className="p-3 bg-nebula-950/50 rounded flex justify-between items-start group hover:bg-nebula-800 transition-colors">
                          <div>
                              <div className="text-sm text-gray-300 font-medium truncate w-40" title={m.name}>{m.name}</div>
                              <div className="text-[10px] text-gray-500">{m.size} • {m.date}</div>
                          </div>
                          <button onClick={() => removeMockData(m.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col relative">
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
                Trends
            </button>
            <button 
                onClick={() => setActiveView('data')}
                className={`px-3 py-1.5 rounded text-sm transition-all flex items-center gap-2 ${activeView === 'data' ? 'bg-nebula-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                 Data Sources
            </button>
            <button 
                onClick={() => setActiveView('config')}
                className={`px-3 py-1.5 rounded text-sm transition-all flex items-center gap-2 ${activeView === 'config' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                 Tests
            </button>
        </div>
      </div>

      {activeView === 'matrix' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto">
            <div className="overflow-x-auto rounded-xl border border-nebula-800">
              <table className="w-full text-left bg-nebula-900">
                <thead className="bg-nebula-950 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4">Model</th>
                    <th className="px-6 py-4">Version</th>
                    <th className="px-6 py-4">Dataset</th>
                    <th className="px-6 py-4">Metric</th>
                    <th className="px-6 py-4 text-right">Score</th>
                    <th className="px-6 py-4 text-right">Tokens/s</th>
                    <th className="px-6 py-4 text-right">Latency</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-nebula-800">
                  {results.map((row) => (
                    <tr 
                        key={row.id} 
                        onClick={() => setSelectedResult(row)}
                        className="hover:bg-nebula-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-medium text-white">{row.modelId}</td>
                      <td className="px-6 py-4 text-gray-400">{row.versionId}</td>
                      <td className="px-6 py-4 text-gray-400">{row.dataset}</td>
                      <td className="px-6 py-4 text-gray-400">{row.metric}</td>
                      <td className="px-6 py-4 text-right text-green-400 font-mono">{row.score}</td>
                      <td className="px-6 py-4 text-right text-blue-400 font-mono">{row.tokensPerSecond?.toFixed(2) || '-'}</td>
                      <td className="px-6 py-4 text-right text-purple-400 font-mono">{row.latency}ms</td>
                      <td className="px-6 py-4 text-right">
                          <Expand size={16} className="text-gray-600 group-hover:text-white" />
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
          <div className="absolute inset-0 bg-nebula-950/95 backdrop-blur-md z-50 flex items-center justify-center p-8 animate-fade-in">
              <div className="bg-nebula-900 border border-nebula-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="p-6 border-b border-nebula-700 flex justify-between items-start bg-nebula-950/50">
                      <div>
                          <div className="flex items-center gap-3">
                              <h2 className="text-2xl font-bold text-white">{selectedResult.modelId}</h2>
                              <span className="text-xs bg-nebula-800 px-2 py-1 rounded text-purple-300 border border-nebula-700">{selectedResult.type} Benchmark</span>
                          </div>
                          <p className="text-sm text-gray-400 mt-2 flex items-center gap-4">
                              <span><Binary size={12} className="inline mr-1"/> {selectedResult.versionId}</span>
                              <span><Database size={12} className="inline mr-1"/> {selectedResult.dataset}</span>
                              <span><Clock size={12} className="inline mr-1"/> {selectedResult.date}</span>
                          </p>
                      </div>
                      <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-nebula-800 rounded text-gray-400 hover:text-white transition-colors">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8">
                      {/* Top Level Metrics */}
                      <div className="grid grid-cols-4 gap-6 mb-8">
                          <div className="bg-nebula-950 p-4 rounded-xl border border-nebula-800">
                              <div className="text-xs text-gray-500 uppercase font-bold mb-1">Score ({selectedResult.metric})</div>
                              <div className="text-3xl font-black text-green-400">{selectedResult.score}</div>
                          </div>
                          <div className="bg-nebula-950 p-4 rounded-xl border border-nebula-800">
                              <div className="text-xs text-gray-500 uppercase font-bold mb-1">Throughput</div>
                              <div className="text-3xl font-black text-blue-400">{selectedResult.tokensPerSecond ? selectedResult.tokensPerSecond.toFixed(1) : '-'} <span className="text-sm text-gray-600 font-normal">t/s</span></div>
                          </div>
                          <div className="bg-nebula-950 p-4 rounded-xl border border-nebula-800">
                              <div className="text-xs text-gray-500 uppercase font-bold mb-1">Total Latency</div>
                              <div className="text-3xl font-black text-purple-400">{selectedResult.latency} <span className="text-sm text-gray-600 font-normal">ms</span></div>
                          </div>
                          <div className="bg-nebula-950 p-4 rounded-xl border border-nebula-800">
                              <div className="text-xs text-gray-500 uppercase font-bold mb-1">Hardware</div>
                              <div className="text-sm font-medium text-gray-200 mt-2">{selectedResult.hardwareName}</div>
                          </div>
                      </div>

                      {/* Detailed Segments / Pipeline Steps */}
                      {selectedResult.segments && selectedResult.segments.length > 0 ? (
                          <div className="space-y-4">
                              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Layers size={18} className="text-yellow-500"/> Pipeline Execution Breakdown</h3>
                              <div className="bg-nebula-950 rounded-xl border border-nebula-800 overflow-hidden">
                                  <div className="grid grid-cols-12 gap-4 p-3 bg-nebula-900 border-b border-nebula-800 text-xs font-bold text-gray-500 uppercase">
                                      <div className="col-span-4">Step Name</div>
                                      <div className="col-span-2">Type</div>
                                      <div className="col-span-2 text-right">Duration</div>
                                      <div className="col-span-4 text-right">Relative Impact</div>
                                  </div>
                                  {selectedResult.segments.map((seg, idx) => (
                                      <div key={idx} className="grid grid-cols-12 gap-4 p-4 border-b border-nebula-800/50 last:border-0 hover:bg-nebula-900/30 transition-colors">
                                          <div className="col-span-4 font-medium text-gray-200">{seg.stepName}</div>
                                          <div className="col-span-2 text-xs text-gray-500 flex items-center gap-2">
                                              <div className="p-1 bg-nebula-900 rounded border border-nebula-800">
                                                  {getStepIcon(seg.type)}
                                              </div>
                                              {seg.type}
                                          </div>
                                          <div className="col-span-2 text-right font-mono text-purple-300">{seg.duration}ms</div>
                                          <div className="col-span-4 flex items-center gap-2">
                                              <div className="flex-1 h-2 bg-nebula-900 rounded-full overflow-hidden">
                                                  <div 
                                                    className="h-full bg-purple-600 rounded-full" 
                                                    style={{ width: `${Math.max(5, (seg.duration / selectedResult.latency) * 100)}%` }}
                                                  ></div>
                                              </div>
                                              <span className="text-xs text-gray-500 w-12 text-right">{((seg.duration / selectedResult.latency) * 100).toFixed(1)}%</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div className="p-8 bg-nebula-950/50 border border-nebula-800 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-500">
                              <Info size={32} className="mb-2 opacity-50" />
                              <p>No granular segment data available for this run.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeView === 'data' && renderDataView()}

      {activeView === 'trends' && (
         <div className="flex-1 overflow-y-auto animate-fade-in">
             <div className="grid grid-cols-1 gap-6">
                <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 h-96">
                    <h3 className="text-lg font-bold mb-4">Throughput Trends</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#272730" />
                            <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#121217', borderColor: '#272730' }} />
                            <Legend />
                            <Line type="monotone" dataKey="tokensPerSecond" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Tokens/Sec" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 h-96">
                    <h3 className="text-lg font-bold mb-4">Latency by Model</h3>
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#272730" />
                            <XAxis dataKey="modelId" stroke="#6b7280" fontSize={10} angle={-15} textAnchor="end" height={60}/>
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: '#121217', borderColor: '#272730' }} />
                            <Bar dataKey="latency" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Latency (ms)" />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
             </div>
         </div>
      )}

      {activeView === 'config' && (
          <div className="flex h-full gap-6 animate-fade-in overflow-hidden">
              {/* Left Sidebar: Step Palette */}
              <div className="w-64 flex flex-col gap-4">
                  <div className="p-4 bg-nebula-900 border border-nebula-700 rounded-xl">
                      <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Pipeline Components</h3>
                      <div className="space-y-2">
                           <button onClick={() => addStep('Phase')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-gray-500/50 hover:bg-gray-900/10 transition-all text-sm group text-left">
                              <Layers size={16} className="text-gray-400" />
                              <span className="text-gray-400 group-hover:text-gray-200">Phase (Container)</span>
                          </button>
                          <button onClick={() => addStep('Ingestion')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-yellow-500/50 hover:bg-yellow-900/10 transition-all text-sm group text-left">
                              <FileText size={16} className="text-yellow-500" />
                              <span className="text-gray-400 group-hover:text-yellow-200">Data Ingestion</span>
                          </button>
                          <button onClick={() => addStep('Embedding')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-green-500/50 hover:bg-green-900/10 transition-all text-sm group text-left">
                              <Binary size={16} className="text-green-500" />
                              <span className="text-gray-400 group-hover:text-green-200">Embedding</span>
                          </button>
                          <button onClick={() => addStep('RAG')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-purple-500/50 hover:bg-purple-900/10 transition-all text-sm group text-left">
                              <Database size={16} className="text-purple-500" />
                              <span className="text-gray-400 group-hover:text-purple-200">RAG Retrieval</span>
                          </button>
                          <button onClick={() => addStep('ColBERT')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-red-500/50 hover:bg-red-900/10 transition-all text-sm group text-left">
                              <Search size={16} className="text-red-500" />
                              <span className="text-gray-400 group-hover:text-red-200">ColBERT Rerank</span>
                          </button>
                           <button onClick={() => addStep('ToolUse')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-orange-500/50 hover:bg-orange-900/10 transition-all text-sm group text-left">
                              <Wrench size={16} className="text-orange-500" />
                              <span className="text-gray-400 group-hover:text-orange-200">Tool / Agent</span>
                          </button>
                           <button onClick={() => addStep('Generation')} className="w-full flex items-center gap-3 p-3 bg-nebula-950 border border-nebula-800 rounded hover:border-blue-500/50 hover:bg-blue-900/10 transition-all text-sm group text-left">
                              <MessageSquare size={16} className="text-blue-500" />
                              <span className="text-gray-400 group-hover:text-blue-200">Generation</span>
                          </button>
                      </div>
                  </div>

                  <div className="p-4 bg-nebula-900 border border-nebula-700 rounded-xl flex-1">
                      <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Global Settings</h3>
                       <div className="space-y-4">
                           <div>
                               <label className="text-xs text-gray-500 block mb-1">Context Size</label>
                               <input type="number" value={currentConfig.parameters.contextSize} onChange={(e) => updateParameter('contextSize', parseInt(e.target.value))} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-white" />
                           </div>
                           <div>
                               <label className="text-xs text-gray-500 block mb-1">Temperature</label>
                               <input type="number" step="0.1" value={currentConfig.parameters.temperature} onChange={(e) => updateParameter('temperature', parseFloat(e.target.value))} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-white" />
                           </div>
                           <div className="flex items-center gap-2">
                               <input type="checkbox" checked={currentConfig.parameters.flashAttention} onChange={(e) => updateParameter('flashAttention', e.target.checked)} className="accent-purple-500" />
                               <label className="text-xs text-gray-400">Flash Attention</label>
                           </div>
                           <div className="flex items-center gap-2">
                               <input type="checkbox" checked={currentConfig.parameters.warmup} onChange={(e) => updateParameter('warmup', e.target.checked)} className="accent-purple-500" />
                               <label className="text-xs text-gray-400 flex items-center gap-1"><Flame size={12} className="text-orange-500"/> Warmup Models</label>
                           </div>
                           <div>
                               <label className="text-xs text-gray-500 block mb-1">GPU Layers</label>
                               <input type="number" value={currentConfig.parameters.gpuLayers} onChange={(e) => updateParameter('gpuLayers', parseInt(e.target.value))} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-white" />
                           </div>
                       </div>
                  </div>
              </div>

              {/* Main Canvas: Pipeline Builder */}
              <div className="flex-1 flex flex-col min-w-0 bg-nebula-900/50 border border-nebula-700 rounded-xl overflow-hidden relative">
                  <div className="p-4 border-b border-nebula-700 flex justify-between items-center bg-nebula-900">
                       <div className="flex items-center gap-2">
                           <Layers size={18} className="text-purple-400" />
                           <input 
                                value={currentConfig.name}
                                onChange={(e) => setCurrentConfig({...currentConfig, name: e.target.value})}
                                className="bg-transparent text-lg font-bold text-white outline-none placeholder-gray-600"
                                placeholder="Pipeline Name"
                           />
                       </div>
                       <div className="flex gap-2">
                           <div className="relative">
                                <button 
                                    onClick={() => setShowLoadMenu(!showLoadMenu)}
                                    className="px-4 py-2 bg-nebula-800 hover:bg-nebula-700 text-white text-xs font-bold rounded border border-nebula-600 flex items-center gap-2"
                                >
                                    <FolderOpen size={14} /> Load
                                </button>
                                {showLoadMenu && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-nebula-900 border border-nebula-700 rounded-lg shadow-xl z-50 overflow-hidden">
                                        <div className="max-h-64 overflow-y-auto">
                                            {savedConfigs.map(cfg => (
                                                <div 
                                                    key={cfg.id}
                                                    onClick={() => handleLoadConfig(cfg)}
                                                    className="p-3 hover:bg-nebula-800 cursor-pointer border-b border-nebula-800 last:border-0"
                                                >
                                                    <div className="font-bold text-sm text-white">{cfg.name}</div>
                                                    <div className="text-[10px] text-gray-500">{cfg.steps.length} steps • {cfg.backend}</div>
                                                </div>
                                            ))}
                                            {savedConfigs.length === 0 && <div className="p-3 text-xs text-gray-500 text-center">No saved pipelines</div>}
                                        </div>
                                    </div>
                                )}
                           </div>

                           <button 
                                onClick={handleNewConfig}
                                className="px-4 py-2 bg-nebula-800 hover:bg-nebula-700 text-white text-xs font-bold rounded border border-nebula-600 flex items-center gap-2"
                            >
                                <Plus size={14} /> New
                            </button>

                           <button 
                                onClick={handleSaveConfig}
                                className="px-4 py-2 bg-nebula-800 hover:bg-nebula-700 text-white text-xs font-bold rounded border border-nebula-600 flex items-center gap-2"
                           >
                               <Save size={14} /> Save
                           </button>

                           <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.4)] ml-2">
                               <Play size={14} fill="currentColor"/> Run
                           </button>
                       </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-2 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-nebula-800/20 via-nebula-950 to-nebula-950">
                      {currentConfig.steps.length === 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none">
                              <Layers size={48} className="mb-4 opacity-20" />
                              <p>Drag & Drop steps or click to add from sidebar</p>
                          </div>
                      )}

                      {currentConfig.steps.map((step, index) => (
                          <div key={step.id} className="relative">
                            {/* Connector Line */}
                            {index > 0 && (
                                <div className="absolute -top-4 left-8 w-0.5 h-4 bg-nebula-700 z-0"></div>
                            )}
                            
                            <div 
                                draggable={step.type !== 'Phase'} // Phases not draggable in top level yet to simplify
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={handleDrop}
                                className={`relative z-10 bg-nebula-950 border ${expandedStepId === step.id ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-nebula-700'} rounded-lg transition-all shadow-lg group`}
                            >
                                <div className={`flex items-center p-3 gap-3 cursor-grab active:cursor-grabbing hover:bg-nebula-900/50 transition-colors rounded-t-lg ${step.type === 'Phase' ? 'bg-nebula-900/40' : ''}`}>
                                    <GripVertical size={16} className="text-gray-600" />
                                    <div className="p-2 bg-nebula-900 rounded border border-nebula-800 shadow-sm">
                                        {getStepIcon(step.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-200">{step.name}</span>
                                            <span className={`text-[10px] px-2 rounded border ${step.type === 'Phase' ? 'bg-purple-900/30 border-purple-500 text-purple-300' : 'bg-nebula-800 border-nebula-700 text-gray-500'}`}>{step.type}</span>
                                            {(step.serverId || step.modelId) && (
                                                <span className="text-[10px] bg-blue-900/20 text-blue-300 px-1.5 rounded border border-blue-500/20 flex items-center gap-1">
                                                    <Server size={8} /> Override
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setExpandedStepId(expandedStepId === step.id ? null : step.id)} className="p-1 hover:bg-nebula-800 rounded text-gray-400">
                                            {expandedStepId === step.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                                        </button>
                                        <button onClick={() => removeStep(step.id)} className="p-1 hover:bg-red-900/30 hover:text-red-400 rounded text-gray-600">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                                
                                {expandedStepId === step.id && (
                                    <div className="p-4 border-t border-nebula-800 bg-nebula-900/30 animate-fade-in">
                                        <div className="mb-4">
                                            <label className="text-xs text-gray-500 uppercase font-bold">Step Name</label>
                                            <input 
                                                type="text" 
                                                value={step.name} 
                                                onChange={(e) => updateStep(step.id, { name: e.target.value })}
                                                className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1 text-white focus:border-purple-500 outline-none" 
                                            />
                                        </div>
                                        {renderStepConfig(step)}
                                    </div>
                                )}
                            </div>
                            
                            {/* Down Arrow for Flow visualization */}
                            {index < currentConfig.steps.length - 1 && (
                                <div className="flex justify-start pl-7 py-1">
                                    <ArrowRight className="rotate-90 text-nebula-700" size={16} />
                                </div>
                            )}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
