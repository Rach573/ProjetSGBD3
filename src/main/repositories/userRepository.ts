import { prisma } from '../prisma/client';
import type { User } from '../../shared/interfaces/DatabaseModels';

export interface AgentWorkload {
  id: number;
  username: string;
  openTasks: number;
}

export type CreateUserInput = {
  username: string;
  passwordHash: string;
  role: User['role'];
};

export type UpdateUserInput = {
  username: string;
  role?: User['role'];
  passwordHash?: string | null;
};

/**
 * Repository for accessing IT users / agents.
 */
export class UserRepository {
  async countUsers(): Promise<number> {
    return await prisma.users.count();
  }

  async listUsers(): Promise<User[]> {
    const users = await prisma.users.findMany({
      orderBy: { username: 'asc' },
    });
    return users as unknown as User[];
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!username) return null;
    const user = await prisma.users.findUnique({
      where: { username },
    });
    return user as unknown as User | null;
  }

  async getUserById(userId: number): Promise<User | null> {
    if (!userId) return null;
    const user = await prisma.users.findUnique({
      where: { id: userId },
    });
    return user as unknown as User | null;
  }

  async createUserInDB(data: CreateUserInput): Promise<User> {
    const created = await prisma.users.create({
      data: {
        username: data.username,
        password_hash: data.passwordHash,
        role: data.role,
      },
    });
    return created as unknown as User;
  }

  async updatePasswordHash(username: string, passwordHash: string): Promise<void> {
    await prisma.users.update({
      where: { username },
      data: { password_hash: passwordHash },
    });
  }

  async updateUserInDB(data: UpdateUserInput): Promise<User> {
    const updated = await prisma.users.update({
      where: { username: data.username },
      data: {
        role: data.role ?? undefined,
        password_hash: data.passwordHash ?? undefined,
      },
    });
    return updated as unknown as User;
  }

  async deleteUserInDB(username: string): Promise<void> {
    await prisma.users.delete({
      where: { username },
    });
  }

  /**
   * Loads all agents with the number of non résolu tasks assigned to them.
   */
  async findAgentsWithOpenTaskCount(): Promise<AgentWorkload[]> {
    const agents = await prisma.users.findMany({
      where: {
        role: 'agent',
      },
      select: {
        id: true,
        username: true,
        taches: {
          where: {
            statut_tache: {
              not: 'Resolu',
            },
          },
          select: {
            id: true,
          },
        },
      },
    });

    interface AgentWithTaches {
      id: number;
      username: string;
      taches: { id: number }[];
    }

    return (agents as AgentWithTaches[]).map((agent): AgentWorkload => ({
      id: agent.id,
      username: agent.username,
      openTasks: agent.taches.length,
    }));
  }
}
