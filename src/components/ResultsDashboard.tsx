import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { 
  Award, CheckCircle2, AlertTriangle, Lightbulb, RotateCcw, 
  ChevronRight, TrendingUp, Target, MessageSquare, ShieldCheck, BrainCircuit, Zap, Loader2, Sparkles
} from 'lucide-react';
import { EvaluationResult, InterviewQuestion } from '../services/gemini';

interface ResultsDashboardProps {
  results: EvaluationResult[];
  questions: InterviewQuestion[];
  onRetry: () => void;
}

export const ResultsDashboard = ({ results, questions, onRetry }: ResultsDashboardProps) => {
  // Calculate average scores
  const avgScores = results.reduce((acc, curr) => {
    acc.technical_depth += curr.dimension_scores.technical_depth;
    acc.relevance += curr.dimension_scores.relevance;
    acc.communication += curr.dimension_scores.communication;
    acc.problem_solving += curr.dimension_scores.problem_solving;
    acc.confidence += curr.dimension_scores.confidence;
    acc.overall += curr.overall_score;
    return acc;
  }, { technical_depth: 0, relevance: 0, communication: 0, problem_solving: 0, confidence: 0, overall: 0 });

  const count = results.length;
  const radarData = [
    { subject: 'Technical Depth', A: avgScores.technical_depth / count, fullMark: 100 },
    { subject: 'Communication', A: avgScores.communication / count, fullMark: 100 },
    { subject: 'Relevance', A: avgScores.relevance / count, fullMark: 100 },
    { subject: 'Confidence', A: avgScores.confidence / count, fullMark: 100 },
    { subject: 'Problem Solving', A: avgScores.problem_solving / count, fullMark: 100 },
  ];

  const overallScore = Math.round(avgScores.overall / count);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 border border-white/10 bg-white/[0.02] text-white mb-8 rounded-2xl"
        >
          <Award size={32} />
        </motion.div>
        <h2 className="text-5xl font-bold text-white mb-4 tracking-tighter uppercase">Evaluation Report</h2>
        <p className="text-white/40 font-light tracking-widest uppercase text-xs">Session analysis complete / Metrics aggregated</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-4 p-10 border border-white/10 bg-white/[0.01] flex flex-col items-center justify-center text-center rounded-3xl"
        >
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={552.92}
                initial={{ strokeDashoffset: 552.92 }}
                animate={{ strokeDashoffset: 552.92 - (552.92 * overallScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="text-white"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-white tracking-tighter">{overallScore}</span>
              <span className="font-mono text-[8px] text-white/30 uppercase tracking-[0.3em] mt-2">Aggregate Index</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 w-full">
            <div className="p-4 border border-white/5 bg-white/[0.01] text-center rounded-2xl hover:bg-white/[0.02] transition-colors">
              <p className="font-mono text-[8px] text-white/20 uppercase mb-2 tracking-widest">Status</p>
              <p className="font-bold text-white text-xs uppercase tracking-widest">{overallScore >= 70 ? "OPTIMAL" : "SUBOPTIMAL"}</p>
            </div>
            <div className="p-4 border border-white/5 bg-white/[0.01] text-center rounded-2xl hover:bg-white/[0.02] transition-colors">
              <p className="font-mono text-[8px] text-white/20 uppercase mb-2 tracking-widest">Samples</p>
              <p className="font-bold text-white text-xs uppercase tracking-widest">{count}</p>
            </div>
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-8 p-10 border border-white/10 bg-white/[0.01] rounded-3xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] flex items-center gap-3">
              <TrendingUp size={14} />
              Vector Analysis
            </h3>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#FFFFFF"
                  strokeWidth={1}
                  fill="#FFFFFF"
                  fillOpacity={0.05}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Detailed Feedback */}
      <div className="space-y-10">
        <h3 className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] px-4">Trace Logs / Feedback</h3>
        {results.map((res, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="p-10 border border-white/10 bg-white/[0.01] space-y-10 rounded-3xl hover:border-white/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="font-mono text-xs text-white/20">0{i + 1}</span>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white tracking-tight">Sequence {i + 1}</h4>
                  <span className="font-mono text-[8px] text-white/20 uppercase tracking-widest px-2 py-0.5 border border-white/5 rounded-full">
                    {questions[i]?.type || 'Standard'}
                  </span>
                </div>
              </div>
              <div className="font-mono text-xs text-white/40 tracking-widest">
                INDEX: {res.overall_score}.00
              </div>
            </div>

            <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl">
              <p className="text-white/80 text-lg leading-relaxed font-medium">
                {questions[i]?.question}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Strengths & Weaknesses */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
                    <CheckCircle2 size={12} className="text-white/40" />
                    Positive Indicators
                  </div>
                  <ul className="space-y-3">
                    {res.strengths.map((s, j) => (
                      <li key={j} className="flex items-start gap-3 text-white/60 text-sm font-light leading-relaxed">
                        <span className="mt-2 w-1 h-1 bg-white/20 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
                    <AlertTriangle size={12} className="text-white/40" />
                    Optimization Required
                  </div>
                  <ul className="space-y-3">
                    {res.weaknesses.map((w, j) => (
                      <li key={j} className="flex items-start gap-3 text-white/60 text-sm font-light leading-relaxed">
                        <span className="mt-2 w-1 h-1 bg-white/20 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Improved Answer */}
              <div className="p-8 border border-white/5 bg-white/[0.02] space-y-4 rounded-2xl">
                <div className="flex items-center gap-3 font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
                  <Lightbulb size={12} className="text-white/40" />
                  Refined Output
                </div>
                <p className="text-white/80 text-sm leading-relaxed font-light italic">
                  "{res.improved_answer}"
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-24 flex flex-col items-center gap-8"
      >
        <button
          onClick={onRetry}
          className="group flex items-center gap-3 px-12 py-5 border border-white/20 bg-transparent text-white font-bold text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-all rounded-2xl shadow-lg shadow-white/5 hover:shadow-white/10"
        >
          <RotateCcw size={18} className="group-hover:-rotate-45 transition-transform" />
          Re-Initialize
        </button>
        <p className="font-mono text-[8px] text-white/10 uppercase tracking-[0.3em]">End of report / Session volatile</p>
      </motion.div>
    </div>
  );
};
