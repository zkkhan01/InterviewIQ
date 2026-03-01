import { motion } from 'framer-motion';
import { Trophy, Clock, Target, Flame, Calendar, TrendingUp } from 'lucide-react';
import { UserStats } from '../types';

interface UserStatsProps {
  stats: UserStats;
}

export const UserStatsDashboard = ({ stats }: UserStatsProps) => {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const progress = (stats.challengeDay / 30) * 100;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tighter uppercase">30-Day Mastery Challenge</h2>
          <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mt-1">Day {stats.challengeDay} of 30</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 border border-white/10 bg-white/[0.02] rounded-xl">
          <Flame size={16} className="text-orange-500" />
          <span className="font-mono text-sm font-bold text-white">{stats.dailyStreak} Day Streak</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-blue-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Clock size={20} />} 
          label="Time Invested" 
          value={formatTime(stats.totalTimeSpent)} 
          subValue="Total focus time"
        />
        <StatCard 
          icon={<Target size={20} />} 
          label="Questions Mastered" 
          value={stats.questionsMastered.toString()} 
          subValue="High-score answers"
        />
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Avg. Accuracy" 
          value={`${Math.round(stats.totalAccuracy)}%`} 
          subValue="Performance index"
        />
      </div>

      <div className="p-8 border border-white/10 bg-white/[0.01] rounded-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Calendar size={18} className="text-white/40" />
          <h3 className="font-mono text-[10px] text-white/30 uppercase tracking-[0.2em]">Activity Log</h3>
        </div>
        <div className="space-y-4">
          {stats.history.length === 0 ? (
            <p className="text-white/20 text-xs italic text-center py-4">No activity recorded yet. Start a session to track progress.</p>
          ) : (
            stats.history.slice(-5).reverse().map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.02] rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border border-white/10 flex items-center justify-center rounded-lg text-white/40">
                    {item.type === 'interview' ? <Trophy size={14} /> : <Target size={14} />}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium capitalize">{item.type} Session</p>
                    <p className="text-[10px] text-white/20 font-mono">{new Date(item.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{item.score}%</p>
                  <p className="text-[10px] text-white/20 font-mono uppercase">Score</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue }: { icon: any, label: string, value: string, subValue: string }) => (
  <div className="p-6 border border-white/10 bg-white/[0.02] rounded-3xl space-y-4 hover:border-white/20 transition-all">
    <div className="w-10 h-10 border border-white/10 flex items-center justify-center rounded-xl text-white/60">
      {icon}
    </div>
    <div>
      <p className="text-xs text-white/40 font-mono uppercase tracking-widest">{label}</p>
      <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
      <p className="text-[10px] text-white/20 mt-1">{subValue}</p>
    </div>
  </div>
);
