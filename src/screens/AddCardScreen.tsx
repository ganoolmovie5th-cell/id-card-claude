import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { addCard } from '../lib/storage'
import { CARD_LABELS, type CardType, type IDCard } from '../types/card'

const cardTypes: CardType[] = ['ktp', 'sim', 'npwp', 'bpjs-kesehatan', 'bpjs-tk', 'krl', 'kk']

export default function AddCardScreen({ navigation }: any) {
  const [type, setType] = useState<CardType>('ktp')
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')

  const handleSave = async () => {
    if (!name.trim() || !number.trim()) {
      Alert.alert('Error', 'Nama dan nomor wajib diisi')
      return
    }
    const card: IDCard = {
      id: Date.now().toString(),
      type,
      name: name.trim(),
      number: number.trim(),
      data: {},
      createdAt: new Date().toISOString(),
    }
    await addCard(card)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Tambah Kartu</Text>

        <Text style={s.label}>Jenis Kartu</Text>
        <View style={s.typeGrid}>
          {cardTypes.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.typeBtn, type === t && s.typeBtnActive]}
              onPress={() => setType(t)}
            >
              <Text style={[s.typeText, type === t && s.typeTextActive]}>{CARD_LABELS[t]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Nama Pemilik</Text>
        <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Nama sesuai kartu" />

        <Text style={s.label}>Nomor Kartu</Text>
        <TextInput style={s.input} value={number} onChangeText={setNumber} placeholder="Nomor identitas" keyboardType="default" />

        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveBtnText}>Simpan Kartu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={s.cancelText}>Batal</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 16 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  typeBtnActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#555' },
  typeTextActive: { color: '#fff' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 16, color: '#1a1a1a' },
  saveBtn: { marginTop: 32, backgroundColor: '#1E40AF', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 12, padding: 16, alignItems: 'center' },
  cancelText: { color: '#888', fontSize: 14, fontWeight: '500' },
})
