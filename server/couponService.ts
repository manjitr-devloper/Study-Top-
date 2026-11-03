export interface Coupon {
  id: string;
  code: string;
  category: 'gifted' | 'paid';
  discountType: 'percentage' | 'fixed' | 'free';
  discountValue: number; // percentage (e.g. 20 for 20%) or fixed INR (e.g. 50 for ₹50)
  sellingPrice?: number; // if paid coupon
  minPurchaseAmount?: number;
  maxRedemptions?: number;
  currentRedemptions: number;
  perUserLimit: number;
  applicablePlans: string[]; // e.g. ['starter', 'pro', 'all']
  expiresAt: number;
  active: boolean;
  createdBy: string;
  createdAt: number;
}

export interface UserCouponOwnership {
  id: string;
  uid: string;
  couponId: string;
  code: string;
  status: 'available' | 'used' | 'expired';
  acquiredVia: 'gift' | 'purchase';
  acquiredAt: number;
  usedAt?: number;
}

export const couponsStore: Map<string, Coupon> = new Map([
  [
    'coup_welcome50',
    {
      id: 'coup_welcome50',
      code: 'STUDYTOP50',
      category: 'gifted',
      discountType: 'percentage',
      discountValue: 50,
      minPurchaseAmount: 0,
      maxRedemptions: 500,
      currentRedemptions: 12,
      perUserLimit: 1,
      applicablePlans: ['all'],
      expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
      active: true,
      createdBy: 'manjitranjan180513@gmail.com',
      createdAt: Date.now()
    }
  ],
  [
    'coup_free100',
    {
      id: 'coup_free100',
      code: 'FREEDIGITAL',
      category: 'gifted',
      discountType: 'free',
      discountValue: 100,
      minPurchaseAmount: 0,
      maxRedemptions: 100,
      currentRedemptions: 5,
      perUserLimit: 1,
      applicablePlans: ['starter', 'basic'],
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      active: true,
      createdBy: 'manjitranjan180513@gmail.com',
      createdAt: Date.now()
    }
  ]
]);

export const userCouponsStore: Map<string, UserCouponOwnership[]> = new Map();
export const couponRedemptionsStore: Set<string> = new Set(); // uid_couponId
export const couponAuditLogsStore: any[] = [];

export function validateAndApplyCoupon(code: string, planAmount: number, planId: string, uid: string) {
  const cleanCode = code.trim().toUpperCase();
  let foundCoupon: Coupon | null = null;

  for (const c of couponsStore.values()) {
    if (c.code.toUpperCase() === cleanCode) {
      foundCoupon = c;
      break;
    }
  }

  if (!foundCoupon) {
    throw new Error('Invalid coupon code.');
  }

  if (!foundCoupon.active) {
    throw new Error('This coupon is currently inactive.');
  }

  if (foundCoupon.expiresAt < Date.now()) {
    throw new Error('This coupon has expired.');
  }

  if (foundCoupon.maxRedemptions && foundCoupon.currentRedemptions >= foundCoupon.maxRedemptions) {
    throw new Error('This coupon has reached its maximum redemption limit.');
  }

  if (planAmount < (foundCoupon.minPurchaseAmount || 0)) {
    throw new Error(`Minimum purchase amount of ₹${foundCoupon.minPurchaseAmount} required for this coupon.`);
  }

  if (!foundCoupon.applicablePlans.includes('all') && !foundCoupon.applicablePlans.includes(planId)) {
    throw new Error('This coupon is not applicable to the selected subscription plan.');
  }

  // Check per-user limit
  const userRedemptionKey = `${uid}_${foundCoupon.id}`;
  if (couponRedemptionsStore.has(userRedemptionKey)) {
    throw new Error('You have already used this coupon maximum times allowed per user.');
  }

  // Calculate discount
  let discountAmount = 0;
  if (foundCoupon.discountType === 'percentage') {
    discountAmount = (planAmount * foundCoupon.discountValue) / 100;
  } else if (foundCoupon.discountType === 'fixed') {
    discountAmount = Math.min(planAmount, foundCoupon.discountValue);
  } else if (foundCoupon.discountType === 'free') {
    discountAmount = planAmount;
  }

  const finalAmount = Math.max(0, planAmount - discountAmount);

  return {
    couponId: foundCoupon.id,
    code: foundCoupon.code,
    discountType: foundCoupon.discountType,
    discountValue: foundCoupon.discountValue,
    originalAmount: planAmount,
    discountAmount,
    finalAmount: Math.round(finalAmount * 100) / 100
  };
}

export function redeemCoupon(uid: string, couponId: string) {
  const coupon = couponsStore.get(couponId);
  if (!coupon) return;

  coupon.currentRedemptions++;
  couponsStore.set(couponId, coupon);
  couponRedemptionsStore.add(`${uid}_${couponId}`);

  couponAuditLogsStore.unshift({
    id: 'cal_' + Date.now(),
    uid,
    couponCode: coupon.code,
    action: 'REDEEMED',
    timestamp: Date.now()
  });
}
