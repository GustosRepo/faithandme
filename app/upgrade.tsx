import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Divider, EditorialLabel, Screen, Text } from '@/components/ui';
import { useLanguage, type AppLanguage, type TranslationKey } from '@/context/LanguageContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { refreshAskScriptureEntitlement } from '@/services/ask/AskScriptureService';
import {
  getPlanPackages,
  isPurchasesAvailable,
  purchasePlan,
  restorePlan,
  type PlanPackage,
} from '@/services/purchases/PurchasesService';

const freeStaysFree = [
  'upgrade.free.bible',
  'upgrade.free.daily',
  'upgrade.free.journal',
  'upgrade.free.saved',
  'upgrade.free.safety',
] as const;

const planLabelKeys: Record<string, TranslationKey> = {
  ANNUAL: 'upgrade.plan.annual',
  MONTHLY: 'upgrade.plan.monthly',
  WEEKLY: 'upgrade.plan.weekly',
  LIFETIME: 'upgrade.plan.lifetime',
};

const periodUnits = { D: 'day', W: 'week', M: 'month', Y: 'year' } as const;

function formatPeriod(period: string | null, language: AppLanguage, cycles = 1) {
  const match = /^P(\d+)([DWMY])$/.exec(period ?? '');
  if (!match) return null;
  const unit = periodUnits[match[2] as keyof typeof periodUnits];
  return new Intl.NumberFormat(language, { style: 'unit', unit, unitDisplay: 'long' }).format(Number(match[1]) * cycles);
}

