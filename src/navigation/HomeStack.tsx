import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/HomeScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import SavedOutfitDetailScreen from '../features/home/SavedOutfitDetailScreen';


const Stack = createNativeStackNavigator();

export const HomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SavedOutfitDetail" component={SavedOutfitDetailScreen} />
    </Stack.Navigator>
  );
};