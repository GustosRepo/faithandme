import type { AppLanguage } from '@/context/LanguageContext';
import { getScriptureService } from '@/services/scripture/ScriptureService';
import type { ScripturePassage } from '@/services/scripture/types';

type Topic = {
  aliases: string[];
  references: string[];
};

const topicMap: Record<string, Topic> = {
  anxiety: {
    aliases: [
      'anxious',
      'anxiety',
      'worry',
      'worried',
      'control',
      'panic',
      'afraid',
      'ansiedad',
      'ansioso',
      'ansiosa',
      'preocupacion',
      'preocupado',
      'preocupada',
      'panico',
      'miedo',
      'no puedo controlar',
    ],
    references: ['PHP.4.6-7', 'MAT.6.25-34', '1PE.5.7', 'JHN.14.27', 'PSA.55.22', 'ISA.26.3', 'PSA.94.19', 'LUK.12.25-26', '2TI.1.7'],
  },
  fear: {
    aliases: ['fear', 'afraid', 'scared', 'terrified', 'unsafe', 'miedo', 'temor', 'asustado', 'asustada', 'aterrado', 'inseguro', 'insegura'],
    references: ['JOS.1.9', 'ISA.41.10', 'PSA.56.3-4', 'PSA.27.1', 'DEU.31.6', 'PSA.34.4', '1JN.4.18', 'PSA.91.1-2'],
  },
  anger: {
    aliases: [
      'anger',
      'angry',
      'mad',
      'rage',
      'temper',
      'arguing',
      'argument',
      'control my anger',
      'frustrated',
      'enojo',
      'enojado',
      'enojada',
      'ira',
      'rabia',
      'coraje',
      'discusion',
      'discutir',
      'frustrado',
      'frustrada',
    ],
    references: ['JAS.1.19-20', 'EPH.4.26-27', 'PRO.15.1', 'PRO.29.11', 'PSA.37.8', 'COL.3.8', 'ECC.7.9', 'PRO.14.29'],
  },
  forgiveness: {
    aliases: ['forgive', 'forgiveness', 'resentment', 'bitter', 'bitterness', 'let it go', 'perdon', 'perdonar', 'resentimiento', 'amargura', 'soltar', 'dejar ir'],
    references: ['EPH.4.32', 'COL.3.13', 'MAT.6.14-15', 'LUK.6.37', 'MRK.11.25', 'PSA.103.10-12', '1JN.1.9'],
  },
  marriage: {
    aliases: ['wife', 'husband', 'spouse', 'marriage', 'married', 'esposa', 'esposo', 'matrimonio', 'casado', 'casada', 'pareja'],
    references: ['EPH.5.25', '1PE.3.7', 'COL.3.19', 'GEN.2.24', 'ECC.4.9-12', '1CO.13.4-7', 'EPH.5.33'],
  },
  relationships: {
    aliases: ['relationship', 'relationships', 'friend', 'family', 'conflict', 'people', 'someone', 'relacion', 'relaciones', 'amigo', 'amiga', 'familia', 'conflicto', 'persona', 'alguien'],
    references: ['ROM.12.18', 'COL.3.12-14', 'PRO.17.17', 'EPH.4.2-3', '1TH.5.11', 'PRO.27.17', 'GAL.6.2', '1PE.4.8'],
  },
  love: {
    aliases: ['love', 'loving', 'patience', 'kindness', 'compassion', 'amor', 'amar', 'paciencia', 'bondad', 'compasion'],
    references: ['1CO.13.4-7', 'JHN.13.34-35', '1JN.4.7-8', 'ROM.12.9-10', '1PE.4.8', 'GAL.5.13', 'EPH.4.2'],
  },
  grief: {
    aliases: ['grief', 'grieving', 'loss', 'lost someone', 'death', 'mourning', 'duelo', 'perdida', 'perdi a alguien', 'muerte', 'luto'],
    references: ['MAT.5.4', 'PSA.34.18', 'REV.21.4', 'PSA.147.3', 'JHN.11.25-26', '2CO.1.3-4', '1TH.4.13-14'],
  },
  loneliness: {
    aliases: ['lonely', 'alone', 'isolated', 'forgotten', 'solo', 'sola', 'soledad', 'aislado', 'aislada', 'olvidado', 'olvidada'],
    references: ['PSA.23.4', 'HEB.13.5', 'PSA.68.6', 'ISA.41.10', 'MAT.28.20', 'PSA.139.7-10', 'ROM.8.38-39'],
  },
  purpose: {
    aliases: ['purpose', 'calling', 'direction', 'meaning', 'future', 'life direction', 'proposito', 'llamado', 'direccion', 'sentido', 'futuro', 'direccion de vida'],
    references: ['PRO.3.5-6', 'EPH.2.10', 'MIC.6.8', 'JAS.1.5', 'JER.29.11', 'ROM.8.28', 'PSA.138.8', 'COL.3.23-24'],
  },
  money: {
    aliases: ['money', 'financial', 'finances', 'debt', 'bills', 'rich', 'poor', 'dinero', 'finanzas', 'deuda', 'deudas', 'cuentas', 'rico', 'pobre', 'economico', 'economica'],
    references: ['MAT.6.19-21', '1TI.6.6-10', 'PRO.3.9-10', 'PHP.4.11-13', 'HEB.13.5', 'LUK.12.15', 'PRO.22.7', '2CO.9.6-8'],
  },
  work: {
    aliases: ['work', 'job', 'career', 'boss', 'coworker', 'labor', 'trabajo', 'empleo', 'carrera', 'jefe', 'compañero', 'companero', 'labor'],
    references: ['COL.3.23-24', 'PRO.16.3', 'ECC.3.13', 'GEN.2.15', 'PRO.14.23', '1CO.15.58', 'EPH.6.7-8'],
  },
  temptation: {
    aliases: ['tempted', 'temptation', 'sin', 'habit', 'addiction', 'struggling with sin', 'tentado', 'tentada', 'tentacion', 'pecado', 'habito', 'adiccion', 'luchando con pecado'],
    references: ['1CO.10.13', 'JAS.1.12-15', 'HEB.4.15-16', 'MAT.26.41', 'GAL.5.16', 'PSA.119.11', 'ROM.6.14'],
  },
  discipline: {
    aliases: ['discipline', 'self-control', 'lazy', 'staying consistent', 'motivation', 'disciplina', 'dominio propio', 'pereza', 'flojo', 'floja', 'constante', 'motivacion'],
    references: ['GAL.5.22-23', 'PRO.25.28', 'HEB.12.11', '1CO.9.24-27', 'PRO.13.4', '2TI.1.7', 'ROM.12.11-12'],
  },
  faith: {
    aliases: ['faith', 'trust', 'believe', 'belief', 'uncertain', 'fe', 'confiar', 'confianza', 'creer', 'creencia', 'incierto', 'incierta'],
    references: ['HEB.11.1', 'ROM.10.17', '2CO.5.7', 'MAT.17.20', 'MRK.11.22-24', 'JAS.2.17', 'PRO.3.5-6'],
  },
  doubt: {
    aliases: ['doubt', 'doubting', 'questions', 'questioning', 'unbelief', 'duda', 'dudas', 'dudando', 'preguntas', 'cuestionando', 'incredulidad'],
    references: ['MRK.9.24', 'JAS.1.5-6', 'JHN.20.27-29', 'MAT.14.31', 'ISA.55.8-9', 'HEB.11.6'],
  },
  hope: {
    aliases: ['hope', 'hopeless', 'discouraged', 'despair', 'tired', 'esperanza', 'sin esperanza', 'desanimado', 'desanimada', 'desesperacion', 'cansado', 'cansada'],
    references: ['ROM.15.13', 'LAM.3.22-24', 'ISA.40.31', 'PSA.42.11', 'JER.29.11', 'ROM.5.3-5', 'HEB.6.19'],
  },
  peace: {
    aliases: ['peace', 'calm', 'rest', 'overwhelmed', 'stress', 'stressed', 'paz', 'calma', 'descanso', 'abrumado', 'abrumada', 'estres', 'estresado', 'estresada'],
    references: ['JHN.14.27', 'PHP.4.6-7', 'MAT.11.28-30', 'ISA.26.3', 'PSA.4.8', 'COL.3.15', 'ROM.15.13'],
  },
  guidance: {
    aliases: ['guidance', 'wisdom', 'decision', 'decide', 'choice', 'path', 'guia', 'sabiduria', 'decision', 'decidir', 'eleccion', 'camino', 'direccion'],
    references: ['PRO.3.5-6', 'JAS.1.5', 'PSA.119.105', 'PSA.32.8', 'ISA.30.21', 'PRO.16.9', 'PSA.25.4-5'],
  },
  parenting: {
    aliases: ['parent', 'parenting', 'child', 'children', 'kids', 'son', 'daughter', 'padre', 'madre', 'crianza', 'hijo', 'hija', 'hijos', 'niños', 'ninos'],
    references: ['EPH.6.4', 'PRO.22.6', 'DEU.6.6-7', 'PSA.127.3', 'PRO.29.17', 'ISA.54.13', '3JN.1.4'],
  },
  strength: {
    aliases: ['strength', 'weak', 'tired', 'endure', 'endurance', 'weary', 'fortaleza', 'fuerza', 'debil', 'cansado', 'cansada', 'perseverar', 'resistir', 'agotado', 'agotada'],
    references: ['ISA.40.31', '2CO.12.9-10', 'PHP.4.13', 'PSA.46.1', 'NEH.8.10', 'EPH.6.10', 'PSA.28.7'],
  },
};

