import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { CARD_LABELS, CARD_COLORS, type IDCard } from '../types/card'

interface Props {
  card: IDCard
  compact?: boolean
}

export default function CardVisual({ card, compact }: Props) {
  // KTP gets special physical-accurate layout
  if (card.type === 'ktp' && card.ktpData) {
    return <KTPVisual card={card} compact={compact} />
  }

  // Generic card for other types
  const color = CARD_COLORS[card.type]
  const height = compact ? 180 : 220

  return (
    <View style={[s.card, { backgroundColor: color, height }]}>
      <View style={s.topRow}>
        <View style={s.chip} />
        <Text style={s.typeBadge}>{CARD_LABELS[card.type]}</Text>
      </View>
      <Text style={[s.number, compact && { fontSize: 16 }]} numberOfLines={1}>
        {formatNumber(card.number)}
      </Text>
      <View style={s.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>NAMA</Text>
          <Text style={s.name} numberOfLines={1}>{card.name}</Text>
        </View>
        <View>
          <Text style={s.label}>TANGGAL</Text>
          <Text style={s.name}>{new Date(card.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</Text>
        </View>
      </View>
      <View style={s.circle} />
    </View>
  )
}

function KTPVisual({ card, compact }: Props) {
  const ktp = card.ktpData!
  const height = compact ? 200 : 240

  return (
    <View style={[k.card, { height }]}>
      {/* Red header bar */}
      <View style={k.header}>
        <View style={k.headerLeft}>
          <Text style={k.headerProvince}>{ktp.provinsi || 'PROVINSI'}</Text>
          <Text style={k.headerCity}>{ktp.kabupaten || 'KABUPATEN/KOTA'}</Text>
        </View>
        <Text style={k.headerTitle}>KARTU TANDA PENDUDUK</Text>
      </View>

      {/* NIK row */}
      <View style={k.nikRow}>
        <Text style={k.nikLabel}>NIK</Text>
        <Text style={k.nikValue}>{ktp.nik || card.number || '-'}</Text>
      </View>

      {/* Body: photo left, fields right */}
      <View style={k.body}>
        {/* Photo area */}
        <View style={k.photoArea}>
          {ktp.photoUri ? (
            <Image source={{ uri: ktp.photoUri }} style={k.photo} />
          ) : card.imageUri ? (
            <Image source={{ uri: card.imageUri }} style={k.photo} />
          ) : (
            <View style={k.photoPlaceholder}>
              <Text style={k.photoPlaceholderText}>FOTO</Text>
            </View>
          )}
        </View>

        {/* Fields */}
        <View style={k.fields}>
          <KTPField label="Nama" value={ktp.nama || card.name} compact={compact} />
          <KTPField label="Tempat/Tgl Lahir" value={[ktp.tempatLahir, ktp.tanggalLahir].filter(Boolean).join(', ')} compact={compact} />
          <KTPField label="Jenis Kelamin" value={ktp.jenisKelamin} compact={compact} />
          <KTPField label="Alamat" value={ktp.alamat} compact={compact} />
          <KTPField label="RT/RW" value={ktp.rtRw} compact={compact} />
          <KTPField label="Kel/Desa" value={ktp.kelDesa} compact={compact} />
          <KTPField label="Kecamatan" value={ktp.kecamatan} compact={compact} />
        </View>
      </View>

      {/* Bottom fields row */}
      {!compact && (
        <View style={k.bottomFields}>
          <KTPFieldInline label="Agama" value={ktp.agama} />
          <KTPFieldInline label="Status" value={ktp.statusPerkawinan} />
          <KTPFieldInline label="Pekerjaan" value={ktp.pekerjaan} />
          <KTPFieldInline label="WNI" value={ktp.kewarganegaraan} />
          <KTPFieldInline label="Berlaku" value={ktp.berlakuHingga} />
        </View>
      )}
    </View>
  )
}

function KTPField({ label, value, compact }: { label: string; value?: string; compact?: boolean }) {
  if (!value) return null
  return (
    <View style={k.fieldRow}>
      <Text style={[k.fieldLabel, compact && { fontSize: 7 }]}>{label}</Text>
      <Text style={[k.fieldValue, compact && { fontSize: 8 }]} numberOfLines={1}>{value}</Text>
    </View>
  )
}

function KTPFieldInline({ label, value }: { label: string; value?: string }) {
  return (
    <View style={k.inlineField}>
      <Text style={k.inlineLabel}>{label}</Text>
      <Text style={k.inlineValue} numberOfLines={1}>{value || '-'}</Text>
    </View>
  )
}

function formatNumber(num: string): string {
  return num.replace(/(.{4})/g, '$1 ').trim()
}

// Generic card styles
const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { width: 36, height: 26, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  typeBadge: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', letterSpacing: 1.5 },
  number: { fontSize: 20, fontWeight: '600', color: '#fff', letterSpacing: 2, fontFamily: 'monospace' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  label: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 2 },
  name: { fontSize: 14, fontWeight: '700', color: '#fff' },
  circle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -60 },
})

// KTP-specific styles (physical card accurate)
const k = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#f5f0e8', // cream/off-white like physical KTP
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d4c9b0',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  header: {
    backgroundColor: '#c41e1e', // red header like real KTP
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flex: 1 },
  headerProvince: { fontSize: 8, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
  headerCity: { fontSize: 7, fontWeight: '500', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' },
  headerTitle: { fontSize: 7, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  nikRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(196,30,30,0.08)',
  },
  nikLabel: { fontSize: 8, fontWeight: '700', color: '#333', marginRight: 6 },
  nikValue: { fontSize: 10, fontWeight: '700', color: '#1a1a1a', fontFamily: 'monospace', letterSpacing: 1 },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
  },
  photoArea: {
    width: 60,
    height: 75,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: { width: 56, height: 72, borderRadius: 2, borderWidth: 1, borderColor: '#ccc' },
  photoPlaceholder: { width: 56, height: 72, borderRadius: 2, backgroundColor: '#ddd', borderWidth: 1, borderColor: '#bbb', alignItems: 'center', justifyContent: 'center' },
  photoPlaceholderText: { fontSize: 8, color: '#888', fontWeight: '600' },
  fields: { flex: 1, justifyContent: 'center' },
  fieldRow: { flexDirection: 'row', marginBottom: 1 },
  fieldLabel: { fontSize: 8, color: '#666', width: 70 },
  fieldValue: { fontSize: 9, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  bottomFields: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingBottom: 6,
    gap: 2,
  },
  inlineField: { marginRight: 10 },
  inlineLabel: { fontSize: 7, color: '#888' },
  inlineValue: { fontSize: 8, fontWeight: '600', color: '#333' },
})
