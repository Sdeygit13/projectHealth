import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Alert, BackHandler, Keyboard, Platform, StatusBar, StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

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
import {authenticateBiometric, disableBiometric, isBiometricEnabled} from './src/services/biometric';
import {cancelReminder, getScheduledReminders, prepareNotifications, syncReminderNotifications} from './src/services/notifications';
import {clearAllStorage, loadMemories, loadPeople, loadProfile, loadReminders, saveMemories, savePeople, saveProfile, saveReminders} from './src/services/storage';

const DEFAULT_REMINDERS = [
  {id:'reminder-1', title:'Breakfast', time:'10:00 AM', detail:'Time to enjoy your breakfast.', done:true},
  {id:'reminder-2', title:'Take Medicine', time:'12:00 PM', detail:"Don't forget to take your medicine.", done:false},
  {id:'reminder-3', title:'Drink Water', time:'03:00 PM', detail:'One glass of water.', done:false},
  {id:'reminder-4', title:'Memory Activity', time:'05:00 PM', detail:'10 minutes of a mind game.', done:false},
];

const DEFAULT_PROFILE = {
  caregiverName:'Caregiver', caregiverMobile:'', caregiverCountryCode:'+91',
  patientName:'Patient', patientDob:'', patientAge:'', age:'', patientGender:'', patientAddress:'',
  relationship:'', diagnosis:'', severity:'', symptoms:'',
  physicianName:'', physicianMobile:'', physicianCountryCode:'+91', emergencyContacts:[],
  language:'English', mode:'patient',
};

const ROOT_SCREENS = ['home','reminders','games','talk','photos','circle','profile'];
const SUPPORTED_LANGUAGES = ['English','Bengali','Hindi','Assamese'];

const normalizeReminders = list => (Array.isArray(list) ? list : []).map((item,index) => ({
  ...item,
  id:String(item?.id || `reminder-${Date.now()}-${index}`),
  title:String(item?.title || 'Reminder'),
  time:String(item?.time || '08:30 PM'),
  detail:String(item?.detail || 'Smaran reminder'),
  done:Boolean(item?.done),
}));

const normalizePerson = item => ({
  ...item,
  id:String(item?.id || `person-${Date.now()}`),
  name:String(item?.name || '').trim(),
  role:String(item?.role || 'Trusted Person'),
  countryCode:String(item?.countryCode || '+91'),
  phone:String(item?.phone || '').replace(/\D/g,''),
  status:String(item?.status || 'Trusted contact'),
  isCaregiver:Boolean(item?.isCaregiver),
  isPhysician:Boolean(item?.isPhysician),
});

