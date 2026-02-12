
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, FolderOpen, Terminal } from 'lucide-react';

interface SettingsProps {
    initialSettings?: AppSettings;
}

const DEFAULT_SETTINGS: AppSettings = {
    directories: {
        ollamaPath: '/usr/local/bin/ollama',
        venvPytorch: '/home/user/venvs/torch-rocm',
        venvTransformers: '/home/user/venvs/transformers',
        mergeKitPath: '/home/user/git/MergeKit',
        distillKitPath: '/home/user/git/DistillKit',
        medusaPath: '/home/user/git/Medusa',
        adaptersDir: '/data/adapters',
        modelStore: '/data/models',
        blobStore: '/data/ollama/blobs',
        resultsDir: '/data/results',
        datasetsDir: '/data/datasets',
        agentsDir: '/data/agents'
    }
};

export const Settings: React.FC<SettingsProps> = ({ initialSettings = DEFAULT_SETTINGS }) => {
    const [settings, setSettings] = useState<AppSettings>(initialSettings);
    const [isSaved, setIsSaved] = useState(false);

    const updateDir = (key: keyof AppSettings['directories'], value: string) => {
        setSettings({
            ...settings,
            directories: {
                ...settings.directories,
                [key]: value
            }
        });
        setIsSaved(false);
    };

    const handleSave = () => {
        // Mock save
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="h-full overflow-y-auto p-space-lg custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
                <div className="flex justify-between items-center border-b border-nebula-800 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Terminal className="text-purple-500" />
                            Environment Configuration
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">Manage local paths for engines, virtual environments, and storage.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        className={`flex items-center gap-2 px-6 py-2 rounded font-bold transition-all ${isSaved ? 'bg-green-600 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)]'}`}
                    >
                        <Save size={18} />
                        {isSaved ? 'Configuration Saved' : 'Save Changes'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Runtimes & Venvs */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-bold text-purple-300 border-b border-nebula-800 pb-2">Executables & Environments</h3>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Ollama Binary Path</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.directories.ollamaPath}
                                    onChange={(e) => updateDir('ollamaPath', e.target.value)}
                                    className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                />
                                <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">PyTorch ROCm Venv</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.directories.venvPytorch}
                                    onChange={(e) => updateDir('venvPytorch', e.target.value)}
                                    className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                />
                                <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Transformers Venv</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.directories.venvTransformers}
                                    onChange={(e) => updateDir('venvTransformers', e.target.value)}
                                    className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                />
                                <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Libraries */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 space-y-6">
                        <h3 className="text-lg font-bold text-purple-300 border-b border-nebula-800 pb-2">Training Libraries</h3>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">MergeKit Path</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.directories.mergeKitPath}
                                    onChange={(e) => updateDir('mergeKitPath', e.target.value)}
                                    className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                />
                                <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">DistillKit Path</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.directories.distillKitPath}
                                    onChange={(e) => updateDir('distillKitPath', e.target.value)}
                                    className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                />
                                <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-gray-300">Medusa / FastDecode</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={settings.directories.medusaPath}
                                    onChange={(e) => updateDir('medusaPath', e.target.value)}
                                    className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                />
                                <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                            </div>
                        </div>
                    </div>

                    {/* Storage Configuration */}
                    <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-6 space-y-6 md:col-span-2">
                        <h3 className="text-lg font-bold text-purple-300 border-b border-nebula-800 pb-2">Storage Locations</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Model Zoo Directory</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={settings.directories.modelStore}
                                        onChange={(e) => updateDir('modelStore', e.target.value)}
                                        className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                    />
                                    <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Adapters (LoRA/SFT)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={settings.directories.adaptersDir}
                                        onChange={(e) => updateDir('adaptersDir', e.target.value)}
                                        className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                    />
                                    <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Ollama Blobs</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={settings.directories.blobStore}
                                        onChange={(e) => updateDir('blobStore', e.target.value)}
                                        className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                    />
                                    <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Results & Benchmarks Output</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={settings.directories.resultsDir}
                                        onChange={(e) => updateDir('resultsDir', e.target.value)}
                                        className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                    />
                                    <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Dataset Cache</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={settings.directories.datasetsDir}
                                        onChange={(e) => updateDir('datasetsDir', e.target.value)}
                                        className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                    />
                                    <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-300">Agents / Tools Directory</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={settings.directories.agentsDir}
                                        onChange={(e) => updateDir('agentsDir', e.target.value)}
                                        className="flex-1 bg-nebula-950 border border-nebula-800 rounded px-3 py-2 text-sm text-mono text-gray-200 focus:border-purple-500 outline-none"
                                    />
                                    <button className="p-2 bg-nebula-800 border border-nebula-700 rounded hover:text-white text-gray-400"><FolderOpen size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
