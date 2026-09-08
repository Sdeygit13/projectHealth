import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Easing, ScrollView, StyleSheet, Text, View} from 'react-native';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';
import {SmaranAnimated, SmaranPressable, useSmaranReducedMotion} from '../components/SmaranMotion';

const GAME_CARDS = [
  ['✦', 'Memory Match', 'Match familiar pairs and exercise recall.'],
  ['123', 'Daily Recall', 'Remember a short sequence and repeat it.'],
  ['◇', 'Pattern Tap', 'Find the next shape in a simple pattern.'],
];

export default function GamesScreen({onBack}) {
  const [game, setGame] = useState(null);

  if (game === 'Memory Match') {
    return <MemoryMatch onBack={() => setGame(null)} />;
  }

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Mind Games" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SmaranAnimated delay={30} duration={600} distance={18} style={styles.fullWidth}>
          <View style={styles.hero}>
            <AnimatedHeroIcon />
            <View style={{flex: 1}}>
              <Text style={styles.heroTitle}>A little play every day</Text>
              <Text style={styles.heroText}>Short, calm activities. No pressure — just practice.</Text>
            </View>
          </View>
        </SmaranAnimated>

        <SmaranAnimated delay={160} duration={500} distance={14} style={styles.fullWidth}>
          <Text style={styles.section}>CHOOSE AN ACTIVITY</Text>
        </SmaranAnimated>

        {GAME_CARDS.map(([icon, title, text], index) => (
          <SmaranAnimated key={title} delay={230 + index * 100} duration={540} distance={22} style={styles.fullWidth}>
            <SmaranPressable
              style={styles.card}
              onPress={() => setGame(title)}
              accessibilityRole="button"
              accessibilityLabel={`${title}. ${text}`}>
              <View style={styles.gameIcon}><Text style={styles.gameIconText}>{icon}</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.text}>{text}</Text>
                <Text style={styles.play}>PLAY  →</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </SmaranPressable>
          </SmaranAnimated>
        ))}
      </ScrollView>
    </View>
  );
}

function AnimatedHeroIcon() {
  const pulse = useRef(new Animated.Value(1)).current;
  const reducedMotion = useSmaranReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1.06, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);

  return (
    <Animated.View style={[styles.heroIcon, {transform: [{scale: pulse}]}]}>
      <Text style={styles.heroIconText}>✦</Text>
    </Animated.View>
  );
}

function MemoryMatch({onBack}) {
  const values = useMemo(() => ['♥', '♥', '☀', '☀', '★', '★'].sort(() => Math.random() - 0.5), []);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const tap = i => {
    if (busy || open.includes(i) || matched.includes(i) || open.length === 2) return;

    const next = [...open, i];
    setOpen(next);

    if (next.length === 2) {
      setBusy(true);
      setMoves(previous => previous + 1);

      if (values[next[0]] === values[next[1]]) {
        setTimeout(() => {
          setMatched(previous => [...previous, ...next]);
          setOpen([]);
          setBusy(false);
        }, 320);
      } else {
        setTimeout(() => {
          setOpen([]);
          setBusy(false);
        }, 800);
      }
    }
  };

  const done = matched.length === values.length;

  useEffect(() => {
    if (done && !celebrate) setCelebrate(true);
  }, [celebrate, done]);

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Memory Match" />
      <ScrollView contentContainerStyle={styles.gameArea} showsVerticalScrollIndicator={false}>
        <SmaranAnimated delay={30} duration={550} distance={16} style={styles.fullWidth}>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>YOUR PROGRESS</Text>
            <Text style={styles.score}>{done ? 'Wonderful! All pairs matched.' : `${moves} moves`}</Text>
          </View>
        </SmaranAnimated>

        <SmaranAnimated delay={140} duration={450} distance={12}>
          <Text style={styles.help}>Tap two cards to find the matching pair.</Text>
        </SmaranAnimated>

        <View style={styles.grid}>
          {values.map((value, index) => (
            <MemoryTile
              key={index}
              value={value}
              index={index}
              visible={open.includes(index) || matched.includes(index)}
              matched={matched.includes(index)}
              onPress={() => tap(index)}
            />
          ))}
        </View>

        {done ? (
          <SmaranAnimated delay={80} duration={550} distance={14} scaleFrom={0.94}>
            <View style={styles.successCard}>
              <Text style={styles.successIcon}>♥</Text>
              <Text style={styles.successTitle}>Wonderful!</Text>
              <Text style={styles.successText}>You remembered every pair. Your mind is doing beautifully.</Text>
            </View>
          </SmaranAnimated>
        ) : null}

        <SmaranAnimated delay={720} duration={500} distance={12}>
          <SmaranPressable onPress={onBack} style={styles.backButton} accessibilityRole="button">
            <Text style={styles.backButtonText}>Back to Games</Text>
          </SmaranPressable>
        </SmaranAnimated>
      </ScrollView>
    </View>
  );
}

