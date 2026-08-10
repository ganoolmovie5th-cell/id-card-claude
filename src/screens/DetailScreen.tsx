import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getCards, deleteCard } from '../lib/storage'
import { CARD_LABELS, CARD_COLORS, type IDCard } from '../types/card'

export default function DetailScreen({ route, navigation }: any) {
  const { id } = route.params
  const [card, setCard] = useState<IDCard | null>(null)

  useEffect(() => {
    getCards().then(cards => setCard(cards.find(c => c.id === id) || null))
  }, [id])

  const handleDelete = () => {
    Alert.alert('Hapus Kartu', 'Yakin mau hapus kartu ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => { await deleteCard(id); navigation.goBack() } },
    ])
  }

  if (!card) return null

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Kembali</Text>
        </TouchableOpacity>

        <View style={[s.card, { borderTopColor: CARD_COLORS[card.type] }]}>
          <Text style={s.type}>{CARD_LABELS[card.type]}</Text>
          <Text style={s.name}>{card.name}</Text>
          <Text style={s.number}>{card.number}</Text>
          <Text style={s.date}>Ditambahkan: {new Date(card.createdAt).toLocaleDateString('id-ID')}</Text>
        </View>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Text style={s.deleteText}>Hapus Kartu</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  inner: { padding: 24 },
  back: { fontSize: 16, color: '#1E40AF', fontWeight: '600', marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, borderTopWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 },
  type: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1.5 },
  name: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginTop: 12 },
  number: { fontSize: 18, color: '#444', marginTop: 8, letterSpacing: 2, fontFamily: 'monospace' },
  date: { fontSize: 12, color: '#aaa', marginTop: 16 },
  deleteBtn: { marginTop: 32, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#ef4444', alignItems: 'center' },
  deleteText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
})
