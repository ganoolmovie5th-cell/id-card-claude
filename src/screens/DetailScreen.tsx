import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getCards, deleteCard } from '../lib/storage'
import { CARD_LABELS, KTP_FIELD_LABELS, type IDCard, type KTPData } from '../types/card'
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

  const ktpFields: (keyof KTPData)[] = [
    'provinsi', 'kabupaten', 'nik', 'nama', 'tempatLahir', 'tanggalLahir',
    'jenisKelamin', 'alamat', 'rtRw', 'kelDesa', 'kecamatan',
    'agama', 'statusPerkawinan', 'pekerjaan', 'kewarganegaraan', 'berlakuHingga',
  ]

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Kembali</Text>
        </TouchableOpacity>

        {/* Physical card visual */}
        <CardVisual card={card} />

        {/* Detail section */}
        <View style={s.infoSection}>
          <Text style={s.sectionTitle}>Detail {CARD_LABELS[card.type]}</Text>

          {card.type === 'ktp' && card.ktpData ? (
            // Show all KTP fields
            ktpFields.map(field => {
              const value = card.ktpData![field]
              if (!value || field === 'photoUri') return null
              return (
                <View key={field} style={s.row}>
                  <Text style={s.rowLabel}>{KTP_FIELD_LABELS[field]}</Text>
                  <Text style={[s.rowValue, field === 'nik' && { fontFamily: 'monospace', letterSpacing: 1 }]}>{value}</Text>
                </View>
              )
            })
          ) : (
            // Generic card fields
            <>
              <View style={s.row}>
                <Text style={s.rowLabel}>Jenis</Text>
                <Text style={s.rowValue}>{CARD_LABELS[card.type]}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.rowLabel}>Nama</Text>
                <Text style={s.rowValue}>{card.name}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.rowLabel}>Nomor</Text>
                <Text style={[s.rowValue, { fontFamily: 'monospace', letterSpacing: 1 }]}>{card.number}</Text>
              </View>
            </>
          )}

          <View style={s.row}>
            <Text style={s.rowLabel}>Ditambahkan</Text>
            <Text style={s.rowValue}>{new Date(card.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
        </View>

        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Text style={s.deleteText}>Hapus Kartu</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 24, paddingBottom: 60 },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 15, color: '#888', fontWeight: '600' },
  infoSection: {
    marginTop: 24,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  rowLabel: { fontSize: 13, color: '#666', flex: 1 },
  rowValue: { fontSize: 13, fontWeight: '600', color: '#eee', flex: 2, textAlign: 'right' },
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
