// Step 17: Auth Service (src/auth/auth.service.ts)

import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { UserStatsService } from 'src/users/services/ser-stats.service';
import { PasswordResetToken } from 'src/auth/entities/password-reset-token.entity';
import { ResetPasswordDto } from 'src/auth/dto/reset-password.dto';
import { MailService } from 'src/mail/mail.service';
import { ForgotPasswordDto } from 'src/auth/dto/forgot-password.dto';
import { ChangePasswordDto } from 'src/auth/dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userStatsService: UserStatsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly mailService: MailService,
  ) { }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Tìm user theo email
    const user = await this.usersService.findByEmail(email);

    // Nếu không tìm thấy user, vẫn trả về thông báo thành công để tránh lộ thông tin
    if (!user) {
      return { message: 'If an account exists with this email, a password reset link has been sent.' };
    }

    // Tạo token đặt lại mật khẩu
    const token = uuidv4();

    // Tính thời gian hết hạn (1 giờ)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Lưu token vào database
    await this.passwordResetTokenRepository.save({
      token,
      expiresAt,
      userId: user.id,
      isUsed: false,
    });

    // Gửi email đặt lại mật khẩu
    await this.mailService.sendPasswordResetEmail(email, token);

    return { message: 'If an account exists with this email, a password reset link has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, password } = resetPasswordDto;

    // Tìm token hợp lệ
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        isUsed: false,
      },
      relations: ['user'],
    });

    // Kiểm tra token có tồn tại và còn hiệu lực
    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Cập nhật mật khẩu
    const user = resetToken.user;

    // Băm mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu trong database
    await this.usersService.update(user.id, { password: hashedPassword });

    // Đánh dấu token đã được sử dụng
    resetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(resetToken);

    // Vô hiệu hóa tất cả các refresh token hiện có của user
    await this.revokeAllUserTokens(user.id);

    return { message: 'Password has been reset successfully' };
  }

  async validateResetToken(token: string): Promise<boolean> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        token,
        isUsed: false,
      },
    });

    return !!resetToken && resetToken.expiresAt > new Date();
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    // Create new user
    return this.usersService.create(registerDto);
  }

  async login(loginDto: LoginDto): Promise<{ token: string; user: User }> {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);

    // Generate JWT token
    const token = this.generateToken(user);

    // Record login for statistics
    await this.userStatsService.recordUserLogin(user.id);

    return { token, user };
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async validateOAuthUser(profile: any, provider: string): Promise<User> {
    const email = profile.emails[0].value;

    // Check if user exists
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      // Create new user from OAuth profile
      user = await this.usersService.createFromOAuth(profile, provider);
    }

    return user;
  }

  async generateTokens(user: User, userAgent?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Tạo access token
    const accessTokenPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: this.configService.get('jwt.accessTokenExpiresIn') || '15m',
    });

    // Tạo refresh token
    const refreshToken = uuidv4();
    const refreshTokenExpiresIn = this.configService.get('jwt.refreshTokenExpiresIn') || '7d';

    // Tính toán thời gian hết hạn
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.parseExpiration(refreshTokenExpiresIn));

    // Lưu refresh token vào database
    await this.refreshTokenRepository.save({
      token: refreshToken,
      expiresAt,
      userId: user.id,
      userAgent,
      ipAddress,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string, userAgent?: string, ipAddress?: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Tìm refresh token trong database
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user'],
    });

    // Kiểm tra token có tồn tại và còn hiệu lực
    if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Vô hiệu hóa refresh token hiện tại
    tokenEntity.revoked = true;
    await this.refreshTokenRepository.save(tokenEntity);

    // Tạo cặp token mới
    return this.generateTokens(tokenEntity.user, userAgent, ipAddress);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (tokenEntity) {
      tokenEntity.revoked = true;
      await this.refreshTokenRepository.save(tokenEntity);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, revoked: false },
      { revoked: true }
    );
  }

  // Helper method to parse expiration time string (e.g. '7d', '15m') to milliseconds
  private parseExpiration(expiration: string): number {
    const unit = expiration.charAt(expiration.length - 1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return value;
    }
  }




  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    return this.jwtService.sign(payload);
  }

  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu có khớp nhau không
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirm password do not match');
    }

    // Lấy thông tin người dùng
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Xác thực mật khẩu hiện tại
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Kiểm tra mật khẩu mới có giống mật khẩu cũ không
    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException('New password must be different from the current password');
    }

    // Băm mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu trong database
    await this.usersService.update(userId, { password: hashedPassword });

    // Vô hiệu hóa tất cả các refresh token hiện có của user
    await this.revokeAllUserTokens(userId);

    return { message: 'Password has been changed successfully' };
  }
}