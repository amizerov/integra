import { getSystemsNetworkData, getConnectionsTableData } from '@/lib/actions/network'
import ConnectionsList from './ConnectionsList'

export default async function ConnectionsPage() {
  const [networkData, connectionsData] = await Promise.all([
    getSystemsNetworkData(),
    getConnectionsTableData()
  ])

  return (
    <div className="space-y-6">
      <ConnectionsList networkData={networkData} connectionsData={connectionsData} />
    </div>
  )
}