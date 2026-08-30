import React, {useEffect, useMemo, useState} from 'react';
import {Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import Header from '../components/Header';
import Icon from '../components/Icon';
import {COLORS, SHADOW} from '../theme';

const cleanPhone = value => String(value || '').replace(/\D/g, '');
const makeId = () => `person-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const initialOf = name => String(name || 'T').trim().charAt(0).toUpperCase() || 'T';

function normalizePerson(item) {
  if (!item || !String(item.name || '').trim()) return null;
  return {
    id: String(item.id || makeId()),
    name: String(item.name).trim(),
    role: String(item.role || 'Trusted Person').trim(),
    countryCode: String(item.countryCode || '+91').trim() || '+91',
    phone: cleanPhone(item.phone),
    status: String(item.status || 'Trusted contact'),
    isCaregiver: Boolean(item.isCaregiver),
    isPhysician: Boolean(item.isPhysician),
    isEmergency: Boolean(item.isEmergency),
  };
}

function fullNumber(person) {
  const phone = cleanPhone(person?.phone);
  if (!phone) return '';
  const code = String(person?.countryCode || '+91').replace(/\s/g, '');
  return `${code}${phone}`.replace(/(?!^)\+/g, '');
}

async function callPerson(person) {
  const number = fullNumber(person);
  if (!number) {
    Alert.alert('Phone number missing', `Please add a mobile number for ${person.name}.`);
    return;
  }
  const url = `tel:${number}`;
  try {
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
    else Alert.alert('Calling unavailable', 'This device cannot open the phone dialer.');
  } catch (error) {
    console.log('Dialer error:', error);
    Alert.alert('Calling unavailable', 'Unable to open the phone dialer.');
  }
}

function PersonCard({person, onCall, onEdit, onDelete}) {
  const protectedPerson = person.isCaregiver || person.isPhysician || person.isEmergency;
  return (
    <View style={[styles.personCard, person.isCaregiver && styles.caregiverCard]}>
      <View style={styles.personTop}>
        <View style={[styles.avatar, person.isCaregiver && styles.caregiverAvatar]}>
          <Text style={styles.avatarText}>{initialOf(person.name)}</Text>
        </View>
        <View style={styles.personInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{person.name}</Text>
            {person.isCaregiver ? <View style={styles.badge}><Text style={styles.badgeText}>CAREGIVER</Text></View> : null}
            {person.isPhysician ? <View style={styles.doctorBadge}><Text style={styles.badgeText}>PHYSICIAN</Text></View> : null}
          </View>
          <Text style={styles.role}>{person.role}</Text>
          <Text style={styles.phone}>{fullNumber(person) || 'Mobile number not added'}</Text>
          <View style={styles.statusRow}><View style={styles.statusDot}/><Text style={styles.status}>{person.status}</Text></View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => onCall(person)} style={styles.callButton}>
          <Icon name="phone" size={16} color={COLORS.white} strokeWidth={2.4} />
          <Text style={styles.callText}>Call</Text>
        </Pressable>
        {!protectedPerson ? <Pressable onPress={() => onEdit(person)} style={styles.smallButton}><Icon name="pencil" size={16} color={COLORS.primaryDark}/></Pressable> : null}
        {!protectedPerson ? <Pressable onPress={() => onDelete(person)} style={[styles.smallButton, styles.deleteButton]}><Text style={styles.deleteText}>×</Text></Pressable> : null}
      </View>
    </View>
  );
}

export default function CircleScreen({
  onBack,
  people = [],
  onPeopleChange,
  caregiverName,
  caregiverMobile,
  caregiverCountryCode = '+91',
  emergencyContacts = [],
  physicianName = '',
  physicianMobile = '',
  physicianCountryCode = '+91',
}) {
  const [editor, setEditor] = useState(null);
  const [localPeople, setLocalPeople] = useState([]);

  const sourcePeople = Array.isArray(people) ? people : localPeople;
  const normalized = useMemo(() => sourcePeople.map(normalizePerson).filter(Boolean), [sourcePeople]);

  const caregiver = useMemo(() => {
    const saved = normalized.find(item => item.isCaregiver);
    return saved || (caregiverName ? normalizePerson({id: 'caregiver', name: caregiverName, role: 'Caregiver', countryCode: caregiverCountryCode, phone: caregiverMobile, status: caregiverMobile ? 'Available to call' : 'Add mobile number', isCaregiver: true}) : null);
  }, [normalized, caregiverName, caregiverMobile, caregiverCountryCode]);

  const physician = useMemo(() => {
    const saved = normalized.find(item => item.isPhysician);
    return saved || (physicianName ? normalizePerson({id: 'physician', name: physicianName, role: 'Physician', countryCode: physicianCountryCode, phone: physicianMobile, status: physicianMobile ? 'Available to call' : 'Add mobile number', isPhysician: true}) : null);
  }, [normalized, physicianName, physicianMobile, physicianCountryCode]);

  const emergency = useMemo(() => {
    const existing = normalized.filter(item => !item.isCaregiver && !item.isPhysician && !item.isEmergency);
    if (!Array.isArray(emergencyContacts)) return existing;
    const mapped = emergencyContacts.map((item, index) => normalizePerson({
      id: `emergency-${index}`,
      name: item?.name,
      role: item?.relationship || 'Emergency Contact',
      countryCode: item?.countryCode || '+91',
      phone: item?.phone,
      status: item?.phone ? 'Available to call' : 'Add mobile number',
      isEmergency: true,
    })).filter(Boolean);
    const savedByPhone = new Set(existing.map(item => `${item.countryCode}:${item.phone}`));
    return [...mapped.filter(item => !savedByPhone.has(`${item.countryCode}:${item.phone}`)), ...existing];
  }, [normalized, emergencyContacts]);

  const displayPeople = [caregiver, physician, ...emergency].filter(Boolean);

  useEffect(() => {
    if (!Array.isArray(people)) setLocalPeople([]);
  }, [people]);

  const update = next => {
    const clean = (Array.isArray(next) ? next : []).map(normalizePerson).filter(Boolean).filter(item => !item.isCaregiver && !item.isPhysician);
    if (typeof onPeopleChange === 'function') onPeopleChange(clean);
    else setLocalPeople(clean);
  };

  const openAdd = () => setEditor({id: makeId(), name: '', role: '', countryCode: '+91', phone: '', isNew: true});
  const openEdit = person => setEditor({...person, isNew: false});

  const savePerson = () => {
    const name = String(editor?.name || '').trim();
    const role = String(editor?.role || '').trim();
    const phone = cleanPhone(editor?.phone);
    if (!name) return Alert.alert('Name required', 'Please enter the trusted person’s name.');
    if (!role) return Alert.alert('Relationship required', 'Please enter their relationship.');
    if (phone.length !== 10) return Alert.alert('Mobile number required', 'Enter a valid 10-digit mobile number.');
    const person = normalizePerson({...editor, name, role, phone, status: 'Available to call'});
    const current = normalized.filter(item => !item.isCaregiver && !item.isPhysician);
    const next = editor.isNew ? [...current, person] : current.map(item => item.id === person.id ? person : item);
    update(next);
    setEditor(null);
  };

  const deletePerson = person => Alert.alert('Remove trusted person?', `${person.name} will be removed from your circle.`, [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Remove', style: 'destructive', onPress: () => update(normalized.filter(item => item.id !== person.id))},
  ]);

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Your Circle" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Icon name="heart-handshake" size={23} color={COLORS.white} /></View>
          <View style={{flex: 1}}><Text style={styles.bannerTitle}>People who care about you</Text><Text style={styles.bannerSub}>Your caregiver and trusted contacts are always close.</Text></View>
        </View>

        <View style={styles.summary}><View><Text style={styles.summaryTitle}>Trusted circle</Text><Text style={styles.summarySub}>{displayPeople.length} {displayPeople.length === 1 ? 'person' : 'people'} saved</Text></View><View style={styles.count}><Text style={styles.countText}>{displayPeople.length}</Text></View></View>

        <Text style={styles.section}>CAREGIVER & PHYSICIAN</Text>
        {caregiver ? <PersonCard person={caregiver} onCall={callPerson} onEdit={openEdit} onDelete={deletePerson}/> : null}
        {physician ? <PersonCard person={physician} onCall={callPerson} onEdit={openEdit} onDelete={deletePerson}/> : null}

        <Text style={styles.section}>TRUSTED / EMERGENCY CONTACTS</Text>
        {emergency.length ? emergency.map(person => <PersonCard key={person.id} person={person} onCall={callPerson} onEdit={openEdit} onDelete={deletePerson}/>) : <View style={styles.empty}><Icon name="users" size={28} color={COLORS.primaryDark}/><Text style={styles.emptyTitle}>No trusted contacts yet</Text><Text style={styles.emptyText}>Add a real contact with their mobile number so Smaran can open the dialer.</Text></View>}

        <Pressable onPress={openAdd} style={styles.add}><Text style={styles.addPlus}>＋</Text><View style={{flex: 1}}><Text style={styles.addTitle}>Add Trusted Person</Text><Text style={styles.addSub}>Name, relationship and mobile number</Text></View><Text style={styles.addArrow}>→</Text></Pressable>
      </ScrollView>

      <Modal visible={!!editor} transparent animationType="slide" onRequestClose={() => setEditor(null)}>
        <View style={styles.backdrop}><View style={styles.editor}>
          <View style={styles.modalHeader}><View><Text style={styles.eyebrow}>{editor?.isNew ? 'NEW CONTACT' : 'EDIT CONTACT'}</Text><Text style={styles.modalTitle}>Keep someone close</Text></View><Pressable onPress={() => setEditor(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.label}>Full name *</Text>
          <TextInput value={editor?.name || ''} onChangeText={v => setEditor(p => ({...p, name: v}))} placeholder="e.g. Maya Sharma" placeholderTextColor={COLORS.muted} style={styles.input} autoCapitalize="words" />
          <Text style={styles.label}>Relationship *</Text>
          <TextInput value={editor?.role || ''} onChangeText={v => setEditor(p => ({...p, role: v}))} placeholder="e.g. Daughter" placeholderTextColor={COLORS.muted} style={styles.input} autoCapitalize="words" />
          <Text style={styles.label}>Mobile number *</Text>
          <View style={styles.phoneRow}><TextInput value={editor?.countryCode || '+91'} onChangeText={v => setEditor(p => ({...p, countryCode: v.replace(/[^+\d]/g, '').slice(0, 5)}))} style={styles.codeInput} keyboardType="phone-pad"/><TextInput value={editor?.phone || ''} onChangeText={v => setEditor(p => ({...p, phone: cleanPhone(v).slice(0, 10)}))} placeholder="10-digit number" placeholderTextColor={COLORS.muted} style={styles.phoneInput} keyboardType="phone-pad" maxLength={10}/></View>
          <Pressable onPress={savePerson} style={styles.save}><Text style={styles.saveText}>Save Contact</Text><Text style={styles.saveArrow}>→</Text></Pressable>
          <Pressable onPress={() => setEditor(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background}, content:{padding:16,paddingBottom:34},
  banner:{backgroundColor:COLORS.primaryDeep,borderRadius:21,padding:16,flexDirection:'row',alignItems:'center',...SHADOW}, bannerIcon:{width:50,height:50,borderRadius:17,backgroundColor:'rgba(255,255,255,.13)',alignItems:'center',justifyContent:'center',marginRight:12}, bannerTitle:{fontSize:16,fontWeight:'900',color:COLORS.white}, bannerSub:{fontSize:10.5,color:COLORS.mint,marginTop:3,lineHeight:15},
  summary:{marginTop:12,backgroundColor:COLORS.white,borderRadius:18,padding:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',...SHADOW}, summaryTitle:{fontSize:14,color:COLORS.text,fontWeight:'900'}, summarySub:{fontSize:10,color:COLORS.muted,marginTop:3}, count:{width:40,height:40,borderRadius:20,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'}, countText:{fontSize:16,color:COLORS.primaryDark,fontWeight:'900'},
  section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.1,marginTop:20,marginBottom:9},
  personCard:{backgroundColor:COLORS.white,borderRadius:18,padding:13,marginBottom:10,...SHADOW}, caregiverCard:{borderWidth:1.5,borderColor:COLORS.primary}, personTop:{flexDirection:'row',alignItems:'center'}, avatar:{width:52,height:52,borderRadius:26,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:11}, caregiverAvatar:{backgroundColor:'#DDECCF'}, avatarText:{fontSize:19,color:COLORS.primaryDark,fontWeight:'900'}, personInfo:{flex:1,minWidth:0}, nameRow:{flexDirection:'row',alignItems:'center',gap:6}, name:{fontSize:15.5,fontWeight:'900',color:COLORS.text,flexShrink:1}, badge:{backgroundColor:COLORS.primarySoft,borderRadius:7,paddingHorizontal:6,paddingVertical:3}, doctorBadge:{backgroundColor:COLORS.cream,borderRadius:7,paddingHorizontal:6,paddingVertical:3}, badgeText:{fontSize:7,color:COLORS.primaryDark,fontWeight:'900'}, role:{fontSize:10.5,color:COLORS.muted,marginTop:2}, phone:{fontSize:10.5,color:COLORS.text,fontWeight:'700',marginTop:3}, statusRow:{flexDirection:'row',alignItems:'center',marginTop:3}, statusDot:{width:6,height:6,borderRadius:3,backgroundColor:COLORS.success,marginRight:5}, status:{fontSize:9.5,color:COLORS.success,fontWeight:'800'}, actions:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:7,marginTop:11}, callButton:{height:38,borderRadius:12,backgroundColor:COLORS.primary,flexDirection:'row',alignItems:'center',justifyContent:'center',paddingHorizontal:14,gap:6}, callText:{fontSize:11,color:COLORS.white,fontWeight:'900'}, smallButton:{width:38,height:38,borderRadius:12,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'}, deleteButton:{backgroundColor:'rgba(198,74,74,.09)'}, deleteText:{fontSize:20,color:COLORS.danger},
  empty:{backgroundColor:COLORS.white,borderRadius:18,padding:25,alignItems:'center',...SHADOW}, emptyTitle:{fontSize:15,color:COLORS.text,fontWeight:'900',marginTop:8}, emptyText:{fontSize:10.5,color:COLORS.muted,lineHeight:16,textAlign:'center',marginTop:4}, add:{minHeight:64,borderRadius:18,borderWidth:1.5,borderColor:COLORS.primary,borderStyle:'dashed',paddingHorizontal:13,flexDirection:'row',alignItems:'center',marginTop:3}, addPlus:{fontSize:21,color:COLORS.primaryDark,marginRight:10}, addTitle:{fontSize:13.5,color:COLORS.primaryDark,fontWeight:'900'}, addSub:{fontSize:9.5,color:COLORS.muted,marginTop:2}, addArrow:{fontSize:20,color:COLORS.primaryDark},
  backdrop:{flex:1,backgroundColor:'rgba(0,0,0,.45)',justifyContent:'flex-end'}, editor:{backgroundColor:COLORS.white,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:25}, modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}, eyebrow:{fontSize:9.5,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2}, modalTitle:{fontSize:20,color:COLORS.text,fontWeight:'900',marginTop:4}, close:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'}, closeText:{fontSize:24,color:COLORS.primaryDark}, label:{fontSize:12,color:COLORS.text,fontWeight:'900',marginTop:14,marginBottom:6}, input:{height:50,borderRadius:15,borderWidth:1.2,borderColor:COLORS.border,paddingHorizontal:14,fontSize:14,color:COLORS.text}, phoneRow:{flexDirection:'row',gap:8}, codeInput:{width:78,height:50,borderRadius:15,borderWidth:1.2,borderColor:COLORS.border,paddingHorizontal:12,fontSize:14,color:COLORS.text,textAlign:'center'}, phoneInput:{flex:1,height:50,borderRadius:15,borderWidth:1.2,borderColor:COLORS.border,paddingHorizontal:14,fontSize:14,color:COLORS.text}, save:{height:54,borderRadius:17,backgroundColor:COLORS.primary,marginTop:17,alignItems:'center',justifyContent:'center',flexDirection:'row'}, saveText:{fontSize:14.5,color:COLORS.white,fontWeight:'900'}, saveArrow:{fontSize:20,color:COLORS.white,marginLeft:9}, cancel:{height:40,alignItems:'center',justifyContent:'center'}, cancelText:{fontSize:11.5,color:COLORS.muted,fontWeight:'800'},
});
