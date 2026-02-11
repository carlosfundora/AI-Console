import React, { useState } from 'react';
import { LayoutDashboard, Database, BrainCircuit, Activity, Settings, Server, Terminal, FlaskConical } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { Benchmarks } from './views/Benchmarks';
import { Datasets } from './views/Datasets';
import { Models } from './views/Models';
import { Training } from './views/Training';
import { Laboratory } from './views/Laboratory';
import { ViewState, Model, BenchmarkResult, Dataset, ServerConfig, ModelStatus } from './types';

// Mock Models with Versioning
const MOCK_MODELS: Model[] = [
  { 
    id: 'liquid-lfm-2.5-1.2b', 
    name: 'LFM 2.5 1.2B Thinking', 
    provider: 'LiquidAI',
    family: 'Liquid',
    description: 'A highly efficient reasoning model by LiquidAI.',
    tags: ['Reasoning', 'Efficient', 'ROCm Optimized'],
    lastUsed: '2023-10-27',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking' }
    ],
    versions: [
        { id: 'v1-fp16', name: 'FP16 Base', format: 'Safetensors', quantization: 'FP16', size: '2.4GB', created: '2023-10-20', baseModel: 'None', status: ModelStatus.Ready, metrics: { perplexity: 4.2, latencyMs: 12, accuracy: 78.5, vramGB: 3.0 } },
        { id: 'v1-q4', name: 'Q4_K_M GGUF', format: 'GGUF', quantization: 'Q4_K_M', size: '0.8GB', created: '2023-10-21', baseModel: 'v1-fp16', status: ModelStatus.Ready, metrics: { perplexity: 4.5, latencyMs: 8, accuracy: 77.1, vramGB: 1.2 } },
        { id: 'v1-ollama', name: 'Ollama Latest', format: 'Ollama', quantization: 'Q4', size: '0.8GB', created: '2023-10-22', baseModel: 'v1-fp16', status: ModelStatus.Ready, metrics: { latencyMs: 15, vramGB: 1.5 } }
    ]
  },
  { 
    id: 'liquid-lfm-2-colbert', 
    name: 'LFM 2 ColBERT 350M', 
    provider: 'LiquidAI',
    family: 'Liquid',
    description: 'Specialized embedding and retrieval model.',
    tags: ['Embedding', 'RAG'],
    lastUsed: '2023-10-26',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/LiquidAI/LFM2-ColBERT-350M' }
    ],
    versions: [
        { id: 'v1-base', name: 'Base Model', format: 'Safetensors', quantization: 'FP32', size: '1.4GB', created: '2023-10-15', baseModel: 'None', status: ModelStatus.Ready }
    ]
  },
  { 
    id: 'mixedbread-embed', 
    name: 'mxbai-embed-large-v1', 
    provider: 'MixedBread AI',
    family: 'Bert',
    description: 'State-of-the-art embedding model for RAG applications.',
    tags: ['Embedding', 'SOTA'],
    lastUsed: '2023-10-25',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1' }
    ],
    versions: [
        { id: 'v1-onnx', name: 'ONNX Optimized', format: 'ONNX', quantization: 'FP16', size: '670MB', created: '2023-10-10', baseModel: 'v1-base', status: ModelStatus.Ready },
        { id: 'v1-base', name: 'Base', format: 'Safetensors', quantization: 'FP16', size: '1.2GB', created: '2023-10-10', baseModel: 'None', status: ModelStatus.Ready }
    ]
  },
  { 
    id: 'equall-saul-7b', 
    name: 'Saul 7B Instruct v1', 
    provider: 'Equall',
    family: 'Mistral',
    description: 'Legal domain expert model fine-tuned on legal texts.',
    tags: ['Legal', 'Domain Expert'],
    lastUsed: '2023-10-28',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/Equall/Saul-7B-Instruct-v1' }
    ],
    versions: [
        { id: 'v1-sft', name: 'SFT v1', format: 'Safetensors', quantization: 'BF16', size: '14GB', created: '2023-10-05', baseModel: 'Mistral-7B', status: ModelStatus.Ready },
        { id: 'v1-awq', name: 'AWQ 4bit', format: 'Safetensors', quantization: 'AWQ', size: '4.2GB', created: '2023-10-06', baseModel: 'v1-sft', status: ModelStatus.Ready }
    ]
  }
];

