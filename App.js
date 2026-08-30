import React, {useEffect, useRef, useState} from 'react';
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

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import RemindersScreen from './src/screens/RemindersScreen';
import GamesScreen from './src/screens/GamesScreen';
import TalkingHelpScreen from './src/screens/TalkingHelpScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import CircleScreen from './src/screens/CircleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BiometricSetupScreen from './src/screens/BiometricSetupScreen';

import {COLORS} from './src/theme';
import {
  authenticateBiometric,
  disableBiometric,
  isBiometricEnabled,
} from './src/services/biometric';
import {
  clearAuthSession,
  fetchCurrentUser,
  getDisplayName,
  loadAuthSession,
  loginUser,
  registerUser,
  forgotPasswordRequest,
  saveAuthSession,
} from './src/services/api';
import {loadProfile, loadReminders, saveProfile, saveReminders, clearProfile} from './src/services/storage';
import {syncReminderNotifications} from './src/services/notifications';

const DEFAULT_REMINDERS = [
  {id: '1', time: '08:00 AM', title: 'Morning medicine', detail: 'Before breakfast', icon: 'M', done: false},
  {id: '2', time: '10:30 AM', title: 'Drink water', detail: 'One glass of water', icon: 'W', done: false},
  {id: '3', time: '01:00 PM', title: 'Lunch', detail: 'Lunch with family', icon: 'L', done: true},
  {id: '4', time: '05:00 PM', title: 'Memory activity', detail: '10 minutes of a mind game', icon: 'G', done: false},
  {id: '5', time: '07:30 PM', title: 'Family call', detail: 'Talk with your loved ones', icon: 'C', done: false},
];

