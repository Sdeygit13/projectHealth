import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Logo from './Logo';
import {COLORS, SHADOW} from '../theme';


/* =========================================================
   SMARAN HEADER
   ========================================================= */

export default function Header({
  onBack,
  title,
  right,
}) {

  const hasBack = typeof onBack === 'function';

  const handleBack = () => {
    if (hasBack) {
      onBack();
    }
  };


  return (
    <View style={styles.header}>

      {/* ===================================================
          LEFT — BACK BUTTON
          =================================================== */}

      <View style={styles.sideContainer}>

        <Pressable
          onPress={handleBack}
          disabled={!hasBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityState={{
            disabled: !hasBack,
          }}
          style={({pressed}) => [
            styles.backButton,
            !hasBack && styles.backButtonDisabled,
            pressed && hasBack && styles.backButtonPressed,
          ]}
        >

          <Text style={styles.backArrow}>‹</Text>

          <Text style={styles.backLabel}>
            Back
          </Text>

        </Pressable>

      </View>


      {/* ===================================================
          CENTER — TITLE / LOGO
          =================================================== */}

      <View
        pointerEvents="none"
        style={styles.center}
      >

        {title ? (
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {title}
          </Text>
        ) : (
          <Logo size={40} />
        )}

      </View>


      {/* ===================================================
          RIGHT — OPTIONAL ACTION
          =================================================== */}

      <View style={styles.sideContainer}>
        {right || <View style={styles.emptyRight} />}
      </View>

    </View>
  );
}


/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create({

  /* =======================================================
     HEADER
     ======================================================= */

  header: {
    height: 66,

    paddingHorizontal: 10,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.white,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,

    ...SHADOW,
  },


  /* =======================================================
     SIDE CONTAINERS
     Keeps the title visually centered.
     ======================================================= */

  sideContainer: {
    width: 82,

    alignItems: 'center',
    justifyContent: 'center',
  },


  /* =======================================================
     CENTER
     ======================================================= */

  center: {
    flex: 1,

    minWidth: 0,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 8,
  },


  /* =======================================================
     TITLE
     ======================================================= */

  title: {
    maxWidth: '100%',

    fontSize: 19,
    lineHeight: 24,

    color: COLORS.primaryDeep,

    fontWeight: '900',

    textAlign: 'center',
  },


  /* =======================================================
     BACK BUTTON
     ======================================================= */

  backButton: {
    minWidth: 74,
    height: 46,

    paddingHorizontal: 7,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    borderRadius: 14,
  },


  backButtonPressed: {
    backgroundColor: COLORS.primarySoft,

    opacity: 0.75,
  },


  backButtonDisabled: {
    opacity: 0.45,
  },


  /* =======================================================
     BACK ARROW
     ======================================================= */

  backArrow: {
    fontSize: 32,
    lineHeight: 35,

    color: COLORS.primaryDark,

    fontWeight: '500',

    marginRight: 1,

    includeFontPadding: false,
  },


  /* =======================================================
     BACK LABEL
     ======================================================= */

  backLabel: {
    fontSize: 12,

    lineHeight: 16,

    color: COLORS.primaryDark,

    fontWeight: '900',

    includeFontPadding: false,
  },


  /* =======================================================
     EMPTY RIGHT AREA
     ======================================================= */

  emptyRight: {
    width: 64,
    height: 44,
  },

});