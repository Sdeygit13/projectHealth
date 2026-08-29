import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS, SHADOW} from '../theme';

export default function FeatureCard({title, subtitle, icon, button, onPress, color = COLORS.white}) {
  return (
    <Pressable onPress={onPress} style={({pressed}) => [styles.card, {backgroundColor: color}, pressed && styles.pressed]}>
      <View style={styles.iconBox}><Text style={styles.icon}>{icon}</Text></View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.arrowBox}>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    borderRadius: 20,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 11,
    ...SHADOW,
  },
  pressed: {opacity: 0.85, transform: [{scale: 0.99}]},
  iconBox: {width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.82)', alignItems: 'center', justifyContent: 'center'},
  icon: {fontSize: 29},
  copy: {flex: 1, paddingHorizontal: 12},
  title: {fontSize: 15.5, fontWeight: '900', color: COLORS.text, letterSpacing: 0.2},
  subtitle: {fontSize: 11.5, color: COLORS.muted, marginTop: 4, lineHeight: 16},
  arrowBox: {width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center'},
  arrow: {fontSize: 27, lineHeight: 29, color: COLORS.primaryDark},
});