const normalizeAlbums = list => (Array.isArray(list) ? list : []).map((album,index) => ({
  ...album,
  id:String(album?.id || `album-${Date.now()}-${index}`),
  title:String(album?.title || 'Family Memories'),
  description:String(album?.description || 'A cherished collection'),
  collection:album?.collection || 'family',
  images:Array.isArray(album?.images) ? album.images.map(x => typeof x === 'string' ? {uri:x} : x).filter(x => x?.uri) : [],
})).filter(album => album.images.length);

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
        <SmaranApp />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function SmaranApp() {
  const [screen,setScreen] = useState('login');
  const [profile,setProfile] = useState(DEFAULT_PROFILE);
  const [reminders,setReminders] = useState(DEFAULT_REMINDERS);
  const [people,setPeople] = useState([]);
  const [memories,setMemories] = useState([]);
  const [language,setLanguage] = useState('English');
  const [mode,setMode] = useState('patient');
  const [booting,setBooting] = useState(true);
  const [biometricBusy,setBiometricBusy] = useState(false);

  const screenRef = useRef('login');
  const historyRef = useRef([]);
  const initializedRef = useRef(false);

  const setCurrentScreen = useCallback(next => {
    screenRef.current = next;
    setScreen(next);
  },[]);

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

    // Root pages return to Home instead of doing nothing.
    if (ROOT_SCREENS.includes(current) && current !== 'home') {
      setCurrentScreen('home');
      historyRef.current = [];
      return true;
    }

    // On Home/Login Android can perform its normal exit/back action.
    return false;
  },[setCurrentScreen]);

  const navigate = useCallback(next => {
    const current = screenRef.current;
    if (!next || next === current) return;

    // Keep real navigation history even when the user changes tabs.
    // This makes both the in-app Back button and Android hardware Back
    // return to the actual previous screen instead of losing the route.
    const stack = historyRef.current;
    if (stack[stack.length - 1] !== current) {
      historyRef.current = [...stack, current];
    }
    setCurrentScreen(next);
  },[setCurrentScreen]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', goBack);
    return () => subscription.remove();
  },[goBack]);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      try {
        const [savedProfile,savedReminders,savedPeople,savedMemories,biometricEnabled] = await Promise.all([
          loadProfile(), loadReminders(), loadPeople(), loadMemories(), isBiometricEnabled(),
        ]);
        if (!mounted) return;

        const nextProfile = savedProfile ? {...DEFAULT_PROFILE,...savedProfile} : DEFAULT_PROFILE;
        setProfile(nextProfile);
        setLanguage(SUPPORTED_LANGUAGES.includes(nextProfile.language) ? nextProfile.language : 'English');
        setMode(nextProfile.mode === 'caregiver' ? 'caregiver' : 'patient');
        setReminders(savedReminders.length ? normalizeReminders(savedReminders) : DEFAULT_REMINDERS);
        setPeople(savedPeople.map(normalizePerson).filter(item => item.name));
        setMemories(normalizeAlbums(savedMemories));
        initializedRef.current = true;

        if (biometricEnabled) {
          setBiometricBusy(true);
          const result = await authenticateBiometric('Unlock Smaran');
          if (!mounted) return;
          setBiometricBusy(false);
          if (result.success) {
            historyRef.current = [];
            setCurrentScreen('home');
          } else {
            historyRef.current = [];
            setCurrentScreen('login');
          }
        }
      } catch (error) {
        console.log('Smaran startup error:',error);
        if (mounted) {
          initializedRef.current = true;
          setCurrentScreen('login');
        }
      } finally {
        if (mounted) setBooting(false);
      }
    };
    boot();
    return () => {mounted = false;};
  },[setCurrentScreen]);

  // Persist every important state change. Navigation never clears this data.
  useEffect(() => {if (initializedRef.current) saveProfile(profile);},[profile]);
  useEffect(() => {if (initializedRef.current) saveReminders(reminders);},[reminders]);
  useEffect(() => {if (initializedRef.current) savePeople(people);},[people]);
  useEffect(() => {if (initializedRef.current) saveMemories(memories);},[memories]);

  // Keep local notifications synchronized with the saved reminder list.
  useEffect(() => {
    if (!initializedRef.current || !profile.patientName) return;
    let active = true;
    (async () => {
      const ready = await prepareNotifications();
      if (active && ready) await syncReminderNotifications(reminders,profile.patientName);
    })().catch(error => console.log('Reminder sync error:',error));
    return () => {active = false;};
  },[reminders,profile.patientName]);

  const login = name => {
    if (name) setProfile(previous => ({...previous,caregiverName:name.trim()}));
    historyRef.current = ['login'];
    setCurrentScreen('onboarding');
  };

  const completeSignup = signupProfile => {
    const next = {...DEFAULT_PROFILE,...profile,...(signupProfile || {})};
    next.physicianName = next.physicianName || signupProfile?.doctorName || '';
    next.physicianMobile = String(next.physicianMobile || signupProfile?.doctorPhone || '').replace(/\D/g,'');
    next.physicianCountryCode = next.physicianCountryCode || signupProfile?.doctorCountryCode || '+91';
    next.caregiverMobile = String(next.caregiverMobile || signupProfile?.mobile || signupProfile?.caregiverPhone || '').replace(/\D/g,'');
    next.patientAge = signupProfile?.age || next.patientAge || '';
    next.language = SUPPORTED_LANGUAGES.includes(signupProfile?.language) ? signupProfile.language : (language || 'English');
    next.mode = 'patient';
    next.emergencyContacts = Array.isArray(signupProfile?.emergencyContacts) ? signupProfile.emergencyContacts : [];

    setProfile(next);
    setLanguage(next.language);
    setMode('patient');

    // Persist the complete account immediately, before leaving signup.
    saveProfile(next).catch(error => console.log('Initial profile save error:',error));

    setPeople(previous => {
      const manual = previous.filter(item => !item.isCaregiver && !item.isPhysician && !String(item.id).startsWith('emergency-'));
      const caregiver = next.caregiverName ? normalizePerson({id:'caregiver',name:next.caregiverName,role:'Caregiver',countryCode:next.caregiverCountryCode,phone:next.caregiverMobile,status:next.caregiverMobile?'Available to call':'Add mobile number',isCaregiver:true}) : null;
      const physician = next.physicianName ? normalizePerson({id:'physician',name:next.physicianName,role:'Physician',countryCode:next.physicianCountryCode,phone:next.physicianMobile,status:next.physicianMobile?'Available to call':'Add mobile number',isPhysician:true}) : null;
      return [caregiver,physician,...manual].filter(Boolean);
    });

    historyRef.current = ['login','signup'];
    setCurrentScreen('biometricSetup');
  };

  const biometricEnabled = () => {
    historyRef.current = ['login','signup','biometricSetup'];
    setCurrentScreen('onboarding');
  };

  const biometricSkipped = () => {
    Alert.alert('Biometric setup required','Please complete fingerprint or biometric authentication to continue using Smaran.');
    setCurrentScreen('biometricSetup');
  };

  const updateReminders = useCallback(updater => {
    setReminders(previous => normalizeReminders(typeof updater === 'function' ? updater(previous) : updater));
  },[]);

  const addReminder = useCallback(reminder => {
    setReminders(previous => [...previous,normalizeReminders([reminder])[0]]);
  },[]);

  const updateReminder = useCallback((id,updates) => {
    setReminders(previous => previous.map(item => item.id === id ? {...item,...updates} : item));
  },[]);

  const toggleReminder = useCallback(id => {
    setReminders(previous => previous.map(item => item.id === id ? {...item,done:!item.done} : item));
  },[]);

  const deleteReminder = useCallback(async id => {
    await cancelReminder(id);
    setReminders(previous => previous.filter(item => item.id !== id));
  },[]);

  const changeLanguage = nextLanguage => {
    if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
    setLanguage(nextLanguage);
    setProfile(previous => ({...previous,language:nextLanguage}));
  };

  const changeMode = nextMode => {
    if (nextMode !== 'patient' && nextMode !== 'caregiver') return;
    setMode(nextMode);
    setProfile(previous => ({...previous,mode:nextMode}));
  };

  const updateProfile = async updates => {
    const next = {...profile,...updates};
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
    setProfile(previous => ({...previous,emergencyContacts:safe}));
  };

  const logout = async () => {
    setBiometricBusy(true);
    try {
      await disableBiometric();
      await clearAllStorage();
      const scheduled = await getScheduledReminders();
      await Promise.all(scheduled.map(item => cancelReminder(item?.notification?.id)));
    } catch (error) {
      console.log('Logout cleanup error:',error);
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

  if (booting || biometricBusy) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false}/>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={COLORS.primary}/>
          <Text style={styles.loadingTitle}>{booting ? 'Checking secure access…' : 'Securing Smaran…'}</Text>
          <Text style={styles.loadingText}>{booting ? 'Please wait while we restore your saved Smaran data.' : 'Please complete biometric authentication.'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false}/>

      {screen === 'login' && <LoginScreen onLogin={login} onSignup={() => navigate('signup')} onForgot={() => navigate('forgot')}/>} 
      {screen === 'signup' && <SignupScreen onBack={goBack} onComplete={completeSignup}/>} 
      {screen === 'biometricSetup' && <BiometricSetupScreen onEnabled={biometricEnabled} onSkip={biometricSkipped}/>} 
      {screen === 'forgot' && <ForgotPasswordScreen onBack={goBack}/>} 
      {screen === 'onboarding' && <OnboardingScreen onBack={goBack} onContinue={() => {historyRef.current=[];setCurrentScreen('home');}}/>}

      {screen === 'home' && <HomeScreen
        name={profile.caregiverName}
        patientName={profile.patientName}
        reminders={reminders}
        onNavigate={navigate}
        onToggleReminder={toggleReminder}
      />}

      {screen === 'reminders' && <RemindersScreen onBack={goBack} reminders={reminders} patientName={profile.patientName} onRemindersChange={updateReminders}/>} 
      {screen === 'games' && <GamesScreen onBack={goBack} patientName={profile.patientName}/>} 
      {screen === 'talk' && <TalkingHelpScreen onBack={goBack} patientName={profile.patientName}/>} 
      {screen === 'photos' && <PhotosScreen onBack={goBack} albums={memories} onAlbumsChange={setMemories} onMemoryCountChange={()=>{}}/>} 
      {screen === 'circle' && <CircleScreen
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
      />}
      {screen === 'profile' && <ProfileScreen
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
        setGuardianMode={enabled => changeMode(enabled ? 'caregiver' : 'patient')}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:COLORS.background},
  root:{flex:1,backgroundColor:COLORS.background},
  loadingRoot:{flex:1,backgroundColor:COLORS.background,alignItems:'center',justifyContent:'center',padding:24},
  loadingCard:{width:'100%',maxWidth:380,backgroundColor:COLORS.white,borderRadius:24,padding:28,alignItems:'center',...({shadowColor:'#7A694E',shadowOffset:{width:0,height:3},shadowOpacity:.1,shadowRadius:10,elevation:3})},
  loadingTitle:{marginTop:18,fontSize:18,color:COLORS.text,fontWeight:'900'},
  loadingText:{marginTop:8,textAlign:'center',color:COLORS.muted,fontSize:13,lineHeight:19},
});
