import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import GamesScreen from './src/screens/GamesScreen';
import SmaranAIReminderScreen from './src/screens/SmaranAIReminderScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import CircleScreen from './src/screens/CircleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import MusicScreen from './src/screens/MusicScreen';
import RelaxScreen from './src/screens/RelaxScreen';
import BiometricSetupScreen from './src/screens/BiometricSetupScreen';
import SplashScreen from './src/screens/SplashScreen';

import {COLORS} from './src/theme';
import {
  authenticateBiometric,
  disableBiometric,
  isBiometricEnabled,
} from './src/services/biometric';
import {
  cancelReminder as cancelLegacyReminder,
  getScheduledReminders,
} from './src/services/notifications';
import SmaranAlarm from './src/services/SmaranAlarm';
import {launchCamera} from 'react-native-image-picker';
import {
  clearAllStorage,
  loadMemories,
  loadPeople,
  loadProfile,
  loadReminders,
  saveMemories,
  savePeople,
  saveProfile,
  saveReminders,
} from './src/services/storage';

const DEFAULT_REMINDERS = [
  {
    id: 'reminder-1',
    title: 'Breakfast',
    time: '10:00 AM',
    detail: 'Time to enjoy your breakfast.',
    done: true,
  },
  {
    id: 'reminder-2',
    title: 'Take Medicine',
    time: '12:00 PM',
    detail: "Don't forget to take your medicine.",
    done: false,
  },
  {
    id: 'reminder-3',
    title: 'Drink Water',
    time: '03:00 PM',
    detail: 'One glass of water.',
    done: false,
  },
  {
    id: 'reminder-4',
    title: 'Memory Activity',
    time: '05:00 PM',
    detail: '10 minutes of a mind game.',
    done: false,
  },
];

const DEFAULT_PROFILE = {
  caregiverName: 'Caregiver',
  caregiverMobile: '',
  caregiverCountryCode: '+91',
  patientName: 'Patient',
  patientDob: '',
  patientAge: '',
  age: '',
  patientGender: '',
  patientAddress: '',
  relationship: '',
  diagnosis: '',
  severity: '',
  symptoms: '',
  physicianName: '',
  physicianMobile: '',
  physicianCountryCode: '+91',
  emergencyContacts: [],
  language: 'English',
  mode: 'patient',
};

const ROOT_SCREENS = [
  'home',
  'reminders',
  'games',
  'talk',
  'photos',
  'circle',
  'profile',
  'music',
  'relax',
];

const SUPPORTED_LANGUAGES = [
  'English',
  'Bengali',
  'Hindi',
  'Assamese',
];

const normalizeReminders = list =>
  (Array.isArray(list) ? list : []).map((item, index) => ({
    ...item,
    id: String(item?.id || `reminder-${Date.now()}-${index}`),
    title: String(item?.title || item?.name || 'Reminder'),
    time: String(item?.time || item?.startTime || '08:30 PM'),
    detail: String(item?.detail || item?.description || 'Smaran reminder'),
    done: Boolean(item?.done || item?.completed),
  }));

const normalizePerson = item => ({
  ...item,
  id: String(item?.id || `person-${Date.now()}`),
  name: String(item?.name || '').trim(),
  role: String(item?.role || 'Trusted Person'),
  countryCode: String(item?.countryCode || '+91'),
  phone: String(item?.phone || '').replace(/\D/g, ''),
  status: String(item?.status || 'Trusted contact'),
  isCaregiver: Boolean(item?.isCaregiver),
  isPhysician: Boolean(item?.isPhysician),
});

