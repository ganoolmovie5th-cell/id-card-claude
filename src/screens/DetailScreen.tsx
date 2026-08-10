import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getCards, deleteCard } from '../lib/storage'
import { CARD_LABELS, type IDCard } from '../types/card'
import CardVisual from '../components/CardVisual'

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

  const dataEntries = Object.entries(card.data).filter(([_, v]) => v)

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Kembali</Text>
        </TouchableOpacity>

        {/* Physical card */}
        <CardVisual card={card} />

        {/* Info section */}
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Detail Kartu</Text>

          <InfoRow label="Jenis" value={CARD_LABELS[card.type]} />
          <InfoRow label="Nama" value={card.name} />
          <InfoRow label="Nomor" value={card.number} mono />
          {dataEntries.map(([key, value]) => (
            <InfoRow key={key} label={key} value={value} />
          ))}
          <InfoRow label="Ditambahkan" value={new Date(card.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
        </View>

        {/* Delete */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Text style={s.deleteText}>Hapus Kartu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, mono && { fontFamily: 'monospace', letterSpacing: 1 }]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 15, color: '#888', fontWeight: '600' },
  infoSection: {
    marginTop: 28,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#eee', maxWidth: '60%', textAlign: 'right' },
  deleteBtn: {
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a1a1a',
    backgroundColor: '#1a1010',
    alignItems: 'center',
  },
  deleteText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
})
