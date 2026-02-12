
import React, { useState } from 'react';
import { LayoutDashboard, Database, BrainCircuit, Activity, Settings as SettingsIcon, Server, Terminal, FlaskConical, Loader2, MessageSquare, Briefcase, GraduationCap, Bot, BookOpen, Eye } from 'lucide-react';
import { Dashboard } from './views/Dashboard';
import { Benchmarks } from './views/Benchmarks';
import { Datasets } from './views/Datasets';
import { Models } from './views/Models';
import { Training } from './views/Training';
import { Laboratory } from './views/Laboratory';
import { Servers } from './views/Servers';
import { Settings } from './views/Settings';
import { Chat } from './views/Chat';
import { Agents } from './views/Agents';
import { Notebooks } from './views/Notebooks';
import { ViewState, Model, BenchmarkResult, Dataset, ServerConfig, ModelStatus, ServerProfile, AgentConfig } from './types';

// --- Custom Icons matching the requested style ---

const PythonIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 9h-7a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h3" />
    <path d="M12 15h7a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-3" />
    <path d="M8 9v-4a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v5a2 2 0 0 1 -2 2h-4a2 2 0 0 0 -2 2v5a2 2 0 0 0 2 2h4a2 2 0 0 0 2 -2v-4" />
    <line x1="11" y1="6" x2="11" y2="6.01" />
    <line x1="13" y1="18" x2="13" y2="18.01" />
  </svg>
);

const ClipboardDataIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" className={className}>
    <path d="M4 11a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0v-1zm6-4a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0V7zM7 9a1 1 0 0 1 2 0v3a1 1 0 1 1-2 0V9z"/>
    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
  </svg>
);

const DraftingCompassIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="2" />
    <path d="m12 7 7.53 13" />
    <path d="m12 7-7.53 13" />
    <path d="M5 19h14" />
  </svg>
);

