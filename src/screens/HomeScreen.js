import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import BottomNav from '../components/BottomNav';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import {COLORS, SHADOW} from '../theme';

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) return 'Good morning!';
  if (hour >= 12 && hour < 17) return 'Good afternoon!';
  if (hour >= 17 && hour < 21) return 'Good evening!';
  return 'Good evening!';
}

function firstName(value) {
  const name = String(value || 'Patient').trim();
  return name ? name.split(/\s+/)[0] : 'Patient';
}

function formatDateTime(date) {
  const datePart = date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
}

const FEATURE_DATA = [
  {
    key: 'daily',
    icon: 'clipboard-check',
    title: 'Your Daily Task',
    subtitle: 'Cognitive memory activities',
    background: COLORS.primarySoft,
    route: 'games',
  },
  {
    key: 'garden',
    icon: 'cloud',
    title: 'Memory Garden',
    subtitle: 'Memory Assistant Test',
    background: '#F5DDDD',
    route: 'games',
  },
  {
    key: 'lane',
    icon: 'route',
    title: 'Take a Trip Down Your Memory Lane',
    subtitle: 'Familiar moments & memories',
    background: '#DCECF2',
    route: 'photos',
  },
  {
    key: 'scheduled',
    icon: 'calendar-days',
    title: 'Scheduled',
    subtitle: 'Your daily routine',
    background: '#F5E6C7',
    route: 'reminders',
  },
];

