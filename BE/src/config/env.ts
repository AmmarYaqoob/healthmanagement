import dotenv from 'dotenv';

export type NodeEnv = 'development' | 'test' | 'production';

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  mongodb: {
    uri: string;
  };
}

let cachedConfig: AppConfig | undefined;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function requireEnv(name: string): string {
  const value = readEnv(name);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseNodeEnv(value: string): NodeEnv {
  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  throw new Error(`Invalid NODE_ENV "${value}". Expected development, test, or production.`);
}

function parsePort(value: string): number {
  if (!/^\d+$/.test(value)) {
    throw new Error(`Invalid PORT "${value}". Expected an integer between 1 and 65535.`);
  }

  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new Error(`Invalid PORT "${value}". Expected an integer between 1 and 65535.`);
  }

  return port;
}

function loadConfig(): AppConfig {
  dotenv.config();

  return {
    nodeEnv: parseNodeEnv(requireEnv('NODE_ENV')),
    port: parsePort(requireEnv('PORT')),
    mongodb: {
      uri: requireEnv('MONGODB_URI'),
    },
  };
}

function getConfig(): AppConfig {
  if (cachedConfig === undefined) {
    cachedConfig = loadConfig();
  }

  return cachedConfig;
}

export const config = {
  get nodeEnv(): NodeEnv {
    return getConfig().nodeEnv;
  },
  get port(): number {
    return getConfig().port;
  },
  get mongodb(): AppConfig['mongodb'] {
    return getConfig().mongodb;
  },
};
