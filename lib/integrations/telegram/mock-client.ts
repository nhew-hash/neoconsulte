import crypto from 'crypto';
import type {
  TelegramConnectionState,
  TelegramEvent,
  TelegramProviderState,
  TelegramSendResult,
} from './types';

const qrTtlMs = () => Number(process.env.PROVIDER_TELEGRAM_QR_TTL_SECONDS ?? 120) * 1000;

const runtimeState: TelegramProviderState = {
  status: 'disconnected',
  message: 'A conexão do Telegram está desativada até que uma sessão seja iniciada.',
  events: [],
};

function buildQrCode(): string {
  const payload = `NEOCONSULTE-TG-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" fill="#020817"/>
      <rect x="20" y="20" width="200" height="200" rx="20" fill="#0f172a" stroke="#2dd4bf" stroke-width="3"/>
      <g fill="#2dd4bf">
        <rect x="42" y="42" width="14" height="14"/>
        <rect x="42" y="84" width="14" height="14"/>
        <rect x="42" y="126" width="14" height="14"/>
        <rect x="42" y="168" width="14" height="14"/>
        <rect x="84" y="42" width="14" height="14"/>
        <rect x="126" y="42" width="14" height="14"/>
        <rect x="168" y="42" width="14" height="14"/>
        <rect x="84" y="84" width="14" height="14"/>
        <rect x="126" y="84" width="14" height="14"/>
        <rect x="168" y="84" width="14" height="14"/>
        <rect x="84" y="126" width="14" height="14"/>
        <rect x="126" y="126" width="14" height="14"/>
        <rect x="168" y="126" width="14" height="14"/>
        <rect x="84" y="168" width="14" height="14"/>
        <rect x="126" y="168" width="14" height="14"/>
        <rect x="168" y="168" width="14" height="14"/>
      </g>
      <text x="120" y="215" text-anchor="middle" fill="#e2e8f0" font-size="12" font-family="sans-serif">${payload.slice(0, 18)}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function createEvent(
  direction: TelegramEvent['direction'],
  text: string,
  from: string,
  chatId = 'demo-chat',
  correlationId?: string,
): TelegramEvent {
  return {
    id: `evt-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    chatId,
    from,
    text,
    direction,
    messageId: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    receivedAt: new Date().toISOString(),
    correlationId,
  };
}

export function getTelegramRuntimeState(): TelegramProviderState {
  const state = { ...runtimeState, events: [...runtimeState.events] };
  if (state.status === 'waiting_auth' && state.expiresAt) {
    const expiry = new Date(state.expiresAt).getTime();
    const now = Date.now();
    if (now > expiry) {
      state.status = 'expired';
      state.message = 'O QR Code do Telegram expirou. Solicite uma nova autenticação.';
      state.error = 'expired';
      state.qrCode = undefined;
      state.expiresAt = undefined;
    }
  }
  return state;
}

export async function connectTelegramDemo(): Promise<TelegramConnectionState> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + qrTtlMs());

  runtimeState.status = 'waiting_auth';
  runtimeState.connectedAt = undefined;
  runtimeState.expiresAt = expiresAt.toISOString();
  runtimeState.qrCode = buildQrCode();
  runtimeState.message = 'A autenticação do Telegram foi iniciada. Escaneie o QR Code no cliente autorizado.';
  runtimeState.error = undefined;
  runtimeState.lastCheck = now.toISOString();

  runtimeState.events = [
    createEvent('system', 'Conexão do Telegram iniciada.', 'system', 'demo-chat', 'auth-start'),
    ...runtimeState.events,
  ].slice(0, 20);

  return {
    status: runtimeState.status,
    expiresAt: runtimeState.expiresAt,
    qrCode: runtimeState.qrCode,
    message: runtimeState.message,
    lastCheck: runtimeState.lastCheck,
  };
}

export async function disconnectTelegramDemo(): Promise<TelegramConnectionState> {
  runtimeState.status = 'disconnected';
  runtimeState.connectedAt = undefined;
  runtimeState.expiresAt = undefined;
  runtimeState.qrCode = undefined;
  runtimeState.error = undefined;
  runtimeState.message = 'A sessão do Telegram foi desconectada com segurança.';
  runtimeState.lastCheck = new Date().toISOString();

  runtimeState.events = [createEvent('system', 'Sessão do Telegram encerrada com segurança.', 'system', 'demo-chat'), ...runtimeState.events].slice(0, 20);

  return {
    status: runtimeState.status,
    message: runtimeState.message,
    lastCheck: runtimeState.lastCheck,
  };
}

export async function getTelegramConnectionState(): Promise<TelegramConnectionState> {
  return {
    status: getTelegramRuntimeState().status,
    connectedAt: getTelegramRuntimeState().connectedAt,
    expiresAt: getTelegramRuntimeState().expiresAt,
    qrCode: getTelegramRuntimeState().qrCode,
    message: getTelegramRuntimeState().message,
    error: getTelegramRuntimeState().error,
    lastCheck: getTelegramRuntimeState().lastCheck,
  };
}

export async function approveTelegramDemoSession(): Promise<TelegramConnectionState> {
  runtimeState.status = 'connected';
  runtimeState.connectedAt = new Date().toISOString();
  runtimeState.expiresAt = undefined;
  runtimeState.qrCode = undefined;
  runtimeState.message = 'A sessão do Telegram foi validada em modo demonstrativo.';
  runtimeState.error = undefined;
  runtimeState.lastCheck = new Date().toISOString();

  runtimeState.events = [
    createEvent('system', 'Autenticação do Telegram validada em modo demonstrativo.', 'system', 'demo-chat', 'auth-success'),
    ...runtimeState.events,
  ].slice(0, 20);

  return {
    status: runtimeState.status,
    connectedAt: runtimeState.connectedAt,
    message: runtimeState.message,
    lastCheck: runtimeState.lastCheck,
  };
}

export async function sendTelegramDemoMessage(message: string): Promise<TelegramSendResult> {
  if (runtimeState.status !== 'connected') {
    return {
      ok: false,
      error: 'A sessão do Telegram não está conectada.',
    };
  }

  const entry = createEvent('outgoing', message, 'system', 'demo-chat', `corr-${crypto.randomBytes(4).toString('hex')}`);
  runtimeState.events = [entry, ...runtimeState.events].slice(0, 20);

  return {
    ok: true,
    messageId: entry.messageId,
  };
}

export async function consumeTelegramDemoEvents(): Promise<TelegramEvent[]> {
  if (runtimeState.status !== 'connected') {
    return [];
  }

  const simulated = createEvent('incoming', 'Resposta simulada recebida do cliente Telegram.', 'user', 'demo-chat', `corr-${crypto.randomBytes(4).toString('hex')}`);
  runtimeState.events = [simulated, ...runtimeState.events].slice(0, 20);

  return [simulated];
}

export async function simulateTelegramResponse(text: string, correlationId?: string): Promise<TelegramEvent> {
  const event = createEvent('incoming', text, 'user', 'demo-chat', correlationId);
  runtimeState.events = [event, ...runtimeState.events].slice(0, 20);
  return event;
}

export function telegramConnectionEnabled(): boolean {
  return process.env.PROVIDER_TELEGRAM_ENABLED === 'true' || process.env.PROVIDER_TELEGRAM_DEMO_MODE === 'true';
}
