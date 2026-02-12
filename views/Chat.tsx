
import React, { useState, useRef, useEffect } from 'react';
import { Model, ServerProfile, AgentConfig } from '../types';
import { Send, Bot, User, Cpu, Zap, Eraser, MessageSquare, Power, Loader2, CircleCheck, CircleAlert, Server, Mic, MicOff, Volume2, Box, BrainCircuit, Activity, Layers, Thermometer, Briefcase, Paperclip, File, Image as ImageIcon, X, PlayCircle } from 'lucide-react';
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
    
    // Audio State
    const [isAudioMode, setIsAudioMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const selectedServer = servers.find(s => s.id === selectedServerId) || servers[0];
    const selectedModel = models.find(m => m.id === selectedModelId);
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    // Capability Check - Gemini models or specifically tagged models
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
    }, [messages, isTyping, attachments]);

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
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-space-sm bg-nebula-900 border border-nebula-700 p-space-md rounded-xl shadow-md">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-space-md">
                        <div className={`p-2 rounded border ${selectedServer?.status === 'Online' ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : selectedServer?.status === 'Starting' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-400' : 'bg-nebula-800 border-nebula-700 text-gray-400'}`}>
                            {selectedServer?.type === 'WebGPU' ? <BrainCircuit size={20} /> : <Bot size={20} />}
                        </div>
                        
                        <div className="flex gap-space-md">
                            <div className="flex flex-col">
                                <label className="text-type-tiny text-gray-500 uppercase font-bold">Target Server</label>
                                <select 
                                    value={selectedServerId}
                                    onChange={(e) => setSelectedServerId(e.target.value)}
                                    className="bg-transparent text-white font-medium text-type-caption outline-none cursor-pointer hover:text-purple-300 transition-colors w-40"
                                >
                                    {servers.map(s => <option key={s.id} value={s.id} className="bg-nebula-900 text-white">{s.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col">
                                <label className="text-type-tiny text-gray-500 uppercase font-bold">Active Model</label>
                                <select 
                                    value={selectedModelId}
                                    onChange={(e) => setSelectedModelId(e.target.value)}
                                    className="bg-transparent text-white font-medium text-type-caption outline-none cursor-pointer hover:text-purple-300 transition-colors w-48"
                                >
                                    {models.map(m => <option key={m.id} value={m.id} className="bg-nebula-900 text-white">{m.name}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col pl-4 border-l border-nebula-800">
                                <label className="text-type-tiny text-gray-500 uppercase font-bold flex items-center gap-1"><Briefcase size={10}/> Agent Preset</label>
                                <select 
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="bg-transparent text-white font-medium text-type-caption outline-none cursor-pointer hover:text-purple-300 transition-colors w-40"
                                >
                                    <option value="" className="bg-nebula-900 text-gray-400">None (Raw Mode)</option>
                                    {agents.map(a => <option key={a.id} value={a.id} className="bg-nebula-900 text-white">{a.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-space-md">
                        <div className="flex bg-nebula-950 rounded p-1 border border-nebula-800">
                             <button 
                                onClick={() => setIsAudioMode(false)}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-type-tiny font-bold transition-all ${!isAudioMode ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <MessageSquare size={12} /> Text
                            </button>
                            <button 
                                onClick={() => setIsAudioMode(true)}
                                className={`flex items-center gap-2 px-3 py-1 rounded text-type-tiny font-bold transition-all ${isAudioMode ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
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
                     <div className="flex items-center gap-space-md">
                         {selectedServer?.status === 'Offline' && (
                            <button 
                                onClick={handleLaunch}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-type-tiny font-bold flex items-center gap-2 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                            >
                                <Power size={12} /> {selectedServer.type === 'WebGPU' ? 'Load Model (ONNX)' : 'Launch Server'}
                            </button>
                        )}
                        
                        {selectedServer?.status === 'Starting' && (
                             <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/20 border border-yellow-500/30 rounded text-yellow-400 text-type-tiny font-bold">
                                <Loader2 size={12} className="animate-spin" /> Booting...
                            </div>
                        )}

                         <div className="flex items-center gap-3 pl-4 border-l border-nebula-800 text-type-tiny text-gray-500">
                             <span className="flex items-center gap-1" title="Context Window"><Layers size={12}/> 8192</span>
                             <span className="flex items-center gap-1" title="Temperature"><Thermometer size={12}/> 0.7</span>
                             <span className="flex items-center gap-1" title="Flash Attention"><Zap size={12}/> FlashAttn</span>
                             {supportsAudio && <span className="flex items-center gap-1 text-green-400" title="Native Audio Support"><Volume2 size={12}/> Audio Enabled</span>}
                             {supportsImage && <span className="flex items-center gap-1 text-blue-400" title="Image Gen Support"><ImageIcon size={12}/> Img Gen</span>}
                         </div>
                    </div>
                    
                    <div className="flex items-center gap-space-md text-type-tiny font-mono">
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
            <div className="flex-1 bg-nebula-900 border border-nebula-700 rounded-xl p-space-lg overflow-y-auto relative custom-scrollbar">
                {messages.length === 0 && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 opacity-50 pointer-events-none">
                        <Server size={64} className="mb-4" />
                        <p>Select a server & model to begin</p>
                    </div>
                )}
                <div className="space-y-space-lg">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-space-md ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`max-w-[70%] rounded px-4 py-3 text-type-body leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-blue-900/30 border border-blue-500/30 text-blue-100' 
                                : 'bg-nebula-950 border border-nebula-700 text-gray-200'
                            }`}>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {msg.attachments.map(att => (
                                            <div key={att.id} className="bg-black/20 rounded p-2 flex items-center gap-2 border border-white/10">
                                                {att.type === 'image' ? <ImageIcon size={14} className="text-purple-400"/> : <File size={14} className="text-blue-400"/>}
                                                <span className="text-type-tiny truncate max-w-[150px]">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="whitespace-pre-wrap">{msg.content}</div>

                                {msg.generatedMedia && (
                                    <div className="mt-3 p-2 bg-black/20 rounded border border-white/5">
                                        {msg.generatedMedia.type === 'image' && (
                                            <img src={msg.generatedMedia.url} alt={msg.generatedMedia.alt} className="rounded-lg max-h-64 object-cover" />
                                        )}
                                        {msg.generatedMedia.type === 'audio' && (
                                            <div className="flex items-center gap-3 p-2">
                                                <div className="p-2 bg-purple-600 rounded-full"><PlayCircle size={20} className="text-white" /></div>
                                                <div className="flex-1">
                                                    <div className="h-1 bg-gray-600 rounded-full w-full">
                                                        <div className="h-1 bg-purple-400 rounded-full w-1/3"></div>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">00:14</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-white/5 opacity-60">
                                    <span className="text-[10px]">{msg.timestamp.toLocaleTimeString()}</span>
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
                         <div className="flex gap-space-md">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                <Bot size={16} />
                            </div>
                            <div className="bg-nebula-900 border border-nebula-700 rounded px-4 py-3 flex items-center gap-1">
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
                {attachments.length > 0 && (
                    <div className="flex gap-2 p-2 mb-2 overflow-x-auto bg-nebula-950/50 rounded">
                        {attachments.map(att => (
                            <div key={att.id} className="relative group bg-nebula-800 border border-nebula-700 rounded p-2 flex items-center gap-2 min-w-[120px]">
                                {att.type === 'image' && att.url ? (
                                    <div className="w-8 h-8 bg-cover bg-center rounded" style={{backgroundImage: `url(${att.url})`}}></div>
                                ) : (
                                    <div className="w-8 h-8 flex items-center justify-center bg-nebula-900 rounded text-blue-400">
                                        <File size={16} />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="text-type-tiny truncate text-gray-300" title={att.name}>{att.name}</div>
                                </div>
                                <button 
                                    onClick={() => removeAttachment(att.id)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {isAudioMode ? (
                     <div className="h-16 flex items-center justify-center gap-4 relative overflow-hidden">
                        {isRecording && (
                            <div className="absolute inset-0 bg-red-900/10 flex items-center justify-center pointer-events-none">
                                <div className="w-full h-1 bg-red-500/20 animate-pulse"></div>
                            </div>
                        )}
                        <button 
                             onClick={toggleAudioRecord}
                             disabled={selectedServer?.status !== 'Online' || !supportsAudio}
                             className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                                 !supportsAudio ? 'bg-gray-800 opacity-50 cursor-not-allowed' :
                                 isRecording 
                                 ? 'bg-red-600 animate-pulse shadow-[0_0_15px_#ef4444]' 
                                 : 'bg-nebula-800 hover:bg-purple-600 text-white'
                             }`}
                             title={!supportsAudio ? "Model does not support native audio" : "Toggle Microphone"}
                        >
                             {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        {isRecording ? (
                            <span className="text-red-400 font-mono text-sm animate-pulse">Recording...</span>
                        ) : (
                            <span className="text-gray-500 font-mono text-sm">{supportsAudio ? "Tap to Speak (Native Audio Model)" : "Audio Not Supported by Model"}</span>
                        )}
                     </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-3 text-gray-400 hover:text-white hover:bg-nebula-800 rounded transition-colors"
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
                            className="flex-1 bg-transparent border-none outline-none text-white px-2 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-type-body"
                        />
                        <button 
                            onClick={handleSend}
                            disabled={(!input.trim() && attachments.length === 0) || isTyping || selectedServer?.status !== 'Online'}
                            className="p-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
