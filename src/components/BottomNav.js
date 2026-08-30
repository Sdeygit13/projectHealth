import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {COLORS, SHADOW} from '../theme';


/* =========================================================
   SMARAN — CUSTOM NAVIGATION ICONS
   No external icon package required.
   ========================================================= */

function NavIcon({type, active}) {
  const color = active
    ? COLORS.primaryDark
    : COLORS.muted;

  const stroke = active ? 2.4 : 2;

  /* ---------------- HOME ---------------- */

  if (type === 'home') {
    return (
      <View style={styles.iconBox}>
        <View
          style={[
            styles.homeRoof,
            {
              borderColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.homeBody,
            {
              borderColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.homeDoor,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  }


  /* ---------------- REMINDERS ---------------- */

  if (type === 'reminders') {
    return (
      <View style={styles.iconBox}>
        <View
          style={[
            styles.bellBody,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />

        <View
          style={[
            styles.bellTop,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.bellClapper,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  }


  /* ---------------- GAMES ---------------- */

  if (type === 'games') {
    return (
      <View style={styles.iconBox}>
        <View
          style={[
            styles.gameShape,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />

        <View
          style={[
            styles.gameHorizontal,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.gameVertical,
            {
              backgroundColor: color,
            },
          ]}
        />

        <View
          style={[
            styles.gameDot,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>
    );
  }


  /* ---------------- CIRCLE ---------------- */

  if (type === 'circle') {
    return (
      <View style={styles.iconBox}>
        <View
          style={[
            styles.personHead,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />

        <View
          style={[
            styles.personBody,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />

        <View
          style={[
            styles.personSmallHead,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />

        <View
          style={[
            styles.personSmallBody,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />
      </View>
    );
  }


  /* ---------------- PROFILE ---------------- */

  if (type === 'profile') {
    return (
      <View style={styles.iconBox}>
        <View
          style={[
            styles.profileHead,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />

        <View
          style={[
            styles.profileBody,
            {
              borderColor: color,
              borderWidth: stroke,
            },
          ]}
        />
      </View>
    );
  }


  return null;
}


/* =========================================================
   NAVIGATION CONFIGURATION
   ========================================================= */

const ITEMS = [
  {
    key: 'home',
    label: 'Home',
    icon: 'home',
  },
  {
    key: 'reminders',
    label: 'Reminders',
    icon: 'reminders',
  },
  {
    key: 'games',
    label: 'Games',
    icon: 'games',
  },
  {
    key: 'circle',
    label: 'Circle',
    icon: 'circle',
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: 'profile',
  },
];


/* =========================================================
   BOTTOM NAVIGATION
   ========================================================= */

export default function BottomNav({
  active = 'home',
  onNavigate,
}) {

  const handleNavigation = key => {
    if (typeof onNavigate !== 'function') {
      return;
    }

    if (key === active) {
      return;
    }

    onNavigate(key);
  };


  return (
    <View style={styles.wrapper}>
      <View style={styles.navBar}>

        {ITEMS.map(item => {
          const isActive = active === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => handleNavigation(item.key)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.label}`}
              accessibilityState={{
                selected: isActive,
              }}
              android_ripple={{
                color: COLORS.primarySoft,
                borderless: true,
              }}
              hitSlop={6}
              style={({pressed}) => [
                styles.navItem,
                pressed && styles.navItemPressed,
              ]}
            >

              {/* ICON */}

              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer,
                ]}
              >
                <NavIcon
                  type={item.icon}
                  active={isActive}
                />
              </View>


              {/* LABEL */}

              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  isActive && styles.activeLabel,
                ]}
              >
                {item.label}
              </Text>


              {/* ACTIVE INDICATOR */}

              <View
                style={[
                  styles.indicator,
                  isActive
                    ? styles.activeIndicator
                    : styles.inactiveIndicator,
                ]}
              />

            </Pressable>
          );
        })}

      </View>
    </View>
  );
}


/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     OUTER WRAPPER
     ======================================================= */

  wrapper: {
    paddingHorizontal: 12,
    paddingTop: 7,
    paddingBottom: 9,

    backgroundColor: COLORS.background,
  },


  /* =======================================================
     NAVIGATION BAR
     ======================================================= */

  navBar: {
    minHeight: 72,

    backgroundColor: COLORS.white,

    borderRadius: 23,

    borderWidth: 1,
    borderColor: COLORS.border,

    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',

    paddingHorizontal: 4,

    ...SHADOW,
  },


  /* =======================================================
     NAVIGATION ITEM
     ======================================================= */

  navItem: {
    flex: 1,

    minHeight: 68,

    alignItems: 'center',
    justifyContent: 'center',

    paddingTop: 5,
    paddingBottom: 2,

    borderRadius: 18,
  },


  navItemPressed: {
    opacity: 0.65,
  },


  /* =======================================================
     ICON CONTAINER
     ======================================================= */

  iconContainer: {
    width: 40,
    height: 35,

    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 13,
  },


  activeIconContainer: {
    backgroundColor: COLORS.primarySoft,
  },


  iconBox: {
    width: 25,
    height: 25,

    position: 'relative',

    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =======================================================
     HOME ICON
     ======================================================= */

  homeRoof: {
    width: 15,
    height: 15,

    position: 'absolute',
    top: 1,

    transform: [
      {
        rotate: '45deg',
      },
    ],

    borderWidth: 2,

    borderRadius: 3,
  },


  homeBody: {
    width: 17,
    height: 13,

    position: 'absolute',
    bottom: 3,

    borderWidth: 2,
    borderTopWidth: 0,

    borderRadius: 2,
  },


  homeDoor: {
    width: 4,
    height: 7,

    position: 'absolute',
    bottom: 3,

    borderRadius: 2,
  },


  /* =======================================================
     BELL ICON
     ======================================================= */

  bellBody: {
    width: 16,
    height: 17,

    position: 'absolute',
    top: 3,

    borderRadius: 9,

    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },


  bellTop: {
    width: 5,
    height: 3,

    position: 'absolute',
    top: 1,

    borderRadius: 3,
  },


  bellClapper: {
    width: 5,
    height: 3,

    position: 'absolute',
    bottom: 2,

    borderRadius: 3,
  },


  /* =======================================================
     GAMES ICON
     ======================================================= */

  gameShape: {
    width: 21,
    height: 15,

    position: 'absolute',

    borderRadius: 7,
  },


  gameHorizontal: {
    width: 7,
    height: 2,

    position: 'absolute',

    left: 5,
    top: 11,

    borderRadius: 2,
  },


  gameVertical: {
    width: 2,
    height: 7,

    position: 'absolute',

    left: 7.5,
    top: 8,

    borderRadius: 2,
  },


  gameDot: {
    width: 3.5,
    height: 3.5,

    position: 'absolute',

    right: 5,
    top: 10,

    borderRadius: 2,
  },


  /* =======================================================
     CIRCLE ICON
     ======================================================= */

  personHead: {
    width: 7,
    height: 7,

    position: 'absolute',

    top: 1,

    borderRadius: 4,
  },


  personBody: {
    width: 13,
    height: 8,

    position: 'absolute',

    top: 9,

    borderRadius: 7,
  },


  personSmallHead: {
    width: 5,
    height: 5,

    position: 'absolute',

    right: 1,
    top: 6,

    borderRadius: 3,
  },


  personSmallBody: {
    width: 8,
    height: 5,

    position: 'absolute',

    right: 0,
    bottom: 3,

    borderRadius: 5,
  },


  /* =======================================================
     PROFILE ICON
     ======================================================= */

  profileHead: {
    width: 9,
    height: 9,

    position: 'absolute',

    top: 2,

    borderRadius: 5,
  },


  profileBody: {
    width: 17,
    height: 10,

    position: 'absolute',

    bottom: 2,

    borderRadius: 9,
  },


  /* =======================================================
     LABEL
     ======================================================= */

  label: {
    fontSize: 9.5,
    lineHeight: 13,

    color: COLORS.muted,

    fontWeight: '700',

    marginTop: 3,

    maxWidth: 65,

    textAlign: 'center',
  },


  activeLabel: {
    color: COLORS.primaryDark,

    fontWeight: '900',
  },


  /* =======================================================
     INDICATOR
     ======================================================= */

  indicator: {
    width: 18,
    height: 3,

    borderRadius: 2,

    marginTop: 3,
  },


  activeIndicator: {
    backgroundColor: COLORS.primary,
  },


  inactiveIndicator: {
    backgroundColor: 'transparent',
  },
});