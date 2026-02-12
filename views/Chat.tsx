
import React, { useState, useRef, useEffect } from 'react';
import { Model, ServerProfile, AgentConfig } from '../types';
import { Send, Bot, User, Cpu, Zap, Eraser, MessageSquare, Power, Loader2, CircleCheck, CircleAlert, Server, Mic, MicOff, Volume2, Box, BrainCircuit, Activity, Layers, Thermometer, Briefcase, Paperclip, File, Image as ImageIcon, X, PlayCircle, Terminal, Info, ChevronRight, Monitor } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    attachments?: FileAttachment[];
    generatedMedia?: {
        type: 'image' | 'audio';
        url: string;
        alt?: string;
    };
}

interface FileAttachment {
    id: string;
    name: string;
    type: 'image' | 'file';
    url?: string;
}

// Audio Decoding Utilities
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface ChatProps {
    models: Model[];
    servers: ServerProfile[];
    agents?: AgentConfig[];
    onUpdateServer: (server: ServerProfile) => void;
}

export const Chat: React.FC<ChatProps> = ({ models, servers, agents = [], onUpdateServer }) => {
    const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || '');
    const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
    const [isAudioMode, setIsAudioMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const selectedServer = servers.find(s => s.id === selectedServerId) || servers[0];
    const selectedModel = models.find(m => m.id === selectedModelId);
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    const supportsAudio = selectedModel?.tags.some(t => ['Audio', 'Multimodal'].includes(t)) || selectedModelId.includes('gemini');
    const supportsImage = selectedModel?.tags.some(t => ['Image', 'Generative'].includes(t));

    useEffect(() => {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const hydrated = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                setMessages(hydrated);
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        } else {
             setMessages([{ id: '1', role: 'assistant', content: 'SYSTEM: Session initialized. Select model parameters and execute query.', timestamp: new Date() }]);
        }
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (selectedAgent) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `AGENT_MODULE: Loaded [${selectedAgent.name.toUpperCase()}]. Directives active.`,
                timestamp: new Date()
            }]);
        }
    }, [selectedAgentId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, attachments]);

    const clearHistory = () => {
        const resetMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'SYSTEM: Buffer purged. Context reset.', timestamp: new Date() };
        setMessages([resetMsg]);
        localStorage.setItem('chatHistory', JSON.stringify([resetMsg]));
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleLaunch = () => {
        if (!selectedServer) return;
        onUpdateServer({ ...selectedServer, status: 'Starting' });
        setTimeout(() => {
            onUpdateServer({ ...selectedServer, status: 'Online' });
        }, 2000);
    };

    const streamText = (fullText: string) => {
        const msgId = (Date.now() + 1).toString();
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
        }, 15);
    };

    const handleSend = () => {
        if ((!input.trim() && attachments.length === 0) && !isRecording) return;
        if (selectedServer?.status !== 'Online') return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
            attachments: [...attachments]
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        
        setTimeout(() => {
             streamText(`RESPONSE_BLOCK: Model processing complete. Source: ${selectedModel?.name}. Result follows: This is a generated analytic response simulating output from ${selectedModel?.id}.`);
        }, 600);
    };

    const toggleAudioRecord = () => {
        if (!supportsAudio) return;
        if (isRecording) {
            setIsRecording(false);
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: 'VOICE_INPUT: [AUDIO_STREAM_CAPTURED]', timestamp: new Date() }]);
            setTimeout(() => streamText("ASR_PROTOCOL: I have processed your voice command. Executing..."), 1000);
        } else {
            setIsRecording(true);
        }
    };

    const playTTS = async (id: string, text: string) => {
        if (ttsLoadingId === id) return;
        setTtsLoadingId(id);
        try {
            const base64Audio = await generateSpeech(text);
            if (!base64Audio) throw new Error("No audio data");
            if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const ctx = audioContextRef.current;
            const bytes = decodeBase64(base64Audio);
            const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start();
        } catch (e) {
            console.error(e);
        } finally {
            setTtsLoadingId(null);
        }
    };

    return (
        <div className="flex h-full animate-fade-in p-space-md gap-space-md">
            {/* Main Chat Frame - Deep Black background */}
            <div className="flex-1 flex flex-col bg-[#020205] border border-white/5 rounded shadow-2xl overflow-hidden relative">
                {/* Visual Accent */}
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>

                {/* Unified Toolbar */}
                <div className="p-4 bg-black/60 border-b border-white/5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Protocol</span>
                            <div className="px-2 py-1 bg-[#0a0a0f] border border-white/5 text-purple-400 text-[10px] font-black uppercase rounded">
                                {selectedAgent ? selectedAgent.name : 'RAW_INFERENCE'}
                            </div>
                        </div>
                        <div className="h-4 w-px bg-white/5"></div>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Activity size={12} className="text-blue-500" /> 45.2 t/s</span>
                            <span className="flex items-center gap-1.5"><Cpu size={12} className="text-purple-500" /> 10.5 GB</span>
                            <span className="flex items-center gap-1.5"><Zap size={12} className="text-orange-500" /> 120ms</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={clearHistory} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Purge Buffer"><Eraser size={16} /></button>
                    </div>
                </div>

                {/* Messages Panel - Darker background as requested */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group animate-fade-in`}>
                            {/* Message Metadata Header */}
                            <div className={`flex items-center gap-2 mb-2 text-[9px] font-black uppercase tracking-[0.2em] ${msg.role === 'user' ? 'text-blue-500' : 'text-purple-500'}`}>
                                {msg.role === 'user' ? <><span className="text-gray-600 font-mono">{msg.timestamp.toLocaleTimeString()}</span> <span>[USER_ENTITY]</span> <User size={10} /></> : <><Bot size={10} /> <span>[SYSTEM_ORACLE]</span> <span className="text-gray-600 font-mono">{msg.timestamp.toLocaleTimeString()}</span></>}
                            </div>
                            
                            <div className={`relative max-w-[85%] px-5 py-4 rounded text-sm leading-relaxed border ${
                                msg.role === 'user' 
                                ? 'bg-blue-600/10 border-blue-500/20 text-blue-50' 
                                : 'bg-[#0f0f13] border-white/5 text-gray-200 shadow-2xl'
                            }`}>
                                {/* Content Wrapper */}
                                <div className="font-mono whitespace-pre-wrap">{msg.content}</div>

                                {msg.generatedMedia?.type === 'image' && (
                                    <div className="mt-4 border border-white/5 rounded overflow-hidden">
                                        <img src={msg.generatedMedia.url} alt="AI Output" className="max-h-80 w-full object-cover" />
                                    </div>
                                )}

                                {msg.role === 'assistant' && supportsAudio && (
                                    <button 
                                        onClick={() => playTTS(msg.id, msg.content)}
                                        className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        {ttsLoadingId === msg.id ? <Loader2 size={16} className="animate-spin" /> : <Volume2 size={16} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex flex-col items-start animate-pulse">
                            <div className="text-[9px] font-black text-purple-500 uppercase tracking-[0.2em] mb-2">Processing...</div>
                            <div className="w-12 h-6 bg-[#0f0f13] rounded flex items-center justify-center gap-1 border border-white/5">
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-300"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Matrix - Solid Black background */}
                <div className="p-4 bg-black border-t border-white/5 space-y-3">
                    {attachments.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0f] border border-white/5 rounded text-[10px] font-bold text-gray-500">
                                    {att.type === 'image' ? <ImageIcon size={12} /> : <File size={12} />}
                                    <span className="truncate max-w-[100px]">{att.name}</span>
                                    <button onClick={() => removeAttachment(att.id)} className="hover:text-red-400"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-[#0a0a0f] border border-white/5 rounded text-gray-500 hover:text-white transition-all"><Paperclip size={18} /></button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
                             if (e.target.files) {
                                const fileList = Array.from(e.target.files) as File[];
                                const newAtts: FileAttachment[] = fileList.map(f => ({
                                    id: Math.random().toString(),
                                    name: f.name,
                                    type: f.type.startsWith('image/') ? 'image' : 'file'
                                }));
                                setAttachments([...attachments, ...newAtts]);
                             }
                        }} />
                        
                        <div className="flex-1 relative">
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isRecording ? "Listening..." : "Execute Command (/) ..."}
                                className={`w-full bg-[#050507] border border-white/10 rounded px-4 py-3.5 text-sm font-mono text-white outline-none focus:border-purple-500/50 transition-all ${isRecording ? 'animate-pulse text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'shadow-inner'}`}
                            />
                            {supportsAudio && (
                                <button 
                                    onClick={toggleAudioRecord}
                                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-500 hover:text-purple-400'}`}
                                >
                                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>
                            )}
                        </div>

                        <button 
                            onClick={handleSend}
                            disabled={selectedServer?.status !== 'Online' || (!input.trim() && attachments.length === 0)}
                            className="px-8 py-3.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-20 text-white rounded font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                        >
                            Execute
                        </button>
                    </div>
                </div>
            </div>

            {/* Config Sidebar */}
            <div className="w-80 flex flex-col gap-space-md shrink-0">
                {/* Node Selector */}
                <div className="bg-nebula-900 border border-nebula-800 rounded p-5 space-y-6 shadow-xl">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><Server size={12} className="text-purple-500" /> Infrastructure Node</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest block mb-1.5">Compute Cluster</label>
                            <select value={selectedServerId} onChange={(e) => setSelectedServerId(e.target.value)} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2.5 text-xs text-white outline-none">
                                {servers.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                            </select>
                        </div>
                        {selectedServer?.status === 'Offline' ? (
                            <button onClick={handleLaunch} className="w-full py-2.5 bg-purple-900/20 border border-purple-500 text-purple-400 text-[10px] font-black uppercase rounded hover:bg-purple-600 hover:text-white transition-all">Initialize Server</button>
                        ) : (
                            <div className="flex items-center justify-between px-3 py-2 bg-green-950/20 border border-green-500/30 rounded">
                                <span className="text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Node_Online</span>
                                <span className="text-[9px] font-mono text-gray-600">{selectedServer?.host}:{selectedServer?.port}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Model Params */}
                <div className="bg-nebula-900 border border-nebula-800 rounded p-5 flex-1 flex flex-col space-y-6 shadow-xl overflow-hidden">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={12} className="text-blue-500" /> Parameter Matrix</h3>
                    
                    <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest block mb-1.5">Inference Model</label>
                                <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2.5 text-xs text-white outline-none">
                                    {models.map(m => <option key={m.id} value={m.id}>{m.name.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-600 uppercase font-black tracking-widest block mb-1.5">Agent Preset</label>
                                <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)} className="w-full bg-nebula-950 border border-nebula-800 rounded p-2.5 text-xs text-white outline-none">
                                    <option value="">NONE (RAW)</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.name.toUpperCase()}</option>)}
                                </select>
                            </div>
                        </div>

                        {selectedModel && (
                            <div className="p-4 bg-nebula-950 rounded border border-nebula-800 space-y-3">
                                <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Model Specimen Specs</div>
                                <div className="flex justify-between text-[10px]"><span className="text-gray-600 uppercase">Param Scale</span> <span className="text-gray-300 font-mono">{selectedModel.params}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-gray-600 uppercase">Architecture</span> <span className="text-gray-300 font-mono">{selectedModel.family}</span></div>
                                <div className="flex justify-between text-[10px]"><span className="text-gray-600 uppercase">Precision</span> <span className="text-gray-300 font-mono">{selectedModel.tensorType}</span></div>
                                <div className="flex flex-wrap gap-1 pt-2">
                                    {selectedModel.tags.map(t => (
                                        <span key={t} className="px-2 py-0.5 bg-nebula-900 border border-nebula-700 text-[8px] font-black text-gray-500 rounded uppercase">{t}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-nebula-800">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                            <span>System Load</span>
                            <span className="text-purple-400">Stable</span>
                        </div>
                        <div className="w-full bg-nebula-950 h-1.5 rounded-full overflow-hidden border border-nebula-800">
                            <div className="h-full bg-purple-600 w-1/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