// Mock Models with Versioning
const MOCK_MODELS: Model[] = [
  { 
    id: 'liquid-lfm-2.5-1.2b', 
    name: 'LFM 2.5 1.2B Instruct', 
    provider: 'LiquidAI', 
    family: 'Liquid',
    description: 'Efficient reasoning model. Excellent for pipeline pre-processing and structured output.',
    tags: ['Reasoning', 'Efficient', 'Pipeline-Ready', 'Base'],
    params: '1.2B',
    tensorType: 'BF16',
    lastUsed: '2026-01-18',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/LiquidAI/LFM2.5-1.2B-Thinking' }
    ],
    documentation: `
# Liquid LFM-2.5
This model is optimized for **structured reasoning** tasks.

## Usage
\`\`\`python
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained("LiquidAI/LFM2.5-1.2B")
\`\`\`

## Key Features
- Dynamic memory management
- High throughput for JSON generation
    `,
    versions: [
        { 
          id: 'v1-q5_k_m', 
          name: 'Q5_K_M GGUF', 
          format: 'GGUF', 
          quantization: 'Q5_K_M', 
          size: '804MB', 
          created: '2026-01-10', 
          baseModel: 'v1-fp16', 
          status: ModelStatus.Ready, 
          metrics: { 
            latencyMs: 200, 
            vramGB: 0.8,
            perplexity: 5.4,
            accuracy: 68.2,
            tokensPerSecond: 95.4
          } 
        },
        { 
          id: 'v1-q4_0', 
          name: 'Q4_0 RAG', 
          format: 'GGUF', 
          quantization: 'Q4_0', 
          size: '663MB', 
          created: '2026-01-11', 
          baseModel: 'v1-fp16', 
          status: ModelStatus.Ready, 
          metrics: { 
            latencyMs: 180, 
            vramGB: 0.7,
            perplexity: 5.8,
            accuracy: 65.1,
            tokensPerSecond: 102.1
          }
        }
    ]
  },
  { 
    id: 'liquid-lfm-2.5-audio', 
    name: 'LFM 2.5 Audio 1.5B', 
    provider: 'LiquidAI', 
    family: 'Liquid',
    description: 'Multimodal audio model capable of ASR, TTS, and interleaved conversation. WebGPU optimized.',
    tags: ['Audio', 'Multimodal', 'WebGPU-Ready', 'Base'],
    params: '1.5B',
    tensorType: 'FP16',
    lastUsed: '2026-01-19',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/LiquidAI/LFM2.5-Audio-1.5B-ONNX' }
    ],
    documentation: `
# LFM Audio 1.5B
A compact multimodal model for edge devices.

## WebGPU Inference
Ensure your browser supports WebGPU and you have enabled unsafe-webgpu flags if necessary.

## Capabilities
1. ASR (Automatic Speech Recognition)
2. TTS (Text to Speech)
3. Speech-to-Speech
    `,
    versions: [
        { 
          id: 'v1-onnx', 
          name: 'ONNX WebGPU', 
          format: 'ONNX', 
          quantization: 'Q4_0', 
          size: '1.1GB', 
          created: '2026-01-15', 
          baseModel: 'v1-fp16', 
          status: ModelStatus.Ready, 
          metrics: { 
            latencyMs: 50, 
            vramGB: 1.2,
            perplexity: 6.1,
            accuracy: 62.5,
            tokensPerSecond: 45.0
          } 
        }
    ]
  },
  { 
    id: 'flux-1.1-pro', 
    name: 'Flux 1.1 Pro (Image)', 
    provider: 'Black Forest Labs', 
    family: 'Other', 
    description: 'High fidelity text-to-image generation model.', 
    tags: ['Image', 'Generative', 'SOTA'], 
    params: '12B', 
    tensorType: 'FP16', 
    lastUsed: '2026-01-21', 
    links: [], 
    versions: [ 
        { 
            id: 'v1.1', 
            name: 'Pro', 
            format: 'Safetensors', 
            quantization: 'FP16', 
            size: '24GB', 
            created: '2026-01-05', 
            baseModel: 'None', 
            status: ModelStatus.Ready 
        } 
    ] 
  },
  { 
    id: 'equall-saul-7b', 
    name: 'Saul 7B Instruct v1', 
    provider: 'Equall',
    family: 'Mistral',
    description: 'Legal domain expert model. Recommended for final analysis generation.',
    tags: ['Legal', 'Domain Expert', 'Fine-Tuned', 'SFT'],
    params: '7B',
    tensorType: 'BF16',
    lastUsed: '2026-01-18',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/Equall/Saul-7B-Instruct-v1' }
    ],
    versions: [
        { 
          id: 'v1-q4_k_m', 
          name: 'Q4_K_M (Recommended)', 
          format: 'Ollama', 
          quantization: 'Q4_K_M', 
          size: '4.4GB', 
          created: '2025-12-05', 
          baseModel: 'Mistral-7B', 
          status: ModelStatus.Ready, 
          metrics: { 
            latencyMs: 1500, 
            vramGB: 4.4,
            perplexity: 4.1,
            accuracy: 74.3,
            tokensPerSecond: 65.3
          } 
        },
        { 
          id: 'v1-q8_0', 
          name: 'Q8_0 (High Precision)', 
          format: 'Ollama', 
          quantization: 'Q8_0', 
          size: '7.7GB', 
          created: '2025-12-05', 
          baseModel: 'Mistral-7B', 
          status: ModelStatus.Ready, 
          metrics: {
            latencyMs: 2100,
            vramGB: 8.2,
            perplexity: 3.8,
            accuracy: 76.1,
            tokensPerSecond: 42.8
          }
        },
        { 
          id: 'v1-q2_k', 
          name: 'Q2_K (Draft)', 
          format: 'Ollama', 
          quantization: 'Q2_K', 
          size: '2.7GB', 
          created: '2025-12-05', 
          baseModel: 'Mistral-7B', 
          status: ModelStatus.Ready, 
          metrics: {
            latencyMs: 1100,
            vramGB: 3.1,
            perplexity: 8.9,
            accuracy: 58.2,
            tokensPerSecond: 88.5
          }
        }
    ]
  },
  { 
    id: 'mixedbread-embed', 
    name: 'mxbai-embed-large-v1', 
    provider: 'MixedBread AI',
    family: 'Bert',
    description: 'State-of-the-art embedding model for RAG applications.',
    tags: ['Embedding', 'SOTA', 'Base'],
    params: '335M',
    tensorType: 'FP16',
    lastUsed: '2026-01-11',
    links: [
        { type: 'HuggingFace', url: 'https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1' }
    ],
    versions: [
        { 
          id: 'v1-base', 
          name: 'Base', 
          format: 'Safetensors', 
          quantization: 'FP16', 
          size: '1.2GB', 
          created: '2023-10-10', 
          baseModel: 'None', 
          status: ModelStatus.Ready,
          metrics: {
            latencyMs: 15,
            vramGB: 1.5,
            accuracy: 92.4, // MTEB Score
            tokensPerSecond: 0 // N/A for embedding
          }
        }
    ]
  },
  { 
    id: 'snowflake-arctic', 
    name: 'snowflake-arctic-embed:335m', 
    provider: 'Snowflake', 
    family: 'Bert',
    description: 'Dense embedding model used for dual-embedding strategies.',
    tags: ['Embedding', 'Base'],
    params: '335M',
    tensorType: 'FP16',
    lastUsed: '2026-01-11',
    links: [],
    versions: [
        { 
          id: 'v1-ollama', 
          name: 'Ollama', 
          format: 'Ollama', 
          quantization: 'FP16', 
          size: '670MB', 
          created: '2026-01-01', 
          baseModel: 'None', 
          status: ModelStatus.Ready,
          metrics: {
            latencyMs: 12,
            vramGB: 0.7,
            accuracy: 91.8,
            tokensPerSecond: 0
          }
        }
    ]
  },
  {
    id: 'frankenclyde-13b',
    name: 'FrankenClyde 13B (Merged)',
    provider: 'Community',
    family: 'Llama',
    description: 'Merged model combining Llama-2-13b-Chat and Clydesdale-13b using Linear Interpolation. Excellent story-telling capabilities.',
    tags: ['Merged', 'Roleplay', 'Creative'],
    params: '13B',
    tensorType: 'FP16',
    lastUsed: '2026-01-19',
    links: [],
    versions: [
        {
            id: 'v1-merged',
            name: 'FP16 Merged',
            format: 'Safetensors',
            quantization: 'FP16',
            size: '26GB',
            created: '2026-01-19',
            baseModel: 'Llama-2-13b',
            status: ModelStatus.Ready,
            metrics: {
                latencyMs: 45,
                vramGB: 24.5,
                perplexity: 4.8,
                tokensPerSecond: 32.1
            }
        }
    ]
  },
  {
    id: 'tiny-llama-distill',
    name: 'TinyLlama-1.1B-Distill',
    provider: 'Local Lab',
    family: 'Llama',
    description: 'Distilled version of Llama-3-8B trained on synthetic reasoning traces.',
    tags: ['Distilled', 'Reasoning', 'Small'],
    params: '1.1B',
    tensorType: 'BF16',
    lastUsed: '2026-01-20',
    links: [],
    versions: [
        {
            id: 'v1-distill',
            name: 'BF16 Distilled',
            format: 'Pytorch',
            quantization: 'BF16',
            size: '2.2GB',
            created: '2026-01-20',
            baseModel: 'TinyLlama-1.1B',
            status: ModelStatus.Ready,
            metrics: {
                latencyMs: 12,
                vramGB: 2.5,
                perplexity: 6.2,
                tokensPerSecond: 145.8
            }
        }
    ]
  }
];