export default function UpgradeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { language, t } = useLanguage();
  const purchasesAvailable = isPurchasesAvailable();
  const [plans, setPlans] = useState<PlanPackage[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(purchasesAvailable);
  const [working, setWorking] = useState(false);
  const [activationPending, setActivationPending] = useState(false);
  const [planLoadAttempt, setPlanLoadAttempt] = useState(0);
  const actionInProgress = useRef(false);
  const plan = plans.find((candidate) => candidate.identifier === selectedPlan);
  const showsTrial = plan?.introOffers.some((offer) => offer.free && formatPeriod(offer.period, language));

  useEffect(() => {
    if (!purchasesAvailable) return;
    let cancelled = false;

    void getPlanPackages()
      .then((nextPlans) => {
        if (cancelled) return;
        setPlans(nextPlans);
        setSelectedPlan(nextPlans[0]?.identifier ?? null);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });

    return () => {
      cancelled = true;
    };
  }, [purchasesAvailable, planLoadAttempt]);

  const confirmPlus = async (restored = false) => {
    for (const delay of [0, 750, 1250]) {
      if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
      const usage = await refreshAskScriptureEntitlement().catch(() => null);
      if (usage?.entitlement === 'plus') {
        setActivationPending(false);
        Alert.alert(
          t(restored ? 'upgrade.restoreSuccessTitle' : 'upgrade.successTitle'),
          t(restored ? 'upgrade.restoreSuccessBody' : 'upgrade.successBody'),
          [{ text: t('common.done'), onPress: () => router.back() }],
        );
        return;
      }
    }
    setActivationPending(true);
  };

  const handlePurchase = async () => {
    if ((!plan && !activationPending) || actionInProgress.current) return;
    actionInProgress.current = true;
    setWorking(true);
    try {
      if (activationPending) {
        await confirmPlus();
        return;
      }
      if (!plan) return;
      const outcome = await purchasePlan(plan);
      if (outcome === 'purchased') {
        await confirmPlus();
      } else if (outcome === 'pending') {
        setActivationPending(true);
      } else if (outcome === 'failed') {
        Alert.alert(t('upgrade.purchaseFailedTitle'), t('upgrade.purchaseFailedBody'));
      }
    } finally {
      actionInProgress.current = false;
      setWorking(false);
    }
  };

  const handleRestore = async () => {
    if (!purchasesAvailable || actionInProgress.current) return;
    actionInProgress.current = true;
    setWorking(true);
    try {
      if (await restorePlan()) {
        await confirmPlus(true);
      } else {
        Alert.alert(t('upgrade.restoreNoneTitle'), t('upgrade.restoreNoneBody'));
      }
    } catch {
      Alert.alert(t('upgrade.restoreFailedTitle'), t('upgrade.restoreFailedBody'));
    } finally {
      actionInProgress.current = false;
      setWorking(false);
    }
  };

  return (
    <Screen contentContainerStyle={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('upgrade.close')}
        hitSlop={10}
        onPress={() => router.back()}
        style={({ pressed }) => [styles.closeButton, { backgroundColor: theme.colors.surfaceSecondary, opacity: pressed ? 0.75 : 1 }]}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </Pressable>

      <View style={styles.hero}>
        <EditorialLabel>{t('upgrade.label')}</EditorialLabel>
        <Text variant="displaySerif">{t('upgrade.title')}</Text>
        <Text variant="body" style={{ color: theme.colors.textSecondary }}>
          {t('upgrade.subtitle')}
        </Text>
      </View>

      <View style={[styles.planBlock, { borderColor: theme.colors.rule }]}>
        <Text variant="headingSerif">{t('upgrade.planName')}</Text>

        {loadingPlans ? (
          <View style={styles.plansLoading}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('upgrade.loadingPlans')}</Text>
          </View>
        ) : null}

        {!loadingPlans && !plans.length ? (
          <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('upgrade.plansUnavailable')}</Text>
        ) : null}

        {plans.map((option) => {
          const selected = option.identifier === selectedPlan;
          const labelKey = planLabelKeys[option.packageType];
          const period = formatPeriod(option.period, language);
          const price = period ? t('upgrade.billingPrice', { price: option.priceString, period }) : option.priceString;
          return (
            <Pressable
              key={option.identifier}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: working || activationPending }}
              disabled={working || activationPending}
              onPress={() => setSelectedPlan(option.identifier)}
              style={[
                styles.planOption,
                {
                  borderColor: selected ? theme.colors.accent : theme.colors.border,
                  backgroundColor: selected ? theme.colors.accentSoft : theme.colors.surface,
                },
              ]}
            >
              <View style={styles.planOptionText}>
                <Text variant="body">{labelKey ? t(labelKey) : option.title}</Text>
                {option.introOffers.map((offer, index) => {
                  const offerPeriod = formatPeriod(offer.period, language, offer.free ? offer.cycles : 1);
                  if (!offerPeriod) return null;
                  const offerKey = offer.cycles > 1 ? 'upgrade.introCycles' : 'upgrade.introPrice';
                  return (
                    <Text key={index} variant="caption" style={{ color: theme.colors.textSecondary }}>
                      {offer.free ? t('upgrade.freeTrial', { period: offerPeriod }) : t(offerKey, {
                        price: offer.priceString, period: offerPeriod, cycles: offer.cycles,
                      })}
                    </Text>
                  );
                })}
              </View>
              <Text variant="body">{price}</Text>
            </Pressable>
          );
        })}

        <Divider />
        <View style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: theme.colors.accentSoft }]}>
            <Ionicons name="sparkles-outline" size={18} color={theme.colors.accent} />
          </View>
          <View style={styles.featureText}>
            <Text variant="body">{t('upgrade.feature.ask.title')}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t('upgrade.feature.ask.body')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.freeBlock, { borderColor: theme.colors.rule }]}>
        <EditorialLabel>{t('upgrade.alwaysFree')}</EditorialLabel>
        <View style={styles.freeGrid}>
          {freeStaysFree.map((item) => (
            <View key={item} style={styles.freeItem}>
              <Ionicons name="checkmark-circle-outline" size={17} color={theme.colors.success} />
              <Text variant="bodySmall" style={{ color: theme.colors.textSecondary }}>{t(item)}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {activationPending ? <Text variant="bodySmall">{t('upgrade.activationPending')}</Text> : null}
        {working ? <ActivityIndicator color={theme.colors.accent} accessibilityLabel={t('upgrade.checkingAccess')} /> : null}
        {plan || activationPending ? (
          <Button
            title={t(activationPending ? 'upgrade.checkAccess' : showsTrial ? 'upgrade.startTrial' : 'upgrade.start')}
            onPress={handlePurchase}
            disabled={working || loadingPlans}
          />
        ) : null}
        {purchasesAvailable && !loadingPlans && !plans.length ? (
          <Button title={t('ask.tryAgain')} variant="secondary" onPress={() => {
            setLoadingPlans(true);
            setPlanLoadAttempt((attempt) => attempt + 1);
          }} disabled={working} />
        ) : null}
        {purchasesAvailable ? <Button title={t('upgrade.restore')} variant="secondary" onPress={handleRestore} disabled={working} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingBottom: 92,
  },
  closeButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    gap: 10,
  },
  planBlock: {
    gap: 14,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  plansLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  planOptionText: {
    flex: 1,
    gap: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 3,
  },
  freeBlock: {
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  freeGrid: {
    gap: 10,
  },
  freeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actions: {
    gap: 10,
  },
});
