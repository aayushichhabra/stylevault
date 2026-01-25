import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { theme } from '../theme/theme';
import * as Haptics from 'expo-haptics';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  isLoading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, style, isLoading }) => {
  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      onPress={handlePress} 
      style={[styles.button, style]}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.text, // Solid Black
    paddingVertical: 18,
    borderRadius: 0, // Sharp corners
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    ...theme.typography.button,
    color: '#FFFFFF', // White text
  }
});