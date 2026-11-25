import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = 'faithandme.askScripture.questionConsent.v1';

export async function hasAskQuestionConsent() {
  return (await AsyncStorage.getItem(storageKey)) === 'granted';
}

export function setAskQuestionConsent(allowed: boolean) {
  return allowed ? AsyncStorage.setItem(storageKey, 'granted') : AsyncStorage.removeItem(storageKey);
}
