import React from 'react';
import {Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

export default function ProfileScreen({name, patientName, guardianMode, setGuardianMode, onBack, onLogout}) {
  const item = (icon, title, sub, fn) => (
    <Pressable onPress={fn} style={({pressed}) => [styles.item, pressed && styles.pressed]}>
      <View style={styles.itemIcon}><Text style={styles.itemIconText}>{icon}</Text></View>
      <View style={{flex:1}}><Text style={styles.itemTitle}>{title}</Text><Text style={styles.itemSub}>{sub}</Text></View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Profile" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{String(name || 'C').charAt(0).toUpperCase()}</Text></View>
          <Text style={styles.name}>{name || 'Caregiver'}</Text>
          <Text style={styles.role}>Caregiver • Patient: {patientName || 'Patient'}</Text>
        </View>

        <View style={styles.guardian}>
          <View style={styles.guardianIcon}><Text style={styles.guardianIconText}>✓</Text></View>
          <View style={{flex:1}}><Text style={styles.guardianTitle}>Guardian Mode</Text><Text style={styles.guardianSub}>{guardianMode ? 'Active — trusted support is enabled.' : 'Biometric verification is required to enable it.'}</Text></View>
          <Switch value={guardianMode} onValueChange={setGuardianMode} trackColor={{false:COLORS.border,true:COLORS.primary}} thumbColor={guardianMode?COLORS.primaryDark:COLORS.white}/>
        </View>

        {item('⌂','Privacy & Security','Manage your account and data settings',()=>Alert.alert('Privacy & Security','More account controls can be connected to the backend here.'))}
        {item('🔔','Notifications','Reminder notification preferences',()=>Alert.alert('Notifications','Smaran reminder notifications are enabled for scheduled reminders.'))}
        {item('i','About Smaran','Learn more about the platform',()=>Alert.alert('Smaran','A calm, privacy-minded companion for everyday dementia care.'))}

        <Pressable onPress={onLogout} style={({pressed}) => [styles.logout, pressed && styles.pressed]}><Text style={styles.logoutText}>Log Out</Text></Pressable>
      </ScrollView>
    </View>
  );
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:16,paddingBottom:30},profile:{alignItems:'center',paddingVertical:15},avatar:{width:84,height:84,borderRadius:42,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',borderWidth:3,borderColor:COLORS.white,...SHADOW},avatarText:{fontSize:34,color:COLORS.primaryDark,fontWeight:'900'},name:{fontSize:23,fontWeight:'900',color:COLORS.text,marginTop:10},role:{fontSize:11,color:COLORS.muted,marginTop:3},guardian:{backgroundColor:COLORS.primaryDeep,borderRadius:20,padding:15,flexDirection:'row',alignItems:'center',marginBottom:12,...SHADOW},guardianIcon:{width:42,height:42,borderRadius:15,backgroundColor:'rgba(255,255,255,.13)',alignItems:'center',justifyContent:'center',marginRight:10},guardianIconText:{fontSize:17,color:COLORS.white,fontWeight:'900'},guardianTitle:{fontSize:15,fontWeight:'900',color:COLORS.white},guardianSub:{fontSize:10.5,color:COLORS.mint,marginTop:3,lineHeight:15},item:{backgroundColor:COLORS.white,borderRadius:18,padding:13,flexDirection:'row',alignItems:'center',marginBottom:9,...SHADOW},pressed:{opacity:.75},itemIcon:{width:44,height:44,borderRadius:15,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:11},itemIconText:{fontSize:18,color:COLORS.primaryDark,fontWeight:'900'},itemTitle:{fontSize:14.5,fontWeight:'900',color:COLORS.text},itemSub:{fontSize:10.5,color:COLORS.muted,marginTop:3},arrow:{fontSize:28,color:COLORS.primaryDark},logout:{height:52,borderRadius:16,borderWidth:1.5,borderColor:COLORS.danger,alignItems:'center',justifyContent:'center',marginTop:8},logoutText:{fontSize:14,color:COLORS.danger,fontWeight:'900'}});
