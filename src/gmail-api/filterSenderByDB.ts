import type { StaffRepository } from '../main/repositories/staffRepository';
import type { ParsedGmailMessage } from './parseEmail';

export type SenderValidationResult = {
  staffId: number;
};

export async function filterSenderByDB(
  email: ParsedGmailMessage,
  staffRepository: StaffRepository,
): Promise<SenderValidationResult | null> {
  if (!email.fromAddress) {
    return null;
  }

  const staff = await staffRepository.findByEmail(email.fromAddress);
  if (!staff) {
    return null;
  }

  return { staffId: staff.id };
}
