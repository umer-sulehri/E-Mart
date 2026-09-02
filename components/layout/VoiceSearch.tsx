'use client';

import { useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Mic, X } from 'lucide-react';
import { VoiceSearchManager } from '@/lib/voice-search';
import { cn } from '@/lib/utils';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

function isSupported() {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export default function VoiceSearch({ onSearch, className }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const managerRef = useRef<VoiceSearchManager | null>(null);

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new VoiceSearchManager();
      managerRef.current.onResult = (text) => {
        setTranscript(text);
        setIsListening(false);
        if (text.trim()) {
          onSearch(text.trim());
        }
      };
      managerRef.current.onError = (code) => {
        setIsListening(false);
        setError(getErrorText(code));
      };
      managerRef.current.onStateChange = (listening, t) => {
        setIsListening(listening);
        if (t) setTranscript(t);
        if (!listening && !t) setTranscript('');
      };
    }
    return managerRef.current;
  }, [onSearch]);

  const handleToggle = () => {
    setError(null);
    if (isListening) {
      const manager = getManager();
      manager.stopListening();
      setIsListening(false);
      // If there's a transcript and the user stopped early, still submit it.
      if (transcript.trim()) onSearch(transcript.trim());
      return;
    }

    if (!isSupported()) {
      setError('Voice search is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    const manager = getManager();
    const res = manager.startListening();
    if (!res.supported) {
      setError('Voice search is not supported in this browser.');
      return;
    }
    setTranscript('');
    setIsListening(true);
  };

  const handleClear = () => {
    setTranscript('');
    setError(null);
  };

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'rounded-lg p-2 transition-colors',
          isListening
            ? 'bg-danger text-white'
            : 'text-muted hover:text-secondary hover:bg-muted-100'
        )}
        title={isListening ? 'Stop voice search' : 'Search by voice'}
        aria-label={isListening ? 'Stop voice search' : 'Search by voice'}
      >
        {isListening ? (
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-40" />
            <Mic className="relative h-5 w-5" />
          </span>
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      {error && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-danger-200 bg-white p-3 shadow-lg">
          <div className="flex items-start justify-between">
            <p className="text-xs text-danger">{error}</p>
            <button onClick={handleClear} className="ml-2 text-danger hover:text-danger-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isListening && !error && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-primary-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-xs font-semibold text-secondary-800">Listening…</p>
          <div className="mb-2 flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 flex-1 animate-pulse rounded-full bg-danger"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
          <p className="min-h-4 text-xs text-muted-600">
            {transcript || 'Speak now…'}
          </p>
        </div>
      )}
    </div>
  );
}

function getErrorText(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone permission denied. Allow access to use voice search.';
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'network':
      return 'Speech service unavailable. Check your connection.';
    case 'audio-capture':
      return 'No microphone found.';
    default:
      return 'Voice recognition failed. Please try again.';
  }
}

export { isSupported };
