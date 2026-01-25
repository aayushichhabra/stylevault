import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClosetScreen } from '../features/closet/ClosetScreen';
import { AddItemScreen } from '../features/closet/AddItemScreen';

const Stack = createNativeStackNavigator();

export const ClosetStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClosetGallery" component={ClosetScreen} />
      <Stack.Screen name="AddItem" component={AddItemScreen} />
    </Stack.Navigator>
  );
};