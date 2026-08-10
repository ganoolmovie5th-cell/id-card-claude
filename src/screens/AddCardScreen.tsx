import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { addCard } from '../lib/storage'
import { recognizeText } from '../lib/ocr'
import { CARD_LABELS, type CardType, type IDCard, type KTPData } from '../types/card'

const cardTypes: CardType[] = ['ktp', 'sim', 'npwp', 'bpjs-kesehatan', 'bpjs-tk', 'krl', 'kk']

export default function AddCardScreen({ navigation }: any) {
  const [type, setType] = useState<CardType>('ktp')
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [ocrDone, setOcrDone] = useState(false)

  // KTP specific fields
  const [ktpData, setKtpData] = useState<KTPData>({})

  const updateKtp = (field: keyof KTPData, value: string) => {
    setKtpData(prev => ({ ...prev, [field]: value }))
  }

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert('Izin Ditolak', 'Butuh akses kamera/galeri untuk scan kartu')
      return
    }

    const pickerOptions: ImagePicker.ImagePickerOptions = {
      quality: 0.5,
      base64: true,
      exif: false,
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions)

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setImageUri(asset.uri)
    setOcrDone(false)

    if (asset.base64) {
      await runOCR(asset.base64)
    } else {
      Alert.alert('Error', 'Gagal membaca gambar. Coba lagi.')
    }
  }

  const runOCR = async (base64: string) => {
    setScanning(true)
    try {
      const result = await recognizeText(base64)
      if (result.ktpData && type === 'ktp') {
        setKtpData(result.ktpData)
        if (result.ktpData.nama) setName(result.ktpData.nama)
        if (result.ktpData.nik) setNumber(result.ktpData.nik)
      } else {
        if (result.name) setName(result.name)
        if (result.number) setNumber(result.number)
      }
      if (!result.text) {
        Alert.alert('Peringatan', 'Foto terbaca tapi tidak ada teks terdeteksi. Pastikan foto jelas dan terang.')
      } else {
        setOcrDone(true)
      }
    } catch (e: any) {
      console.warn('OCR error:', e)
      Alert.alert('OCR Gagal', `${e?.message || 'Tidak bisa baca teks dari foto'}. Silakan isi manual atau coba foto ulang dengan cahaya lebih terang.`)
    } finally {
      setScanning(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim() || !number.trim()) {
      Alert.alert('Error', 'Nama dan nomor wajib diisi')
      return
    }

    const finalKtpData: KTPData | undefined = type === 'ktp' ? {
      ...ktpData,
      nama: name.trim(),
      nik: number.trim(),
      photoUri: imageUri || undefined,
    } : undefined

    const card: IDCard = {
      id: Date.now().toString(),
      type,
      name: name.trim(),
      number: number.trim(),
      imageUri: imageUri || undefined,
      data: {},
      ktpData: finalKtpData,
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
        <Text style={s.label}>Scan Kartu</Text>
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

        {/* Basic fields */}
        <Field label="Nama" value={name} onChange={setName} placeholder="Nama sesuai kartu" />
        <Field label="Nomor (NIK)" value={number} onChange={setNumber} placeholder="Nomor identitas" />

        {/* KTP extra fields */}
        {type === 'ktp' && (
          <>
            <Text style={s.sectionHeader}>Data KTP</Text>
            <Field label="Provinsi" value={ktpData.provinsi || ''} onChange={v => updateKtp('provinsi', v)} placeholder="Provinsi" />
            <Field label="Kab/Kota" value={ktpData.kabupaten || ''} onChange={v => updateKtp('kabupaten', v)} placeholder="Kabupaten/Kota" />
            <Field label="Tempat Lahir" value={ktpData.tempatLahir || ''} onChange={v => updateKtp('tempatLahir', v)} placeholder="Tempat lahir" />
            <Field label="Tanggal Lahir" value={ktpData.tanggalLahir || ''} onChange={v => updateKtp('tanggalLahir', v)} placeholder="DD-MM-YYYY" />
            <Field label="Jenis Kelamin" value={ktpData.jenisKelamin || ''} onChange={v => updateKtp('jenisKelamin', v)} placeholder="LAKI-LAKI / PEREMPUAN" />
            <Field label="Alamat" value={ktpData.alamat || ''} onChange={v => updateKtp('alamat', v)} placeholder="Alamat lengkap" />
            <Field label="RT/RW" value={ktpData.rtRw || ''} onChange={v => updateKtp('rtRw', v)} placeholder="001/002" />
            <Field label="Kel/Desa" value={ktpData.kelDesa || ''} onChange={v => updateKtp('kelDesa', v)} placeholder="Kelurahan/Desa" />
            <Field label="Kecamatan" value={ktpData.kecamatan || ''} onChange={v => updateKtp('kecamatan', v)} placeholder="Kecamatan" />
            <Field label="Agama" value={ktpData.agama || ''} onChange={v => updateKtp('agama', v)} placeholder="Agama" />
            <Field label="Status Perkawinan" value={ktpData.statusPerkawinan || ''} onChange={v => updateKtp('statusPerkawinan', v)} placeholder="Belum Kawin / Kawin / Cerai" />
            <Field label="Pekerjaan" value={ktpData.pekerjaan || ''} onChange={v => updateKtp('pekerjaan', v)} placeholder="Pekerjaan" />
            <Field label="Kewarganegaraan" value={ktpData.kewarganegaraan || ''} onChange={v => updateKtp('kewarganegaraan', v)} placeholder="WNI / WNA" />
            <Field label="Berlaku Hingga" value={ktpData.berlakuHingga || ''} onChange={v => updateKtp('berlakuHingga', v)} placeholder="SEUMUR HIDUP" />
          </>
        )}

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

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#555"
      />
    </>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#aaa', marginTop: 28, marginBottom: 4, borderTopWidth: 1, borderTopColor: '#222', paddingTop: 20 },
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
