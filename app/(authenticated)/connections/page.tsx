import { getSystemsNetworkData, getConnectionsTableData } from './actions'
import ConnectionsList from './ConnectionsList'
import DatabaseErrorScreen from '@/components/DatabaseErrorScreen'

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  try {
    // Await searchParams в Next.js 15+
    const params = await searchParams
    
    const [networkData, connectionsData] = await Promise.all([
      getSystemsNetworkData(),
      getConnectionsTableData()
    ])

    return (
      <div className="space-y-6">
        <ConnectionsList 
          networkData={networkData} 
          connectionsData={connectionsData}
          initialFilterSystemId={params.filter ? parseInt(params.filter) : undefined}
        />
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