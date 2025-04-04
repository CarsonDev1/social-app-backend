// Step 57: WebSocket JWT Guard (src/auth/guards/ws-jwt.guard.ts)

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) { }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient();
    const token = client.handshake.auth.token;

    if (!token) {
      throw new WsException('Unauthorized');
    }

    return this.validateToken(token, context);
  }

  async validateToken(token: string, context: ExecutionContext): Promise<boolean> {
    try {
      const payload = this.authService.verifyToken(token);
      const user = await this.usersService.findById(payload.sub);

      // Attach user to socket
      const client = context.switchToWs().getClient();
      client.user = user;

      // Set the user in the data object, to be extracted by the @WsUser() decorator
      context.switchToWs().getData().user = user;

      return true;
    } catch (error) {
      throw new WsException('Unauthorized');
    }
  }
}