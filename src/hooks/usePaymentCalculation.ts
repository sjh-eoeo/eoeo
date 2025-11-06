import { useMemo } from 'react';
import type { Profile, Payment, PaymentCycle } from '../types';

/**
 * Calculate next payment date based on payment cycle
 */
export function getNextPaymentDate(
  profile: Profile,
  lastPayment: Payment | null,
  paymentCount: number
): Date | null {
  if (paymentCount >= profile.numberOfPayments) return null;

  const baseDate = lastPayment
    ? new Date(lastPayment.paymentDate)
    : new Date(profile.startDate);

  let cycleDays = 7;
  switch (profile.paymentCycle) {
    case 'weekly':
      cycleDays = 7;
      break;
    case 'bi-weekly':
      cycleDays = 14;
      break;
    case 'monthly':
      cycleDays = 30;
      break;
  }

  const dueDate = new Date(baseDate.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  return dueDate;
}

/**
 * Hook to calculate payment statistics and due payments
 */
export function usePaymentCalculation(
  profiles: Profile[],
  payments: Payment[],
  videos: { tiktokId: string }[]
) {
  // Group payments by profile
  const paymentsByProfile = useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach((p) => {
      if (!map.has(p.tiktokId)) map.set(p.tiktokId, []);
      map.get(p.tiktokId)!.push(p);
    });
    return map;
  }, [payments]);

  // Count videos by profile
  const videoCountsByProfile = useMemo(() => {
    const counts = new Map<string, number>();
    videos.forEach((video) => {
      counts.set(video.tiktokId, (counts.get(video.tiktokId) || 0) + 1);
    });
    return counts;
  }, [videos]);

  // Calculate due profiles
  const dueProfiles = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return profiles
      .map((profile) => {
        const profilePayments = paymentsByProfile.get(profile.tiktokId) || [];
        const paymentCount = profilePayments.length;

        if (paymentCount >= profile.numberOfPayments) return null;

        const lastPayment =
          paymentCount > 0
            ? [...profilePayments].sort(
                (a, b) =>
                  new Date(b.paymentDate).getTime() -
                  new Date(a.paymentDate).getTime()
              )[0]
            : null;

        const nextPaymentDate = getNextPaymentDate(
          profile,
          lastPayment,
          paymentCount
        );

        // Check if due by date
        let isDueByDate = false;
        if (nextPaymentDate && nextPaymentDate.getTime() <= today.getTime()) {
          isDueByDate = true;
        }

        // Check if enough videos
        const videosPerPayment = profile.totalVideoCount / profile.numberOfPayments;
        const requiredVideos = (paymentCount + 1) * videosPerPayment;
        const currentVideoCount = videoCountsByProfile.get(profile.tiktokId) || 0;
        const hasEnoughVideos = currentVideoCount >= requiredVideos;

        const isDue = isDueByDate && hasEnoughVideos;
        const amountDue = profile.contractAmount / profile.numberOfPayments;

        return isDue
          ? {
              ...profile,
              nextPaymentDate,
              amountDue,
              paymentCount,
              requiredVideos,
              currentVideoCount,
            }
          : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [profiles, paymentsByProfile, videoCountsByProfile]);

  return {
    paymentsByProfile,
    videoCountsByProfile,
    dueProfiles,
  };
}
