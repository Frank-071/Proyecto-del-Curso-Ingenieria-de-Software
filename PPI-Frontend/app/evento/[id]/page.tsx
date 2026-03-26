"use client";
import { Header } from "@/components/header";
import { TicketSelector } from "@/app/evento/components/ticket-selector";
import { EventInfoSection } from "@/app/evento/components/event-info-section";
import { EventCancelledSection } from "@/app/evento/components/event-cancelled-section";
import { useEventoOrganizadorContacto, useEventoPorId } from "@/lib/hooks/eventos";
import { PageSpinner } from "@/components/ui/page-spinner";

export default function EventPage({ params }: { params: { id: string } }) {
  const eventoId = Number(params.id);
  const { evento, loading, error } = useEventoPorId(eventoId);
  const isCancelado = (evento?.estado || "").toLowerCase() === "cancelado";
  const {
    contacto,
    loading: loadingContacto,
    error: errorContacto,
    refetch: refetchContacto,
  } = useEventoOrganizadorContacto(eventoId, { enabled: isCancelado });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageSpinner message="Cargando evento..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        {error ? (
          <div className="text-center py-8 text-destructive">Error: {error}</div>
        ) : !evento ? (
          <div className="text-center py-8">No se encontró el evento</div>
        ) : isCancelado ? (
          <EventCancelledSection
            evento={evento}
            motivo={evento.motivo_cancelacion}
            contacto={contacto}
            loadingContacto={loadingContacto}
            errorContacto={errorContacto}
            onRetryContacto={refetchContacto}
          />
        ) : (
          <>
            <TicketSelector evento={evento} />
            <div className="bg-white border-t border-border mt-8 shadow-sm">
              <EventInfoSection evento={evento} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
