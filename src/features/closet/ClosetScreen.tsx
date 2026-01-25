import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { theme } from '../../theme/theme';
import { Feather } from '@expo/vector-icons';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'; 
import { auth, db } from '../../config/firebase';


export const ClosetScreen = ({ navigation }: any) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Real-time listener for closet items
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, "users", auth.currentUser.uid, "closet"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const renderItem = ({ item }: any) => (
    <View style={styles.gridItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.labelContainer}>
        <Text style={styles.labelText}>{item.category.toUpperCase()}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>WARDROBE</Text>
        <Text style={styles.subtitle}>{items.length} ITEMS</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="black" />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>YOUR CLOSET IS EMPTY.</Text>
              <Text style={styles.emptySubText}>Start building your digital wardrobe.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (Zara Style) */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('AddItem')}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={32} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.s,
    paddingBottom: theme.spacing.m,
  },
  title: {
    ...theme.typography.header,
    fontSize: 28,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: 100, // Space for FAB
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  gridItem: {
    width: '48%',
    aspectRatio: 3 / 4,
    backgroundColor: '#F9F9F9',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  labelContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  emptySubText: {
    color: theme.colors.textSecondary,
    marginTop: 8,
  }
});