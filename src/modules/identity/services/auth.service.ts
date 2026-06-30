import { PrismaService } from '@common/prisma/prisma.service';
import { LoginDto } from '@modules/identity/dto/login.dto/login.dto';
import { RegisterDto } from '@modules/identity/dto/register.dto/register.dto';
import { TokenService } from '@modules/identity/services/token.service';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RefreshDto } from '../dto/refresh.dto/refresh.dto';

// Dummy hash used when the email does not exist to keep login processing time constant,
// reducing the ability to infer user existence via timing attacks.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing-attack-mitigation', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  // Creates a new user, hashes the password before saving, and returns tokens on successful registration.
  async register(dto: RegisterDto) {
    // Never store raw passwords; bcrypt cost 12 is the current hashing strength.
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const normalizedEmail = dto.email.toLowerCase();

        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'USER',
            emailVerified: false,
            isActive: true,
          },
        });

        const tokens = await this.tokenService.issueTokenPair(user.id, user.email, user.role, tx);
        return { user: this.sanitizeUser(user), ...tokens };
      });
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException({
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email is already registered',
        });
      }

      throw error;
    }
  }

  // Validates credentials, checks account status, then issues access/refresh tokens.
  async login(dto: LoginDto) {
    // Only allow login for users that have not been soft-deleted.
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });

    // Always run bcrypt.compare regardless of user existence to avoid leaking information via response timing.
    const passwordMatch = user ? await bcrypt.compare(dto.password, user.password) : await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Reject login for accounts that exist but are locked/inactive.
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email, user.role);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // Strips the password before returning user data in the API response.
  private sanitizeUser<T extends { password: string } & Record<string, unknown>>(user: T): Omit<T, 'password'> {
    return Object.fromEntries(Object.entries(user).filter(([key]) => key !== 'password')) as Omit<T, 'password'>;
  }

  private isDuplicateEmailError(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    return target.includes('email');
  }

  async refresh(dto: RefreshDto) {
    return this.tokenService.refresh(dto.refreshToken);
  }

  async logout(userId: string, dto: RefreshDto): Promise<void> {
    await this.tokenService.logout(userId, dto.refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.tokenService.logoutAll(userId);
  }
}
