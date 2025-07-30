import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Play, Square, RotateCcw, Volume2 } from 'lucide-react';

interface SpeechRecognitionProps {
  currentWord: string;
  setCurrentWord: (word: string) => void;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ currentWord, setCurrentWord }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [targetText, setTargetText] = useState(currentWord || 'Hello world');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ score: number; message: string; } | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const initializeRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
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

      setTranscript(final || interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (transcript) {
        provideFeedback(transcript, targetText);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      console.error('Speech recognition error:', event.error);
    };

    return recognition;
  }, [transcript, targetText]);

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
        
        // Stop all tracks to release microphone
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
    speechSynthesis.speak(utterance);
  };

  const provideFeedback = (spoken: string, target: string) => {
    const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
    const targetWords = target.toLowerCase().trim().split(/\s+/);
    
    // Simple similarity scoring
    let matches = 0;
    const maxLength = Math.max(spokenWords.length, targetWords.length);
    
    for (let i = 0; i < Math.min(spokenWords.length, targetWords.length); i++) {
      if (spokenWords[i] === targetWords[i]) {
        matches++;
      } else if (spokenWords[i].includes(targetWords[i]) || targetWords[i].includes(spokenWords[i])) {
        matches += 0.5;
      }
    }
    
    const score = Math.round((matches / maxLength) * 100);
    
    let message = '';
    if (score >= 90) {
      message = 'Excellent pronunciation! 🎉';
    } else if (score >= 70) {
      message = 'Good pronunciation! Keep practicing. 👍';
    } else if (score >= 50) {
      message = 'Getting better! Try to speak more clearly. 💪';
    } else {
      message = 'Keep practicing! Listen to the target pronunciation. 🎯';
    }
    
    setFeedback({ score, message });
  };

  const reset = () => {
    setTranscript('');
    setFeedback(null);
    setAudioUrl(null);
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pronunciation Practice</h2>
        <p className="text-gray-600">Practice pronouncing words and get feedback on your performance</p>
      </div>

      <div className="space-y-4">
        {/* Target Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Text to Practice
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetText}
              onChange={(e) => setTargetText(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter text to practice..."
            />
            <button
              onClick={playSystemPronunciation}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Listen to target pronunciation"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Practice Area */}
        <div className="bg-gray-50 p-6 rounded-xl">
          <div className="text-center space-y-4">
            <div className="text-lg font-medium text-gray-800">
              Say: "<span className="text-blue-600">{targetText}</span>"
            </div>

            {/* Microphone Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={isListening ? stopListening : startListening}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                {isListening ? 'Stop Listening' : 'Start Practice'}
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
                <span>Listening...</span>
              </div>
            )}

            {isRecording && (
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-pulse"></div>
                <span>Recording...</span>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {transcript && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">What you said:</h3>
            <p className="text-blue-700 font-medium">"{transcript}"</p>
          </div>
        )}

        {/* Audio Playback */}
        {audioUrl && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Your Recording:</h3>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/wav" />
              Your browser does not support audio playback.
            </audio>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`p-4 rounded-lg ${
            feedback.score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-800">Pronunciation Feedback</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                feedback.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                Score: {feedback.score}%
              </div>
            </div>
            <p className={feedback.score >= 70 ? 'text-green-700' : 'text-yellow-700'}>
              {feedback.message}
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h3 className="font-medium text-indigo-800 mb-2">💡 Practice Tips</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• Speak clearly and at a moderate pace</li>
            <li>• Listen to the target pronunciation first</li>
            <li>• Practice in a quiet environment</li>
            <li>• Record yourself to hear your progress</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpeechRecognition;