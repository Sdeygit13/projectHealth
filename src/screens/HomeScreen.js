import React, {useEffect, useMemo, useState} from 'react';
import {
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Icon from '../components/Icon';
import {COLORS, SHADOW} from '../theme';
import {
  SmaranAnimated,
  SmaranPressable,
} from '../components/SmaranMotion';

const HOME_BACKGROUND = '#FEF7E8';

const FEATURE_DATA = [
  {
    key: 'daily',
    icon: 'clipboard-check',
    title: 'Your Daily Task',
    subtitle: 'Cognitive Memory Game (0/5)',
    background: COLORS.primarySoft,
    route: 'games',
  },
  {
    key: 'garden',
    icon: 'cloud',
    title: 'Memory Garden',
    subtitle: 'Memory Assistant',
    background: '#F6DCDD',
    route: 'talk',
  },
  {
    key: 'lane',
    icon: 'route',
    title: 'Take a Trip Down Your Memory Lane',
    subtitle: 'Your Past Memories',
    background: '#DCECF2',
    route: 'photos',
  },
  {
    key: 'scheduled',
    icon: 'calendar-days',
    title: 'Scheduled',
    subtitle: 'Your Daily Routine',
    background: '#F5E6C7',
    route: 'reminders',
  },
];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function greetingFor(hour) {
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  }

  return 'Good Evening';
}

function isDaytime(hour) {
  return hour >= 6 && hour < 18;
}

