import type { DailySession } from '@/types/dailySession';

export const dailySessions: DailySession[] = [
  {
    id: 'peace',
    theme: 'Peace',
    title: 'A quiet heart',
    scriptureReference: 'JHN.14.27',
    reflection:
      'When life feels noisy, peace is not the absence of difficulty. It is the ability to be still long enough to remember that your mind does not have to carry every worry at once. The invitation is not to be perfect; it is to be present with God and let your breath slow down enough to hear what is true.',
    reflectionQuestions: [
      'What is one worry that feels heavier than it needs to be right now?',
      'Where can you let the pace slow down for even a few minutes today?',
    ],
    prayer:
      'Lord, quiet the noise in me and steady my heart. Help me to release what I cannot carry and to rest in the peace that is yours, not the world’s.',
    action: 'Choose one worry you can name plainly, then take one small step to calm the rhythm of your day: breathe deeply, postpone a decision, or step away for ten quiet minutes.',
    tags: ['peace', 'rest', 'anxiety'],
  },
  {
    id: 'hope',
    theme: 'Hope',
    title: 'The next step',
    scriptureReference: 'ROM.15.13',
    reflection:
      'Hope is not pretending the hard thing is gone. It is a steady light that says the present moment is not the whole story. When you are tired or discouraged, hope reminds you that God is still at work, and your next faithful step matters more than the whole future at once.',
    reflectionQuestions: [
      'What part of today feels heavy enough that you need hope, not pressure?',
      'What is one small sign that God is already moving in your life?',
    ],
    prayer:
      'God, when my thoughts drift toward what is missing, remind me that you are still working in the middle of this. Fill me with hope that is gentle, steady, and real.',
    action: 'Write down one thing you can trust is true about this day, even if it is small, and let that truth shape the next step you take.',
    tags: ['hope', 'encouragement', 'low'],
  },
  {
    id: 'strength',
    theme: 'Strength',
    title: 'Steady endurance',
    scriptureReference: 'ISA.40.31',
    reflection:
      'Strength often looks less like dramatic change and more like steady faithfulness. You do not have to fix everything at once. You only need to keep taking the next faithful breath, the next honest step, and the next act of trust.',
    reflectionQuestions: [
      'Where are you tired enough that you need grace instead of pressure?',
      'What is one act of endurance you can practice today without pushing beyond your limits?',
    ],
    prayer:
      'Lord, give me strength for what is before me today. Help me keep walking in grace rather than striving in fear.',
    action: 'Pick the single task or situation that asks the most of you today, and do the smallest faithful action in it instead of trying to solve everything at once.',
    tags: ['strength', 'discipline', 'endurance'],
  },
  {
    id: 'guidance',
    theme: 'Guidance',
    title: 'A clear next step',
    scriptureReference: 'PRO.3.5-6',
    reflection:
      'Guidance is often not a huge revelation but a gentle clarity for the step immediately in front of you. You do not need a perfect map for all of life. You need to trust God with what is in front of you, and then take the next faithful move.',
    reflectionQuestions: [
      'What decision feels foggy enough that you need wisdom instead of certainty?',
      'What is the next right step, even if it is small?',
    ],
    prayer:
      'God, show me the next step, not the whole future. Give me wisdom to move in humility and courage for what is in front of me today.',
    action: 'Name the decision or task you are avoiding, then choose the smallest practical step that moves you toward clarity, even if it is imperfect.',
    tags: ['guidance', 'wisdom', 'direction'],
  },
  {
    id: 'forgiveness',
    theme: 'Forgiveness',
    title: 'A lighter burden',
    scriptureReference: 'EPH.4.32',
    reflection:
      'Forgiveness does not erase what happened. It does not require pretending the hurt was harmless. It is a way of refusing to let bitterness become your permanent home. You can release resentment without denying the reality of the wound.',
    reflectionQuestions: [
      'Where is resentment asking to stay longer than it should?',
      'What would it look like to release one heavy feeling without pretending it did not matter?',
    ],
    prayer:
      'Lord, help me release the weight of hurt and resentment. Give me grace to be honest about what I feel and gentle enough to carry less bitterness today.',
    action: 'Write one sentence that names what you need to let go of, and then make one practical choice that reduces the hold it has on your heart today.',
    tags: ['forgiveness', 'healing', 'relationships'],
  },
  {
    id: 'love',
    theme: 'Love',
    title: 'A patient heart',
    scriptureReference: '1CO.13.4-7',
    reflection:
      'Love is not only a feeling. It is what you do when you are tired, when you are disappointed, or when you have little left to give. A patient heart makes room for other people without losing itself in the process.',
    reflectionQuestions: [
      'Where has impatience been louder than compassion lately?',
      'How can you show love in a way that is gentle and realistic today?',
    ],
    prayer:
      'God, teach me to love with patience, gentleness, and humility. Help me see the people around me with more grace and less strain.',
    action: 'Offer one small act of patience or kindness to someone in your sphere today, and do it without expecting anything in return.',
    tags: ['love', 'relationships', 'kindness'],
  },
  {
    id: 'courage',
    theme: 'Courage',
    title: 'A braver step',
    scriptureReference: 'JOS.1.9',
    reflection:
      'Courage does not always feel loud. Sometimes it is the quiet decision to move forward when fear is still present. One brave step is enough for today, and it may be far more useful than a perfect plan.',
    reflectionQuestions: [
      'What are you avoiding because it feels bigger than your courage right now?',
      'What would a small, honest brave step look like today?',
    ],
    prayer:
      'Lord, give me courage for what I cannot control and wisdom for what I can change. Help me act with faith, even when fear is still present.',
    action: 'Name one action you have been postponing and take the smallest useful step toward it before the day gets busier.',
    tags: ['courage', 'fear', 'action'],
  },
  {
    id: 'faith',
    theme: 'Faith',
    title: 'Trust in the middle',
    scriptureReference: 'HEB.11.1',
    reflection:
      'Faith is not the absence of uncertainty. It is the willingness to keep trusting God in the middle of not yet seeing the whole picture. Sometimes faith is simply choosing to believe that God is still present, even when the next step is not fully clear.',
    reflectionQuestions: [
      'What part of your life feels uncertain enough that you need trust more than certainty?',
      'What would it look like to take one step of faith without needing every answer?',
    ],
    prayer:
      'Lord, when I cannot see the whole path, help me trust your presence and your goodness. Strengthen my faith to keep moving with humility and hope.',
    action: 'Choose the next step that requires trust rather than control, and take it with a simple, prayerful intention.',
    tags: ['faith', 'trust', 'uncertainty'],
  },
];

export function getDailySessionById(sessionId: string) {
  return dailySessions.find((session) => session.id === sessionId) ?? dailySessions[0];
}
