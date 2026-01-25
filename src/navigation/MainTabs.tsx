import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform } from 'react-native'; // ✅ Added View here
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

// --- STACKS (Keep curly braces if these are named exports) ---
import { HomeStack } from './HomeStack'; 
import { ClosetStack } from './ClosetStack';

// --- SCREENS ---
// 🛑 FIX: Removed curly braces because it uses 'export default'
import MeasurementsScreen from '../features/measurements/MeasurementsScreen'; 

// Keep these as they were in your code
import { ChatScreen } from '../features/chat/ChatScreen';
import { AvatarScreen } from '../features/avatar/AvatarScreen';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderColor: '#F0F0F0',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingTop: 10,
        },
        tabBarActiveTintColor: 'black',
        tabBarInactiveTintColor: '#999',
        tabBarShowLabel: false,
      }}
    >
      {/* 1. HOME */}
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />
        }}
      />
      
      {/* 2. CLOSET */}
      <Tab.Screen 
        name="Closet" 
        component={ClosetStack} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="layers" size={24} color={color} />
        }}
      />

      {/* 3. CHAT */}
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={24} color={color} />
        }}
      />

      {/* 4. MEASURE (Camera) */}
      <Tab.Screen 
        name="Measure" 
        component={MeasurementsScreen} 
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{
              backgroundColor: focused ? '#000' : '#FFF',
              width: 50,
              height: 50,
              borderRadius: 25,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 10, 
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
              borderWidth: 1,
              borderColor: '#F0F0F0'
            }}>
              <MaterialCommunityIcons 
                name="camera-iris" 
                size={28} 
                color={focused ? '#FFF' : '#000'} 
              />
            </View>
          )
        }}
      />

      {/* 5. AVATAR */}
      <Tab.Screen 
        name="Avatar" 
        component={AvatarScreen} 
        options={{
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />
        }}
      />
    </Tab.Navigator>
  );
};