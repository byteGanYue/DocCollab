import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 暂时使用模拟用户数据，后续可以改为真实的JWT验证
    request.user = {
      userId: 'mock_user_001', // 模拟用户ID
      username: 'testuser', // 模拟用户名
    };

    return true;
  }
}
