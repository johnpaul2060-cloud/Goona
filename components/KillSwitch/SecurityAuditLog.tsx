import React from 'react'
import { View, Text } from 'react-native'
import { Icons } from '../../shared/icons'
import GoonaIcon from '../ui/GoonaIcon'

export interface AuditEntry {
  id: string
  userName: string
  action: 'Access Revoked' | 'Access Suspended'
  date: string
  time: string
}

interface SecurityAuditLogProps {
  entries: AuditEntry[]
}

const actionColors: Record<AuditEntry['action'], { bg: string; text: string }> = {
  'Access Revoked': { bg: 'rgba(220,38,38,0.08)', text: '#DC2626' },
  'Access Suspended': { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B' },
}

export default function SecurityAuditLog({ entries }: SecurityAuditLogProps) {
  if (entries.length === 0) {
    return (
      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: '700', fontSize: 13, color: '#00695C', marginBottom: 12, paddingHorizontal: 4, letterSpacing: 0.3 }}>Audit Log</Text>
        <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2 }}>
          <GoonaIcon icon={Icons.shield} size={28} color="#CBD5E1" />
          <Text style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>No audit entries yet</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ marginTop: 24 }}>
      <Text style={{ fontWeight: '700', fontSize: 13, color: '#00695C', marginBottom: 12, paddingHorizontal: 4, letterSpacing: 0.3 }}>Audit Log</Text>
      <View style={{ backgroundColor: 'white', borderRadius: 22, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.03, shadowRadius: 20, elevation: 2, overflow: 'hidden' }}>
        {entries.map((entry, index) => {
          const ac = actionColors[entry.action]
          return (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: index < entries.length - 1 ? 1 : 0,
                borderBottomColor: '#F1F5F9',
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: ac.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <GoonaIcon icon={Icons.shield} size={14} color={ac.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#1B1B1B' }}>{entry.userName}</Text>
                <Text style={{ fontSize: 11, color: ac.text, fontWeight: '500', marginTop: 1 }}>{entry.action}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }}>{entry.date}</Text>
                <Text style={{ fontSize: 10, color: '#94A3B8' }}>{entry.time}</Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
