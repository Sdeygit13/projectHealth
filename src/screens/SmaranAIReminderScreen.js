import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from 'react-native';

import Tts from 'react-native-tts';

import Icon from '../components/Icon';

import { COLORS, SHADOW } from '../theme';

import SmaranSpeechRecognizer from '../services/SmaranSpeechRecognizer';
import { answerReminderQuestion } from '../services/reminderEngine';

const HOME_BACKGROUND = '#FEF7E8';

const LANGUAGES = [
  {
    key: 'en',
    label: 'English',
    locale: 'en-IN',
    short: 'EN',
  },
  {
    key: 'bn',
    label: 'বাংলা',
    locale: 'bn-IN',
    short: 'BN',
  },
  {
    key: 'hi',
    label: 'हिन्दी',
    locale: 'hi-IN',
    short: 'HI',
  },
  {
    key: 'as',
    label: 'অসমীয়া',
    locale: 'as-IN',
    short: 'AS',
  },
];

const getLanguage = key =>
  LANGUAGES.find(item => item.key === key) || LANGUAGES[0];

const normalize = value =>
  String(value || '')
    .trim()
    .toLowerCase();

const getReminderTime = reminder =>
  reminder?.time ||
  reminder?.startTime ||
  reminder?.scheduledTime ||
  reminder?.dateTime ||
  '';

const getReminderTitle = reminder =>
  reminder?.title ||
  reminder?.name ||
  reminder?.task ||
  reminder?.label ||
  'Reminder';

const getReminderDetail = reminder =>
  reminder?.detail ||
  reminder?.description ||
  reminder?.notes ||
  '';

const getReminderDone = reminder =>
  Boolean(reminder?.done || reminder?.completed);

const sortReminders = reminders => {
  return [...reminders].sort((a, b) => {
    const aTime = String(getReminderTime(a));
    const bTime = String(getReminderTime(b));

    return aTime.localeCompare(bTime);
  });
};

const getNextReminder = reminders => {
  const pending = reminders.filter(item => !getReminderDone(item));

  return sortReminders(pending)[0] || null;
};

const answerQuestion = (question, reminders, languageKey) =>
  answerReminderQuestion(question, reminders, languageKey).text;

