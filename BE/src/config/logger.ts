type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function serializeMeta(meta: unknown): string {
  if (meta instanceof Error) {
    return JSON.stringify({ name: meta.name, message: meta.message });
  }

  try {
    return JSON.stringify(meta);
  } catch {
    return '"[unserializable]"';
  }
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const suffix = meta === undefined ? '' : ` ${serializeMeta(meta)}`;
  const line = `${timestamp} [${level.toUpperCase()}] ${message}${suffix}`;

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message: string, meta?: unknown): void {
    write('debug', message, meta);
  },
  info(message: string, meta?: unknown): void {
    write('info', message, meta);
  },
  warn(message: string, meta?: unknown): void {
    write('warn', message, meta);
  },
  error(message: string, meta?: unknown): void {
    write('error', message, meta);
  },
};
