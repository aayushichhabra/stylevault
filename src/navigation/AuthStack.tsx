import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth/LoginScreen';
import { SignUpScreen } from '../features/auth/SignUpScreen';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login" 
      screenOptions={{ 
        headerShown: false, // We use our own custom UI headers
        animation: 'fade', // Smooth transition
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};