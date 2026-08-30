import React, {useMemo, useState} from 'react';
import {Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import Header from '../components/Header';
import {COLORS, SHADOW} from '../theme';

const COLLECTIONS = [
  {id: 'family', label: 'Family', icon: '♥'},
  {id: 'festivals', label: 'Festivals', icon: '✦'},
  {id: 'places', label: 'Places', icon: '◇'},
];
const FALLBACK_IMAGE = require('../assets/couple.png');
const makeId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const getCollection = id => COLLECTIONS.find(item => item.id === id) || COLLECTIONS[0];
const imageSource = image => image?.uri ? {uri: image.uri} : FALLBACK_IMAGE;

const normalizeAlbum = album => {
  if (!album || !Array.isArray(album.images)) return null;
  const images = album.images.map(item => typeof item === 'string' ? {uri: item} : item).filter(item => item?.uri);
  if (!images.length) return null;
  return {
    id: String(album.id || makeId('album')),
    title: String(album.title || 'Family Memories').trim() || 'Family Memories',
    description: String(album.description || 'A cherished collection').trim(),
    collection: album.collection || 'family',
    images,
  };
};

function AlbumCard({album, onOpen, onDelete}) {
  const collection = getCollection(album.collection);
  return (
    <View style={styles.albumCard}>
      <Pressable onPress={() => onOpen(album)} style={styles.albumPressable}>
        <View style={styles.albumGrid}>
          {album.images.slice(0, 4).map((image, index) => (
            <Image key={`${album.id}-${index}`} source={imageSource(image)} style={styles.gridImage} resizeMode="cover" />
          ))}
          {album.images.length === 1 ? <View style={styles.gridFill}><Text style={styles.gridFillText}>1</Text></View> : null}
        </View>
        <View style={styles.albumInfo}>
          <View style={styles.albumTitleRow}><Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text><Text style={styles.photoCount}>{album.images.length} {album.images.length === 1 ? 'photo' : 'photos'}</Text></View>
          <Text style={styles.albumDescription} numberOfLines={2}>{album.description}</Text>
          <View style={styles.collectionPill}><Text style={styles.collectionPillIcon}>{collection.icon}</Text><Text style={styles.collectionPillText}>{collection.label}</Text></View>
        </View>
      </Pressable>
      <Pressable onPress={() => onDelete(album)} style={styles.deleteAlbum}><Text style={styles.deleteAlbumText}>×</Text></Pressable>
    </View>
  );
}

export default function PhotosScreen({onBack, albums: albumsProp, onAlbumsChange, onMemoryCountChange}) {
  const [localAlbums, setLocalAlbums] = useState([]);
  const [collection, setCollection] = useState('all');
  const [editor, setEditor] = useState(null);
  const [viewer, setViewer] = useState(null);
  const albums = Array.isArray(albumsProp) ? albumsProp.map(normalizeAlbum).filter(Boolean) : localAlbums;

  const updateAlbums = updater => {
    if (typeof onAlbumsChange === 'function') onAlbumsChange(updater);
    else setLocalAlbums(prev => typeof updater === 'function' ? updater(prev) : updater);
  };

  const photoCount = useMemo(() => albums.reduce((sum, album) => sum + album.images.length, 0), [albums]);
  const filtered = collection === 'all' ? albums : albums.filter(album => album.collection === collection);

  React.useEffect(() => {
    if (typeof onMemoryCountChange === 'function') onMemoryCountChange(photoCount);
  }, [photoCount, onMemoryCountChange]);

  const choosePhotos = async () => {
    try {
      const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 0, includeBase64: false});
      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert('Gallery unavailable', result.errorMessage || 'Unable to open your gallery.');
        return;
      }
      const images = (result.assets || []).map(asset => asset?.uri ? {uri: asset.uri} : null).filter(Boolean);
      if (!images.length) return;
      setEditor({id: makeId('album'), title: 'Family Memories', description: 'A cherished collection', collection: 'family', images, isNew: true});
    } catch (error) {
      console.log('Gallery picker error:', error);
      Alert.alert('Gallery unavailable', 'Please make sure Smaran has photo access permission.');
    }
  };

  const saveAlbum = () => {
    const title = String(editor?.title || '').trim() || 'Family Memories';
    const next = {id: editor.id, title, description: String(editor.description || '').trim() || 'A cherished collection', collection: editor.collection || 'family', images: editor.images || []};
    if (!next.images.length) return Alert.alert('No photos selected', 'Please select at least one photo from your gallery.');
    updateAlbums(prev => editor.isNew ? [...prev, next] : prev.map(item => item.id === next.id ? next : item));
    setEditor(null);
  };

  const deleteAlbum = album => Alert.alert('Delete album?', `Remove “${album.title}” and its ${album.images.length} photo(s) from Smaran?`, [
    {text: 'Cancel', style: 'cancel'},
    {text: 'Delete', style: 'destructive', onPress: () => updateAlbums(prev => prev.filter(item => item.id !== album.id))},
  ]);

  return (
    <View style={styles.screen}>
      <Header onBack={onBack} title="Your Memories" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>MEMORY ALBUM</Text>
        <Text style={styles.heading}>People & moments</Text>
        <Text style={styles.sub}>Select many photos together and keep them as beautiful memory albums.</Text>

        <View style={styles.summary}><View style={styles.summaryIcon}><Text style={styles.summaryIconText}>▦</Text></View><View style={{flex: 1}}><Text style={styles.summaryTitle}>{albums.length} {albums.length === 1 ? 'album' : 'albums'}</Text><Text style={styles.summarySub}>{photoCount} saved {photoCount === 1 ? 'photo' : 'photos'}</Text></View><View style={styles.count}><Text style={styles.countText}>{photoCount}</Text></View></View>

        <View style={styles.filterRow}>
          <Pressable onPress={() => setCollection('all')} style={[styles.filter, collection === 'all' && styles.filterActive]}><Text style={[styles.filterText, collection === 'all' && styles.filterTextActive]}>All</Text></Pressable>
          {COLLECTIONS.map(item => <Pressable key={item.id} onPress={() => setCollection(item.id)} style={[styles.filter, collection === item.id && styles.filterActive]}><Text style={[styles.filterText, collection === item.id && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
        </View>

        <Text style={styles.section}>YOUR ALBUMS</Text>
        {filtered.length ? filtered.map(album => <AlbumCard key={album.id} album={album} onOpen={setViewer} onDelete={deleteAlbum}/>) : <View style={styles.empty}><Text style={styles.emptyIcon}>▧</Text><Text style={styles.emptyTitle}>No memory albums yet</Text><Text style={styles.emptyText}>Tap “Add Memory Album” and choose multiple photos from your device gallery.</Text></View>}

        <Pressable onPress={choosePhotos} style={styles.add}><Text style={styles.addPlus}>＋</Text><View style={{flex: 1}}><Text style={styles.addTitle}>Add Memory Album</Text><Text style={styles.addSub}>Choose multiple photos from your gallery</Text></View><Text style={styles.addArrow}>→</Text></Pressable>
      </ScrollView>

      <Modal visible={!!editor} transparent animationType="slide" onRequestClose={() => setEditor(null)}>
        <View style={styles.backdrop}><View style={styles.editor}>
          <View style={styles.modalHeader}><View><Text style={styles.eyebrow}>NEW MEMORY ALBUM</Text><Text style={styles.modalTitle}>{editor?.images?.length || 0} photos selected</Text></View><Pressable onPress={() => setEditor(null)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
          <Text style={styles.label}>Album name</Text><TextInput value={editor?.title || ''} onChangeText={v => setEditor(p => ({...p, title: v}))} placeholder="e.g. Durga Puja 2026" placeholderTextColor={COLORS.muted} style={styles.input}/>
          <Text style={styles.label}>Description</Text><TextInput value={editor?.description || ''} onChangeText={v => setEditor(p => ({...p, description: v}))} placeholder="A cherished collection" placeholderTextColor={COLORS.muted} style={styles.input}/>
          <Text style={styles.label}>Collection</Text><View style={styles.collectionRow}>{COLLECTIONS.map(item => <Pressable key={item.id} onPress={() => setEditor(p => ({...p, collection: item.id}))} style={[styles.collectionOption, editor?.collection === item.id && styles.collectionOptionActive]}><Text style={styles.collectionOptionIcon}>{item.icon}</Text><Text style={styles.collectionOptionText}>{item.label}</Text></Pressable>)}</View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewStrip}>{(editor?.images || []).map((image, index) => <Image key={index} source={imageSource(image)} style={styles.previewImage} resizeMode="cover" />)}</ScrollView>
          <Pressable onPress={saveAlbum} style={styles.save}><Text style={styles.saveText}>Save Album</Text><Text style={styles.saveArrow}>→</Text></Pressable>
          <Pressable onPress={choosePhotos} style={styles.secondary}><Text style={styles.secondaryText}>Choose different photos</Text></Pressable>
          <Pressable onPress={() => setEditor(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
        </View></View>
      </Modal>

      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={styles.viewerBackdrop}><Pressable onPress={() => setViewer(null)} style={styles.viewerClose}><Text style={styles.viewerCloseText}>×</Text></Pressable>{viewer ? <><ScrollView horizontal pagingEnabled style={styles.viewerScroll}>{viewer.images.map((image, index) => <View key={index} style={styles.viewerPage}><Image source={imageSource(image)} style={styles.viewerImage} resizeMode="contain"/></View>)}</ScrollView><View style={styles.viewerCaption}><Text style={styles.viewerTitle}>{viewer.title}</Text><Text style={styles.viewerSub}>{viewer.images.length} {viewer.images.length === 1 ? 'photo' : 'photos'} • {getCollection(viewer.collection).label}</Text></View></> : null}</View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.background},content:{padding:16,paddingBottom:34},eyebrow:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2},heading:{fontSize:25,lineHeight:31,color:COLORS.text,fontWeight:'900',marginTop:5},sub:{fontSize:12,lineHeight:17,color:COLORS.muted,marginTop:4},summary:{marginTop:16,backgroundColor:COLORS.white,borderRadius:18,padding:13,flexDirection:'row',alignItems:'center',...SHADOW},summaryIcon:{width:44,height:44,borderRadius:15,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center',marginRight:11},summaryIconText:{fontSize:22,color:COLORS.primaryDark},summaryTitle:{fontSize:14,color:COLORS.text,fontWeight:'900'},summarySub:{fontSize:10,color:COLORS.muted,marginTop:2},count:{width:37,height:37,borderRadius:19,backgroundColor:COLORS.mint,alignItems:'center',justifyContent:'center'},countText:{fontSize:12,color:COLORS.primaryDark,fontWeight:'900'},filterRow:{flexDirection:'row',gap:7,marginTop:14},filter:{paddingHorizontal:12,height:34,borderRadius:17,backgroundColor:COLORS.white,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:COLORS.border},filterActive:{backgroundColor:COLORS.primarySoft,borderColor:COLORS.primary},filterText:{fontSize:10,color:COLORS.muted,fontWeight:'800'},filterTextActive:{color:COLORS.primaryDark},section:{fontSize:10,color:COLORS.primaryDark,fontWeight:'900',letterSpacing:1.2,marginTop:22,marginBottom:10},albumCard:{backgroundColor:COLORS.white,borderRadius:20,marginBottom:12,overflow:'hidden',...SHADOW},albumPressable:{flexDirection:'row',minHeight:135},albumGrid:{width:135,height:135,flexDirection:'row',flexWrap:'wrap',backgroundColor:COLORS.primarySoft},gridImage:{width:'50%',height:'50%',borderWidth:.7,borderColor:COLORS.white},gridFill:{width:'50%',height:'50%',alignItems:'center',justifyContent:'center',backgroundColor:COLORS.primarySoft},gridFillText:{fontSize:18,color:COLORS.primaryDark,fontWeight:'900'},albumInfo:{flex:1,padding:13,paddingRight:38,justifyContent:'center'},albumTitleRow:{flexDirection:'row',alignItems:'center'},albumTitle:{flex:1,fontSize:15,color:COLORS.text,fontWeight:'900'},photoCount:{fontSize:8.5,color:COLORS.primaryDark,fontWeight:'900',marginLeft:6},albumDescription:{fontSize:10.5,color:COLORS.muted,lineHeight:15,marginTop:5},collectionPill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',backgroundColor:COLORS.mint,borderRadius:9,paddingHorizontal:7,paddingVertical:4,marginTop:8},collectionPillIcon:{fontSize:10,color:COLORS.primaryDark},collectionPillText:{fontSize:8.5,color:COLORS.primaryDark,fontWeight:'900',marginLeft:4},deleteAlbum:{position:'absolute',right:9,top:9,width:28,height:28,borderRadius:14,backgroundColor:'rgba(198,74,74,.1)',alignItems:'center',justifyContent:'center'},deleteAlbumText:{fontSize:18,color:COLORS.danger},empty:{backgroundColor:COLORS.white,borderRadius:19,padding:27,alignItems:'center',...SHADOW},emptyIcon:{fontSize:30,color:COLORS.primaryDark},emptyTitle:{fontSize:16,color:COLORS.text,fontWeight:'900',marginTop:9},emptyText:{fontSize:11.5,lineHeight:17,color:COLORS.muted,textAlign:'center',marginTop:5},add:{minHeight:64,borderRadius:18,borderWidth:1.5,borderColor:COLORS.primary,borderStyle:'dashed',paddingHorizontal:13,flexDirection:'row',alignItems:'center',marginTop:2},addPlus:{fontSize:21,color:COLORS.primaryDark,marginRight:10},addTitle:{fontSize:13.5,color:COLORS.primaryDark,fontWeight:'900'},addSub:{fontSize:9.5,color:COLORS.muted,marginTop:2},addArrow:{fontSize:20,color:COLORS.primaryDark},backdrop:{flex:1,backgroundColor:'rgba(0,0,0,.45)',justifyContent:'flex-end'},editor:{backgroundColor:COLORS.white,borderTopLeftRadius:28,borderTopRightRadius:28,padding:20,paddingBottom:24},modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},modalTitle:{fontSize:20,color:COLORS.text,fontWeight:'900',marginTop:4},close:{width:38,height:38,borderRadius:19,backgroundColor:COLORS.primarySoft,alignItems:'center',justifyContent:'center'},closeText:{fontSize:24,color:COLORS.primaryDark},label:{fontSize:12,color:COLORS.text,fontWeight:'900',marginTop:16,marginBottom:7},input:{height:50,borderRadius:15,borderWidth:1.2,borderColor:COLORS.border,paddingHorizontal:14,fontSize:14,color:COLORS.text,fontWeight:'700'},collectionRow:{flexDirection:'row',gap:7},collectionOption:{flex:1,height:45,borderRadius:13,borderWidth:1,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},collectionOptionActive:{backgroundColor:COLORS.primarySoft,borderColor:COLORS.primary},collectionOptionIcon:{fontSize:15,color:COLORS.primaryDark},collectionOptionText:{fontSize:9,color:COLORS.text,fontWeight:'800',marginTop:2},previewStrip:{marginTop:14},previewImage:{width:74,height:74,borderRadius:12,marginRight:7},save:{height:54,borderRadius:17,backgroundColor:COLORS.primary,marginTop:16,alignItems:'center',justifyContent:'center',flexDirection:'row'},saveText:{fontSize:14.5,color:COLORS.white,fontWeight:'900'},saveArrow:{fontSize:20,color:COLORS.white,marginLeft:9},secondary:{height:42,alignItems:'center',justifyContent:'center'},secondaryText:{fontSize:11.5,color:COLORS.primaryDark,fontWeight:'900'},cancel:{height:36,alignItems:'center',justifyContent:'center'},cancelText:{fontSize:11.5,color:COLORS.muted,fontWeight:'800'},viewerBackdrop:{flex:1,backgroundColor:'rgba(0,0,0,.92)'},viewerClose:{position:'absolute',right:18,top:42,zIndex:5,width:42,height:42,borderRadius:21,backgroundColor:'rgba(255,255,255,.14)',alignItems:'center',justifyContent:'center'},viewerCloseText:{fontSize:28,color:COLORS.white},viewerScroll:{flex:1},viewerPage:{width:require('react-native').Dimensions.get('window').width,alignItems:'center',justifyContent:'center'},viewerImage:{width:'94%',height:'78%'},viewerCaption:{position:'absolute',left:20,right:20,bottom:32,padding:15,borderRadius:17,backgroundColor:'rgba(0,0,0,.55)'},viewerTitle:{fontSize:17,color:COLORS.white,fontWeight:'900'},viewerSub:{fontSize:10,color:'rgba(255,255,255,.75)',marginTop:3},
});
