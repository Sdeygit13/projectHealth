import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Sound from 'react-native-sound';

const SPLASH_DURATION_MS = 5000;

const ART_WIDTH = 768;
const ART_HEIGHT = 1364;

// Original loader position in the 768 × 1364 artwork
const LOADER_CENTER_X = 384;
const LOADER_CENTER_Y = 978;

export default function SplashScreen({onFinished}) {
  const {width: screenWidth, height: screenHeight} =
    useWindowDimensions();

  const rotation = useRef(new Animated.Value(0)).current;

  const soundRef = useRef(null);
  const finishedRef = useRef(false);

  /*
   * Calculate the scale used by resizeMode="contain".
   * This keeps the complete artwork visible without stretching.
   */
  const scale = Math.min(
    screenWidth / ART_WIDTH,
    screenHeight / ART_HEIGHT,
  );

  const displayedWidth = ART_WIDTH * scale;
  const displayedHeight = ART_HEIGHT * scale;

  const imageLeft =
    (screenWidth - displayedWidth) / 2;

  const imageTop =
    (screenHeight - displayedHeight) / 2;

  /*
   * Position the real animated loader exactly
   * where the old loader existed in the artwork.
   */
  const loaderSize = 104 * scale;

  const loaderLeft =
    imageLeft +
    LOADER_CENTER_X * scale -
    loaderSize / 2;

  const loaderTop =
    imageTop +
    LOADER_CENTER_Y * scale -
    loaderSize / 2;

  useEffect(() => {
    let mounted = true;

    StatusBar.setBarStyle('dark-content');

    // =====================================================
    // REAL LOADING ANIMATION
    // =====================================================

    rotation.setValue(0);

    const animation = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();

    // =====================================================
    // EXACT 5 SECOND SPLASH TIMER
    // =====================================================

    const finishTimer = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;

        animation.stop();

        onFinished?.();
      }
    }, SPLASH_DURATION_MS);

    // =====================================================
    // DHAK AUDIO
    // =====================================================

    try {
      const sound = new Sound(
        'dhakk_beat.mp3',
        Sound.MAIN_BUNDLE,
        error => {
          if (error) {
            console.log(
              'Smaran splash audio load error:',
              error,
            );
            return;
          }

          if (!mounted) {
            sound.release();
            return;
          }

          sound.setVolume(0.8);

          sound.play(success => {
            if (!success) {
              console.log(
                'Smaran splash audio playback failed.',
              );
            }
          });
        },
      );

      soundRef.current = sound;
    } catch (error) {
      console.log(
        'Smaran splash audio initialization error:',
        error,
      );
    }

    // =====================================================
    // CLEANUP
    // =====================================================

    return () => {
      mounted = false;

      clearTimeout(finishTimer);

      animation.stop();

      const sound = soundRef.current;

      if (sound) {
        try {
          sound.stop();
          sound.release();
        } catch (error) {
          console.log(
            'Smaran splash audio cleanup error:',
            error,
          );
        }
      }

      soundRef.current = null;
    };
  }, [onFinished, rotation]);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8E7BF"
        translucent={false}
      />

      {/* =================================================
          SMARAN SPLASH ARTWORK
          ================================================= */}

      <Image
        source={require('../assets/durga-puja-splash.png')}
        style={styles.splashImage}
        resizeMode="contain"
      />

      {/* =================================================
          REAL ANIMATED LOADER
          ================================================= */}

      <View
        pointerEvents="none"
        style={[
          styles.loaderContainer,
          {
            width: loaderSize,
            height: loaderSize,
            left: loaderLeft,
            top: loaderTop,
          },
        ]}>
        <Animated.View
          style={[
            styles.loaderRing,
            {
              width: loaderSize,
              height: loaderSize,
              borderRadius: loaderSize / 2,
              borderWidth: Math.max(5, 8 * scale),
              transform: [{rotate: spin}],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8E7BF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  splashImage: {
    width: '100%',
    height: '100%',
  },

  loaderContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loaderRing: {
    position: 'absolute',

    borderColor: '#C58A22',

    /*
     * Transparent sections create the
     * open circular loader appearance.
     */
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
});