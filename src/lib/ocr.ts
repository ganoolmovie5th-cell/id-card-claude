const OCR_API_URL = 'https://api.ocr.space/parse/image'
const OCR_API_KEY = 'helloworld' // free tier public key

export interface OCRResult {
  text: string
  name: string | null
  number: string | null
}

async function uriToBase64(uri: string): Promise<string> {
  const response = await fetch(uri)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip data:...;base64, prefix if present
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
  body.append('language', 'eng')
  body.append('isOverlayRequired', 'false')
  body.append('OCREngine', '2')

  const res = await fetch(OCR_API_URL, {
    method: 'POST',
    headers: { apikey: OCR_API_KEY },
    body,
  })

  const json = await res.json()
  const text = json?.ParsedResults?.[0]?.ParsedText || ''

  return {
    text,
    name: extractName(text),
    number: extractNumber(text),
  }
}

function extractNumber(text: string): string | null {
  // Find longest numeric sequence (NIK = 16 digits, SIM/NPWP = 15-16)
  const matches = text.match(/\d[\d\s.]{9,}/g)
  if (!matches) return null
  const cleaned = matches
    .map(m => m.replace(/[\s.]/g, ''))
    .sort((a, b) => b.length - a.length)
  return cleaned[0] || null
}

function extractName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Try "Nama" label pattern (common on Indonesian ID cards)
  for (const line of lines) {
    const match = line.match(/^nama\s*[:]\s*(.+)/i)
    if (match && match[1].trim().length > 2) return match[1].trim()
  }

  // Fallback: longest line that's mostly uppercase letters (likely a name)
  const candidates = lines.filter(l => l.length > 3 && /^[A-Z\s'.,\-]+$/.test(l))
  if (candidates.length > 0) {
    return candidates.sort((a, b) => b.length - a.length)[0]
  }

  return null
}
