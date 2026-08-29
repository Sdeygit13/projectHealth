import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../theme';

export default function Logo({size = 52, showText = true}) {
  return (
    <View style={styles.row}>
      <Image source={require('../assets/logo.png')} style={{width: size, height: size}} resizeMode="contain" />
      {showText && <Text style={[styles.text, {fontSize: Math.max(22, size * 0.48)}]}>Smaran</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  text: {fontWeight: '900', color: COLORS.primaryDeep, marginLeft: 8, letterSpacing: -0.7},
});
