import type { IntroEligibility, PurchasesPackage, SubscriptionOption } from 'react-native-purchases';
import { NativeModules, Platform } from 'react-native';

import { getOrCreateAskSession } from '@/services/ask/askSession';

const plusEntitlementId = 'plus';

type IntroOffer = { priceString: string; period: string; cycles: number; free: boolean };

export type PlanPackage = {
  identifier: string;
  packageType: string;
  title: string;
  priceString: string;
  period: string | null;
  introOffers: IntroOffer[];
  rcPackage: PurchasesPackage;
  androidOption: SubscriptionOption | null;
};

type PurchasesModule = typeof import('react-native-purchases').default;

let purchasesModule: PurchasesModule | null | undefined;
let configuration: Promise<void> | undefined;

function getApiKey() {
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
}

function getPurchasesModule(): PurchasesModule | null {
  if (!NativeModules.RNPurchases) return null;
  if (purchasesModule !== undefined) return purchasesModule;
  try {
    purchasesModule = (require('react-native-purchases') as { default: PurchasesModule }).default;
  } catch {
    purchasesModule = null;
  }
  return purchasesModule;
}

export function isPurchasesAvailable() {
  return Boolean(getApiKey() && getPurchasesModule());
}

async function initPurchases() {
  const apiKey = getApiKey();
  const purchases = getPurchasesModule();
  if (!apiKey || !purchases) throw new Error('Purchases are unavailable in this build.');

  configuration ??= getOrCreateAskSession()
    .then(({ subscriberId }) => purchases.configure({ apiKey, appUserID: subscriberId }))
    .catch((error: unknown) => {
      configuration = undefined;
      throw error;
    });
  await configuration;
  return purchases;
}

export async function getPlanPackages(): Promise<PlanPackage[]> {
  const purchases = await initPurchases();
  const offerings = await purchases.getOfferings();
  const packages = offerings.current?.availablePackages ?? [];
  const introProductIds = packages.filter(({ product }) => product.introPrice).map(({ product }) => product.identifier);
  const eligibility: Record<string, IntroEligibility> = Platform.OS === 'ios' && introProductIds.length
    ? await purchases.checkTrialOrIntroductoryPriceEligibility(introProductIds).catch(() => ({}))
    : {};

  const order = ['ANNUAL', 'MONTHLY', 'WEEKLY', 'LIFETIME'];
  return [...packages]
    .sort((a, b) => {
      const aIndex = order.indexOf(a.packageType);
      const bIndex = order.indexOf(b.packageType);
      return (aIndex === -1 ? order.length : aIndex) - (bIndex === -1 ? order.length : bIndex);
    })
    .map((rcPackage) => {
      const { product } = rcPackage;
      const androidOption = Platform.OS === 'android' ? product.defaultOption : null;
      const androidPrice = androidOption?.fullPricePhase;
      const introOffers: IntroOffer[] = androidOption?.pricingPhases.slice(0, -1).map((phase) => ({
        priceString: phase.price.formatted,
        period: phase.billingPeriod.iso8601,
        cycles: phase.billingCycleCount ?? 1,
        free: phase.price.amountMicros === 0,
      })) ?? [];
      const iosIntro = product.introPrice;
      if (iosIntro && eligibility[product.identifier]?.status === purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE) {
        introOffers.push({
          priceString: iosIntro.priceString,
          period: iosIntro.period,
          cycles: iosIntro.cycles,
          free: iosIntro.price === 0,
        });
      }
      return {
        identifier: rcPackage.identifier,
        packageType: rcPackage.packageType,
        title: product.title,
        priceString: androidPrice?.price.formatted ?? product.priceString,
        period: androidPrice?.billingPeriod.iso8601 ?? product.subscriptionPeriod,
        introOffers,
        rcPackage,
        androidOption,
      };
    });
}

export type PurchaseOutcome = 'purchased' | 'pending' | 'cancelled' | 'failed';

export async function purchasePlan(plan: PlanPackage): Promise<PurchaseOutcome> {
  try {
    const purchases = await initPurchases();
    if (plan.androidOption) {
      await purchases.purchaseSubscriptionOption(plan.androidOption);
    } else {
      await purchases.purchasePackage(plan.rcPackage);
    }
    return 'purchased';
  } catch (error) {
    const details = error as { userCancelled?: boolean; code?: string } | null;
    if (details?.userCancelled) return 'cancelled';
    if (details?.code && details.code === getPurchasesModule()?.PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending';
    return 'failed';
  }
}

export async function restorePlan(): Promise<boolean> {
  const purchases = await initPurchases();
  const customerInfo = await purchases.restorePurchases();
  return Boolean(customerInfo.entitlements.active[plusEntitlementId]);
}