const normalizeAlbums = list =>
  (Array.isArray(list) ? list : [])
    .map((album, index) => ({
      ...album,
      id: String(album?.id || `album-${Date.now()}-${index}`),
      title: String(album?.title || 'Family Memories'),
      description: String(album?.description || 'A cherished collection'),
      collection: album?.collection || 'family',
      images: Array.isArray(album?.images)
        ? album.images
            .map(item => (typeof item === 'string' ? {uri: item} : item))
            .filter(item => item?.uri)
        : [],
    }))
    .filter(album => album.images.length);

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <SmaranApp />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function SmaranApp() {
  const [screen, setScreen] = useState('splash');
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [people, setPeople] = useState([]);
  const [memories, setMemories] = useState([]);
  const [language, setLanguage] = useState('English');
  const [mode, setMode] = useState('patient');
  const [booting, setBooting] = useState(true);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [splashFinished, setSplashFinished] = useState(false);

  const screenRef = useRef('login');
  const historyRef = useRef([]);
  const initializedRef = useRef(false);
  const bootTargetRef = useRef('login');
  const loggingOutRef = useRef(false);

  const setCurrentScreen = useCallback(next => {
    screenRef.current = next;
    setScreen(next);
  }, []);

  const goBack = useCallback(() => {
    Keyboard.dismiss();

    const current = screenRef.current;
    const stack = historyRef.current;

    if (stack.length) {
      const next = [...stack];
      const previous = next.pop();
      historyRef.current = next;
      setCurrentScreen(previous);
      return true;
    }

    if (ROOT_SCREENS.includes(current) && current !== 'home') {
      setCurrentScreen('home');
      historyRef.current = [];
      return true;
    }

    return false;
  }, [setCurrentScreen]);

  const navigate = useCallback(
    next => {
      const current = screenRef.current;

      if (!next || next === current) {
        return;
      }

      const stack = historyRef.current;

      if (stack[stack.length - 1] !== current) {
        historyRef.current = [...stack, current];
      }

      setCurrentScreen(next);
    },
    [setCurrentScreen],
  );

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      goBack,
    );

    return () => subscription.remove();
  }, [goBack]);

  // Restore the user's local Smaran data before the splash finishes.
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const [
          savedProfile,
          savedReminders,
          savedPeople,
          savedMemories,
          biometricEnabled,
        ] = await Promise.all([
          loadProfile(),
          loadReminders(),
          loadPeople(),
          loadMemories(),
          isBiometricEnabled(),
        ]);

        if (!mounted) {
          return;
        }

        const nextProfile = savedProfile
          ? {...DEFAULT_PROFILE, ...savedProfile}
          : DEFAULT_PROFILE;

        setProfile(nextProfile);
        setLanguage(
          SUPPORTED_LANGUAGES.includes(nextProfile.language)
            ? nextProfile.language
            : 'English',
        );
        setMode(nextProfile.mode === 'caregiver' ? 'caregiver' : 'patient');
        setReminders(
          savedReminders.length
            ? normalizeReminders(savedReminders)
            : DEFAULT_REMINDERS,
        );
        setPeople(
          savedPeople.map(normalizePerson).filter(item => item.name),
        );
        setMemories(normalizeAlbums(savedMemories));

        initializedRef.current = true;

        if (biometricEnabled) {
          setBiometricBusy(true);

          const result = await authenticateBiometric('Unlock Smaran');

          if (!mounted) {
            return;
          }

          setBiometricBusy(false);
          bootTargetRef.current = result.success ? 'home' : 'login';
        }
      } catch (error) {
        console.log('Smaran startup error:', error);

        if (mounted) {
          initializedRef.current = true;
          bootTargetRef.current = 'login';
        }
      } finally {
        if (mounted) {
          setBooting(false);
        }
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  // The cultural splash lasts exactly 5 seconds.
  useEffect(() => {
    if (!splashFinished || booting || biometricBusy) {
      return;
    }

    historyRef.current = [];
    setCurrentScreen(bootTargetRef.current || 'login');
  }, [splashFinished, booting, biometricBusy, setCurrentScreen]);

  // Persist the same local data that the rest of Smaran already uses.
  useEffect(() => {
    if (initializedRef.current) {
      saveProfile(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (initializedRef.current) {
      saveReminders(reminders);
    }
  }, [reminders]);

  useEffect(() => {
    if (initializedRef.current) {
      savePeople(people);
    }
  }, [people]);

  useEffect(() => {
    if (initializedRef.current) {
      saveMemories(memories);
    }
  }, [memories]);

  // C + D + E:
  // Whenever the locally stored reminder list changes, mirror it into the
  // native Android AlarmManager. No network is involved.
  useEffect(() => {
    if (
      !initializedRef.current ||
      !profile.patientName ||
      loggingOutRef.current
    ) {
      return;
    }

    SmaranAlarm.syncReminders(reminders).catch(error =>
      console.log('Smaran native alarm sync error:', error),
    );
  }, [reminders, profile.patientName]);

  const login = name => {
    loggingOutRef.current = false;

    if (name) {
      setProfile(previous => ({
        ...previous,
        caregiverName: name.trim(),
      }));
    }

    historyRef.current = ['login'];
    setCurrentScreen('onboarding');
  };

  const completeSignup = signupProfile => {
    const next = {
      ...DEFAULT_PROFILE,
      ...profile,
      ...(signupProfile || {}),
    };

    next.physicianName =
      next.physicianName || signupProfile?.doctorName || '';

    next.physicianMobile = String(
      next.physicianMobile || signupProfile?.doctorPhone || '',
    ).replace(/\D/g, '');

    next.physicianCountryCode =
      next.physicianCountryCode || signupProfile?.doctorCountryCode || '+91';

    next.caregiverMobile = String(
      next.caregiverMobile ||
        signupProfile?.mobile ||
        signupProfile?.caregiverPhone ||
        '',
    ).replace(/\D/g, '');

    next.patientAge = signupProfile?.age || next.patientAge || '';

    next.language = SUPPORTED_LANGUAGES.includes(signupProfile?.language)
      ? signupProfile.language
      : language || 'English';

    next.mode = 'patient';
    next.emergencyContacts = Array.isArray(signupProfile?.emergencyContacts)
      ? signupProfile.emergencyContacts
      : [];

    setProfile(next);
    setLanguage(next.language);
    setMode('patient');

    saveProfile(next).catch(error =>
      console.log('Initial profile save error:', error),
    );

    setPeople(previous => {
      const manual = previous.filter(
        item =>
          !item.isCaregiver &&
          !item.isPhysician &&
          !String(item.id).startsWith('emergency-'),
      );

      const caregiver = next.caregiverName
        ? normalizePerson({
            id: 'caregiver',
            name: next.caregiverName,
            role: 'Caregiver',
            countryCode: next.caregiverCountryCode,
            phone: next.caregiverMobile,
            status: next.caregiverMobile
              ? 'Available to call'
              : 'Add mobile number',
            isCaregiver: true,
          })
        : null;

      const physician = next.physicianName
        ? normalizePerson({
            id: 'physician',
            name: next.physicianName,
            role: 'Physician',
            countryCode: next.physicianCountryCode,
            phone: next.physicianMobile,
            status: next.physicianMobile
              ? 'Available to call'
              : 'Add mobile number',
            isPhysician: true,
          })
        : null;

      return [caregiver, physician, ...manual].filter(Boolean);
    });

    historyRef.current = ['login', 'signup'];
    setCurrentScreen('biometricSetup');
  };

  const biometricEnabled = () => {
    historyRef.current = ['login', 'signup', 'biometricSetup'];
    setCurrentScreen('onboarding');
  };

  const biometricSkipped = () => {
    Alert.alert(
      'Biometric setup required',
      'Please complete fingerprint or biometric authentication to continue using Smaran.',
    );
    setCurrentScreen('biometricSetup');
  };

  const updateReminders = useCallback(updater => {
    setReminders(previous =>
      normalizeReminders(
        typeof updater === 'function' ? updater(previous) : updater,
      ),
    );
  }, []);

  const toggleReminder = useCallback(id => {
    setReminders(previous =>
      previous.map(item =>
        item.id === id ? {...item, done: !item.done} : item,
      ),
    );
  }, []);

  const deleteReminder = useCallback(async id => {
    await Promise.all([
      cancelLegacyReminder(id),
      SmaranAlarm.cancelReminder(id),
    ]);

    setReminders(previous => previous.filter(item => item.id !== id));
  }, []);

  const changeLanguage = nextLanguage => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) {
      return;
    }

    setLanguage(nextLanguage);
    setProfile(previous => ({...previous, language: nextLanguage}));
  };

  const openTalk = useCallback(() => {
    navigate('talk');
  }, [navigate]);

  const capturePhoto = useCallback(async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        saveToPhotos: true,
        includeBase64: false,
      });

      if (result?.didCancel) {
        return;
      }

      if (result?.errorCode) {
        Alert.alert(
          'Camera unavailable',
          result.errorMessage || 'Unable to open the camera.',
        );
        return;
      }

      const uri = result?.assets?.[0]?.uri;
      if (!uri) {
        return;
      }

      setMemories(previous => {
        const nextImage = {uri};

        if (!previous.length) {
          return [
            {
              id: `album-${Date.now()}`,
              title: 'Family Memories',
              description: 'A cherished collection',
              collection: 'family',
              images: [nextImage],
            },
          ];
        }

        return previous.map((album, index) =>
          index === 0
            ? {...album, images: [...(album.images || []), nextImage]}
            : album,
        );
      });

      Alert.alert('Photo saved', 'Your photo was added to Family Memories.');
      navigate('photos');
    } catch (error) {
      console.log('Camera error:', error);
      Alert.alert(
        'Camera unavailable',
        'Please make sure Smaran has camera permission.',
      );
    }
  }, [navigate]);

  const changeMode = nextMode => {
    if (nextMode !== 'patient' && nextMode !== 'caregiver') {
      return;
    }

    setMode(nextMode);
    setProfile(previous => ({...previous, mode: nextMode}));
  };

  const updateProfile = async updates => {
    const next = {...profile, ...updates};
    setProfile(next);
    await saveProfile(next);
  };

  const updatePeople = updater => {
    setPeople(previous => {
      const next = typeof updater === 'function' ? updater(previous) : updater;

      return (Array.isArray(next) ? next : [])
        .map(normalizePerson)
        .filter(item => item.name && !item.isCaregiver && !item.isPhysician);
    });
  };

  const updateEmergencyContacts = contacts => {
    const safe = Array.isArray(contacts) ? contacts : [];
    setProfile(previous => ({...previous, emergencyContacts: safe}));
  };

  const logout = async () => {
    loggingOutRef.current = true;
    setBiometricBusy(true);

    try {
      await disableBiometric();
      await SmaranAlarm.cancelAllReminders();
      await clearAllStorage();

      const scheduled = await getScheduledReminders();
      await Promise.all(
        scheduled.map(item =>
          cancelLegacyReminder(item?.notification?.id),
        ),
      );
    } catch (error) {
      console.log('Logout cleanup error:', error);
    } finally {
      setProfile(DEFAULT_PROFILE);
      setLanguage('English');
      setMode('patient');
      setReminders(DEFAULT_REMINDERS);
      setPeople([]);
      setMemories([]);
      historyRef.current = [];
      setBiometricBusy(false);
      setCurrentScreen('login');
    }
  };

  if (screen === 'splash') {
    return <SplashScreen onFinished={() => setSplashFinished(true)} />;
  }

  if (booting || biometricBusy) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
          translucent={false}
        />

        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />

          <Text style={styles.loadingTitle}>
            {booting ? 'Checking secure access…' : 'Securing Smaran…'}
          </Text>

          <Text style={styles.loadingText}>
            {booting
              ? 'Please wait while we restore your saved Smaran data.'
              : 'Please complete biometric authentication.'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
        translucent={false}
      />

      {screen === 'login' && (
        <LoginScreen
          onLogin={login}
          onSignup={() => navigate('signup')}
          onForgot={() => navigate('forgot')}
        />
      )}

      {screen === 'signup' && (
        <SignupScreen onBack={goBack} onComplete={completeSignup} />
      )}

      {screen === 'biometricSetup' && (
        <BiometricSetupScreen
          onEnabled={biometricEnabled}
          onSkip={biometricSkipped}
        />
      )}

      {screen === 'forgot' && <ForgotPasswordScreen onBack={goBack} />}

      {screen === 'onboarding' && (
        <OnboardingScreen
          onBack={goBack}
          onContinue={() => {
            historyRef.current = [];
            setCurrentScreen('home');
          }}
        />
      )}

      {screen === 'home' && (
        <HomeScreen
          name={profile.caregiverName}
          patientName={profile.patientName}
          reminders={reminders}
          onNavigate={navigate}
          onToggleReminder={toggleReminder}
          onSendMessage={openTalk}
          onCapturePhoto={capturePhoto}
        />
      )}

      {screen === 'reminders' && (
        <RemindersScreen
          onBack={goBack}
          reminders={reminders}
          patientName={profile.patientName}
          onRemindersChange={updateReminders}
        />
      )}

      {screen === 'games' && (
        <GamesScreen
          onBack={goBack}
          patientName={profile.patientName}
        />
      )}

      {screen === 'talk' && (
        <SmaranAIReminderScreen
          patientName={profile.patientName}
          name={profile.caregiverName}
          reminders={reminders}
          onNavigate={navigate}
        />
      )}

      {screen === 'music' && <MusicScreen onBack={goBack} />}
      {screen === 'relax' && <RelaxScreen onBack={goBack} />}

      {screen === 'photos' && (
        <PhotosScreen
          onBack={goBack}
          albums={memories}
          onAlbumsChange={setMemories}
          onMemoryCountChange={() => {}}
        />
      )}

      {screen === 'circle' && (
        <CircleScreen
          onBack={goBack}
          people={people}
          onPeopleChange={updatePeople}
          caregiverName={profile.caregiverName}
          caregiverMobile={profile.caregiverMobile}
          caregiverCountryCode={profile.caregiverCountryCode}
          emergencyContacts={profile.emergencyContacts}
          physicianName={profile.physicianName}
          physicianMobile={profile.physicianMobile}
          physicianCountryCode={profile.physicianCountryCode}
          onEmergencyContactsChange={updateEmergencyContacts}
        />
      )}

      {screen === 'profile' && (
        <ProfileScreen
          onBack={goBack}
          onLogout={logout}
          onSaveProfile={updateProfile}
          patientName={profile.patientName}
          caregiverName={profile.caregiverName}
          caregiverMobile={profile.caregiverMobile}
          physicianName={profile.physicianName}
          physicianMobile={profile.physicianMobile}
          physicianCountryCode={profile.physicianCountryCode}
          language={language}
          setLanguage={changeLanguage}
          guardianMode={mode === 'caregiver'}
          setGuardianMode={enabled =>
            changeMode(enabled ? 'caregiver' : 'patient')
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#7A694E',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  loadingTitle: {
    marginTop: 18,
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '900',
  },
  loadingText: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
