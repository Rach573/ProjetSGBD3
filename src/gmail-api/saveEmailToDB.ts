import type { MailRepository } from '../main/repositories/mailRepository';
import type { ParsedGmailMessage } from './parseEmail';

export async function saveEmailToDB(
  mailRepository: MailRepository,
  email: ParsedGmailMessage,
  staffId: number,
): Promise<number | null> {
  const duplicate = await mailRepository.findByUnique(email.subject, email.receivedAt);
  if (duplicate) {
    return null;
  }

  const created = await mailRepository.createMail({
    objet: email.subject || '(no subject)',
    contenu: email.body,
    date_reception: email.receivedAt,
    expediteur_staff_id: staffId,
    categorie_id: null,
    privacy_id: null,
    handler_user_id: null,
  });

  return created.id;
}
