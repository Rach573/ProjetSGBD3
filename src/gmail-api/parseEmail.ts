import { Buffer } from 'node:buffer';
import type { gmail_v1 } from 'googleapis';

export type ParsedGmailMessage = {
  id: string;
  subject: string;
  body: string | null;
  receivedAt: string;
  fromName: string | null;
  fromAddress: string | null;
};

export function parseGmailMessage(message: gmail_v1.Schema$Message): ParsedGmailMessage | null {
  if (!message.id) {
    return null;
  }

  const headers = message.payload?.headers ?? [];
  const subject = headerValue(headers, 'Subject') ?? '(no subject)';
  const dateHeader = headerValue(headers, 'Date');
  const receivedAt = computeReceivedAt(message, dateHeader);
  const body = extractBody(message.payload) ?? message.snippet ?? null;
  const fromHeader = headerValue(headers, 'From');
  const { name: fromName, address: fromAddress } = parseAddress(fromHeader);

  return {
    id: message.id,
    subject,
    body,
    receivedAt,
    fromName,
    fromAddress,
  };
}

function headerValue(headers: gmail_v1.Schema$MessagePartHeader[], name: string): string | null {
  const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value ?? null;
}

function computeReceivedAt(message: gmail_v1.Schema$Message, dateHeader: string | null): string {
  if (dateHeader) {
    const parsed = Date.parse(dateHeader);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  const internalDate = message.internalDate ? Number(message.internalDate) : NaN;
  if (!Number.isNaN(internalDate)) {
    return new Date(internalDate).toISOString();
  }

  return new Date().toISOString();
}

function parseAddress(raw: string | null): { name: string | null; address: string | null } {
  if (!raw) {
    return { name: null, address: null };
  }

  const addressMatch = raw.match(/<([^>]+)>/);
  if (addressMatch) {
    const address = addressMatch[1]?.trim().toLowerCase() ?? null;
    const namePart = raw.replace(addressMatch[0], '').trim();
    const cleanedName = namePart.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    return {
      name: cleanedName.length > 0 ? cleanedName : null,
      address,
    };
  }

  const normalized = raw.trim().toLowerCase();
  return {
    name: null,
    address: normalized.length ? normalized : null,
  };
}

function extractBody(part?: gmail_v1.Schema$MessagePart | null): string | null {
  if (!part) {
    return null;
  }

  if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
    const decoded = decodeBody(part.body?.data);
    if (decoded) {
      return decoded;
    }
  }

  if (Array.isArray(part.parts)) {
    for (const nested of part.parts) {
      const nestedBody = extractBody(nested);
      if (nestedBody) {
        return nestedBody;
      }
    }
  }

  return decodeBody(part.body?.data);
}

function decodeBody(data?: string | null): string | null {
  if (!data) {
    return null;
  }

  try {
    const normalized = data.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalized, 'base64').toString('utf8');
  } catch (
    /** swallow */
    _error
  ) {
    return null;
  }
}
