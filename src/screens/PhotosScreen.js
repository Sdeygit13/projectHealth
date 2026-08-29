import React from 'react';
import {Image, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

export default function PhotosScreen({onBack}){
 return <View style={styles.screen}><Header onBack={onBack} title="Your Memories" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
  <Text style={styles.eyebrow}>MEMORY ALBUM</Text><Text style={styles.heading}>People & moments</Text><Text style={styles.sub}>Familiar faces can make every day feel closer to home.</Text>
  <View style={styles.hero}><Image source={require('../assets/couple.png')} style={styles.photo} resizeMode="cover"/><View style={styles.caption}><Text style={styles.captionTitle}>Asha & Family</Text><Text style={styles.captionSub}>A cherished memory</Text></View></View>
  <Text style={styles.section}>MEMORY COLLECTIONS</Text><View style={styles.row}><Memory label="Family" icon="♥"/><Memory label="Festivals" icon="✦"/><Memory label="Places" icon="◇"/></View>
  <Pressable style={styles.add} onPress={()=>{}}><Text style={styles.addPlus}>＋</Text><Text style={styles.addText}>Add a Memory</Text></Pressable>
 </ScrollView></View>;
}
function Memory({label,icon}){return <View style={styles.memory}><View style={styles.memoryIcon}><Text style={styles.memoryIconText}>{icon}</Text></View><Text style={styles.memoryText}>{label}</Text></View>}
const styles=StyleSheet.create({screen:{flex:1,backgroundColor:COLORS.background},content:{padding:16,paddingBottom:30},eyebrow:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2},heading:{fontSize:25,fontWeight:'900',color:COLORS.text,marginTop:5},sub:{fontSize:12,color:COLORS.muted,lineHeight:17,marginTop:4},hero:{backgroundColor:COLORS.white,borderRadius:22,overflow:'hidden',marginTop:18,...SHADOW},photo:{width:'100%',height:250},caption:{padding:14},captionTitle:{fontSize:16,fontWeight:'900',color:COLORS.text},captionSub:{fontSize:10.5,color:COLORS.muted,marginTop:3},section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2,marginTop:22,marginBottom:10},row:{flexDirection:'row',gap:9},memory:{flex:1,backgroundColor:COLORS.white,borderRadius:18,paddingVertical:15,alignItems:'center',...SHADOW},memoryIcon:{width:42,height:42,borderRadius:21,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'},memoryIconText:{fontSize:20,color:COLORS.primaryDark,fontWeight:'900'},memoryText:{fontSize:11,color:COLORS.text,fontWeight:'800',marginTop:7},add:{height:54,borderRadius:17,borderWidth:1.5,borderColor:COLORS.primary,borderStyle:'dashed',alignItems:'center',justifyContent:'center',flexDirection:'row',marginTop:12},addPlus:{fontSize:20,color:COLORS.primaryDark},addText:{fontSize:14,color:COLORS.primaryDark,fontWeight:'900',marginLeft:5}});
