import { google, gmail_v1 } from 'googleapis';
import { logger } from '../main/utils/logger';

export type GmailSyncConfig = {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  refreshToken?: string;
  userEmail?: string;
  labelId?: string;
  query?: string;
  maxResults?: number;
};

export function buildGmailConfig(overrides: Partial<GmailSyncConfig> = {}): GmailSyncConfig {
  return {
    clientId: overrides.clientId ?? process.env.GMAIL_CLIENT_ID,
    clientSecret: overrides.clientSecret ?? process.env.GMAIL_CLIENT_SECRET,
    redirectUri: overrides.redirectUri ?? process.env.GMAIL_REDIRECT_URI,
    refreshToken: overrides.refreshToken ?? process.env.GMAIL_REFRESH_TOKEN,
    userEmail: overrides.userEmail ?? process.env.GMAIL_USER_EMAIL,
    labelId: overrides.labelId ?? process.env.GMAIL_LABEL_ID,
    query: overrides.query ?? process.env.GMAIL_QUERY,
    maxResults: overrides.maxResults ?? (process.env.GMAIL_MAX_RESULTS ? Number(process.env.GMAIL_MAX_RESULTS) : undefined),
  };
}

export function buildGmailClient(config: GmailSyncConfig): gmail_v1.Gmail | null {
  try {
    if (!config.clientId || !config.clientSecret || !config.redirectUri || !config.refreshToken) {
      logger.warn('buildGmailClient: missing Gmail OAuth configuration, skipping client creation');
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );

    oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    return google.gmail({
      version: 'v1',
      auth: oauth2Client,
    });
  } catch (error) {
    logger.error('buildGmailClient: failed to create Gmail client', error as Error);
    return null;
  }
}

export async function fetchUnreadMessages(
  gmail: gmail_v1.Gmail,
  config: GmailSyncConfig,
): Promise<gmail_v1.Schema$Message[]> {
  try {
    const maxResults =
      typeof config.maxResults === 'number' && Number.isFinite(config.maxResults) && config.maxResults > 0
        ? config.maxResults
        : 10;

    const listRes = await gmail.users.messages.list({
      userId: config.userEmail ?? 'me',
      labelIds: config.labelId ? [config.labelId] : undefined,
      q: config.query ?? 'in:inbox is:unread',
      maxResults,
    });

    const entries = listRes.data.messages ?? [];
    const detailedMessages: gmail_v1.Schema$Message[] = [];

    for (const entry of entries) {
      if (!entry.id) continue;
      const full = await gmail.users.messages.get({
        userId: config.userEmail ?? 'me',
        id: entry.id,
        format: 'full',
      });
      if (full.data) {
        detailedMessages.push(full.data);
      }
    }

    return detailedMessages;
  } catch (error) {
    logger.error('fetchUnreadMessages: failed to fetch Gmail messages', error as Error);
    return [];
  }
}

export async function markMessageAsRead(
  gmail: gmail_v1.Gmail,
  config: GmailSyncConfig,
  messageId: string,
): Promise<void> {
  try {
    await gmail.users.messages.modify({
      userId: config.userEmail ?? 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD'],
      },
    });
  } catch (error) {
    logger.warn(`markMessageAsRead: failed to mark ${messageId} as read`, error as Error);
  }
}
