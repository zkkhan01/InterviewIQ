import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, BrainCircuit, Award, LogOut } from 'lucide-react';
import { QuizQuestion } from '../services/gemini';

interface QuizSessionProps {
  quiz: QuizQuestion[];
  onComplete: (score: number, total: number) => void;
  onQuit: () => void;
}

export const QuizSession = ({ quiz, onComplete, onQuit }: QuizSessionProps) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === quiz[currentIdx].correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < quiz.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto text-center py-20"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 border border-white/10 bg-white/[0.02] text-white mb-8 rounded-3xl">
          <Award size={40} />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tighter uppercase">Quiz Completed</h2>
        <p className="text-white/40 mb-12 font-mono text-sm tracking-widest">
          SCORE: {score} / {quiz.length}
        </p>
        
        <div className="grid grid-cols-1 gap-4 mb-12">
          <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl">
            <p className="text-white/60 text-sm leading-relaxed">
              {score === quiz.length 
                ? "Perfect! You have a strong grasp of the technical terms in your resume." 
                : "Good effort. Reviewing these key terms will help you sound more confident in technical discussions."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onComplete(score, quiz.length)}
          className="px-12 py-5 bg-white text-black rounded-2xl font-bold text-sm tracking-[0.2em] uppercase hover:bg-white/90 transition-all shadow-lg shadow-white/5"
        >
          Return to Dashboard
        </button>
      </motion.div>
    );
  }

  const currentQuestion = quiz[currentIdx];
  const progress = ((currentIdx + 1) / quiz.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="flex justify-between items-end">
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em]">
              Quiz Sequence {currentIdx + 1} / {quiz.length}
            </span>
            <span className="font-mono text-[10px] text-white/50">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative w-full h-[2px] bg-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="absolute top-0 left-0 h-full bg-white"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/[0.02] rounded-xl">
            <BrainCircuit size={14} className="text-white/40" />
            <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">Keyword Analysis</span>
          </div>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to quit the quiz?")) {
                onQuit();
              }
            }}
            className="p-2 border border-white/10 bg-white/[0.02] rounded-xl text-white/40 hover:text-red-400 hover:border-red-400/20 transition-all"
            title="Quit Quiz"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-10"
        >
          <div className="p-10 border border-white/10 bg-white/[0.01] rounded-3xl">
            <span className="font-mono text-[10px] text-white/20 uppercase tracking-[0.3em] mb-4 block">
              Topic: {currentQuestion.keyword}
            </span>
            <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, i) => {
              const isCorrect = option === currentQuestion.correctAnswer;
              const isSelected = option === selectedOption;
              
              let variant = "default";
              if (isAnswered) {
                if (isCorrect) variant = "correct";
                else if (isSelected) variant = "incorrect";
              }

              return (
                <button
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(option)}
                  className={`p-6 text-left border rounded-2xl transition-all flex items-center justify-between ${
                    variant === "correct" ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" :
                    variant === "incorrect" ? "border-red-500/50 bg-red-500/5 text-red-400" :
                    isSelected ? "border-white/40 bg-white/5 text-white" :
                    "border-white/10 bg-white/[0.01] text-white/60 hover:border-white/30 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-sm font-medium">{option}</span>
                  {isAnswered && isCorrect && <CheckCircle2 size={18} />}
                  {isAnswered && isSelected && !isCorrect && <XCircle size={18} />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 border border-white/5 bg-white/[0.02] rounded-2xl space-y-4"
            >
              <p className="text-white/80 text-sm leading-relaxed">
                {currentQuestion.explanation}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-xl font-bold text-xs tracking-widest uppercase hover:bg-white/90 transition-all"
                >
                  {currentIdx === quiz.length - 1 ? "Finish" : "Next Question"}
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