const fallbackReferences = ['PRO.3.5-6', 'JAS.1.5', 'JHN.14.27', 'ROM.15.13', 'PSA.46.1', 'ISA.40.31', 'MAT.11.28-30', 'PSA.121.1-2', 'ROM.8.28'];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreTopic(question: string, topic: Topic) {
  return topic.aliases.reduce((score, alias) => {
    const normalizedAlias = normalize(alias);
    if (!normalizedAlias) return score;

    if (question.includes(normalizedAlias)) return score + (normalizedAlias.includes(' ') ? 4 : 2);
    return score;
  }, 0);
}

function resolveReferences(references: string[], language: AppLanguage) {
  const seen = new Set<string>();
  const passages: ScripturePassage[] = [];
  const scriptureService = getScriptureService(language);

  for (const reference of references) {
    if (seen.has(reference)) continue;
    const passage = scriptureService.getPassage(reference);
    if (!passage) continue;
    seen.add(reference);
    passages.push(passage);
  }

  return passages;
}

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

/** Round-robin across ranked topics so multi-topic questions mix candidate passages. */
function interleave(referenceLists: string[][]): string[] {
  const result: string[] = [];
  const longest = Math.max(0, ...referenceLists.map((list) => list.length));
  for (let index = 0; index < longest; index += 1) {
    for (const list of referenceLists) {
      const reference = list[index];
      if (reference && !result.includes(reference)) result.push(reference);
    }
  }
  return result;
}