const MOCK_AGENTS: AgentConfig[] = [
    {
        id: 'agent-1',
        name: 'Data Analyst',
        description: 'Python-enabled agent for CSV analysis.',
        systemPrompt: 'You are an expert data analyst. Use the python_repl tool to execute pandas code. Always visualize data when possible.',
        toolsSchema: '[\n  {\n    "type": "function",\n    "function": {\n      "name": "python_repl",\n      "description": "Executes python code",\n      "parameters": { "type": "object", "properties": { "code": { "type": "string" } } }\n    }\n  }\n]',
        envVars: [{ key: 'PANDAS_VERSION', value: '2.1.0' }],
        externalPaths: ['/scripts/analysis_utils.py'],
        lastModified: '2026-01-18 10:45 AM'
    },
    {
        id: 'agent-2',
        name: 'Search Assistant',
        description: 'General purpose assistant with web search capability.',
        systemPrompt: 'You are a helpful assistant. If you do not know the answer, use the search_tool to find it.',
        toolsSchema: '[\n  {\n    "type": "function",\n    "function": {\n      "name": "search_tool",\n      "description": "Searches the web",\n      "parameters": { "type": "object", "properties": { "query": { "type": "string" } } }\n    }\n  }\n]',
        envVars: [],
        externalPaths: [],
        lastModified: '2026-01-15 09:12 PM'
    }
];

