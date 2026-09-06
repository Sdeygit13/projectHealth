import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

export default function RelaxScreen({onBack}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => {
      setSeconds(value => {
        if (value <= 1) {
          setRunning(false);
          return 60;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const toggle = () => {
    if (!running && seconds === 0) setSeconds(60);
    setRunning(value => !value);
  };

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Relax" />
      <View style={styles.content}>
        <Text style={styles.eyebrow}>TAKE A BREATH</Text>
        <Text style={styles.title}>A quiet minute for you</Text>
        <Text style={styles.sub}>Follow the circle, breathe slowly, and let your shoulders relax.</Text>
        <View style={[styles.circle, running && styles.circleRunning]}>
          <View style={styles.innerCircle}>
            <Text style={styles.timer}>{minutes}:{secs}</Text>
            <Text style={styles.breathe}>{running ? 'Breathe slowly' : 'Ready when you are'}</Text>
          </View>
        </View>
        <Pressable onPress={toggle} style={({pressed}) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{running ? 'Pause' : 'Start Relaxing'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  content:{flex:1,padding:20,alignItems:'center'},
  eyebrow:{marginTop:15,fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.3},
  title:{marginTop:5,fontSize:25,color:COLORS.text,fontWeight:'900',textAlign:'center'},
  sub:{marginTop:6,fontSize:12,lineHeight:18,color:COLORS.muted,textAlign:'center',maxWidth:330},
  circle:{marginTop:55,width:230,height:230,borderRadius:115,backgroundColor:'#E5F0D8',alignItems:'center',justifyContent:'center',...SHADOW},
  circleRunning:{transform:[{scale:1.03}]},
  innerCircle:{width:190,height:190,borderRadius:95,backgroundColor:COLORS.white,alignItems:'center',justifyContent:'center'},
  timer:{fontSize:35,color:COLORS.primaryDark,fontWeight:'900'},
  breathe:{marginTop:6,fontSize:11,color:COLORS.muted,fontWeight:'700'},
  button:{marginTop:45,minWidth:180,height:54,borderRadius:18,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',...SHADOW},
  buttonText:{fontSize:14,color:COLORS.white,fontWeight:'900'},
  pressed:{opacity:.8,transform:[{scale:.98}]},
});
