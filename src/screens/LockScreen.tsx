import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { getPin, setPin } from '../lib/storage'

interface Props {
  hasPin: boolean
  onUnlock: () => void
  onPinSet: () => void
}

export default function LockScreen({ hasPin, onUnlock, onPinSet }: Props) {
  const [pin, setPinValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [step, setStep] = useState<'enter' | 'create' | 'confirm'>(hasPin ? 'enter' : 'create')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (step === 'enter') {
      const stored = await getPin()
      if (pin === stored) onUnlock()
      else { setError('PIN salah'); setPinValue('') }
    } else if (step === 'create') {
      if (pin.length < 4) { setError('Minimal 4 digit'); return }
      setStep('confirm')
      setConfirm(pin)
      setPinValue('')
      setError('')
    } else if (step === 'confirm') {
      if (pin === confirm) { await setPin(pin); onPinSet() }
      else { setError('PIN tidak cocok'); setPinValue('') }
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.inner}>
        <View style={s.lockIcon}>
          <Text style={s.lockEmoji}>🔒</Text>
        </View>
        <Text style={s.title}>
          {step === 'enter' ? 'Masukkan PIN' : step === 'create' ? 'Buat PIN Baru' : 'Konfirmasi PIN'}
        </Text>
        <Text style={s.subtitle}>
          {step === 'enter' ? 'Akses kartu identitas Anda' : step === 'create' ? 'Minimal 4 digit' : 'Ketik ulang PIN Anda'}
        </Text>
        <TextInput
          style={s.input}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPinValue}
          placeholder="••••••"
          placeholderTextColor="#444"
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <TouchableOpacity style={s.btn} onPress={handleSubmit}>
          <Text style={s.btnText}>{step === 'enter' ? 'Unlock' : step === 'create' ? 'Lanjut' : 'Simpan'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center' },
  inner: { alignItems: 'center', padding: 32 },
  lockIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  lockEmoji: { fontSize: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 28 },
  input: { width: 200, fontSize: 28, textAlign: 'center', borderBottomWidth: 2, borderColor: '#2a2a2a', paddingVertical: 12, letterSpacing: 8, color: '#fff' },
  error: { color: '#ef4444', marginTop: 8, fontSize: 14 },
  btn: { marginTop: 32, backgroundColor: '#fff', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#0f0f0f', fontSize: 16, fontWeight: '600' },
})
