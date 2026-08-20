# ID Card

Aplikasi mobile untuk menyimpan dan mengelola kartu identitas digital. Scan, simpan, dan akses kartu identitas (KTP, SIM, BPJS, dll) langsung dari smartphone.

**Tech Stack:** React Native · Expo · TypeScript · React Navigation

## Features

- Scan kartu identitas menggunakan kamera
- Simpan multiple kartu (KTP, SIM, BPJS, Passport, dll)
- Tampilan visual kartu yang mirip aslinya
- Penyimpanan aman lokal (expo-secure-store)
- Crop dan manipulasi gambar
- Navigasi antar screen (home, add, detail)

## Getting Started

```bash
npm install
npx expo start
```

Scan QR code dengan Expo Go di device, atau jalankan di simulator.

## Project Structure

```
src/
  App.tsx             → Root app dengan navigation
  screens/
    HomeScreen.tsx    → Daftar kartu tersimpan
  components/
    CardVisual.tsx    → Komponen visual kartu
  lib/
    storage.ts       → CRUD operations (secure store)
  types/
    card.ts          → TypeScript types untuk ID card
```

## Dependencies

- `expo-camera` — scan kartu
- `expo-image-picker` — pilih dari gallery
- `expo-image-manipulator` — crop/resize
- `expo-secure-store` — encrypted local storage
- `@react-navigation/native` — screen navigation

## License

MIT
