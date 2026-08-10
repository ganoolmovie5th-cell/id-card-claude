import * as SecureStore from 'expo-secure-store'
import type { IDCard } from '../types/card'

const CARDS_KEY = 'id_cards_data'
const PIN_KEY = 'id_cards_pin'

export async function getPin(): Promise<string | null> {
  return SecureStore.getItemAsync(PIN_KEY)
}

export async function setPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin)
}

export async function getCards(): Promise<IDCard[]> {
  const raw = await SecureStore.getItemAsync(CARDS_KEY)
  if (!raw) return []
  return JSON.parse(raw)
}

export async function saveCards(cards: IDCard[]): Promise<void> {
  await SecureStore.setItemAsync(CARDS_KEY, JSON.stringify(cards))
}

export async function addCard(card: IDCard): Promise<void> {
  const cards = await getCards()
  cards.push(card)
  await saveCards(cards)
}

export async function deleteCard(id: string): Promise<void> {
  const cards = await getCards()
  await saveCards(cards.filter(c => c.id !== id))
}
