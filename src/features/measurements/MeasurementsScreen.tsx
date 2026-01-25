import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
  Alert, Modal, Image, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// --- FIREBASE IMPORTS ---
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

// ⚠️ KEEP YOUR IP ADDRESS HERE
const API_URL = 'http://ur-ip:5001/scan';

const MeasurementsScreen = ({ navigation }: any) => {
  // --- STATE ---
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  // Measurements
  const [shoulders, setShoulders] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState(''); // Added Hips for accurate calculation
  
  const [bodyType, setBodyType] = useState('Unknown');
  const [isSaving, setIsSaving] = useState(false);

  // Camera
  const [cameraVisible, setCameraVisible] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // --- 1. LOCAL BODY TYPE CALCULATOR ---
  // This runs instantly whenever you edit the numbers
  const calculateBodyType = (s: number, w: number, h: number) => {
    if (!s || !w || !h) return "Unknown";
    
    const sh_waist = s / w;
    const sh_hips = s / h;

    if (sh_hips > 1.05) return "Inverted Triangle (V-Shape)";
    if (sh_hips < 0.95) return "Triangle (Pear)";
    if (sh_waist > 1.25) return "Hourglass";
    if (sh_hips >= 0.9 && sh_hips <= 1.1) {
        if (sh_waist < 1.15) return "Rectangle";
    }
    return "Athletic";
  };

  // Auto-recalculate when numbers change
  useEffect(() => {
    const s = parseFloat(shoulders);
    const w = parseFloat(waist);
    const h = parseFloat(hips || chest); // Fallback to chest if hips missing
    
    if (s && w && h) {
      setBodyType(calculateBodyType(s, w, h));
    }
  }, [shoulders, waist, hips, chest]);

  // --- 2. CAMERA LOGIC ---
  const startScan = () => {
    if (!height) {
      Alert.alert("Height Missing", "Please enter your height first so we can calibrate the scale.");
      return;
    }
    if (!permission?.granted) requestPermission();
    setCameraVisible(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photo?.base64,
          height: parseFloat(height)
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-fill form
        setShoulders(data.shoulders.toString());
        setChest(data.chest?.toString() || "");
        setWaist(data.waist.toString());
        setHips(data.hips?.toString() || ""); // Ideally your Python sends hips too
        
        setCameraVisible(false);
        Alert.alert("Scan Complete", "Review your measurements below. You can edit them if needed.");
      } else {
        Alert.alert("Scan Failed", data.error);
      }
    } catch (e) {
      Alert.alert("Connection Error", "Is the Python server running?");
    } finally {
      setProcessing(false);
    }
  };

  // --- 3. SAVE TO FIREBASE (SAFER VERSION) ---
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      
      // SAFETY CHECK: Convert empty strings to 0 to prevent "NaN" crashes
      const safeFloat = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
      };

      await setDoc(userRef, {
        bodyProfile: {
          height: safeFloat(height),
          weight: safeFloat(weight),
          shoulders: safeFloat(shoulders),
          chest: safeFloat(chest),
          waist: safeFloat(waist),
          hips: safeFloat(hips),
          bodyType: bodyType || "Unknown",
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });

      Alert.alert("Saved", "Your body profile has been updated!", [
        { 
          text: "OK", 
          onPress: () => navigation.navigate("HomeTab", { screen: "Profile" }) 
        }
      ]);
      
    } catch (error) {
      console.error("Save Error:", error); // Now you will see the error in logs if it fails
      Alert.alert("Error", "Could not save. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <Text style={styles.title}>Body Profile</Text>
        <Text style={styles.subtitle}>Scan, Edit, and Save.</Text>

        {/* INPUTS: Height/Weight */}
        <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.label}>HEIGHT (cm)</Text>
                <TextInput 
                    style={styles.input} 
                    value={height} 
                    onChangeText={setHeight} 
                    placeholder="175" 
                    keyboardType="numeric" 
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.label}>WEIGHT (kg)</Text>
                <TextInput 
                    style={styles.input} 
                    value={weight} 
                    onChangeText={setWeight} 
                    placeholder="70" 
                    keyboardType="numeric" 
                />
            </View>
        </View>

        {/* SCANNER CARD */}
        <View style={styles.scanCard}>
            <View>
                <Text style={styles.scanTitle}>AI Body Scanner</Text>
                <Text style={styles.scanSub}>Auto-measure via camera</Text>
            </View>
            <TouchableOpacity style={styles.scanBtn} onPress={startScan}>
                <MaterialCommunityIcons name="camera-iris" size={24} color="#FFF" />
                <Text style={styles.scanBtnText}>SCAN</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* EDITABLE MEASUREMENTS */}
        <Text style={styles.sectionTitle}>REVIEW MEASUREMENTS</Text>
        <Text style={styles.hint}>Edit these numbers to recalculate body type.</Text>

        <View style={styles.row}>
            <View style={styles.measureBox}>
                <Text style={styles.label}>SHOULDERS</Text>
                <TextInput style={styles.input} value={shoulders} onChangeText={setShoulders} keyboardType="numeric" placeholder="0" />
            </View>
            <View style={[styles.measureBox, { marginLeft: 10 }]}>
                <Text style={styles.label}>CHEST</Text>
                <TextInput style={styles.input} value={chest} onChangeText={setChest} keyboardType="numeric" placeholder="0" />
            </View>
        </View>

        <View style={styles.row}>
            <View style={styles.measureBox}>
                <Text style={styles.label}>WAIST</Text>
                <TextInput style={styles.input} value={waist} onChangeText={setWaist} keyboardType="numeric" placeholder="0" />
            </View>
            {/* Added Hips input for better calculation */}
            <View style={[styles.measureBox, { marginLeft: 10 }]}>
                <Text style={styles.label}>HIPS (Optional)</Text>
                <TextInput style={styles.input} value={hips} onChangeText={setHips} keyboardType="numeric" placeholder="0" />
            </View>
        </View>

        {/* LIVE BODY TYPE BADGE */}
        <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>DETECTED SHAPE</Text>
            <Text style={styles.resultValue}>{bodyType}</Text>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>SAVE TO PROFILE</Text>}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.resetBtn} onPress={() => {
            setShoulders(''); setWaist(''); setChest(''); setHips(''); setBodyType('Unknown');
        }}>
            <Text style={styles.resetText}>Clear & Restart</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* CAMERA MODAL */}
      <Modal visible={cameraVisible} animationType="slide">
        <CameraView style={{ flex: 1 }} ref={cameraRef} facing="front">
          <SafeAreaView style={styles.cameraOverlay}>
             <TouchableOpacity style={styles.closeCam} onPress={() => setCameraVisible(false)}>
                <Feather name="x" size={24} color="#FFF" />
             </TouchableOpacity>
             <View style={styles.guideBox}>
                 <Text style={styles.guideText}>Full Body • Hands Relaxed</Text>
             </View>
             <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={processing}>
                 {processing ? <ActivityIndicator size="large" color="#000" /> : <View style={styles.captureInner} />}
             </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
  
  row: { flexDirection: 'row', marginBottom: 15 },
  measureBox: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: '#F5F5F7', padding: 14, borderRadius: 12, fontSize: 16, fontWeight: '700', color: '#333' },
  
  scanCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F0F0', padding: 20, borderRadius: 16, marginBottom: 20 },
  scanTitle: { fontSize: 16, fontWeight: '700' },
  scanSub: { fontSize: 12, color: '#666' },
  scanBtn: { flexDirection: 'row', backgroundColor: '#000', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, alignItems: 'center', gap: 6 },
  scanBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#EEE', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 5 },
  hint: { fontSize: 12, color: '#666', marginBottom: 15, fontStyle: 'italic' },

  resultContainer: { alignItems: 'center', backgroundColor: '#000', padding: 20, borderRadius: 12, marginTop: 10, marginBottom: 20 },
  resultLabel: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 5 },
  resultValue: { color: '#FFF', fontSize: 22, fontWeight: '800' },

  saveBtn: { backgroundColor: '#000', padding: 18, borderRadius: 30, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#FFF', fontWeight: '700', letterSpacing: 1 },
  
  resetBtn: { padding: 15, alignItems: 'center' },
  resetText: { color: '#FF3B30', fontWeight: '600' },

  // Camera
  cameraOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20 },
  closeCam: { alignSelf: 'flex-start', marginLeft: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  guideBox: { width: '85%', height: '75%', borderColor: 'rgba(255,255,255,0.4)', borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  guideText: { color: '#FFF', backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, overflow: 'hidden', borderRadius: 5 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  captureInner: { width: 65, height: 65, borderRadius: 35, backgroundColor: '#FFF' }
});

export default MeasurementsScreen;