type LogLevel = 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

function serializeError(error: unknown): LogContext | undefined {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: String(error) };
}

function sanitizeContext(context: LogContext): LogContext {
  return Object.entries(context).reduce<LogContext>((acc, [key, value]) => {
    if (value === undefined) {
      return acc;
    }

    if (value instanceof Date) {
      acc[key] = value.toISOString();
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
}

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = sanitizeContext({
    level,
    event,
    timestamp: new Date().toISOString(),
    ...context,
  });

  const replacer = (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value);
  const line = JSON.stringify(payload, replacer);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function logInfo(event: string, context: LogContext = {}) {
  write('info', event, context);
}

export function logWarn(event: string, context: LogContext = {}) {
  write('warn', event, context);
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  write('error', event, {
    ...context,
    error: serializeError(error),
  });
}

