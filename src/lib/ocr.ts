import type { KTPData } from '../types/card'

const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = 'helloworld' // free tier public key

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
 * Extract value after a label, stripping the colon/dot separator.
 * Handles formats like:
 *   "Nama : AGUS HIDAYATULLAH"
 *   "Nama: AGUS"
 *   "Nama AGUS"
 */
function extractValue(line: string, label: RegExp): string | null {
  const match = line.match(label)
  if (!match) return null
  // Get everything after the matched label
  const afterLabel = line.substring(match.index! + match[0].length)
  // Strip leading colon, dot, spaces
  const cleaned = afterLabel.replace(/^[\s:.\-]+/, '').trim()
  return cleaned || null
}

/**
 * Find a field value by scanning all lines for the label pattern.
 * Returns the cleaned value (no colon prefix).
 */
function findValue(lines: string[], label: RegExp): string | undefined {
  for (const line of lines) {
    const val = extractValue(line, label)
    if (val && val.length > 1) return val
  }
  return undefined
}

/**
 * Find value on the NEXT line after a label (for cases where value is on separate line)
 */
function findValueNextLine(lines: string[], label: RegExp): string | undefined {
  for (let i = 0; i < lines.length - 1; i++) {
    if (label.test(lines[i])) {
      const next = lines[i + 1].trim()
      if (next && !/^(nik|nama|tempat|alamat|agama|status|rt|jenis|pekerjaan|kewarga|berlaku|kecamatan|kel|gol)/i.test(next)) {
        return next
      }
    }
  }
  return undefined
}

