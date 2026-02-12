import React, { useState, useRef, useEffect } from 'react';
import { Model, ServerProfile, AgentConfig } from '../types';
import { Send, Bot, User, Cpu, Zap, Eraser, MessageSquare, Power, Loader2, Server, Mic, MicOff, Volume2, BrainCircuit, Activity, Layers, Thermometer, Briefcase, Paperclip, File, Image as ImageIcon, X, PlayCircle, Terminal, RefreshCw, GitBranch } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

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

export const Chat: React.FC<ChatProps> = ({ models, servers, agents = [], onUpdateServer }) => {
    const [selectedServerId, setSelectedServerId] = useState<string>(servers[0]?.id || '');
    const [selectedModelId, setSelectedModelId] = useState<string>(models[0]?.id || '');
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [ttsLoadingId, setTtsLoadingId] = useState<string | null>(null);
    
    // Modes: 'text' | 'audio' | 'training'
    const [chatMode, setChatMode] = useState<'text' | 'audio' | 'training'>('text');
    const [isRecording, setIsRecording] = useState(false);
    
    // Training Mode State
    const [trainingLogs, setTrainingLogs] = useState<string[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const trainingEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const selectedServer = servers.find(s => s.id === selectedServerId) || servers[0];
    const selectedModel = models.find(m => m.id === selectedModelId);
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    // Capability Check
    const supportsAudio = selectedModel?.tags.some(t => ['Audio', 'Multimodal'].includes(t)) || selectedModelId.includes('gemini');
    const supportsImage = selectedModel?.tags.some(t => ['Image', 'Generative'].includes(t));

    // Persistence Effect
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
             setMessages([{ id: '1', role: 'assistant', content: 'System initialized. Connect to a server to begin.', timestamp: new Date() }]);
        }
    }, []);

    // Save on Change Effect
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        }
    }, [messages]);

    // Training Log Simulation
    useEffect(() => {
        let interval: any;
        if (chatMode === 'training') {
            setTrainingLogs(prev => prev.length === 0 ? [`[System] Attached to training session: ${selectedModel?.name || 'Unknown'}...`] : prev);
            
            interval = setInterval(() => {
                const now = new Date().toLocaleTimeString();
                const possibleLogs = [
                    `[Train] Step ${Math.floor(Math.random() * 1000)}/5000 | Loss: ${(Math.random() * 2).toFixed(4)} | LR: 2e-5`,
                    `[Eval] Running validation on batch #42... Accuracy: ${(80 + Math.random() * 15).toFixed(2)}%`,
                    `[Gen] Q: "Define quantum superposition." -> Generating synthetic response...`,
                    `[Gen] A: "Quantum superposition is a fundamental principle of quantum mechanics..." [Ref: Wiki]`,
                    `[System] VRAM Usage: ${(Math.random() * 2 + 10).toFixed(1)}GB / 24GB`,
                    `[DPO] Preference pair generated: 0.85 confidence gap.`
                ];
                const newLog = `[${now}] ${possibleLogs[Math.floor(Math.random() * possibleLogs.length)]}`;
                setTrainingLogs(prev => [...prev.slice(-50), newLog]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [chatMode, selectedModel]);

    // Scroll Effects
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const scrollToLogBottom = () => {
        trainingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, attachments]);

    useEffect(() => {
        scrollToLogBottom();
    }, [trainingLogs]);

    const handleLaunch = () => {
        if (!selectedServer) return;
        onUpdateServer({ ...selectedServer, status: 'Starting' });
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
        }, 20);
    };

    const handleSend = () => {
        if ((!input.trim() && attachments.length === 0) && !isRecording) return;
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
            timestamp: new Date(),
            attachments: [...attachments]
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setAttachments([]);
        
        let responseText = `[${selectedServer.acceleration} Inference via ${selectedServer.name}] This is a simulated response generated by ${selectedModel?.name}.`;
        if (supportsImage && (userMsg.content.toLowerCase().includes('generate') || userMsg.content.toLowerCase().includes('image'))) {
            responseText = "Generating image based on your prompt...";
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: 'Here is the generated image:',
                    timestamp: new Date(),
                    generatedMedia: {
                        type: 'image',
                        url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop',
                        alt: 'AI Generated Abstract Art'
                    }
                }]);
            }, 1500);
        } else if (supportsAudio && (userMsg.content.toLowerCase().includes('speak') || userMsg.content.toLowerCase().includes('audio'))) {
             responseText = "Synthesizing audio...";
             setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 2).toString(),
                    role: 'assistant',
                    content: 'Here is the generated audio response:',
                    timestamp: new Date(),
                    generatedMedia: {
                        type: 'audio',
                        url: '#',
                        alt: 'Generated Speech'
                    }
                }]);
            }, 1500);
        } else if (attachments.length > 0) {
            responseText = `[Multimodal Input Detected] I see you have attached ${attachments.length} file(s). I am analyzing ${attachments.map(a => a.name).join(', ')}... \n\nBased on the visual/document context, here is my analysis...`;
        } else if (selectedAgent) {
            responseText = `[Agent: ${selectedAgent.name}] I have processed your request using the tools defined in my schema. The simulated result is based on the context: "${selectedAgent.systemPrompt.substring(0, 30)}..."`;
        }

        setTimeout(() => {
             streamText(responseText);
        }, 600);
    };

    const toggleAudioRecord = () => {
        if (!supportsAudio) {
            alert("The selected model does not support native audio processing.");
            return;
        }

        if (isRecording) {
            setIsRecording(false);
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

    const playTTS = async (id: string, text: string) => {
        if (ttsLoadingId === id) return;
        setTtsLoadingId(id);

        try {
            const base64Audio = await generateSpeech(text);
            if (!base64Audio) throw new Error("No audio data returned");

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
            console.error("TTS Playback Error", e);
            alert("Failed to play audio. Make sure your API Key is valid and supports TTS.");
        } finally {
            setTtsLoadingId(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            const newAttachments: FileAttachment[] = files.map((f: File) => ({
                id: Math.random().toString(36).substr(2, 9),
                name: f.name,
                type: f.type.startsWith('image/') ? 'image' : 'file',
                url: URL.createObjectURL(f)
            }));
            setAttachments([...attachments, ...newAttachments]);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(attachments.filter(a => a.id !== id));
    };

    const clearHistory = () => {
        setMessages([]);
        localStorage.removeItem('chatHistory');
    };

    return (
        <div className="flex flex-col h-full gap-space-lg animate-fade-in relative p-space-lg">
            {/* Main Chat Container - Glassmorphic */}
            <div className="flex-1 flex flex-col bg-nebula-900/80 backdrop-blur-xl border border-nebula-700 rounded-2xl shadow-2xl overflow-hidden relative">
                
                {/* Header / Toolbar */}
                <div className="flex flex-col gap-space-sm border-b border-nebula-800/60 p-space-md bg-nebula-950/40">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-space-md">
                            <div className={`p-2.5 rounded-xl border ${selectedServer?.status === 'Online' ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : selectedServer?.status === 'Starting' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 'bg-nebula-800 border-nebula-700 text-gray-500'}`}>
                                {selectedServer?.type === 'WebGPU' ? <BrainCircuit size={20} /> : <Bot size={20} />}
                            </div>
                            
                            <div className="flex gap-space-md">
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Target Server</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedServerId}
                                            onChange={(e) => setSelectedServerId(e.target.value)}
                                            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer hover:text-purple-300 transition-colors w-40 appearance-none pr-4"
                                        >
                                            {servers.map(s => <option key={s.id} value={s.id} className="bg-nebula-900 text-white">{s.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Active Model</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedModelId}
                                            onChange={(e) => setSelectedModelId(e.target.value)}
                                            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer hover:text-purple-300 transition-colors w-48 appearance-none"
                                        >
                                            {models.map(m => <option key={m.id} value={m.id} className="bg-nebula-900 text-white">{m.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col pl-4 border-l border-nebula-800/50">
                                    <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center gap-1 mb-0.5"><Briefcase size={10}/> Agent Preset</label>
                                    <div className="relative">
                                        <select 
                                            value={selectedAgentId}
                                            onChange={(e) => setSelectedAgentId(e.target.value)}
                                            className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer hover:text-purple-300 transition-colors w-40 appearance-none"
                                        >
                                            <option value="" className="bg-nebula-900 text-gray-400">None (Raw Mode)</option>
                                            {agents.map(a => <option key={a.id} value={a.id} className="bg-nebula-900 text-white">{a.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-space-lg">
                            <div className="flex bg-black/20 rounded-lg p-1 border border-white/5">
                                <button 
                                    onClick={() => setChatMode('text')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${chatMode === 'text' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <MessageSquare size={14} /> Text
                                </button>
                                <button 
                                    onClick={() => setChatMode('audio')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${chatMode === 'audio' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <Mic size={14} /> Audio
                                </button>
                                <button 
                                    onClick={() => setChatMode('training')}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${chatMode === 'training' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <Terminal size={14} /> Training
                                </button>
                            </div>

                            <button 
                                onClick={clearHistory}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                                title="Clear Chat History"
                            >
                                <Eraser size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-nebula-800/50 pt-3 mt-1">
                        <div className="flex items-center gap-space-md">
                            {selectedServer?.status === 'Offline' && (
                                <button 
                                    onClick={handleLaunch}
                                    className="px-3 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:border-purple-500 rounded text-xs font-bold flex items-center gap-2 transition-all"
                                >
                                    <Power size={12} /> {selectedServer.type === 'WebGPU' ? 'Load Model (ONNX)' : 'Launch Server'}
                                </button>
                            )}
                            
                            {selectedServer?.status === 'Starting' && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400 text-xs font-bold">
                                    <Loader2 size={12} className="animate-spin" /> Booting...
                                </div>
                            )}

                            <div className="flex items-center gap-3 pl-4 border-l border-nebula-800/50 text-[10px] text-gray-500 font-medium">
                                <span className="flex items-center gap-1.5" title="Context Window"><Layers size={12}/> 8192</span>
                                <span className="flex items-center gap-1.5" title="Temperature"><Thermometer size={12}/> 0.7</span>
                                <span className="flex items-center gap-1.5" title="Flash Attention"><Zap size={12}/> FlashAttn</span>
                                {supportsAudio && <span className="flex items-center gap-1.5 text-green-400" title="Native Audio Support"><Volume2 size={12}/> Audio Enabled</span>}
                                {supportsImage && <span className="flex items-center gap-1.5 text-blue-400" title="Image Gen Support"><ImageIcon size={12}/> Img Gen</span>}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-space-md text-[10px] font-mono">
                            <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded border border-white/5 text-gray-400">
                                <Activity size={12} className="text-blue-400" />
                                <span>45.2 t/s</span>
                            </div>
                            <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded border border-white/5 text-gray-400">
                                <Cpu size={12} className="text-purple-400" />
                                <span>VRAM: 10.5GB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Viewport Area */}
                <div className="flex-1 overflow-hidden relative">
                    {/* TRAINING MODE VIEW */}
                    {chatMode === 'training' ? (
                        <div className="absolute inset-0 bg-black/40 p-6 overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col gap-1">
                            <div className="sticky top-0 bg-gradient-to-b from-black/80 to-transparent pb-4 mb-2 border-b border-white/5 z-10 flex justify-between items-center">
                                <span className="text-orange-400 font-bold uppercase tracking-widest flex items-center gap-2"><GitBranch size={14}/> Live Training Stream</span>
                                <span className="text-gray-500 flex items-center gap-2"><RefreshCw size={12} className="animate-spin"/> Syncing</span>
                            </div>
                            <div className="space-y-1.5">
                                {trainingLogs.map((log, i) => (
                                    <div key={i} className="flex gap-3 hover:bg-white/5 p-1 rounded transition-colors animate-fade-in">
                                        <span className="text-gray-600 shrink-0 select-none">L{i+100}</span>
                                        <span className={`${
                                            log.includes('[Gen]') ? 'text-blue-300' : 
                                            log.includes('[Eval]') ? 'text-green-300' :
                                            log.includes('[System]') ? 'text-yellow-500' : 
                                            'text-gray-300'
                                        }`}>{log}</span>
                                    </div>
                                ))}
                                <div ref={trainingEndRef} />
                            </div>
                        </div>
                    ) : (
                        /* CHAT / AUDIO MODE VIEW */
                        <div className="absolute inset-0 overflow-y-auto p-space-lg custom-scrollbar space-y-6">
                            {messages.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-30 pointer-events-none">
                                    <div className="p-6 rounded-full bg-white/5 mb-4 border border-white/5">
                                        <Server size={48} />
                                    </div>
                                    <p className="font-bold uppercase tracking-widest">System Ready</p>
                                    <p className="text-xs mt-2">Select a server & model to begin transmission</p>
                                </div>
                            )}
                            
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group animate-fade-in`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                                        msg.role === 'user' 
                                        ? 'bg-purple-600 text-white' 
                                        : 'bg-nebula-950 border border-nebula-700 text-purple-400'
                                    }`}>
                                        {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                    </div>
                                    <div className={`max-w-[75%] rounded-2xl px-5 py-4 text-sm leading-relaxed shadow-md ${
                                        msg.role === 'user' 
                                        ? 'bg-gradient-to-br from-purple-900/60 to-purple-800/40 border border-purple-500/20 text-purple-100 rounded-tr-none' 
                                        : 'bg-nebula-950/80 border border-nebula-800 text-gray-200 rounded-tl-none'
                                    }`}>
                                        {msg.attachments && msg.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {msg.attachments.map(att => (
                                                    <div key={att.id} className="bg-black/40 rounded-lg p-2 flex items-center gap-2 border border-white/10">
                                                        {att.type === 'image' ? <ImageIcon size={14} className="text-purple-400"/> : <File size={14} className="text-blue-400"/>}
                                                        <span className="text-xs truncate max-w-[150px]">{att.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className="whitespace-pre-wrap">{msg.content}</div>

                                        {msg.generatedMedia && (
                                            <div className="mt-3 p-2 bg-black/40 rounded-xl border border-white/10">
                                                {msg.generatedMedia.type === 'image' && (
                                                    <img src={msg.generatedMedia.url} alt={msg.generatedMedia.alt} className="rounded-lg max-h-64 object-cover w-full" />
                                                )}
                                                {msg.generatedMedia.type === 'audio' && (
                                                    <div className="flex items-center gap-3 p-2">
                                                        <div className="p-2 bg-purple-600 rounded-full cursor-pointer hover:bg-purple-500 transition-colors"><PlayCircle size={20} className="text-white" /></div>
                                                        <div className="flex-1">
                                                            <div className="h-1 bg-gray-600 rounded-full w-full">
                                                                <div className="h-1 bg-purple-400 rounded-full w-1/3 relative">
                                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow"></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className="text-xs text-gray-400 font-mono">00:14</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-60 transition-opacity">
                                            <span className="text-[9px] uppercase font-bold tracking-wider">{msg.timestamp.toLocaleTimeString()}</span>
                                            {msg.role === 'assistant' && supportsAudio && (
                                                <button 
                                                    onClick={() => playTTS(msg.id, msg.content)} 
                                                    className={`${ttsLoadingId === msg.id ? 'text-purple-400 animate-pulse' : 'hover:text-purple-400'} transition-colors`} 
                                                    title="Play Text-to-Speech"
                                                >
                                                    {ttsLoadingId === msg.id ? <Loader2 size={12} className="animate-spin" /> : <Volume2 size={12} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-nebula-950 border border-nebula-700 flex items-center justify-center shrink-0 text-purple-400">
                                        <Bot size={18} />
                                    </div>
                                    <div className="bg-nebula-950/80 border border-nebula-800 rounded-2xl rounded-tl-none px-5 py-4 flex items-center gap-1.5 h-12">
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area - Hidden in Training Mode */}
                {chatMode !== 'training' && (
                    <div className="p-4 border-t border-nebula-800/60 bg-nebula-950/40">
                        <div className="bg-black/20 border border-white/10 rounded-xl p-2 relative transition-all focus-within:border-purple-500/50 focus-within:bg-black/40">
                            {attachments.length > 0 && (
                                <div className="flex gap-2 p-2 mb-2 overflow-x-auto bg-white/5 rounded-lg border border-white/5">
                                    {attachments.map(att => (
                                        <div key={att.id} className="relative group bg-nebula-900 border border-nebula-700 rounded-md p-2 flex items-center gap-2 min-w-[120px]">
                                            {att.type === 'image' && att.url ? (
                                                <div className="w-8 h-8 bg-cover bg-center rounded" style={{backgroundImage: `url(${att.url})`}}></div>
                                            ) : (
                                                <div className="w-8 h-8 flex items-center justify-center bg-nebula-950 rounded text-blue-400">
                                                    <File size={16} />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] truncate text-gray-300" title={att.name}>{att.name}</div>
                                            </div>
                                            <button 
                                                onClick={() => removeAttachment(att.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-md"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {chatMode === 'audio' ? (
                                <div className="h-16 flex items-center justify-center gap-6 relative overflow-hidden rounded-lg bg-nebula-900/50 border border-white/5">
                                    {isRecording && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-full h-full bg-red-500/5 animate-pulse"></div>
                                            <div className="absolute w-64 h-64 bg-red-500/10 blur-3xl rounded-full animate-pulse"></div>
                                        </div>
                                    )}
                                    <button 
                                        onClick={toggleAudioRecord}
                                        disabled={selectedServer?.status !== 'Online' || !supportsAudio}
                                        className={`h-12 w-12 rounded-full flex items-center justify-center transition-all z-10 ${
                                            !supportsAudio ? 'bg-gray-800 opacity-50 cursor-not-allowed' :
                                            isRecording 
                                            ? 'bg-red-600 animate-pulse shadow-[0_0_25px_#ef4444]' 
                                            : 'bg-nebula-800 hover:bg-purple-600 text-white border border-white/10 hover:border-purple-500'
                                        }`}
                                        title={!supportsAudio ? "Model does not support native audio" : "Toggle Microphone"}
                                    >
                                        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                    <div className="flex flex-col items-start z-10 min-w-[100px]">
                                        {isRecording ? (
                                            <>
                                                <span className="text-red-400 font-bold text-xs animate-pulse uppercase tracking-wider">Recording Live</span>
                                                <span className="text-[10px] text-red-400/70 font-mono">00:04.22</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-gray-300 font-bold text-xs uppercase tracking-wider">{supportsAudio ? "Tap to Speak" : "Audio Unavailable"}</span>
                                                <span className="text-[10px] text-gray-600 font-mono">{supportsAudio ? "Native Audio Mode" : "Model Capability Missing"}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        title="Attach File"
                                    >
                                        <Paperclip size={18} />
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            multiple 
                                            onChange={handleFileSelect}
                                        />
                                    </button>
                                    
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        placeholder={selectedServer?.status === 'Online' ? "Type your message..." : "Server is offline..."}
                                        disabled={selectedServer?.status !== 'Online'}
                                        className="flex-1 bg-transparent border-none outline-none text-white px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-600"
                                    />
                                    <button 
                                        onClick={handleSend}
                                        disabled={(!input.trim() && attachments.length === 0) || isTyping || selectedServer?.status !== 'Online'}
                                        className="p-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors shadow-lg shadow-purple-500/20"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};