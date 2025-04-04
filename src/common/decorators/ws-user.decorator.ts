import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WsUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const wsData = ctx.switchToWs().getData();
    const user = wsData.user;

    return data ? user?.[data] : user;
  },
);