export default function App() {
  const [screen, setScreen] = useState('login');
  const [history, setHistory] = useState([]);
  const [userName, setUserName] = useState('Caregiver');
  const [patientName, setPatientName] = useState('Patient');
  const [patientDob, setPatientDob] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [guardianMode, setGuardianMode] = useState(false);
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [booting, setBooting] = useState(true);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [authSession, setAuthSession] = useState(null);

  const screenRef = useRef('login');
  const historyRef = useRef([]);

  const setCurrentScreen = next => {
    screenRef.current = next;
    setScreen(next);
  };

  const navigate = next => {
    const current = screenRef.current;
    if (!next || next === current) return;
    const nextHistory = [...historyRef.current, current];
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setCurrentScreen(next);
  };

  const goBack = () => {
    Keyboard.dismiss();
    const stack = historyRef.current;
    if (stack.length === 0) return false;
    const nextHistory = [...stack];
    const previous = nextHistory.pop();
    historyRef.current = nextHistory;
    setHistory(nextHistory);
    setCurrentScreen(previous);
    return true;
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        const [profile, storedReminders, enabled, session] = await Promise.all([
          loadProfile(),
          loadReminders(),
          isBiometricEnabled(),
          loadAuthSession(),
        ]);

        if (!mounted) return;

        if (profile) {
          setUserName(profile.caregiverName || 'Caregiver');
          setPatientName(profile.patientName || 'Patient');
          setPatientDob(profile.patientDob || '');
          setPatientAge(profile.age || '');
        }

        if (Array.isArray(storedReminders) && storedReminders.length) {
          setReminders(storedReminders);
        }

        if (session?.access_token) {
          try {
            const user = await fetchCurrentUser(session.access_token);
            const displayName = getDisplayName(user);
            setUserName(displayName || 'Caregiver');
            setAuthSession(session);
            historyRef.current = [];
            setHistory([]);
            setCurrentScreen('home');
            setBooting(false);
            return;
          } catch (error) {
            console.log('Session restore failed:', error);
            await clearAuthSession();
            setAuthSession(null);
          }
        }

        if (!enabled) {
          setBooting(false);
          return;
        }

        setBiometricBusy(true);
        const result = await authenticateBiometric('Unlock Smaran');

        if (!mounted) return;
        setBiometricBusy(false);

        if (result.success) {
          historyRef.current = [];
          setHistory([]);
          setCurrentScreen('home');
        } else {
          historyRef.current = [];
          setHistory([]);
          setCurrentScreen('login');
        }
      } catch (error) {
        console.log('Startup error:', error);
        if (mounted) {
          setBiometricBusy(false);
          setCurrentScreen('login');
        }
      } finally {
        if (mounted) setBooting(false);
      }
    };

    boot();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!patientName || !reminders.length) return;
    syncReminderNotifications(reminders, patientName);
  }, [patientName, reminders]);

  const login = async ({identifier, password}) => {
    const email = String(identifier || '').trim();
    const response = await loginUser({identifier: email, password});
    const session = {
      access_token: response.access_token,
      refresh_token: response.refresh_token,
      email,
    };

    await saveAuthSession(session);
    setAuthSession(session);

    try {
      const user = await fetchCurrentUser(session.access_token);
      const displayName = getDisplayName(user);
      setUserName(displayName || 'Caregiver');
    } catch (error) {
      console.log('Fetch current user after login failed:', error);
    }

    const profile = await loadProfile();
    setUserName(profile?.caregiverName || getDisplayName(await fetchCurrentUser(session.access_token)) || 'Caregiver');
    setPatientName(profile?.patientName || 'Patient');
    setPatientDob(profile?.patientDob || '');
    setPatientAge(profile?.age || '');

    const stored = await loadReminders();
    if (Array.isArray(stored) && stored.length) setReminders(stored);

    historyRef.current = ['login'];
    setHistory(['login']);
    setCurrentScreen('onboarding');
  };

  const completeSignup = async profile => {
    const email = String(profile?.identifier || '').trim();
    const password = String(profile?.password || '');

    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address for registration.');
    }

    if (!password) {
      throw new Error('Password is required.');
    }

    try {
      await registerUser({
        identifier: email,
        password,
        full_name: profile?.name || profile?.caregiverName || 'Caregiver',
        phone: profile?.doctorPhone || email,
      });

      const normalized = {
        ...profile,
        caregiverName: profile?.caregiverName || profile?.name || 'Caregiver',
        patientName: profile?.patientName || 'Patient',
        patientDob: profile?.patientDob || '',
        age: profile?.age || '',
      };

      setUserName(normalized.caregiverName);
      setPatientName(normalized.patientName);
      setPatientDob(normalized.patientDob);
      setPatientAge(normalized.age);
      await saveProfile(normalized);
      await saveReminders(reminders);

      historyRef.current = ['login', 'signup'];
      setHistory(['login', 'signup']);
      setCurrentScreen('biometricSetup');
    } catch (error) {
      Alert.alert('Registration failed', error?.message || 'Could not create the account.');
      throw error;
    }
  };

  const biometricEnabled = () => {
    historyRef.current = ['login', 'signup', 'biometricSetup'];
    setHistory(['login', 'signup', 'biometricSetup']);
    setCurrentScreen('onboarding');
  };

  const requestGuardianMode = async enabled => {
    if (!enabled) {
      setGuardianMode(false);
      return;
    }

    setBiometricBusy(true);
    try {
      const result = await authenticateBiometric('Authorize Guardian Mode');
      if (result.success) {
        setGuardianMode(true);
      } else {
        setGuardianMode(false);
        Alert.alert('Guardian Mode locked', 'Biometric verification is required to enable Guardian Mode.');
      }
    } catch (error) {
      setGuardianMode(false);
      Alert.alert('Guardian Mode locked', 'Biometric verification could not be completed.');
    } finally {
      setBiometricBusy(false);
    }
  };

  const updateReminders = next => {
    setReminders(previous => {
      const value = typeof next === 'function' ? next(previous) : next;
      saveReminders(value);
      return value;
    });
  };

  const logout = async () => {
    setBiometricBusy(true);
    try {
      await disableBiometric();
    } catch (error) {
      console.log('Logout biometric cleanup error:', error);
    }

    try {
      await clearAuthSession();
    } catch (error) {
      console.log('Logout auth session cleanup error:', error);
    }

    setAuthSession(null);
    setBiometricBusy(false);
    historyRef.current = [];
    setHistory([]);
    setGuardianMode(false);
    await clearProfile();
    setCurrentScreen('login');
  };

  if (booting || biometricBusy) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTitle}>
            {booting ? 'Checking secure access…' : 'Securing Smaran…'}
          </Text>
          <Text style={styles.loadingText}>
            {booting ? 'Please wait while we check your biometric access.' : 'Please wait…'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {screen === 'login' && (
        <LoginScreen onLogin={login} onSignup={() => navigate('signup')} onForgot={() => navigate('forgot')} />
      )}

      {screen === 'signup' && <SignupScreen onBack={goBack} onComplete={completeSignup} />}

      {screen === 'biometricSetup' && <BiometricSetupScreen onEnabled={biometricEnabled} />}

      {screen === 'forgot' && <ForgotPasswordScreen onBack={goBack} />}

      {screen === 'onboarding' && <OnboardingScreen onBack={goBack} onContinue={() => navigate('home')} />}

      {screen === 'home' && (
        <HomeScreen
          name={userName}
          patientName={patientName}
          patientDob={patientDob}
          patientAge={patientAge}
          guardianMode={guardianMode}
          setGuardianMode={requestGuardianMode}
          reminders={reminders}
          onNavigate={navigate}
        />
      )}

      {screen === 'reminders' && (
        <RemindersScreen
          onBack={goBack}
          reminders={reminders}
          onRemindersChange={updateReminders}
          patientName={patientName}
        />
      )}

      {screen === 'games' && <GamesScreen onBack={goBack} />}
      {screen === 'talk' && <TalkingHelpScreen onBack={goBack} />}
      {screen === 'photos' && <PhotosScreen onBack={goBack} />}
      {screen === 'circle' && <CircleScreen onBack={goBack} />}

      {screen === 'profile' && (
        <ProfileScreen
          name={userName}
          patientName={patientName}
          guardianMode={guardianMode}
          setGuardianMode={requestGuardianMode}
          onBack={goBack}
          onLogout={logout}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: COLORS.background},
  loadingRoot: {flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24},
  loadingCard: {width: '100%', maxWidth: 380, backgroundColor: COLORS.white, borderRadius: 24, padding: 28, alignItems: 'center'},
  loadingTitle: {marginTop: 18, fontSize: 18, color: COLORS.text, fontWeight: '900'},
  loadingText: {marginTop: 8, textAlign: 'center', color: COLORS.muted, fontSize: 13, lineHeight: 19},
});
