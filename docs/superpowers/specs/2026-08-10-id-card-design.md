# ID Card Wallet — Design Spec

## Purpose
Mobile app to store all personal ID cards (KTP, SIM, NPWP, BPJS, KRL, KK) in one secure place.

## Stack
- React Native + Expo SDK 54
- Test via Expo Go
- expo-secure-store (encrypted storage)
- Tesseract.js (OCR, future)

## Design
- Clean minimal, Apple Wallet-like
- White background, card-based UI
- Color-coded cards by type
- PIN lock (4-6 digit)

## Screens
1. **Lock** — PIN entry / create PIN
2. **Home** — List of saved cards (FlatList)
3. **Add Card** — Select type + input name/number (OCR later)
4. **Detail** — View card data + delete option

## Security
- PIN required on app open
- Data stored via expo-secure-store (encrypted by OS)
- No network calls — fully offline

## Card Types
- KTP (blue), SIM (purple), NPWP (green)
- BPJS Kesehatan (green), BPJS TK (orange)
- KRL/KMT (red), Kartu Keluarga (indigo)

## Future
- OCR via Tesseract.js (foto kartu → auto-fill)
- Biometric unlock (Face ID / fingerprint)
- Cloud backup (optional, encrypted)