export default function HomeScreen({
  patientName,
  name,
  onNavigate,
  reminders = [],
  onToggleReminder,
}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const patientFirstName = firstName(patientName || name);
  const safeReminders = useMemo(
    () => (Array.isArray(reminders) ? reminders.filter(Boolean) : []),
    [reminders],
  );
  const pendingCount = useMemo(
    () => safeReminders.filter(item => !item.done).length,
    [safeReminders],
  );
  const completedCount = safeReminders.length - pendingCount;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* =========================================================
            TOP HEADER — logo + redesigned notification bell
            Guardian Mode intentionally removed from Home.
           ========================================================= */}
        <View style={styles.header}>
          <View style={styles.logoArea}>
            <Logo size={47} />
          </View>

          <Pressable
            onPress={() => onNavigate?.('reminders')}
            style={({pressed}) => [styles.notificationButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Open reminders">
            <View style={styles.bellIconWrap}>
              <Icon name="bell" size={29} color={COLORS.primaryDark} strokeWidth={2.15} />
              {pendingCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{Math.min(pendingCount, 9)}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>

        {/* =========================================================
            GREETING + REAL-TIME DATE/TIME
           ========================================================= */}
        <View style={styles.greetingSection}>
          <View style={styles.greetingTextArea}>
            <Text style={styles.greeting}>{greetingFor(now.getHours())}</Text>
            <Text style={styles.patientName}>{patientFirstName}</Text>
            <Text style={styles.dateTime}>{formatDateTime(now)}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{patientFirstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* =========================================================
            SENIOR-DEVELOPER FEATURE GRID — keep these four cards.
           ========================================================= */}
        <View style={styles.featureGrid}>
          {FEATURE_DATA.map(item => (
            <FeatureTile
              key={item.key}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              background={item.background}
              onPress={() => onNavigate?.(item.route)}
            />
          ))}
        </View>

        {/* =========================================================
            GREAT JOB — restored and tappable.
           ========================================================= */}
        <Pressable
          onPress={() => onNavigate?.('reminders')}
          style={({pressed}) => [styles.progressBanner, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open today's reminders and task progress">
          <View style={styles.progressIcon}>
            <Icon name="heart" size={28} color={COLORS.primaryDark} strokeWidth={2.1} />
          </View>
          <View style={styles.progressTextArea}>
            <Text style={styles.progressTitle}>
              {pendingCount === 0 && safeReminders.length > 0
                ? 'Great job! You completed all tasks today.'
                : `Great job! You completed ${completedCount} of ${safeReminders.length || 0} tasks today.`}
            </Text>
            <Text style={styles.progressSub}>Tap to view and manage your full daily plan.</Text>
          </View>
          <Text style={styles.bannerArrow}>›</Text>
        </Pressable>

        {/* =========================================================
            TODAY'S PLAN — restored and interactive.
           ========================================================= */}
        <View style={styles.planHeader}>
          <Text style={styles.planTitle}>Today&apos;s Plan</Text>
          <Pressable
            onPress={() => onNavigate?.('reminders')}
            style={styles.scheduleLink}
            accessibilityRole="button"
            accessibilityLabel="View full schedule">
            <Icon name="calendar-days" size={17} color={COLORS.primaryDark} strokeWidth={2.1} />
            <Text style={styles.scheduleLinkText}>View Full Schedule</Text>
          </Pressable>
        </View>

        {safeReminders.length === 0 ? (
          <Pressable
            onPress={() => onNavigate?.('reminders')}
            style={({pressed}) => [styles.emptyPlan, pressed && styles.pressed]}>
            <Icon name="calendar-days" size={26} color={COLORS.primaryDark} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text style={styles.emptyPlanTitle}>No reminders yet</Text>
              <Text style={styles.emptyPlanText}>Add a reminder to build today&apos;s plan.</Text>
            </View>
            <Text style={styles.bannerArrow}>›</Text>
          </Pressable>
        ) : (
          safeReminders.map(item => (
            <View key={item.id} style={[styles.planCard, item.done && styles.planCardDone]}>
              <View style={[styles.planIcon, item.done && styles.planIconDone]}>
                <Icon name="clock" size={23} color={COLORS.primaryDark} strokeWidth={2.1} />
              </View>
              <Pressable
                onPress={() => onToggleReminder?.(item.id)}
                style={styles.planMain}
                accessibilityRole="button"
                accessibilityLabel={`${item.done ? 'Completed' : 'Pending'} ${item.title} at ${item.time}`}>
                <Text style={styles.planTime}>{item.time}</Text>
                <Text style={[styles.planItemTitle, item.done && styles.planItemTitleDone]}>{item.title}</Text>
                <Text style={styles.planDetail}>{item.detail || 'Smaran reminder'}</Text>
              </Pressable>
              <Pressable
                onPress={() => onToggleReminder?.(item.id)}
                style={[styles.doneButton, item.done && styles.doneButtonActive]}
                accessibilityRole="button"
                accessibilityLabel={item.done ? `Mark ${item.title} as pending` : `Mark ${item.title} as done`}>
                <Text style={[styles.doneButtonText, item.done && styles.doneButtonTextActive]}>
                  {item.done ? '✓ Done' : 'Mark Done'}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.bottomNavigationWrapper}>
        <BottomNav active="home" onNavigate={onNavigate} />
      </View>
    </View>
  );
}

function FeatureTile({icon, title, subtitle, background, onPress}) {
  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.featureTile, pressed && styles.pressed]}>
      <View style={[styles.featureIconCircle, {backgroundColor: background}]}>
        <Icon name={icon} size={24} color={COLORS.primaryDark} strokeWidth={2.15} />
      </View>
      <View style={styles.featureTileContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.featureArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  scroll: {flex: 1},
  content: {paddingHorizontal: 14, paddingTop: 8, paddingBottom: 24},

  header: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoArea: {flex: 1, justifyContent: 'center'},
  notificationButton: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  bellIconWrap: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  notificationBadge: {
    position: 'absolute',
    right: -1,
    top: -1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  notificationBadgeText: {color: COLORS.white, fontSize: 9, fontWeight: '900'},

  greetingSection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingTextArea: {flex: 1, paddingRight: 10},
  greeting: {fontSize: 17, color: COLORS.muted, fontWeight: '800'},
  patientName: {marginTop: 2, fontSize: 34, lineHeight: 39, color: COLORS.text, fontWeight: '900'},
  dateTime: {marginTop: 5, fontSize: 10.5, color: COLORS.primaryDark, fontWeight: '800'},
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 24, color: COLORS.primaryDark, fontWeight: '900'},

  featureGrid: {
    marginTop: 19,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 11,
  },
  featureTile: {
    width: '48.2%',
    minHeight: 145,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    padding: 14,
    ...SHADOW,
  },
  featureIconCircle: {width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  featureTileContent: {flex: 1, marginTop: 12, paddingRight: 5},
  featureTitle: {fontSize: 14, lineHeight: 18, color: COLORS.text, fontWeight: '900'},
  featureSubtitle: {marginTop: 4, fontSize: 10.5, lineHeight: 14, color: COLORS.muted},
  featureArrow: {position: 'absolute', right: 14, bottom: 10, fontSize: 21, color: COLORS.primaryDark, fontWeight: '700'},

  progressBanner: {
    marginTop: 18,
    minHeight: 96,
    borderRadius: 21,
    backgroundColor: '#E2F1D6',
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },
  progressIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#D8EAC9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTextArea: {flex: 1, marginLeft: 12, paddingRight: 8},
  progressTitle: {fontSize: 14, lineHeight: 19, color: COLORS.primaryDark, fontWeight: '900'},
  progressSub: {marginTop: 3, fontSize: 9.5, lineHeight: 14, color: COLORS.muted, fontWeight: '700'},
  bannerArrow: {fontSize: 29, color: COLORS.primaryDark, fontWeight: '500'},

  planHeader: {
    marginTop: 24,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planTitle: {fontSize: 27, color: COLORS.text, fontWeight: '900'},
  scheduleLink: {flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingLeft: 8},
  scheduleLinkText: {marginLeft: 5, fontSize: 11, color: COLORS.primaryDark, fontWeight: '900'},

  planCard: {
    minHeight: 118,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    padding: 13,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },
  planCardDone: {opacity: 0.9},
  planIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planIconDone: {backgroundColor: '#DDEAD4'},
  planMain: {flex: 1, marginLeft: 12, paddingRight: 8},
  planTime: {fontSize: 11, color: COLORS.muted, fontWeight: '800'},
  planItemTitle: {marginTop: 3, fontSize: 20, color: COLORS.text, fontWeight: '900'},
  planItemTitleDone: {textDecorationLine: 'line-through'},
  planDetail: {marginTop: 2, fontSize: 10.5, lineHeight: 15, color: COLORS.muted},
  doneButton: {
    minWidth: 82,
    minHeight: 47,
    borderRadius: 15,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  doneButtonActive: {backgroundColor: '#A9BEA0'},
  doneButtonText: {fontSize: 10.5, color: COLORS.primaryDark, fontWeight: '900', textAlign: 'center'},
  doneButtonTextActive: {color: COLORS.white},

  emptyPlan: {
    minHeight: 92,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },
  emptyPlanTitle: {fontSize: 14, color: COLORS.text, fontWeight: '900'},
  emptyPlanText: {fontSize: 10.5, color: COLORS.muted, marginTop: 3},

  pressed: {opacity: 0.78, transform: [{scale: 0.99}]},
  bottomNavigationWrapper: {backgroundColor: COLORS.background},
});