export type RetrievalOptions = {
  /** References cited in recent answers, deprioritized so answers stay fresh. */
  excludeReferences?: string[];
  /** Soft budget for the combined passage text sent as model context. */
  maxTotalTextLength?: number;
};

export function retrieveRelevantScripture(
  question: string,
  maxPassages = 5,
  language: AppLanguage = 'en',
  options: RetrievalOptions = {},
): ScripturePassage[] {
  const normalizedQuestion = normalize(question);
  const rankedTopics = Object.entries(topicMap)
    .map(([name, topic]) => ({ name, topic, score: scoreTopic(normalizedQuestion, topic) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  // Shuffle within each topic so repeat questions surface different candidate passages;
  // the model picks the best fits from whatever candidates it receives.
  const references = rankedTopics.length
    ? interleave(rankedTopics.map((entry) => shuffled(entry.topic.references)))
    : shuffled(fallbackReferences);

  const excluded = new Set((options.excludeReferences ?? []).map((reference) => reference.toUpperCase()));
  const fresh = references.filter((reference) => !excluded.has(reference.toUpperCase()));
  const recentlySeen = references.filter((reference) => excluded.has(reference.toUpperCase()));

  const maxTotalTextLength = options.maxTotalTextLength ?? Number.POSITIVE_INFINITY;
  const selected: ScripturePassage[] = [];
  let totalTextLength = 0;
  for (const passage of resolveReferences([...fresh, ...recentlySeen], language)) {
    if (selected.length >= maxPassages) break;
    if (selected.length > 0 && totalTextLength + passage.text.length > maxTotalTextLength) continue;
    selected.push(passage);
    totalTextLength += passage.text.length;
  }

  return selected;
}

export function getAskTopicLabels() {
  return ['Anxiety', 'Forgiveness', 'Relationships', 'Purpose', 'Money', 'Faith'];
}
