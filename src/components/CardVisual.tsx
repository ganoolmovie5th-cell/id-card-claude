import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { CARD_LABELS, CARD_COLORS, type IDCard } from '../types/card'

interface Props {
  card: IDCard
  compact?: boolean
}

export default function CardVisual({ card, compact }: Props) {
  const color = CARD_COLORS[card.type]
  const height = compact ? 180 : 220

  return (
    <View style={[s.card, { backgroundColor: color, height }]}>
      {/* Top row: chip + type */}
      <View style={s.topRow}>
        <View style={s.chip} />
        <Text style={s.typeBadge}>{CARD_LABELS[card.type]}</Text>
      </View>

      {/* Number */}
      <Text style={[s.number, compact && { fontSize: 16 }]} numberOfLines={1}>
        {formatNumber(card.number)}
      </Text>

      {/* Bottom row: name + date */}
      <View style={s.bottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.label}>NAMA</Text>
          <Text style={s.name} numberOfLines={1}>{card.name}</Text>
        </View>
        <View>
          <Text style={s.label}>TANGGAL</Text>
          <Text style={s.name}>{new Date(card.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}</Text>
        </View>
      </View>

      {/* Decorative circle */}
      <View style={s.circle} />
    </View>
  )
}

function formatNumber(num: string): string {
  // Format as groups of 4 for readability
  return num.replace(/(.{4})/g, '$1 ').trim()
}

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    width: 36,
    height: 26,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  number: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -60,
  },
})
