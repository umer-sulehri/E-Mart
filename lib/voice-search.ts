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

// Locales the browser speech engines actually understand. The Web Speech API
// is strict here — e.g. `en-PK` (a common navigator.language in Pakistan) is
// NOT supported and fails immediately with "language-not-supported". We
// normalize the browser's language to the closest supported locale instead of
// passing it through verbatim.
const SUPPORTED_LANGS = new Set([
  'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IE', 'en-IN', 'en-NZ', 'en-PH', 'en-ZA',
  'es-ES', 'es-US', 'es-AR', 'es-MX', 'es-CL', 'es-CO', 'es-CR', 'es-PE',
  'fr-FR', 'fr-CA', 'de-DE', 'it-IT',
  'pt-BR', 'pt-PT', 'ru-RU', 'nl-NL', 'tr-TR', 'pl-PL', 'sv-SE', 'da-DK',
  'fi-FI', 'nb-NO', 'cs-CZ', 'el-GR', 'uk-UA',
  'hi-IN', 'ur-PK', 'ur-IN',
  'ja-JP', 'ko-KR', 'zh-CN', 'zh-TW', 'zh-HK',
  'ar-EG', 'ar-SA', 'ar-AE',
  'id-ID', 'ms-MY', 'th-TH', 'vi-VN',
]);

const DEFAULT_LANG_FOR_BASE: Record<string, string> = {
  en: 'en-US',
  ur: 'ur-PK',
  hi: 'hi-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
  pt: 'pt-BR',
  ru: 'ru-RU',
  nl: 'nl-NL',
  tr: 'tr-TR',
  pl: 'pl-PL',
  sv: 'sv-SE',
  da: 'da-DK',
  fi: 'fi-FI',
  no: 'nb-NO',
  cs: 'cs-CZ',
  el: 'el-GR',
  uk: 'uk-UA',
  ja: 'ja-JP',
  ko: 'ko-KR',
  zh: 'zh-CN',
  ar: 'ar-EG',
  id: 'id-ID',
  ms: 'ms-MY',
  th: 'th-TH',
  vi: 'vi-VN',
};

export function normalizeRecognitionLang(lang?: string): string {
  const raw = (lang || '').trim();
  if (!raw) return 'en-US';

  const exact = [...SUPPORTED_LANGS].find(
    (l) => l === raw || l.toLowerCase() === raw.toLowerCase()
  );
  if (exact) return exact;

  const base = raw.split('-')[0].toLowerCase();
  if (DEFAULT_LANG_FOR_BASE[base]) return DEFAULT_LANG_FOR_BASE[base];

  const variant = [...SUPPORTED_LANGS].find((l) =>
    l.toLowerCase().startsWith(`${base}-`)
  );
  if (variant) return variant;

  return 'en-US';
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
  private hasSubmittedFinal = false;
  private pendingTranscript = '';

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
    // Recognize speech in the browser's own language, normalized to a locale
    // the speech engine actually supports (navigator.language can be a tag
    // like `en-PK` that Chrome refuses, which previously killed recognition
    // for anyone without a supported locale).
    const browserLang =
      typeof navigator !== 'undefined'
        ? navigator.language || navigator.languages?.[0] || ''
        : '';
    this.recognition.lang = normalizeRecognitionLang(browserLang);

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
        this.pendingTranscript = '';
        this.hasSubmittedFinal = true;
        const text = finalTranscript.trim();
        if (this.onResult) this.onResult(text);
        this.stopListening();
      } else {
        this.pendingTranscript = interimTranscript.trim() || this.pendingTranscript;
        if (this.onStateChange) this.onStateChange(true, this.pendingTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      // "aborted" is our own stop/abort, not a user-facing failure.
      if (event.error !== 'aborted') {
        // A real error ends the session (onerror is always followed by
        // onend). Drop any partial transcript so onend does not submit a
        // garbage/partial query right after showing the error.
        this.pendingTranscript = '';
        if (this.onError) this.onError(event.error);
      }
      this.isListening = false;
      if (this.onStateChange) this.onStateChange(false, '');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
      // If the session ended without a final result (auto-stop, the 8s cap,
      // or the user pausing), hand over the best transcript we heard instead
      // of silently dropping the speech.
      if (!this.hasSubmittedFinal && this.pendingTranscript.trim()) {
        const text = this.pendingTranscript.trim();
        this.pendingTranscript = '';
        this.hasSubmittedFinal = true;
        if (this.onResult) this.onResult(text);
      }
      this.pendingTranscript = '';
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

    if (this.isListening) {
      return { supported: true };
    }

    this.isListening = true;
    this.hasSubmittedFinal = false;
    this.pendingTranscript = '';

    try {
      // IMPORTANT:
      // Start SpeechRecognition directly from the user's click/tap.
      // Do not await getUserMedia() before or after this call.
      this.recognition.start();

      this.timeoutId = setTimeout(() => {
        this.stopListening();
      }, 8000);

      return { supported: true };
    } catch (err) {
      this.isListening = false;

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      console.error('Speech recognition start failed:', err);

      if (this.onError) {
        this.onError(getMicPermissionErrorCode(err));
      }

      if (this.onStateChange) {
        this.onStateChange(false, '');
      }

      return { supported: true };
    }
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
    this.hasSubmittedFinal = true;
    this.pendingTranscript = '';
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