import 'dotenv/config';
import { execSync } from 'child_process';

export default function setup() {
  const testUrl = process.env.TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error('Defina TEST_DATABASE_URL (um banco PostgreSQL separado) para rodar os testes.');
  }
  if (testUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL não pode ser igual a DATABASE_URL: os testes apagam dados.');
  }

  execSync('npx prisma db push --skip-generate --force-reset --accept-data-loss', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: testUrl,
      DATA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
    },
  });
}
