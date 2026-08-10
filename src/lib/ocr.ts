import type { KTPData } from '../types/card'

const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = 'helloworld'

export interface OCRResult {
  text: string
  name: string | null
  number: string | null
  ktpData: KTPData
}

export async function recognizeText(base64Image: string): Promise<OCRResult> {
  const body = new FormData()
  body.append('base64Image', `data:image/jpeg;base64,${base64Image}`)
  body.append('language', 'eng')
  body.append('isOverlayRequired', 'false')
  body.append('OCREngine', '2')
  body.append('filetype', 'jpg')

  const res = await fetch(OCR_API_URL, {
    method: 'POST',
    headers: { 'apikey': OCR_API_KEY },
    body,
  })

  const text = await res.text()
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`OCR response parse error: ${text.substring(0, 200)}`)
  }

  if (json.IsErroredOnProcessing || (json.OCRExitCode && json.OCRExitCode !== 1)) {
    const errMsg = Array.isArray(json.ErrorMessage) ? json.ErrorMessage[0] : (json.error || 'OCR processing failed')
    throw new Error(errMsg)
  }

  const parsedText = json?.ParsedResults?.[0]?.ParsedText || ''
  const ktpData = parseKTP(parsedText)

  return {
    text: parsedText,
    name: ktpData.nama || null,
    number: ktpData.nik || null,
    ktpData,
  }
}

/**
 * Clean any value: remove all leading/trailing colons, dots, dashes, weird chars
 */
function clean(val: string): string {
  return val
    .replace(/^[\s:.\-;,=|/\\]+/, '')  // strip leading junk
    .replace(/[\s:.\-;,=|/\\]+$/, '')   // strip trailing junk
    .trim()
}

/**
 * Parse KTP by splitting each line on the FIRST colon (or similar separator),
 * then matching the left side to known KTP field labels.
 */
