import React, { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { getCards } from '../lib/storage'
import { CARD_LABELS, CARD_COLORS, type IDCard } from '../types/card'

export default function HomeScreen({ navigation }: any) {
  const [cards, setCards] = useState<IDCard[]>([])

  useFocusEffect(useCallback(() => {
    getCards().then(setCards)
  }, []))

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>ID Card Wallet</Text>
        <Text style={s.sub}>{cards.length} kartu tersimpan</Text>
      </View>

      <FlatList
        data={cards}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>💳</Text>
            <Text style={s.emptyText}>Belum ada kartu</Text>
            <Text style={s.emptySub}>Tap + untuk menambahkan</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.card, { borderLeftColor: CARD_COLORS[item.type] }]}
            onPress={() => navigation.navigate('Detail', { id: item.id })}
          >
            <View>
              <Text style={s.cardType}>{CARD_LABELS[item.type]}</Text>
              <Text style={s.cardName}>{item.name}</Text>
              <Text style={s.cardNum}>{item.number}</Text>
            </View>
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
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 24, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  sub: { fontSize: 14, color: '#888', marginTop: 4 },
  list: { padding: 16 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardType: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  cardName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a', marginTop: 4 },
  cardNum: { fontSize: 14, color: '#555', marginTop: 2, letterSpacing: 1 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1E40AF', alignItems: 'center', justifyContent: 'center', shadowColor: '#1E40AF', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
})
