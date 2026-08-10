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
        <Text style={s.icon}>🔒</Text>
        <Text style={s.title}>
          {step === 'enter' ? 'Masukkan PIN' : step === 'create' ? 'Buat PIN Baru' : 'Konfirmasi PIN'}
        </Text>
        <TextInput
          style={s.input}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPinValue}
          placeholder="••••••"
          placeholderTextColor="#ccc"
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
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center' },
  inner: { alignItems: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 24 },
  input: { width: 200, fontSize: 28, textAlign: 'center', borderBottomWidth: 2, borderColor: '#e5e5e5', paddingVertical: 12, letterSpacing: 8, color: '#1a1a1a' },
  error: { color: '#ef4444', marginTop: 8, fontSize: 14 },
  btn: { marginTop: 32, backgroundColor: '#1E40AF', paddingHorizontal: 48, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
