import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Logo from './Logo';
import {COLORS} from '../theme';

export default function Header({onBack, title, right}) {
  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    }
  };

  return (
    <View style={styles.header}>
      <Pressable
        onPress={handleBack}
        disabled={typeof onBack !== 'function'}
        style={({pressed}) => [
          styles.back,
          pressed && styles.backPressed,
        ]}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>‹</Text>
        <Text style={styles.backLabel}>Back</Text>
      </Pressable>

      <View style={styles.center}>
        {title ? <Text style={styles.title}>{title}</Text> : <Logo size={40} />}
      </View>

      <View style={styles.right}>
        {right || <View style={{width: 64}} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: {
    minWidth: 78,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  backPressed: {
    opacity: 0.65,
    backgroundColor: COLORS.primarySoft,
  },
  backText: {
    fontSize: 34,
    lineHeight: 38,
    color: COLORS.primaryDark,
    fontWeight: '700',
    marginRight: 1,
  },
  backLabel: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: '900',
  },
  center: {flex: 1, alignItems: 'center'},
  title: {fontSize: 19, fontWeight: '900', color: COLORS.primaryDeep},
  right: {minWidth: 64, alignItems: 'center'},
});
