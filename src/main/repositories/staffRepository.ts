import { prisma } from '../prisma/client';
import type { Staff } from '../../shared/interfaces/DatabaseModels';

/**
 * Repository helper used to fetch staff members (employees sending emails).
 */
export class StaffRepository {
  /**
   * Finds a staff entry by its email address.
   */
  async findByEmail(email: string): Promise<Staff | null> {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const staff = await prisma.staff.findFirst({
      where: {
        adresse_mail: normalized,
      },
    });
    return staff as unknown as Staff | null;
  }
}
