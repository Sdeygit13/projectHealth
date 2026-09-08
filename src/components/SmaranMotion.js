import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
} from 'react-native';

import {ANIMATION} from '../theme';

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Ensures that a value used for translateY is a valid React Native
 * transform value.
 *
 * Normal usage:
 *   distance={18}
 *
 * Also defensively handles accidental values such as:
 *   distance={{translateY: 18}}
 */
function normalizeTranslateY(value) {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue)
      ? numericValue
      : 18;
  }

  if (
    value &&
    typeof value === 'object' &&
    (typeof value.translateY === 'number' ||
      typeof value.translateY === 'string')
  ) {
    return normalizeTranslateY(value.translateY);
  }

  return 18;
}

/**
 * Ensures that scaleFrom is a valid numeric value.
 *
 * Normal usage:
 *   scaleFrom={0.97}
 */
function normalizeScale(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof value.scale === 'number' &&
    Number.isFinite(value.scale)
  ) {
    return value.scale;
  }

  return 0.97;
}

/* -------------------------------------------------------------------------- */
/* Reduced motion                                                             */
/* -------------------------------------------------------------------------- */

export function useSmaranReducedMotion() {
  const [reduced, setReduced] = useState(
    Boolean(ANIMATION?.reduceMotion),
  );

  useEffect(() => {
    let mounted = true;

    const checkReducedMotion = async () => {
      try {
        if (
          typeof AccessibilityInfo?.isReduceMotionEnabled !==
          'function'
        ) {
          return;
        }

        const value =
          await AccessibilityInfo.isReduceMotionEnabled();

        if (mounted && typeof value === 'boolean') {
          setReduced(value);
        }
      } catch (error) {
        // Accessibility API may not be available on every platform.
      }
    };

    checkReducedMotion();

    let subscription;

    try {
      if (
        typeof AccessibilityInfo?.addEventListener ===
        'function'
      ) {
        subscription = AccessibilityInfo.addEventListener(
          'reduceMotionChanged',
          value => {
            if (mounted && typeof value === 'boolean') {
              setReduced(value);
            }
          },
        );
      }
    } catch (error) {
      // Ignore unsupported accessibility listeners.
    }

    return () => {
      mounted = false;

      try {
        subscription?.remove?.();
      } catch (error) {
        // Ignore cleanup errors.
      }
    };
  }, []);

  return reduced;
}

/* -------------------------------------------------------------------------- */
/* Animated screen/component wrapper                                          */
/* -------------------------------------------------------------------------- */

export function SmaranAnimated({
  children,
  delay = 0,
  duration = ANIMATION?.duration?.medium ?? 320,
  distance = 18,
  scaleFrom = 0.97,
  style,
  ...props
}) {
  const safeDistance = normalizeTranslateY(distance);
  const safeScaleFrom = normalizeScale(scaleFrom);

  const numericDistance =
    typeof safeDistance === 'number'
      ? safeDistance
      : Number(safeDistance) || 18;

  const numericScaleFrom =
    typeof safeScaleFrom === 'number'
      ? safeScaleFrom
      : 0.97;

  const opacity = useRef(
    new Animated.Value(0),
  ).current;

  const translateY = useRef(
    new Animated.Value(numericDistance),
  ).current;

  const scale = useRef(
    new Animated.Value(numericScaleFrom),
  ).current;

  const reducedMotion = useSmaranReducedMotion();

  useEffect(() => {
    let animation;

    /*
     * Reduced-motion mode:
     * Show the component immediately without movement.
     */
    if (reducedMotion) {
      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();

      opacity.setValue(1);
      translateY.setValue(0);
      scale.setValue(1);

      return undefined;
    }

    /*
     * Reset values whenever the animation configuration changes.
     */
    opacity.stopAnimation();
    translateY.stopAnimation();
    scale.stopAnimation();

    opacity.setValue(0);
    translateY.setValue(numericDistance);
    scale.setValue(numericScaleFrom);

    /*
     * Fade + slide.
     */
    const fadeAnimation = Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const slideAnimation = Animated.timing(translateY, {
      toValue: 0,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    /*
     * Slight spring effect for the component scale.
     */
    const scaleAnimation = Animated.spring(scale, {
      toValue: 1,
      delay,
      damping: 18,
      stiffness: 150,
      mass: 0.9,
      useNativeDriver: true,
    });

    animation = Animated.parallel([
      fadeAnimation,
      slideAnimation,
      scaleAnimation,
    ]);

    animation.start();

    return () => {
      try {
        animation?.stop?.();
      } catch (error) {
        // Ignore animation cleanup errors.
      }

      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();
    };
  }, [
    delay,
    duration,
    numericDistance,
    numericScaleFrom,
    opacity,
    reducedMotion,
    scale,
    translateY,
  ]);

  /*
   * Do not attempt to wrap primitive values.
   */
  if (!React.isValidElement(children)) {
    return children;
  }

  /*
   * Animated.Value transforms must be consumed by an Animated component.
   * Passing them to a regular cloned View makes React Native validate the
   * Animated.Value object as a plain transform value.
   */

  const animatedStyle = {
    opacity,
    transform: [
      {
        translateY,
      },
      {
        scale,
      },
    ],
  };

  return (
    <Animated.View
      {...props}
      style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* Pressable with subtle press animation                                      */
/* -------------------------------------------------------------------------- */

export function SmaranPressable({
  children,
  style,
  onPressIn,
  onPressOut,
  disabled = false,
  ...props
}) {
  const scale = useRef(
    new Animated.Value(1),
  ).current;

  const reducedMotion = useSmaranReducedMotion();

  const pressIn = event => {
    onPressIn?.(event);

    if (disabled || reducedMotion) {
      return;
    }

    scale.stopAnimation();

    Animated.spring(scale, {
      toValue: 0.965,
      damping: 18,
      stiffness: 260,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = event => {
    onPressOut?.(event);

    if (disabled || reducedMotion) {
      return;
    }

    scale.stopAnimation();

    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      stiffness: 220,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      {...props}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}>
      {state => (
        <Animated.View
          style={[
            typeof style === 'function'
              ? style(state)
              : style,
            {
              transform: [{scale}],
            },
          ]}>
          {children}
        </Animated.View>
      )}
    </Pressable>
  );
}