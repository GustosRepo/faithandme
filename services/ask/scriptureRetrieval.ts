import { scriptureService } from '@/services/scripture/ScriptureService';
import type { ScripturePassage } from '@/services/scripture/types';

type Topic = {
  aliases: string[];
  references: string[];
};

const topicMap: Record<string, Topic> = {
  anxiety: {
    aliases: ['anxious', 'anxiety', 'worry', 'worried', 'control', 'panic', 'afraid'],
    references: ['PHP.4.6-7', 'MAT.6.25-34', '1PE.5.7', 'JHN.14.27'],
  },
  fear: {
    aliases: ['fear', 'afraid', 'scared', 'terrified', 'unsafe'],
    references: ['JOS.1.9', 'ISA.41.10', 'PSA.56.3-4'],
  },
  anger: {
    aliases: ['anger', 'angry', 'mad', 'rage', 'temper', 'arguing', 'argument', 'control my anger', 'frustrated'],
    references: ['JAS.1.19-20', 'EPH.4.26-27', 'PRO.15.1', 'PRO.29.11'],
  },
  forgiveness: {
    aliases: ['forgive', 'forgiveness', 'resentment', 'bitter', 'bitterness', 'let it go'],
    references: ['EPH.4.32', 'COL.3.13', 'MAT.6.14-15'],
  },
  marriage: {
    aliases: ['wife', 'husband', 'spouse', 'marriage', 'married'],
    references: ['EPH.5.25', '1PE.3.7', 'COL.3.19', 'GEN.2.24'],
  },
  relationships: {
    aliases: ['relationship', 'relationships', 'friend', 'family', 'conflict', 'people', 'someone'],
    references: ['ROM.12.18', 'COL.3.12-14', 'PRO.17.17', 'EPH.4.2-3'],
  },
  love: {
    aliases: ['love', 'loving', 'patience', 'kindness', 'compassion'],
    references: ['1CO.13.4-7', 'JHN.13.34-35', '1JN.4.7-8'],
  },
  grief: {
    aliases: ['grief', 'grieving', 'loss', 'lost someone', 'death', 'mourning'],
    references: ['MAT.5.4', 'PSA.34.18', 'REV.21.4'],
  },
  loneliness: {
    aliases: ['lonely', 'alone', 'isolated', 'forgotten'],
    references: ['PSA.23.4', 'HEB.13.5', 'PSA.68.6'],
  },
  purpose: {
    aliases: ['purpose', 'calling', 'direction', 'meaning', 'future', 'life direction'],
    references: ['PRO.3.5-6', 'EPH.2.10', 'MIC.6.8', 'JAS.1.5'],
  },
  money: {
    aliases: ['money', 'financial', 'finances', 'debt', 'bills', 'rich', 'poor'],
    references: ['MAT.6.19-21', '1TI.6.6-10', 'PRO.3.9-10', 'PHP.4.11-13'],
  },
  work: {
    aliases: ['work', 'job', 'career', 'boss', 'coworker', 'labor'],
    references: ['COL.3.23-24', 'PRO.16.3', 'ECC.3.13'],
  },
  temptation: {
    aliases: ['tempted', 'temptation', 'sin', 'habit', 'addiction', 'struggling with sin'],
    references: ['1CO.10.13', 'JAS.1.12-15', 'HEB.4.15-16'],
  },
  discipline: {
    aliases: ['discipline', 'self-control', 'lazy', 'staying consistent', 'motivation'],
    references: ['GAL.5.22-23', 'PRO.25.28', 'HEB.12.11', '1CO.9.24-27'],
  },
  faith: {
    aliases: ['faith', 'trust', 'believe', 'belief', 'uncertain'],
    references: ['HEB.11.1', 'ROM.10.17', '2CO.5.7'],
  },
  doubt: {
    aliases: ['doubt', 'doubting', 'questions', 'questioning', 'unbelief'],
    references: ['MRK.9.24', 'JAS.1.5-6', 'JHN.20.27-29'],
  },
  hope: {
    aliases: ['hope', 'hopeless', 'discouraged', 'despair', 'tired'],
    references: ['ROM.15.13', 'LAM.3.22-24', 'ISA.40.31'],
  },
  peace: {
    aliases: ['peace', 'calm', 'rest', 'overwhelmed', 'stress', 'stressed'],
    references: ['JHN.14.27', 'PHP.4.6-7', 'MAT.11.28-30'],
  },
  guidance: {
    aliases: ['guidance', 'wisdom', 'decision', 'decide', 'choice', 'path'],
    references: ['PRO.3.5-6', 'JAS.1.5', 'PSA.119.105'],
  },
  parenting: {
    aliases: ['parent', 'parenting', 'child', 'children', 'kids', 'son', 'daughter'],
    references: ['EPH.6.4', 'PRO.22.6', 'DEU.6.6-7'],
  },
  strength: {
    aliases: ['strength', 'weak', 'tired', 'endure', 'endurance', 'weary'],
    references: ['ISA.40.31', '2CO.12.9-10', 'PHP.4.13'],
  },
};

const fallbackReferences = ['PRO.3.5-6', 'JAS.1.5', 'JHN.14.27', 'ROM.15.13'];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreTopic(question: string, topic: Topic) {
  return topic.aliases.reduce((score, alias) => {
    const normalizedAlias = normalize(alias);
    if (!normalizedAlias) return score;

    if (question.includes(normalizedAlias)) return score + (normalizedAlias.includes(' ') ? 4 : 2);
    return score;
  }, 0);
}

function resolveReferences(references: string[]) {
  const seen = new Set<string>();
  const passages: ScripturePassage[] = [];

  for (const reference of references) {
    if (seen.has(reference)) continue;
    const passage = scriptureService.getPassage(reference);
    if (!passage) continue;
    seen.add(reference);
    passages.push(passage);
  }

  return passages;
}

export function retrieveRelevantScripture(question: string, maxPassages = 5): ScripturePassage[] {
  const normalizedQuestion = normalize(question);
  const rankedTopics = Object.entries(topicMap)
    .map(([name, topic]) => ({ name, topic, score: scoreTopic(normalizedQuestion, topic) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const references = rankedTopics.length
    ? rankedTopics.flatMap((entry) => entry.topic.references)
    : fallbackReferences;

  const resolved = resolveReferences(references);
  return resolved.slice(0, maxPassages);
}

export function getAskTopicLabels() {
  return ['Anxiety', 'Forgiveness', 'Relationships', 'Purpose', 'Money', 'Faith'];
}
