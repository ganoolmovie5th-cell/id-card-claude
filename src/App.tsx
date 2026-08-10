import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import LockScreen from './screens/LockScreen'
import HomeScreen from './screens/HomeScreen'
import AddCardScreen from './screens/AddCardScreen'
import DetailScreen from './screens/DetailScreen'
import { getPin } from './lib/storage'

const Stack = createNativeStackNavigator()

export default function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [hasPin, setHasPin] = useState<boolean | null>(null)

  useEffect(() => {
    getPin().then(pin => setHasPin(!!pin))
  }, [])

  if (hasPin === null) return null

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!unlocked ? (
            <Stack.Screen name="Lock">
              {props => <LockScreen {...props} hasPin={hasPin} onUnlock={() => setUnlocked(true)} onPinSet={() => { setHasPin(true); setUnlocked(true) }} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="AddCard" component={AddCardScreen} />
              <Stack.Screen name="Detail" component={DetailScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