const MOCK_BENCHMARKS: BenchmarkResult[] = [
  // LFM 2.5
  { id: 'b1', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-fp16', dataset: 'MMLU', score: 62.4, latency: 12, hardware: 'GPU', hardwareName: 'AMD Radeon PRO W7900', date: '2023-10-20', metric: 'Accuracy', type: 'Core' },
  { id: 'b2', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-q4', dataset: 'MMLU', score: 61.1, latency: 8, hardware: 'GPU', hardwareName: 'AMD Radeon PRO W7900', date: '2023-10-21', metric: 'Accuracy', type: 'Core' },
  { id: 'b3', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-q4', dataset: 'MMLU', score: 61.1, latency: 45, hardware: 'CPU', hardwareName: 'Ryzen 9 7950X', date: '2023-10-21', metric: 'Accuracy', type: 'Core' },
  
  // Saul 7B
  { id: 'b4', modelId: 'equall-saul-7b', versionId: 'v1-sft', dataset: 'LegalBench', score: 78.2, latency: 35, hardware: 'GPU', hardwareName: 'AMD Radeon PRO W7900', date: '2023-10-22', metric: 'F1 Score', type: 'Custom' },
  
  // Embeddings
  { id: 'b5', modelId: 'mixedbread-embed', versionId: 'v1-onnx', dataset: 'MTEB Retrieval', score: 84.5, latency: 4, hardware: 'GPU', hardwareName: 'AMD Radeon PRO W7900', date: '2023-10-23', metric: 'NDCG@10', type: 'RAG' },
  
  // Historical Trend Data
  { id: 'b6', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-fp16', dataset: 'MMLU', score: 60.1, latency: 14, hardware: 'GPU', hardwareName: 'AMD Radeon PRO W7900', date: '2023-10-18', metric: 'Accuracy', type: 'Core' },
  { id: 'b7', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-fp16', dataset: 'MMLU', score: 61.5, latency: 13, hardware: 'GPU', hardwareName: 'AMD Radeon PRO W7900', date: '2023-10-19', metric: 'Accuracy', type: 'Core' },
];

const MOCK_DATASETS: Dataset[] = [
  { id: 'd1', name: 'OpenHermes-2.5', type: 'SFT', size: '1.6GB', rows: 1000000, description: 'General instruction tuning' },
  { id: 'd2', name: 'DPO-Ultra-Feedback', type: 'DPO', size: '450MB', rows: 60000, description: 'Preference optimization' },
  { id: 'd3', name: 'Medical-RAG-Corpus', type: 'Pretrain', size: '5.2GB', rows: 250000, description: 'Medical journals and textbooks' },
  { id: 'd4', name: 'Legal-Contract-Review', type: 'SFT', size: '850MB', rows: 45000, description: 'Annotated legal contracts' },
];

const SERVER_CONFIG: ServerConfig = {
    gpuType: 'AMD Radeon PRO W7900',
    count: 2,
    vramTotal: 96,
    provider: 'Local',
    rocmEnabled: true
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  
  // Use lucide icons for main nav for high aesthetics, emojis for content
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'benchmarks', label: 'Benchmarks', icon: <Activity size={20} /> },
    { id: 'datasets', label: 'Datasets', icon: <Database size={20} /> },
    { id: 'training', label: 'Training', icon: <Terminal size={20} /> },
    { id: 'laboratory', label: 'Laboratory', icon: <FlaskConical size={20} /> },
    { id: 'models', label: 'Models', icon: <BrainCircuit size={20} /> },
    { id: 'compute', label: 'Compute', icon: <Server size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-nebula-950 text-nebula-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-nebula-950 border-r border-nebula-800 flex flex-col z-20">
        <div className="p-6 border-b border-nebula-800 flex items-center justify-center">
            {/* Minimal Header */}
            <div className="text-2xl font-black tracking-widest text-nebula-100 border-2 border-nebula-100 px-3 py-1">
                R-AI
            </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-nebula-900 text-purple-400 border border-nebula-700 shadow-md' 
                  : 'text-gray-400 hover:text-white hover:bg-nebula-900/50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-nebula-800">
           <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
              <Settings size={18} />
              <span>Settings</span>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-nebula-950/80 backdrop-blur-sm border-b border-nebula-800 flex items-center justify-between px-8 z-10 sticky top-0">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-white capitalize">{activeTab}</h1>
                {activeTab === 'training' && <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/20">Active Job: Llama-SFT-v1</span>}
            </div>
            
            <div className="flex items-center gap-6">
                {SERVER_CONFIG.rocmEnabled && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-red-900/20 border border-red-500/30 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs text-red-200 font-medium">AMD ROCm Active</span>
                    </div>
                )}
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-400">Environment</p>
                    <p className="text-sm font-mono text-purple-300">{SERVER_CONFIG.gpuType} • {SERVER_CONFIG.vramTotal}GB</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-nebula-800 border border-nebula-700 flex items-center justify-center text-gray-300">
                    🧑‍💻
                </div>
            </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'dashboard' && <Dashboard serverConfig={SERVER_CONFIG} />}
            {activeTab === 'benchmarks' && <Benchmarks results={MOCK_BENCHMARKS} models={MOCK_MODELS} />}
            {activeTab === 'datasets' && <Datasets datasets={MOCK_DATASETS} />}
            {activeTab === 'training' && <Training models={MOCK_MODELS} datasets={MOCK_DATASETS} />}
            {activeTab === 'laboratory' && <Laboratory models={MOCK_MODELS} />}
            {activeTab === 'models' && <Models models={MOCK_MODELS} />}
            {activeTab === 'compute' && (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <Server size={48} className="mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-bold mb-2">Compute Configuration</h2>
                        <p>Server management and cloud provider API settings would go here.</p>
                    </div>
                </div>
            )}
          </div>
        </div>

        {/* Footer Info Bar */}
        <footer className="h-8 bg-nebula-950 border-t border-nebula-800 flex items-center justify-between px-4 text-xs text-gray-500 select-none">
            <div className="flex gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> System Online</span>
                <span className="flex items-center gap-1">GPU Util: 12%</span>
                <span className="flex items-center gap-1">VRAM: 24/96 GB</span>
            </div>
            <div>
                Replicator AI v2.2.0-Lab
            </div>
        </footer>
      </main>
    </div>
  );
};

export default App;