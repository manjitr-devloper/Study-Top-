import { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface UserSubscription {
  uid: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  endAt: number;
  verifiedStudent?: boolean;
  institution?: string;
}

export function useSubscription(userId?: string) {
  const [subscription] = useState<UserSubscription>({
    uid: userId || 'active_student',
    planId: 'free',
    status: 'active',
    endAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    verifiedStudent: true
  });
  const loading = false;

  const planId = subscription?.planId || 'free';
  const isPaid = planId !== 'free';
  const isPro = ['pro', 'standard', 'advanced', 'ultimate', 'premium_monthly', 'premium_yearly', 'lifetime_access', 'verified_student_free'].includes(planId) || subscription?.verifiedStudent;
  const isStudentPlus = ['starter', 'basic', 'student_plus'].includes(planId) || isPro;

  return {
    subscription,
    loading,
    planId,
    isPaid,
    isPro,
    isStudentPlus,
    isVerifiedStudent: !!subscription?.verifiedStudent
  };
}
