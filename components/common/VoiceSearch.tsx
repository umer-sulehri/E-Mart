'use client';

import { useState, useCallback, useRef } from 'react';
import { MicrophoneIcon } from '@/components/icons';
import { useUiStore } from '@/lib/store/uiStore';

interface VoiceSearchProps {
  onResult?: (transcript: string) => void;
}

export function VoiceSearch({ onResult }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const locale = useUiStore((s) => s.locale);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = locale === 'ur' ? 'ur-PK' : 'en-PK';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult?.(transcript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult, locale]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Voice search"
      className={`inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-full transition-all duration-200 ${
        isListening
          ? 'bg-error text-text-inverse animate-pulse'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-alt'
      }`}
    >
      <MicrophoneIcon className="w-5 h-5" />
    </button>
  );
}
