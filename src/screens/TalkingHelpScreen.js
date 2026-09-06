import React, {useEffect, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

const quick=['What should I do now?','When is my medicine?','Who is in my circle?','Play a memory game'];
export default function TalkingHelpScreen({onBack, initialMessage = ''}){
 const [messages,setMessages]=useState([{from:'ai',text:'Hello. I’m here with you. How can I help today?'}]);
 useEffect(() => {
   const text = String(initialMessage || '').trim();
   if (!text) {
     setMessages([{from:'ai',text:'Hello. I’m here with you. How can I help today?'}]);
     return;
   }
   setMessages([{from:'ai',text:'Of course. I’m listening. How can I help?'},{from:'user',text},{from:'ai',text:'I heard you. Take your time and choose one of the options below if you need help.'}]);
 }, [initialMessage]);
 const ask=q=>{let answer='Of course. Take your time. You are doing well.';if(q.includes('medicine'))answer='Your next medicine reminder is at 8:00 AM. Please follow the plan given by your doctor or caregiver.';if(q.includes('circle'))answer='Your trusted circle includes family and caregivers. Open Your Circle to see them.';if(q.includes('game'))answer='Let’s keep your mind active. Try Memory Match for a few minutes.';setMessages([...messages,{from:'user',text:q},{from:'ai',text:answer}]);};
 return <View style={styles.screen}><Header onBack={onBack} title="Talking Help" right={<View style={styles.online}><View style={styles.onlineDot}/><Text style={styles.onlineText}>Online</Text></View>} /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <View style={styles.assistant}><View style={styles.assistantIcon}><Text style={styles.brain}>◌</Text></View><View style={{flex:1}}><Text style={styles.assistantTitle}>Smaran Assistant</Text><Text style={styles.assistantSub}>Calm, simple and ready to listen.</Text></View></View>
 {messages.map((m,i)=><View key={i} style={[styles.bubble,m.from==='user'?styles.userBubble:styles.aiBubble]}><Text style={styles.bubbleText}>{m.text}</Text></View>)}
 <Text style={styles.section}>TRY ASKING</Text>
 {quick.map(q=><Pressable key={q} onPress={()=>ask(q)} style={styles.quick}><Text style={styles.quickText}>{q}</Text><Text style={styles.quickArrow}>›</Text></Pressable>)}
 <Pressable onPress={()=>ask('I need someone to talk to')} style={styles.mic}><View style={styles.micCircle}><Text style={styles.micIcon}>●</Text></View><View><Text style={styles.micTitle}>Tap to talk</Text><Text style={styles.micSub}>Voice assistance</Text></View><Text style={styles.micArrow}>→</Text></Pressable>
 </ScrollView></View>;
}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:16,paddingBottom:30},online:{flexDirection:'row',alignItems:'center'},onlineDot:{width:7,height:7,borderRadius:4,backgroundColor:COLORS.primary,marginRight:4},onlineText:{fontSize:9,color:COLORS.primaryDark,fontWeight:'900'},assistant:{backgroundColor:COLORS.primaryDeep,borderRadius:21,padding:16,flexDirection:'row',alignItems:'center',...SHADOW},assistantIcon:{width:52,height:52,borderRadius:18,backgroundColor:'rgba(255,255,255,.13)',alignItems:'center',justifyContent:'center',marginRight:12},brain:{fontSize:28,color:COLORS.white},assistantTitle:{fontSize:17,fontWeight:'900',color:COLORS.white},assistantSub:{fontSize:11,color:COLORS.mint,marginTop:3},bubble:{maxWidth:'84%',padding:14,borderRadius:18,marginTop:12,...SHADOW},aiBubble:{alignSelf:'flex-start',backgroundColor:COLORS.white,borderBottomLeftRadius:5},userBubble:{alignSelf:'flex-end',backgroundColor:COLORS.primarySoft,borderBottomRightRadius:5},bubbleText:{fontSize:13,color:COLORS.text,lineHeight:19},section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2,marginTop:22,marginBottom:9},quick:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:15,padding:14,marginBottom:8,flexDirection:'row',alignItems:'center'},quickText:{fontSize:12.5,color:COLORS.text,fontWeight:'700',flex:1},quickArrow:{fontSize:24,color:COLORS.primaryDark},mic:{marginTop:15,height:78,borderRadius:21,backgroundColor:COLORS.primary,alignItems:'center',paddingHorizontal:15,flexDirection:'row',...SHADOW},micCircle:{width:46,height:46,borderRadius:23,backgroundColor:COLORS.white,alignItems:'center',justifyContent:'center',marginRight:11},micIcon:{fontSize:17,color:COLORS.primaryDark},micTitle:{fontSize:14,color:COLORS.white,fontWeight:'900'},micSub:{fontSize:10,color:COLORS.mint,marginTop:2},micArrow:{fontSize:22,color:COLORS.white,marginLeft:'auto'}});
