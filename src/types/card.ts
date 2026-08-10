export type CardType = 'ktp' | 'sim' | 'npwp' | 'bpjs-kesehatan' | 'bpjs-tk' | 'krl' | 'kk'

export interface KTPData {
  provinsi?: string
  kabupaten?: string
  nik?: string
  nama?: string
  tempatLahir?: string
  tanggalLahir?: string
  jenisKelamin?: string
  alamat?: string
  rtRw?: string
  kelDesa?: string
  kecamatan?: string
  agama?: string
  statusPerkawinan?: string
  pekerjaan?: string
  kewarganegaraan?: string
  berlakuHingga?: string
  photoUri?: string
}

export interface IDCard {
  id: string
  type: CardType
  name: string
  number: string
  imageUri?: string
  data: Record<string, string>
  ktpData?: KTPData
  createdAt: string
}

export const CARD_LABELS: Record<CardType, string> = {
  ktp: 'KTP',
  sim: 'SIM',
  npwp: 'NPWP',
  'bpjs-kesehatan': 'BPJS Kesehatan',
  'bpjs-tk': 'BPJS Ketenagakerjaan',
  krl: 'KRL (KMT)',
  kk: 'Kartu Keluarga',
}

export const CARD_COLORS: Record<CardType, string> = {
  ktp: '#1E40AF',
  sim: '#9333EA',
  npwp: '#059669',
  'bpjs-kesehatan': '#16A34A',
  'bpjs-tk': '#D97706',
  krl: '#DC2626',
  kk: '#4F46E5',
}

export const KTP_FIELD_LABELS: Record<keyof KTPData, string> = {
  provinsi: 'PROVINSI',
  kabupaten: 'KAB/KOTA',
  nik: 'NIK',
  nama: 'Nama',
  tempatLahir: 'Tempat Lahir',
  tanggalLahir: 'Tgl Lahir',
  jenisKelamin: 'Jenis Kelamin',
  alamat: 'Alamat',
  rtRw: 'RT/RW',
  kelDesa: 'Kel/Desa',
  kecamatan: 'Kecamatan',
  agama: 'Agama',
  statusPerkawinan: 'Status Perkawinan',
  pekerjaan: 'Pekerjaan',
  kewarganegaraan: 'Kewarganegaraan',
  berlakuHingga: 'Berlaku Hingga',
  photoUri: 'Foto',
}