const MOCK_BENCHMARKS: BenchmarkResult[] = [
  // Flash Attention Impact Test (2026-01-11)
  { id: 'b1', modelId: 'equall-saul-7b', versionId: 'v1-q4_k_m', dataset: 'Legal-FLSA', score: 100, latency: 10929, tokensPerSecond: 9.15, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Reliability', type: 'Core', notes: 'Baseline (Flash Attn OFF)' },
  { id: 'b2', modelId: 'equall-saul-7b', versionId: 'v1-q4_k_m', dataset: 'Legal-FLSA', score: 100, latency: 1530, tokensPerSecond: 65.36, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Reliability', type: 'Core', notes: 'Flash Attn ON (7.1x Speedup)' },

  // LFM2.5 Generation
  { id: 'b3', modelId: 'liquid-lfm-2.5-1.2b', versionId: 'v1-q5_k_m', dataset: 'Legal-Structure', score: 98, latency: 269, tokensPerSecond: 264.9, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT (Vulkan)', date: '2026-01-11', metric: 'JSON Validity', type: 'Core', notes: 'Structured Output' },
  
  // Pipeline Tests
  { 
      id: 'b4', 
      modelId: 'equall-saul-7b', 
      versionId: 'v1-q4_k_m', 
      dataset: 'Legal-Complex', 
      score: 95, 
      latency: 19610, 
      tokensPerSecond: 45, 
      hardware: 'GPU', 
      hardwareName: 'AMD RX 6700 XT', 
      date: '2026-01-11', 
      metric: 'Accuracy', 
      type: 'RAG', 
      notes: 'LFM2.5 Pipeline + Dual Embed',
      segments: [
          { stepId: 's1', stepName: 'PDF Ingestion', type: 'Custom', duration: 500 },
          { stepId: 's2', stepName: 'Hybrid Search (Chroma)', type: 'Retrieval', duration: 400 },
          { stepId: 's3', stepName: 'Reranking (ColBERT)', type: 'Retrieval', duration: 1200 },
          { stepId: 's4', stepName: 'Generation (Saul-7B)', type: 'Generation', duration: 17510 }
      ]
  },
  
  // Embeddings
  { id: 'b5', modelId: 'mixedbread-embed', versionId: 'v1-base', dataset: 'Legal-Docs-50', score: 100, latency: 76, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Retrieval Time', type: 'RAG', notes: 'Single Doc' },
  { id: 'b6', modelId: 'snowflake-arctic', versionId: 'v1-ollama', dataset: 'Legal-Docs-50', score: 100, latency: 68, hardware: 'GPU', hardwareName: 'AMD RX 6700 XT', date: '2026-01-11', metric: 'Retrieval Time', type: 'RAG', notes: 'Single Doc' },
];

const MOCK_DATASETS: Dataset[] = [
  { id: 'd1', name: 'Legal-Bench-FLSA', type: 'SFT', format: 'Alpaca', size: '1.2MB', rows: 50, description: '50 Node FLSA/ADA/Title VII Document set' },
  { id: 'd2', name: 'OpenHermes-2.5', type: 'SFT', format: 'ShareGPT', size: '1.6GB', rows: 1000000, description: 'General instruction tuning' },
  { id: 'd3', name: 'UltraFeedback-Binarized', type: 'DPO', format: 'ChatML', size: '450MB', rows: 60000, description: 'Preference pairs for alignment' },
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
        id: 'srv-webgpu',
        name: 'Browser WebGPU',
        type: 'WebGPU',
        path: 'ONNX Runtime Web',
        host: 'localhost',
        port: 0,
        os: 'Ubuntu',
        acceleration: 'WebGPU',
        startupFlags: 'enable-unsafe-webgpu',
        packages: ['onnxruntime-web'],
        compatibleModels: ['liquid-lfm-2.5-audio'],
        status: 'Offline'
    }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewState>('dashboard');
  const [servers, setServers] = useState<ServerProfile[]>(MOCK_SERVERS);
  const [agents, setAgents] = useState<AgentConfig[]>(MOCK_AGENTS);
  const [benchmarks, setBenchmarks] = useState<BenchmarkResult[]>(MOCK_BENCHMARKS);
  
  const handleUpdateServer = (updated: ServerProfile) => {
      setServers(servers.map(s => s.id === updated.id ? updated : s));
  };

  const handleDeleteServer = (id: string) => {
      setServers(servers.filter(s => s.id !== id));
  };

  const handleAddServer = (newServer: ServerProfile) => {
      setServers([...servers, newServer]);
  };

  const handleSaveAgent = (agent: AgentConfig) => {
      if (agents.find(a => a.id === agent.id)) {
          setAgents(agents.map(a => a.id === agent.id ? agent : a));
      } else {
          setAgents([...agents, agent]);
      }
  };

  const handleDeleteAgent = (id: string) => {
      setAgents(agents.filter(a => a.id !== id));
  };

  const handleAddBenchmark = (result: BenchmarkResult) => {
      setBenchmarks(prev => [result, ...prev]);
  };
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Eye size={18} /> },
    { id: 'benchmarks', label: 'Benchmarks', icon: <Activity size={18} /> },
    { id: 'datasets', label: 'Datasets', icon: <ClipboardDataIcon size={18} /> },
    { id: 'training', label: 'Training', icon: <Terminal size={18} /> }, 
    { id: 'notebooks', label: 'Notebooks', icon: <BookOpen size={18} /> },
    { id: 'laboratory', label: 'Laboratory', icon: <FlaskConical size={18} /> },
    { id: 'servers', label: 'Servers', icon: <PythonIcon size={18} /> },
    { id: 'models', label: 'Model Registry', icon: <BrainCircuit size={18} /> },
    { id: 'agents', label: 'Agentic Prompts', icon: <Bot size={18} /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={18} /> },
  ];

  const getPageTitle = (tab: ViewState) => {
      if (tab === 'agents') return 'Agentic Prompts';
      if (tab === 'models') return 'Model Registry';
      if (tab === 'chat') return 'Chat';
      return tab;
  };

  return (
    <div className="flex flex-col h-screen bg-nebula-950 text-nebula-100 font-sans overflow-hidden text-type-body selection:bg-purple-500/30">
      {/* Streamlined Top Header with Vertical Glassmorphism */}
      <header className="h-header bg-nebula-950/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-space-lg z-30 shrink-0 relative shadow-md">
          {/* Subtle gradient overlay, top-down only */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none opacity-20"></div>
          
          <div className="flex items-center gap-space-lg relative z-10">
               {/* Logo */}
              <div className="text-type-heading-md font-black tracking-widest text-white border-2 border-white/10 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(255,255,255,0.05)] bg-white/5">
                  R-AI
              </div>
              
              {/* Divider */}
              <div className="h-6 w-px bg-white/10 mx-2"></div>

              {/* Breadcrumb / Title */}
              <div className="flex items-center gap-space-md">
                  <h1 className="text-type-heading-sm font-semibold text-white capitalize tracking-wide drop-shadow-sm">{getPageTitle(activeTab)}</h1>
                  {activeTab === 'training' && <span className="text-type-tiny bg-purple-500/10 text-purple-300 px-2 py-1 rounded border border-purple-500/20 animate-pulse font-bold">Active Job: Llama-SFT-v1</span>}
              </div>
          </div>
          
          <div className="flex items-center gap-space-lg relative z-10">
              <div className="text-right hidden sm:block">
                  <p className="text-type-caption text-gray-500 font-bold uppercase tracking-wider">Environment</p>
                  <p className="text-type-body font-mono text-purple-300 text-xs">{SERVER_CONFIG.gpuType} • {SERVER_CONFIG.vramTotal}GB</p>
              </div>
              
              {/* Settings Button */}
              <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${activeTab === 'settings' ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(124,58,237,0.3)] active-glow' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10'}`}
                  title="Settings"
              >
                  <SettingsIcon size={18} />
              </button>
          </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with subtle verticality */}
        <aside className="w-sidebar bg-nebula-950/90 backdrop-blur-md border-r border-white/5 flex flex-col z-20">
          <nav className="flex-1 p-space-md space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ViewState)}
                className={`w-full flex items-center gap-space-md px-4 py-3 rounded text-type-body font-medium transition-all duration-200 relative group overflow-hidden ${
                  activeTab === item.id 
                    ? 'bg-white/5 text-purple-300 border-l-2 border-purple-500 active-glow' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                {/* Remove horizontal gradient, use soft glow instead */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 ${activeTab === item.id ? 'opacity-100' : ''}`}></div>
                
                <span className="relative z-10 flex items-center gap-space-md">
                    {item.icon}
                    {item.label}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-nebula-950 overflow-hidden relative">
          {/* Subtle top shadow inset for depth */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10"></div>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="w-full h-full flex flex-col">
              {activeTab === 'dashboard' && <Dashboard serverConfig={SERVER_CONFIG} />}
              {activeTab === 'benchmarks' && <Benchmarks results={benchmarks} models={MOCK_MODELS} servers={servers} />}
              {activeTab === 'datasets' && <Datasets datasets={MOCK_DATASETS} />}
              {activeTab === 'training' && <Training models={MOCK_MODELS} datasets={MOCK_DATASETS} />}
              {activeTab === 'notebooks' && <Notebooks />}
              {activeTab === 'laboratory' && <Laboratory models={MOCK_MODELS} />}
              {activeTab === 'servers' && <Servers servers={servers} models={MOCK_MODELS} onUpdateServer={handleUpdateServer} onDeleteServer={handleDeleteServer} onAddServer={handleAddServer} />}
              {activeTab === 'models' && <Models models={MOCK_MODELS} servers={servers} benchmarks={benchmarks} onAddBenchmark={handleAddBenchmark} />}
              {activeTab === 'agents' && <Agents agents={agents} onSaveAgent={handleSaveAgent} onDeleteAgent={handleDeleteAgent} />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'chat' && <Chat models={MOCK_MODELS} servers={servers} agents={agents} onUpdateServer={handleUpdateServer} />}
            </div>
          </div>
        </main>
      </div>

       {/* Full Width Footer with Glassmorphism */}
      <footer className="h-8 bg-nebula-950/80 backdrop-blur-md border-t border-white/5 flex items-center justify-between px-4 text-type-caption text-gray-500 select-none z-40 relative shadow-[0_-5px_15px_rgba(0,0,0,0.3)] w-full font-mono uppercase tracking-tighter">
            <div className="flex gap-space-md items-center">
                <span className="flex items-center gap-space-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-heartbeat shadow-[0_0_8px_#22c55e]"></span> 
                    <span className="opacity-70">System Online</span>
                </span>
                {SERVER_CONFIG.rocmEnabled && (
                  <span className="flex items-center gap-space-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500/50"></span>
                      <span className="text-gray-600">ROCm Active</span>
                  </span>
                )}
                <span className="flex items-center gap-space-xs opacity-50">GPU: 12%</span>
                <span className="flex items-center gap-space-xs opacity-50">VRAM: 8/12 GB</span>
            </div>
            
             {/* Global Loading Indicator */}
            <div className="flex items-center gap-space-sm text-purple-400 font-bold">
                <Loader2 size={12} className="animate-spin" />
                <span className="animate-pulse">Task Sync Active</span>
            </div>

            <div className="opacity-40 font-bold">
                v2.3.0-Nightly // REPLICATOR-AI
            </div>
      </footer>
    </div>
  );
};

export default App;
