'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mic, X } from 'lucide-react';
import { VoiceSearchManager } from '@/lib/voice-search';
import { cn } from '@/lib/utils';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

// Browsers collapse every microphone failure into `not-allowed`, so on its own
// the Web Speech API cannot tell us WHY the mic was rejected. Probe the actual
// cause so the user gets an accurate, actionable message instead of a generic
// "permission denied" that is wrong when the policy or OS is at fault.
async function diagnoseMicError(code: string): Promise<string> {
  if (code !== 'not-allowed' && code !== 'audio-capture' && code !== 'service-not-allowed') {
    return code;
  }

  const doc = document as unknown as {
    permissionsPolicy?: { allowsFeature?: (feature: string) => boolean };
    featurePolicy?: { allowsFeature?: (feature: string) => boolean };
  };
  const policy = doc.permissionsPolicy || doc.featurePolicy;
  if (policy?.allowsFeature) {
    try {
      if (!policy.allowsFeature('microphone')) return 'policy-blocked';
    } catch {
      // API exists but rejected the query — ignore.
    }
  }

  try {
    const perm = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    if (perm.state === 'denied') return 'permission-denied';
  } catch {
    // Permissions API does not expose microphone in this browser — ignore.
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (!devices.some((d) => d.kind === 'audioinput')) return 'no-mic';
  } catch {
    // Unsupported browser — ignore.
  }

  try {
    // A real mic probe: if this succeeds, the mic hardware, OS, browser
    // permission and policy are all fine and the failure was transient.
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return 'transient';
  } catch (err) {
    switch ((err as DOMException)?.name) {
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'no-mic';
      case 'NotReadableError':
        return 'device-busy';
      default:
        return 'permission-denied';
    }
  }
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
  // Manager callbacks are wired once (first construction), so keep the latest
  // onSearch in a ref to avoid the manager capturing a stale closure.
  const onSearchRef = useRef(onSearch);

  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = new VoiceSearchManager();
      managerRef.current.onResult = (text) => {
        setTranscript(text);
        setIsListening(false);
        if (text.trim()) {
          onSearchRef.current(text.trim());
        }
      };
      managerRef.current.onError = (code) => {
        setIsListening(false);
        void (async () => {
          const resolved = await diagnoseMicError(code);
          // Component may have unmounted (navigation) while diagnosing.
          if (managerRef.current) setError(getErrorText(resolved));
        })();
      };
      managerRef.current.onStateChange = (listening, t) => {
        setIsListening(listening);
        if (t) setTranscript(t);
        if (!listening && !t) setTranscript('');
      };
    }
    return managerRef.current;
  }, []);

  // Stop recognition and release the microphone when the component unmounts
  // so the page never keeps listening after navigation.
  useEffect(() => {
    return () => {
      managerRef.current?.destroy();
      managerRef.current = null;
    };
  }, []);

  const handleToggle = async () => {
    setError(null);
    if (isListening) {
      // Submission is handled centrally by the manager's onend handler, which
      // hands over the best transcript it heard even if no "final" result
      // arrived before stopping.
      getManager().stopListening();
      return;
    }

    if (!isSupported()) {
      setError('Voice search is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError('Voice search requires HTTPS or localhost. Check your connection settings.');
      return;
    }

    const manager = getManager();
    const res = await manager.startListening();
    if (!res.supported) {
      setError('Voice search is not supported in this browser.');
      return;
    }
    setTranscript('');
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
    case 'permission-denied':
      return 'Microphone access is blocked. Allow the microphone for this site in your browser, then try again.';
    case 'policy-blocked':
      return 'Microphone is blocked by the site\'s security policy. Contact the site administrator — this is a configuration issue, not your device.';
    case 'no-speech':
      return 'No speech detected. Please try again.';
    case 'network':
      return 'Speech service unavailable. Check your connection.';
    case 'audio-capture':
    case 'no-mic':
      return 'No microphone found. Connect a microphone and try again.';
    case 'device-busy':
      return 'Your microphone is in use by another app. Close it and try again.';
    case 'language-not-supported':
      return 'Voice search is not available in this language. Try English.';
    case 'transient':
    default:
      return 'Voice recognition stopped unexpectedly. Please try again.';
  }
}

export { isSupported };
