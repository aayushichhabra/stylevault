import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GlassInput } from '../../components/GlassInput';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../../config/firebase'; // Import db here

export const SignUpScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    // Basic validation
    if(name.length < 2) { setError("Name is too short."); return; }
    
    setLoading(true);
    setError(null);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Auth Profile with Name
      await updateProfile(user, { displayName: name });

      // 3. Create User Document in Firestore (CRITICAL for Closet feature)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        createdAt: new Date().toISOString(),
        stylePreferences: [] // Placeholder for future AI personalization
      });

      console.log("User created!");
      // Navigation handled by auth state listener in App.tsx
      
    } catch (err: any) {
      setError(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Create Account</Text>
          <Text style={styles.subHeader}>Join the style revolution.</Text>
        </View>

        <View style={styles.formContainer}>
          <GlassInput 
            label="Full Name"
            placeholder="Jane Doe"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <GlassInput 
            label="Email Address"
            placeholder="jane@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <GlassInput 
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.globalError}>{error}</Text>}

          <PrimaryButton 
            title="Create Account" 
            onPress={handleSignUp} 
            isLoading={loading}
            style={{ marginTop: theme.spacing.m }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: theme.spacing.xl,
  },
  header: {
    ...theme.typography.header,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.xs,
  },
  subHeader: {
    ...theme.typography.subHeader,
    color: theme.colors.textDim,
    fontSize: 16,
  },
  formContainer: {
    marginTop: theme.spacing.s,
  },
  globalError: {
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textDim,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '700',
  }
});