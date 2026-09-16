export type SafetyLevel = 'standard' | 'immediate-danger';

const immediateDangerPatterns = [
  /\b(kill myself|end my life|suicide|suicidal|self[- ]?harm|hurt myself)\b/i,
  /\b(about to hurt|going to hurt|want to hurt)\b/i,
  /\b(being abused|abuse me|domestic violence|not safe at home)\b/i,
  /\b(he has a weapon|she has a weapon|they have a weapon|gun|knife)\b/i,
  /\b(overdose|took too many pills|can't stay safe)\b/i,
];

export function classifySafety(question: string): SafetyLevel {
  return immediateDangerPatterns.some((pattern) => pattern.test(question)) ? 'immediate-danger' : 'standard';
}

export function safetyInstructionFor(level: SafetyLevel) {
  if (level !== 'immediate-danger') return '';

  return [
    'The user may be describing immediate danger, self-harm, abuse, or violence.',
    'Prioritize immediate real-world safety and professional/emergency help in safetyNote.',
    'Do not present Scripture as a replacement for emergency, medical, legal, or mental-health support.',
    'Keep spiritual support gentle and avoid shame.',
  ].join(' ');
}
