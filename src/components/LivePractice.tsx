import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Loader2, Sparkles, Volume2, MessageSquare, Zap, Bot } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface LivePracticeProps {
  onClose: () => void;
}

export const LivePractice = ({ onClose }: LivePracticeProps) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [isInterrupted, setIsInterrupted] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioQueue = useRef<Int16Array[]>([]);
  const isPlaying = useRef(false);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are a professional technical interviewer. Conduct a realistic, high-pressure technical interview. Ask one question at a time, listen to the candidate, and provide brief, punchy follow-up questions or feedback. Keep your responses concise.",
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            startMic(session);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn) {
              const part = message.serverContent.modelTurn.parts[0];
              if (part.inlineData) {
                const base64Data = part.inlineData.data;
                const binaryData = atob(base64Data);
                const pcmData = new Int16Array(binaryData.length / 2);
                for (let i = 0; i < pcmData.length; i++) {
                  pcmData[i] = (binaryData.charCodeAt(i * 2) & 0xFF) | (binaryData.charCodeAt(i * 2 + 1) << 8);
                }
                audioQueue.current.push(pcmData);
                if (!isPlaying.current) playNextInQueue();
              }
              if (part.text) {
                setTranscript(prev => [...prev, { role: 'model', text: part.text! }]);
              }
            }
            if (message.serverContent?.interrupted) {
              setIsInterrupted(true);
              audioQueue.current = [];
              isPlaying.current = false;
            }
          },
          onclose: () => {
            stopMic();
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setIsConnecting(false);
          }
        }
      });
      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to connect to Live API:", err);
      setIsConnecting(false);
    }
  };

  const startMic = async (session: any) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioContext = new AudioContext({ sampleRate: 16000 });
    audioContextRef.current = audioContext;
    
    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
      session.sendRealtimeInput({
        media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
      });
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
  };

  const stopMic = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const playNextInQueue = async () => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      return;
    }
    
    isPlaying.current = true;
    const pcmData = audioQueue.current.shift()!;
    const audioContext = new AudioContext({ sampleRate: 24000 });
    const buffer = audioContext.createBuffer(1, pcmData.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcmData.length; i++) {
      channelData[i] = pcmData[i] / 0x7FFF;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      audioContext.close();
      playNextInQueue();
    };
    source.start();
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    stopMic();
    setIsActive(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg border border-white/10 rounded-[40px] overflow-hidden flex flex-col h-[85vh] shadow-2xl shadow-emerald-500/5"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-white/20'}`}>
              <Zap size={24} className={isActive ? 'animate-pulse' : ''} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Native Audio Practice</h2>
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Zero-Latency Conversational Mode</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
          {!isActive && !isConnecting ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-24 h-24 border border-white/10 rounded-[32px] flex items-center justify-center text-white/10">
                <Bot size={48} />
              </div>
              <div className="space-y-4 max-w-md">
                <h3 className="text-2xl font-bold text-white">Ready for a real-time challenge?</h3>
                <p className="text-white/40 leading-relaxed">
                  In this mode, you'll have a natural, spoken conversation with the AI. No buttons, no typing—just you and the interviewer.
                </p>
              </div>
              <button
                onClick={startSession}
                className="px-10 py-5 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                Start Live Interview
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {transcript.map((msg, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-6 rounded-3xl text-lg ${
                    msg.role === 'user' ? 'bg-white text-black font-medium' : 'bg-white/[0.05] text-white/80 border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isConnecting && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 size={32} className="animate-spin text-emerald-500" />
                  <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">Establishing Neural Link...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {isActive && (
          <div className="p-10 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest">Live Connection Active</span>
              </div>
              <div className="h-4 w-[1px] bg-white/10" />
              <div className="flex items-center gap-2 text-white/20">
                <Volume2 size={14} />
                <span className="font-mono text-[10px] uppercase tracking-widest">Audio Output: Zephyr</span>
              </div>
            </div>
            <button
              onClick={stopSession}
              className="px-8 py-4 border border-red-500/20 bg-red-500/5 text-red-500 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-500/10 transition-all"
            >
              End Session
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
