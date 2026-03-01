import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Timer, ChevronRight, Loader2, AlertCircle, Sparkles, MessageSquare, Info, LogOut, Volume2, Lightbulb, Zap, ArrowLeft } from 'lucide-react';
import { InterviewQuestion, EvaluationResult, evaluateAnswer, generateSpeech, getFastResponse } from '../services/gemini';

interface InterviewSessionProps {
  questions: InterviewQuestion[];
  resumeText: string;
  role: string;
  onComplete: (results: EvaluationResult[]) => void;
  onQuit: () => void;
}

export const InterviewSession = ({ questions, resumeText, role, onComplete, onQuit }: InterviewSessionProps) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationPromises, setEvaluationPromises] = useState<Promise<EvaluationResult>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [liveFeedback, setLiveFeedback] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Auto-read question when it changes
    handleSpeakQuestion();
  }, [currentIdx]);

  const handleSpeakQuestion = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(questions[currentIdx].question);
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audioRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      }
    } catch (err) {
      console.error("TTS Error:", err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNext();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isSubmitting]);

  // Live AI Coach Logic using Fast AI Responses
  useEffect(() => {
    const words = answer.trim().split(/\s+/).length;
    if (words > 10 && words % 20 === 0) {
      const fetchFeedback = async () => {
        try {
          const feedback = await getFastResponse(`Give a very brief (1 sentence) encouraging coaching tip for an interview candidate who has said: "${answer.slice(-100)}"`);
          setLiveFeedback(feedback);
        } catch (err) {
          console.error("Fast feedback error:", err);
        }
      };
      fetchFeedback();
    }
  }, [answer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setAnswer(prev => prev + (prev ? " " : "") + finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      const errorMessages: Record<string, string> = {
        'network': "Network error: The browser's speech service is unreachable. This often happens if you're behind a VPN or firewall that blocks Google's transcription servers.",
        'not-allowed': "Microphone access was denied. Please check your browser permissions.",
        'no-speech': "No speech detected. Please try speaking again.",
        'audio-capture': "Microphone capture failed. Please check your hardware.",
        'aborted': "Speech recognition was aborted.",
      };

      setError(errorMessages[event.error] || `Speech recognition error: ${event.error}. Please try again or type manually.`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setError(null);
    } catch (e) {
      console.error("Recognition start error", e);
      setError("Failed to start speech recognition. Please try again.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNext = async () => {
    if (isSubmitting) return;

    const currentQuestion = questions[currentIdx].question;
    const currentAnswer = answer || "No answer provided.";
    const voiceNote = isRecording ? "Confident tone detected" : undefined;
    
    const promise = evaluateAnswer(
      resumeText,
      role,
      currentQuestion,
      currentAnswer,
      voiceNote
    );

    const newPromises = [...evaluationPromises, promise];
    setEvaluationPromises(newPromises);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setAnswer("");
      setTimeLeft(120);
      setLiveFeedback(null);
      setShowHint(false);
      if (isRecording) stopRecording();
      stopSpeaking();
    } else {
      setIsSubmitting(true);
      try {
        const finalResults = await Promise.all(newPromises);
        onComplete(finalResults);
      } catch (err) {
        setError("Error finalizing report. Please try again.");
        setIsSubmitting(false);
      }
    }
  };

  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to go back? Progress will be lost.")) {
              onQuit();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/[0.02] rounded-xl text-white/40 hover:text-white transition-all"
        >
          <ArrowLeft size={16} />
          <span className="font-mono text-[10px] uppercase tracking-widest">Go Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        <div className="space-y-10">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <div className="flex justify-between items-end">
                <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">
                  Sequence {currentIdx + 1} / {questions.length}
                </span>
                <span className="font-mono text-[10px] text-white/50">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="relative w-full h-[2px] bg-white/5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="absolute top-0 left-0 h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 border border-white/10 bg-white/[0.02] rounded-xl">
                <Timer size={16} className={timeLeft < 30 ? "text-red-500 animate-pulse" : "text-white/20"} />
                <span className={`font-mono text-sm font-bold tracking-widest ${timeLeft < 30 ? "text-red-500" : "text-white/60"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-10"
          >
            {/* Question Card */}
            <div className="p-10 border border-white/10 bg-white/[0.01] rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 flex gap-2">
                <button 
                  onClick={handleSpeakQuestion}
                  className={`p-2 border border-white/5 rounded-lg transition-all ${isSpeaking ? "text-emerald-400 bg-emerald-400/5" : "text-white/20 hover:text-white"}`}
                >
                  <Volume2 size={14} />
                </button>
                <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest px-3 py-1 border border-white/5 rounded-full flex items-center">
                  {questions[currentIdx].type}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-white leading-tight tracking-tight pr-20">
                {questions[currentIdx].question}
              </h3>
              
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-6 border border-white/5 bg-white/[0.02] rounded-2xl"
                >
                  <div className="flex gap-3">
                    <Lightbulb size={16} className="text-emerald-400 shrink-0 mt-1" />
                    <p className="text-sm text-white/60 leading-relaxed">
                      <span className="font-bold text-white/80">Expert Outline:</span> {questions[currentIdx].hint}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Answer Area */}
            <div className="space-y-6">
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Speak or type your response..."
                  className="w-full h-72 p-8 bg-transparent border border-white/10 rounded-3xl focus:border-white/40 outline-none transition-all resize-none text-xl text-white/80 placeholder:text-white/5 font-light hover:bg-white/[0.01]"
                />
                
                <div className="absolute bottom-8 right-8 flex items-center gap-4">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className={`group relative w-12 h-12 border rounded-xl flex items-center justify-center transition-all ${
                      showHint ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent border-white/10 text-white/40 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    <Lightbulb size={20} />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                      {showHint ? "Hide Hint" : "Show Hint"}
                    </span>
                  </button>

                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`group relative w-12 h-12 border rounded-xl flex items-center justify-center transition-all ${
                      isRecording 
                        ? "bg-red-500 border-red-500 text-white animate-pulse" 
                        : "bg-transparent border-white/10 text-white/40 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">
                      {isRecording ? "Stop Voice" : "Live Voice"}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-[10px] uppercase tracking-widest rounded-xl">
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="flex-1">{error}</span>
                    {error.includes("Network error") && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setError(null); startRecording(); }}
                          className="px-3 py-1 border border-red-500/40 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          Retry
                        </button>
                        <button 
                          onClick={() => { setError(null); }}
                          className="px-3 py-1 border border-white/10 hover:bg-white/5 rounded-lg transition-colors text-white/40"
                        >
                          Type Manually
                        </button>
                      </div>
                    )}
                  </div>
                  {error.includes("Network error") && (
                    <p className="px-4 text-[10px] text-white/20 italic">
                      Tip: If this persists, your browser's speech service might be blocked by a firewall or VPN. Manual typing is always supported.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  disabled={isSubmitting}
                  onClick={handleNext}
                  className="group flex items-center gap-3 px-10 py-5 bg-white text-black rounded-2xl font-bold text-sm tracking-[0.2em] uppercase hover:bg-white/90 disabled:opacity-20 transition-all shadow-lg shadow-white/5 hover:shadow-white/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Finalizing Report...
                    </>
                  ) : (
                    <>
                      {currentIdx === questions.length - 1 ? "Finalize" : "Commit"}
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
