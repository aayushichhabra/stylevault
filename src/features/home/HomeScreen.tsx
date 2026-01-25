import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  Dimensions, RefreshControl, ActivityIndicator, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../../config/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateOutfit } from '../../services/gemini'; 

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
  // --- STATE ---
  const [weather, setWeather] = useState({ temp: '24', condition: 'Sunny' });
  const [closet, setCloset] = useState<any[]>([]);
  const [savedLooks, setSavedLooks] = useState<any[]>([]);
  
  const [todaysLook, setTodaysLook] = useState<any[] | null>(null);
  const [reasoning, setReasoning] = useState("");
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Loading state for the Saved Looks section
  const [loadingSaved, setLoadingSaved] = useState(true);

  // --- 1. FETCH DATA (FIXED) ---
  const fetchData = async () => {
    try {
      if (!auth.currentUser) return;

      // A. Fetch Closet
      const closetSnap = await getDocs(collection(db, "users", auth.currentUser.uid, "closet"));
      const items = closetSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCloset(items);

      // B. Fetch Saved Looks (With Flicker Fix)
      // If the list is currently empty, show spinner so we don't flash "No Saved Looks"
      if (savedLooks.length === 0) {
        setLoadingSaved(true);
      }

      const savedSnap = await getDocs(collection(db, "users", auth.currentUser.uid, "saved_looks"));
      const saved = savedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by newest first (using client-side sort for speed)
      // Assuming 'createdAt' is a Firestore timestamp
      saved.sort((a: any, b: any) => {
         const tA = a.createdAt?.seconds || 0;
         const tB = b.createdAt?.seconds || 0;
         return tB - tA;
      });

      setSavedLooks(saved);

    } catch (e) {
      console.error("Home Load Error:", e);
    } finally {
      // Always turn off loading when done
      setLoadingSaved(false);
    }
  };

  const fetchWeather = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      // Mock weather for now
      setWeather({ temp: '22', condition: 'Sunny' }); 
    } catch (error) {
      console.log("Weather Error: ", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWeather();
      fetchData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWeather(), fetchData()]);
    setRefreshing(false);
  };

  // --- 2. GENERATE OUTFIT ---
  const handleSuggest = async () => {
    if (closet.length < 2) {
      Alert.alert("Closet Empty", "Add at least 2 items to your closet first!");
      navigation.navigate('Measure'); 
      return;
    }

    setLoadingAI(true);
    setTodaysLook(null);

    try {
      const context = `Casual style for ${weather.temp}°C and ${weather.condition} weather`;
      const result = await generateOutfit(closet, context);

      if (result && result.selectedIds) {
        const suggestedItems = closet.filter((item: any) => result.selectedIds.includes(item.id));
        setTodaysLook(suggestedItems);
        setReasoning(result.reasoning || "Here is a look curated just for you.");
      } else {
        Alert.alert("AI Error", "Could not generate an outfit. Try again.");
      }
    } catch (error) {
      console.error("AI Generation Error:", error);
      Alert.alert("Connection Error", "Could not reach the stylist.");
    } finally {
      setLoadingAI(false);
    }
  };

  // --- 3. SAVE LOOK ---
  const handleSaveLook = async () => {
    if (!todaysLook || !auth.currentUser) return;
    
    setIsSaving(true);
    try {
      const lookData = {
        items: todaysLook,
        reasoning: reasoning,
        createdAt: serverTimestamp(),
        weather: weather,
        imageUrl: todaysLook[0]?.imageUrl || null 
      };

      await addDoc(collection(db, "users", auth.currentUser.uid, "saved_looks"), lookData);
      
      Alert.alert("Saved", "Outfit added to favorites!");
      fetchData(); 
    } catch (error) {
      console.error("Save Error:", error);
      Alert.alert("Error", "Could not save outfit.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDER HELPERS ---
  const renderDailyPick = () => {
    if (loadingAI) {
      return (
        <View style={[styles.heroCard, styles.heroCentered]}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Gemini is analyzing your wardrobe...</Text>
        </View>
      );
    }

    if (todaysLook && todaysLook.length > 0) {
      return (
        <TouchableOpacity style={styles.heroCard} activeOpacity={0.95}>
            <View style={styles.collageContainer}>
               {todaysLook.slice(0, 3).map((item, index) => (
                 <Image 
                   key={item.id || index} 
                   source={{ uri: item.imageUrl }} 
                   style={[
                     styles.collageImage, 
                     { width: todaysLook.length === 1 ? '100%' : '50%' }
                   ]} 
                 />
               ))}
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveLook}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="heart" size={24} color="#FFF" />
              )}
            </TouchableOpacity>

            <View style={styles.heroOverlay}>
              <View style={styles.aiBadge}>
                <Text style={styles.aiText}>✨ Gemini Stylist</Text>
              </View>
              <Text style={styles.lookTitle}>Today's Look</Text>
              <Text style={styles.lookDesc}>{reasoning}</Text>
            </View>
        </TouchableOpacity>
      );
    } 
    
    else {
      return (
        <TouchableOpacity style={[styles.heroCard, styles.heroEmpty]} activeOpacity={1}>
            <View style={styles.heroEmptyContent}>
              <MaterialCommunityIcons name="sparkles" size={40} color="#333" />
              <Text style={styles.emptyTitle}>No Outfit Selected</Text>
              <Text style={styles.emptySub}>
                You have {closet.length} items ready. Let's find a combo for this weather.
              </Text>
              <TouchableOpacity style={styles.generateBtn} onPress={handleSuggest}>
                <Text style={styles.generateBtnText}>Get Today's Fit</Text>
              </TouchableOpacity>
            </View>
        </TouchableOpacity>
      );
    }
  };

  const renderSavedLooks = () => {
    // 1. Loading State
    if (loadingSaved) {
      return (
        <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      );
    }

    // 2. Data State
    if (savedLooks.length > 0) {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSection}>
            {savedLooks.map((look, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.trendCard}
                  onPress={() => navigation.navigate('SavedOutfitDetail', { look })}
                >
                    <Image source={{ uri: look.imageUrl }} style={styles.trendImage} />
                    <View style={styles.savedOverlay}>
                       <Text style={styles.savedTitle} numberOfLines={1}>
                         {look.weather?.condition || "Saved Look"}
                       </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
      );
    } 
    
    // 3. Empty State
    return (
      <View style={styles.emptyStateContainer}>
        <Feather name="bookmark" size={30} color="#CCC" />
        <Text style={styles.emptyStateText}>No saved looks yet.</Text>
        <Text style={styles.emptyStateSub}>Tap the heart on a Daily Pick to save it.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingSub}>Hello,</Text>
            <Text style={styles.greetingMain}>
              {auth.currentUser?.displayName?.split(' ')[0] || "Aayushi"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.weatherPill}>
              <Text style={styles.weatherText}>{weather.temp}° ☀️</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              {auth.currentUser?.photoURL ? (
                <Image source={{ uri: auth.currentUser.photoURL }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profilePlaceholder}>
                   <Feather name="user" size={20} color="#FFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO */}
        <Text style={styles.sectionTitle}>Today's Focus</Text>
        {renderDailyPick()}

        {/* DASHBOARD */}
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <View style={styles.gridContainer}>
            <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Closet')}>
                <View style={[styles.iconBox, { backgroundColor: '#F5F5F7' }]}>
                    <Feather name="layers" size={24} color="#333" />
                </View>
                <Text style={styles.cardTitle}>Wardrobe</Text>
                <Text style={styles.cardSub}>{closet.length} Items</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Measure')}>
                <View style={[styles.iconBox, { backgroundColor: '#F5F5F7' }]}>
                    <MaterialCommunityIcons name="camera-iris" size={24} color="#333" />
                </View>
                <Text style={styles.cardTitle}>New Scan</Text>
                <Text style={styles.cardSub}>Analyze Fit</Text>
            </TouchableOpacity>
        </View>

        {/* SAVED LOOKS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Looks</Text>
        </View>
        
        {renderSavedLooks()}
        
        <View style={{ height: 100 }} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20, paddingHorizontal: 20 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greetingSub: { fontSize: 16, color: '#666', fontWeight: '500' },
  greetingMain: { fontSize: 32, color: '#000', fontWeight: '800', letterSpacing: -0.5 },
  weatherPill: { backgroundColor: '#F5F5F7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  weatherText: { fontWeight: '600', fontSize: 14, color: '#333' },
  profileAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
  profilePlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 15, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  
  heroCard: { marginHorizontal: 20, minHeight: 400, borderRadius: 24, marginBottom: 35, overflow: 'hidden', backgroundColor: '#F0F0F0', position: 'relative' },
  heroCentered: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  collageContainer: { flexDirection: 'row', flexWrap: 'wrap', height: '100%', width: '100%', position: 'absolute' },
  collageImage: { height: '100%', resizeMode: 'cover' },
  
  saveButton: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25, zIndex: 10 },
  heroOverlay: { marginTop: 220, padding: 24, backgroundColor: 'rgba(0,0,0,0.6)', flex: 1, justifyContent: 'flex-end' },
  
  heroEmpty: { backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#EEEEEE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', minHeight: 350 },
  heroEmptyContent: { alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 15, color: '#333' },
  emptySub: { textAlign: 'center', color: '#888', marginTop: 8, marginBottom: 20, lineHeight: 20 },
  
  generateBtn: { backgroundColor: '#000', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 30 },
  generateBtnText: { color: '#FFF', fontWeight: '600' },
  aiBadge: { backgroundColor: '#000', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  aiText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  loadingText: { marginTop: 15, color: '#666', fontWeight: '600', fontSize: 14 },
  lookTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  lookDesc: { color: '#eee', fontSize: 13, fontWeight: '500', lineHeight: 20 },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 20 },
  gridCard: { width: (width - 55) / 2, backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: '#F0F0F0' },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  cardSub: { fontSize: 13, color: '#999', marginTop: 4 },
  
  scrollSection: { paddingLeft: 20, marginBottom: 20 },
  trendCard: { width: 140, height: 200, backgroundColor: '#F0F0F0', borderRadius: 15, marginRight: 15, overflow: 'hidden' },
  trendImage: { width: '100%', height: '100%' },
  savedOverlay: { position: 'absolute', bottom: 0, width: '100%', padding: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
  savedTitle: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  emptyStateContainer: { marginHorizontal: 20, padding: 30, backgroundColor: '#F9F9F9', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyStateText: { marginTop: 10, fontWeight: '600', color: '#888' },
  emptyStateSub: { fontSize: 12, color: '#AAA', marginTop: 5 }
});

export default HomeScreen;