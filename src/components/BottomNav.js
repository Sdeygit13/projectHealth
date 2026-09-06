import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Icon from './Icon';
import {COLORS, SHADOW} from '../theme';

const ITEMS = [
  {key: 'home', label: 'Home', icon: 'house'},
  {key: 'circle', label: 'Family', icon: 'users-round'},
  {key: 'photos', label: 'Photos', icon: 'image'},
  {key: 'music', label: 'Music', icon: 'music-2'},
  {key: 'relax', label: 'Relax', icon: 'droplets'},
];

export default function BottomNav({active = 'home', onNavigate}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.navBar}>
        {ITEMS.map(item => {
          const selected = active === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onNavigate?.(item.key)}
              style={({pressed}) => [styles.navItem, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.label}`}
              accessibilityState={{selected}}>
              <View style={[styles.iconCircle, selected && styles.iconCircleActive]}>
                <Icon
                  name={item.icon}
                  size={21}
                  color={selected ? COLORS.primaryDark : '#7E827B'}
                  strokeWidth={selected ? 2.25 : 1.9}
                />
              </View>
              <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
              <View style={[styles.indicator, selected && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 13,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  navBar: {
    minHeight: 72,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    ...SHADOW,
  },
  navItem: {
    flex: 1,
    minHeight: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    borderRadius: 18,
  },
  iconCircle: {
    width: 39,
    height: 34,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {backgroundColor: '#F3E8CF'},
  label: {
    marginTop: 3,
    fontSize: 9.5,
    lineHeight: 13,
    color: COLORS.muted,
    fontWeight: '700',
    textAlign: 'center',
  },
  labelActive: {color: COLORS.text, fontWeight: '900'},
  indicator: {
    width: 18,
    height: 3,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  indicatorActive: {backgroundColor: COLORS.primaryDark},
  pressed: {opacity: 0.65},
});
