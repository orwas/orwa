import { useState, useEffect } from 'react';
import { UserProgress } from '../types';

const STORAGE_KEY = 'deutsch_meister_progress';

const defaultProgress: UserProgress = {
  completedLessons: [],
  learnedWords: [],
  quizScores: {},
  currentLesson: 1,
  streak: 0,
  lastStudyDate: '',
};

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading progress:', e);
    }
    return defaultProgress;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  }, [progress]);

  const completeLesson = (lessonId: number) => {
    setProgress(prev => {
      const completed = prev.completedLessons.includes(lessonId)
        ? prev.completedLessons
        : [...prev.completedLessons, lessonId];
      
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let newStreak = prev.streak;
      
      if (prev.lastStudyDate === yesterday) {
        newStreak = prev.streak + 1;
      } else if (prev.lastStudyDate !== today) {
        newStreak = 1;
      }

      return {
        ...prev,
        completedLessons: completed,
        currentLesson: Math.max(prev.currentLesson, lessonId + 1),
        streak: newStreak,
        lastStudyDate: today,
      };
    });
  };

  const saveQuizScore = (lessonId: number, score: number) => {
    setProgress(prev => ({
      ...prev,
      quizScores: { ...prev.quizScores, [lessonId]: Math.max(prev.quizScores[lessonId] || 0, score) },
    }));
  };

  const addLearnedWords = (words: string[]) => {
    setProgress(prev => ({
      ...prev,
      learnedWords: [...new Set([...prev.learnedWords, ...words])],
    }));
  };

  const resetProgress = () => {
    setProgress(defaultProgress);
  };

  return { progress, completeLesson, saveQuizScore, addLearnedWords, resetProgress };
}
