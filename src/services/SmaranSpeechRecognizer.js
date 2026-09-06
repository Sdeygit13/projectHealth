import {
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const {SmaranSpeechRecognizer} = NativeModules;
const emitter = SmaranSpeechRecognizer
  ? new NativeEventEmitter(SmaranSpeechRecognizer)
  : null;

const requestMicrophonePermission = async () => {
  if (Platform.OS !== 'android') return true;

  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (await PermissionsAndroid.check(permission)) return true;

  const result = await PermissionsAndroid.request(permission, {
    title: 'Smaran Microphone Permission',
    message: 'Smaran needs microphone access so you can talk to your AI Reminder assistant.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

const startListening = async (language = 'en-IN') => {
  if (!SmaranSpeechRecognizer) {
    throw new Error('SmaranSpeechRecognizer native module is unavailable. Rebuild the Android app.');
  }

  const permitted = await requestMicrophonePermission();
  if (!permitted) throw new Error('Microphone permission was not granted.');

  SmaranSpeechRecognizer.startListening(language);
};

const stopListening = () => SmaranSpeechRecognizer?.stopListening();
const cancelListening = () => SmaranSpeechRecognizer?.cancelListening();

const addListener = (eventName, callback) => {
  if (!emitter) return {remove: () => {}};
  return emitter.addListener(eventName, callback);
};

export default {
  requestMicrophonePermission,
  startListening,
  stopListening,
  cancelListening,
  addListener,
};
