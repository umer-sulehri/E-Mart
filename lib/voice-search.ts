export function getMicPermissionErrorCode(err: unknown): string {
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

/**
 * Maps a voice failure code to the message shown to the user.
 *
 * Lives here rather than in the component so it is importable from the Node
 * test environment: the copy is the whole point of the code mapping, and a
 * generic message for every failure leaves the user with nothing to act on.
 */
export function getErrorText(code: string): string {
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

/**
 * True when the page is running inside the Capacitor app (native WebView).
 * Android System WebView ships without the Web Speech API, so the only working
 * recognizer there is Capacitor's native plugin backed by Android's
 * SpeechRecognizer service.
 */
export function nativeSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as {
    Capacitor?: { isNativePlatform?: () => boolean };
  };
  return !!w.Capacitor?.isNativePlatform?.();
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

// The @capacitor-community/speech-recognition surface this manager touches.
// Typed locally to avoid dragging the Capacitor type graph into the Node test
// bundle; the runtime module is only ever loaded in the Capacitor WebView.
interface NativeSpeechRecognition {
  available(): Promise<{ available: boolean }>;
  checkPermissions(): Promise<{ speechRecognition: string }>;
  requestPermissions(): Promise<{ speechRecognition: string }>;
  start(options?: {
    language?: string;
    maxResults?: number;
    partialResults?: boolean;
    popup?: boolean;
  }): Promise<{ matches?: string[] }>;
  stop(): Promise<void>;
  addListener(
    eventName: string,
    listenerFunc: (data: never) => void
  ): Promise<{ remove: () => void }>;
  removeAllListeners(): Promise<void>;
}

type ListenerHandle = { remove: () => void };

export class VoiceSearchManager {
  private recognition: SpeechRecognitionLike | null = null;
  private nativeRecognition: NativeSpeechRecognition | null = null;
  private nativeListenerHandles: ListenerHandle[] = [];
  private isListening = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private hasSubmittedFinal = false;
  private pendingTranscript = '';
  private bestPartial = '';

  constructor() {
    const Ctor = getSpeechRecognition();
    if (Ctor) {
      this.recognition = new Ctor();
      this.setupRecognition();
    }
  }

  get supported() {
    return this.recognition !== null || this.nativeRecognition !== null;
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

  // Lazy-load the native plugin only when inside the Capacitor WebView, and
  // only at runtime: the dynamic import keeps the Node test/SSR bundles free
  // of the Capacitor runtime entirely.
  private async loadNativeRecognition(): Promise<NativeSpeechRecognition | null> {
    try {
      const [{ Capacitor }, plugin] = await Promise.all([
        import('@capacitor/core'),
        import('@capacitor-community/speech-recognition'),
      ]);
      if (!Capacitor.isNativePlatform()) return null;
      return plugin.SpeechRecognition as unknown as NativeSpeechRecognition;
    } catch {
      return null;
    }
  }

  private async startNativeListening(): Promise<{ ok: boolean; error?: string }> {
    if (!this.nativeRecognition) {
      this.nativeRecognition = await this.loadNativeRecognition();
    }
    if (!this.nativeRecognition) {
      return { ok: false, error: 'no-speech' };
    }

    try {
      const { available } = await this.nativeRecognition.available();
      if (!available) {
        return { ok: false, error: 'no-speech' };
      }

      let permissions = await this.nativeRecognition.checkPermissions();
      if (permissions.speechRecognition !== 'granted') {
        permissions = await this.nativeRecognition.requestPermissions();
        if (permissions.speechRecognition !== 'granted') {
          return { ok: false, error: 'not-allowed' };
        }
      }

      this.nativeListenerHandles = await Promise.all([
        this.nativeRecognition.addListener('partialResults', (data) => {
          const matches = (data as { matches?: string[] }).matches ?? [];
          const text = (matches[0] || '').trim();
          if (text) this.bestPartial = text;
          this.pendingTranscript = text;
          if (this.onStateChange) this.onStateChange(true, text);
        }),
        this.nativeRecognition.addListener('listeningState', (data) => {
          const status = (data as { status?: string }).status;
          if (status === 'started') {
            if (this.onStateChange) this.onStateChange(true, this.pendingTranscript);
            return;
          }
          // stopped: hand over the best transcript heard this session.
          this.isListening = false;
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
          }
          if (!this.hasSubmittedFinal && this.bestPartial.trim()) {
            const text = this.bestPartial.trim();
            this.bestPartial = '';
            this.hasSubmittedFinal = true;
            if (this.onResult) this.onResult(text);
          }
          if (this.onStateChange) this.onStateChange(false, '');
        }),
      ]);

      const browserLang =
        typeof navigator !== 'undefined'
          ? navigator.language || navigator.languages?.[0] || ''
          : '';
      await this.nativeRecognition.start({
        // A locale the Android recognizer understands (mirrors the Web Speech
        // normalization above — e.g. `ur-PK` is real on Android, `en-PK` is not).
        language: normalizeRecognitionLang(browserLang),
        maxResults: 5,
        partialResults: true,
        popup: false,
      });

      this.timeoutId = setTimeout(() => this.stopListening(), 8000);
      return { ok: true };
    } catch (err) {
      console.error('Native speech recognition start failed:', err);
      return { ok: false, error: getMicPermissionErrorCode(err) };
    }
  }

  async startListening() {
    if (this.isListening) {
      return { supported: this.recognition !== null || this.nativeRecognition !== null };
    }

    this.isListening = true;
    this.hasSubmittedFinal = false;
    this.pendingTranscript = '';
    this.bestPartial = '';

    if (!this.recognition) {
      // Web Speech API absent (Android System WebView) — try the native
      // Capacitor plugin backed by Android's SpeechRecognizer.
      const start = await this.startNativeListening();
      if (!start.ok) {
        this.isListening = false;
        if (this.onError) this.onError(start.error || 'transient');
        if (this.onStateChange) this.onStateChange(false, '');
      }
      return { supported: this.nativeRecognition !== null };
    }

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
    if (this.nativeRecognition && this.isListening) {
      try {
        this.nativeRecognition.stop();
      } catch {
        // ignore
      }
    } else if (this.recognition && this.isListening) {
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
    this.bestPartial = '';
    if (this.nativeRecognition) {
      this.nativeListenerHandles.forEach((handle) => {
        try {
          handle.remove();
        } catch {
          // ignore
        }
      });
      this.nativeListenerHandles = [];
      try {
        this.nativeRecognition.removeAllListeners();
      } catch {
        // ignore
      }
      this.nativeRecognition = null;
      return;
    }
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