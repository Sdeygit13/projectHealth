import React, {useMemo, useState} from 'react';
import {Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';
import {prepareNotifications, syncReminderNotifications, openReminderAlarmSettings} from '../services/notifications';

function parseTime(time) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return new Date();
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  if (match[3].toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

function formatTime(date) {
  return date.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
}

function firstName(name) {
  return String(name || 'Patient').trim().split(/\s+/)[0] || 'Patient';
}

export default function RemindersScreen({onBack, reminders = [], onRemindersChange, patientName}) {
  const [editor, setEditor] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  const pending = useMemo(() => reminders.filter(item => !item.done).length, [reminders]);
  const completed = reminders.length - pending;
  const notifications = reminders.filter(item => !item.done);

  const toggle = id => {
    onRemindersChange(previous => previous.map(item => item.id === id ? {...item, done: !item.done} : item));
  };

  const openAdd = () => {
    setEditor({
      id: String(Date.now()),
      time: '08:30 PM',
      title: '',
      detail: '',
      icon: 'R',
      done: false,
      isNew: true,
    });
  };

  const openEdit = item => setEditor({...item, isNew: false});

  const saveEditor = async () => {
    if (!editor?.title?.trim()) {
      Alert.alert('Reminder title required', 'Please enter what the patient needs to remember.');
      return;
    }

    const nextItem = {
      id: editor.id,
      time: editor.time,
      title: editor.title.trim(),
      detail: editor.detail?.trim() || 'Smaran reminder',
      icon: editor.title.trim().charAt(0).toUpperCase(),
      done: !!editor.done,
    };

    const nextReminders = editor.isNew
      ? [...reminders, nextItem]
      : reminders.map(item => item.id === nextItem.id ? nextItem : item);

    onRemindersChange(nextReminders);
    setEditor(null);

    await prepareNotifications();
    const notificationReady = await syncReminderNotifications(nextReminders, patientName);
    if (!notificationReady && Platform.OS === 'android') {
      Alert.alert(
        'Allow reminder alarms',
        'Android may require Smaran to be allowed to schedule exact alarms so a 10:00 AM medicine reminder can arrive on time.',
        [
          {text: 'Later', style: 'cancel'},
          {text: 'Open Settings', onPress: openReminderAlarmSettings},
        ],
      );
    }
  };

  const removeEditor = () => {
    if (!editor) return;
    Alert.alert('Delete reminder?', 'This reminder will also stop its scheduled notification.', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', style: 'destructive', onPress: () => {
        onRemindersChange(previous => previous.filter(item => item.id !== editor.id));
        setEditor(null);
      }},
    ]);
  };

  const notificationText = item => `Dear ${firstName(patientName)}, your ${item.title.toLowerCase()} is at ${item.time}${item.detail ? ` ${item.detail.toLowerCase()}` : ''}.`;

  return (
    <View style={styles.screen}>
      <Header
        onBack={onBack}
        title="Your Reminders"
        right={
          <Pressable onPress={() => setNoticeOpen(true)} style={styles.bellButton}>
            <Text style={styles.bell}>🔔</Text>
            {notifications.length > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{Math.min(notifications.length, 9)}</Text></View> : null}
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <View style={styles.summaryIcon}><Text style={styles.summaryIconText}>◷</Text></View>
          <View style={{flex: 1}}>
            <Text style={styles.summaryTitle}>{pending} things left today</Text>
            <Text style={styles.summarySub}>Tap a reminder to complete it. Use the pencil to edit it.</Text>
          </View>
          <View style={styles.progress}><Text style={styles.progressText}>{completed}/{reminders.length || 0}</Text></View>
        </View>

        <Text style={styles.section}>TODAY'S PLAN</Text>

        {reminders.map(item => (
          <View key={item.id} style={[styles.card, item.done && styles.done]}>
            <Pressable onPress={() => toggle(item.id)} style={styles.cardMain}>
              <View style={styles.icon}><Text style={styles.iconText}>{item.icon || item.title?.charAt(0) || 'R'}</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.time}>{item.time}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.detail}>{item.detail}</Text>
              </View>
              <View style={[styles.check, item.done && styles.checkDone]}><Text style={styles.checkText}>{item.done ? '✓' : ''}</Text></View>
            </Pressable>
            <Pressable onPress={() => openEdit(item)} style={styles.editButton} hitSlop={8}>
              <Text style={styles.editIcon}>✎</Text>
            </Pressable>
          </View>
        ))}

        <Pressable onPress={openAdd} style={styles.add}>
          <Text style={styles.addPlus}>＋</Text><Text style={styles.addText}>Add Reminder</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={!!editor} transparent animationType="slide" onRequestClose={() => setEditor(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.editorCard}>
            <View style={styles.modalTop}>
              <View><Text style={styles.modalEyebrow}>{editor?.isNew ? 'NEW REMINDER' : 'EDIT REMINDER'}</Text><Text style={styles.modalTitle}>Make the reminder fit the day</Text></View>
              <Pressable onPress={() => setEditor(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>
            </View>

            <Text style={styles.label}>Reminder title</Text>
            <TextInput value={editor?.title || ''} onChangeText={value => setEditor(previous => ({...previous, title: value}))} placeholder="e.g. Morning medicine" placeholderTextColor={COLORS.muted} style={styles.input} />

            <Text style={styles.label}>Time</Text>
            <Pressable onPress={() => setShowTimePicker(true)} style={styles.timeInput}><Text style={styles.timeInputText}>{editor?.time || 'Choose time'}</Text><Text style={styles.timeArrow}>⌄</Text></Pressable>

            {showTimePicker ? <DateTimePicker value={parseTime(editor?.time)} mode="time" is24Hour={false} onChange={(event, date) => {setShowTimePicker(false); if (date) setEditor(previous => ({...previous, time: formatTime(date)}));}} /> : null}

            <Text style={styles.label}>Details</Text>
            <TextInput value={editor?.detail || ''} onChangeText={value => setEditor(previous => ({...previous, detail: value}))} placeholder="e.g. Before breakfast" placeholderTextColor={COLORS.muted} style={[styles.input, styles.detailInput]} multiline />

            <View style={styles.notificationPreview}>
              <Text style={styles.previewIcon}>🔔</Text>
              <View style={{flex: 1}}><Text style={styles.previewTitle}>Notification preview</Text><Text style={styles.previewText}>{editor ? notificationText(editor) : ''}</Text></View>
            </View>

            <Pressable onPress={saveEditor} style={styles.saveButton}><Text style={styles.saveButtonText}>Save Reminder</Text><Text style={styles.saveArrow}>→</Text></Pressable>
            {!editor?.isNew ? <Pressable onPress={removeEditor} style={styles.deleteButton}><Text style={styles.deleteText}>Delete reminder</Text></Pressable> : null}
          </View>
        </View>
      </Modal>

      <Modal visible={noticeOpen} transparent animationType="fade" onRequestClose={() => setNoticeOpen(false)}>
        <Pressable style={styles.noticeBackdrop} onPress={() => setNoticeOpen(false)}>
          <Pressable style={styles.noticeCard} onPress={() => {}}>
            <View style={styles.noticeHeader}><Text style={styles.noticeTitle}>Smaran notifications</Text><Pressable onPress={() => setNoticeOpen(false)}><Text style={styles.closeText}>×</Text></Pressable></View>
            {notifications.length ? notifications.map(item => <View key={item.id} style={styles.noticeRow}><View style={styles.noticeDot}><Text style={styles.noticeDotText}>🔔</Text></View><View style={{flex: 1}}><Text style={styles.noticeTime}>{item.time}</Text><Text style={styles.noticeText}>{notificationText(item)}</Text></View></View>) : <Text style={styles.emptyNotice}>You're all caught up. No pending reminder notifications.</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background}, content:{padding:16,paddingBottom:30}, summary:{backgroundColor:COLORS.primaryDeep,borderRadius:21,padding:16,flexDirection:'row',alignItems:'center',...SHADOW}, summaryIcon:{width:48,height:48,borderRadius:17,backgroundColor:'rgba(255,255,255,0.14)',alignItems:'center',justifyContent:'center',marginRight:12}, summaryIconText:{fontSize:26,color:COLORS.white}, summaryTitle:{fontSize:17,fontWeight:'900',color:COLORS.white}, summarySub:{fontSize:10.5,color:COLORS.mint,marginTop:4,lineHeight:15}, progress:{width:43,height:43,borderRadius:22,backgroundColor:COLORS.white,alignItems:'center',justifyContent:'center'}, progressText:{fontSize:11,color:COLORS.primaryDark,fontWeight:'900'}, section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2,marginTop:22,marginBottom:10}, card:{backgroundColor:COLORS.white,borderRadius:18,padding:13,marginBottom:10,flexDirection:'row',alignItems:'center',...SHADOW}, cardMain:{flex:1,flexDirection:'row',alignItems:'center'}, done:{opacity:0.55}, icon:{width:48,height:48,borderRadius:16,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:11}, iconText:{fontSize:16,color:COLORS.primaryDark,fontWeight:'900'}, time:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900'}, title:{fontSize:15.5,color:COLORS.text,fontWeight:'900',marginTop:2}, detail:{fontSize:11,color:COLORS.muted,marginTop:2}, check:{width:27,height:27,borderRadius:14,borderWidth:2,borderColor:COLORS.primary,alignItems:'center',justifyContent:'center',marginLeft:8}, checkDone:{backgroundColor:COLORS.primary}, checkText:{color:COLORS.white,fontWeight:'900'}, editButton:{width:36,height:36,borderRadius:18,backgroundColor:COLORS.mint,alignItems:'center',justifyContent:'center',marginLeft:8}, editIcon:{fontSize:18,color:COLORS.primaryDark,fontWeight:'900'}, add:{height:54,borderRadius:17,borderWidth:1.5,borderColor:COLORS.primary,borderStyle:'dashed',alignItems:'center',justifyContent:'center',flexDirection:'row',marginTop:2}, addPlus:{fontSize:20,color:COLORS.primaryDark}, addText:{color:COLORS.primaryDark,fontSize:15,fontWeight:'900',marginLeft:6}, bellButton:{width:44,height:44,borderRadius:14,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'}, bell:{fontSize:22,color:COLORS.primaryDark,fontWeight:'900'}, badge:{position:'absolute',right:-2,top:-2,minWidth:18,height:18,borderRadius:9,backgroundColor:COLORS.danger,alignItems:'center',justifyContent:'center',paddingHorizontal:4}, badgeText:{fontSize:9,color:COLORS.white,fontWeight:'900'}, modalBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.42)',justifyContent:'flex-end'}, editorCard:{backgroundColor:COLORS.white,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:30}, modalTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}, modalEyebrow:{fontSize:10,letterSpacing:1.3,color:COLORS.primaryDark,fontWeight:'900'}, modalTitle:{fontSize:21,lineHeight:27,color:COLORS.text,fontWeight:'900',marginTop:4,maxWidth:300}, close:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'}, closeText:{fontSize:24,color:COLORS.primaryDark,lineHeight:25}, label:{fontSize:12.5,color:COLORS.text,fontWeight:'900',marginTop:18,marginBottom:7}, input:{height:52,borderRadius:15,borderWidth:1.2,borderColor:COLORS.border,backgroundColor:COLORS.white,paddingHorizontal:14,fontSize:15,color:COLORS.text,fontWeight:'700'}, detailInput:{height:82,textAlignVertical:'top',paddingTop:13}, timeInput:{height:52,borderRadius:15,borderWidth:1.2,borderColor:COLORS.border,backgroundColor:COLORS.mint,paddingHorizontal:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, timeInputText:{fontSize:15,color:COLORS.text,fontWeight:'900'}, timeArrow:{fontSize:18,color:COLORS.primaryDark}, notificationPreview:{marginTop:17,padding:13,borderRadius:16,backgroundColor:COLORS.mint,flexDirection:'row',alignItems:'flex-start'}, previewIcon:{fontSize:20,color:COLORS.primaryDark,marginRight:10}, previewTitle:{fontSize:11,color:COLORS.primaryDark,fontWeight:'900'}, previewText:{fontSize:11,color:COLORS.text,lineHeight:16,marginTop:3}, saveButton:{height:54,borderRadius:17,backgroundColor:COLORS.primary,marginTop:18,alignItems:'center',justifyContent:'center',flexDirection:'row'}, saveButtonText:{fontSize:15,color:COLORS.white,fontWeight:'900'}, saveArrow:{fontSize:20,color:COLORS.white,marginLeft:9}, deleteButton:{height:44,alignItems:'center',justifyContent:'center',marginTop:5}, deleteText:{fontSize:12,color:COLORS.danger,fontWeight:'900'}, noticeBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.32)',alignItems:'flex-end',paddingTop:75,paddingRight:12}, noticeCard:{width:'90%',backgroundColor:COLORS.white,borderRadius:20,padding:16,...SHADOW}, noticeHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}, noticeTitle:{fontSize:16,color:COLORS.text,fontWeight:'900'}, noticeRow:{flexDirection:'row',paddingVertical:11,borderTopWidth:1,borderTopColor:COLORS.border}, noticeDot:{width:30,height:30,borderRadius:15,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:10}, noticeDotText:{fontSize:22,color:COLORS.primaryDark,lineHeight:22}, noticeTime:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900'}, noticeText:{fontSize:11,color:COLORS.text,lineHeight:16,marginTop:3}, emptyNotice:{fontSize:12,color:COLORS.muted,lineHeight:18,paddingVertical:12}
});
