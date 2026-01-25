import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { theme } from '../../theme/theme';
import { Feather } from '@expo/vector-icons';
import { getFashionAdvice } from '../../services/gemini';

export const ChatScreen = () => {
  const [messages, setMessages] = useState<{role: string, text: string}[]>([
    { role: 'model', text: "What's up? Ask me anything about men's style." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Format history for Gemini (excluding the last message we just sent)
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const reply = await getFashionAdvice(history, userMsg.text);
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "My style servers are down. Try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item }: any) => {
    const isUser = item.role === 'user';
    return (
      <View style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.modelBubble
      ]}>
        <Text style={[
          styles.msgText, 
          isUser ? styles.userText : styles.modelText
        ]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>STYLE BRO</Text>
        <Text style={styles.subtitle}>AI FASHION ASSISTANT</Text>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.list}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask about outfits..."
            value={input}
            onChangeText={setInput}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={sendMessage} disabled={loading} style={styles.sendBtn}>
            {loading ? <ActivityIndicator color="white" /> : <Feather name="arrow-up" size={24} color="white" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.m, borderBottomWidth: 1, borderColor: '#F0F0F0' },
  title: { ...theme.typography.header, fontSize: 20 },
  subtitle: { fontSize: 10, color: theme.colors.textSecondary, letterSpacing: 1.5, marginTop: 4 },
  list: { padding: theme.spacing.m },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 12, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'black', borderBottomRightRadius: 2 },
  modelBubble: { alignSelf: 'flex-start', backgroundColor: '#F0F0F0', borderBottomLeftRadius: 2 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: 'white' },
  modelText: { color: 'black' },
  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderColor: '#F0F0F0', alignItems: 'center' },
  input: { flex: 1, height: 44, borderRadius: 22, backgroundColor: '#F9F9F9', paddingHorizontal: 16, marginRight: 10, fontSize: 16 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'black', alignItems: 'center', justifyContent: 'center' }
});