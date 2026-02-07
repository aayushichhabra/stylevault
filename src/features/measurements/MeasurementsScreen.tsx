import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

// --- FIREBASE IMPORTS ---
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

// ⚠️ REPLACE WITH YOUR RENDER URL
const API_URL = 'http://ip:5001/scan';

const MeasurementsScreen = ({ navigation }: any) => {
  // --- STATE ---
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  const [shoulders, setShoulders] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");

  const [bodyType, setBodyType] = useState("Unknown");
  const [isSaving, setIsSaving] = useState(false);

  // Camera State
  const [cameraVisible, setCameraVisible] = useState(false);
  const [scanStatus, setScanStatus] = useState("Stand back to start..."); // 🟢 Feedback Text
  const [isScanning, setIsScanning] = useState(false); // Prevents double scans
  
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // --- AUTO-CALCULATE BODY TYPE (Client Side Fallback) ---
  // Updates instantly if you manually edit numbers
  useEffect(() => {
    const s = parseFloat(shoulders);
    const w = parseFloat(waist);
    const h = parseFloat(hips || chest);

    if (s && w && h) {
       // Only update if server didn't give us one (or if user is editing)
       const ratio = s / h;
       if (ratio > 1.05) setBodyType("Inverted Triangle (V-Shape)");
       else if (ratio < 0.95) setBodyType("Triangle (Pear)");
       else setBodyType("Rectangle");
    }
  }, [shoulders, waist, hips, chest]);

  // --- 📸 AUTO-SCAN LOOP ---
  // Automatically tries to scan every 2 seconds when camera is open
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (cameraVisible && !isScanning) {
      interval = setInterval(async () => {
         await captureAndCheck();
      }, 2000); // Check every 2 seconds
    }

    return () => clearInterval(interval);
  }, [cameraVisible, isScanning]);

  const startScan = async () => {
    if (!height) {
      Alert.alert("Height Missing", "Please enter your height first to calibrate.");
      return;
    }

    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }

    setScanStatus("Aligning... Stand back.");
    setCameraVisible(true);
    setIsScanning(false);
  };

  const captureAndCheck = async () => {
    if (!cameraRef.current || isScanning) return;

    try {
      // 1. Silent Capture (Fast)
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.4, 
        skipProcessing: true,
      });

      // 2. Send to Server
      setScanStatus("Analyzing...");
      
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: photo?.base64,
          height: parseFloat(height),
        }),
      });

      const data = await response.json();

      // 3. Handle Result
      if (data.success) {
        // ✅ SUCCESS
        setIsScanning(true); // Stop the loop
        setShoulders(String(data.shoulders));
        setChest(String(data.chest));
        setWaist(String(data.waist));
        setHips(String(data.hips));
        setBodyType(data.bodyType);
        
        setCameraVisible(false);
        Alert.alert("Scan Complete", "Measurements captured! You can edit them below.");
      } else {
        // ⚠️ FEEDBACK (e.g. "Feet not visible")
        setScanStatus(data.message || "Adjust position...");
      }

    } catch (err) {
      // Silent fail allows retrying in next loop
      console.log("Scan check failed, retrying..."); 
      setScanStatus("Connecting...");
    }
  };

  // --- SAVE TO FIREBASE ---
  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);

    const safeFloat = (v: string) =>
      isNaN(parseFloat(v)) ? 0 : parseFloat(v);

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);

      await setDoc(
        userRef,
        {
          bodyProfile: {
            height: safeFloat(height),
            weight: safeFloat(weight),
            shoulders: safeFloat(shoulders),
            chest: safeFloat(chest),
            waist: safeFloat(waist),
            hips: safeFloat(hips),
            bodyType,
            lastUpdated: serverTimestamp(),
          },
        },
        { merge: true }
      );

      Alert.alert("Saved", "Your body profile has been updated!", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("HomeTab", { screen: "Profile" }),
        },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.title}>Body Profile</Text>
        <Text style={styles.subtitle}>Scan, Edit, and Save</Text>

        {/* HEIGHT / WEIGHT */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>HEIGHT (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholder="175"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>WEIGHT (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="70"
            />
          </View>
        </View>

        {/* SCAN CARD */}
        <View style={styles.scanCard}>
          <View>
            <Text style={styles.scanTitle}>AI Body Scanner</Text>
            <Text style={styles.scanSub}>Auto-measure (Hands Free)</Text>
          </View>
          <TouchableOpacity style={styles.scanBtn} onPress={startScan}>
            <MaterialCommunityIcons
              name="camera-wireless"
              size={22}
              color="#FFF"
            />
            <Text style={styles.scanBtnText}>START SCAN</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* MEASUREMENTS */}
        <Text style={styles.sectionTitle}>REVIEW MEASUREMENTS</Text>

        <View style={styles.row}>
          <View style={styles.measureBox}>
            <Text style={styles.label}>SHOULDERS</Text>
            <TextInput
              style={styles.input}
              value={shoulders}
              onChangeText={setShoulders}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.measureBox, { marginLeft: 10 }]}>
            <Text style={styles.label}>CHEST</Text>
            <TextInput
              style={styles.input}
              value={chest}
              onChangeText={setChest}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.measureBox}>
            <Text style={styles.label}>WAIST</Text>
            <TextInput
              style={styles.input}
              value={waist}
              onChangeText={setWaist}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.measureBox, { marginLeft: 10 }]}>
            <Text style={styles.label}>HIPS</Text>
            <TextInput
              style={styles.input}
              value={hips}
              onChangeText={setHips}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* BODY TYPE */}
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>DETECTED SHAPE</Text>
          <Text style={styles.resultValue}>{bodyType}</Text>
        </View>

        {/* ACTIONS */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>SAVE TO PROFILE</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* --- SMART CAMERA MODAL --- */}
      <Modal visible={cameraVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="front"
          />

          <SafeAreaView style={styles.cameraOverlay}>
            
            {/* CLOSE BUTTON */}
            <TouchableOpacity
              style={styles.closeCam}
              onPress={() => { setCameraVisible(false); setIsScanning(false); }}
            >
              <Feather name="x" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* 🟢 STATUS FEEDBACK (Replaces old Guide Box) */}
            <View style={styles.statusBox}>
                <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.statusText}>{scanStatus}</Text>
            </View>

            {/* VISUAL CORNERS GUIDE */}
            <View style={styles.guideFrame}>
                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />
            </View>

            <Text style={styles.hintText}>Full Body • Phone Upright</Text>

          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  title: { fontSize: 28, fontWeight: "800" },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 20 },

  row: { flexDirection: "row", marginBottom: 15 },
  measureBox: { flex: 1 },
  label: { fontSize: 11, fontWeight: "700", color: "#888", marginBottom: 6 },
  input: { backgroundColor: "#F5F5F7", padding: 14, borderRadius: 12, fontSize: 16, fontWeight: "700" },

  scanCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#F0F0F0", padding: 20, borderRadius: 16, marginBottom: 20 },
  scanTitle: { fontSize: 16, fontWeight: "700" },
  scanSub: { fontSize: 12, color: "#666" },
  scanBtn: { flexDirection: "row", backgroundColor: "#000", padding: 12, borderRadius: 20, alignItems: "center" },
  scanBtnText: { color: "#FFF", fontWeight: "700", marginLeft: 6 },

  divider: { height: 1, backgroundColor: "#EEE", marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "800" },

  resultContainer: { backgroundColor: "#000", padding: 20, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  resultLabel: { color: "#888", fontSize: 10 },
  resultValue: { color: "#FFF", fontSize: 22, fontWeight: "800" },

  saveBtn: { backgroundColor: "#000", padding: 18, borderRadius: 30, alignItems: 'center' },
  saveBtnText: { color: "#FFF", fontWeight: "700" },

  // --- CAMERA STYLES ---
  cameraOverlay: { flex: 1, justifyContent: "space-between", alignItems: "center", paddingVertical: 20 },
  closeCam: { alignSelf: "flex-start", marginLeft: 20, backgroundColor: "rgba(0,0,0,0.5)", padding: 10, borderRadius: 20 },
  
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: "rgba(0,0,0,0.7)", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, marginTop: 10 },
  statusText: { color: "#FFF", fontWeight: "700", fontSize: 16 },

  guideFrame: { width: "80%", height: "60%", position: 'relative' },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#FFF' },
  
  hintText: { color: "rgba(255,255,255,0.7)", fontWeight: "600" }
});

export default MeasurementsScreen;