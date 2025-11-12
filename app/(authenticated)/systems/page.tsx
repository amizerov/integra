import { getSystems } from './actions/createSystem'
import SystemsList from './SystemsList'

export default async function SystemsPage() {
  const { systems } = await getSystems()

  return (
    <div className="space-y-6">
      <SystemsList systems={systems} />
    </div>
  )
}
