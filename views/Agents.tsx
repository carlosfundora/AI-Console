
import React, { useState } from 'react';
import { AgentConfig } from '../types';
import { Briefcase, Code, Plus, Save, Trash2, Key, FolderOpen, Bot, FileJson, X, Globe, Database } from 'lucide-react';

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

    const handleSelectAgent = (agent: AgentConfig) => {
        setSelectedAgentId(agent.id);
        setCurrentAgent({ ...agent });
    };

    const handleCreateNew = () => {
        const newAgent = { ...EMPTY_AGENT, id: `agent-${Date.now()}` };
        setCurrentAgent(newAgent);
        setSelectedAgentId(newAgent.id);
    };

    const handleSave = () => {
        onSaveAgent({ ...currentAgent, lastModified: new Date().toISOString().split('T')[0] });
    };

    const handleDelete = () => {
        if (selectedAgentId) {
            onDeleteAgent(selectedAgentId);
            setSelectedAgentId(null);
            setCurrentAgent(EMPTY_AGENT);
        }
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
                        className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
                        title="Create New Agent"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-space-sm custom-scrollbar">
                    {agents.length === 0 && (
                        <div className="text-type-body text-gray-500 text-center py-8 italic">No agents defined.</div>
                    )}
                    {agents.map(agent => (
                        <div 
                            key={agent.id}
                            onClick={() => handleSelectAgent(agent)}
                            className={`p-space-sm rounded-lg cursor-pointer border transition-all ${
                                selectedAgentId === agent.id 
                                ? 'bg-purple-900/30 border-purple-500 text-white' 
                                : 'bg-nebula-950 border-nebula-800 text-gray-400 hover:border-purple-500/30 hover:text-gray-200'
                            }`}
                        >
                            <div className="font-bold text-type-body truncate">{agent.name}</div>
                            <div className="text-type-tiny opacity-70 mt-1 truncate">{agent.description || 'No description'}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl flex flex-col overflow-hidden">
                {selectedAgentId ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-space-md border-b border-nebula-800 flex justify-between items-center bg-nebula-950/50 shrink-0">
                            <div className="flex-1 mr-4">
                                <input 
                                    type="text" 
                                    value={currentAgent.name} 
                                    onChange={(e) => setCurrentAgent({...currentAgent, name: e.target.value})}
                                    className="bg-transparent text-type-heading-md font-bold text-white outline-none w-full placeholder-gray-600"
                                    placeholder="Agent Name"
                                />
                                <input 
                                    type="text" 
                                    value={currentAgent.description} 
                                    onChange={(e) => setCurrentAgent({...currentAgent, description: e.target.value})}
                                    className="bg-transparent text-type-caption text-gray-400 outline-none w-full mt-1 placeholder-gray-600"
                                    placeholder="Short description of the agent's capability..."
                                />
                            </div>
                            <div className="flex gap-space-sm">
                                <button 
                                    onClick={handleDelete}
                                    className="px-3 py-2 text-red-400 hover:bg-red-900/20 rounded text-type-body transition-colors border border-transparent hover:border-red-900/50"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button 
                                    onClick={handleSave}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded text-type-body font-bold flex items-center gap-space-sm shadow-lg transition-colors"
                                >
                                    <Save size={16} /> Save Agent
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-space-lg space-y-space-lg custom-scrollbar">
                            
                            {/* System Prompt */}
                            <div className="space-y-space-xs">
                                <label className="text-type-tiny uppercase text-purple-400 font-bold flex items-center gap-space-sm">
                                    <Briefcase size={14} /> System Prompt / Instructions
                                </label>
                                <textarea 
                                    value={currentAgent.systemPrompt}
                                    onChange={(e) => setCurrentAgent({...currentAgent, systemPrompt: e.target.value})}
                                    className="w-full h-40 bg-nebula-950 border border-nebula-800 rounded-lg p-space-md text-type-body text-gray-300 focus:border-purple-500 outline-none font-mono leading-relaxed resize-none"
                                    placeholder="You are a helpful assistant..."
                                />
                            </div>

                            {/* Tools Schema */}
                            <div className="space-y-space-xs">
                                <div className="flex justify-between items-end mb-space-xs">
                                    <label className="text-type-tiny uppercase text-purple-400 font-bold flex items-center gap-space-sm">
                                        <FileJson size={14} /> Tool Definitions (JSON Schema)
                                    </label>
                                    <div className="flex items-center gap-space-sm">
                                        <span className="text-type-tiny text-gray-500 uppercase font-bold tracking-wider">Examples:</span>
                                        <button 
                                            onClick={() => loadTemplate('search')}
                                            className="text-type-tiny bg-nebula-950 border border-nebula-800 hover:border-purple-500 hover:text-white px-2 py-1 rounded text-gray-400 transition-all flex items-center gap-1"
                                        >
                                            <Globe size={10} /> Web Search
                                        </button>
                                        <button 
                                            onClick={() => loadTemplate('code')}
                                            className="text-type-tiny bg-nebula-950 border border-nebula-800 hover:border-purple-500 hover:text-white px-2 py-1 rounded text-gray-400 transition-all flex items-center gap-1"
                                        >
                                            <Code size={10} /> Python Exec
                                        </button>
                                        <button 
                                            onClick={() => loadTemplate('api')}
                                            className="text-type-tiny bg-nebula-950 border border-nebula-800 hover:border-purple-500 hover:text-white px-2 py-1 rounded text-gray-400 transition-all flex items-center gap-1"
                                        >
                                            <Database size={10} /> API Fetch
                                        </button>
                                    </div>
                                </div>
                                <div className="relative">
                                    <textarea 
                                        value={currentAgent.toolsSchema}
                                        onChange={(e) => setCurrentAgent({...currentAgent, toolsSchema: e.target.value})}
                                        className="w-full h-48 bg-nebula-950 border border-nebula-800 rounded-lg p-space-md text-xs text-green-400 focus:border-purple-500 outline-none font-mono resize-none"
                                        spellCheck={false}
                                    />
                                    <div className="absolute top-2 right-2 text-type-tiny text-gray-600 bg-nebula-900 px-2 py-1 rounded">JSON</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-lg">
                                {/* Environment Variables */}
                                <div className="bg-nebula-950/50 border border-nebula-800 rounded-lg p-space-md">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex items-center gap-space-sm">
                                            <Key size={14} /> Environment Variables
                                        </label>
                                        <button onClick={addEnvVar} className="text-type-tiny bg-nebula-900 hover:bg-nebula-800 px-2 py-1 rounded text-purple-400 border border-nebula-700">
                                            + Add Var
                                        </button>
                                    </div>
                                    <div className="space-y-space-sm max-h-40 overflow-y-auto custom-scrollbar">
                                        {currentAgent.envVars.map((env, i) => (
                                            <div key={i} className="flex gap-space-sm">
                                                <input 
                                                    placeholder="KEY" 
                                                    value={env.key}
                                                    onChange={(e) => updateEnvVar(i, 'key', e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-1.5 text-type-caption text-gray-300 outline-none focus:border-purple-500 font-mono"
                                                />
                                                <input 
                                                    placeholder="VALUE" 
                                                    value={env.value}
                                                    onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-1.5 text-type-caption text-gray-300 outline-none focus:border-purple-500 font-mono"
                                                />
                                                <button onClick={() => removeEnvVar(i)} className="text-gray-500 hover:text-red-400 px-1">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {currentAgent.envVars.length === 0 && <div className="text-type-caption text-gray-600 italic">No environment variables defined.</div>}
                                    </div>
                                </div>

                                {/* External Paths */}
                                <div className="bg-nebula-950/50 border border-nebula-800 rounded-lg p-space-md">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-type-tiny uppercase text-gray-500 font-bold flex items-center gap-space-sm">
                                            <FolderOpen size={14} /> External Paths / Includes
                                        </label>
                                        <button onClick={addPath} className="text-type-tiny bg-nebula-900 hover:bg-nebula-800 px-2 py-1 rounded text-purple-400 border border-nebula-700">
                                            + Add Path
                                        </button>
                                    </div>
                                    <div className="space-y-space-sm max-h-40 overflow-y-auto custom-scrollbar">
                                        {currentAgent.externalPaths.map((path, i) => (
                                            <div key={i} className="flex gap-space-sm">
                                                <input 
                                                    placeholder="/path/to/script.py or ./config/" 
                                                    value={path}
                                                    onChange={(e) => updatePath(i, e.target.value)}
                                                    className="flex-1 bg-nebula-900 border border-nebula-700 rounded p-1.5 text-type-caption text-gray-300 outline-none focus:border-purple-500 font-mono"
                                                />
                                                <button onClick={() => removePath(i)} className="text-gray-500 hover:text-red-400 px-1">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {currentAgent.externalPaths.length === 0 && <div className="text-type-caption text-gray-600 italic">No external paths linked.</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <Bot size={64} className="mb-4" />
                        <p>Select an agent to edit or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
