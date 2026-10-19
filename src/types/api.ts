
/**
 * Instance credentials entered by the user and persisted in LocalStorage.
 */
export interface GreenApiCredentials {
  /** GREEN-API instance identifier, e.g. "710722771205" */
  idInstance: string;
  /** Secret access token for the instance */
  apiTokenInstance: string;
  /**
   * Base API host URL, e.g. "https://7107.api.greenapi.com".
   * Format: `${apiUrl}/waInstance${idInstance}/...`
   */
  apiUrl: string;
}

/**
 * SendMessage Request Body
 * Endpoint: POST /waInstance{idInstance}/sendMessage/{apiTokenInstance}
 */
export interface SendMessagePayload {
  /** Recipient chat ID, e.g. "994501234567@c.us" */
  chatId: string;
  /** Message text content to send */
  message: string;
  /** Optional message ID being replied to */
  quotedMessageId?: string;
}

/**
 * SendMessage Success Response
 */
export interface SendMessageResponse {
  /** Unique message ID assigned by WhatsApp */
  idMessage: string;
}

/**
 * Webhook / Notification Body Event Types
 */
export type GreenApiWebhookType =
  | 'incomingMessageReceived'
  | 'outgoingMessageReceived'
  | 'outgoingAPIMessageReceived'
  | 'outgoingMessageStatus'
  | 'stateInstanceChanged'
  | 'deviceInfo';

export interface GreenApiNotificationBody {
  typeWebhook: GreenApiWebhookType;
  instanceData?: {
    idInstance: number;
    wid: string;
    typeInstance: string;
  };
  timestamp?: number;
  idMessage?: string;
  senderData?: {
    chatId: string;
    chatName?: string;
    sender: string;
    senderName?: string;
  };
  messageData?: {
    typeMessage: string;
    textMessageData?: {
      textMessage: string;
    };
    extendedTextMessageData?: {
      text: string;
    };
  };
  status?: 'pending' | 'sent' | 'delivered' | 'read';
}

/**
 * ReceiveNotification Response
 * Endpoint: GET /waInstance{idInstance}/receiveNotification/{apiTokenInstance}
 * Returns `null` when the queue is empty.
 */
export interface ReceiveNotificationResponse {
  /** Receipt identifier required to delete the notification from the queue */
  receiptId: number;
  /** Notification payload content */
  body: GreenApiNotificationBody;
}

/**
 * DeleteNotification Response
 * Endpoint: DELETE /waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}
 */
export interface DeleteNotificationResponse {
  /** Returns true if notification was successfully removed from the queue */
  result: boolean;
}

/**
 * Instance State Query Response
 * Endpoint: GET /waInstance{idInstance}/getStateInstance/{apiTokenInstance}
 */
export interface GetStateInstanceResponse {
  stateInstance: 'notAuthorized' | 'authorized' | 'blocked' | 'sleepMode' | 'starting';
}

/**
 * GetChatHistory Request Body
 * Endpoint: POST /waInstance{idInstance}/getChatHistory/{apiTokenInstance}
 */
export interface GetChatHistoryPayload {
  chatId: string;
  count?: number;
}

/**
 * Historical message item returned by getChatHistory
 */
export interface GreenApiHistoryMessage {
  type: 'incoming' | 'outgoing';
  idMessage: string;
  timestamp: number;
  textMessage?: string;
  statusMessage?: string;
  typeMessage?: string;
  extendedTextMessage?: {
    text: string;
  };
}

/**
 * Message item returned by lastIncomingMessages
 */
export interface GreenApiIncomingJournalItem {
  type: string;
  idMessage: string;
  timestamp: number;
  typeMessage: string;
  chatId: string;
  textMessage?: string;
  extendedTextMessage?: {
    text: string;
  };
  senderId?: string;
  senderName?: string;
  senderContactName?: string;
}
