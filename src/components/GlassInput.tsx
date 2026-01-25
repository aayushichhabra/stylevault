import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Text, TextInputProps } from 'react-native';
import { theme } from '../theme/theme';

interface GlassInputProps extends TextInputProps {
  label: string;
  iconName?: string; // We can add icons later
  error?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ label, error, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.label, isFocused && styles.labelFocused]}>
        {label.toUpperCase()}
      </Text>
      
      <View style={[
        styles.inputWrapper, 
        isFocused && styles.inputWrapperFocused,
        !!error && styles.inputWrapperError
      ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textDim}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={theme.colors.primary}
          {...props}
        />
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.l,
  },
  label: {
    color: theme.colors.textDim,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  labelFocused: {
    color: theme.colors.primary,
  },
  inputWrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s + 2, // Taller touch target
  },
  inputWrapperFocused: {
    borderColor: theme.colors.primary, // Gold border on focus
    backgroundColor: theme.colors.surfaceHighlight,
  },
  inputWrapperError: {
    borderColor: theme.colors.error,
  },
  input: {
    color: theme.colors.secondary,
    fontSize: 16,
    height: 24, // Fix height for consistent text alignment
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.xs,
  }
});