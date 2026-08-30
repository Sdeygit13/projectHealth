import React, {useEffect, useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View} from 'react-native';
import Header from '../components/Header';
import Icon from '../components/Icon';
import {COLORS, SHADOW} from '../theme';
import {authenticateBiometric, checkBiometricAvailability, disableBiometric, enableBiometric, isBiometricEnabled} from '../services/biometric';

const LANG = {
  English:{native:'English',profile:'Your Profile',account:'ACCOUNT',security:'SECURITY',preferences:'PREFERENCES',support:'SUPPORT',patient:'Patient',caregiver:'Caregiver',edit:'Edit Profile',language:'Language',languageDesc:'Choose the language used throughout Smaran.',biometric:'Biometric Authentication',biometricDesc:'Use fingerprint or device biometrics for secure access.',caregiverMode:'Caregiver Mode',patientMode:'Patient Mode',caregiverDesc:'Manage reminders, memories and care information.',patientDesc:'Use the simple patient experience.',switchCaregiver:'Switch to Caregiver Mode',switchPatient:'Switch to Patient Mode',secureTitle:'Caregiver Mode is protected',secureDesc:'Biometric authentication is required before entering Caregiver Mode.',enabled:'Enabled',notifications:'Reminder Notifications',notificationsDesc:'Receive medicine and daily reminder alerts.',help:'Help & Support',about:'About Smaran',version:'Version 1.0.0',logout:'Log Out',logoutQ:'Are you sure you want to log out?',cancel:'Cancel',save:'Save Changes',fullName:'Full name',phone:'Phone number',updated:'Profile updated successfully.',chooseLanguage:'Choose Language',auth:'Authentication Required',authMessage:'Verify your identity to enter Caregiver Mode.',failed:'Authentication failed',failedMsg:'Caregiver Mode was not enabled.',unavailable:'Biometric unavailable',unavailableMsg:'Set up fingerprint or another supported biometric on your device first.',physician:'My Physician',physicianDesc:'Your attending physician and direct phone number.',noPhysician:'Physician details were not provided.'},
  Bengali:{native:'বাংলা',profile:'আপনার প্রোফাইল',account:'অ্যাকাউন্ট',security:'নিরাপত্তা',preferences:'পছন্দ',support:'সহায়তা',patient:'রোগী',caregiver:'কেয়ারগিভার',edit:'প্রোফাইল সম্পাদনা',language:'ভাষা',languageDesc:'Smaran-এর ভাষা নির্বাচন করুন।',biometric:'বায়োমেট্রিক নিরাপত্তা',biometricDesc:'নিরাপদ অ্যাক্সেসের জন্য ফিঙ্গারপ্রিন্ট ব্যবহার করুন।',caregiverMode:'কেয়ারগিভার মোড',patientMode:'রোগী মোড',caregiverDesc:'রিমাইন্ডার, স্মৃতি ও পরিচর্যার তথ্য পরিচালনা করুন।',patientDesc:'সহজ রোগী অভিজ্ঞতায় ফিরে যান।',switchCaregiver:'কেয়ারগিভার মোডে যান',switchPatient:'রোগী মোডে যান',secureTitle:'কেয়ারগিভার মোড সুরক্ষিত',secureDesc:'কেয়ারগিভার মোডে যাওয়ার আগে বায়োমেট্রিক প্রয়োজন।',enabled:'চালু',notifications:'রিমাইন্ডার নোটিফিকেশন',notificationsDesc:'ওষুধ ও দৈনিক রিমাইন্ডারের সতর্কতা পান।',help:'সহায়তা',about:'Smaran সম্পর্কে',version:'সংস্করণ ১.০.০',logout:'লগ আউট',logoutQ:'আপনি কি লগ আউট করতে চান?',cancel:'বাতিল',save:'পরিবর্তন সংরক্ষণ',fullName:'পুরো নাম',phone:'ফোন নম্বর',updated:'প্রোফাইল সফলভাবে আপডেট হয়েছে।',chooseLanguage:'ভাষা নির্বাচন করুন',auth:'প্রমাণীকরণ প্রয়োজন',authMessage:'কেয়ারগিভার মোডে যেতে আপনার পরিচয় যাচাই করুন।',failed:'প্রমাণীকরণ ব্যর্থ',failedMsg:'কেয়ারগিভার মোড চালু হয়নি।',unavailable:'বায়োমেট্রিক উপলভ্য নয়',unavailableMsg:'ডিভাইসে ফিঙ্গারপ্রিন্ট বা অন্য বায়োমেট্রিক সেট আপ করুন।',physician:'আমার চিকিৎসক',physicianDesc:'আপনার চিকিৎসক ও সরাসরি ফোন নম্বর।',noPhysician:'চিকিৎসকের তথ্য দেওয়া হয়নি।'},
  Hindi:{native:'हिन्दी',profile:'आपकी प्रोफ़ाइल',account:'खाता',security:'सुरक्षा',preferences:'पसंद',support:'सहायता',patient:'मरीज़',caregiver:'केयरगिवर',edit:'प्रोफ़ाइल संपादित करें',language:'भाषा',languageDesc:'Smaran की भाषा चुनें।',biometric:'बायोमेट्रिक सुरक्षा',biometricDesc:'सुरक्षित पहुँच के लिए फिंगरप्रिंट का उपयोग करें।',caregiverMode:'केयरगिवर मोड',patientMode:'मरीज़ मोड',caregiverDesc:'रिमाइंडर, यादें और देखभाल की जानकारी प्रबंधित करें।',patientDesc:'सरल मरीज़ अनुभव पर लौटें।',switchCaregiver:'केयरगिवर मोड पर जाएँ',switchPatient:'मरीज़ मोड पर जाएँ',secureTitle:'केयरगिवर मोड सुरक्षित है',secureDesc:'केयरगिवर मोड में जाने से पहले बायोमेट्रिक आवश्यक है।',enabled:'चालू',notifications:'रिमाइंडर नोटिफिकेशन',notificationsDesc:'दवा और दैनिक रिमाइंडर अलर्ट प्राप्त करें।',help:'सहायता',about:'Smaran के बारे में',version:'संस्करण 1.0.0',logout:'लॉग आउट',logoutQ:'क्या आप लॉग आउट करना चाहते हैं?',cancel:'रद्द करें',save:'परिवर्तन सहेजें',fullName:'पूरा नाम',phone:'फ़ोन नंबर',updated:'प्रोफ़ाइल सफलतापूर्वक अपडेट हुई।',chooseLanguage:'भाषा चुनें',auth:'प्रमाणीकरण आवश्यक',authMessage:'केयरगिवर मोड में जाने के लिए अपनी पहचान सत्यापित करें।',failed:'प्रमाणीकरण विफल',failedMsg:'केयरगिवर मोड चालू नहीं हुआ।',unavailable:'बायोमेट्रिक उपलब्ध नहीं',unavailableMsg:'डिवाइस पर फिंगरप्रिंट या अन्य बायोमेट्रिक सेट करें।',physician:'मेरे चिकित्सक',physicianDesc:'आपके चिकित्सक और सीधे फोन नंबर।',noPhysician:'चिकित्सक की जानकारी नहीं दी गई।'},
  Assamese:{native:'অসমীয়া',profile:'আপোনাৰ প্ৰফাইল',account:'একাউণ্ট',security:'নিৰাপত্তা',preferences:'পছন্দ',support:'সহায়',patient:'ৰোগী',caregiver:'কেয়াৰগিভাৰ',edit:'প্ৰফাইল সম্পাদনা',language:'ভাষা',languageDesc:'Smaran-ৰ ভাষা বাছনি কৰক।',biometric:'বায়োমেট্ৰিক সুৰক্ষা',biometricDesc:'নিৰাপদ প্ৰৱেশৰ বাবে ফিংগাৰপ্ৰিণ্ট ব্যৱহাৰ কৰক।',caregiverMode:'কেয়াৰগিভাৰ মোড',patientMode:'ৰোগী মোড',caregiverDesc:'ৰিমাইণ্ডাৰ, স্মৃতি আৰু যত্নৰ তথ্য পৰিচালনা কৰক।',patientDesc:'সহজ ৰোগী অভিজ্ঞতালৈ উভতি যাওক।',switchCaregiver:'কেয়াৰগিভাৰ মোডলৈ যাওক',switchPatient:'ৰোগী মোডলৈ যাওক',secureTitle:'কেয়াৰগিভাৰ মোড সুৰক্ষিত',secureDesc:'কেয়াৰগিভাৰ মোডলৈ যোৱাৰ আগতে বায়োমেট্ৰিক প্ৰয়োজন।',enabled:'সক্ৰিয়',notifications:'ৰিমাইণ্ডাৰ নোটিফিকেশন',notificationsDesc:'ঔষধ আৰু দৈনিক ৰিমাইণ্ডাৰৰ সতর্কতা লাভ কৰক।',help:'সহায়',about:'Smaranৰ বিষয়ে',version:'সংস্কৰণ ১.০.০',logout:'লগ আউট',logoutQ:'আপুনি লগ আউট কৰিব বিচাৰে নেকি?',cancel:'বাতিল',save:'পৰিৱৰ্তন সংৰক্ষণ',fullName:'সম্পূৰ্ণ নাম',phone:'ফোন নম্বৰ',updated:'প্ৰফাইল সফলভাৱে আপডেট হৈছে।',chooseLanguage:'ভাষা বাছনি কৰক',auth:'প্ৰমাণীকৰণ প্ৰয়োজন',authMessage:'কেয়াৰগিভাৰ মোডলৈ যাবলৈ আপোনাৰ পৰিচয় যাচাই কৰক।',failed:'প্ৰমাণীকৰণ ব্যৰ্থ',failedMsg:'কেয়াৰগিভাৰ মোড সক্ৰিয় হোৱা নাই।',unavailable:'বায়োমেট্ৰিক উপলভ্য নহয়',unavailableMsg:'ডিভাইচত ফিংগাৰপ্ৰিণ্ট বা অন্য বায়োমেট্ৰিক ছেট আপ কৰক।',physician:'মোৰ চিকিৎসক',physicianDesc:'আপোনাৰ চিকিৎসক আৰু ফোন নম্বৰ।',noPhysician:'চিকিৎসকৰ তথ্য দিয়া হোৱা নাই।'},
};
const LANGUAGES = Object.keys(LANG);

