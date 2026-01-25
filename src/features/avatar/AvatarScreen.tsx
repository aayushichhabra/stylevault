import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const AvatarScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>VIRTUAL AVATAR</Text>
      <Text style={styles.subText}>(Coming Soon)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  text: { ...theme.typography.header, fontSize: 24, textAlign: 'center' },
  subText: { marginTop: 10, color: theme.colors.textSecondary }
});