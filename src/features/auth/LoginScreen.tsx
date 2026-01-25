import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../../theme/theme';
import { PrimaryButton } from '../../components/PrimaryButton';
import { GlassInput } from '../../components/GlassInput';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in!");
      // Navigation will be handled by an AuthObserver in App.tsx later
    } catch (err: any) {
      setError("Invalid email or password.");
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
          <Text style={styles.appName}>STYLEVAULT</Text>
          <Text style={styles.tagline}>Elevate your personal style.</Text>
        </View>

        <View style={styles.formContainer}>
          <GlassInput 
            label="Email Address"
            placeholder="john@example.com"
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
            title="Sign In" 
            onPress={handleLogin} 
            isLoading={loading}
            style={{ marginTop: theme.spacing.m }}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to StyleVault? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkText}>Create Account</Text>
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
    marginBottom: theme.spacing.xxl,
  },
  appName: {
    ...theme.typography.header,
    color: theme.colors.secondary,
    marginBottom: theme.spacing.s,
  },
  tagline: {
    ...theme.typography.subHeader,
    color: theme.colors.textDim,
    fontSize: 16,
    fontWeight: '400',
  },
  formContainer: {
    // This pushes the form slightly up visually
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