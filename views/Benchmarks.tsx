
import React, { useState, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { BenchmarkResult, Model, AdvancedBenchmarkConfig, BenchmarkStep, BenchmarkStepType } from '../types';
import { analyzeBenchmarks } from '../services/geminiService';
import { Play, Save, Plus, Settings2, Cpu, Zap, Layers, GripVertical, Trash2, MessageSquare, Database, Binary, FileText, Wrench, Search, ChevronDown, ChevronRight, X } from 'lucide-react';

interface BenchmarksProps {
  results: BenchmarkResult[];
  models: Model[];
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
        gpuLayers: 99
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
        parameters: { contextSize: 8192, temperature: 0.1, flashAttention: true, memoryLock: true, gpuLayers: 99, continuousBatching: false },
        steps: [
            { id: 's1', type: 'Ingestion', name: 'Parse PDFs', enabled: true, config: { docType: 'PDF', chunkSize: 512 } },
            { id: 's2', type: 'Embedding', name: 'Vectorize (Arctic)', enabled: true, config: { modelId: 'snowflake-arctic' } },
            { id: 's3', type: 'Generation', name: 'Answer Query', enabled: true, config: { metric: 'Throughput' } }
        ]
    }
];

export const Benchmarks: React.FC<BenchmarksProps> = ({ results, models }) => {
  const [activeView, setActiveView] = useState<'matrix' | 'trends' | 'config'>('matrix');
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [configs, setConfigs] = useState<AdvancedBenchmarkConfig[]>(MOCK_SAVED_CONFIGS);
  const [currentConfig, setCurrentConfig] = useState<AdvancedBenchmarkConfig>(DEFAULT_ADV_CONFIG);
  
  // Drag and Drop State
  const [draggedStepIndex, setDraggedStepIndex] = useState<number | null>(null);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Prepare Data for Charts
  const trendData = results
    .filter(r => r.tokensPerSecond || r.latency)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleAnalysis = async () => {
    setIsAnalyzing(true);
    const text = await analyzeBenchmarks(results, models);
    setAnalysis(text || "No analysis returned.");
    setIsAnalyzing(false);
  };

  const addStep = (type: BenchmarkStepType) => {
      const newStep: BenchmarkStep = {
          id: `step-${Date.now()}`,
          type,
          name: `New ${type} Step`,
          enabled: true,
          config: {
              metric: 'Throughput',
              chunkSize: 512,
              overlap: 50,
          }
      };
      setCurrentConfig({ ...currentConfig, steps: [...currentConfig.steps, newStep] });
      setExpandedStepId(newStep.id);
  };

  const updateStep = (id: string, updates: Partial<BenchmarkStep>) => {
      setCurrentConfig({
          ...currentConfig,
          steps: currentConfig.steps.map(s => s.id === id ? { ...s, ...updates } : s)
      });
  };
  
  const updateStepConfig = (id: string, configUpdates: any) => {
      setCurrentConfig({
          ...currentConfig,
          steps: currentConfig.steps.map(s => s.id === id ? { ...s, config: { ...s.config, ...configUpdates } } : s)
      });
  };

  const removeStep = (id: string) => {
      setCurrentConfig({
          ...currentConfig,
          steps: currentConfig.steps.filter(s => s.id !== id)
      });
  };

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

  const getStepIcon = (type: BenchmarkStepType) => {
      switch(type) {
          case 'Generation': return <MessageSquare size={16} className="text-blue-400"/>;
          case 'RAG': return <Database size={16} className="text-purple-400"/>;
          case 'Embedding': return <Binary size={16} className="text-green-400"/>;
          case 'Ingestion': return <FileText size={16} className="text-yellow-400"/>;
          case 'ToolUse': return <Wrench size={16} className="text-orange-400"/>;
          case 'ColBERT': return <Search size={16} className="text-red-400"/>;
      }
  };

  const renderStepConfig = (step: BenchmarkStep) => {
      switch(step.type) {
          case 'Ingestion':
              return (
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
              );
          case 'Embedding':
              return (
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs text-gray-500 uppercase font-bold">Embedding Model</label>
                           <select value={step.config.modelId || ''} onChange={(e) => updateStepConfig(step.id, { modelId: e.target.value })} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm mt-1">
                              <option value="">Default (System)</option>
                              {models.filter(m => m.tags.includes('Embedding')).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>
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
              );
          case 'RAG':
              return (
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
              );
            case 'ToolUse':
                return (
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
                );
          default:
              return <div className="text-sm text-gray-500 italic">No specific configuration for this step type.</div>;
      }
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
                Trends
            </button>
            <button 
                onClick={() => setActiveView('config')}
                className={`px-3 py-1.5 rounded text-sm transition-all flex items-center gap-2 ${activeView === 'config' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                <Settings2 size={14} /> Pipeline Editor
            </button>
        </div>
      </div>

      {activeView === 'matrix' && (
        <div className="space-y-6 animate-fade-in flex-1 overflow-y-auto">
             <div className="flex justify-end">
                <button 
                    onClick={handleAnalysis}
                    disabled={isAnalyzing}
                    className="bg-nebula-500 hover:bg-nebula-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                >
                    {isAnalyzing ? 'Analyzing...' : 'Gemini Analysis'}
                </button>
             </div>
             
             {analysis && (
                <div className="bg-nebula-900 border border-purple-500/30 p-6 rounded-xl text-sm leading-relaxed text-gray-300">
                    <h3 className="text-purple-400 font-bold mb-2">Gemini Insights</h3>
                    <div className="markdown-body" dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>') }} />
                </div>
             )}

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-nebula-800">
                  {results.map((row) => (
                    <tr key={row.id} className="hover:bg-nebula-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{row.modelId}</td>
                      <td className="px-6 py-4 text-gray-400">{row.versionId}</td>
                      <td className="px-6 py-4 text-gray-400">{row.dataset}</td>
                      <td className="px-6 py-4 text-gray-400">{row.metric}</td>
                      <td className="px-6 py-4 text-right text-green-400 font-mono">{row.score}</td>
                      <td className="px-6 py-4 text-right text-blue-400 font-mono">{row.tokensPerSecond?.toFixed(2) || '-'}</td>
                      <td className="px-6 py-4 text-right text-purple-400 font-mono">{row.latency}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
      )}

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
                               <input type="number" value={currentConfig.parameters.contextSize} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-white" />
                           </div>
                           <div>
                               <label className="text-xs text-gray-500 block mb-1">Temperature</label>
                               <input type="number" step="0.1" value={currentConfig.parameters.temperature} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2 text-sm text-white" />
                           </div>
                           <div className="flex items-center gap-2">
                               <input type="checkbox" checked={currentConfig.parameters.flashAttention} className="accent-purple-500" />
                               <label className="text-xs text-gray-400">Flash Attention</label>
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
                           <button className="px-4 py-2 bg-nebula-800 hover:bg-nebula-700 text-white text-xs font-bold rounded border border-nebula-600">Load Template</button>
                           <button className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded flex items-center gap-2">
                               <Play size={14} fill="currentColor"/> Run Benchmark
                           </button>
                       </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 relative">
                      {currentConfig.steps.length === 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none">
                              <Layers size={48} className="mb-4 opacity-20" />
                              <p>Drag & Drop steps or click to add from sidebar</p>
                          </div>
                      )}

                      {currentConfig.steps.map((step, index) => (
                          <div 
                            key={step.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={handleDrop}
                            className={`bg-nebula-950 border ${expandedStepId === step.id ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-nebula-700'} rounded-lg transition-all shadow-lg group`}
                          >
                              <div className="flex items-center p-3 gap-3 cursor-grab active:cursor-grabbing hover:bg-nebula-900/50 transition-colors rounded-t-lg">
                                  <GripVertical size={16} className="text-gray-600" />
                                  <div className="p-2 bg-nebula-900 rounded border border-nebula-800">
                                      {getStepIcon(step.type)}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-gray-200">{step.name}</span>
                                          <span className="text-[10px] bg-nebula-800 px-2 rounded text-gray-500">{step.type}</span>
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
                      ))}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
