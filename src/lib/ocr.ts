import type { KTPData } from '../types/card'

const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = 'helloworld' // free tier public key

export interface OCRResult {
  text: string
  name: string | null
  number: string | null
  ktpData: KTPData
}

async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function recognizeText(imageUri: string): Promise<OCRResult> {
  const base64 = await uriToBase64(imageUri)

  const body = new FormData()
  body.append('base64Image', `data:image/jpeg;base64,${base64}`)
  body.append('language', 'eng+ind')
  body.append('isOverlayRequired', 'false')
  body.append('OCREngine', '2')

  const res = await fetch(OCR_API_URL, {
    method: 'POST',
    headers: { apikey: OCR_API_KEY },
    body,
  })

  const json = await res.json()
  const text = json?.ParsedResults?.[0]?.ParsedText || ''

  const ktpData = parseKTP(text)

  return {
    text,
    name: ktpData.nama || null,
    number: ktpData.nik || null,
    ktpData,
  }
}

function parseKTP(text: string): KTPData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const data: KTPData = {}

  // Helper: find value after a label (on same line or next line)
  const findField = (patterns: RegExp[]): string | undefined => {
    for (let i = 0; i < lines.length; i++) {
      for (const pattern of patterns) {
        const match = lines[i].match(pattern)
        if (match && match[1]?.trim()) return match[1].trim()
      }
    }
    return undefined
  }

  // PROVINSI — usually first line or contains "PROVINSI"
  data.provinsi = findField([
    /provinsi\s*[:.]?\s*(.+)/i,
  ]) || extractTopLine(lines, 0)

  // KAB/KOTA
  data.kabupaten = findField([
    /(?:kab(?:upaten)?|kota)\s*[:.]?\s*(.+)/i,
  ]) || extractTopLine(lines, 1)

  // NIK — 16 digit number
  const nikMatch = text.match(/\b(\d{16})\b/)
  if (nikMatch) data.nik = nikMatch[1]

  // Nama
  data.nama = findField([
    /^nama\s*[:.]?\s*(.+)/im,
  ])

  // Tempat/Tgl Lahir
  const ttlMatch = findField([
    /tempat.*?lahir\s*[:.]?\s*(.+)/i,
    /ttl\s*[:.]?\s*(.+)/i,
  ])
  if (ttlMatch) {
    const parts = ttlMatch.split(/[,]/)
    if (parts.length >= 2) {
      data.tempatLahir = parts[0].trim()
      data.tanggalLahir = parts.slice(1).join(',').trim()
    } else {
      data.tempatLahir = ttlMatch
    }
  }

  // Tanggal lahir standalone
  if (!data.tanggalLahir) {
    const tglMatch = findField([/(?:tgl|tanggal)\s*(?:lahir)?\s*[:.]?\s*(\d{2}[-/.]\d{2}[-/.]\d{4})/i])
    if (tglMatch) data.tanggalLahir = tglMatch
  }

  // Jenis Kelamin
  data.jenisKelamin = findField([
    /jenis\s*kelamin\s*[:.]?\s*(.+)/i,
    /kelamin\s*[:.]?\s*(.+)/i,
  ])
  // Normalize
  if (data.jenisKelamin) {
    const jk = data.jenisKelamin.toUpperCase()
    if (jk.includes('LAKI')) data.jenisKelamin = 'LAKI-LAKI'
    else if (jk.includes('PEREM')) data.jenisKelamin = 'PEREMPUAN'
  }

  // Alamat
  data.alamat = findField([
    /^alamat\s*[:.]?\s*(.+)/im,
  ])

  // RT/RW
  data.rtRw = findField([
    /rt\s*[/.]?\s*rw\s*[:.]?\s*(.+)/i,
  ])

  // Kel/Desa
  data.kelDesa = findField([
    /(?:kel(?:urahan)?|desa)\s*[/.]?\s*(?:desa)?\s*[:.]?\s*(.+)/i,
  ])

  // Kecamatan
  data.kecamatan = findField([
    /kecamatan\s*[:.]?\s*(.+)/i,
  ])

  // Agama
  data.agama = findField([
    /agama\s*[:.]?\s*(.+)/i,
  ])

  // Status Perkawinan
  data.statusPerkawinan = findField([
    /status\s*(?:perkawinan)?\s*[:.]?\s*(.+)/i,
  ])

  // Pekerjaan
  data.pekerjaan = findField([
    /pekerjaan\s*[:.]?\s*(.+)/i,
  ])

  // Kewarganegaraan
  data.kewarganegaraan = findField([
    /kewarganegaraan\s*[:.]?\s*(.+)/i,
    /warga\s*negara\s*[:.]?\s*(.+)/i,
  ])

  // Berlaku Hingga
  data.berlakuHingga = findField([
    /berlaku\s*(?:hingga|s\.?d\.?)?\s*[:.]?\s*(.+)/i,
  ])

  return data
}

function extractTopLine(lines: string[], index: number): string | undefined {
  if (lines.length > index) {
    const line = lines[index]
    // Skip if it looks like a known field label
    if (!/^(nik|nama|tempat|alamat|agama|status|rt)/i.test(line)) {
      return line
    }
  }
  return undefined
}
