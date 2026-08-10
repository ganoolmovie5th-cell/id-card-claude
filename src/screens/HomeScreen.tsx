import React, { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { getCards } from '../lib/storage'
import type { IDCard } from '../types/card'
import CardVisual from '../components/CardVisual'

export default function HomeScreen({ navigation }: any) {
  const [cards, setCards] = useState<IDCard[]>([])

  useFocusEffect(useCallback(() => {
    getCards().then(setCards)
  }, []))

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Kartu Saya</Text>
        <Text style={s.sub}>{cards.length} kartu tersimpan</Text>
      </View>

      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyCard}>
              <View style={s.emptyChip} />
              <View style={s.emptyLine1} />
              <View style={s.emptyLine2} />
            </View>
            <Text style={s.emptyText}>Belum ada kartu</Text>
            <Text style={s.emptySub}>Tap + untuk scan atau tambah manual</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={s.cardWrap}
            onPress={() => navigation.navigate('Detail', { id: item.id })}
          >
            <CardVisual card={item} compact />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => navigation.navigate('AddCard')}>
        <Text style={s.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 13, color: '#666', marginTop: 4 },
  list: { padding: 20, paddingBottom: 100 },
  cardWrap: { marginBottom: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyCard: {
    width: 260,
    height: 160,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  emptyChip: { width: 32, height: 22, borderRadius: 4, backgroundColor: '#333' },
  emptyLine1: { width: '70%', height: 12, borderRadius: 6, backgroundColor: '#222' },
  emptyLine2: { width: '50%', height: 10, borderRadius: 5, backgroundColor: '#1f1f1f' },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888' },
  emptySub: { fontSize: 13, color: '#555', marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fff',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  fabText: { color: '#0f0f0f', fontSize: 28, fontWeight: '300', marginTop: -2 },
})
