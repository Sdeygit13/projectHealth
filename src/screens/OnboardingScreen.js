import React, {useState} from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Logo from '../components/Logo';
import {COLORS, SHADOW} from '../theme';

const slides = [
  {
    title: 'Keep your people close',
    subtitle:
      'Save familiar faces, moments and stories in one gentle space.',
    body:
      'Because familiar memories can make ordinary days feel warmer.',
    image: true,
  },
  {
    title: 'A little activity every day',
    subtitle:
      'Enjoy simple cognitive games designed for calm, comfortable practice.',
    body: 'Recall • Focus • Recognise • Smile',
    icon: '✦',
  },
  {
    title: 'Support when you need it',
    subtitle:
      'Get reminders, helpful conversations and trusted connections from one app.',
    body: 'Private • Caring • Connected',
    icon: '♡',
  },
];

export default function OnboardingScreen({onContinue, onBack}) {
  const [index, setIndex] = useState(0);

  const slide = slides[index];

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  const next = () => {
    if (index === slides.length - 1) {
      if (typeof onContinue === 'function') {
        onContinue();
      }
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <View style={styles.screen}>

      {/* TOP BAR */}
      <View style={styles.top}>

        <Pressable
          onPress={handleBack}
          hitSlop={10}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to login"
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Logo size={46} />

        <Text style={styles.counter}>
          {index + 1} / {slides.length}
        </Text>

      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progress}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${((index + 1) / slides.length) * 100}%`,
            },
          ]}
        />
      </View>

      {/* HEADER TEXT */}
      <Text style={styles.eyebrow}>
        WELCOME TO SMARAN
      </Text>

      <Text style={styles.title}>
        {slide.title}
      </Text>

      <Text style={styles.subtitle}>
        {slide.subtitle}
      </Text>

      {/* IMAGE / ILLUSTRATION */}
      {slide.image ? (
        <View style={styles.photoWrap}>

          <Image
            source={require('../assets/couple.png')}
            style={styles.photo}
            resizeMode="cover"
          />

          <View style={styles.photoBadge}>
            <Text style={styles.badgeIcon}>♥</Text>

            <Text style={styles.badgeText}>
              Moments worth remembering
            </Text>
          </View>

        </View>
      ) : (
        <View style={styles.illustration}>

          <View style={styles.illustrationCircle}>
            <Text style={styles.bigIcon}>
              {slide.icon}
            </Text>
          </View>

          <Text style={styles.illustrationTitle}>
            {index === 1
              ? 'Gentle cognitive play'
              : 'A companion for daily life'}
          </Text>

          <Text style={styles.illustrationText}>
            {slide.body}
          </Text>

          <View style={styles.miniRow}>

            <Mini
              text={
                index === 1
                  ? 'Memory'
                  : 'Reminders'
              }
            />

            <Mini
              text={
                index === 1
                  ? 'Focus'
                  : 'Talking Help'
              }
            />

            <Mini
              text={
                index === 1
                  ? 'Patterns'
                  : 'Your Circle'
              }
            />

          </View>

        </View>
      )}

      {/* MESSAGE */}
      <View style={styles.message}>

        <View style={styles.messageIcon}>
          <Text style={styles.heart}>♥</Text>
        </View>

        <Text style={styles.messageText}>
          {slide.body}
        </Text>

      </View>

      {/* CONTINUE BUTTON */}
      <Pressable
        onPress={next}
        style={({pressed}) => [
          styles.button,
          pressed && styles.pressed,
        ]}
      >

        <Text style={styles.buttonText}>
          {index === slides.length - 1
            ? 'Enter Smaran'
            : 'Continue'}
        </Text>

        <Text style={styles.buttonArrow}>
          →
        </Text>

      </Pressable>

      {/* DOTS */}
      <View style={styles.dots}>

        {slides.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index && styles.activeDot,
            ]}
          />
        ))}

      </View>

    </View>
  );
}

function Mini({text}) {
  return (
    <View style={styles.mini}>

      <View style={styles.miniDot} />

      <Text style={styles.miniText}>
        {text}
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 18,
    paddingTop: 26,
  },

  /* TOP */
  top: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    minWidth: 75,
    height: 44,
    justifyContent: 'center',
  },

  backText: {
    fontSize: 13,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  counter: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '800',
  },

  /* PROGRESS */
  progress: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginTop: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },

  /* TEXT */
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.primaryDark,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 24,
  },

  title: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 7,
  },

  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 7,
    paddingHorizontal: 10,
  },

  /* =========================
     COUPLE IMAGE
     ========================= */

  photoWrap: {
    width: '100%',
    aspectRatio: 547 / 365,
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 24,
    backgroundColor: COLORS.primarySoft,
    ...SHADOW,
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  photoBadge: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.94)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  badgeIcon: {
    fontSize: 22,
    color: COLORS.primary,
    marginRight: 9,
  },

  badgeText: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '800',
  },

  /* =========================
     OTHER SLIDES
     ========================= */

  illustration: {
    width: '100%',
    height: 300,
    borderRadius: 28,
    backgroundColor: COLORS.mint,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    ...SHADOW,
  },

  illustrationCircle: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bigIcon: {
    fontSize: 58,
    color: COLORS.primaryDark,
  },

  illustrationTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.primaryDeep,
    marginTop: 14,
  },

  illustrationText: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
    fontWeight: '700',
  },

  miniRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },

  mini: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  miniDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 5,
  },

  miniText: {
    fontSize: 9.5,
    color: COLORS.text,
    fontWeight: '800',
  },

  /* MESSAGE */
  message: {
    minHeight: 62,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    ...SHADOW,
  },

  messageIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  heart: {
    fontSize: 21,
    color: COLORS.primaryDark,
  },

  messageText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    fontWeight: '700',
    lineHeight: 18,
  },

  /* BUTTON */
  button: {
    height: 56,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 18,
    ...SHADOW,
  },

  pressed: {
    opacity: 0.86,
    transform: [{scale: 0.99}],
  },

  buttonText: {
    fontSize: 17,
    color: COLORS.white,
    fontWeight: '900',
  },

  buttonArrow: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: 9,
  },

  /* DOTS */
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },

  activeDot: {
    backgroundColor: COLORS.primary,
    width: 22,
  },

});