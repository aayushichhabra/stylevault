import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../theme/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { auth, storage, db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, collection } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';

export const AddItemScreen = ({ navigation }: any) => {
  const [image, setImage] = useState<string | null>(null);
  const [category, setCategory] = useState('Top');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleUpload = async () => {
    // 1. Validation
    if (!image) {
      Alert.alert("Missing Photo", "Please select an image first.");
      return;
    }
    if (!auth.currentUser) {
      Alert.alert("Error", "You are not logged in.");
      return;
    }

    setLoading(true);

    try {
      console.log("Starting upload...");
      
      // 2. Prepare Image
      const response = await fetch(image);
      const blob = await response.blob();
      
      // 3. Upload to Firebase Storage
      const filename = `closet/${auth.currentUser.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      console.log("Uploading blob to:", filename);
      await uploadBytes(storageRef, blob); // <--- This usually fails if Rules are wrong
      
      console.log("Getting URL...");
      const downloadURL = await getDownloadURL(storageRef);

      // 4. Save Metadata to Firestore
      console.log("Saving to Firestore...");
      const newItemRef = doc(collection(db, "users", auth.currentUser.uid, "closet"));
      await setDoc(newItemRef, {
        id: newItemRef.id,
        imageUrl: downloadURL,
        category: category,
        description: description || "", // Handle empty description
        createdAt: new Date().toISOString(),
      });

      console.log("Success!");
      Alert.alert("Success", "Item added to wardrobe!");
      navigation.goBack();

    } catch (error: any) {
      console.error("Upload Error:", error);
      // Show the specific error message to help debug
      Alert.alert("Upload Failed", error.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>ADD NEW ITEM</Text>
          <View style={{ width: 24 }} />
        </View>

        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Feather name="camera" size={32} color={theme.colors.textSecondary} />
              <Text style={styles.placeholderText}>TAP TO SELECT IMAGE</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.form}>
            <Text style={styles.label}>CATEGORY</Text>
            <View style={styles.chipContainer}>
              {['Top', 'Bottom', 'Shoes', 'Outerwear', 'Accessory'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  onPress={() => setCategory(cat)}
                  style={[styles.chip, category === cat && styles.chipActive]}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 24 }]}>DESCRIPTION / COLOR</Text>
            <TextInput
                style={styles.input}
                placeholder="e.g. Navy Blue Cotton Shirt"
                placeholderTextColor="#999"
                value={description}
                onChangeText={setDescription}
            />
        </View>

        <PrimaryButton 
          title={loading ? "UPLOADING..." : "SAVE TO CLOSET"} 
          onPress={handleUpload} 
          isLoading={loading}
          style={styles.uploadBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.m },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.m },
  title: { ...theme.typography.button, fontSize: 16 },
  imageContainer: { width: '100%', aspectRatio: 3/4, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { alignItems: 'center' },
  placeholderText: { marginTop: 8, fontSize: 10, letterSpacing: 1, color: '#999' },
  form: { marginTop: 24 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E5E5' },
  chipActive: { backgroundColor: 'black', borderColor: 'black' },
  chipText: { fontSize: 12, color: 'black' },
  chipTextActive: { color: 'white' },
  input: { borderBottomWidth: 1, borderColor: '#E5E5E5', paddingVertical: 8, fontSize: 16 },
  uploadBtn: { marginTop: 32 }
});