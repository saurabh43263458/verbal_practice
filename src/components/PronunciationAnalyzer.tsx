import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Play, Square, RotateCcw, Volume2, Target, TrendingUp, Award } from 'lucide-react';

interface PronunciationAnalyzerProps {
  currentWord: string;
  setCurrentWord: (word: string) => void;
}

interface WordAnalysis {
  word: string;
  expected: string;
  spoken: string;
  score: number;
  feedback: string;
}

interface PronunciationResult {
  overallScore: number;
  wordBreakdown: WordAnalysis[];
  feedback: string;
  suggestions: string[];
  timestamp: number;
}

const PronunciationAnalyzer: React.FC<PronunciationAnalyzerProps> = ({ currentWord, setCurrentWord }) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [targetText, setTargetText] = useState(currentWord || 'Hello world, how are you today?');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<PronunciationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realtimeScore, setRealtimeScore] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Advanced phonetic mapping for better analysis
  const getPhoneticBreakdown = (text: string): string[] => {
    const phoneticMap: Record<string, string> = {
      'hello': 'hə-ˈloʊ',
      'world': 'wɜːrld',
      'how': 'haʊ',
      'are': 'ɑːr',
      'you': 'juː',
      'today': 'tə-ˈdeɪ',
      'pronunciation': 'prə-ˌnʌn-si-ˈeɪ-ʃən',
      'practice': 'ˈpræk-tɪs',
      'language': 'ˈlæŋ-ɡwɪdʒ',
      'speech': 'spiːtʃ',
      'voice': 'vɔɪs',
      'sound': 'saʊnd',
      'learn': 'lɜːrn',
      'improve': 'ɪm-ˈpruːv',
      'communication': 'kə-ˌmjuː-nɪ-ˈkeɪ-ʃən',
      'articulation': 'ɑːr-ˌtɪk-jə-ˈleɪ-ʃən',
      'fluency': 'ˈfluː-ən-si',
      'accent': 'ˈæk-sent',
      'dialect': 'ˈdaɪ-ə-lekt'
    };

    return text.toLowerCase().split(/\s+/).map(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      return phoneticMap[cleanWord] || cleanWord;
    });
  };

  // AI-powered pronunciation analysis
  const analyzePronounciation = useCallback((spoken: string, target: string): PronunciationResult => {
    const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
    const targetWords = target.toLowerCase().trim().split(/\s+/);
    const phoneticTarget = getPhoneticBreakdown(target);
    
    const wordBreakdown: WordAnalysis[] = [];
    let totalScore = 0;
    
    // Analyze each word
    for (let i = 0; i < Math.max(spokenWords.length, targetWords.length); i++) {
      const spokenWord = spokenWords[i] || '';
      const targetWord = targetWords[i] || '';
      const phoneticWord = phoneticTarget[i] || '';
      
      let wordScore = 0;
      let feedback = '';
      
      if (!spokenWord && targetWord) {
        wordScore = 0;
        feedback = 'Missing word';
      } else if (spokenWord && !targetWord) {
        wordScore = 20;
        feedback = 'Extra word';
      } else if (spokenWord === targetWord) {
        wordScore = 100;
        feedback = 'Perfect match';
      } else {
        // Calculate similarity using Levenshtein distance
        const similarity = calculateSimilarity(spokenWord, targetWord);
        wordScore = Math.round(similarity * 100);
        
        if (wordScore >= 90) feedback = 'Excellent pronunciation';
        else if (wordScore >= 75) feedback = 'Good pronunciation';
        else if (wordScore >= 60) feedback = 'Needs improvement';
        else if (wordScore >= 40) feedback = 'Significant difference';
        else feedback = 'Very different from target';
      }
      
      wordBreakdown.push({
        word: targetWord,
        expected: phoneticWord,
        spoken: spokenWord,
        score: wordScore,
        feedback
      });
      
      totalScore += wordScore;
    }
    
    const overallScore = Math.round(totalScore / Math.max(spokenWords.length, targetWords.length, 1));
    
    // Generate overall feedback and suggestions
    let overallFeedback = '';
    const suggestions: string[] = [];
    
    if (overallScore >= 90) {
      overallFeedback = 'Outstanding pronunciation! You sound very natural.';
      suggestions.push('Try more complex sentences to challenge yourself');
    } else if (overallScore >= 75) {
      overallFeedback = 'Great job! Your pronunciation is quite good.';
      suggestions.push('Focus on the words with lower scores');
      suggestions.push('Practice speaking at a steady pace');
    } else if (overallScore >= 60) {
      overallFeedback = 'Good effort! There\'s room for improvement.';
      suggestions.push('Listen carefully to the target pronunciation');
      suggestions.push('Practice individual words that scored low');
      suggestions.push('Speak more slowly and clearly');
    } else if (overallScore >= 40) {
      overallFeedback = 'Keep practicing! Focus on clarity and accuracy.';
      suggestions.push('Break down words into syllables');
      suggestions.push('Practice in front of a mirror');
      suggestions.push('Record yourself multiple times');
    } else {
      overallFeedback = 'Don\'t give up! Pronunciation takes time to master.';
      suggestions.push('Start with shorter, simpler words');
      suggestions.push('Listen to native speakers');
      suggestions.push('Practice basic sounds first');
    }
    
    return {
      overallScore,
      wordBreakdown,
      feedback: overallFeedback,
      suggestions,
      timestamp: Date.now()
    };
  }, []);

  // Calculate string similarity using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };

  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
      setRealtimeScore(null);
      
      // Start real-time analysis
      analysisIntervalRef.current = setInterval(() => {
        if (transcript.trim()) {
          const quickAnalysis = analyzePronounciation(transcript, targetText);
          setRealtimeScore(quickAnalysis.overallScore);
        }
      }, 1000);
    };

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentTranscript = final || interim;
      setTranscript(currentTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      if (transcript.trim()) {
        setIsAnalyzing(true);
        setTimeout(() => {
          const result = analyzePronounciation(transcript, targetText);
          setAnalysisResult(result);
          setIsAnalyzing(false);
          
          // Save to history
          const history = JSON.parse(localStorage.getItem('pronunciationAnalysis') || '[]');
          history.unshift(result);
          localStorage.setItem('pronunciationAnalysis', JSON.stringify(history.slice(0, 50)));
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      console.error('Speech recognition error:', event.error);
    };

    return recognition;
  }, [transcript, targetText, analyzePronounciation]);

  const startListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playSystemPronunciation = () => {
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.rate = 0.8; // Slower for learning
    speechSynthesis.speak(utterance);
  };

  const reset = () => {
    setTranscript('');
    setAnalysisResult(null);
    setRealtimeScore(null);
    setAudioUrl(null);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const practiceWords = [
    'Hello world, how are you today?',
    'The quick brown fox jumps over the lazy dog',
    'She sells seashells by the seashore',
    'How much wood would a woodchuck chuck?',
    'Peter Piper picked a peck of pickled peppers',
    'Communication is the key to success',
    'Pronunciation practice makes perfect',
    'Artificial intelligence is fascinating'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">AI Pronunciation Analyzer</h2>
        <p className="text-gray-600">Get real-time feedback and detailed analysis of your pronunciation</p>
      </div>

      <div className="space-y-4">
        {/* Target Text Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Text to Practice
          </label>
          <div className="flex gap-2">
            <textarea
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-20"
              placeholder="Enter text to practice..."
            />
            <button
              onClick={playSystemPronunciation}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors self-start"
              title="Listen to target pronunciation"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Phonetic Breakdown */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-medium text-indigo-800 mb-2">Phonetic Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            {getPhoneticBreakdown(targetText).map((phonetic, index) => (
              <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-mono">
                {phonetic}
              </span>
            ))}
          </div>
        </div>

        {/* Practice Controls */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-gray-800">
              Ready to practice? Click start and speak clearly!
            </div>

            {/* Real-time Score Display */}
            {realtimeScore !== null && (
              <div className="flex items-center justify-center gap-3">
                <div className={`px-4 py-2 rounded-lg border-2 ${getScoreColor(realtimeScore)}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-bold">Live Score: {realtimeScore}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? 'Stop Analysis' : 'Start Practice'}
              </button>

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isRecording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isRecording ? 'Stop Recording' : 'Record Audio'}
              </button>

              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Status Indicators */}
            {isListening && (
              <div className="flex items-center justify-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span>Analyzing your speech in real-time...</span>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                <span>Processing detailed analysis...</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Transcript */}
        {transcript && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">What you're saying:</h3>
            <p className="text-blue-700 font-medium">"{transcript}"</p>
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-medium text-purple-800 mb-2">Your Recording:</h3>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Detailed Analysis Results */}
        {analysisResult && (
          <div className="space-y-4">
            {/* Overall Score */}
            <div className={`p-6 rounded-xl border-2 ${getScoreColor(analysisResult.overallScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Overall Pronunciation Score</h3>
                <div className="flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  <span className="text-2xl font-bold">{analysisResult.overallScore}%</span>
                </div>
              </div>
              <p className="text-lg">{analysisResult.feedback}</p>
            </div>

            {/* Word-by-Word Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Word-by-Word Analysis
              </h3>
              
              <div className="space-y-3">
                {analysisResult.wordBreakdown.map((word, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-gray-800">"{word.word}"</span>
                        <span className="text-sm text-gray-500 font-mono">Expected: {word.expected}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">You said: "{word.spoken}"</span>
                        <span className="text-xs text-gray-500">• {word.feedback}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(word.score)}`}>
                      {word.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-800 mb-3">💡 Improvement Suggestions</h3>
              <ul className="space-y-2">
                {analysisResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-yellow-700">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Practice Sentences */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
          <h3 className="font-semibold text-gray-800 mb-3">🎯 Try these practice sentences:</h3>
          <div className="grid gap-2">
            {practiceWords.map((sentence, index) => (
              <button
                key={index}
                onClick={() => setTargetText(sentence)}
                className="text-left p-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
              >
                {sentence}
              </button>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h3 className="font-medium text-indigo-800 mb-2">🚀 Pro Tips for Better Scores</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• Speak at a moderate, steady pace</li>
            <li>• Ensure good microphone quality and quiet environment</li>
            <li>• Practice individual words with low scores</li>
            <li>• Listen to the target pronunciation multiple times</li>
            <li>• Focus on clear articulation of each syllable</li>
            <li>• Use the real-time score to adjust as you speak</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PronunciationAnalyzer;