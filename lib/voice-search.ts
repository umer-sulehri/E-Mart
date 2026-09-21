function getMicPermissionErrorCode(err: unknown): string {
  const name = (err as DOMException)?.name ?? '';
  if (
    name === 'NotAllowedError' ||
    name === 'SecurityError' ||
    name === 'PermissionDeniedError'
  ) {
    return 'not-allowed';
  }
  return 'audio-capture';
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export class VoiceSearchManager {
  private recognition: SpeechRecognitionLike | null = null;
  private isListening = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const Ctor = getSpeechRecognition();
    if (Ctor) {
      this.recognition = new Ctor();
      this.setupRecognition();
    }
  }

  get supported() {
    return this.recognition !== null;
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    // Recognize speech in the browser's own language so it works for speakers
    // who are not using an English locale (previously hardcoded to en-US,
    // which made recognition fail/return "no-speech" for everyone else).
    const browserLang =
      typeof navigator !== 'undefined'
        ? navigator.language || navigator.languages?.[0] || ''
        : '';
    this.recognition.lang = browserLang ? browserLang : 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStateChange) this.onStateChange(true, '');
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';

        if (result.isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        const text = finalTranscript.trim();
        if (this.onResult) this.onResult(text);
        this.stopListening();
      } else if (this.onStateChange) {
        this.onStateChange(true, interimTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      if (this.onError) this.onError(event.error);
      this.isListening = false;
      if (this.onStateChange) this.onStateChange(false, '');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      if (this.onStateChange) this.onStateChange(false, '');
    };
  }

  onResult: ((transcript: string) => void) | null = null;
  onError: ((code: string) => void) | null = null;
  onStateChange: ((listening: boolean, transcript: string) => void) | null = null;

  async startListening() {
    if (!this.recognition) {
      return { supported: false };
    }
    if (this.isListening) return { supported: true };

    this.isListening = true;

    const beginRecognition = () => {
      try {
        this.recognition!.start();
        this.timeoutId = setTimeout(() => {
          this.stopListening();
        }, 8000);
      } catch {
        this.isListening = false;
      }
    };

    const mediaDevices =
      typeof navigator !== 'undefined' ? navigator.mediaDevices : null;

    if (mediaDevices?.getUserMedia) {
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        this.isListening = false;
        const code = getMicPermissionErrorCode(err);
        if (this.onError) this.onError(code);
        if (this.onStateChange) this.onStateChange(false, '');
        return { supported: true };
      }
    }

    beginRecognition();
    return { supported: true };
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isListening = false;
  }

  destroy() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }
}
