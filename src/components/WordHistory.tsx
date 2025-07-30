import React from 'react';
import { Clock, BookOpen, Volume2, Trash2, TrendingUp, Target, Calendar } from 'lucide-react';

interface WordData {
  word: string;
  phonetic?: string;
  meanings?: any[];
  timestamp: number;
}

interface WordHistoryProps {
  wordHistory: WordData[];
  setCurrentWord: (word: string) => void;
  setActiveTab: (tab: 'speak' | 'practice' | 'analyze' | 'learn' | 'history') => void;
}

const WordHistory: React.FC<WordHistoryProps> = ({ wordHistory, setCurrentWord, setActiveTab }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const playWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    speechSynthesis.speak(utterance);
  };

  const practiceWord = (word: string) => {
    setCurrentWord(word);
    setActiveTab('practice');
  };

  const learnMore = (word: string) => {
    setCurrentWord(word);
    setActiveTab('learn');
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('pronunciationHistory');
      window.location.reload();
    }
  };

  const getRecentWords = () => {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    return wordHistory.filter(word => word.timestamp > oneDayAgo).length;
  };

  const getThisWeekWords = () => {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return wordHistory.filter(word => word.timestamp > oneWeekAgo).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Learning History</h2>
          <p className="text-gray-600">Track your pronunciation and vocabulary learning progress</p>
        </div>
        
        {wordHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {wordHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No learning history yet</h3>
          <p className="text-gray-500 mb-6">Start practicing words to see your progress here</p>
          <button
            onClick={() => setActiveTab('speak')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Learning
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Words</p>
                  <p className="text-2xl font-bold text-blue-800">{wordHistory.length}</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Today</p>
                  <p className="text-2xl font-bold text-green-800">{getRecentWords()}</p>
                </div>
                <div className="bg-green-200 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">This Week</p>
                  <p className="text-2xl font-bold text-purple-800">{getThisWeekWords()}</p>
                </div>
                <div className="bg-purple-200 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Word List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recent Words ({wordHistory.length})
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {wordHistory.map((wordData, index) => (
                <div
                  key={`${wordData.word}-${wordData.timestamp}`}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{wordData.word}</h4>
                        {wordData.phonetic && (
                          <span className="text-sm text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">
                            {wordData.phonetic}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimestamp(wordData.timestamp)}</span>
                        {wordData.meanings && (
                          <>
                            <span>•</span>
                            <span>{wordData.meanings.length} meaning{wordData.meanings.length !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playWord(wordData.word)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Play pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => practiceWord(wordData.word)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                      >
                        Practice
                      </button>
                      
                      <button
                        onClick={() => learnMore(wordData.word)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>

                  {/* Preview meanings */}
                  {wordData.meanings && wordData.meanings.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium capitalize">{wordData.meanings[0].partOfSpeech}:</span>
                        <span className="ml-2">{wordData.meanings[0].definitions[0]?.definition}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Section */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">🎉 Learning Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wordHistory.length >= 10 && (
                <div className="flex items-center gap-3 text-orange-700">
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">10</span>
                  </div>
                  <span>Word Explorer - Learned 10+ words!</span>
                </div>
              )}
              
              {wordHistory.length >= 50 && (
                <div className="flex items-center gap-3 text-orange-700">
                  <div className="w-8 h-8 bg-orange-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">50</span>
                  </div>
                  <span>Vocabulary Master - 50+ words learned!</span>
                </div>
              )}
              
              {getRecentWords() >= 5 && (
                <div className="flex items-center gap-3 text-orange-700">
                  <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">🔥</span>
                  </div>
                  <span>Daily Streak - 5+ words today!</span>
                </div>
              )}
              
              {getThisWeekWords() >= 20 && (
                <div className="flex items-center gap-3 text-orange-700">
                  <div className="w-8 h-8 bg-orange-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">⭐</span>
                  </div>
                  <span>Weekly Champion - 20+ words this week!</span>
                </div>
              )}
            </div>
            
            {wordHistory.length < 10 && (
              <p className="text-orange-600 mt-3">
                Keep learning! You need {10 - wordHistory.length} more words to unlock your first achievement.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WordHistory;