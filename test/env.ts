import 'dotenv/config';

// Variáveis do ambiente de teste. Os testes apagam dados: use um banco PostgreSQL SEPARADO.
export const TEST_ENV = {
  DATABASE_URL: process.env.TEST_DATABASE_URL ?? '',
  DATA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
  QUERY_TIMEOUT_SECONDS: '120',
  QUERY_TRANSPORT: 'demo',
  INBOUND_SECRET: 'test-secret',
};

Object.assign(process.env, TEST_ENV);
