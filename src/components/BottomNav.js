import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../theme';

const items = [
  ['home', '⌂', 'Home'],
  ['photos', '▤', 'Memories'],
  ['games', '✦', 'Games'],
  ['talk', '◉', 'Connect'],
  ['profile', '●', 'Profile'],
];

export default function BottomNav({active = 'home', onNavigate}) {
  return (
    <View style={styles.bar}>
      {items.map(([key, icon, label]) => {
        const selected = active === key;
        return (
          <Pressable
            key={key}
            onPress={() => onNavigate(key)}
            style={({pressed}) => [styles.item, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{selected}}>
            <View style={[styles.iconWrap, selected && styles.activeWrap]}>
              <Text style={[styles.icon, selected && styles.activeIcon]}>{icon}</Text>
            </View>
            <Text style={[styles.label, selected && styles.activeLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:{height:78,backgroundColor:COLORS.white,borderTopWidth:1,borderTopColor:COLORS.border,flexDirection:'row',justifyContent:'space-around',alignItems:'center',paddingBottom:7},
  item:{alignItems:'center',width:68},
  pressed:{opacity:0.7},
  iconWrap:{width:42,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
  activeWrap:{backgroundColor:COLORS.primarySoft},
  icon:{fontSize:22,color:COLORS.muted},
  activeIcon:{color:COLORS.primaryDark},
  label:{fontSize:10.5,marginTop:3,color:COLORS.muted,fontWeight:'700'},
  activeLabel:{color:COLORS.primaryDark,fontWeight:'900'},
});
