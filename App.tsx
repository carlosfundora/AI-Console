
import React, { useState } from 'react';
import { LayoutDashboard, Database, BrainCircuit, Activity, Settings as SettingsIcon, Server, Terminal, FlaskConical } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { Benchmarks } from './views/Benchmarks';
import { Datasets } from './views/Datasets';
import { Models } from './views/Models';
import { Training } from './views/Training';
import { Laboratory } from './views/Laboratory';
import { Servers } from './views/Servers';
import { Settings } from './views/Settings';
import { ViewState, Model, BenchmarkResult, Dataset, ServerConfig, ModelStatus, ServerProfile } from './types';

// Mock Models with Versioning
const MOCK_MODELS: Model[] = [
  { 
    id: 'liquid-lfm-2.5-1.2b', 
    name: 'LFM 2.5 1.2B Instruct', 
    provider: 'LiquidAI',
    family: 'Liquid',
    description: 'Efficient reasoning model. Excellent for pipeline pre-processing and structured output.',
    tags: ['Reasoning', 'Efficient', 'Pipeline-Ready'],
    params: '1.2B',
    tensorType: 'BF16',
    lastUsed: '2026-01-18',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking' }
    ],
    versions: [
        { id: 'v1-q5_k_m', name: 'Q5_K_M GGUF', format: 'GGUF', quantization: 'Q5_K_M', size: '804MB', created: '2026-01-10', baseModel: 'v1-fp16', status: ModelStatus.Ready, metrics: { latencyMs: 200, vramGB: 0.8 } },
        { id: 'v1-q4_0', name: 'Q4_0 RAG', format: 'GGUF', quantization: 'Q4_0', size: '663MB', created: '2026-01-11', baseModel: 'v1-fp16', status: ModelStatus.Ready }
    ]
  },
  { 
    id: 'equall-saul-7b', 
    name: 'Saul 7B Instruct v1', 
    provider: 'Equall',
    family: 'Mistral',
    description: 'Legal domain expert model. Recommended for final analysis generation.',
    tags: ['Legal', 'Domain Expert'],
    params: '7B',
    tensorType: 'BF16',
    lastUsed: '2026-01-18',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/Equall/Saul-7B-Instruct-v1' }
    ],
    versions: [
        { id: 'v1-q4_k_m', name: 'Q4_K_M (Recommended)', format: 'Ollama', quantization: 'Q4_K_M', size: '4.4GB', created: '2025-12-05', baseModel: 'Mistral-7B', status: ModelStatus.Ready, metrics: { latencyMs: 1500, vramGB: 4.4 } },
        { id: 'v1-q8_0', name: 'Q8_0 (High Precision)', format: 'Ollama', quantization: 'Q8_0', size: '7.7GB', created: '2025-12-05', baseModel: 'Mistral-7B', status: ModelStatus.Ready },
        { id: 'v1-q2_k', name: 'Q2_K (Draft)', format: 'Ollama', quantization: 'Q2_K', size: '2.7GB', created: '2025-12-05', baseModel: 'Mistral-7B', status: ModelStatus.Ready }
    ]
  },
  { 
    id: 'mixedbread-embed', 
    name: 'mxbai-embed-large-v1', 
    provider: 'MixedBread AI',
    family: 'Bert',
    description: 'State-of-the-art embedding model for RAG applications.',
    tags: ['Embedding', 'SOTA'],
    params: '335M',
    tensorType: 'FP16',
    lastUsed: '2026-01-11',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1' }
    ],
    versions: [
        { id: 'v1-base', name: 'Base', format: 'Safetensors', quantization: 'FP16', size: '1.2GB', created: '2023-10-10', baseModel: 'None', status: ModelStatus.Ready }
    ]
  },
  { 
    id: 'snowflake-arctic', 
    name: 'snowflake-arctic-embed:335m', 
    provider: 'Snowflake',
    family: 'Bert',
    description: 'Dense embedding model used for dual-embedding strategies.',
    tags: ['Embedding'],
    params: '335M',
    tensorType: 'FP16',
    lastUsed: '2026-01-11',
    links: [],
    versions: [
        { id: 'v1-ollama', name: 'Ollama', format: 'Ollama', quantization: 'FP16', size: '670MB', created: '2026-01-01', baseModel: 'None', status: ModelStatus.Ready }
    ]
  }
];