const SmaranAIReminderScreen = ({
  patientName,
  name,
  reminders = [],
  onNavigate,
}) => {
  const displayName = patientName || name || 'Friend';

  const [languageKey, setLanguageKey] = useState('en');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [volume, setVolume] = useState(0);
  const [speechError, setSpeechError] = useState('');

  const subscriptions = useRef([]);

  const language = useMemo(
    () => getLanguage(languageKey),
    [languageKey]
  );

  useEffect(() => {
    Tts.setDefaultRate(0.48);
    Tts.setDefaultPitch(1.0);

    const speechEvents = [
      ['SmaranSpeechReady', () => {
        setListening(true);
        setSpeechError('');
      }],

      ['SmaranSpeechBeginning', () => {
        setListening(true);
        setSpeechError('');
      }],

      ['SmaranSpeechPartial', event => {
        if (event?.text) {
          setTranscript(event.text);
        }
      }],

      ['SmaranSpeechVolume', value => {
        setVolume(Number(value) || 0);
      }],

      ['SmaranSpeechEnd', () => {
        setListening(false);
        setVolume(0);
      }],

      ['SmaranSpeechResult', event => {
        const spokenText = event?.text?.trim();

        setListening(false);
        setVolume(0);

        if (!spokenText) {
          return;
        }

        setTranscript(spokenText);

        const answer = answerQuestion(
          spokenText,
          reminders,
          languageKey
        );

        setResponse(answer);
        speak(answer, languageKey);
      }],

      ['SmaranSpeechError', event => {
        setListening(false);
        setVolume(0);

        const message =
          typeof event === 'string'
            ? event
            : event?.message || 'Speech recognition failed.';

        setSpeechError(message);
      }],
    ];

    speechEvents.forEach(([eventName, callback]) => {
      const subscription =
        SmaranSpeechRecognizer.addListener(
          eventName,
          callback
        );

      subscriptions.current.push(subscription);
    });

    return () => {
      subscriptions.current.forEach(subscription => {
        subscription?.remove?.();
      });

      subscriptions.current = [];

      SmaranSpeechRecognizer.cancelListening();

      Tts.stop();
    };
  }, [languageKey, reminders]);

  const speak = (text, key = languageKey) => {
    if (!text) {
      return;
    }

    Tts.stop();

    const selected = getLanguage(key);

    Tts.setDefaultLanguage(selected.locale)
      .catch(() => {
        Tts.setDefaultLanguage('en-IN').catch(() => {});
      })
      .finally(() => {
        Tts.speak(text);
      });
  };

  const handleTalk = async () => {
    setSpeechError('');

    if (listening) {
      SmaranSpeechRecognizer.stopListening();
      setListening(false);
      return;
    }

    setTranscript('');
    setResponse('');

    try {
      await SmaranSpeechRecognizer.startListening(
        language.locale
      );

      setListening(true);
    } catch (error) {
      setSpeechError(
        error?.message ||
          'Microphone permission is required.'
      );
    }
  };

  const handleLanguageChange = key => {
    if (listening) {
      SmaranSpeechRecognizer.cancelListening();
      setListening(false);
    }

    Tts.stop();

    setLanguageKey(key);
    setTranscript('');
    setResponse('');
    setSpeechError('');
  };

  const askQuickQuestion = question => {
    setTranscript(question);

    const answer = answerQuestion(
      question,
      reminders,
      languageKey
    );

    setResponse(answer);
    speak(answer, languageKey);
  };

  const pendingCount = reminders.filter(
    item => !getReminderDone(item)
  ).length;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={HOME_BACKGROUND}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => onNavigate?.('home')}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>SMARAN</Text>

            <Text style={styles.title}>
              AI Reminder
            </Text>

            <Text style={styles.subtitle}>
              Hello, {displayName}
            </Text>
          </View>
        </View>

        {/* LANGUAGE */}

        <View style={styles.languageCard}>
          <Text style={styles.sectionLabel}>
            Choose your language
          </Text>

          <View style={styles.languageRow}>
            {LANGUAGES.map(item => {
              const active = item.key === languageKey;

              return (
                <Pressable
                  key={item.key}
                  onPress={() =>
                    handleLanguageChange(item.key)
                  }
                  style={[
                    styles.languageButton,
                    active &&
                      styles.languageButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageShort,
                      active &&
                        styles.languageShortActive,
                    ]}
                  >
                    {item.short}
                  </Text>

                  <Text
                    style={[
                      styles.languageText,
                      active &&
                        styles.languageTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* INTRO */}

        <View style={styles.introCard}>
          <Text style={styles.introIcon}>🧠</Text>

          <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>
              Talk to Smaran
            </Text>

            <Text style={styles.introText}>
              Ask me about your reminders,
              medicine or today's plan.
            </Text>
          </View>
        </View>

        {/* MICROPHONE */}

        <View style={styles.talkSection}>
          <Text style={styles.talkHint}>
            {listening
              ? 'I am listening…'
              : 'Tap the microphone and speak'}
          </Text>

          <Pressable
            onPress={handleTalk}
            style={({ pressed }) => [
              styles.microphoneOuter,
              listening &&
                styles.microphoneOuterListening,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.microphoneInner,
                listening &&
                  styles.microphoneInnerListening,
              ]}
            >
              <Text style={styles.microphoneIcon}>
                🎙️
              </Text>
            </View>
          </Pressable>

          {listening && (
            <View style={styles.listeningIndicator}>
              <View
                style={[
                  styles.wave,
                  {
                    height: Math.max(
                      10,
                      Math.min(34, 10 + volume * 2)
                    ),
                  },
                ]}
              />

              <View
                style={[
                  styles.wave,
                  {
                    height: Math.max(
                      16,
                      Math.min(42, 16 + volume * 2.5)
                    ),
                  },
                ]}
              />

              <View
                style={[
                  styles.wave,
                  {
                    height: Math.max(
                      10,
                      Math.min(34, 10 + volume * 2)
                    ),
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* TRANSCRIPT */}

        {transcript ? (
          <View style={styles.transcriptCard}>
            <Text style={styles.cardLabel}>
              You said
            </Text>

            <Text style={styles.transcriptText}>
              “{transcript}”
            </Text>
          </View>
        ) : null}

        {/* ERROR */}

        {speechError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>

            <Text style={styles.errorText}>
              {speechError}
            </Text>
          </View>
        ) : null}

        {/* RESPONSE */}

        {response ? (
          <View style={styles.responseCard}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseIcon}>
                💚
              </Text>

              <Text style={styles.responseLabel}>
                Smaran says
              </Text>
            </View>

            <Text style={styles.responseText}>
              {response}
            </Text>

            <View style={styles.responseButtons}>
              <Pressable
                onPress={() =>
                  speak(response, languageKey)
                }
                style={styles.responseButton}
              >
                <Text style={styles.responseButtonText}>
                  🔊 Hear Again
                </Text>
              </Pressable>

              <Pressable
                onPress={() => Tts.stop()}
                style={styles.responseButton}
              >
                <Text style={styles.responseButtonText}>
                  Stop
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* QUICK QUESTIONS */}

        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>
            Try asking
          </Text>

          <Pressable
            onPress={() =>
              askQuickQuestion(
                languageKey === 'bn'
                  ? 'আজ আমার কী আছে?'
                  : languageKey === 'hi'
                  ? 'आज मेरा क्या है?'
                  : languageKey === 'as'
                  ? 'আজিৰ বাবে মোৰ কি আছে?'
                  : 'What do I have today?'
              )
            }
            style={styles.quickCard}
          >
            <Text style={styles.quickIcon}>📅</Text>

            <Text style={styles.quickText}>
              {languageKey === 'bn'
                ? 'আজ আমার কী আছে?'
                : languageKey === 'hi'
                ? 'आज मेरा क्या है?'
                : languageKey === 'as'
                ? 'আজিৰ বাবে মোৰ কি আছে?'
                : 'What do I have today?'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              askQuickQuestion(
                languageKey === 'bn'
                  ? 'আমার পরের রিমাইন্ডার কী?'
                  : languageKey === 'hi'
                  ? 'मेरा अगला रिमाइंडर क्या है?'
                  : languageKey === 'as'
                  ? 'মোৰ পৰৱৰ্তী ৰিমাইণ্ডাৰ কি?'
                  : 'What is my next reminder?'
              )
            }
            style={styles.quickCard}
          >
            <Text style={styles.quickIcon}>⏰</Text>

            <Text style={styles.quickText}>
              {languageKey === 'bn'
                ? 'আমার পরের রিমাইন্ডার কী?'
                : languageKey === 'hi'
                ? 'मेरा अगला रिमाइंडर क्या है?'
                : languageKey === 'as'
                ? 'মোৰ পৰৱৰ্তী ৰিমাইণ্ডাৰ কি?'
                : 'What is my next reminder?'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              askQuickQuestion(
                languageKey === 'bn'
                  ? 'আমার ওষুধের রিমাইন্ডার কী?'
                  : languageKey === 'hi'
                  ? 'मेरी दवा का रिमाइंडर क्या है?'
                  : languageKey === 'as'
                  ? 'মোৰ ঔষধৰ ৰিমাইণ্ডাৰ কি?'
                  : 'What is my medicine reminder?'
              )
            }
            style={styles.quickCard}
          >
            <Text style={styles.quickIcon}>💊</Text>

            <Text style={styles.quickText}>
              {languageKey === 'bn'
                ? 'আমার ওষুধের রিমাইন্ডার কী?'
                : languageKey === 'hi'
                ? 'मेरी दवा का रिमाइंडার क्या है?'
                : languageKey === 'as'
                ? 'মোৰ ঔষধৰ ৰিমাইণ্ডাৰ কি?'
                : 'What is my medicine reminder?'}
            </Text>
          </Pressable>
        </View>

        {/* REMINDER SUMMARY */}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Your reminders
          </Text>

          <Text style={styles.summaryNumber}>
            {pendingCount}
          </Text>

          <Text style={styles.summaryText}>
            pending reminder
            {pendingCount === 1 ? '' : 's'}
          </Text>
        </View>

        <Pressable
          onPress={() => onNavigate?.('home')}
          style={styles.homeButton}
        >
          <Text style={styles.homeButtonText}>
            ← Back to Home
          </Text>
        </Pressable>
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HOME_BACKGROUND,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    ...SHADOW,
  },

  backText: {
    fontSize: 38,
    lineHeight: 40,
    color: '#24352B',
    marginTop: -4,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#73936F',
    marginBottom: 2,
  },

  title: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
    color: '#26352A',
  },

  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#667368',
    marginTop: 2,
  },

  languageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    ...SHADOW,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#425348',
    marginBottom: 12,
  },

  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  languageButton: {
    minHeight: 50,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DCE5DA',
    backgroundColor: '#FAFCF8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  languageButtonActive: {
    backgroundColor: '#789F73',
    borderColor: '#789F73',
  },

  languageShort: {
    fontSize: 12,
    fontWeight: '900',
    color: '#6C7D70',
  },

  languageShortActive: {
    color: '#FFFFFF',
  },

  languageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4E5E53',
  },

  languageTextActive: {
    color: '#FFFFFF',
  },

  introCard: {
    backgroundColor: '#E9F2E5',
    borderRadius: 22,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  introIcon: {
    fontSize: 34,
    marginRight: 14,
  },

  introTextContainer: {
    flex: 1,
  },

  introTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#304631',
    marginBottom: 4,
  },

  introText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#607061',
    fontWeight: '600',
  },

  talkSection: {
    alignItems: 'center',
    marginBottom: 22,
  },

  talkHint: {
    fontSize: 17,
    fontWeight: '800',
    color: '#536357',
    marginBottom: 18,
  },

  microphoneOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: '#DCEBD7',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },

  microphoneOuterListening: {
    backgroundColor: '#C7DFC1',
  },

  microphoneInner: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#789F73',
    alignItems: 'center',
    justifyContent: 'center',
  },

  microphoneInnerListening: {
    transform: [{ scale: 1.04 }],
  },

  microphoneIcon: {
    fontSize: 55,
  },

  listeningIndicator: {
    height: 48,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  wave: {
    width: 7,
    borderRadius: 4,
    backgroundColor: '#789F73',
  },

  pressed: {
    opacity: 0.8,
  },

  transcriptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    ...SHADOW,
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#829083',
    marginBottom: 8,
  },

  transcriptText: {
    fontSize: 19,
    lineHeight: 27,
    fontWeight: '700',
    color: '#334237',
  },

  errorCard: {
    backgroundColor: '#FFF0EA',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  errorIcon: {
    fontSize: 24,
    marginRight: 10,
  },

  errorText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    color: '#8A4E3E',
  },

  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DDE9D9',
    ...SHADOW,
  },

  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  responseIcon: {
    fontSize: 25,
    marginRight: 8,
  },

  responseLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#668161',
  },

  responseText: {
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '700',
    color: '#2F4034',
  },

  responseButtons: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },

  responseButton: {
    minHeight: 46,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: '#EEF5EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  responseButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#557151',
  },

  quickSection: {
    marginBottom: 20,
  },

  quickTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#35443A',
    marginBottom: 12,
  },

  quickCard: {
    minHeight: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },

  quickIcon: {
    fontSize: 27,
    width: 44,
  },

  quickText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: '#445348',
  },

  summaryCard: {
    backgroundColor: '#789F73',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EAF4E8',
  },

  summaryNumber: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },

  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EAF4E8',
  },

  homeButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...SHADOW,
  },

  homeButtonText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#4F674C',
  },
});

export default SmaranAIReminderScreen;