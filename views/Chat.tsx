
import React, { useState, useRef, useEffect } from 'react';
import { Model, ServerProfile, AgentConfig } from '../types';
import { Send, Bot, User, Cpu, Zap, Eraser, MessageSquare, Power, Loader2, CircleCheck, CircleAlert, Server, Mic, MicOff, Volume2, Box, BrainCircuit, Activity, Layers, Thermometer, Briefcase } from 'lucide-react';

interface ChatProps {
    models: Model[];
    servers: ServerProfile[];
    agents?: AgentConfig[];
    onUpdateServer: (server: ServerProfile) => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const MessageItem = React.memo(({ msg }: { msg: Message }) => (
    <div className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
            {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            msg.role === 'user'
            ? 'bg-blue-900/30 border border-blue-500/30 text-blue-100 rounded-tr-none'
            : 'bg-nebula-900 border border-nebula-700 text-gray-200 rounded-tl-none'
        }`}>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            <div className="text-[10px] opacity-40 mt-1 text-right">
                {msg.timestamp.toLocaleTimeString()}
            </div>
        </div>
    </div>
));

export const Chat: React.FC<ChatProps> = React.memo(({ models, servers, agents = [], onUpdateServer }) => {
    const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || '');
    const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Audio State
    const [isAudioMode, setIsAudioMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const selectedServer = servers.find(s => s.id === selectedServerId) || servers[0];
    const selectedModel = models.find(m => m.id === selectedModelId);
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    // Persistence Effect
    useEffect(() => {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Convert timestamp strings back to Date objects
                const hydrated = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                setMessages(hydrated);
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        } else {
             setMessages([{ id: '1', role: 'assistant', content: 'System initialized. Connect to a server to begin.', timestamp: new Date() }]);
        }
    }, []);

    // Save on Change Effect
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        }
    }, [messages]);

    // When agent changes, announce it
    useEffect(() => {
        if (selectedAgent) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: ` Loaded Agent Preset: **${selectedAgent.name}**\n\nSystem Prompt: _"${selectedAgent.systemPrompt.substring(0, 50)}..."_\nTools: ${selectedAgent.toolsSchema.length > 2 ? 'Enabled' : 'None'}`,
                timestamp: new Date()
            }]);
        }
    }, [selectedAgentId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleLaunch = () => {
        if (!selectedServer) return;
        // Optimistic update for launching simulation
        onUpdateServer({ ...selectedServer, status: 'Starting' });
        
        // Simulating WebGPU Load time if applicable
        const loadTime = selectedServer.type === 'WebGPU' ? 4000 : 2500;
        
        setTimeout(() => {
            onUpdateServer({ ...selectedServer, status: 'Online' });
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Server ${selectedServer.name} is now Online. Loaded model: ${selectedModel?.name || 'Default'}.`,
                timestamp: new Date()
            }]);
        }, loadTime);
    };

    const streamText = (fullText: string) => {
        const msgId = (Date.now() + 1).toString();
        // Create empty placeholder message
        setMessages(prev => [...prev, {
            id: msgId,
            role: 'assistant',
            content: '',
            timestamp: new Date()
        }]);
        
        setIsTyping(true);
        
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex >= fullText.length) {
                clearInterval(interval);
                setIsTyping(false);
                return;
            }
            
            const nextChar = fullText[currentIndex];
            setMessages(prev => prev.map(m => 
                m.id === msgId ? { ...m, content: m.content + nextChar } : m
            ));
            currentIndex++;
        }, 50); // 50ms per char for typewriter effect (Optimized)
    };

    const handleSend = () => {
        if (!input.trim() && !isRecording) return;
        if (selectedServer?.status !== 'Online') {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Error: Cannot send message. Server "${selectedServer?.name || 'Unknown'}" is not Online.`,
                timestamp: new Date()
            }]);
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        
        // Simulate Inference
        let responseText = `[${selectedServer.acceleration} Inference via ${selectedServer.name}] This is a simulated response generated by ${selectedModel?.name}. In a real application, tokens would stream here from the inference engine.`;
        
        if (selectedAgent) {
            responseText = `[Agent: ${selectedAgent.name}] I have processed your request using the tools defined in my schema. The simulated result is based on the context: "${selectedAgent.systemPrompt.substring(0, 30)}..."`;
        }

        setTimeout(() => {
             streamText(responseText);
        }, 600);
    };

    const toggleAudioRecord = () => {
        if (isRecording) {
            setIsRecording(false);
            // Simulate processing audio
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: '🎤 [Audio Clip 0:04]',
                timestamp: new Date()
            }]);
            
             setTimeout(() => {
                 streamText("I heard you say something about the architecture. Here is the response generated by the Audio Model...");
            }, 1000);
        } else {
            setIsRecording(true);
        }
    };

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem('chatHistory');
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-fade-in relative">
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-4 bg-nebula-900 border border-nebula-700 p-4 rounded-xl shadow-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg border ${selectedServer?.status === 'Online' ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : selectedServer?.status === 'Starting' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' : 'bg-nebula-800 border-nebula-700 text-gray-400'}`}>
                            {selectedServer?.type === 'WebGPU' ? <BrainCircuit size={20} /> : <Bot size={20} />}
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Target Server</label>
                                <select 
                                    value={selectedServerId}
                                    onChange={(e) => setSelectedServerId(e.target.value)}
                                    className="bg-transparent text-white font-medium text-sm outline-none cursor-pointer hover:text-purple-300 transition-colors w-40"
                                >
                                    {servers.map(s => <option key={s.id} value={s.id} className="bg-nebula-900 text-white">{s.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-[10px] text-gray-500 uppercase font-bold">Active Model</label>
                                <select 
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    className="bg-transparent text-white font-medium text-sm outline-none cursor-pointer hover:text-purple-300 transition-colors w-48"
                                >
                                    {models.map(m => <option key={m.id} value={m.id} className="bg-nebula-900 text-white">{m.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col pl-4 border-l border-nebula-800">
                                <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><Briefcase size={10}/> Agent Preset</label>
                                <select 
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="bg-transparent text-white font-medium text-sm outline-none cursor-pointer hover:text-purple-300 transition-colors w-40"
                                >
                                    <option value="" className="bg-nebula-900 text-gray-400">None (Raw Mode)</option>
                                    {agents.map(a => <option key={a.id} value={a.id} className="bg-nebula-900 text-white">{a.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-nebula-950 rounded-lg p-1 border border-nebula-800">
                             <button 
                                onClick={() => setIsAudioMode(false)}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${!isAudioMode ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <MessageSquare size={12} /> Text
                            </button>
                            <button 
                                onClick={() => setIsAudioMode(true)}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-bold transition-all ${isAudioMode ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Mic size={12} /> Audio
                            </button>
                        </div>

                         <button 
                            onClick={clearHistory}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-nebula-950 rounded transition-colors"
                            title="Clear Chat History"
                        >
                            <Eraser size={18} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-nebula-800 pt-3">
                     <div className="flex items-center gap-4">
                         {/* Server Status / Action Area */}
                         {selectedServer?.status === 'Offline' && (
                            <button 
                                onClick={handleLaunch}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                            >
                                <Power size={12} /> {selectedServer.type === 'WebGPU' ? 'Load Model (ONNX)' : 'Launch Server'}
                            </button>
                        )}
                        
                        {selectedServer?.status === 'Starting' && (
                             <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-bold">
                                <Loader2 size={12} className="animate-spin" /> Booting...
                            </div>
                        )}

                         {/* Modifiers */}
                         <div className="flex items-center gap-3 pl-4 border-l border-nebula-800 text-xs text-gray-500">
                             <span className="flex items-center gap-1" title="Context Window"><Layers size={12}/> 8192</span>
                             <span className="flex items-center gap-1" title="Temperature"><Thermometer size={12}/> 0.7</span>
                             <span className="flex items-center gap-1" title="Flash Attention"><Zap size={12}/> FlashAttn</span>
                         </div>
                    </div>
                    
                    {/* Telemetry */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                         <div className="flex items-center gap-2 px-2 py-1 bg-nebula-950 rounded border border-nebula-800 text-gray-300">
                             <Activity size={12} className="text-blue-400" />
                             <span>45.2 t/s</span>
                         </div>
                         <div className="flex items-center gap-2 px-2 py-1 bg-nebula-950 rounded border border-nebula-800 text-gray-300">
                             <Cpu size={12} className="text-purple-400" />
                             <span>VRAM: 10.5/12 GB</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-nebula-950/50 border border-nebula-800 rounded-xl p-6 overflow-y-auto relative">
                {messages.length === 0 && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 pointer-events-none">
                        <Server size={64} className="mb-4" />
                        <p>Select a server & model to begin</p>
                    </div>
                )}
                <div className="space-y-6">
                    {messages.map((msg) => (
                        <MessageItem key={msg.id} msg={msg} />
                    ))}
                    {isTyping && (
                         <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-nebula-900 border border-nebula-700 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-nebula-900 border border-nebula-700 rounded-xl p-2">
                {isAudioMode ? (
                     <div className="h-16 flex items-center justify-center gap-4 relative overflow-hidden">
                        {isRecording && (
                            <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-1 bg-red-500/20 animate-pulse"></div>
                            </div>
                        )}
                        <button 
                             onClick={toggleAudioRecord}
                             disabled={selectedServer?.status !== 'Online'}
                             className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                                 isRecording 
                                 ? 'bg-red-600 animate-pulse shadow-[0_0_15px_#ef4444]' 
                                 : 'bg-nebula-800 hover:bg-purple-600 text-white'
                             }`}
                        >
                             {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        {isRecording ? (
                            <span className="text-red-400 font-mono text-sm animate-pulse">Recording...</span>
                        ) : (
                            <span className="text-gray-500 font-mono text-sm">Tap to Speak</span>
                        )}
                     </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={selectedServer?.status === 'Online' ? "Type your message..." : "Server is offline..."}
                            disabled={selectedServer?.status !== 'Online'}
                            className="flex-1 bg-transparent border-none outline-none text-white px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping || selectedServer?.status !== 'Online'}
                            className="p-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});
