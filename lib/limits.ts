export interface PlanLimits {
  maxVideoDurationSec: number;
  maxVideoSizeMB: number;
  maxClipsPerVideo: number;
  maxClipDurationSec: number;
  cleanClipsPerMonth: number;
  watermarkEnabled: boolean;
  s3StorageGB: number;
}

export type PlanName = "free" | "pro";

export function getPlanLimits(plan: PlanName): PlanLimits {
  if (plan === "pro") {
    return {
      maxVideoDurationSec: 7200,
      maxVideoSizeMB: 4096,
      maxClipsPerVideo: 50,
      maxClipDurationSec: 180,
      cleanClipsPerMonth: -1,
      watermarkEnabled: false,
      s3StorageGB: 100,
    };
  }
  return {
    maxVideoDurationSec: 600,
    maxVideoSizeMB: 500,
    maxClipsPerVideo: 6,
    maxClipDurationSec: 60,
    cleanClipsPerMonth: 6,
    watermarkEnabled: true,
    s3StorageGB: 1,
  };
}

export function getGuestLimits(): PlanLimits {
  return {
    maxVideoDurationSec: 600,
    maxVideoSizeMB: 500,
    maxClipsPerVideo: 6,
    maxClipDurationSec: 60,
    cleanClipsPerMonth: 6,
    watermarkEnabled: true,
    s3StorageGB: 1,
  };
}

export function getPlan(user: { subscription?: { plan: string } | null }): PlanName {
  if (user.subscription?.plan === "pro") return "pro";
  return "free";
}
