import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native'; // <--- This was likely missing
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/config/firebase';

// Navigators
import { AuthStack } from './src/navigation/AuthStack';
import { MainTabs } from './src/navigation/MainTabs';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Handle user state changes
  function onAuthStateChangedHandler(user: User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(auth, onAuthStateChangedHandler);
    return subscriber; // unsubscribe on unmount
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="black" />
        <Text style={{ marginTop: 20, fontSize: 16, fontWeight: 'bold' }}>Loading StyleVault...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {user ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}