function firstName(value) {
  const name = String(value || 'Patient').trim();

  if (!name) {
    return 'Patient';
  }

  return name.split(/\s+/)[0];
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/* Home Screen                                                                */
/* -------------------------------------------------------------------------- */

export default function HomeScreen({
  patientName,
  name,
  onNavigate,
  reminders = [],
  onToggleReminder,
  onSendMessage,
  onCapturePhoto,
}) {
  const [now, setNow] = useState(new Date());
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);

  /* Keep greeting/date fresh without requiring a screen reload. */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => clearInterval(timer);
  }, []);

  const patientFirstName = firstName(patientName || name);

  const safeReminders = useMemo(() => {
    if (!Array.isArray(reminders)) {
      return [];
    }

    return reminders.filter(Boolean);
  }, [reminders]);

  const todayPlan = safeReminders.slice(0, 2);

  const completedTasks = safeReminders.filter(
    item => Boolean(item?.done),
  ).length;

  const pendingReminderCount = safeReminders.filter(
    item => !item?.done,
  ).length;

  const greeting = greetingFor(now.getHours());
  const daytime = isDaytime(now.getHours());

  /* ---------------------------------------------------------------------- */
  /* Actions                                                                */
  /* ---------------------------------------------------------------------- */

  const submitMessage = () => {
    const text = message.trim();

    if (!text) {
      return;
    }

    Keyboard.dismiss();
    setMessage('');
    setIsListening(false);

    onSendMessage?.(text);
  };

  const handleMicrophone = () => {
    Keyboard.dismiss();

    /*
     * No speech-recognition package is introduced here.
     *
     * If the Talk/AI screen already handles voice interaction, we simply
     * navigate there. This keeps HomeScreen compatible with the existing
     * project and avoids introducing another native dependency.
     */
    setIsListening(true);

    onNavigate?.('talk');
  };

  const handleCamera = () => {
    Keyboard.dismiss();
    setIsListening(false);
    onCapturePhoto?.();
  };

  const handleFeaturePress = item => {
    onNavigate?.(item.route);
  };

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={HOME_BACKGROUND}
        translucent={false}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* ================================================================ */}
        {/* GREETING                                                         */}
        {/* ================================================================ */}

        <SmaranAnimated
          delay={40}
          duration={650}
          distance={14}
          style={styles.motionHeader}>

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.hello}>Hello,</Text>

              <Text
                style={styles.patientName}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}>
                {patientFirstName}
              </Text>

              <View style={styles.greetingRow}>
                <Text style={styles.greeting}>
                  {greeting}
                </Text>

                <Text style={styles.greetingIcon}>
                  {daytime ? '☀️' : '🌙'}
                </Text>
              </View>

              <Text style={styles.date}>
                {formatDate(now)}
              </Text>
            </View>

            {/* Reminder notification button */}
            <SmaranPressable
              onPress={() => onNavigate?.('reminders')}
              style={({pressed}) => [
                styles.reminderButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open reminders">

              <Icon
                name="bell"
                size={29}
                color={COLORS.primaryDark}
                strokeWidth={2.2}
              />

              {pendingReminderCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {Math.min(pendingReminderCount, 9)}
                  </Text>
                </View>
              ) : null}
            </SmaranPressable>
          </View>
        </SmaranAnimated>

        {/* ================================================================ */}
        {/* FEATURE GRID                                                      */}
        {/* ================================================================ */}

        <View style={styles.featureGrid}>
          {FEATURE_DATA.map((item, index) => (
            <FeatureTile
              key={item.key}
              delay={160 + index * 90}
              icon={item.icon}
              title={item.title}
              subtitle={item.subtitle}
              background={item.background}
              onPress={() => handleFeaturePress(item)}
            />
          ))}
        </View>

        {/* ================================================================ */}
        {/* DAILY PROGRESS                                                    */}
        {/* ================================================================ */}

        <SmaranAnimated
          delay={570}
          duration={560}
          distance={18}
          style={styles.fullMotion}>

          <SmaranPressable
            onPress={() => onNavigate?.('games')}
            style={({pressed}) => [
              styles.progressBanner,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open today's memory game progress">

            <View style={styles.progressIcon}>
              <Icon
                name="heart"
                size={27}
                color={COLORS.primaryDark}
                strokeWidth={2.05}
              />
            </View>

            <View style={styles.progressCopy}>
              <Text style={styles.progressTitle}>
                Great job! You completed {Math.min(completedTasks, 5)} of 5
                games today.
              </Text>

              <Text style={styles.progressSub}>
                Keep your mind active with a little practice.
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </SmaranPressable>
        </SmaranAnimated>

        {/* ================================================================ */}
        {/* TODAY'S PLAN                                                      */}
        {/* ================================================================ */}

        <SmaranAnimated
          delay={650}
          duration={500}
          distance={16}
          style={styles.fullMotion}>

          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>
              Today's Plan
            </Text>

            <SmaranPressable
              onPress={() => onNavigate?.('reminders')}
              style={({pressed}) => [
                styles.scheduleLink,
                pressed && styles.linkPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Open full schedule">

              <Icon
                name="calendar-days"
                size={18}
                color={COLORS.primaryDark}
                strokeWidth={2.05}
              />

              <Text style={styles.scheduleText}>
                Full Schedule
              </Text>
            </SmaranPressable>
          </View>
        </SmaranAnimated>

        {todayPlan.length > 0 ? (
          todayPlan.map((item, index) => (
            <PlanCard
              key={item.id || 'plan-' + index}
              item={item}
              onToggle={() => onToggleReminder?.(item.id)}
              delay={720 + index * 100}
            />
          ))
        ) : (
          <SmaranPressable
            onPress={() => onNavigate?.('reminders')}
            style={({pressed}) => [
              styles.emptyPlan,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="No reminders scheduled. Add a reminder.">

            <View style={styles.emptyIcon}>
              <Icon
                name="calendar-days"
                size={25}
                color={COLORS.primaryDark}
                strokeWidth={2}
              />
            </View>

            <View style={styles.emptyCopy}>
              <Text style={styles.emptyTitle}>
                Nothing scheduled yet
              </Text>

              <Text style={styles.emptyText}>
                Add a reminder to build today's plan.
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </SmaranPressable>
        )}

        {/* ================================================================ */}
        {/* AI REMINDER / ASSISTANT                                           */}
        {/* ================================================================ */}

        <SmaranAnimated
          delay={900}
          duration={600}
          distance={20}
          style={styles.fullMotion}>

          <View style={styles.aiReminderSection}>
            <View style={styles.aiReminderHeader}>
              <View style={styles.aiReminderTitleRow}>
                <View style={styles.aiTitleIcon}>
                  <Icon
                    name="bell"
                    size={20}
                    color={COLORS.primaryDark}
                    strokeWidth={2}
                  />
                </View>

                <View style={styles.aiReminderTitleCopy}>
                  <Text style={styles.aiReminderTitle}>
                    AI Reminder
                  </Text>

                  <Text style={styles.aiReminderSubtitle}>
                    Ask Smaran about your schedule
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.composer,
                isListening && styles.composerListening,
              ]}>

              <View style={styles.composerLeading}>
                <Icon
                  name="message-circle"
                  size={23}
                  color={COLORS.primaryDark}
                  strokeWidth={1.9}
                />
              </View>

              <TextInput
                value={message}
                onChangeText={text => {
                  setMessage(text);

                  if (isListening) {
                    setIsListening(false);
                  }
                }}
                placeholder="Ask me about your reminders..."
                placeholderTextColor={COLORS.muted}
                style={styles.composerInput}
                returnKeyType="send"
                onSubmitEditing={submitMessage}
                blurOnSubmit={false}
                accessibilityLabel="Ask Smaran about your reminders"
              />

              {message.trim() ? (
                <SmaranPressable
                  onPress={submitMessage}
                  style={({pressed}) => [
                    styles.composerAction,
                    styles.sendAction,
                    pressed && styles.actionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Send message">

                  <Icon
                    name="send"
                    size={19}
                    color={COLORS.primaryDark}
                    strokeWidth={2.1}
                  />
                </SmaranPressable>
              ) : (
                <SmaranPressable
                  onPress={handleMicrophone}
                  style={({pressed}) => [
                    styles.composerAction,
                    styles.micAction,
                    isListening && styles.micActionActive,
                    pressed && styles.actionPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Talk to Smaran AI Reminder">

                  <Icon
                    name="mic"
                    size={22}
                    color={COLORS.primaryDark}
                    strokeWidth={2.1}
                  />
                </SmaranPressable>
              )}

              <SmaranPressable
                onPress={handleCamera}
                style={({pressed}) => [
                  styles.composerAction,
                  styles.cameraAction,
                  pressed && styles.actionPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Take a photo">

                <Icon
                  name="camera"
                  size={21}
                  color={COLORS.primaryDark}
                  strokeWidth={2}
                />
              </SmaranPressable>
            </View>

            <Text style={styles.aiHint}>
              Tap the microphone to talk to Smaran
            </Text>
          </View>
        </SmaranAnimated>
      </ScrollView>

    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Feature Tile                                                               */
/* -------------------------------------------------------------------------- */

function FeatureTile({
  icon,
  title,
  subtitle,
  background,
  onPress,
  delay = 160,
}) {
  return (
    <SmaranAnimated
      delay={delay}
      duration={560}
      distance={20}
      style={styles.featureMotion}>

      <SmaranPressable
        onPress={onPress}
        style={({pressed}) => [
          styles.featureTile,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}>

        <View
          style={[
            styles.featureIcon,
            {
              backgroundColor: background,
            },
          ]}>

          <Icon
            name={icon}
            size={24}
            color={COLORS.primaryDark}
            strokeWidth={2.05}
          />
        </View>

        <Text
          style={styles.featureTitle}
          numberOfLines={2}>
          {title}
        </Text>

        <Text
          style={styles.featureSubtitle}
          numberOfLines={2}>
          {subtitle}
        </Text>

        <Text style={styles.featureArrow}>
          ›
        </Text>
      </SmaranPressable>
    </SmaranAnimated>
  );
}

/* -------------------------------------------------------------------------- */
/* Plan Card                                                                  */
/* -------------------------------------------------------------------------- */

function PlanCard({
  item,
  onToggle,
  delay = 720,
}) {
  const isDone = Boolean(item?.done);

  return (
    <SmaranAnimated
      delay={delay}
      duration={520}
      distance={18}
      style={styles.fullMotion}>

      <View style={styles.planCard}>

        {/* ================================================================ */}
        {/* LEFT REMINDER ICON                                                */}
        {/* ================================================================ */}

        <View
          style={[
            styles.planIcon,
            isDone && styles.planIconDone,
          ]}>

          <Icon
            name="clock"
            size={25}
            color={COLORS.primaryDark}
            strokeWidth={2.05}
          />
        </View>

        {/* ================================================================ */}
        {/* REMINDER CONTENT                                                  */}
        {/* ================================================================ */}

        <SmaranPressable
          onPress={onToggle}
          style={styles.planMain}
          accessibilityRole="button"
          accessibilityLabel={`${isDone ? 'Completed' : 'Pending'} ${
            item?.title || 'reminder'
          }`}>

          <Text style={styles.planTime}>
            {item?.time || 'Scheduled'}
          </Text>

          <Text
            style={[
              styles.planItemTitle,
              isDone && styles.doneTitle,
            ]}>

            {item?.title || 'Reminder'}
          </Text>

          <Text style={styles.planDetail}>
            {item?.detail || 'Smaran reminder'}
          </Text>
        </SmaranPressable>

        {/* ================================================================ */}
        {/* FIXED RIGHT-SIDE BUTTON                                           */}
        {/* ================================================================ */}

        <View style={styles.planButtonColumn}>
          <SmaranPressable
            onPress={onToggle}
            style={[
              styles.planButton,
              isDone
                ? styles.doneButton
                : styles.remindButton,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isDone
                ? `Mark ${item?.title || 'reminder'} as pending`
                : `Remind me about ${item?.title || 'reminder'}`
            }>

            <Icon
              name={isDone ? 'check' : 'bell'}
              size={18}
              color={COLORS.white}
              strokeWidth={2.5}
            />

            <Text
              style={styles.planButtonText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}>

              {isDone ? "I'm Done" : 'Remind Me'}
            </Text>
          </SmaranPressable>
        </View>
      </View>
    </SmaranAnimated>
  );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HOME_BACKGROUND,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
  },

  /* ====================================================================== */
  /* HEADER                                                                 */
  /* ====================================================================== */

  header: {
    minHeight: 157,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  hello: {
    fontSize: 31,
    lineHeight: 36,
    color: COLORS.text,
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  patientName: {
    marginTop: 0,
    fontSize: 40,
    lineHeight: 45,
    color: COLORS.primaryDark,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  greetingRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  greeting: {
    fontSize: 18,
    lineHeight: 23,
    color: COLORS.text,
    fontWeight: '800',
  },

  greetingIcon: {
    marginLeft: 7,
    fontSize: 19,
    lineHeight: 23,
  },

  date: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.muted,
    fontWeight: '600',
  },

  reminderButton: {
    width: 57,
    height: 57,
    marginTop: 2,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },

  badge: {
    position: 'absolute',
    right: 5,
    top: 4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    fontSize: 9,
    color: COLORS.white,
    fontWeight: '900',
  },

  /* ====================================================================== */
  /* FEATURE GRID                                                           */
  /* ====================================================================== */

  featureGrid: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  featureTile: {
    width: '100%',
    minHeight: 142,
    borderRadius: 21,
    backgroundColor: COLORS.white,
    padding: 14,
    ...SHADOW,
  },

  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  featureTitle: {
    marginTop: 11,
    paddingRight: 16,
    fontSize: 16,
    lineHeight: 20,
    color: COLORS.text,
    fontWeight: '900',
  },

  featureSubtitle: {
    marginTop: 4,
    paddingRight: 5,
    fontSize: 10.5,
    lineHeight: 14,
    color: COLORS.muted,
    fontWeight: '600',
  },

  featureArrow: {
    position: 'absolute',
    right: 13,
    bottom: 9,
    fontSize: 27,
    lineHeight: 29,
    color: COLORS.text,
    fontWeight: '400',
  },

  /* ====================================================================== */
  /* PROGRESS                                                               */
  /* ====================================================================== */

  progressBanner: {
    marginTop: 17,
    minHeight: 78,
    borderRadius: 21,
    backgroundColor: '#E2F1D6',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },

  progressIcon: {
    width: 51,
    height: 51,
    borderRadius: 26,
    backgroundColor: '#D8EAC9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
    paddingRight: 5,
  },

  progressTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  progressSub: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.muted,
    fontWeight: '700',
  },

  arrow: {
    fontSize: 30,
    lineHeight: 32,
    color: COLORS.primaryDark,
    fontWeight: '400',
  },

  /* ====================================================================== */
  /* TODAY'S PLAN                                                           */
  /* ====================================================================== */

  planHeader: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  planTitle: {
    fontSize: 26,
    lineHeight: 31,
    color: COLORS.text,
    fontWeight: '900',
  },

  scheduleLink: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 5,
  },

  scheduleText: {
    marginLeft: 5,
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  linkPressed: {
    opacity: 0.65,
  },

  /* ====================================================================== */
  /* PLAN CARD                                                              */
  /* ====================================================================== */

  planCard: {
    width: '100%',
    minHeight: 128,

    borderRadius: 20,
    backgroundColor: COLORS.white,

    paddingVertical: 16,
    paddingLeft: 12,
    paddingRight: 12,

    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',

    /*
     * The right-side action is absolutely positioned, so text length can
     * never move the button horizontally.
     */
    position: 'relative',
    overflow: 'hidden',

    ...SHADOW,
  },

  /* ---------------------------------------------------------------------- */
  /* Fixed left icon                                                         */
  /* ---------------------------------------------------------------------- */

  planIcon: {
    width: 64,
    height: 64,

    flexGrow: 0,
    flexShrink: 0,

    borderRadius: 32,
    backgroundColor: '#E3F0D7',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  planIconDone: {
    backgroundColor: '#E0F0D7',
  },

  /* ---------------------------------------------------------------------- */
  /* Flexible reminder information area                                     */
  /* ---------------------------------------------------------------------- */

  planMain: {
    /*
     * The reminder content uses every bit of space left after the fixed
     * icon and the reserved right-side button area.
     */
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,

    /*
     * 112 = fixed button width
     * 12  = right card inset
     * 12  = safety gap between text and button
     */
    marginRight: 136,

    justifyContent: 'center',
  },

  planTime: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.muted,
    fontWeight: '700',
  },

  planItemTitle: {
    marginTop: 1,

    fontSize: 16,
    lineHeight: 20,

    color: COLORS.text,
    fontWeight: '900',

    /*
     * Text wraps naturally inside planMain.
     */
    flexShrink: 1,
  },

  doneTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.65,
  },

  planDetail: {
    marginTop: 1,

    fontSize: 10,
    lineHeight: 14,

    color: COLORS.muted,

    flexShrink: 1,
  },

  /* ---------------------------------------------------------------------- */
  /* FIXED RIGHT BUTTON                                                     */
  /* ---------------------------------------------------------------------- */

  planButtonColumn: {
    /*
     * IMPORTANT:
     *
     * The button is completely removed from the normal horizontal flex
     * layout and anchored to the card itself.
     *
     * This means the reminder title/detail can become longer, wrap onto
     * multiple lines, and increase the card height without ever changing
     * the button's horizontal position.
     */
    position: 'absolute',

    top: 0,
    right: 12,
    bottom: 0,

    width: 112,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: 'stretch',
    justifyContent: 'center',
  },

  planButton: {
    width: '100%',
    minHeight: 58,

    flexGrow: 0,
    flexShrink: 0,

    borderRadius: 22,

    paddingHorizontal: 9,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  doneButton: {
    backgroundColor: '#4F9A42',
  },

  remindButton: {
    backgroundColor: '#E49A1E',
  },

  planButtonText: {
    marginLeft: 6,

    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',

    textAlign: 'center',

    /*
     * Only the text INSIDE the button can shrink.
     * The button itself cannot shrink.
     */
    flexShrink: 1,
  },

  /* ====================================================================== */
  /* EMPTY PLAN                                                             */
  /* ====================================================================== */

  emptyPlan: {
    minHeight: 84,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },

  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  emptyTitle: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '900',
  },

  emptyText: {
    marginTop: 3,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.muted,
  },

  /* ====================================================================== */
  /* AI REMINDER                                                            */
  /* ====================================================================== */

  aiReminderSection: {
    marginTop: 14,
  },

  aiReminderHeader: {
    marginBottom: 7,
  },

  aiReminderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiTitleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiReminderTitleCopy: {
    marginLeft: 9,
    flex: 1,
    minWidth: 0,
  },

  aiReminderTitle: {
    fontSize: 17,
    lineHeight: 21,
    color: COLORS.text,
    fontWeight: '900',
  },

  aiReminderSubtitle: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.muted,
    fontWeight: '600',
  },

  composer: {
    minHeight: 61,
    borderRadius: 31,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E8E1D5',
    paddingLeft: 13,
    paddingRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW,
  },

  composerListening: {
    borderWidth: 2,
    borderColor: COLORS.primaryDark,
  },

  composerLeading: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  composerInput: {
    flex: 1,
    minWidth: 0,
    height: 50,
    marginLeft: 6,
    paddingVertical: 0,
    fontSize: 15,
    color: COLORS.text,
  },

  composerAction: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: 22,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  micAction: {
    backgroundColor: '#E5F2DA',
    borderColor: '#D4E5C8',
  },

  micActionActive: {
    backgroundColor: '#D4EAC6',
    transform: [{scale: 1.04}],
  },

  sendAction: {
    backgroundColor: '#E5F2DA',
    borderColor: '#D4E5C8',
  },

  cameraAction: {
    backgroundColor: '#F7F8F1',
    borderColor: '#E0E6D8',
  },

  aiHint: {
    marginTop: 5,
    marginLeft: 7,
    fontSize: 9.5,
    lineHeight: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },

  /* ====================================================================== */
  /* MOTION                                                                 */
  /* ====================================================================== */

  motionHeader: {
    width: '100%',
  },

  featureMotion: {
    width: '48.2%',
  },

  fullMotion: {
    width: '100%',
  },

  /* ====================================================================== */
  /* INTERACTION                                                            */
  /* ====================================================================== */

  actionPressed: {
    opacity: 0.65,
    transform: [{scale: 0.94}],
  },

  pressed: {
    opacity: 0.78,
    transform: [{scale: 0.99}],
  },
});