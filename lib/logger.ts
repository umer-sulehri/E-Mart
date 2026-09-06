type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isEnabled = (level: LogLevel): boolean => {
  if (typeof window === 'undefined') {
    // Server: respect LOG_LEVEL, default to info.
    const configured = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    return LOG_LEVELS[level] >= (LOG_LEVELS[configured] ?? LOG_LEVELS.info);
  }
  // Client: always allow warn/error, only show info/debug in dev.
  return LOG_LEVELS[level] >= (process.env.NODE_ENV === 'production' ? LOG_LEVELS.warn : LOG_LEVELS.debug);
};

const formatArgs = (args: unknown[]): unknown[] => {
  return args.map((arg) => {
    if (arg instanceof Error) {
      return { name: arg.name, message: arg.message, stack: arg.stack };
    }
    return arg;
  });
};

export const logger = {
  debug: (scope: string, ...args: unknown[]) => {
    if (isEnabled('debug')) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.debug(`[${scope}]`, ...formatArgs(args));
    }
  },
  info: (scope: string, ...args: unknown[]) => {
    if (isEnabled('info')) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.info(`[${scope}]`, ...formatArgs(args));
    }
  },
  warn: (scope: string, ...args: unknown[]) => {
    if (isEnabled('warn')) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.warn(`[${scope}]`, ...formatArgs(args));
    }
  },
  error: (scope: string, ...args: unknown[]) => {
    if (isEnabled('error')) {
      // eslint-disable-next-line no-console
      if (typeof console !== 'undefined') console.error(`[${scope}]`, ...formatArgs(args));
    }
  },
};

export default logger;