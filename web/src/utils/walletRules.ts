// d:\Kindr\web\src\utils\walletRules.ts
import { User } from '../types';

export function getWithdrawableXu(user: User | null): number {
  if (!user) return 0;
  const promo = user.welcomeCreditRemaining || 0;
  return Math.max(0, user.xuBalance - promo);
}

export function canUseFullBalance(user: User | null, userHasPostedItem: boolean): boolean {
  if (!user) return false;
  if (userHasPostedItem || (user.tradesCount ?? 0) > 0) return true;
  if ((user.welcomeCreditRemaining ?? 0) === 0) return true;
  return false;
}

export function getMaxSpendableXu(user: User | null, userHasPostedItem: boolean): number {
  if (!user) return 0;
  if (canUseFullBalance(user, userHasPostedItem)) {
    return user.xuBalance;
  }
  const welcomeCredit = user.welcomeCreditRemaining || 0;
  const realBalance = Math.max(0, user.xuBalance - welcomeCredit);
  return realBalance + Math.floor(welcomeCredit * 0.5);
}

export function validateSwapXuRequirement(
  user: User | null,
  requiredXu: number,
  userHasPostedItem: boolean
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Vui lòng đăng nhập để đổi đồ.' };
  }
  if (requiredXu === 0) {
    return { allowed: true };
  }
  if (user.xuBalance < requiredXu) {
    return {
      allowed: false,
      reason: `Ví của mẹ hiện có ${user.xuBalance} Xu, cần ${requiredXu} Xu để ký quỹ đổi món đồ này. Hãy nạp thêm Xu hoặc đăng đồ cũ để nhận Xu nhé!`,
    };
  }
  return { allowed: true };
}
