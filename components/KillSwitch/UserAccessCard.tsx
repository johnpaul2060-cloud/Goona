import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

export interface FarmUser {
  id: string
  name: string
  email: string
  role: 'Owner' | 'Manager' | 'Worker'
  status: 'Active' | 'Suspended' | 'Revoked'
}

interface UserAccessCardProps {
  user: FarmUser
  isOwner: boolean
  onViewDetails: (user: FarmUser) => void
  onSuspend: (user: FarmUser) => void
  onRevoke: (user: FarmUser) => void
}

const statusColors: Record<FarmUser['status'], { bg: string; text: string }> = {
  Active: { bg: 'rgba(22,163,74,0.08)', text: '#16A34A' },
  Suspended: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B' },
  Revoked: { bg: 'rgba(220,38,38,0.08)', text: '#DC2626' },
}

const roleColors: Record<FarmUser['role'], string> = {
  Owner: '#00695C',
  Manager: '#6366F1',
  Worker: '#64748B',
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function UserAccessCard({ user, isOwner, onViewDetails, onSuspend, onRevoke }: UserAccessCardProps) {
  const sc = statusColors[user.status]
  const rc = roleColors[user.role]

  const canAct = isOwner && user.role !== 'Owner'

  return (
    <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: rc, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{getInitials(user.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1B1B1B' }}>{user.name}</Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{user.email}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <View style={{ backgroundColor: `${rc}15`, paddingVertical: 1, paddingHorizontal: 8, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: rc }}>{user.role}</Text>
            </View>
            <View style={{ backgroundColor: sc.bg, paddingVertical: 1, paddingHorizontal: 8, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: sc.text }}>{user.status}</Text>
            </View>
          </View>
        </View>
      </View>

      {canAct && (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 10 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onViewDetails(user)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F8FAF7', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>View Details</Text>
          </TouchableOpacity>
          {user.status === 'Active' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onSuspend(user)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.08)', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#F59E0B' }}>Suspend</Text>
            </TouchableOpacity>
          )}
          {user.status !== 'Revoked' && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onRevoke(user)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(220,38,38,0.08)', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626' }}>Revoke</Text>
            </TouchableOpacity>
          )}
          {user.role === 'Owner' && (
            <View style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '500', color: '#94A3B8' }}>Owner protected</Text>
            </View>
          )}
        </View>
      )}

      {user.role === 'Owner' && isOwner && (
        <View style={{ marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(0,105,92,0.06)', borderRadius: 8 }}>
          <Text style={{ fontSize: 10, color: '#00695C', fontWeight: '500' }}>Owner accounts cannot be revoked.</Text>
        </View>
      )}
    </View>
  )
}
