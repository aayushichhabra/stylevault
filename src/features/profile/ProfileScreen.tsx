import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, TextInput, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// FIREBASE
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { auth, db } from '../../config/firebase';

// ✅ DEFAULT EXPORT (Fixes the crash)
const ProfileScreen = () => {
  const user = auth.currentUser;
  
  // State
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Name Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  // 1. LISTEN TO FIRESTORE DATA
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        if (!isEditing && data.displayName) {
           setNewName(data.displayName);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isEditing]);

  // 2. SAVE NAME CHANGE
  const handleSaveName = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: newName });
      
      // Update Database
      await setDoc(doc(db, "users", user.uid), { 
        displayName: newName 
      }, { merge: true });

      setIsEditing(false);
      Alert.alert("Success", "Name updated!");
    } catch (error) {
      Alert.alert("Error", "Could not update name.");
    } finally {
      setSaving(false);
    }
  };

  // 3. LOGOUT
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // Use 'bodyProfile' from the new scanner, or fallback to 'lastMeasurements'
  const profile = userData?.bodyProfile || userData?.lastMeasurements || {};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* HEADER */}
        <Text style={styles.headerTitle}>MY PROFILE</Text>

        {/* USER INFO SECTION */}
        <View style={styles.infoSection}>
            <Text style={styles.label}>FULL NAME</Text>
            
            {isEditing ? (
                <View style={styles.editRow}>
                    <TextInput 
                        value={newName} 
                        onChangeText={setNewName} 
                        style={styles.editInput} 
                        autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveName} disabled={saving}>
                        <Text style={styles.saveLink}>{saving ? "SAVING..." : "SAVE"}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.row}>
                    <Text style={styles.value}>{userData?.displayName || user?.displayName || "User"}</Text>
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Feather name="edit-2" size={16} color="#000" />
                    </TouchableOpacity>
                </View>
            )}

            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <Text style={styles.value}>{user?.email}</Text>
        </View>

        {/* BODY SCAN CARD (The New Design) */}
        <View style={styles.scanCard}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>LAST BODY SCAN</Text>
                <MaterialCommunityIcons name="human-male-height" size={24} color="#555" />
            </View>

            {/* BODY TYPE BADGE */}
            {profile.bodyType && (
                <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>BODY TYPE</Text>
                    <Text style={styles.badgeValue}>{profile.bodyType}</Text>
                </View>
            )}

            {/* MEASUREMENTS GRID */}
            <View style={styles.grid}>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Height</Text>
                    <Text style={styles.gridValue}>{profile.height ? `${profile.height} cm` : "--"}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Weight</Text>
                    <Text style={styles.gridValue}>{profile.weight ? `${profile.weight} kg` : "--"}</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.grid}>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Shoulders</Text>
                    <Text style={styles.gridValue}>{profile.shoulders ? `${profile.shoulders} cm` : "--"}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Chest</Text>
                    <Text style={styles.gridValue}>{profile.chest ? `${profile.chest} cm` : "--"}</Text>
                </View>
                <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Waist</Text>
                    <Text style={styles.gridValue}>{profile.waist ? `${profile.waist} cm` : "--"}</Text>
                </View>
            </View>

            <Text style={styles.date}>
                Last Updated: {profile.lastUpdated?.toDate ? profile.lastUpdated.toDate().toLocaleDateString() : "Never"}
            </Text>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '800', marginBottom: 30, letterSpacing: 1 },
  
  infoSection: { marginBottom: 30 },
  label: { fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 5, letterSpacing: 1 },
  value: { fontSize: 16, fontWeight: '500', marginBottom: 20, color: '#000' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  
  // Edit Styles
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1, paddingBottom: 5 },
  editInput: { fontSize: 16, fontWeight: '500', flex: 1, color: '#000' },
  saveLink: { fontWeight: '800', fontSize: 12 },

  scanCard: { backgroundColor: '#F9F9F9', padding: 20, borderRadius: 16, marginBottom: 40 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  
  badge: { backgroundColor: '#000', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  badgeLabel: { color: '#888', fontSize: 9, fontWeight: '700', marginBottom: 2 },
  badgeValue: { color: '#FFF', fontSize: 18, fontWeight: '800' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { flex: 1, minWidth: '30%' },
  gridLabel: { fontSize: 11, color: '#666' },
  gridValue: { fontSize: 14, fontWeight: '700', color: '#000' },

  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 15 },
  date: { fontSize: 10, color: '#999', marginTop: 15, textAlign: 'center' },

  signOutBtn: { alignSelf: 'center', padding: 10 },
  signOutText: { color: '#FF3B30', fontWeight: '700', fontSize: 12, letterSpacing: 1 }
});

export default ProfileScreen;