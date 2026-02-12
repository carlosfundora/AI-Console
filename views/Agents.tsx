
import React, { useState, useEffect } from 'react';
import { AgentConfig } from '../types';
import { Briefcase, Code, Plus, Save, Trash2, Key, FolderOpen, Bot, FileJson, X, Globe, Database, CheckCircle, Clock, Copy } from 'lucide-react';

interface AgentsProps {
    agents: AgentConfig[];
    onSaveAgent: (agent: AgentConfig) => void;
    onDeleteAgent: (id: string) => void;
}

const EMPTY_AGENT: AgentConfig = {
    id: '',
    name: 'New Agent',
    description: '',
    systemPrompt: '',
    toolsSchema: '[]',
    envVars: [],
    externalPaths: [],
    lastModified: new Date().toISOString().split('T')[0]
};

const TOOL_TEMPLATES = {
    search: `[
  {
    "type": "function",
    "function": {
      "name": "web_search",
      "description": "Search the internet for real-time information.",
      "parameters": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "The search keywords"
          }
        },
        "required": ["query"]
      }
    }
  }
]`,
    code: `[
  {
    "type": "function",
    "function": {
      "name": "python_interpreter",
      "description": "Execute python code to analyze data or solve math problems.",
      "parameters": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "Valid python code snippet"
          }
        },
        "required": ["code"]
      }
    }
  }
]`,
    api: `[
  {
    "type": "function",
    "function": {
      "name": "get_stock_price",
      "description": "Get the current stock price for a given ticker symbol.",
      "parameters": {
        "type": "object",
        "properties": {
          "ticker": {
            "type": "string",
            "description": "The stock ticker symbol, e.g. AAPL"
          }
        },
        "required": ["ticker"]
      }
    }
  }
]`
};

