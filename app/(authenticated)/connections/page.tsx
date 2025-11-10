import { getSystemsNetworkData, getConnectionsTableData } from '@/lib/actions/network'
import ConnectionsList from './ConnectionsList'
import DatabaseErrorScreen from '@/components/DatabaseErrorScreen'

export default async function ConnectionsPage() {
  try {
    const [networkData, connectionsData] = await Promise.all([
      getSystemsNetworkData(),
      getConnectionsTableData()
    ])

    return (
      <div className="space-y-6">
        <ConnectionsList networkData={networkData} connectionsData={connectionsData} />
      </div>
    )
  } catch (error: any) {
    if (error.message?.includes("Can't reach database server") || 
        error.code === 'P1001' || 
        error.name === 'PrismaClientInitializationError') {
      return <DatabaseErrorScreen />
    }
    throw error
  }
}