function parseKTP(text: string): KTPData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const data: KTPData = {}

  // PROVINSI — first line often "PROVINSI ..." or just province name at top
  data.provinsi = findValue(lines, /provinsi/i)
  if (!data.provinsi && lines.length > 0) {
    const first = lines[0]
    if (!/nik|nama|kartu/i.test(first)) data.provinsi = first
  }

  // KAB/KOTA
  data.kabupaten = findValue(lines, /(?:kab(?:upaten)?|kota)/i)
  if (!data.kabupaten && lines.length > 1) {
    const second = lines[1]
    if (!/nik|nama|kartu|provinsi/i.test(second)) data.kabupaten = second
  }

  // NIK — exactly 16 digits
  const nikMatch = text.match(/\b(\d{16})\b/)
  if (nikMatch) data.nik = nikMatch[1]
  if (!data.nik) {
    // Try finding long digit sequences and clean them
    const longNum = text.match(/(\d[\d\s.]{14,})/g)
    if (longNum) {
      for (const num of longNum) {
        const cleaned = num.replace(/[\s.]/g, '')
        if (cleaned.length === 16) { data.nik = cleaned; break }
      }
    }
  }

  // Nama — value after "Nama" label, NOT including the colon
  data.nama = findValue(lines, /\bNama\b/i)
  if (!data.nama) data.nama = findValueNextLine(lines, /\bNama\b/i)
  // Fallback: longest uppercase-only line that's not a known label
  if (!data.nama) {
    const candidates = lines.filter(l =>
      l.length > 3 &&
      /^[A-Z\s'.,\-]+$/.test(l) &&
      !/^(PROVINSI|KAB|KOTA|NIK|NAMA|ALAMAT|AGAMA|ISLAM|KRISTEN|WNI|LAKI|PEREMPUAN|BELUM|KAWIN|SEUMUR)/i.test(l)
    )
    if (candidates.length > 0) data.nama = candidates.sort((a, b) => b.length - a.length)[0]
  }

  // Tempat/Tgl Lahir
  const ttl = findValue(lines, /tempat.*?(?:tgl)?.*?lahir/i) || findValue(lines, /\bttl\b/i)
  if (ttl) {
    // Format: "JAKARTA, 01-01-1990" or "JAKARTA,01-01-1990"
    const parts = ttl.split(/\s*,\s*/)
    if (parts.length >= 2) {
      data.tempatLahir = parts[0].trim()
      data.tanggalLahir = parts.slice(1).join(',').trim()
    } else {
      data.tempatLahir = ttl
    }
  }
  // Standalone date fallback
  if (!data.tanggalLahir) {
    const dateMatch = text.match(/(\d{2}[-/.]\d{2}[-/.]\d{4})/)
    if (dateMatch) data.tanggalLahir = dateMatch[1]
  }

  // Jenis Kelamin
  data.jenisKelamin = findValue(lines, /jenis\s*kelamin/i)
  if (!data.jenisKelamin) {
    if (/laki[\s\-]*laki/i.test(text)) data.jenisKelamin = 'LAKI-LAKI'
    else if (/perempuan/i.test(text)) data.jenisKelamin = 'PEREMPUAN'
  }
  if (data.jenisKelamin) {
    const jk = data.jenisKelamin.toUpperCase()
    if (jk.includes('LAKI')) data.jenisKelamin = 'LAKI-LAKI'
    else if (jk.includes('PEREM')) data.jenisKelamin = 'PEREMPUAN'
  }

  // Gol. Darah — extract but DON'T put in alamat
  // On KTP, "Gol. Darah" is on same line as Jenis Kelamin
  // We just need to make sure alamat doesn't capture it

  // Alamat — specifically after "Alamat" label, NOT "Gol. Darah"
  data.alamat = findValue(lines, /^Alamat\b/i)
  if (!data.alamat) data.alamat = findValueNextLine(lines, /^Alamat$/i)
  // Clean: remove gol darah if accidentally captured
  if (data.alamat) {
    data.alamat = data.alamat.replace(/gol\.?\s*darah\s*[:.]?\s*\S*/gi, '').trim()
  }

  // RT/RW
  data.rtRw = findValue(lines, /\bRT\s*[/.]\s*RW\b/i)
  if (!data.rtRw) {
    // Look for pattern like "003/002" or "003 / 002"
    const rtMatch = text.match(/\b(\d{3}\s*[/.]\s*\d{3})\b/)
    if (rtMatch) data.rtRw = rtMatch[1].replace(/\s/g, '')
  }

  // Kel/Desa — specifically "Kel/Desa" label
  data.kelDesa = findValue(lines, /kel(?:urahan)?\s*[/.]\s*desa/i)
  if (!data.kelDesa) data.kelDesa = findValue(lines, /\bdesa\b/i)
  if (!data.kelDesa) data.kelDesa = findValue(lines, /\bkelurahan\b/i)

  // Kecamatan
  data.kecamatan = findValue(lines, /kecamatan/i)

  // Agama
  data.agama = findValue(lines, /agama/i)
  if (!data.agama) {
    const agamaList = ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']
    for (const a of agamaList) {
      // Match standalone word
      const re = new RegExp(`\\b${a}\\b`, 'i')
      if (re.test(text)) { data.agama = a; break }
    }
  }

  // Status Perkawinan
  data.statusPerkawinan = findValue(lines, /status\s*(?:perkawinan)?/i)
  if (!data.statusPerkawinan) {
    if (/belum\s*kawin/i.test(text)) data.statusPerkawinan = 'BELUM KAWIN'
    else if (/\bkawin\b/i.test(text)) data.statusPerkawinan = 'KAWIN'
    else if (/cerai\s*hidup/i.test(text)) data.statusPerkawinan = 'CERAI HIDUP'
    else if (/cerai\s*mati/i.test(text)) data.statusPerkawinan = 'CERAI MATI'
  }
  // Clean: status might capture "Perkawinan" prefix
  if (data.statusPerkawinan) {
    data.statusPerkawinan = data.statusPerkawinan.replace(/^perkawinan\s*[:.]?\s*/i, '').trim()
  }

  // Pekerjaan — multiple patterns
  data.pekerjaan = findValue(lines, /pekerjaan/i)
  if (!data.pekerjaan) data.pekerjaan = findValueNextLine(lines, /pekerjaan/i)
  // Common OCR misreads
  if (!data.pekerjaan) {
    data.pekerjaan = findValue(lines, /pekerja[ao]n/i) // OCR might misread 'a' as 'o'
  }

  // Kewarganegaraan
  data.kewarganegaraan = findValue(lines, /kewarganegaraan/i)
  if (!data.kewarganegaraan) data.kewarganegaraan = findValue(lines, /warga\s*negara/i)
  if (!data.kewarganegaraan && /\bWNI\b/.test(text)) data.kewarganegaraan = 'WNI'
  if (!data.kewarganegaraan && /\bWNA\b/.test(text)) data.kewarganegaraan = 'WNA'

  // Berlaku Hingga — multiple patterns
  data.berlakuHingga = findValue(lines, /berlaku\s*(?:hingga|s[/.]?d[/.]?)/i)
  if (!data.berlakuHingga) data.berlakuHingga = findValueNextLine(lines, /berlaku/i)
  if (!data.berlakuHingga && /seumur\s*hidup/i.test(text)) data.berlakuHingga = 'SEUMUR HIDUP'
  // KTP-el is always "SEUMUR HIDUP"
  if (data.berlakuHingga) {
    if (/seumur/i.test(data.berlakuHingga)) data.berlakuHingga = 'SEUMUR HIDUP'
  }

  return data
}