export default function ProfileScreen({onBack,onLogout,onSaveProfile,patientName='Patient',caregiverName='Caregiver',caregiverMobile='',physicianName='',physicianMobile='',physicianCountryCode='+91',language='English',setLanguage,guardianMode=false,setGuardianMode}) {
  const t = LANG[language] || LANG.English;
  const [editOpen,setEditOpen] = useState(false);
  const [languageOpen,setLanguageOpen] = useState(false);
  const [physicianOpen,setPhysicianOpen] = useState(false);
  const [notifications,setNotifications] = useState(true);
  const [biometric,setBiometric] = useState(false);
  const [editName,setEditName] = useState(caregiverName || 'Caregiver');
  const [editPhone,setEditPhone] = useState(caregiverMobile || '');
  const [busy,setBusy] = useState(false);

  useEffect(() => {setEditName(caregiverName || 'Caregiver'); setEditPhone(caregiverMobile || '');}, [caregiverName, caregiverMobile]);
  useEffect(() => {isBiometricEnabled().then(setBiometric).catch(() => setBiometric(false));}, []);

  const mode = guardianMode ? 'caregiver' : 'patient';
  const avatar = String(patientName || 'P').trim().charAt(0).toUpperCase() || 'P';

  const selectLanguage = next => {setLanguage?.(next); setLanguageOpen(false);};

  const saveProfile = async () => {
    const cleanName = editName.trim();
    const cleanPhone = editPhone.replace(/\D/g,'');
    if (!cleanName) return Alert.alert(t.fullName,'Please enter your name.');
    if (cleanPhone && cleanPhone.length !== 10) return Alert.alert(t.phone,'Enter a valid 10-digit phone number.');
    if (onSaveProfile) await onSaveProfile({caregiverName: cleanName, caregiverMobile: cleanPhone});
    setEditOpen(false);
    Alert.alert('✓',t.updated);
  };

  const toggleBiometric = async value => {
    if (busy) return;
    setBusy(true);
    try {
      if (value) {
        const result = await enableBiometric();
        if (result.success) {setBiometric(true); Alert.alert('✓',t.enabled);}
        else Alert.alert(t.unavailable,result.error || t.unavailableMsg);
      } else {await disableBiometric(); setBiometric(false);}
    } finally {setBusy(false);}
  };

  const switchMode = async () => {
    if (mode === 'caregiver') {setGuardianMode?.(false); return;}
    if (!biometric) return Alert.alert(t.biometric,t.secureDesc);
    const available = await checkBiometricAvailability();
    if (!available.available) return Alert.alert(t.unavailable,t.unavailableMsg);
    Alert.alert(t.auth,t.authMessage,[{text:t.cancel,style:'cancel'},{text:'Continue',onPress:async()=>{
      setBusy(true);
      try {
        const result = await authenticateBiometric(t.authMessage);
        if (result.success) setGuardianMode?.(true);
        else Alert.alert(t.failed,result.error || t.failedMsg);
      } finally {setBusy(false);}
    }}]);
  };

  const logout = () => Alert.alert(t.logout,t.logoutQ,[{text:t.cancel,style:'cancel'},{text:t.logout,style:'destructive',onPress:onLogout}]);
  const physicianPhone = physicianMobile ? `${physicianCountryCode || '+91'} ${physicianMobile}` : '';

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title={t.profile}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{avatar}</Text></View>
          <View style={{flex:1}}><Text style={styles.name}>{patientName || 'Patient'}</Text><View style={styles.pill}><View style={styles.dot}/><Text style={styles.pillText}>{mode==='caregiver'?t.caregiver:t.patient}</Text></View></View>
          <Pressable onPress={()=>{setEditName(caregiverName);setEditPhone(caregiverMobile);setEditOpen(true);}} style={styles.edit}><Icon name="pencil" size={17} color={COLORS.primaryDark}/></Pressable>
        </View>

        <View style={styles.modeCard}><View style={styles.modeIcon}><Icon name="shield-check" size={22} color={COLORS.white}/></View><View style={{flex:1}}><Text style={styles.modeTitle}>{mode==='caregiver'?t.caregiverMode:t.patientMode}</Text><Text style={styles.modeDesc}>{mode==='caregiver'?t.caregiverDesc:t.patientDesc}</Text></View><View style={styles.active}><Text style={styles.activeText}>{t.enabled}</Text></View></View>
        <Pressable onPress={switchMode} style={styles.switchButton}><Icon name={mode==='caregiver'?'user-round':'shield-check'} size={18} color={COLORS.primaryDark}/><Text style={styles.switchText}>{mode==='caregiver'?t.switchPatient:t.switchCaregiver}</Text><Text style={styles.switchArrow}>→</Text></Pressable>
        {mode==='patient' ? <View style={styles.security}><Icon name="lock-keyhole" size={19} color={COLORS.primaryDark}/><View style={{flex:1,marginLeft:9}}><Text style={styles.securityTitle}>{t.secureTitle}</Text><Text style={styles.securityDesc}>{t.secureDesc}</Text></View></View> : null}

        <Text style={styles.section}>{t.account}</Text>
        <View style={styles.card}>
          <Pressable onPress={()=>{setEditName(caregiverName);setEditPhone(caregiverMobile);setEditOpen(true);}} style={styles.row}><View style={styles.rowIcon}><Icon name="user-round" size={18} color={COLORS.primaryDark}/></View><View style={{flex:1}}><Text style={styles.rowTitle}>{t.edit}</Text><Text style={styles.rowDesc}>{caregiverName || 'Caregiver'}{caregiverMobile ? ` • ${caregiverMobile}` : ''}</Text></View><Text style={styles.chevron}>›</Text></Pressable>
          <View style={styles.line}/>
          <Pressable onPress={()=>setLanguageOpen(true)} style={styles.row}><View style={styles.rowIcon}><Icon name="languages" size={18} color={COLORS.primaryDark}/></View><View style={{flex:1}}><Text style={styles.rowTitle}>{t.language}</Text><Text style={styles.rowDesc}>{t.native}</Text></View><Text style={styles.chevron}>›</Text></Pressable>
          <View style={styles.line}/>
          <Pressable onPress={()=>setPhysicianOpen(true)} style={styles.row}><View style={styles.rowIcon}><Icon name="stethoscope" size={18} color={COLORS.primaryDark}/></View><View style={{flex:1}}><Text style={styles.rowTitle}>{t.physician}</Text><Text style={styles.rowDesc}>{physicianName || t.noPhysician}</Text></View><Text style={styles.chevron}>›</Text></Pressable>
        </View>

        <Text style={styles.section}>{t.security}</Text>
        <View style={styles.card}><View style={styles.row}><View style={styles.rowIcon}><Icon name="fingerprint" size={18} color={COLORS.primaryDark}/></View><View style={{flex:1,paddingRight:8}}><Text style={styles.rowTitle}>{t.biometric}</Text><Text style={styles.rowDesc}>{t.biometricDesc}</Text></View><Switch value={biometric} onValueChange={toggleBiometric} disabled={busy} trackColor={{false:COLORS.border,true:COLORS.primarySoft}} thumbColor={biometric?COLORS.primary:'#f4f4f4'}/></View></View>

        <Text style={styles.section}>{t.preferences}</Text>
        <View style={styles.card}><View style={styles.row}><View style={styles.rowIcon}><Icon name="bell" size={18} color={COLORS.primaryDark}/></View><View style={{flex:1,paddingRight:8}}><Text style={styles.rowTitle}>{t.notifications}</Text><Text style={styles.rowDesc}>{t.notificationsDesc}</Text></View><Switch value={notifications} onValueChange={setNotifications} trackColor={{false:COLORS.border,true:COLORS.primarySoft}} thumbColor={notifications?COLORS.primary:'#f4f4f4'}/></View></View>

        <Text style={styles.section}>{t.support}</Text>
        <View style={styles.card}><Pressable onPress={()=>Alert.alert(t.help,'Smaran support will be connected here.')} style={styles.row}><View style={styles.rowIcon}><Icon name="circle-help" size={18} color={COLORS.primaryDark}/></View><Text style={[styles.rowTitle,{flex:1}]}>{t.help}</Text><Text style={styles.chevron}>›</Text></Pressable><View style={styles.line}/><Pressable onPress={()=>Alert.alert(t.about,`${t.about}\n\n${t.version}`)} style={styles.row}><View style={styles.rowIcon}><Icon name="info" size={18} color={COLORS.primaryDark}/></View><View style={{flex:1}}><Text style={styles.rowTitle}>{t.about}</Text><Text style={styles.rowDesc}>{t.version}</Text></View><Text style={styles.chevron}>›</Text></Pressable></View>
        <Pressable onPress={logout} style={styles.logout}><Text style={styles.logoutText}>{t.logout}</Text></Pressable>
      </ScrollView>

      <Modal visible={languageOpen} transparent animationType="slide" onRequestClose={()=>setLanguageOpen(false)}><View style={styles.backdrop}><View style={styles.modal}><Text style={styles.modalTitle}>{t.chooseLanguage}</Text>{LANGUAGES.map(item=><Pressable key={item} onPress={()=>selectLanguage(item)} style={[styles.languageRow,language===item&&styles.languageActive]}><Text style={styles.languageNative}>{LANG[item].native}</Text><Text style={styles.languageEnglish}>{item}</Text>{language===item?<Text style={styles.check}>✓</Text>:null}</Pressable>)}<Pressable onPress={()=>setLanguageOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>{t.cancel}</Text></Pressable></View></View></Modal>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={()=>setEditOpen(false)}><View style={styles.backdrop}><View style={styles.modal}><Text style={styles.modalTitle}>{t.edit}</Text><Text style={styles.label}>{t.fullName} *</Text><TextInput value={editName} onChangeText={setEditName} style={styles.input} placeholder={t.fullName} placeholderTextColor={COLORS.muted}/><Text style={styles.label}>{t.phone}</Text><TextInput value={editPhone} onChangeText={setEditPhone} style={styles.input} keyboardType="phone-pad" maxLength={10} placeholder={t.phone} placeholderTextColor={COLORS.muted}/><Pressable onPress={saveProfile} style={styles.save}><Text style={styles.saveText}>{t.save}</Text></Pressable><Pressable onPress={()=>setEditOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>{t.cancel}</Text></Pressable></View></View></Modal>

      <Modal visible={physicianOpen} transparent animationType="slide" onRequestClose={()=>setPhysicianOpen(false)}><View style={styles.backdrop}><View style={styles.modal}><Text style={styles.modalTitle}>{t.physician}</Text>{physicianName ? <><View style={styles.infoBox}><Icon name="stethoscope" size={21} color={COLORS.primaryDark}/><View style={{flex:1,marginLeft:10}}><Text style={styles.infoTitle}>{physicianName}</Text><Text style={styles.infoText}>Attending physician</Text></View></View><View style={styles.infoBox}><Icon name="phone" size={21} color={COLORS.primaryDark}/><View style={{flex:1,marginLeft:10}}><Text style={styles.infoTitle}>{physicianPhone || 'Mobile number not provided'}</Text><Text style={styles.infoText}>Direct contact</Text></View></View></> : <Text style={styles.emptyPhysician}>{t.noPhysician}</Text>}<Pressable onPress={()=>setPhysicianOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>{t.cancel}</Text></Pressable></View></View></Modal>
    </View>
  );
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:16,paddingBottom:34},hero:{backgroundColor:COLORS.white,borderRadius:21,padding:16,flexDirection:'row',alignItems:'center',...SHADOW},avatar:{width:58,height:58,borderRadius:29,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:12},avatarText:{fontSize:22,color:COLORS.primaryDark,fontWeight:'900'},name:{fontSize:18,color:COLORS.text,fontWeight:'900'},pill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',backgroundColor:COLORS.mint,borderRadius:10,paddingHorizontal:8,paddingVertical:4,marginTop:5},dot:{width:6,height:6,borderRadius:3,backgroundColor:COLORS.success,marginRight:5},pillText:{fontSize:9,color:COLORS.primaryDark,fontWeight:'900'},edit:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'},modeCard:{marginTop:13,backgroundColor:COLORS.primaryDeep,borderRadius:20,padding:14,flexDirection:'row',alignItems:'center',...SHADOW},modeIcon:{width:45,height:45,borderRadius:15,backgroundColor:'rgba(255,255,255,.12)',alignItems:'center',justifyContent:'center',marginRight:11},modeTitle:{fontSize:14,color:COLORS.white,fontWeight:'900'},modeDesc:{fontSize:10,color:COLORS.mint,lineHeight:15,marginTop:3},active:{backgroundColor:COLORS.white,borderRadius:10,paddingHorizontal:8,paddingVertical:5},activeText:{fontSize:8,color:COLORS.primaryDark,fontWeight:'900'},switchButton:{height:53,borderRadius:17,backgroundColor:COLORS.white,marginTop:10,flexDirection:'row',alignItems:'center',paddingHorizontal:14,...SHADOW},switchText:{flex:1,fontSize:12,color:COLORS.primaryDark,fontWeight:'900',marginLeft:10},switchArrow:{fontSize:20,color:COLORS.primaryDark},security:{marginTop:10,padding:13,borderRadius:16,backgroundColor:COLORS.mint,flexDirection:'row',alignItems:'flex-start'},securityTitle:{fontSize:11,color:COLORS.primaryDark,fontWeight:'900'},securityDesc:{fontSize:9.5,color:COLORS.muted,lineHeight:14,marginTop:2},section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2,marginTop:21,marginBottom:9},card:{backgroundColor:COLORS.white,borderRadius:18,...SHADOW},row:{minHeight:65,paddingHorizontal:14,paddingVertical:10,flexDirection:'row',alignItems:'center'},rowIcon:{width:36,height:36,borderRadius:12,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:10},rowTitle:{fontSize:12.5,color:COLORS.text,fontWeight:'900'},rowDesc:{fontSize:9.5,color:COLORS.muted,marginTop:2},chevron:{fontSize:24,color:COLORS.primaryDark,marginLeft:8},line:{height:1,backgroundColor:COLORS.border,marginHorizontal:14},logout:{height:52,borderRadius:16,borderWidth:1,borderColor:COLORS.danger,alignItems:'center',justifyContent:'center',marginTop:22},logoutText:{fontSize:13,color:COLORS.danger,fontWeight:'900'},backdrop:{flex:1,backgroundColor:'rgba(0,0,0,.44)',justifyContent:'flex-end'},modal:{backgroundColor:COLORS.white,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:28},modalTitle:{fontSize:20,color:COLORS.text,fontWeight:'900',marginBottom:12},languageRow:{height:55,borderRadius:14,flexDirection:'row',alignItems:'center',paddingHorizontal:13,marginBottom:7,borderWidth:1,borderColor:COLORS.border},languageActive:{backgroundColor:COLORS.primarySoft,borderColor:COLORS.primary},languageNative:{fontSize:14,color:COLORS.text,fontWeight:'900',width:90},languageEnglish:{fontSize:10,color:COLORS.muted,flex:1},check:{fontSize:19,color:COLORS.primaryDark,fontWeight:'900'},label:{fontSize:12,color:COLORS.text,fontWeight:'900',marginTop:12,marginBottom:6},input:{height:50,borderRadius:14,borderWidth:1.2,borderColor:COLORS.border,paddingHorizontal:13,fontSize:14,color:COLORS.text},save:{height:53,borderRadius:16,backgroundColor:COLORS.primary,marginTop:17,alignItems:'center',justifyContent:'center'},saveText:{fontSize:14,color:COLORS.white,fontWeight:'900'},cancel:{height:42,alignItems:'center',justifyContent:'center',marginTop:3},cancelText:{fontSize:12,color:COLORS.muted,fontWeight:'800'},infoBox:{backgroundColor:COLORS.mint,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',marginBottom:10},infoTitle:{fontSize:14,color:COLORS.text,fontWeight:'900'},infoText:{fontSize:10,color:COLORS.muted,marginTop:3},emptyPhysician:{fontSize:12,color:COLORS.muted,lineHeight:18,paddingVertical:18,textAlign:'center'}
});
