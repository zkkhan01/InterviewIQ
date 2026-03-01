/**
 * Zain Khan and Shanzay Khan
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingPage } from './components/LandingPage';
import { ResumeUpload } from './components/ResumeUpload';
import { InterviewSession } from './components/InterviewSession';
import { ResultsDashboard } from './components/ResultsDashboard';
import { QuizSession } from './components/QuizSession';
import { LivePractice } from './components/LivePractice';
import { InterviewQuestion, EvaluationResult, QuizQuestion } from './services/gemini';
import { UserStats, INITIAL_STATS } from './types';

type Page = 'landing' | 'upload' | 'interview' | 'results' | 'quiz' | 'live';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [resumeText, setResumeText] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('interview_iq_stats');
    if (saved) return JSON.parse(saved);
    return INITIAL_STATS;
  });

  useEffect(() => {
    localStorage.setItem('interview_iq_stats', JSON.stringify(stats));
  }, [stats]);

  const handleStart = () => setCurrentPage('upload');
  
  const handleResumeProcessed = (text: string, selectedRole: string, generatedQuestions: InterviewQuestion[]) => {
    setResumeText(text);
    setRole(selectedRole);
    setQuestions(generatedQuestions);
    setCurrentPage('interview');
  };

  const handleQuizStart = (text: string, generatedQuiz: QuizQuestion[]) => {
    setResumeText(text);
    setQuiz(generatedQuiz);
    setCurrentPage('quiz');
  };

  const handleInterviewComplete = (evaluations: EvaluationResult[]) => {
    setResults(evaluations);
    
    // Update stats
    const avgScore = evaluations.reduce((acc, curr) => acc + curr.overall_score, 0) / evaluations.length;
    const masteredCount = evaluations.filter(e => e.overall_score >= 80).length;
    
    setStats(prev => {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = prev.lastActiveDate.split('T')[0];
      let streak = prev.dailyStreak;
      let day = prev.challengeDay;

      if (today !== lastActive) {
        const diff = Math.floor((new Date(today).getTime() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) streak += 1;
        else if (diff > 1) streak = 1;
        
        if (day < 30) day += 1;
      }

      return {
        ...prev,
        totalTimeSpent: prev.totalTimeSpent + (evaluations.length * 120), // Estimate
        questionsMastered: prev.questionsMastered + masteredCount,
        sessionsCompleted: prev.sessionsCompleted + 1,
        totalAccuracy: prev.totalAccuracy === 0 ? avgScore : (prev.totalAccuracy + avgScore) / 2,
        dailyStreak: streak,
        challengeDay: day,
        lastActiveDate: new Date().toISOString(),
        history: [...prev.history, { date: new Date().toISOString(), score: avgScore, type: 'interview' }]
      };
    });

    setCurrentPage('results');
  };

  const handleQuizComplete = (score: number, total: number) => {
    const accuracy = (score / total) * 100;
    setStats(prev => ({
      ...prev,
      history: [...prev.history, { date: new Date().toISOString(), score: accuracy, type: 'quiz' }]
    }));
    handleRetry();
  };

  const handleRetry = () => {
    setResults([]);
    setQuestions([]);
    setQuiz([]);
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen bg-bg text-white font-sans selection:bg-white/10 selection:text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          {currentPage === 'landing' && (
            <LandingPage 
              onStart={handleStart} 
              onLiveStart={() => setCurrentPage('live')}
              stats={stats} 
            />
          )}
          {currentPage === 'live' && (
            <LivePractice onClose={handleRetry} />
          )}
          {currentPage === 'upload' && (
            <ResumeUpload 
              onProcessed={handleResumeProcessed} 
              onQuizStart={handleQuizStart}
              onBack={handleRetry}
            />
          )}
          {currentPage === 'interview' && (
            <InterviewSession 
              questions={questions} 
              resumeText={resumeText} 
              role={role} 
              onComplete={handleInterviewComplete} 
              onQuit={handleRetry}
            />
          )}
          {currentPage === 'quiz' && (
            <QuizSession 
              quiz={quiz}
              onComplete={handleQuizComplete}
              onQuit={handleRetry}
            />
          )}
          {currentPage === 'results' && (
            <ResultsDashboard 
              results={results} 
              questions={questions}
              onRetry={handleRetry} 
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
