import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';
import {
  prepareNotifications,
  syncReminderNotifications,
  openReminderAlarmSettings,
} from '../services/notifications';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function parseTime(time) {
  const match = String(time || '').match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  );

  const date = new Date();

  if (!match) {
    date.setHours(20, 30, 0, 0);
    return date;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    date.setHours(20, 30, 0, 0);
    return date;
  }

  const period = match[3].toUpperCase();

  if (period === 'PM' && hour !== 12) {
    hour += 12;
  }

  if (period === 'AM' && hour === 12) {
    hour = 0;
  }

  date.setHours(hour, minute, 0, 0);

  return date;
}

function formatTime(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '08:30 PM';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function firstName(name) {
  const value = String(name || '').trim();

  if (!value) {
    return 'Patient';
  }

  return value.split(/\s+/)[0] || 'Patient';
}

function createReminderId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeReminder(item) {
  if (!item) {
    return null;
  }

  const title = String(item.title || '').trim();

  if (!title) {
    return null;
  }

  return {
    id: String(item.id || createReminderId()),
    time: String(item.time || '08:30 PM'),
    title,
    detail:
      String(item.detail || '').trim() || 'Smaran reminder',
    icon:
      String(item.icon || title.charAt(0) || 'R')
        .charAt(0)
        .toUpperCase(),
    done: Boolean(item.done),
  };
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function RemindersScreen({
  onBack,
  reminders = [],
  onRemindersChange,
  patientName,
}) {
  const [editor, setEditor] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const safeReminders = useMemo(
    () =>
      Array.isArray(reminders)
        ? reminders.map(normalizeReminder).filter(Boolean)
        : [],
    [reminders],
  );

  const pending = useMemo(
    () => safeReminders.filter(item => !item.done).length,
    [safeReminders],
  );

  const completed = useMemo(
    () => safeReminders.filter(item => item.done).length,
    [safeReminders],
  );

  const notifications = useMemo(
    () => safeReminders.filter(item => !item.done),
    [safeReminders],
  );

  /* ------------------------------------------------------------------------ */
  /* Notification synchronization                                             */
  /* ------------------------------------------------------------------------ */

  const syncNotifications = async nextReminders => {
    try {
      await prepareNotifications();

      const notificationReady = await syncReminderNotifications(
        nextReminders,
        patientName,
      );

      if (!notificationReady && Platform.OS === 'android') {
        Alert.alert(
          'Allow reminder alarms',
          'Android may require Smaran to be allowed to schedule exact alarms so medicine and other reminders can arrive on time.',
          [
            {
              text: 'Later',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                try {
                  openReminderAlarmSettings();
                } catch (error) {
                  console.warn(
                    'Unable to open reminder alarm settings:',
                    error,
                  );
                }
              },
            },
          ],
        );
      }

      return notificationReady;
    } catch (error) {
      console.warn('Reminder notification sync failed:', error);
      return false;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Initial notification sync                                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!safeReminders.length) {
      return;
    }

    syncNotifications(safeReminders);
  }, []);

  /* ------------------------------------------------------------------------ */
  /* Toggle reminder                                                           */
  /* ------------------------------------------------------------------------ */

  const toggle = async id => {
    const nextReminders = safeReminders.map(item =>
      item.id === id
        ? {
            ...item,
            done: !item.done,
          }
        : item,
    );

    if (typeof onRemindersChange === 'function') onRemindersChange(nextReminders);

    await syncNotifications(nextReminders);
  };

  /* ------------------------------------------------------------------------ */
  /* Add reminder                                                              */
  /* ------------------------------------------------------------------------ */

  const openAdd = () => {
    setShowTimePicker(false);

    setEditor({
      id: createReminderId(),
      time: '08:30 PM',
      title: '',
      detail: '',
      icon: 'R',
      done: false,
      isNew: true,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Edit reminder                                                             */
  /* ------------------------------------------------------------------------ */

  const openEdit = item => {
    setShowTimePicker(false);

    setEditor({
      ...item,
      isNew: false,
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Save reminder                                                             */
  /* ------------------------------------------------------------------------ */

  const saveEditor = async () => {
    if (saving) {
      return;
    }

    if (!editor?.title?.trim()) {
      Alert.alert(
        'Reminder title required',
        'Please enter what the patient needs to remember.',
      );
      return;
    }

    const title = editor.title.trim();

    const nextItem = {
      id: String(editor.id || createReminderId()),
      time: editor.time || '08:30 PM',
      title,
      detail: editor.detail?.trim() || 'Smaran reminder',
      icon: title.charAt(0).toUpperCase(),
      done: Boolean(editor.done),
    };

    const nextReminders = editor.isNew
      ? [...safeReminders, nextItem]
      : safeReminders.map(item =>
          item.id === nextItem.id ? nextItem : item,
        );

    try {
      setSaving(true);

      if (typeof onRemindersChange === 'function') onRemindersChange(nextReminders);
      setEditor(null);
      setShowTimePicker(false);

      await syncNotifications(nextReminders);
    } catch (error) {
      console.warn('Unable to save reminder:', error);
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Delete reminder                                                           */
  /* ------------------------------------------------------------------------ */

  const removeEditor = () => {
    if (!editor || saving) {
      return;
    }

    Alert.alert(
      'Delete reminder?',
      'This reminder will also stop its scheduled notification.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const nextReminders = safeReminders.filter(
              item => item.id !== editor.id,
            );

            try {
              setSaving(true);

              if (typeof onRemindersChange === 'function') onRemindersChange(nextReminders);
              setEditor(null);
              setShowTimePicker(false);

              await syncNotifications(nextReminders);
            } catch (error) {
              console.warn('Unable to delete reminder:', error);
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  /* ------------------------------------------------------------------------ */
  /* Notification preview                                                      */
  /* ------------------------------------------------------------------------ */

  const notificationText = item => {
    if (!item) {
      return '';
    }

    const name = firstName(patientName);
    const title = String(item.title || 'reminder').toLowerCase();
    const time = item.time || '08:30 PM';
    const detail = String(item.detail || '').trim();

    return `Dear ${name}, your ${title} is at ${time}${
      detail ? ` ${detail.toLowerCase()}` : ''
    }.`;
  };

  /* ------------------------------------------------------------------------ */
  /* Time picker                                                               */
  /* ------------------------------------------------------------------------ */

  const handleTimeChange = (event, date) => {
    setShowTimePicker(false);

    if (event?.type === 'dismissed') {
      return;
    }

    if (!date) {
      return;
    }

    setEditor(previous => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        time: formatTime(date),
      };
    });
  };

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <View style={styles.screen}>
      <Header
        onBack={onBack}
        title="Your Reminders"
        right={
          <Pressable
            onPress={() => setNoticeOpen(true)}
            style={styles.bellButton}
            accessibilityRole="button"
            accessibilityLabel="Open reminder notifications">
            <Text style={styles.bell}>🔔</Text>

            {notifications.length > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {Math.min(notifications.length, 9)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Text style={styles.summaryIconText}>◷</Text>
          </View>

          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>
              {pending} {pending === 1 ? 'thing' : 'things'} left today
            </Text>

            <Text style={styles.summarySub}>
              Tap a reminder to complete it. Use the pencil to edit it.
            </Text>
          </View>

          <View style={styles.progress}>
            <Text style={styles.progressText}>
              {completed}/{safeReminders.length}
            </Text>
          </View>
        </View>

        {/* Section */}
        <Text style={styles.section}>TODAY&apos;S PLAN</Text>

        {/* Empty state */}
        {safeReminders.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>◷</Text>
            </View>

            <Text style={styles.emptyTitle}>
              No reminders yet
            </Text>

            <Text style={styles.emptyText}>
              Add a medicine, appointment, hydration, or daily-care reminder
              to keep the day on track.
            </Text>

            <Pressable
              onPress={openAdd}
              style={styles.emptyAddButton}
              accessibilityRole="button">
              <Text style={styles.emptyAddButtonText}>
                Add First Reminder
              </Text>
            </Pressable>
          </View>
        ) : (
          safeReminders.map(item => (
            <View
              key={item.id}
              style={[styles.card, item.done && styles.done]}>
              <Pressable
                onPress={() => toggle(item.id)}
                style={styles.cardMain}
                accessibilityRole="button"
                accessibilityLabel={`${
                  item.done ? 'Completed' : 'Pending'
                } reminder: ${item.title}, ${item.time}`}>
                <View style={styles.icon}>
                  <Text style={styles.iconText}>
                    {item.icon ||
                      item.title?.charAt(0)?.toUpperCase() ||
                      'R'}
                  </Text>
                </View>

                <View style={styles.cardText}>
                  <Text style={styles.time}>{item.time}</Text>

                  <Text
                    style={[
                      styles.title,
                      item.done && styles.doneTitle,
                    ]}>
                    {item.title}
                  </Text>

                  <Text style={styles.detail}>
                    {item.detail}
                  </Text>
                </View>

                <View
                  style={[
                    styles.check,
                    item.done && styles.checkDone,
                  ]}>
                  <Text style={styles.checkText}>
                    {item.done ? '✓' : ''}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => openEdit(item)}
                style={styles.editButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.title}`}>
                <Text style={styles.editIcon}>✎</Text>
              </Pressable>
            </View>
          ))
        )}

        {/* Add reminder */}
        {safeReminders.length > 0 ? (
          <Pressable
            onPress={openAdd}
            style={styles.add}
            accessibilityRole="button"
            accessibilityLabel="Add reminder">
            <Text style={styles.addPlus}>＋</Text>
            <Text style={styles.addText}>Add Reminder</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {/* ------------------------------------------------------------------ */}
      {/* Reminder Editor                                                     */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        visible={!!editor}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!saving) {
            setShowTimePicker(false);
            setEditor(null);
          }
        }}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.editorCard}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.editorScrollContent}>
              <View style={styles.modalTop}>
                <View style={styles.modalHeading}>
                  <Text style={styles.modalEyebrow}>
                    {editor?.isNew
                      ? 'NEW REMINDER'
                      : 'EDIT REMINDER'}
                  </Text>

                  <Text style={styles.modalTitle}>
                    Make the reminder fit the day
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    if (!saving) {
                      setShowTimePicker(false);
                      setEditor(null);
                    }
                  }}
                  style={styles.close}
                  accessibilityRole="button"
                  accessibilityLabel="Close reminder editor">
                  <Text style={styles.closeText}>×</Text>
                </Pressable>
              </View>

              {/* Title */}
              <Text style={styles.label}>Reminder title</Text>

              <TextInput
                value={editor?.title || ''}
                onChangeText={value =>
                  setEditor(previous => ({
                    ...previous,
                    title: value,
                  }))
                }
                placeholder="e.g. Morning medicine"
                placeholderTextColor={COLORS.muted}
                style={styles.input}
                maxLength={80}
                editable={!saving}
                returnKeyType="next"
              />

              {/* Time */}
              <Text style={styles.label}>Time</Text>

              <Pressable
                onPress={() => {
                  if (!saving) {
                    setShowTimePicker(true);
                  }
                }}
                style={styles.timeInput}
                accessibilityRole="button"
                accessibilityLabel={`Reminder time ${
                  editor?.time || 'Choose time'
                }`}>
                <Text style={styles.timeInputText}>
                  {editor?.time || 'Choose time'}
                </Text>

                <Text style={styles.timeArrow}>⌄</Text>
              </Pressable>

              {showTimePicker ? (
                <DateTimePicker
                  value={parseTime(editor?.time)}
                  mode="time"
                  is24Hour={false}
                  display={
                    Platform.OS === 'ios'
                      ? 'spinner'
                      : 'default'
                  }
                  onChange={handleTimeChange}
                />
              ) : null}

              {/* Details */}
              <Text style={styles.label}>Details</Text>

              <TextInput
                value={editor?.detail || ''}
                onChangeText={value =>
                  setEditor(previous => ({
                    ...previous,
                    detail: value,
                  }))
                }
                placeholder="e.g. Before breakfast"
                placeholderTextColor={COLORS.muted}
                style={[styles.input, styles.detailInput]}
                multiline
                maxLength={180}
                editable={!saving}
                textAlignVertical="top"
              />

              {/* Notification preview */}
              <View style={styles.notificationPreview}>
                <Text style={styles.previewIcon}>🔔</Text>

                <View style={styles.previewContent}>
                  <Text style={styles.previewTitle}>
                    Notification preview
                  </Text>

                  <Text style={styles.previewText}>
                    {editor ? notificationText(editor) : ''}
                  </Text>
                </View>
              </View>

              {/* Save */}
              <Pressable
                onPress={saveEditor}
                disabled={saving}
                style={[
                  styles.saveButton,
                  saving && styles.saveButtonDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Save reminder">
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : 'Save Reminder'}
                </Text>

                {!saving ? (
                  <Text style={styles.saveArrow}>→</Text>
                ) : null}
              </Pressable>

              {/* Delete */}
              {!editor?.isNew ? (
                <Pressable
                  onPress={removeEditor}
                  disabled={saving}
                  style={styles.deleteButton}
                  accessibilityRole="button"
                  accessibilityLabel="Delete reminder">
                  <Text
                    style={[
                      styles.deleteText,
                      saving && styles.disabledDeleteText,
                    ]}>
                    Delete reminder
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* Notifications                                                       */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        visible={noticeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNoticeOpen(false)}>
        <Pressable
          style={styles.noticeBackdrop}
          onPress={() => setNoticeOpen(false)}>
          <Pressable
            style={styles.noticeCard}
            onPress={() => {}}
            accessibilityRole="dialog">
            <View style={styles.noticeHeader}>
              <Text style={styles.noticeTitle}>
                Smaran notifications
              </Text>

              <Pressable
                onPress={() => setNoticeOpen(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close notifications">
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {notifications.length ? (
              notifications.map(item => (
                <View
                  key={item.id}
                  style={styles.noticeRow}>
                  <View style={styles.noticeDot}>
                    <Text style={styles.noticeDotText}>🔔</Text>
                  </View>

                  <View style={styles.noticeContent}>
                    <Text style={styles.noticeTime}>
                      {item.time}
                    </Text>

                    <Text style={styles.noticeText}>
                      {notificationText(item)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyNotice}>
                You&apos;re all caught up. No pending reminder
                notifications.
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  summary: {
    backgroundColor: COLORS.primaryDeep,
    borderRadius: 21,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryIconText: {
    fontSize: 26,
    color: COLORS.white,
  },

  summaryTextContainer: {
    flex: 1,
    paddingRight: 8,
  },

  summaryTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.white,
  },

  summarySub: {
    fontSize: 10.5,
    color: COLORS.mint,
    marginTop: 4,
    lineHeight: 15,
  },

  progress: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  section: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginTop: 22,
    marginBottom: 10,
  },

  /* Empty state */

  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    ...SHADOW,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  emptyIconText: {
    fontSize: 30,
    color: COLORS.primaryDark,
  },

  emptyTitle: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '900',
  },

  emptyText: {
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 300,
  },

  emptyAddButton: {
    minHeight: 46,
    paddingHorizontal: 20,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
  },

  emptyAddButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
  },

  /* Reminder cards */

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },

  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  done: {
    opacity: 0.55,
  },

  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  iconText: {
    fontSize: 16,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  cardText: {
    flex: 1,
    minWidth: 0,
  },

  time: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  title: {
    fontSize: 15.5,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 2,
  },

  doneTitle: {
    textDecorationLine: 'line-through',
  },

  detail: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  check: {
    width: 27,
    height: 27,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  checkDone: {
    backgroundColor: COLORS.primary,
  },

  checkText: {
    color: COLORS.white,
    fontWeight: '900',
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  editIcon: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  /* Add button */

  add: {
    height: 54,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 2,
  },

  addPlus: {
    fontSize: 20,
    color: COLORS.primaryDark,
  },

  addText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 6,
  },

  /* Bell */

  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bell: {
    fontSize: 22,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  badge: {
    position: 'absolute',
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '900',
  },

  /* Editor modal */

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.42)',
    justifyContent: 'flex-end',
  },

  editorCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
  },

  editorScrollContent: {
    padding: 20,
    paddingBottom: 30,
  },

  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  modalHeading: {
    flex: 1,
    paddingRight: 12,
  },

  modalEyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  modalTitle: {
    fontSize: 21,
    lineHeight: 27,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 4,
    maxWidth: 300,
  },

  close: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    fontSize: 24,
    color: COLORS.primaryDark,
    lineHeight: 25,
  },

  label: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 7,
  },

  input: {
    minHeight: 52,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '700',
  },

  detailInput: {
    height: 82,
    paddingTop: 13,
  },

  timeInput: {
    height: 52,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.mint,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeInputText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  timeArrow: {
    fontSize: 18,
    color: COLORS.primaryDark,
  },

  /* Notification preview */

  notificationPreview: {
    marginTop: 17,
    padding: 13,
    borderRadius: 16,
    backgroundColor: COLORS.mint,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  previewIcon: {
    fontSize: 20,
    color: COLORS.primaryDark,
    marginRight: 10,
  },

  previewContent: {
    flex: 1,
  },

  previewTitle: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  previewText: {
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 16,
    marginTop: 3,
  },

  /* Save */

  saveButton: {
    height: 54,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    fontSize: 15,
    color: COLORS.white,
    fontWeight: '900',
  },

  saveArrow: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: 9,
  },

  deleteButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  deleteText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '900',
  },

  disabledDeleteText: {
    opacity: 0.5,
  },

  /* Notification popup */

  noticeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'flex-end',
    paddingTop: 75,
    paddingRight: 12,
  },

  noticeCard: {
    width: '90%',
    maxHeight: '75%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    ...SHADOW,
  },

  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  noticeTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '900',
  },

  noticeRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  noticeDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  noticeDotText: {
    fontSize: 22,
    color: COLORS.primaryDark,
    lineHeight: 22,
  },

  noticeContent: {
    flex: 1,
  },

  noticeTime: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  noticeText: {
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 16,
    marginTop: 3,
  },

  emptyNotice: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
    paddingVertical: 12,
  },
});