import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

const GAME_CARDS = [
  ['✦', 'Memory Match', 'Match familiar pairs and exercise recall.'],
  ['123', 'Daily Recall', 'Remember a short sequence and repeat it.'],
  ['◇', 'Pattern Tap', 'Find the next shape in a simple pattern.'],
];

export default function GamesScreen({onBack}) {
  const [game, setGame] = useState(null);
  if (game === 'Memory Match') return <MemoryMatch onBack={() => setGame(null)} />;
  return <View style={styles.screen}><Header onBack={onBack} title="Mind Games" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><View style={styles.heroIcon}><Text style={styles.heroIconText}>✦</Text></View><View style={{flex:1}}><Text style={styles.heroTitle}>A little play every day</Text><Text style={styles.heroText}>Short, calm activities. No pressure — just practice.</Text></View></View>
    <Text style={styles.section}>CHOOSE AN ACTIVITY</Text>
    {GAME_CARDS.map(([icon,title,text]) => <Pressable key={title} style={({pressed})=>[styles.card,pressed&&styles.pressed]} onPress={()=>setGame(title)}><View style={styles.gameIcon}><Text style={styles.gameIconText}>{icon}</Text></View><View style={{flex:1}}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{text}</Text><Text style={styles.play}>PLAY  →</Text></View><Text style={styles.chevron}>›</Text></Pressable>)}
  </ScrollView></View>;
}

function MemoryMatch({onBack}) {
  const values = useMemo(() => ['♥','♥','☀','☀','★','★'].sort(() => Math.random()-0.5), []);
  const [open,setOpen]=useState([]); const [matched,setMatched]=useState([]); const [moves,setMoves]=useState(0);
  const tap=i=>{if(open.includes(i)||matched.includes(i)||open.length===2)return;const next=[...open,i];setOpen(next);if(next.length===2){setMoves(moves+1);if(values[next[0]]===values[next[1]]){setMatched([...matched,...next]);setOpen([]);}else setTimeout(()=>setOpen([]),650);}};
  const done=matched.length===values.length;
  return <View style={styles.screen}><Header onBack={onBack} title="Memory Match" /><View style={styles.gameArea}><View style={styles.scoreCard}><Text style={styles.scoreLabel}>YOUR PROGRESS</Text><Text style={styles.score}>{done?'Wonderful! All pairs matched.':`${moves} moves`}</Text></View><Text style={styles.help}>Tap two cards to find the matching pair.</Text><View style={styles.grid}>{values.map((v,i)=>{const visible=open.includes(i)||matched.includes(i);return <Pressable key={i} onPress={()=>tap(i)} style={[styles.tile,visible&&styles.tileOpen]}><Text style={styles.tileText}>{visible?v:'?'}</Text></Pressable>})}</View><Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backButtonText}>Back to Games</Text></Pressable></View></View>;
}

const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:16,paddingBottom:30},hero:{backgroundColor:COLORS.primaryDeep,borderRadius:21,padding:16,flexDirection:'row',alignItems:'center',...SHADOW},heroIcon:{width:52,height:52,borderRadius:18,backgroundColor:'rgba(255,255,255,0.13)',alignItems:'center',justifyContent:'center',marginRight:12},heroIconText:{fontSize:29,color:COLORS.white},heroTitle:{fontSize:17,fontWeight:'900',color:COLORS.white},heroText:{fontSize:11,color:COLORS.mint,marginTop:4,lineHeight:15},section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2,marginTop:22,marginBottom:10},card:{backgroundColor:COLORS.white,borderRadius:20,padding:15,marginBottom:11,flexDirection:'row',alignItems:'center',...SHADOW},pressed:{opacity:.85},gameIcon:{width:58,height:58,borderRadius:18,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:12},gameIconText:{fontSize:25,color:COLORS.primaryDark,fontWeight:'900'},title:{fontSize:17,fontWeight:'900',color:COLORS.text},text:{fontSize:11.5,color:COLORS.muted,marginTop:4,lineHeight:16},play:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',marginTop:8},chevron:{fontSize:29,color:COLORS.primaryDark},gameArea:{padding:22,alignItems:'center'},scoreCard:{width:'100%',backgroundColor:COLORS.white,borderRadius:20,padding:16,...SHADOW},scoreLabel:{fontSize:9,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2},score:{fontSize:20,fontWeight:'900',color:COLORS.text,marginTop:4},help:{fontSize:13,color:COLORS.muted,textAlign:'center',marginTop:15},grid:{width:300,flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:13,marginTop:28},tile:{width:88,height:88,borderRadius:19,backgroundColor:COLORS.primaryDeep,alignItems:'center',justifyContent:'center',...SHADOW},tileOpen:{backgroundColor:COLORS.primarySoft},tileText:{fontSize:38,color:COLORS.white,fontWeight:'900'},backButton:{marginTop:30,paddingVertical:14,paddingHorizontal:25,borderRadius:15,backgroundColor:COLORS.primary},backButtonText:{color:COLORS.white,fontWeight:'900',fontSize:14}});
