import { AuthGate } from '@/auth-gate'
import { BoltStyleChat } from '@/components/ui/bolt-style-chat'

export default function DemoOne() {
  return <AuthGate><BoltStyleChat /></AuthGate>
}
