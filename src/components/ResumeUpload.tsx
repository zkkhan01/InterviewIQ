import { useState, useCallback, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Loader2, ChevronDown, CheckCircle2, AlertCircle, BrainCircuit, ArrowLeft } from 'lucide-react';
import { extractTextFromPdf } from '../utils/pdf';
import { generateQuestions, generateQuiz, InterviewQuestion, QuizQuestion, InterviewType } from '../services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ResumeUploadProps {
  onProcessed: (text: string, role: string, questions: InterviewQuestion[]) => void;
  onQuizStart: (text: string, quiz: QuizQuestion[]) => void;
  onBack: () => void;
}

const ROLES = [
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "Marketing Specialist",
  "Custom"
];

export const ResumeUpload = ({ onProcessed, onQuizStart, onBack }: ResumeUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState(ROLES[0]);
  const [interviewType, setInterviewType] = useState<InterviewType>('mixed');
  const [customRole, setCustomRole] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumePreview, setResumePreview] = useState<string>("");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File is too large. Max size is 10MB.");
        return;
      }

      setFile(selectedFile);
      setError(null);
      setIsProcessing(true);
      try {
        const text = await extractTextFromPdf(selectedFile);
        setResumeText(text);
        setResumePreview(text.slice(0, 500) + "...");
      } catch (err: any) {
        console.error("PDF Parsing Error:", err);
        setError(err.message || "Failed to parse PDF. Please try again.");
        setFile(null);
        setResumeText("");
        setResumePreview("");
      } finally {
        setIsProcessing(false);
      }
    } else if (selectedFile) {
      setError("Please upload a valid PDF file.");
    }
  };

  const handleGenerate = async () => {
    if (!resumeText) {
      setError("No resume content found. Please re-upload.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const selectedRole = role === "Custom" ? customRole : role;
      const questions = await generateQuestions(resumeText, selectedRole, interviewType);
      onProcessed(resumeText, selectedRole, questions);
    } catch (err) {
      console.error("Question Generation Error:", err);
      setError("Failed to generate questions. Please check your connection and try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!resumeText) return;
    setIsQuizLoading(true);
    setError(null);
    try {
      const quiz = await generateQuiz(resumeText);
      onQuizStart(resumeText, quiz);
    } catch (err) {
      setError("Failed to generate quiz. Please try again.");
    } finally {
      setIsQuizLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/[0.02] rounded-xl text-white/40 hover:text-white transition-all"
        >
          <ArrowLeft size={16} />
          <span className="font-mono text-[10px] uppercase tracking-widest">Go Back</span>
        </button>
      </div>

      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter">DATA INGESTION</h2>
        <p className="text-white/40 font-light">Upload your technical documentation (Resume) to begin.</p>
      </div>

      <div className="space-y-10">
        {/* Dropzone */}
        <motion.div
          whileHover={{ borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' }}
          className={cn(
            "relative border border-white/10 rounded-3xl p-16 text-center transition-all bg-white/[0.02]",
            file ? "border-white/40 bg-white/[0.05]" : ""
          )}
        >
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center">
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border border-white/20 flex items-center justify-center mb-6 text-white">
                  <FileText size={24} />
                </div>
                <p className="font-mono text-sm text-white tracking-tight">{file.name}</p>
                <p className="font-mono text-[10px] text-white/30 mt-2 uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB / READY</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 border border-white/10 flex items-center justify-center mb-6 text-white/20">
                  <Upload size={24} />
                </div>
                <p className="font-mono text-sm text-white/40 tracking-widest uppercase">Select PDF Source</p>
                <p className="font-mono text-[10px] text-white/20 mt-2 uppercase">Drag and drop or click to browse</p>
              </>
            )}
          </div>
        </motion.div>

        {resumePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-8 border border-white/10 bg-white/[0.01] rounded-3xl"
          >
            <h3 className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em] mb-4">Extracted Buffer</h3>
            <p className="font-mono text-xs text-white/40 leading-relaxed line-clamp-3 italic">{resumePreview}</p>
          </motion.div>
        )}

        {/* Role & Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">Target Vector</label>
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full appearance-none px-4 py-4 bg-transparent border border-white/10 rounded-2xl text-white font-mono text-sm focus:border-white/40 outline-none transition-all cursor-pointer hover:bg-white/[0.02]"
              >
                {ROLES.map(r => <option key={r} value={r} className="bg-bg">{r}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="space-y-4">
            <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">Interview Mode</label>
            <div className="relative">
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                className="w-full appearance-none px-4 py-4 bg-transparent border border-white/10 rounded-2xl text-white font-mono text-sm focus:border-white/40 outline-none transition-all cursor-pointer hover:bg-white/[0.02]"
              >
                <option value="mixed" className="bg-bg">Mixed Analysis</option>
                <option value="technical" className="bg-bg">Technical Deep-Dive</option>
                <option value="behavioral" className="bg-bg">Behavioral Dynamics</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
            </div>
          </div>
        </div>

        {role === "Custom" && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <label className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">Custom Parameter</label>
            <input
              type="text"
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              placeholder="Enter role title..."
              className="w-full px-4 py-4 bg-transparent border border-white/10 rounded-2xl text-white font-mono text-sm focus:border-white/40 outline-none transition-all placeholder:text-white/10 hover:bg-white/[0.02]"
            />
          </motion.div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 border border-red-500/20 bg-red-500/5 text-red-500 font-mono text-[10px] uppercase tracking-widest mt-10 rounded-2xl">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <button
          disabled={!resumeText || isProcessing || isQuizLoading || (role === "Custom" && !customRole)}
          onClick={handleGenerate}
          className="w-full py-5 bg-white text-black rounded-2xl font-bold text-sm tracking-[0.2em] uppercase hover:bg-white/90 disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/5 hover:shadow-white/10"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Compile Questions
            </>
          )}
        </button>

        <button
          disabled={!resumeText || isProcessing || isQuizLoading}
          onClick={handleStartQuiz}
          className="w-full py-5 border border-white/20 text-white rounded-2xl font-bold text-sm tracking-[0.2em] uppercase hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
        >
          {isQuizLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Generating Quiz...
            </>
          ) : (
            <>
              <BrainCircuit size={18} />
              Keyword Quiz
            </>
          )}
        </button>
      </div>
    </div>
  );
};
