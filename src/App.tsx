import { useState, useEffect, useMemo } from 'react';
import { getAllLessons } from './data/lessonGenerator';
import { useProgress } from './hooks/useProgress';
import { useTTS } from './hooks/useTTS';
import type { Lesson, Word, Sentence, DialogLine, GrammarRule, Quiz } from './types';

// Icons as SVG components
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
);

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? '#fbbf24' : 'none'} stroke="#fbbf24" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

type Page = 'home' | 'lessons' | 'lesson' | 'words' | 'sentences' | 'dialog' | 'grammar' | 'quiz' | 'stats';

export default function App() {
  const lessons = useMemo(() => getAllLessons(), []);
  const { progress, completeLesson, saveQuizScore, addLearnedWords } = useProgress();
  const { speak } = useTTS();
  
  const [page, setPage] = useState<Page>('home');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [quizAnswers, setQuizAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showTranslation, setShowTranslation] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const filteredLessons = useMemo(() => {
    let filtered = lessons;
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(l => l.level === selectedLevel);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.title.toLowerCase().includes(term) || 
        l.titleAr.includes(term) ||
        l.topic.toLowerCase().includes(term) ||
        l.topicAr.includes(term)
      );
    }
    return filtered;
  }, [lessons, selectedLevel, searchTerm]);

  const totalWords = useMemo(() => {
    return lessons.reduce((acc, l) => acc + (l.words?.length || 0), 0);
  }, [lessons]);

  const completedPercentage = Math.round((progress.completedLessons.length / 60) * 100);

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setPage('lesson');
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShowTranslation({});
  };

  const goBack = () => {
    if (page === 'words' || page === 'sentences' || page === 'dialog' || page === 'grammar' || page === 'quiz') {
      setPage('lesson');
    } else if (page === 'lesson') {
      setPage('lessons');
    } else {
      setPage('home');
    }
  };

  const handleQuizSubmit = () => {
    if (!selectedLesson) return;
    setQuizSubmitted(true);
    const correct = selectedLesson.quizzes.filter((q, i) => quizAnswers[i] === q.correct).length;
    const score = Math.round((correct / selectedLesson.quizzes.length) * 100);
    saveQuizScore(selectedLesson.id, score);
    if (score >= 60) {
      completeLesson(selectedLesson.id);
      addLearnedWords(selectedLesson.words.map(w => w.de));
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'A1': return 'bg-green-500';
      case 'A2': return 'bg-blue-500';
      case 'B1': return 'bg-orange-500';
      case 'B2': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'A1': return darkMode ? 'bg-green-900/30' : 'bg-green-50';
      case 'A2': return darkMode ? 'bg-blue-900/30' : 'bg-blue-50';
      case 'B1': return darkMode ? 'bg-orange-900/30' : 'bg-orange-50';
      case 'B2': return darkMode ? 'bg-red-900/30' : 'bg-red-50';
      default: return darkMode ? 'bg-gray-800' : 'bg-gray-50';
    }
  };

  const getWordTypeColor = (type: string) => {
    switch (type) {
      case 'noun': return 'bg-blue-100 text-blue-800';
      case 'verb': return 'bg-green-100 text-green-800';
      case 'adjective': return 'bg-purple-100 text-purple-800';
      case 'adverb': return 'bg-yellow-100 text-yellow-800';
      case 'preposition': return 'bg-pink-100 text-pink-800';
      case 'conjunction': return 'bg-indigo-100 text-indigo-800';
      case 'pronoun': return 'bg-cyan-100 text-cyan-800';
      case 'phrase': return 'bg-orange-100 text-orange-800';
      case 'number': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case 'der': return 'text-blue-600 font-bold';
      case 'die': return 'text-red-600 font-bold';
      case 'das': return 'text-green-600 font-bold';
      default: return '';
    }
  };

  const bgClass = darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  // ==================== RENDER FUNCTIONS ====================

  const renderHeader = () => (
    <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm shadow-md`}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {page !== 'home' && (
            <button onClick={goBack} className="p-2 rounded-lg hover:bg-gray-200/50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
            <span className="text-3xl">🇩🇪</span>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-500 via-red-500 to-black bg-clip-text text-transparent">
                Deutsch Meister
              </h1>
              <p className="text-xs opacity-60">تعلم الألمانية في 60 يوم</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span>🔥</span>
            <span className="font-bold text-orange-500">{progress.streak}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <span>📚</span>
            <span className="font-bold text-blue-500">{progress.completedLessons.length}/60</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg hover:bg-gray-200/50 transition text-xl"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );

  const renderHome = () => (
    <div className="animate-fadeIn">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-yellow-400 via-red-500 to-gray-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">🇩🇪 Willkommen!</h2>
          <h3 className="text-2xl md:text-3xl font-bold mb-2">!أهلاً وسهلاً</h3>
          <p className="text-lg md:text-xl opacity-90 mb-6">تعلم اللغة الألمانية من الصفر حتى الاحتراف</p>
          <p className="text-base opacity-80 mb-8">60 درساً شاملاً | من A1 إلى B2 | أكثر من {totalWords} كلمة</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setPage('lessons')}
              className="px-8 py-4 bg-white text-red-600 font-bold rounded-xl shadow-lg hover:shadow-xl transition transform hover:scale-105 text-lg"
            >
              ابدأ التعلم 🚀
            </button>
            <button
              onClick={() => setPage('stats')}
              className="px-8 py-4 bg-white/20 backdrop-blur text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition text-lg"
            >
              إحصائياتي 📊
            </button>
          </div>
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-red-400/20 rounded-full blur-3xl"></div>
      </div>

      {/* Progress Overview */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '📖', label: 'الدروس المكتملة', value: `${progress.completedLessons.length}/60`, color: 'from-blue-500 to-blue-600' },
            { icon: '📝', label: 'الكلمات المتعلمة', value: progress.learnedWords.length.toString(), color: 'from-green-500 to-green-600' },
            { icon: '🔥', label: 'أيام متتالية', value: progress.streak.toString(), color: 'from-orange-500 to-orange-600' },
            { icon: '🎯', label: 'نسبة الإنجاز', value: `${completedPercentage}%`, color: 'from-purple-500 to-purple-600' },
          ].map((stat, i) => (
            <div key={i} className={`${cardClass} border rounded-xl p-4 text-center shadow-sm`}>
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text">{stat.value}</div>
              <div className="text-sm opacity-60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className={`${cardClass} border rounded-xl p-6 mb-8`}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg">تقدمك العام</h3>
            <span className="text-sm font-medium">{completedPercentage}%</span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all duration-1000"
              style={{ width: `${completedPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-3 text-xs opacity-60">
            <span>A1 مبتدئ</span>
            <span>A2 أساسي</span>
            <span>B1 متوسط</span>
            <span>B2 متقدم</span>
          </div>
        </div>

        {/* Level Overview */}
        <h3 className="text-xl font-bold mb-4">المستويات</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { level: 'A1', name: 'مبتدئ', desc: 'التحيات، العائلة، الطعام، التسوق', lessons: '1-15', emoji: '🌱' },
            { level: 'A2', name: 'أساسي', desc: 'السفر، الصحة، العمل، المشاعر', lessons: '16-30', emoji: '🌿' },
            { level: 'B1', name: 'متوسط', desc: 'المهنة، السياسة، القانون، البيئة', lessons: '31-45', emoji: '🌳' },
            { level: 'B2', name: 'متقدم', desc: 'العلوم، الأدب، الفلسفة، الامتحان', lessons: '46-60', emoji: '🏆' },
          ].map(item => {
            const levelLessons = lessons.filter(l => l.level === item.level);
            const completed = levelLessons.filter(l => progress.completedLessons.includes(l.id)).length;
            return (
              <div 
                key={item.level}
                onClick={() => { setSelectedLevel(item.level); setPage('lessons'); }}
                className={`${cardClass} border rounded-xl p-5 cursor-pointer hover:shadow-lg transition lesson-btn`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{item.emoji}</span>
                  <div>
                    <span className={`${getLevelColor(item.level)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                      {item.level}
                    </span>
                    <span className="text-sm ml-2 font-medium">{item.name}</span>
                  </div>
                </div>
                <p className="text-sm opacity-70 mb-3 text-right" dir="rtl">{item.desc}</p>
                <div className="flex justify-between items-center text-xs">
                  <span>الدروس {item.lessons}</span>
                  <span className="font-bold">{completed}/{levelLessons.length}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full ${getLevelColor(item.level)} rounded-full transition-all duration-500`}
                    style={{ width: `${(completed / levelLessons.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Start */}
        {progress.currentLesson <= 60 && (
          <div className={`${cardClass} border rounded-xl p-6 mb-8`}>
            <h3 className="font-bold text-lg mb-2">🎯 الدرس التالي</h3>
            {(() => {
              const nextLesson = lessons.find(l => l.id === progress.currentLesson) || lessons[0];
              return (
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="font-medium">{nextLesson.title}</p>
                    <p className="text-sm opacity-60">{nextLesson.titleAr}</p>
                    <span className={`inline-block mt-2 ${getLevelColor(nextLesson.level)} text-white px-2 py-0.5 rounded text-xs`}>
                      {nextLesson.level}
                    </span>
                  </div>
                  <button
                    onClick={() => openLesson(nextLesson)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition"
                  >
                    ابدأ الآن ▶
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );

  const renderLessons = () => (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn">
      {/* Filter & Search */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="flex gap-2 flex-wrap">
          {['all', 'A1', 'A2', 'B1', 'B2'].map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedLevel === level
                  ? 'bg-blue-500 text-white shadow-md'
                  : `${cardClass} border hover:shadow`
              }`}
            >
              {level === 'all' ? 'الكل' : level}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 ابحث عن درس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-blue-500 outline-none`}
            dir="rtl"
          />
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLessons.map((lesson, idx) => {
          const isCompleted = progress.completedLessons.includes(lesson.id);
          const score = progress.quizScores[lesson.id];
          return (
            <div
              key={lesson.id}
              onClick={() => openLesson(lesson)}
              className={`${cardClass} border rounded-xl p-5 cursor-pointer hover:shadow-xl transition lesson-btn animate-slideIn ${
                isCompleted ? 'ring-2 ring-green-400' : ''
              }`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-10 h-10 flex items-center justify-center rounded-full ${getLevelColor(lesson.level)} text-white font-bold text-sm`}>
                    {lesson.id}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(lesson.level)} text-white`}>
                    {lesson.level}
                  </span>
                </div>
                {isCompleted && <span className="text-green-500 text-xl">✅</span>}
              </div>
              <h3 className="font-bold text-base mb-1">{lesson.title}</h3>
              <p className="text-sm opacity-70 mb-2 text-right" dir="rtl">{lesson.titleAr}</p>
              <div className="flex items-center gap-3 text-xs opacity-60 flex-wrap">
                <span>📝 {lesson.words?.length || 0} كلمة</span>
                <span>💬 {lesson.sentences?.length || 0} جملة</span>
                {score !== undefined && (
                  <span className={`font-bold ${score >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    🎯 {score}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderLessonOverview = () => {
    if (!selectedLesson) return null;
    const lesson = selectedLesson;
    const isCompleted = progress.completedLessons.includes(lesson.id);

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
        {/* Lesson Header */}
        <div className={`${getLevelBg(lesson.level)} rounded-2xl p-6 mb-6 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <span className={`w-14 h-14 flex items-center justify-center rounded-2xl ${getLevelColor(lesson.level)} text-white font-bold text-xl`}>
              {lesson.id}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(lesson.level)} text-white font-bold`}>
                  {lesson.level}
                </span>
                <span className="text-xs opacity-60">يوم {lesson.id} من 60</span>
                {isCompleted && <span className="text-green-500">✅ مكتمل</span>}
              </div>
              <h2 className="text-2xl font-bold">{lesson.title}</h2>
              <p className="text-base opacity-70" dir="rtl">{lesson.titleAr}</p>
            </div>
          </div>
          <p className="text-sm opacity-80 mb-2">{lesson.description}</p>
          <p className="text-sm opacity-80 text-right" dir="rtl">{lesson.descriptionAr}</p>
        </div>

        {/* Lesson Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { page: 'words' as Page, icon: '📚', title: 'الكلمات', titleDe: 'Wörter', count: lesson.words?.length || 0, desc: 'كلمات جديدة مع أمثلة' },
            { page: 'sentences' as Page, icon: '💬', title: 'الجمل', titleDe: 'Sätze', count: lesson.sentences?.length || 0, desc: 'جمل مفيدة للتمرين' },
            { page: 'dialog' as Page, icon: '🗣️', title: 'الحوار', titleDe: 'Dialog', count: lesson.dialogs?.length || 0, desc: 'حوارات واقعية' },
            { page: 'grammar' as Page, icon: '📐', title: 'القواعد', titleDe: 'Grammatik', count: lesson.grammar?.length || 0, desc: 'شرح القواعد مع أمثلة' },
            { page: 'quiz' as Page, icon: '🎯', title: 'اختبار', titleDe: 'Quiz', count: lesson.quizzes?.length || 0, desc: 'اختبر فهمك' },
          ].map(section => (
            <button
              key={section.page}
              onClick={() => setPage(section.page)}
              className={`${cardClass} border rounded-xl p-5 text-right hover:shadow-lg transition lesson-btn`}
              dir="rtl"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{section.icon}</span>
                <div>
                  <h3 className="font-bold text-lg">{section.title}</h3>
                  <p className="text-xs opacity-50">{section.titleDe}</p>
                </div>
                <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${getLevelColor(lesson.level)} text-white`}>
                  {section.count}
                </span>
              </div>
              <p className="text-sm opacity-60">{section.desc}</p>
            </button>
          ))}
        </div>

        {/* Cultural Note */}
        {lesson.culturalNote && (
          <div className={`mt-6 ${cardClass} border rounded-xl p-5`}>
            <h3 className="font-bold text-lg mb-2">🏛️ ملاحظة ثقافية | Kulturhinweis</h3>
            <p className="text-sm opacity-80 mb-2">{lesson.culturalNote}</p>
            <p className="text-sm opacity-80 text-right" dir="rtl">{lesson.culturalNoteAr}</p>
          </div>
        )}
      </div>
    );
  };

  const renderWords = () => {
    if (!selectedLesson) return null;
    const words = selectedLesson.words || [];
    
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 animate-fadeIn">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold">📚 الكلمات | Wörter</h2>
          <span className={`px-4 py-2 rounded-full ${getLevelColor(selectedLesson.level)} text-white font-bold`}>
            {words.length} كلمة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {words.map((word: Word, idx: number) => (
            <div
              key={idx}
              className={`${cardClass} border rounded-xl p-4 word-card`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${getGenderColor(word.gender)}`}>
                      {word.de}
                    </span>
                    <button
                      onClick={() => speak(word.de)}
                      className="p-1 rounded-full hover:bg-blue-100 text-blue-500 transition"
                      title="Anhören"
                    >
                      <PlayIcon />
                    </button>
                  </div>
                  <p className="text-sm opacity-70 text-right" dir="rtl">{word.ar}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getWordTypeColor(word.type)}`}>
                  {word.type}
                </span>
              </div>
              {word.gender && (
                <div className="text-xs opacity-50 mb-1">
                  <span className={getGenderColor(word.gender)}>{word.gender}</span>
                  {word.plural && <span className="ml-2">Pl: {word.plural}</span>}
                </div>
              )}
              <div className={`mt-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} text-sm`}>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speak(word.example)}
                    className="p-0.5 rounded hover:bg-blue-100 text-blue-400"
                  >
                    <PlayIcon />
                  </button>
                  <span className="italic">{word.example}</span>
                </div>
                <p className="text-xs opacity-60 text-right mt-1" dir="rtl">{word.exampleAr}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSentences = () => {
    if (!selectedLesson) return null;
    const sentences = selectedLesson.sentences || [];

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6">💬 الجمل | Sätze</h2>
        <div className="space-y-3">
          {sentences.map((sentence: Sentence, idx: number) => (
            <div key={idx} className={`${cardClass} border rounded-xl p-4 animate-slideIn`} style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-base">{sentence.de}</p>
                    <button
                      onClick={() => speak(sentence.de)}
                      className="p-1 rounded-full hover:bg-blue-100 text-blue-500 flex-shrink-0"
                    >
                      <PlayIcon />
                    </button>
                  </div>
                  <button
                    onClick={() => setShowTranslation(prev => ({ ...prev, [`s${idx}`]: !prev[`s${idx}`] }))}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {showTranslation[`s${idx}`] ? 'إخفاء الترجمة' : 'إظهار الترجمة'} 👁️
                  </button>
                  {showTranslation[`s${idx}`] && (
                    <p className="text-sm opacity-70 mt-1 text-right animate-fadeIn" dir="rtl">{sentence.ar}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDialog = () => {
    if (!selectedLesson) return null;
    const dialogs = selectedLesson.dialogs || [];

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6">🗣️ الحوار | Dialog</h2>
        <div className="space-y-3">
          {dialogs.map((line: DialogLine, idx: number) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={idx}
                className={`flex ${isEven ? 'justify-start' : 'justify-end'} animate-slideIn`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className={`max-w-[85%] ${isEven 
                  ? `${darkMode ? 'bg-blue-900/50' : 'bg-blue-50'} rounded-tr-2xl rounded-br-2xl rounded-bl-2xl` 
                  : `${darkMode ? 'bg-green-900/50' : 'bg-green-50'} rounded-tl-2xl rounded-bl-2xl rounded-br-2xl`
                } p-4 border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isEven ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                      {line.speaker}
                    </span>
                    <button
                      onClick={() => speak(line.de)}
                      className="p-1 rounded-full hover:bg-gray-200 text-blue-500"
                    >
                      <PlayIcon />
                    </button>
                  </div>
                  <p className="font-medium mb-1">{line.de}</p>
                  <p className="text-sm opacity-60 text-right" dir="rtl">{line.ar}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              dialogs.forEach((line: DialogLine, i: number) => {
                setTimeout(() => speak(line.de), i * 3000);
              });
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition"
          >
            ▶ تشغيل الحوار كاملاً
          </button>
        </div>
      </div>
    );
  };

  const renderGrammar = () => {
    if (!selectedLesson) return null;
    const grammarRules = selectedLesson.grammar || [];

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6">📐 القواعد | Grammatik</h2>
        <div className="space-y-6">
          {grammarRules.map((rule: GrammarRule, idx: number) => (
            <div key={idx} className={`${cardClass} border rounded-xl p-6`}>
              <h3 className="text-xl font-bold mb-1 text-blue-600">{rule.title}</h3>
              <h4 className="text-base font-medium mb-3 opacity-70 text-right" dir="rtl">{rule.titleAr}</h4>
              
              <div className={`${darkMode ? 'bg-gray-700/50' : 'bg-blue-50'} rounded-lg p-4 mb-4`}>
                <p className="text-sm mb-2">{rule.explanation}</p>
                <p className="text-sm opacity-70 text-right" dir="rtl">{rule.explanationAr}</p>
              </div>

              {/* Examples */}
              <div className="mb-4">
                <h5 className="font-bold text-sm mb-2">Beispiele | أمثلة:</h5>
                <div className="space-y-2">
                  {rule.examples.map((ex, i) => (
                    <div key={i} className={`flex items-start gap-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                      <button onClick={() => speak(ex.de)} className="p-1 text-blue-500 flex-shrink-0 mt-0.5">
                        <PlayIcon />
                      </button>
                      <div>
                        <p className="font-medium text-sm">{ex.de}</p>
                        <p className="text-xs opacity-60 text-right" dir="rtl">{ex.ar}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              {rule.table && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        {rule.table.headers.map((h, i) => (
                          <th key={i} className={`${darkMode ? 'bg-gray-700' : 'bg-blue-100'} px-3 py-2 text-left font-bold border ${darkMode ? 'border-gray-600' : 'border-blue-200'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rule.table.rows.map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? '' : (darkMode ? 'bg-gray-700/30' : 'bg-gray-50')}>
                          {row.map((cell, j) => (
                            <td key={j} className={`px-3 py-2 border ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${j === 0 ? 'font-medium' : ''}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (!selectedLesson) return null;
    const quizzes = selectedLesson.quizzes || [];
    const totalCorrect = quizzes.filter((q: Quiz, i: number) => quizAnswers[i] === q.correct).length;
    const score = quizzes.length > 0 ? Math.round((totalCorrect / quizzes.length) * 100) : 0;

    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-6">🎯 اختبار | Quiz</h2>
        
        {quizSubmitted && (
          <div className={`mb-6 p-6 rounded-xl text-center ${score >= 60 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} ${darkMode ? 'opacity-90' : ''}`}>
            <div className="text-5xl mb-3">{score >= 80 ? '🏆' : score >= 60 ? '✅' : '📝'}</div>
            <h3 className="text-2xl font-bold mb-2">النتيجة: {score}%</h3>
            <p className="text-sm">{totalCorrect} من {quizzes.length} إجابات صحيحة</p>
            {score >= 60 ? (
              <p className="text-sm mt-2 font-bold">🎉 ممتاز! لقد أكملت هذا الدرس</p>
            ) : (
              <p className="text-sm mt-2">حاول مرة أخرى! تحتاج 60% على الأقل للنجاح</p>
            )}
            <button
              onClick={() => { setQuizAnswers({}); setQuizSubmitted(false); }}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition"
            >
              إعادة المحاولة 🔄
            </button>
          </div>
        )}

        <div className="space-y-4">
          {quizzes.map((quiz: Quiz, idx: number) => (
            <div key={idx} className={`${cardClass} border rounded-xl p-5`}>
              <h3 className="font-bold mb-3">
                <span className="text-blue-500 mr-2">Frage {idx + 1}:</span>
                {quiz.question}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quiz.options.map((option, optIdx) => {
                  const isSelected = quizAnswers[idx] === optIdx;
                  const isCorrect = quiz.correct === optIdx;
                  let btnClass = `p-3 rounded-lg border text-sm font-medium transition text-right`;
                  
                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnClass += ' bg-green-100 border-green-400 text-green-800';
                    } else if (isSelected && !isCorrect) {
                      btnClass += ' bg-red-100 border-red-400 text-red-800';
                    } else {
                      btnClass += ` ${darkMode ? 'border-gray-600' : 'border-gray-200'} opacity-50`;
                    }
                  } else {
                    btnClass += isSelected
                      ? ' bg-blue-100 border-blue-400 text-blue-800'
                      : ` ${darkMode ? 'border-gray-600 hover:border-gray-400' : 'border-gray-200 hover:border-blue-300'} cursor-pointer`;
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                      className={btnClass}
                      dir="rtl"
                      disabled={quizSubmitted}
                    >
                      <span className="mr-2 font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                      {option}
                      {quizSubmitted && isCorrect && <span className="float-left">✅</span>}
                      {quizSubmitted && isSelected && !isCorrect && <span className="float-left">❌</span>}
                    </button>
                  );
                })}
              </div>
              {quizSubmitted && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                  💡 {quiz.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {!quizSubmitted && quizzes.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={handleQuizSubmit}
              disabled={Object.keys(quizAnswers).length < quizzes.length}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition ${
                Object.keys(quizAnswers).length >= quizzes.length
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              تحقق من الإجابات ✓
            </button>
            <p className="text-sm opacity-50 mt-2">
              أجبت على {Object.keys(quizAnswers).length} من {quizzes.length} أسئلة
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStats = () => (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6">📊 إحصائياتي | Meine Statistiken</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: '📖', label: 'دروس مكتملة', value: progress.completedLessons.length },
          { icon: '📝', label: 'كلمات متعلمة', value: progress.learnedWords.length },
          { icon: '🔥', label: 'أيام متتالية', value: progress.streak },
          { icon: '🎯', label: 'نسبة الإنجاز', value: `${completedPercentage}%` },
          { icon: '⭐', label: 'أعلى نتيجة اختبار', value: `${Math.max(0, ...Object.values(progress.quizScores))}%` },
          { icon: '📅', label: 'آخر دراسة', value: progress.lastStudyDate ? new Date(progress.lastStudyDate).toLocaleDateString('ar') : 'لم تبدأ بعد' },
        ].map((stat, i) => (
          <div key={i} className={`${cardClass} border rounded-xl p-4 text-center`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs opacity-60 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level Progress */}
      <h3 className="text-xl font-bold mb-4">التقدم حسب المستوى</h3>
      <div className="space-y-4 mb-8">
        {(['A1', 'A2', 'B1', 'B2'] as const).map(level => {
          const levelLessons = lessons.filter(l => l.level === level);
          const completed = levelLessons.filter(l => progress.completedLessons.includes(l.id)).length;
          const pct = Math.round((completed / levelLessons.length) * 100);
          return (
            <div key={level} className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className={`${getLevelColor(level)} text-white px-3 py-1 rounded-full text-sm font-bold`}>{level}</span>
                  <span className="text-sm">{completed}/{levelLessons.length} دروس</span>
                </div>
                <span className="font-bold">{pct}%</span>
              </div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${getLevelColor(level)} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quiz Scores */}
      {Object.keys(progress.quizScores).length > 0 && (
        <>
          <h3 className="text-xl font-bold mb-4">نتائج الاختبارات</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(progress.quizScores).map(([lessonId, score]) => {
              const lesson = lessons.find(l => l.id === Number(lessonId));
              if (!lesson) return null;
              return (
                <div key={lessonId} className={`${cardClass} border rounded-xl p-3 text-center`}>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelColor(lesson.level)} text-white`}>{lesson.level}</span>
                  <p className="text-sm font-medium mt-2 truncate">{lesson.title}</p>
                  <div className={`text-2xl font-bold mt-1 ${score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {score}%
                  </div>
                  <div className="flex justify-center mt-1">
                    {[1,2,3,4,5].map(s => <StarIcon key={s} filled={score >= s * 20} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {renderHeader()}
      <main className="pb-20">
        {page === 'home' && renderHome()}
        {page === 'lessons' && renderLessons()}
        {page === 'lesson' && renderLessonOverview()}
        {page === 'words' && renderWords()}
        {page === 'sentences' && renderSentences()}
        {page === 'dialog' && renderDialog()}
        {page === 'grammar' && renderGrammar()}
        {page === 'quiz' && renderQuiz()}
        {page === 'stats' && renderStats()}
      </main>

      {/* Bottom Navigation */}
      <nav className={`fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-sm border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} z-50`}>
        <div className="max-w-lg mx-auto flex justify-around py-2">
          {[
            { p: 'home' as Page, icon: '🏠', label: 'الرئيسية' },
            { p: 'lessons' as Page, icon: '📚', label: 'الدروس' },
            { p: 'stats' as Page, icon: '📊', label: 'إحصائيات' },
          ].map(item => (
            <button
              key={item.p}
              onClick={() => setPage(item.p)}
              className={`flex flex-col items-center px-4 py-1 rounded-lg transition ${
                page === item.p ? 'text-blue-500' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-0.5">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