function MemoryTile({value, visible, matched, onPress, index}) {
  const flip = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const reducedMotion = useSmaranReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      flip.setValue(visible ? 1 : 0);
      return undefined;
    }
    Animated.spring(flip, {
      toValue: visible ? 1 : 0,
      damping: 17,
      stiffness: 210,
      mass: 0.75,
      useNativeDriver: true,
    }).start();
  }, [flip, reducedMotion, visible]);

  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });
  const frontOpacity = flip.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [1, 0, 0],
  });
  const backOpacity = flip.interpolate({
    inputRange: [0, 0.45, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <SmaranAnimated
      delay={260 + index * 70}
      duration={430}
      distance={14}
      scaleFrom={0.92}>
      <SmaranPressable
        onPress={onPress}
        style={[styles.tile, matched && styles.tileMatched]}
        accessibilityRole="button"
        accessibilityLabel={`Memory card ${index + 1}`}>
        <Animated.View
          style={[
            styles.tileFace,
            styles.tileFront,
            {
              opacity: frontOpacity,
              transform: [{rotateY: frontRotate}],
            },
          ]}>
          <Text style={styles.tileQuestion}>?</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.tileFace,
            styles.tileBack,
            {
              opacity: backOpacity,
              transform: [{rotateY: backRotate}],
            },
          ]}>
          <Text style={styles.tileText}>{value}</Text>
        </Animated.View>
      </SmaranPressable>
    </SmaranAnimated>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: COLORS.background},
  content: {padding: 16, paddingBottom: 30},
  fullWidth: {width: '100%'},
  hero: {backgroundColor: COLORS.primaryDeep, borderRadius: 21, padding: 16, flexDirection: 'row', alignItems: 'center', ...SHADOW},
  heroIcon: {width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.13)', alignItems: 'center', justifyContent: 'center', marginRight: 12},
  heroIconText: {fontSize: 29, color: COLORS.white},
  heroTitle: {fontSize: 17, fontWeight: '900', color: COLORS.white},
  heroText: {fontSize: 11, color: COLORS.mint, marginTop: 4, lineHeight: 15},
  section: {fontSize: 10, color: COLORS.primaryDark, fontWeight: '900', letterSpacing: 1.2, marginTop: 22, marginBottom: 10},
  card: {backgroundColor: COLORS.white, borderRadius: 20, padding: 15, marginBottom: 11, flexDirection: 'row', alignItems: 'center', ...SHADOW},
  gameIcon: {width: 58, height: 58, borderRadius: 18, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  gameIconText: {fontSize: 25, color: COLORS.primaryDark, fontWeight: '900'},
  title: {fontSize: 17, fontWeight: '900', color: COLORS.text},
  text: {fontSize: 11.5, color: COLORS.muted, marginTop: 4, lineHeight: 16},
  play: {fontSize: 10, color: COLORS.primaryDark, fontWeight: '900', marginTop: 8},
  chevron: {fontSize: 29, color: COLORS.primaryDark},
  gameArea: {padding: 22, alignItems: 'center', paddingBottom: 40},
  scoreCard: {width: '100%', backgroundColor: COLORS.white, borderRadius: 20, padding: 16, ...SHADOW},
  scoreLabel: {fontSize: 9, color: COLORS.primaryDark, fontWeight: '900', letterSpacing: 1.2},
  score: {fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 4},
  help: {fontSize: 13, color: COLORS.muted, textAlign: 'center', marginTop: 15},
  grid: {width: 300, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 13, marginTop: 28},
  tile: {width: 88, height: 88, borderRadius: 19, backgroundColor: COLORS.primaryDeep, alignItems: 'center', justifyContent: 'center', ...SHADOW},
  tileMatched: {backgroundColor: COLORS.primarySoft},
  tileFace: {position: 'absolute', width: '100%', height: '100%', borderRadius: 19, alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden'},
  tileFront: {backgroundColor: COLORS.primaryDeep},
  tileBack: {backgroundColor: COLORS.primarySoft},
  tileQuestion: {fontSize: 38, color: COLORS.white, fontWeight: '900'},
  tileText: {fontSize: 38, color: COLORS.primaryDark, fontWeight: '900'},
  successCard: {width: '100%', backgroundColor: COLORS.heroSoft, borderRadius: 20, padding: 18, marginTop: 24, alignItems: 'center', ...SHADOW},
  successIcon: {fontSize: 30, color: COLORS.primaryDark},
  successTitle: {fontSize: 20, fontWeight: '900', color: COLORS.primaryDark, marginTop: 3},
  successText: {fontSize: 12, lineHeight: 18, color: COLORS.text, textAlign: 'center', marginTop: 5},
  backButton: {marginTop: 26, paddingVertical: 14, paddingHorizontal: 25, borderRadius: 15, backgroundColor: COLORS.primary},
  backButtonText: {color: COLORS.white, fontWeight: '900', fontSize: 14},
});
