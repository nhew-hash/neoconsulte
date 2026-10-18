export type TelegramConnectionStatus = 'disconnected' | 'waiting_auth' | 'connected' | 'error' | 'expired';

export type TelegramEventDirection = 'incoming' | 'outgoing' | 'system';

export interface TelegramConnectionState {
  status: TelegramConnectionStatus;
  connectedAt?: string;
  expiresAt?: string;
  qrCode?: string;
  message: string;
  error?: string;
  lastCheck?: string;
}

export interface TelegramEvent {
  id: string;
  chatId: string;
  from: string;
  text: string;
  direction: TelegramEventDirection;
  messageId: string;
  receivedAt: string;
  correlationId?: string;
}

export interface TelegramSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface TelegramProviderState extends TelegramConnectionState {
  events: TelegramEvent[];
}
