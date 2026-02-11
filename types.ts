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
  };
}

export interface Model {
  id: string;
  name: string;
  provider: string; // e.g. "LiquidAI"
  family: 'Llama' | 'Mistral' | 'Gemma' | 'Liquid' | 'Bert' | 'Other';
  description: string;
  tags: string[]; // e.g., "ROCm Optimized", "Embedding"
  links: ModelLink[];
  versions: ModelVersion[];
  lastUsed: string;
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

export interface BenchmarkResult {
  id: string;
  modelId: string;
  versionId: string;
  dataset: string;
  score: number; // Primary metric
  latency: number; // ms
  hardware: 'CPU' | 'GPU' | 'NPU';
  hardwareName: string; // e.g. "AMD Radeon PRO W7900"
  date: string;
  metric: string; 
  type: 'Core' | 'RAG' | 'Custom';
  ragConfig?: RAGConfig;
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

export type ViewState = 'dashboard' | 'benchmarks' | 'datasets' | 'training' | 'laboratory' | 'models' | 'compute';
