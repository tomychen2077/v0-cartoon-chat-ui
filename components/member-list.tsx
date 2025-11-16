import { Card } from '@/components/ui/card'
import { X, Crown, Shield } from 'lucide-react'

interface Member {
  id: number
  name: string
  avatar: string
  status: 'online' | 'away' | 'offline'
  role?: 'admin' | 'moderator'
}

interface MemberListProps {
  members: Member[]
  onClose: () => void
}

export function MemberList({ members, onClose }: MemberListProps) {
  return (
    <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto shadow-xl z-50">
      <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
        <h3 className="font-bold">{members.length} Members</h3>
        <button onClick={onClose} className="hover:bg-accent/20 p-1 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 p-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-2 hover:bg-accent/10 rounded-lg transition-colors">
            <div className="relative flex-shrink-0">
              <img
                src={member.avatar || "/placeholder.svg"}
                alt={member.name}
                className="w-8 h-8 rounded-full"
              />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                member.status === 'online' ? 'bg-green-500' :
                member.status === 'away' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-medium truncate">{member.name}</p>
                {member.role === 'admin' && <Crown className="w-3 h-3 text-accent flex-shrink-0" />}
                {member.role === 'moderator' && <Shield className="w-3 h-3 text-primary flex-shrink-0" />}
              </div>
              <p className="text-xs text-foreground/50">{member.status}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
