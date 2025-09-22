declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export interface SendNotificationOptions {
    vapidDetails?: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
    TTL?: number;
    headers?: Record<string, string>;
    urgency?: string;
    topic?: string;
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(
    subscription: PushSubscription | string,
    payload?: string | Buffer | null,
    options?: SendNotificationOptions
  ): Promise<any>;
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string };
}