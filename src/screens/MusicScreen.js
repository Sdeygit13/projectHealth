import React, {useEffect, useRef, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Sound from 'react-native-sound';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

const MUSIC_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export default function MusicScreen({onBack}) {
  const soundRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => () => {
    try {
      soundRef.current?.stop();
      soundRef.current?.release();
    } catch (error) {
      console.log('Music cleanup error:', error);
    }
    soundRef.current = null;
  }, []);

  const toggle = () => {
    if (playing) {
      soundRef.current?.pause();
      setPlaying(false);
      return;
    }

    if (soundRef.current) {
      soundRef.current.play(success => {
        setPlaying(false);
        if (!success) console.log('Music playback failed.');
      });
      setPlaying(true);
      return;
    }

    setLoading(true);
    const sound = new Sound(MUSIC_URL, null, error => {
      setLoading(false);
      if (error) {
        console.log('Music load error:', error);
        return;
      }
      soundRef.current = sound;
      sound.setVolume(0.75);
      sound.play(success => {
        setPlaying(false);
        if (!success) console.log('Music playback failed.');
      });
      setPlaying(true);
    });
  };

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Music" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.note}>♪</Text></View>
          <Text style={styles.eyebrow}>CALM MUSIC</Text>
          <Text style={styles.title}>Music for peaceful moments</Text>
          <Text style={styles.sub}>A gentle soundtrack can make routines and memory activities feel more comfortable.</Text>
        </View>
        <Pressable onPress={toggle} style={({pressed}) => [styles.track, pressed && styles.pressed]}>
          <View style={styles.album}><Text style={styles.albumText}>♫</Text></View>
          <View style={styles.trackCopy}>
            <Text style={styles.trackTitle}>Peaceful Moments</Text>
            <Text style={styles.trackSub}>{loading ? 'Loading music…' : playing ? 'Now playing' : 'Tap to play'}</Text>
          </View>
          <View style={styles.play}><Text style={styles.playText}>{playing ? 'Ⅱ' : '▶'}</Text></View>
        </Pressable>
        <Text style={styles.noteText}>Music uses the internet connection to stream the selected track.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},
  content:{padding:16,paddingBottom:30},
  hero:{backgroundColor:COLORS.primaryDeep,borderRadius:23,padding:20,...SHADOW},
  heroIcon:{width:56,height:56,borderRadius:19,backgroundColor:'rgba(255,255,255,.13)',alignItems:'center',justifyContent:'center'},
  note:{fontSize:34,color:COLORS.white},
  eyebrow:{marginTop:18,fontSize:9,color:COLORS.mint,fontWeight:'900',letterSpacing:1.3},
  title:{marginTop:5,fontSize:24,lineHeight:30,color:COLORS.white,fontWeight:'900'},
  sub:{marginTop:6,fontSize:12,lineHeight:18,color:COLORS.mint},
  track:{marginTop:15,backgroundColor:COLORS.white,borderRadius:21,padding:14,flexDirection:'row',alignItems:'center',...SHADOW},
  album:{width:62,height:62,borderRadius:19,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'},
  albumText:{fontSize:29,color:COLORS.primaryDark},
  trackCopy:{flex:1,marginLeft:12},
  trackTitle:{fontSize:16,color:COLORS.text,fontWeight:'900'},
  trackSub:{marginTop:3,fontSize:10.5,color:COLORS.muted},
  play:{width:47,height:47,borderRadius:24,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center'},
  playText:{fontSize:18,color:COLORS.white,fontWeight:'900'},
  noteText:{marginTop:12,fontSize:10,color:COLORS.muted,lineHeight:15,textAlign:'center'},
  pressed:{opacity:.8,transform:[{scale:.99}]},
});
