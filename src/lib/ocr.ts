import type { KTPData } from '../types/card'

const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = 'helloworld' // free tier public key

export interface OCRResult {
  text: string
  name: string | null
  number: string | null
  ktpData: KTPData
}

/**
 * Recognize text from base64 image string (no URI conversion needed).
 * Pass the raw base64 from expo-image-picker { base64: true }
 */
export async function recognizeText(base64Image: string): Promise<OCRResult> {
  const body = new FormData()
  body.append('base64Image', `data:image/jpeg;base64,${base64Image}`)
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

  // Also try: label on one line, value on next line
  const findFieldNextLine = (patterns: RegExp[]): string | undefined => {
    for (let i = 0; i < lines.length - 1; i++) {
      for (const pattern of patterns) {
        if (pattern.test(lines[i]) && lines[i + 1]) {
          const next = lines[i + 1].trim()
          // Skip if next line is another label
          if (!/^(nik|nama|tempat|alamat|agama|status|rt|jenis|pekerjaan|kewarga|berlaku|kecamatan|kel)/i.test(next)) {
            return next
          }
        }
      }
    }
    return undefined
  }

  // PROVINSI
  data.provinsi = findField([/provinsi\s*[:.]?\s*(.+)/i]) || extractTopLine(lines, 0)

  // KAB/KOTA
  data.kabupaten = findField([/(?:kab(?:upaten)?|kota)\s*[:.]?\s*(.+)/i]) || extractTopLine(lines, 1)

  // NIK — 16 digit number
  const nikMatch = text.match(/\b(\d{16})\b/)
  if (nikMatch) data.nik = nikMatch[1]
  // Fallback: any long digit sequence
  if (!data.nik) {
    const longNum = text.match(/(\d[\d\s.]{13,})/);
    if (longNum) data.nik = longNum[1].replace(/[\s.]/g, '')
  }

  // Nama
  data.nama = findField([/^nama\s*[:.]?\s*(.+)/im])
  if (!data.nama) data.nama = findFieldNextLine([/^nama\s*$/im])
  // Fallback: longest uppercase-only line (likely a name)
  if (!data.nama) {
    const candidates = lines.filter(l => l.length > 3 && /^[A-Z\s'.,\-]+$/.test(l))
    if (candidates.length > 0) data.nama = candidates.sort((a, b) => b.length - a.length)[0]
  }

  // Tempat/Tgl Lahir
  const ttlMatch = findField([/tempat.*?lahir\s*[:.]?\s*(.+)/i, /ttl\s*[:.]?\s*(.+)/i])
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
    const dateMatch = text.match(/(\d{2}[-/.]\d{2}[-/.]\d{4})/)
    if (dateMatch) data.tanggalLahir = dateMatch[1]
  }

  // Jenis Kelamin
  data.jenisKelamin = findField([/jenis\s*kelamin\s*[:.]?\s*(.+)/i, /kelamin\s*[:.]?\s*(.+)/i])
  if (!data.jenisKelamin) {
    if (/laki[\s-]*laki/i.test(text)) data.jenisKelamin = 'LAKI-LAKI'
    else if (/perempuan/i.test(text)) data.jenisKelamin = 'PEREMPUAN'
  }
  if (data.jenisKelamin) {
    const jk = data.jenisKelamin.toUpperCase()
    if (jk.includes('LAKI')) data.jenisKelamin = 'LAKI-LAKI'
    else if (jk.includes('PEREM')) data.jenisKelamin = 'PEREMPUAN'
  }

  // Alamat
  data.alamat = findField([/^alamat\s*[:.]?\s*(.+)/im])
  if (!data.alamat) data.alamat = findFieldNextLine([/^alamat\s*$/im])

  // RT/RW
  data.rtRw = findField([/rt\s*[/.]?\s*rw\s*[:.]?\s*(.+)/i])
  if (!data.rtRw) {
    const rtMatch = text.match(/(\d{3}\s*[/.]\s*\d{3})/)
    if (rtMatch) data.rtRw = rtMatch[1].replace(/\s/g, '')
  }

  // Kel/Desa
  data.kelDesa = findField([/(?:kel(?:urahan)?|desa)\s*[/.]?\s*(?:desa)?\s*[:.]?\s*(.+)/i])

  // Kecamatan
  data.kecamatan = findField([/kecamatan\s*[:.]?\s*(.+)/i])

  // Agama
  data.agama = findField([/agama\s*[:.]?\s*(.+)/i])
  if (!data.agama) {
    const agamaList = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']
    for (const a of agamaList) {
      if (text.toUpperCase().includes(a)) { data.agama = a; break }
    }
  }

  // Status Perkawinan
  data.statusPerkawinan = findField([/status\s*(?:perkawinan)?\s*[:.]?\s*(.+)/i])
  if (!data.statusPerkawinan) {
    if (/belum\s*kawin/i.test(text)) data.statusPerkawinan = 'BELUM KAWIN'
    else if (/kawin/i.test(text)) data.statusPerkawinan = 'KAWIN'
    else if (/cerai/i.test(text)) data.statusPerkawinan = 'CERAI'
  }

  // Pekerjaan
  data.pekerjaan = findField([/pekerjaan\s*[:.]?\s*(.+)/i])

  // Kewarganegaraan
  data.kewarganegaraan = findField([/kewarganegaraan\s*[:.]?\s*(.+)/i, /warga\s*negara\s*[:.]?\s*(.+)/i])
  if (!data.kewarganegaraan && /\bWNI\b/i.test(text)) data.kewarganegaraan = 'WNI'

  // Berlaku Hingga
  data.berlakuHingga = findField([/berlaku\s*(?:hingga|s\.?d\.?)?\s*[:.]?\s*(.+)/i])
  if (!data.berlakuHingga && /seumur\s*hidup/i.test(text)) data.berlakuHingga = 'SEUMUR HIDUP'

  return data
}

function extractTopLine(lines: string[], index: number): string | undefined {
  if (lines.length > index) {
    const line = lines[index]
    if (!/^(nik|nama|tempat|alamat|agama|status|rt)/i.test(line)) {
      return line
    }
  }
  return undefined
}