function parseKTP(text: string): KTPData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const data: KTPData = {}

  // Build key-value pairs from lines that contain a separator
  const pairs: Array<{ label: string; value: string }> = []
  for (const line of lines) {
    // Split on first colon or similar separator
    const sepIndex = line.search(/\s*[:]\s*/)
    if (sepIndex > 0) {
      const label = line.substring(0, sepIndex).trim()
      const value = clean(line.substring(sepIndex + 1))
      if (label && value) pairs.push({ label, value })
    }
  }

  // Match pairs to KTP fields
  for (const { label, value } of pairs) {
    const l = label.toLowerCase().replace(/[^a-z]/g, '')

    if (/^provinsi/.test(l)) data.provinsi = value
    else if (/^(kab|kota)/.test(l)) data.kabupaten = value
    else if (/^nik$/.test(l)) data.nik = value
    else if (/^nama$/.test(l)) data.nama = value
    else if (/^tempat/.test(l) || /^ttl/.test(l)) {
      const parts = value.split(/\s*,\s*/)
      if (parts.length >= 2) {
        data.tempatLahir = clean(parts[0])
        data.tanggalLahir = clean(parts.slice(1).join(','))
      } else {
        data.tempatLahir = value
      }
    }
    else if (/^jeniskelamin/.test(l) || /^kelamin/.test(l)) data.jenisKelamin = value
    else if (/^alamat/.test(l)) data.alamat = value
    else if (/^rt/.test(l) && /rw/.test(l)) data.rtRw = value
    else if (/^kel/.test(l) || /^desa/.test(l)) data.kelDesa = value
    else if (/^kecamatan/.test(l) || /^kec/.test(l)) data.kecamatan = value
    else if (/^agama/.test(l)) data.agama = value
    else if (/^status/.test(l)) {
      // Strip "Perkawinan" prefix if captured
      data.statusPerkawinan = value.replace(/^perkawinan\s*/i, '')
    }
    else if (/^pekerjaan/.test(l) || /^pekerja/.test(l)) data.pekerjaan = value
    else if (/^kewarganegaraan/.test(l) || /^warganegara/.test(l)) data.kewarganegaraan = value
    else if (/^berlaku/.test(l)) data.berlakuHingga = value
  }

  // NIK fallback: find 16-digit number anywhere in text
  if (!data.nik) {
    const nikMatch = text.match(/\b(\d{16})\b/)
    if (nikMatch) data.nik = nikMatch[1]
    else {
      const longNum = text.match(/(\d[\d\s.]{14,})/g)
      if (longNum) {
        for (const num of longNum) {
          const cleaned = num.replace(/[\s.]/g, '')
          if (cleaned.length === 16) { data.nik = cleaned; break }
          if (cleaned.length > 12) { data.nik = cleaned; break }
        }
      }
    }
  }

  // Nama fallback: longest uppercase line
  if (!data.nama) {
    const candidates = lines.filter(l =>
      l.length > 3 &&
      /^[A-Z\s'.,\-]+$/.test(l) &&
      !/^(PROVINSI|KAB|KOTA|NIK|NAMA|ALAMAT|AGAMA|ISLAM|KRISTEN|WNI|LAKI|PEREMPUAN|BELUM|KAWIN|SEUMUR|KARTU|TANDA|PENDUDUK)/i.test(l)
    )
    if (candidates.length > 0) data.nama = candidates.sort((a, b) => b.length - a.length)[0]
  }

  // Jenis Kelamin fallback
  if (!data.jenisKelamin) {
    if (/laki[\s\-]*laki/i.test(text)) data.jenisKelamin = 'LAKI-LAKI'
    else if (/perempuan/i.test(text)) data.jenisKelamin = 'PEREMPUAN'
  }
  if (data.jenisKelamin) {
    const jk = data.jenisKelamin.toUpperCase()
    if (jk.includes('LAKI')) data.jenisKelamin = 'LAKI-LAKI'
    else if (jk.includes('PEREM')) data.jenisKelamin = 'PEREMPUAN'
  }

  // RT/RW fallback
  if (!data.rtRw) {
    const rtMatch = text.match(/\b(\d{3}\s*[/.]\s*\d{3})\b/)
    if (rtMatch) data.rtRw = rtMatch[1].replace(/\s/g, '')
  }

  // Agama fallback
  if (!data.agama) {
    const agamaList = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']
    for (const a of agamaList) {
      if (new RegExp(`\\b${a}\\b`, 'i').test(text)) { data.agama = a; break }
    }
  }

  // Status fallback
  if (!data.statusPerkawinan) {
    if (/belum\s*kawin/i.test(text)) data.statusPerkawinan = 'BELUM KAWIN'
    else if (/\bkawin\b/i.test(text)) data.statusPerkawinan = 'KAWIN'
    else if (/cerai/i.test(text)) data.statusPerkawinan = 'CERAI'
  }

  // Kewarganegaraan fallback
  if (!data.kewarganegaraan) {
    if (/\bWNI\b/.test(text)) data.kewarganegaraan = 'WNI'
    else if (/\bWNA\b/.test(text)) data.kewarganegaraan = 'WNA'
  }

  // Berlaku fallback
  if (!data.berlakuHingga) {
    if (/seumur\s*hidup/i.test(text)) data.berlakuHingga = 'SEUMUR HIDUP'
  }
  if (data.berlakuHingga && /seumur/i.test(data.berlakuHingga)) {
    data.berlakuHingga = 'SEUMUR HIDUP'
  }

  // Tanggal lahir fallback
  if (!data.tanggalLahir) {
    const dateMatch = text.match(/(\d{2}[-/.]\d{2}[-/.]\d{4})/)
    if (dateMatch) data.tanggalLahir = dateMatch[1]
  }

  // Clean all values one more time (remove any stray colons)
  const keys = Object.keys(data) as (keyof KTPData)[]
  for (const key of keys) {
    if (data[key] && typeof data[key] === 'string') {
      (data as any)[key] = clean(data[key] as string)
    }
  }

  return data
}
