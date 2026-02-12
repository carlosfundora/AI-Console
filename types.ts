
export enum ModelStatus {
  Ready = 'Ready',
  Training = 'Training',
  Quantizing = 'Quantizing',
  Error = 'Error',
}

export interface ModelLink {
  type: 'HuggingFace' | 'GitHub' | 'Ollama' | 'Paper';
  url: string;
}

export interface ModelVersion {
  id: string;
  name: string; // e.g. "v1.0-SFT" or "Q4_K_M-GGUF"
  format: 'GGUF' | 'Safetensors' | 'Ollama' | 'ONNX' | 'Pytorch';
  quantization: string;
  size: string;
  created: string;
  baseModel: string;
  dataset?: string;
  status: ModelStatus;
  metrics?: {
    perplexity?: number;
    latencyMs?: number;
    accuracy?: number;
    vramGB?: number;
    tokensPerSecond?: number;
  };
}

export interface Model {
  id: string;
  name: string;
  provider: string; // e.g. "LiquidAI"
  family: 'Llama' | 'Mistral' | 'Gemma' | 'Liquid' | 'Bert' | 'Other';
  description: string;
  tags: string[]; // e.g., "ROCm Optimized", "Embedding"
  params: string; // e.g., "7B", "70B"
  tensorType: string; // e.g., "F16", "BF16", "Q8"
  links: ModelLink[];
  versions: ModelVersion[];
  lastUsed: string;
  documentation?: string; // Markdown content for model documentation
}

export interface ServerProfile {
  id: string;
  name: string;
  type: 'Venv' | 'Llama.cpp' | 'Ollama' | 'TGI' | 'TabbyAPI' | 'WebGPU';
  path: string; // Path to executable or venv activate script
  host: string;
  port: number;
  os: 'Windows' | 'Ubuntu' | 'MacOS';
  acceleration: 'ROCm' | 'Vulkan' | 'CUDA' | 'HYPR-RX' | 'CPU' | 'Metal' | 'WebGPU';
  startupFlags: string;
  packages: string[]; // e.g. ["torch==2.1.2+rocm5.6", "transformers"]
  compatibleModels: string[]; // List of Model IDs
  status: 'Online' | 'Offline' | 'Starting';
}

export interface RAGConfig {
  id: string;
  name: string;
  chunkingStrategy: 'Fixed' | 'Recursive' | 'Semantic';
  chunkSize: number;
  chunkOverlap: number;
  vectorStore: 'FAISS' | 'Pinecone' | 'ChromaDB' | 'Milvus';
  retrievalAlgo: 'Cosine' | 'MMR' | 'Hybrid' | 'BM25';
  k: number;
}

// Updated Tags based on requirements
export type BenchmarkStepType = 'Custom' | 'Retrieval' | 'Embedding' | 'Tool Calling' | 'Generation';

export interface BenchmarkStep {
    id: string;
    type: BenchmarkStepType;
    name: string;
    enabled: boolean;
    serverId?: string; // Specific server for this step
    modelId?: string; // Specific model for this step
    substeps?: BenchmarkStep[]; // For Phases containing other steps
    config: {
        datasetId?: string;
        // Generic params for the tag types
        chunkSize?: number;
        overlap?: number;
        vectorStore?: string;
        rerankTopK?: number;
        toolSchemaUrl?: string;
        metric?: 'ExactMatch' | 'Semantic' | 'FunctionCallValidity' | 'Throughput';
        sourcePath?: string;
        docType?: 'PDF' | 'Markdown' | 'HTML';
    };
}

export interface AdvancedBenchmarkConfig {
  id: string;
  name: string;
  backend: 'llama.cpp (Vulkan)' | 'llama-python' | 'ollama' | 'pytest' | 'transformers' | 'torch-directml';
  modelId: string; // Default model if not overridden in step
  versionId?: string; 
  hardware: 'GPU' | 'CPU' | 'Dual-GPU';
  scriptPath?: string; // Path to the executable test script
  
  parameters: {
      contextSize: number;
      temperature: number;
      gpuLayers?: number; // -ngl
      threads?: number;
      flashAttention: boolean; // --flash-attn
      memoryLock: boolean; // --mlock
      continuousBatching: boolean; // --cont-batching
      keepAlive?: string; // "5m"
      warmup: boolean; // Preload/Warmup
  };

  steps: BenchmarkStep[]; // Dynamic Pipeline
  
  customEnvPath?: string;
}

export interface BenchmarkSegmentResult {
    stepId: string;
    stepName: string;
    type: BenchmarkStepType;
    duration: number; // ms
    score?: number;
    notes?: string;
}

export interface BenchmarkResult {
  id: string;
  modelId: string;
  versionId: string;
  dataset: string;
  score: number; // Primary metric
  latency: number; // ms
  tokensPerSecond?: number; // New throughput metric
  hardware: 'CPU' | 'GPU' | 'NPU';
  hardwareName: string; // e.g. "AMD Radeon PRO W7900"
  date: string;
  metric: string; 
  type: 'Core' | 'RAG' | 'Custom';
  ragConfig?: RAGConfig;
  advancedConfigId?: string;
  notes?: string; // e.g. "Flash Attn ON"
  segments?: BenchmarkSegmentResult[]; // Granular breakdown
}

export interface Dataset {
  id: string;
  name: string;
  type: 'SFT' | 'DPO' | 'Pretrain';
  size: string; 
  rows: number;
  description: string;
}

export interface ServerConfig {
  gpuType: string;
  count: number;
  vramTotal: number;
  provider: 'AWS' | 'GCP' | 'Local' | 'Lambda';
  rocmEnabled: boolean;
}

export interface LabArtifact {
    id: string;
    type: 'Tokenizer' | 'Adapter' | 'MedusaHead' | 'ModelShard';
    name: string;
    sourceModel: string;
    size: string;
    created: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  toolsSchema: string; // JSON string representing the tools array
  envVars: { key: string; value: string }[];
  externalPaths: string[];
  lastModified: string;
}

export interface MockDataSource {
    id: string;
    name: string;
    type: 'PDF' | 'Prompt' | 'SQL';
    size?: string;
    path?: string;
    date: string;
}

export interface AppSettings {
    directories: {
        ollamaPath: string;
        venvPytorch: string;
        venvTransformers: string;
        mergeKitPath: string;
        distillKitPath: string;
        medusaPath: string;
        adaptersDir: string;
        modelStore: string;
        blobStore: string;
        resultsDir: string;
        datasetsDir: string;
        agentsDir: string;
    }
}

export type ViewState = 'dashboard' | 'benchmarks' | 'datasets' | 'training' | 'laboratory' | 'models' | 'servers' | 'chat' | 'settings' | 'agents';
