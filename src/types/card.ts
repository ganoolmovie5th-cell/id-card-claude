export type CardType = 'ktp' | 'sim' | 'npwp' | 'bpjs-kesehatan' | 'bpjs-tk' | 'krl' | 'kk'

export interface IDCard {
  id: string
  type: CardType
  name: string
  number: string
  imageUri?: string
  data: Record<string, string>
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
