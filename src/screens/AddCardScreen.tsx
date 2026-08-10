import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { addCard } from '../lib/storage'
import { recognizeText } from '../lib/ocr'
import { CARD_LABELS, type CardType, type IDCard } from '../types/card'

const cardTypes: CardType[] = ['ktp', 'sim', 'npwp', 'bpjs-kesehatan', 'bpjs-tk', 'krl', 'kk']

export default function AddCardScreen({ navigation }: any) {
  const [type, setType] = useState<CardType>('ktp')
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [ocrDone, setOcrDone] = useState(false)

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Butuh akses kamera/galeri untuk scan kartu')
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 })

    if (result.canceled || !result.assets[0]) return

    const uri = result.assets[0].uri
    setImageUri(uri)
    setOcrDone(false)
    await runOCR(uri)
  }

  const runOCR = async (uri: string) => {
    setScanning(true)
    try {
      const result = await recognizeText(uri)
      if (result.name) setName(result.name)
      if (result.number) setNumber(result.number)
      setOcrDone(true)
    } catch (e: any) {
      console.warn('OCR error:', e)
      Alert.alert('OCR Gagal', 'Tidak bisa baca teks dari foto. Silakan isi manual.')
    } finally {
      setScanning(false)
    }
  }

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
      imageUri: imageUri || undefined,
      data: {},
      createdAt: new Date().toISOString(),
    }
    await addCard(card)
    navigation.goBack()
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Tambah Kartu</Text>

        {/* Photo input */}
        <Text style={s.label}>Scan Kartu (opsional)</Text>
        <View style={s.photoRow}>
          <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(true)}>
            <Text style={s.photoBtnIcon}>📷</Text>
            <Text style={s.photoBtnText}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.photoBtn} onPress={() => pickImage(false)}>
            <Text style={s.photoBtnIcon}>🖼</Text>
            <Text style={s.photoBtnText}>Galeri</Text>
          </TouchableOpacity>
        </View>

        {scanning && (
          <View style={s.scanningRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={s.scanningText}>Membaca kartu...</Text>
          </View>
        )}

        {imageUri && !scanning && (
          <View style={s.previewWrap}>
            <Image source={{ uri: imageUri }} style={s.preview} resizeMode="cover" />
            {ocrDone && <View style={s.ocrBadge}><Text style={s.ocrBadgeText}>✓ Teks terbaca</Text></View>}
            <TouchableOpacity style={s.removeImg} onPress={() => { setImageUri(null); setOcrDone(false) }}>
              <Text style={s.removeImgText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Card type */}
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

        {/* Manual fields */}
        <Text style={s.label}>Nama Pemilik</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder="Nama sesuai kartu"
          placeholderTextColor="#555"
        />

        <Text style={s.label}>Nomor Kartu</Text>
        <TextInput
          style={s.input}
          value={number}
          onChangeText={setNumber}
          placeholder="Nomor identitas"
          placeholderTextColor="#555"
          keyboardType="default"
        />

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
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 20, textTransform: 'uppercase', letterSpacing: 0.5 },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  photoBtnIcon: { fontSize: 28, marginBottom: 6 },
  photoBtnText: { fontSize: 13, color: '#888', fontWeight: '500' },
  scanningRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  scanningText: { color: '#888', fontSize: 13 },
  previewWrap: { marginTop: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: 180, borderRadius: 12 },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  removeImgText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  ocrBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(22,163,74,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ocrBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a' },
  typeBtnActive: { backgroundColor: '#fff', borderColor: '#fff' },
  typeText: { fontSize: 12, fontWeight: '600', color: '#888' },
  typeTextActive: { color: '#0f0f0f' },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 12, padding: 14, fontSize: 16, color: '#fff' },
  saveBtn: { marginTop: 32, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 12, padding: 16, alignItems: 'center' },
  cancelText: { color: '#555', fontSize: 14, fontWeight: '500' },
})
