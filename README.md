# App
NEXTAUTH_SECRET=change-me
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Database
DATABASE_URL="file:./dev.db"

# Provider / telegrm
defaults to mock; turn on only after authorization
PROVIDER_TELEGRAM_ENABLED=false
PROVIDER_TELEGRAM_BOT_TOKEN=
PROVIDER_TELEGRAM_CHAT_ID=

# Payments (optional)
STRIPE_API_KEY=
STRIPE_WEBHOOK_SECRET=
