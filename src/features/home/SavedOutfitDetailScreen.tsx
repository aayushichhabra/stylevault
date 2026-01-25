import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { db, auth } from '../../config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const SavedOutfitDetailScreen = ({ route, navigation }: any) => {
  const { look } = route.params;
  const [isDeleting, setIsDeleting] = useState(false);

  // --- DELETE LOGIC ---
  const handleDelete = async () => {
    const userId = auth.currentUser?.uid;
    const lookId = look?.id;

    if (!userId || !lookId) {
      Alert.alert("Error", "Missing ID. Cannot delete.");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      "Permanently remove this outfit?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setIsDeleting(true);
            try {
              console.log(`Attempting delete at: users/${userId}/saved_looks/${lookId}`);
              
              // 1. Perform Delete
              await deleteDoc(doc(db, "users", userId, "saved_looks", lookId));
              
              // 2. Success Alert
              Alert.alert("Success", "Outfit deleted.", [
                { text: "OK", onPress: () => navigation.goBack() }
              ]);
              
            } catch (e: any) {
              console.error("Delete Error:", e);
              // 🛑 SHOWS THE EXACT ERROR CODE 🛑
              Alert.alert("Delete Failed", `Code: ${e.code}\nMessage: ${e.message}`);
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };

  // --- HELPER: ITEM NAME ---
  const getItemName = (item: any) => {
    if (item.description && item.description.trim() !== "") return item.description;
    if (item.name && item.name !== "Unknown Item") return item.name;
    if (item.color && item.category) return `${item.color} ${item.category}`;
    if (item.category) return item.category.charAt(0).toUpperCase() + item.category.slice(1);
    return "Clothing Item";
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Saved Look</Text>
        
        <TouchableOpacity onPress={handleDelete} disabled={isDeleting}>
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <Feather name="trash-2" size={24} color="#FF3B30" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* HERO IMAGE */}
        <View style={styles.heroContainer}>
           <View style={styles.collage}>
             {look.items && look.items.slice(0, 3).map((item: any, index: number) => (
               <Image 
                 key={index} 
                 source={{ uri: item.imageUrl }} 
                 style={[
                   styles.collageImg, 
                   { width: look.items.length === 1 ? '100%' : '50%' }
                 ]} 
               />
             ))}
           </View>
           
           <View style={styles.metaOverlay}>
             <View style={styles.badge}>
               <Feather name="calendar" size={12} color="#FFF" />
               <Text style={styles.badgeText}>
                 {look.createdAt?.seconds 
                    ? new Date(look.createdAt.seconds * 1000).toLocaleDateString() 
                    : "Recent"}
               </Text>
             </View>
           </View>
        </View>

        {/* DETAILS */}
        <View style={styles.section}>
          <Text style={styles.label}>STYLIST NOTES</Text>
          <Text style={styles.description}>{look.reasoning || "No notes available."}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>ITEMS</Text>
          {look.items && look.items.map((item: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Image source={{ uri: item.imageUrl }} style={styles.itemThumb} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{getItemName(item)}</Text>
                <Text style={styles.itemCat}>{item.category || "Item"}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  backBtn: { padding: 5 },
  heroContainer: { height: 350, margin: 20, borderRadius: 24, overflow: 'hidden', backgroundColor: '#F0F0F0', position: 'relative' },
  collage: { flexDirection: 'row', flexWrap: 'wrap', height: '100%' },
  collageImg: { height: '100%', resizeMode: 'cover' },
  metaOverlay: { position: 'absolute', top: 15, left: 15, flexDirection: 'row' },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '600', marginLeft: 6 },
  section: { paddingHorizontal: 20, marginBottom: 30 },
  label: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 10, letterSpacing: 1 },
  description: { fontSize: 16, lineHeight: 24, color: '#333' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#FAFAFA', padding: 10, borderRadius: 12 },
  itemThumb: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#EEE' },
  itemInfo: { marginLeft: 15, flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  itemCat: { fontSize: 14, color: '#888', marginTop: 2, textTransform: 'capitalize' },
});

export default SavedOutfitDetailScreen;