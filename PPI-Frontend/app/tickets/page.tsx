import { Suspense } from 'react'
import { TicketsPageWrapper } from './tickets-page-wrapper'
import { PageSpinner } from '@/components/ui/page-spinner'

export default function TicketsPage() {
  return (
    <Suspense fallback={<PageSpinner message="Cargando tus tickets..." />}>
      <TicketsPageWrapper />
    </Suspense>
  )
}