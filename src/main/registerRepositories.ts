import { registerMailRepository } from './repositories/registerMailRepository';
import { registerTacheRepository } from './repositories/registerTacheRepository';
import { registerUserRepository } from './repositories/registerUserRepository';
import { registerStatsRepository } from './repositories/registerStatsRepository';
import { registerAuthRepository } from './repositories/registerAuthRepository';
import { MailRepository } from './repositories/mailRepository';
import { TacheRepository } from './repositories/tacheRepository';
import { UserRepository } from './repositories/userRepository';
import { StatsRepository } from './repositories/statsRepository';
import { MailService } from './services/mailService';
import { TacheService } from './services/tacheService';
import { AuthService } from './services/authService';
import { StatsService } from './services/statsService';




export function registerRepositories()
{
    const mailRepository = new MailRepository();
    const tacheRepository = new TacheRepository();
    const userRepository = new UserRepository();
    const statsRepository = new StatsRepository();
    const authService = new AuthService(userRepository);
    const tacheService = new TacheService(tacheRepository, mailRepository);
    const statsService = new StatsService(statsRepository);

  registerMailRepository({ mailRepository, tacheRepository });
  registerTacheRepository(tacheRepository, { tacheService: tacheService });
  registerUserRepository({ userRepository });
  registerStatsRepository({ statsService });
  registerAuthRepository(authService);
    
}



