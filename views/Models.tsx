import React, { useState } from 'react';
import { Model, ModelVersion } from '../types';
import { GitBranch, Box, FileCode, Tag, ExternalLink, Cpu, Terminal } from 'lucide-react';

interface ModelsProps {
  models: Model[];
}

export const Models: React.FC<ModelsProps> = ({ models }) => {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🤖 Model Registry</h2>
        <div className="flex gap-2">
             <input type="text" placeholder="Search models..." className="bg-nebula-900 border border-nebula-700 rounded-lg px-4 py-2 text-sm outline-none text-white focus:border-purple-500 min-w-[300px]" />
             <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-500 flex items-center gap-2">
                <span>+</span> Import HF
             </button>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Model List/Grid */}
        <div className={`flex-1 overflow-y-auto ${selectedModel ? 'hidden lg:block lg:w-1/2' : 'w-full'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {models.map(model => (
                    <div 
                        key={model.id} 
                        onClick={() => setSelectedModel(model)}
                        className={`bg-nebula-900 border ${selectedModel?.id === model.id ? 'border-purple-500' : 'border-nebula-700'} rounded-xl p-5 hover:border-purple-500/50 transition-all cursor-pointer group relative overflow-hidden`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs bg-nebula-800 text-purple-300 px-2 py-1 rounded border border-nebula-700">{model.provider}</span>
                            <span className="text-gray-500 text-xs font-mono">{model.versions.length} versions</span>
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">{model.name}</h3>
                        <p className="text-xs text-gray-400 mb-4 line-clamp-2">{model.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            {model.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-nebula-950 border border-nebula-800 text-gray-400">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-nebula-800">
                             <div className="flex items-center gap-1">
                                <GitBranch size={14} />
                                {model.versions[0]?.format || 'Unknown'}
                             </div>
                             <div className="flex items-center gap-1">
                                <Box size={14} />
                                {model.versions[0]?.size || 'Unknown'}
                             </div>
                        </div>
                    </div>
                ))}
                
                 {/* Add New Placeholder */}
                <div className="border-2 border-dashed border-nebula-800 rounded-xl p-5 flex flex-col items-center justify-center text-gray-600 hover:text-purple-400 hover:border-purple-500/30 transition-all cursor-pointer min-h-[200px]">
                    <span className="text-4xl mb-2">+</span>
                    <span className="font-medium">Connect Repo</span>
                </div>
             </div>
        </div>

        {/* Model Detail & Versions View */}
        {selectedModel && (
            <div className="w-full lg:w-1/2 bg-nebula-900 border border-nebula-700 rounded-xl flex flex-col overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-nebula-800 bg-nebula-950/30">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedModel.name}</h2>
                            <p className="text-purple-400 text-sm">{selectedModel.provider} • {selectedModel.family}</p>
                        </div>
                        <button onClick={() => setSelectedModel(null)} className="lg:hidden text-gray-400 hover:text-white">Close</button>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4">{selectedModel.description}</p>
                    
                    <div className="flex flex-wrap gap-3">
                        {selectedModel.links.map((link, i) => (
                            <a 
                                key={i} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-nebula-800 hover:bg-nebula-700 border border-nebula-700 px-3 py-1.5 rounded-md text-xs transition-colors"
                            >
                                <ExternalLink size={12} />
                                {link.type}
                            </a>
                        ))}
                        <button className="flex items-center gap-2 bg-nebula-800 hover:bg-nebula-700 border border-nebula-700 px-3 py-1.5 rounded-md text-xs transition-colors text-gray-400">
                            + Add Link
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <GitBranch size={18} className="text-purple-500" />
                            Version History
                        </h3>
                        <div className="flex gap-2 text-xs">
                             <span className="px-2 py-1 bg-green-900/20 text-green-400 border border-green-500/30 rounded">ROCm Ready</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {selectedModel.versions.map((ver) => (
                            <div key={ver.id} className="bg-nebula-950 border border-nebula-800 rounded-lg p-4 hover:border-purple-500/30 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-nebula-900 rounded text-purple-400">
                                            {ver.format === 'GGUF' ? <Box size={16} /> : ver.format === 'Ollama' ? <Terminal size={16} /> : <FileCode size={16} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-gray-200">{ver.name}</h4>
                                            <p className="text-[10px] text-gray-500 font-mono">{ver.id} • {ver.created}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-0.5 rounded ${ver.status === 'Ready' ? 'bg-green-900/30 text-green-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                                            {ver.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 bg-nebula-900/50 p-3 rounded mb-3">
                                    <div>
                                        <span className="block text-gray-600">Quantization</span>
                                        <span className="font-mono text-gray-300">{ver.quantization}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-600">Size</span>
                                        <span className="font-mono text-gray-300">{ver.size}</span>
                                    </div>
                                    {ver.metrics && (
                                        <>
                                            <div>
                                                <span className="block text-gray-600">Latency (GPU)</span>
                                                <span className="font-mono text-gray-300">{ver.metrics.latencyMs} ms</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-600">VRAM</span>
                                                <span className="font-mono text-gray-300">{ver.metrics.vramGB} GB</span>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button className="flex-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-600/30 py-1.5 rounded text-xs transition-colors">
                                        Load
                                    </button>
                                    <button className="flex-1 bg-nebula-800 hover:bg-nebula-700 text-gray-300 border border-nebula-700 py-1.5 rounded text-xs transition-colors">
                                        Compare
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};