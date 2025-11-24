import type { AuthUser } from '../../shared/interfaces/Auth';
import type { User, UserRole } from '../../shared/interfaces/DatabaseModels';
import { UserRepository } from '../repositories/userRepository';
import { hashPassword, verifyPassword } from '../utils/password';

const MAX_SLOTS = process.env.MAX_AUTH_SLOTS ? parseInt(process.env.MAX_AUTH_SLOTS, 10) : 4;
const DEFAULT_USERS: Array<{ username: string; password: string; role: UserRole }> = [
];

export class AuthService {
  constructor(private readonly repository: UserRepository) {}

  private sanitize(user: User): AuthUser {
    return {
      id: user.id,
      username: user.username,
      role: user.role,
    };
  }

  async getUserById(userId: number): Promise<AuthUser> {
    const user = await this.repository.getUserById(userId);
    if (!user) {
      throw new Error('Utilisateur introuvable.');
    }
    return this.sanitize(user);
  }

  async ensureSeedUsers(): Promise<void> {
    const count = await this.repository.countUsers();
    if (count === 0) {
      for (const entry of DEFAULT_USERS) {
        await this.repository.createUserInDB({
          username: entry.username,
          passwordHash: hashPassword(entry.password),
          role: entry.role,
        });
      }
      return;
    }

    for (const entry of DEFAULT_USERS) {
      const existing = await this.repository.getUserByUsername(entry.username);
      if (!existing) {
        await this.repository.createUserInDB({
          username: entry.username,
          passwordHash: hashPassword(entry.password),
          role: entry.role,
        });
      }
    }
  }

  async login(username: string, password: string): Promise<AuthUser> {
    const user = await this.repository.getUserByUsername(username);
    if (!user) {
      throw new Error('Identifiants invalides');
    }

    const stored = user.password_hash ?? '';
    let isValid = false;

    if (stored.includes(':')) {
      isValid = verifyPassword(password, stored);
    } else if (stored.length > 0) {
      isValid = stored === password;
      if (isValid) {
        const newHash = hashPassword(password);
        await this.repository.updatePasswordHash(user.username, newHash);
      }
    }

    if (!isValid) {
      const defaultEntry = DEFAULT_USERS.find((entry) => entry.username === username);
      if (defaultEntry && defaultEntry.password === password) {
        const newHash = hashPassword(password);
        await this.repository.updatePasswordHash(username, newHash);
        isValid = true;
      }
    }

    if (!isValid) {
      throw new Error('Identifiants invalides');
    }

    return this.sanitize(user);
  }

  async listUsers(): Promise<AuthUser[]> {
    const users = await this.repository.listUsers();
    return users.map((u) => this.sanitize(u));
  }

  async createUser(username: string, password: string, role: UserRole = 'agent'): Promise<AuthUser> {
    const count = await this.repository.countUsers();
    if (count >= MAX_SLOTS) {
      throw new Error('Nombre maximum de comptes atteint.');
    }
    const existing = await this.repository.getUserByUsername(username);
    if (existing) {
      throw new Error('Nom d’utilisateur déjà utilisé.');
    }
    const created = await this.repository.createUserInDB({
      username,
      passwordHash: hashPassword(password),
      role,
    });
    return this.sanitize(created);
  }

  async deleteUser(username: string): Promise<void> {
    const existing = await this.repository.getUserByUsername(username);
    if (!existing) {
      throw new Error('Utilisateur introuvable.');
    }
    await this.repository.deleteUserInDB(username);
  }

  async updateUser(username: string, options: { role?: UserRole; newPassword?: string | null }): Promise<AuthUser> {
    const existing = await this.repository.getUserByUsername(username);
    if (!existing) {
      throw new Error('Utilisateur introuvable.');
    }

    let passwordHash: string | null = null;
    if (options.newPassword && options.newPassword.trim().length > 0) {
      passwordHash = hashPassword(options.newPassword.trim());
    }

    const updated = await this.repository.updateUserInDB({
      username,
      role: options.role ?? existing.role,
      passwordHash,
    });

    return this.sanitize(updated);
  }

  async resetPassword(username: string, newPassword: string): Promise<void> {
    const existing = await this.repository.getUserByUsername(username);
    if (!existing) {
      throw new Error('Utilisateur introuvable.');
    }
    await this.repository.updatePasswordHash(username, hashPassword(newPassword));
  }
}
