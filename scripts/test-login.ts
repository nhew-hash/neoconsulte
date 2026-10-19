const baseUrl = process.env.TEST_LOGIN_URL ?? 'http://localhost:3000';
const email = process.env.TEST_LOGIN_EMAIL ?? 'admin@neoconsulte.local';
const password = process.env.TEST_LOGIN_PASSWORD ?? 'admin123';

async function main() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await response.text();
  console.log('STATUS', response.status);
  console.log('HEADERS', response.headers.get('set-cookie'));
  console.log('BODY', text);
}

main().catch((error) => {
  console.error('Login test failed:', error);
  process.exit(1);
});
