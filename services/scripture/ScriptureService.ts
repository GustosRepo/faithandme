import type { AppLanguage } from '@/context/LanguageContext';
import bsbData from '@/data/bsb.json';
import rv1909Data from '@/data/rv1909.json';
import { LocalBibleProvider } from '@/services/scripture/LocalBibleProvider';
import type { ScriptureDataset } from '@/services/scripture/LocalBibleProvider';

const scriptureServices = {
  en: new LocalBibleProvider(bsbData as ScriptureDataset),
  es: new LocalBibleProvider(rv1909Data as ScriptureDataset),
} satisfies Record<AppLanguage, LocalBibleProvider>;

export function getScriptureService(language: AppLanguage = 'en') {
  return scriptureServices[language] ?? scriptureServices.en;
}

export const scriptureService = getScriptureService('en');
