import { notFound } from 'next/navigation'
import { getDataStream } from './actions'
import { StreamDetailsClient } from './StreamDetailsClient'

interface Props {
  params: Promise<{ streamId: string }>
}

export default async function StreamDetailsPage({ params }: Props) {
  const { streamId } = await params
  const streamIdNum = parseInt(streamId)

  if (isNaN(streamIdNum)) {
    notFound()
  }

  const stream = await getDataStream(streamIdNum)

  if (!stream) {
    notFound()
  }

  return <StreamDetailsClient stream={stream} />
}
