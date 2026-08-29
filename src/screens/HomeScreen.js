import React, {useEffect, useMemo, useState} from 'react';
import {Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View} from 'react-native';
import FeatureCard from '../components/FeatureCard';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import {COLORS, SHADOW} from '../theme';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning,';
  if (hour >= 12 && hour < 17) return 'Good afternoon,';
  if (hour >= 17 && hour < 21) return 'Good evening,';
  return 'Good evening,';
}

function firstName(name) {
  return String(name || 'Patient').trim().split(/\s+/)[0] || 'Patient';
}

function parseMinutes(text) {
  const match = String(text || '').match(/(\d+)\s*minutes?/i);
  return match ? Number(match[1]) : 0;
}

export default function HomeScreen({
  name,
  patientName,
  guardianMode,
  setGuardianMode,
  reminders = [],
  memoryCount = 4,
  onNavigate,
}) {
  const [now, setNow] = useState(new Date());
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const pending = reminders.filter(item => !item.done).length;
  const activityMinutes = reminders.reduce((sum, item) => sum + parseMinutes(item.detail), 0);
  const patientFirstName = firstName(patientName);
  const greeting = getGreeting(now.getHours());
  const pendingNotifications = reminders.filter(item => !item.done);

  const upcoming = useMemo(() => pendingNotifications.slice(0, 3), [pendingNotifications]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Logo size={43} />
          <View style={styles.headerActions}>
            <Pressable onPress={() => setNotificationOpen(true)} style={styles.bellButton} accessibilityRole="button" accessibilityLabel="Notifications">
              <Text style={styles.bell}>🔔</Text>
              {pendingNotifications.length > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(pendingNotifications.length, 9)}</Text></View> : null}
            </Pressable>
            <View style={styles.guardian}>
              <View style={styles.guardianIcon}><Text style={styles.lock}>✓</Text></View>
              <View><Text style={styles.guardianTitle}>Guardian Mode</Text><Text style={styles.guardianSub}>{guardianMode ? 'Active' : 'Off'}</Text></View>
              <Switch value={guardianMode} onValueChange={setGuardianMode} trackColor={{false: COLORS.border, true: COLORS.primary}} thumbColor={guardianMode ? COLORS.primaryDark : COLORS.white} />
            </View>
          </View>
        </View>

        <View style={styles.greetingRow}>
          <View><Text style={styles.hello}>{greeting}</Text><Text style={styles.name}>{patientFirstName}</Text><Text style={styles.forPatient}>Patient view</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>{patientFirstName.charAt(0).toUpperCase()}</Text></View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCopy}><Text style={styles.heroEyebrow}>TODAY WITH SMARAN</Text><Text style={styles.heroTitle}>Small moments.{`\n`}Meaningful memories.</Text><Text style={styles.heroText}>Let’s make today a little easier, one step at a time.</Text><Pressable onPress={() => onNavigate('games')} style={styles.heroButton}><Text style={styles.heroButtonText}>Start an activity</Text><Text style={styles.heroArrow}>→</Text></Pressable></View>
          <Image source={require('../assets/couple.png')} style={styles.heroImage} resizeMode="cover" />
        </View>

        <View style={styles.sectionHead}><View><Text style={styles.sectionTitle}>Your day at a glance</Text><Text style={styles.sectionSub}>Live from today's Smaran data.</Text></View><Text style={styles.today}>TODAY</Text></View>

        <View style={styles.statsRow}>
          <Stat icon="✓" number={String(reminders.length)} label="Reminders" />
          <Stat icon="✦" number={String(activityMinutes)} label="Min activity" />
          <Stat icon="♥" number={String(memoryCount)} label="Memories" last />
        </View>

        <FeatureCard title="YOUR REMINDERS" subtitle={`${pending} pending • Medicines, hydration, tasks and appointments.`} icon="◷" onPress={() => onNavigate('reminders')} color={COLORS.primarySoft} />
        <FeatureCard title="MIND GAMES" subtitle="Short activities for memory, focus and patterns." icon="✦" onPress={() => onNavigate('games')} color={COLORS.cream} />
        <FeatureCard title="TALKING HELP" subtitle="Ask Smaran for simple daily support." icon="◌" onPress={() => onNavigate('talk')} color={COLORS.mint} />
        <FeatureCard title="YOUR MEMORIES" subtitle="Familiar people, photos and special moments." icon="▧" onPress={() => onNavigate('photos')} color={COLORS.blueSoft} />
        <FeatureCard title="YOUR CIRCLE" subtitle="Stay connected with trusted people." icon="♥" onPress={() => onNavigate('circle')} color={COLORS.lavenderSoft} />

        <View style={styles.footerCard}><View style={styles.footerIcon}><Text style={styles.footerHeart}>♥</Text></View><View style={{flex: 1}}><Text style={styles.footerTitle}>A caring space for every day</Text><Text style={styles.footerText}>Private, simple and designed with dignity in mind.</Text></View></View>
      </ScrollView>
      <BottomNav active="home" onNavigate={onNavigate} />

      <Modal visible={notificationOpen} transparent animationType="fade" onRequestClose={() => setNotificationOpen(false)}>
        <Pressable style={styles.notificationBackdrop} onPress={() => setNotificationOpen(false)}>
          <Pressable style={styles.notificationCard} onPress={() => {}}>
            <View style={styles.notificationHeader}><View><Text style={styles.notificationEyebrow}>SMARAN ALERTS</Text><Text style={styles.notificationTitle}>Your reminders</Text></View><Pressable onPress={() => setNotificationOpen(false)} style={styles.notificationClose}><Text style={styles.notificationCloseText}>×</Text></Pressable></View>
            {upcoming.length ? upcoming.map(item => <View key={item.id} style={styles.notificationRow}><View style={styles.notificationIcon}><Text>🔔</Text></View><View style={{flex:1}}><Text style={styles.notificationTime}>{item.time}</Text><Text style={styles.notificationBody}>Dear {patientFirstName}, your {item.title.toLowerCase()} is at {item.time}{item.detail ? ` ${item.detail.toLowerCase()}` : ''}.</Text></View></View>) : <Text style={styles.noNotifications}>You're all caught up. No pending reminders.</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Stat({icon, number, label, last}) {
  return <View style={[styles.stat, !last && styles.statBorder]}><View style={styles.statIcon}><Text style={styles.statIconText}>{icon}</Text></View><Text style={styles.statNumber}>{number}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background}, content:{padding:16,paddingBottom:24}, header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, headerActions:{flexDirection:'row',alignItems:'center',gap:8}, bellButton:{width:42,height:42,borderRadius:14,backgroundColor:COLORS.white,alignItems:'center',justifyContent:'center',...SHADOW}, bell:{fontSize:19}, badge:{position:'absolute',right:-2,top:-2,minWidth:18,height:18,borderRadius:9,backgroundColor:COLORS.danger,alignItems:'center',justifyContent:'center',paddingHorizontal:4}, badgeText:{fontSize:9,color:COLORS.white,fontWeight:'900'}, guardian:{backgroundColor:COLORS.white,borderRadius:17,paddingHorizontal:8,paddingVertical:7,flexDirection:'row',alignItems:'center',...SHADOW}, guardianIcon:{width:28,height:28,borderRadius:14,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:7}, lock:{fontSize:13,color:COLORS.primaryDark,fontWeight:'900'}, guardianTitle:{fontSize:10.5,fontWeight:'900',color:COLORS.text}, guardianSub:{fontSize:9,color:COLORS.muted,marginTop:1}, greetingRow:{marginTop:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, hello:{fontSize:16,color:COLORS.muted,fontWeight:'700'}, name:{fontSize:30,color:COLORS.text,fontWeight:'900',marginTop:1}, forPatient:{fontSize:10,color:COLORS.primaryDark,fontWeight:'800',marginTop:2}, avatar:{width:52,height:52,borderRadius:26,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',borderWidth:2,borderColor:COLORS.white}, avatarText:{fontSize:22,color:COLORS.primaryDark,fontWeight:'900'}, heroCard:{height:220,borderRadius:25,backgroundColor:COLORS.primaryDeep,marginTop:16,overflow:'hidden',flexDirection:'row',...SHADOW}, heroCopy:{flex:1,padding:19,zIndex:2}, heroEyebrow:{fontSize:9,color:COLORS.heroSoft,fontWeight:'900',letterSpacing:1.2}, heroTitle:{fontSize:22,lineHeight:26,color:COLORS.white,fontWeight:'900',marginTop:8}, heroText:{fontSize:10.5,lineHeight:15,color:COLORS.mint,marginTop:8,maxWidth:180}, heroButton:{alignSelf:'flex-start',marginTop:14,backgroundColor:COLORS.white,borderRadius:13,paddingHorizontal:12,paddingVertical:9,flexDirection:'row',alignItems:'center'}, heroButtonText:{fontSize:10.5,color:COLORS.primaryDeep,fontWeight:'900'}, heroArrow:{fontSize:15,color:COLORS.primaryDark,marginLeft:6}, heroImage:{width:142,height:220,opacity:0.92}, sectionHead:{marginTop:23,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',marginBottom:12}, sectionTitle:{fontSize:19,fontWeight:'900',color:COLORS.text}, sectionSub:{fontSize:11.5,color:COLORS.muted,marginTop:3}, today:{fontSize:9,fontWeight:'900',color:COLORS.primaryDark,backgroundColor:COLORS.primarySoft,paddingHorizontal:8,paddingVertical:5,borderRadius:10}, statsRow:{flexDirection:'row',backgroundColor:COLORS.white,borderRadius:20,paddingVertical:13,marginBottom:15,...SHADOW}, stat:{flex:1,alignItems:'center'}, statBorder:{borderRightWidth:1,borderRightColor:COLORS.border}, statIcon:{width:30,height:30,borderRadius:15,backgroundColor:COLORS.mint,alignItems:'center',justifyContent:'center'}, statIconText:{fontSize:14,color:COLORS.primaryDark,fontWeight:'900'}, statNumber:{fontSize:17,fontWeight:'900',color:COLORS.text,marginTop:4}, statLabel:{fontSize:9.5,color:COLORS.muted,marginTop:1,fontWeight:'700'}, footerCard:{backgroundColor:COLORS.white,borderRadius:20,padding:14,marginTop:4,flexDirection:'row',alignItems:'center',...SHADOW}, footerIcon:{width:42,height:42,borderRadius:21,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:11}, footerHeart:{fontSize:21,color:COLORS.primaryDark}, footerTitle:{fontSize:13,fontWeight:'900',color:COLORS.text}, footerText:{fontSize:10.5,color:COLORS.muted,marginTop:3,lineHeight:15}, notificationBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.30)',alignItems:'flex-end',paddingTop:72,paddingRight:12}, notificationCard:{width:'92%',maxWidth:380,backgroundColor:COLORS.white,borderRadius:20,padding:16,...SHADOW}, notificationHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, notificationEyebrow:{fontSize:9,letterSpacing:1.2,color:COLORS.primaryDark,fontWeight:'900'}, notificationTitle:{fontSize:19,color:COLORS.text,fontWeight:'900',marginTop:3}, notificationClose:{width:34,height:34,borderRadius:17,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'}, notificationCloseText:{fontSize:22,color:COLORS.primaryDark}, notificationRow:{flexDirection:'row',paddingVertical:12,borderTopWidth:1,borderTopColor:COLORS.border,marginTop:10}, notificationIcon:{width:36,height:36,borderRadius:14,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:10}, notificationTime:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900'}, notificationBody:{fontSize:11,color:COLORS.text,lineHeight:16,marginTop:3}, noNotifications:{fontSize:12,color:COLORS.muted,lineHeight:18,marginTop:14}
});