const MOCK_BENCHMARKS: BenchmarkResult[] = [
  // Flash Attention Impact Test (2026-01-11)
  { id: 'b1', modelId: 'equall-saul-7b', versionId: 'v1-q4_k_m', dataset: 'Legal-FLSA', score: 100, latency: 10929, tokensPerSecond: 9.15, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Reliability', type: 'Core', notes: 'Baseline (Flash Attn OFF)' },
  { id: 'b2', modelId: 'equall-saul-7b', versionId: 'v1-q4_k_m', dataset: 'Legal-FLSA', score: 100, latency: 1530, tokensPerSecond: 65.36, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Reliability', type: 'Core', notes: 'Flash Attn ON (7.1x Speedup)' },

  // LFM2.5 Generation
  { id: 'b3', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-q5_k_m', dataset: 'Legal-Structure', score: 98, latency: 269, tokensPerSecond: 264.9, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT (Vulkan)', date: '2026-01-11', metric: 'JSON Validity', type: 'Core', notes: 'Structured Output' },
  
  // Pipeline Tests
  { id: 'b4', modelId: 'equall-saul-7b', versionId: 'v1-q4_k_m', dataset: 'Legal-Complex', score: 95, latency: 19610, tokensPerSecond: 45, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Accuracy', type: 'RAG', notes: 'LFM2.5 Pipeline + Dual Embed' },
  
  // Embeddings
  { id: 'b5', modelId: 'mixedbread-embed', versionId: 'v1-base', dataset: 'Legal-Docs-50', score: 100, latency: 76, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Retrieval Time', type: 'RAG', notes: 'Single Doc' },
  { id: 'b6', modelId: 'snowflake-arctic', versionId: 'v1-ollama', dataset: 'Legal-Docs-50', score: 100, latency: 68, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Retrieval Time', type: 'RAG', notes: 'Single Doc' },
];

const MOCK_DATASETS: Dataset[] = [
  { id: 'd1', name: 'Legal-Bench-FLSA', type: 'SFT', size: '1.2MB', rows: 50, description: '50 Node FLSA/ADA/Title VII Document set' },
  { id: 'd2', name: 'OpenHermes-2.5', type: 'SFT', size: '1.6GB', rows: 1000000, description: 'General instruction tuning' },
];

const SERVER_CONFIG: ServerConfig = {
    gpuType: 'AMD RX 6700 XT',
    count: 1,
    vramTotal: 12,
    provider: 'Local',
    rocmEnabled: true
};

const MOCK_SERVERS: ServerProfile[] = [
    {
        id: 'srv-1',
        name: 'Ollama ROCm Local',
        type: 'Ollama',
        path: '/usr/local/bin/ollama',
        host: '127.0.0.1',
        port: 11434,
        os: 'Ubuntu',
        acceleration: 'ROCm',
        startupFlags: 'OLLAMA_HOST=0.0.0.0 HSA_OVERRIDE_GFX_VERSION=10.3.0',
        packages: [],
        compatibleModels: ['equall-saul-7b', 'snowflake-arctic'],
        status: 'Online'
    },
    {
        id: 'srv-2',
        name: 'PyTorch Venv (Training)',
        type: 'Venv',
        path: '/home/user/venvs/torch-rocm/bin/activate',
        host: '127.0.0.1',
        port: 8000,
        os: 'Ubuntu',
        acceleration: 'ROCm',
        startupFlags: '',
        packages: ['torch==2.1.2+rocm5.6', 'transformers==4.36.0', 'peft'],
        compatibleModels: ['liquid-lfm-2.5-1.2b'],
        status: 'Offline'
    },
    {
        id: 'srv-3',
        name: 'Llama.cpp Server',
        type: 'Llama.cpp',
        path: './server',
        host: '192.168.1.50',
        port: 8081,
        os: 'Windows',
        acceleration: 'CUDA',
        startupFlags: '-ngl 99 -c 8192',
        packages: [],
        compatibleModels: ['equall-saul-7b'],
        status: 'Online'
    }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [servers, setServers] = useState<ServerProfile[]>(MOCK_SERVERS);
  
  const handleUpdateServer = (updated: ServerProfile) => {
      setServers(servers.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteServer = (id: string) => {
      setServers(servers.filter(s => s.id !== id));
  };

  const handleAddServer = (newServer: ServerProfile) => {
      setServers([...servers, newServer]);
  };
  
  // Use lucide icons for main nav for high aesthetics, emojis for content
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'servers', label: 'Servers', icon: <Server size={20} /> },
    { id: 'models', label: 'Models', icon: <BrainCircuit size={20} /> },
    { id: 'benchmarks', label: 'Benchmarks', icon: <Activity size={20} /> },
    { id: 'datasets', label: 'Datasets', icon: <Database size={20} /> },
    { id: 'training', label: 'Training', icon: <Terminal size={20} /> },
    { id: 'laboratory', label: 'Laboratory', icon: <FlaskConical size={20} /> },
    { id: 'compute', label: 'Compute', icon: <SettingsIcon size={20} /> }, // Using Settings icon for Compute generally, as it was in original list
  ];

  return (
    <div className="flex flex-col h-screen bg-nebula-950 text-nebula-100 font-sans overflow-hidden">
      {/* Streamlined Top Header */}
      <header className="h-16 bg-nebula-950 border-b border-nebula-800 flex items-center justify-between px-6 z-30 shrink-0">
          <div className="flex items-center gap-6">
               {/* Logo */}
              <div className="text-xl font-black tracking-widest text-nebula-100 border-2 border-nebula-100 px-2 py-0.5">
                  R-AI
              </div>
              
              {/* Divider */}
              <div className="h-6 w-px bg-nebula-800 mx-2"></div>

              {/* Breadcrumb / Title */}
              <div className="flex items-center gap-4">
                  <h1 className="text-lg font-semibold text-white capitalize">{activeTab}</h1>
                  {activeTab === 'training' && <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-500/20">Active Job: Llama-SFT-v1</span>}
              </div>
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
              
              {/* Settings Button */}
              <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${activeTab === 'settings' ? 'bg-purple-600 border-purple-500 text-white shadow-lg' : 'bg-nebula-800 border-nebula-700 text-gray-400 hover:text-white hover:border-nebula-600 hover:bg-nebula-700'}`}
                  title="Settings"
              >
                  <SettingsIcon size={20} />
              </button>
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-nebula-950 border-r border-nebula-800 flex flex-col z-20">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-nebula-950">
          
          {/* View Content */}
          <div className="flex-1 overflow-auto p-8 relative">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'dashboard' && <Dashboard serverConfig={SERVER_CONFIG} />}
              {activeTab === 'benchmarks' && <Benchmarks results={MOCK_BENCHMARKS} models={MOCK_MODELS} />}
              {activeTab === 'datasets' && <Datasets datasets={MOCK_DATASETS} />}
              {activeTab === 'training' && <Training models={MOCK_MODELS} datasets={MOCK_DATASETS} />}
              {activeTab === 'laboratory' && <Laboratory models={MOCK_MODELS} />}
              {activeTab === 'servers' && <Servers servers={servers} models={MOCK_MODELS} onUpdateServer={handleUpdateServer} onDeleteServer={handleDeleteServer} onAddServer={handleAddServer} />}
              {activeTab === 'models' && <Models models={MOCK_MODELS} servers={servers} />}
              {activeTab === 'settings' && <Settings />}
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
                  <span className="flex items-center gap-1">VRAM: 8/12 GB</span>
              </div>
              <div>
                  Replicator AI v2.2.0-Lab
              </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
