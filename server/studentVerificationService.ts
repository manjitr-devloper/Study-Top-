import { subscriptionsStore } from './paymentService';

export interface StudentVerification {
  id: string;
  uid: string;
  studentName: string;
  institutionName: string;
  classGrade: string;
  rollNumber: string;
  academicSession: string;
  documentUrl: string;
  documentName: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export const studentVerificationsStore: Map<string, StudentVerification> = new Map();

export function submitVerification(data: {
  uid: string;
  studentName: string;
  institutionName: string;
  classGrade: string;
  rollNumber: string;
  academicSession: string;
  documentUrl: string;
  documentName: string;
}): StudentVerification {
  const id = 'ver_' + Date.now() + Math.random().toString(36).substring(2, 6);
  const verification: StudentVerification = {
    id,
    uid: data.uid,
    studentName: data.studentName,
    institutionName: data.institutionName,
    classGrade: data.classGrade,
    rollNumber: data.rollNumber || '',
    academicSession: data.academicSession,
    documentUrl: data.documentUrl,
    documentName: data.documentName,
    status: 'pending',
    submittedAt: Date.now()
  };

  studentVerificationsStore.set(id, verification);
  return verification;
}

export function reviewVerification(id: string, status: 'approved' | 'rejected', adminEmail: string, rejectionReason?: string) {
  const verification = studentVerificationsStore.get(id);
  if (!verification) {
    throw new Error('Student verification request not found.');
  }

  verification.status = status;
  verification.reviewedAt = Date.now();
  verification.reviewedBy = adminEmail;
  if (rejectionReason) {
    verification.rejectionReason = rejectionReason;
  }

  studentVerificationsStore.set(id, verification);

  // If approved, automatically grant free student premium subscription
  if (status === 'approved') {
    const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year free student premium
    subscriptionsStore.set(verification.uid, {
      uid: verification.uid,
      planId: 'verified_student_free',
      status: 'active',
      startAt: Date.now(),
      endAt: expiry,
      verifiedStudent: true,
      institution: verification.institutionName,
      updatedAt: Date.now()
    });
  } else if (status === 'rejected') {
    // If previously student verified, revert to free
    const currentSub = subscriptionsStore.get(verification.uid);
    if (currentSub && currentSub.verifiedStudent) {
      subscriptionsStore.set(verification.uid, {
        uid: verification.uid,
        planId: 'free',
        status: 'active',
        startAt: Date.now(),
        endAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now()
      });
    }
  }

  return verification;
}
