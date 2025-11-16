import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface RoomCardProps {
  name: string
  description: string
  members: number
  topic: string
  privacy: 'public' | 'private' | 'invite'
}

export function RoomCard({ name, description, members, topic, privacy }: RoomCardProps) {
  const privacyColors = {
    public: 'bg-green-500/20 text-green-700 dark:text-green-400',
    private: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
    invite: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  }

  const privacyLabels = {
    public: 'Public',
    private: 'Private',
    invite: 'Invite Only',
  }

  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-lg">{name}</h4>
          <p className="text-sm text-foreground/60">{topic}</p>
        </div>
        <span className={`text-xs font-semibold rounded-full px-3 py-1 ${privacyColors[privacy]}`}>
          {privacyLabels[privacy]}
        </span>
      </div>
      <p className="text-sm text-foreground/70 mb-4 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/50">{members} members</span>
        <Button size="sm" className="bg-primary hover:bg-primary/90 rounded-full">
          Join
        </Button>
      </div>
    </Card>
  )
}
