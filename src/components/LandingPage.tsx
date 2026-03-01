import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, Zap, Trophy, Clock, TrendingUp } from 'lucide-react';
import { UserStatsDashboard } from './UserStats';
import { UserStats } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onLiveStart: () => void;
  stats: UserStats;
}

export const LandingPage = ({ onStart, onLiveStart, stats }: LandingPageProps) => {
  return (
    <div className="max-w-6xl mx-auto py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div className="space-y-12">
          <div className="space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-7xl md:text-8xl font-black tracking-tighter text-white leading-[0.85]"
            >
              INTERVIEW<br />
              <span className="text-white/20">IQ</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/50 max-w-xl leading-relaxed font-light"
            >
              A high-fidelity simulation environment for high-stakes interviews. 
              Master your technical narrative through data-driven feedback and 30-day mastery challenges.
            </motion.p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.9)" }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="group flex items-center gap-3 px-10 py-5 bg-white text-black rounded-2xl font-bold text-sm transition-all uppercase tracking-widest shadow-2xl shadow-white/10"
            >
              Initialize Session
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLiveStart}
              className="group flex items-center gap-3 px-10 py-5 border border-white/10 bg-white/[0.02] text-white rounded-2xl font-bold text-sm transition-all uppercase tracking-widest hover:bg-white/[0.05]"
            >
              Live Practice
              <Zap size={18} className="text-emerald-500" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-12 border-t border-white/5">
            <div className="space-y-3">
              <div className="w-10 h-10 border border-white/10 bg-white/[0.02] flex items-center justify-center rounded-xl text-white/60">
                <Zap size={18} />
              </div>
              <h3 className="font-bold text-white text-sm tracking-widest uppercase">Live API</h3>
              <p className="text-white/30 text-xs leading-relaxed">Real-time conversational voice practice with zero latency.</p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 border border-white/10 bg-white/[0.02] flex items-center justify-center rounded-xl text-white/60">
                <Target size={18} />
              </div>
              <h3 className="font-bold text-white text-sm tracking-widest uppercase">Mastery</h3>
              <p className="text-white/30 text-xs leading-relaxed">Track your progress through a gamified 30-day challenge.</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="relative"
        >
          <div className="absolute -inset-20 bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
          <UserStatsDashboard stats={stats} />
        </motion.div>
      </div>
    </div>
  );
};
