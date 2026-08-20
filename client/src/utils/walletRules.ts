// src/utils/walletRules.ts
import { User } from '../types/user';

/**
 * Checks if the user is allowed to spend full balance or if they are capped by the 50% Welcome Credit rule.
 * Rule: A new user who has posted 0 items on the exchange can only use up to 50% of their Welcome Credit balance
 * for any single transaction. Once they post at least 1 item (active/completed), full balance is unlocked!
 */
export function canUseFullBalance(user: User, userHasPostedItem: boolean): boolean {
  if (!user) return false;
  // If user has posted at least 1 item or has no remaining welcome credit (has already spent/earned real Xu)
  if (userHasPostedItem || (user.welcomeCreditRemaining || 0) <= 0) {
    return true;
  }
  return false;
}

/**
 * Returns max spendable Xu amount for a user considering anti-inflation rules
 */
export function getMaxSpendableXu(user: User, userHasPostedItem: boolean): number {
  if (!user) return 0;
  if (canUseFullBalance(user, userHasPostedItem)) {
    return user.xuBalance;
  }

  // Welcome credit cap: 50% of welcome credit + any earned/top-up balance
  const welcomeCredit = user.welcomeCreditRemaining || 0;
  const spendableWelcomeCredit = Math.floor(welcomeCredit * 0.5);
  const nonGiftBalance = Math.max(0, user.xuBalance - welcomeCredit);

  return spendableWelcomeCredit + nonGiftBalance;
}

/**
 * Validates if user has enough spendable Xu for a transaction
 */
export function validateSwapXuRequirement(
  user: User,
  requiredXu: number,
  userHasPostedItem: boolean
): { allowed: boolean; reason?: string } {
  if (!user) {
    return { allowed: false, reason: 'Vui lòng đăng nhập để tiếp tục' };
  }

  if (user.xuBalance < requiredXu) {
    return { 
      allowed: false, 
      reason: `Ví của mẹ chỉ còn ${user.xuBalance} Xu, cần ${requiredXu} Xu để đổi món đồ này.` 
    };
  }

  const maxSpendable = getMaxSpendableXu(user, userHasPostedItem);
  if (requiredXu > maxSpendable) {
    return {
      allowed: false,
      reason: `Mẹ ơi, hãy đăng ít nhất 1 món đồ lên sàn để mở khóa thêm Xu chào mừng và đổi món đồ xịn hơn nhé! 🧸`
    };
  }

  return { allowed: true };
}
