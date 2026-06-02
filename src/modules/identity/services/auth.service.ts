import { PrismaService } from '@common/prisma/prisma.service';
import { LoginDto } from '@modules/identity/dto/login.dto/login.dto';
import { RegisterDto } from '@modules/identity/dto/register.dto/register.dto';
import { TokenService } from '@modules/identity/services/token.service';
import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Hash giả dùng khi email không tồn tại để thời gian xử lý login ổn định hơn,
// giảm khả năng đoán user tồn tại hay không qua timing attack.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing-attack-mitigation', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  // Tạo user mới, hash password trước khi lưu và trả về token sau khi đăng ký thành công.
  async register(dto: RegisterDto) {
    // Không bao giờ lưu password thô; bcrypt cost 12 là mức mã hóa hiện tại.
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

  // Xác thực thông tin đăng nhập, kiểm tra trạng thái tài khoản rồi cấp access/refresh token.
  async login(dto: LoginDto) {
    // Chỉ cho phép login với user chưa bị soft delete.
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });

    // Dù user có tồn tại hay không vẫn chạy bcrypt.compare để tránh lộ thông tin qua thời gian phản hồi.
    const passwordMatch = user ? await bcrypt.compare(dto.password, user.password) : await bcrypt.compare(dto.password, DUMMY_PASSWORD_HASH);

    if (!user || !passwordMatch) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }

    // Tài khoản tồn tại nhưng bị khóa/inactive thì cũng không cho đăng nhập.
    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive',
      });
    }

    const tokens = await this.tokenService.issueTokenPair(user.id, user.email, user.role);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // Loại bỏ password trước khi trả dữ liệu user ra ngoài API response.
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
}