export const Agents: React.FC<AgentsProps> = ({ agents, onSaveAgent, onDeleteAgent }) => {
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [currentAgent, setCurrentAgent] = useState<AgentConfig>(EMPTY_AGENT);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

    const handleSelectAgent = (agent: AgentConfig) => {
        setSelectedAgentId(agent.id);
        setCurrentAgent({ ...agent });
        setSaveStatus('idle');
    };

    const handleCreateNew = () => {
        const newAgent = { ...EMPTY_AGENT, id: `agent-${Date.now()}` };
        setCurrentAgent(newAgent);
        setSelectedAgentId(newAgent.id);
        setSaveStatus('idle');
    };

    const handleSave = () => {
        // Precise timestamp update
        const now = new Date();
        const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        
        const updatedAgent = { 
            ...currentAgent, 
            lastModified: timestamp 
        };
        
        setCurrentAgent(updatedAgent);
        onSaveAgent(updatedAgent);
        
        // Visual feedback
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
    };

    const handleDelete = () => {
        if (selectedAgentId && confirm('Delete this agent permanentely?')) {
            onDeleteAgent(selectedAgentId);
            setSelectedAgentId(null);
            setCurrentAgent(EMPTY_AGENT);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const addEnvVar = () => {
        setCurrentAgent({
            ...currentAgent,
            envVars: [...currentAgent.envVars, { key: '', value: '' }]
        });
    };

    const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
        const newEnv = [...currentAgent.envVars];
        newEnv[index][field] = val;
        setCurrentAgent({ ...currentAgent, envVars: newEnv });
    };

    const removeEnvVar = (index: number) => {
        const newEnv = currentAgent.envVars.filter((_, i) => i !== index);
        setCurrentAgent({ ...currentAgent, envVars: newEnv });
    };

    const addPath = () => {
        setCurrentAgent({
            ...currentAgent,
            externalPaths: [...currentAgent.externalPaths, '']
        });
    };

    const updatePath = (index: number, val: string) => {
        const newPaths = [...currentAgent.externalPaths];
        newPaths[index] = val;
        setCurrentAgent({ ...currentAgent, externalPaths: newPaths });
    };

    const removePath = (index: number) => {
        const newPaths = currentAgent.externalPaths.filter((_, i) => i !== index);
        setCurrentAgent({ ...currentAgent, externalPaths: newPaths });
    };

    const loadTemplate = (type: keyof typeof TOOL_TEMPLATES) => {
        if (currentAgent.toolsSchema && currentAgent.toolsSchema !== '[]' && currentAgent.toolsSchema.length > 5) {
            if (!confirm('This will overwrite the current tool definitions. Continue?')) return;
        }
        setCurrentAgent({ ...currentAgent, toolsSchema: TOOL_TEMPLATES[type] });
    };

    return (
        <div className="flex h-full gap-space-lg animate-fade-in p-space-lg overflow-hidden">
            {/* Sidebar List */}
            <div className="w-72 flex flex-col gap-space-md bg-nebula-900 border border-nebula-700 rounded-xl p-space-md shadow-lg shrink-0 overflow-hidden">
                <div className="flex justify-between items-center border-b border-nebula-800 pb-4 shrink-0">
                    <h3 className="font-bold text-gray-200 flex items-center gap-space-sm text-type-body">
                        <Bot className="text-purple-500" /> Agents & Tools
                    </h3>
                    <button 
                        onClick={handleCreateNew} 
                        className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors shadow-lg shadow-purple-500/20"
                        title="Create New Agent"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-space-sm custom-scrollbar pr-1">
                    {agents.length === 0 && (
                        <div className="text-type-body text-gray-500 text-center py-8 italic">No agents defined.</div>
                    )}
                    {agents.map(agent => (
                        <div 
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent)}
                            className={`p-space-sm rounded-lg cursor-pointer border transition-all ${
                                selectedAgentId === agent.id 
                                ? 'bg-purple-900/30 border-purple-500 text-white shadow-inner' 
                                : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:border-purple-500/30 hover:text-gray-200'
                            }`}
                        >
                            <div className="font-bold text-type-body truncate">{agent.name}</div>
                            <div className="flex justify-between items-center mt-1">
                                <div className="text-[10px] opacity-60 truncate w-32">{agent.description || 'No description'}</div>
                                <div className="text-[9px] font-mono opacity-40 flex items-center gap-1"><Clock size={8}/> {agent.lastModified.split(' ')[0]}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
                {selectedAgentId ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-space-md border-b border-nebula-800 flex justify-between items-center bg-nebula-950/50 shrink-0">
                            <div className="flex-1 mr-4">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={currentAgent.name} 
                                        onChange={(e) => setCurrentAgent({...currentAgent, name: e.target.value})}
                                        className="bg-transparent text-type-heading-md font-bold text-white outline-none w-full placeholder-gray-600 focus:text-purple-300 transition-colors"
                                        placeholder="Agent Name"
                                    />
                                </div>
                                <div className="flex items-center gap-3 mt-1">
                                    <input 
                                        type="text" 
                                        value={currentAgent.description} 
                                        onChange={(e) => setCurrentAgent({...currentAgent, description: e.target.value})}
                                        className="bg-transparent text-type-caption text-gray-400 outline-none flex-1 placeholder-gray-600"
                                        placeholder="Capability description..."
                                    />
                                    <div className="text-[10px] text-gray-600 flex items-center gap-1 font-mono uppercase tracking-tighter">
                                        <Clock size={10}/> Last modified: {currentAgent.lastModified}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-space-sm items-center">
                                {saveStatus === 'saved' && (
                                    <span className="text-green-400 text-xs font-bold flex items-center gap-1 animate-fade-in">
                                        <CheckCircle size={14}/> Changes Saved
                                    </span>
                                )}
                                <button 
                                    onClick={handleDelete}
                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/10 rounded transition-all"
                                    title="Delete Agent"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className={`px-6 py-2 rounded text-type-body font-bold flex items-center gap-space-sm shadow-lg transition-all ${
                                        saveStatus === 'saved' 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-purple-500/20'
                                    }`}
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-space-lg space-y-space-lg custom-scrollbar">
                            
                            {/* System Prompt */}
                            <div className="space-y-space-xs">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-type-tiny uppercase text-purple-400 font-bold flex items-center gap-space-sm tracking-widest">
                                        <Briefcase size={14} /> System Directives
                                    </label>
                                    <button 
                                        onClick={() => copyToClipboard(currentAgent.systemPrompt)}
                                        className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 uppercase font-bold"
                                    >
                                        <Copy size={10}/> Copy
                                    </button>
                                </div>
                                <textarea 
                                    value={currentAgent.systemPrompt}
                                    onChange={(e) => setCurrentAgent({...currentAgent, systemPrompt: e.target.value})}
                                    className="w-full h-44 bg-nebula-950 border border-nebula-800 rounded-xl p-space-md text-type-body text-gray-300 focus:border-purple-500/50 outline-none font-mono leading-relaxed resize-none shadow-inner"
                                    placeholder="You are a specialized AI agent..."
                                />
                            </div>

                            {/* Tools Schema */}
                            <div className="space-y-space-xs">
                                <div className="flex justify-between items-end mb-space-xs">
                                    <label className="text-type-tiny uppercase text-purple-400 font-bold flex items-center gap-space-sm tracking-widest">
                                        <FileJson size={14} /> Tools Payload (JSON)
                                    </label>
                                    <div className="flex items-center gap-space-sm">
                                        <span className="text-type-tiny text-gray-500 uppercase font-black tracking-widest opacity-50">Templates:</span>
                                        <div className="flex gap-1">
                                            <button onClick={() => loadTemplate('search')} className="text-[10px] bg-nebula-950 border border-nebula-800 hover:border-purple-500 px-2 py-0.5 rounded text-gray-400 hover:text-white transition-all">Search</button>
                                            <button onClick={() => loadTemplate('code')} className="text-[10px] bg-nebula-950 border border-nebula-800 hover:border-purple-500 px-2 py-0.5 rounded text-gray-400 hover:text-white transition-all">Python</button>
                                            <button onClick={() => loadTemplate('api')} className="text-[10px] bg-nebula-950 border border-nebula-800 hover:border-purple-500 px-2 py-0.5 rounded text-gray-400 hover:text-white transition-all">Finance</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group/json">
                                    <textarea 
                                        value={currentAgent.toolsSchema}
                                        onChange={(e) => setCurrentAgent({...currentAgent, toolsSchema: e.target.value})}
                                        className="w-full h-56 bg-nebula-950 border border-nebula-800 rounded-xl p-space-md text-xs text-green-400/80 focus:border-purple-500/50 outline-none font-mono resize-none shadow-inner"
                                        spellCheck={false}
                                    />
                                    <div className="absolute top-2 right-2 text-[10px] text-gray-600 bg-nebula-900 border border-nebula-800 px-2 py-1 rounded font-bold uppercase pointer-events-none group-hover/json:text-purple-400 transition-colors">JSON Schema</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-lg">
                                {/* Environment Variables */}
                                <div className="bg-nebula-950/40 border border-nebula-800/60 rounded-xl p-space-md shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex items-center gap-space-sm tracking-widest">
                                            <Key size={14} className="text-orange-400" /> Environment
                                        </label>
                                        <button onClick={addEnvVar} className="text-[10px] bg-nebula-900 hover:bg-purple-600 px-2 py-1 rounded text-purple-400 hover:text-white border border-nebula-700 font-bold uppercase transition-all">
                                            + Add Var
                                        </button>
                                    </div>
                                    <div className="space-y-space-sm max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                        {currentAgent.envVars.map((env, i) => (
                                            <div key={i} className="flex gap-space-sm items-center group/var animate-fade-in">
                                                <input 
                                                    placeholder="KEY" 
                                                    value={env.key}
                                                    onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-800 rounded-lg px-2.5 py-1.5 text-type-caption text-gray-300 outline-none focus:border-orange-500/50 font-mono shadow-inner"
                                                />
                                                <input 
                                                    placeholder="VALUE" 
                                                    value={env.value}
                                                    onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-800 rounded-lg px-2.5 py-1.5 text-type-caption text-gray-300 outline-none focus:border-orange-500/50 font-mono shadow-inner"
                                                />
                                                <button onClick={() => removeEnvVar(i)} className="text-gray-600 hover:text-red-400 p-1">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {currentAgent.envVars.length === 0 && <div className="text-type-caption text-gray-600 italic text-center py-4 opacity-50">No environment variables.</div>}
                                    </div>
                                </div>

                                {/* External Paths */}
                                <div className="bg-nebula-950/40 border border-nebula-800/60 rounded-xl p-space-md shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex items-center gap-space-sm tracking-widest">
                                            <FolderOpen size={14} className="text-blue-400" /> File Context
                                        </label>
                                        <button onClick={addPath} className="text-[10px] bg-nebula-900 hover:bg-blue-600 px-2 py-1 rounded text-blue-400 hover:text-white border border-nebula-700 font-bold uppercase transition-all">
                                            + Add Path
                                        </button>
                                    </div>
                                    <div className="space-y-space-sm max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                        {currentAgent.externalPaths.map((path, i) => (
                                            <div key={i} className="flex gap-space-sm items-center animate-fade-in">
                                                <input 
                                                    placeholder="/path/to/script.py..." 
                                                    value={path}
                                                    onChange={(e) => updatePath(i, e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-800 rounded-lg px-2.5 py-1.5 text-type-caption text-gray-300 outline-none focus:border-blue-500/50 font-mono shadow-inner"
                                                />
                                                <button onClick={() => removePath(i)} className="text-gray-600 hover:text-red-400 p-1">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {currentAgent.externalPaths.length === 0 && <div className="text-type-caption text-gray-600 italic text-center py-4 opacity-50">No external paths linked.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-40">
                        <div className="relative mb-6">
                            <Bot size={80} className="text-nebula-700" />
                            <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-10"></div>
                        </div>
                        <p className="text-type-heading-sm font-bold uppercase tracking-[0.2em]">Agent Selection Required</p>
                        <p className="text-xs mt-2 opacity-60">Choose a prototype from the list or deploy a new instance.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
