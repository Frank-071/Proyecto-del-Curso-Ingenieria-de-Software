'use client'

import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Map as MapIcon, Layers, Compass, ZoomIn } from 'lucide-react'
import L from 'leaflet'
import type { LocalDisplay } from '@/lib/types/entities/local'

// Fix default icon paths using CDN so markers render correctly in production builds
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
// Assign default icon to Leaflet's Marker prototype. Use a typed assertion instead of `any`.
;(L.Marker.prototype as unknown as { options: { icon?: L.Icon } }).options.icon = DefaultIcon

interface Props {
  items: LocalDisplay[]
  selectedId?: number | null
  onSelect?: (id: number) => void
  height?: string
}

export default function LocalMapView({ items, selectedId = null, onSelect, height = '420px' }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  // store the underlying Leaflet Marker instances by id
  const markerRefs = useRef<Map<number, L.Marker>>(new Map())
  const [mapReady, setMapReady] = useState(false)
  const [tileUrl, setTileUrl] = useState<string>('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
  const [tileAttribution, setTileAttribution] = useState<string>('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors')
  const geoLayerRef = useRef<L.LayerGroup | null>(null)
  const highlightRef = useRef<L.Circle | null>(null)
  const [geolocating, setGeolocating] = useState(false)

  // helper child component to capture the Leaflet map instance with correct typing
  function MapSetter({ onCreated }: { onCreated: (m: L.Map) => void }) {
    const map = useMap()
    useEffect(() => {
      onCreated(map)
      setMapReady(true)
    }, [map, onCreated])
    return null
  }

  // Only markers that have valid coordinates
  const markers = useMemo(() => {
    return items
      .filter((i) => i.latitud !== undefined && i.latitud !== null && i.longitud !== undefined && i.longitud !== null)
      .map((i) => ({ id: i.id, nombre: i.nombre, direccion: i.direccion, lat: Number(i.latitud), lng: Number(i.longitud) }))
  }, [items])

  // Fit bounds when markers change
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    if (!map) return
    if (markers.length === 0) return

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
    try {
      map.fitBounds(bounds, {
        padding: [40, 40]
      })
    } catch (e) {}
  }, [markers])

  // When selectedId changes, fly to marker and open popup
  useEffect(() => {
    if (selectedId == null || !mapReady) return
    const entry = markers.find((m) => m.id === selectedId)
    if (!entry || !mapRef.current) return

    try {
      mapRef.current.flyTo([entry.lat, entry.lng], 16, { duration: 0.5 })
    } catch (e) {}

    const mr = markerRefs.current.get(entry.id)
    if (mr) {
      try {
        mr.openPopup()
      } catch (e) {}
    }
  }, [selectedId, markers, mapReady])

  const fitAll = useCallback(() => {
    if (!mapReady || !mapRef.current || markers.length === 0) return
    try {
      mapRef.current.invalidateSize()
    } catch (e) {}
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
    try {
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    } catch (e) {}
  }, [markers, mapReady])

  const centerOnSelected = useCallback(() => {
    if (!mapReady || !mapRef.current || selectedId == null) return
    const entry = markers.find((m) => m.id === selectedId)
    if (!entry) return
    try {
      mapRef.current.invalidateSize()
      mapRef.current.fitBounds(L.latLngBounds([[entry.lat, entry.lng]]), { maxZoom: 16 })
      mapRef.current.flyTo([entry.lat, entry.lng], 16, { duration: 0.5 })
    } catch (e) {}
    const mr = markerRefs.current.get(entry.id)
    if (mr) {
      try { mr.openPopup() } catch (e) {}
    }
    try {
      if (highlightRef.current) {
        highlightRef.current.remove()
        highlightRef.current = null
      }
      const h = L.circle([entry.lat, entry.lng], { radius: 30, color: '#fde68a', weight: 2, fill: false })
      h.addTo(mapRef.current)
      highlightRef.current = h
      setTimeout(() => { try { highlightRef.current?.remove(); highlightRef.current = null } catch (e) {} }, 1200)
    } catch (e) {}
  }, [selectedId, markers, mapReady])

  const doGeolocate = useCallback(() => {
    if (!mapReady || !mapRef.current || !('geolocation' in navigator)) return
    setGeolocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const accuracy = pos.coords.accuracy || 0
        try {
          if (geoLayerRef.current) {
            geoLayerRef.current.clearLayers()
          } else if (mapRef.current) {
            geoLayerRef.current = L.layerGroup().addTo(mapRef.current)
          }

          const marker = L.circleMarker([lat, lng], { radius: 8, color: '#2563eb', fillColor: '#2563eb', fillOpacity: 1 })
          const circle = L.circle([lat, lng], { radius: accuracy, color: '#93c5fd', fillColor: '#bfdbfe', fillOpacity: 0.2 })
          geoLayerRef.current?.addLayer(circle)
          geoLayerRef.current?.addLayer(marker)
          mapRef.current?.flyTo([lat, lng], 14, { duration: 0.6 })
        } catch (e) {}
        setGeolocating(false)
      },
      () => {
        setGeolocating(false)
      }
    )
  }, [mapReady])

  const toggleBasemap = useCallback(() => {
    if (tileUrl.includes('openstreetmap')) {
      setTileUrl('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
      setTileAttribution('Tiles &copy; Esri')
    } else {
      setTileUrl('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      setTileAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors')
    }
  }, [tileUrl])

  // default center (fallback to Lima) if no markers
  const defaultCenter: [number, number] = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [-12.046374, -77.042793]

  // memoize handlers so they don't change on every render
  const handleMarkerClick = useCallback(
    (id: number) => {
      if (onSelect) onSelect(id)
    },
    [onSelect]
  )

  const hasMarkers = markers.length > 0
  const hasSelected = selectedId != null
  const canGeolocate = typeof navigator !== 'undefined' && 'geolocation' in navigator

  return (
    <div style={{ width: '100%', height }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
        <MapSetter onCreated={(m) => (mapRef.current = m)} />
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', gap: 8 }}>
          <button
            title="Ajustar vista a todos los locales"
            aria-label="Ajustar vista a todos los locales"
            onClick={fitAll}
            disabled={!hasMarkers}
            style={{
              background: 'white',
              borderRadius: 6,
              padding: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              cursor: hasMarkers ? 'pointer' : 'not-allowed',
              opacity: hasMarkers ? 1 : 0.5
            }}
          >
            <ZoomIn size={16} />
          </button>

          <button
            title="Centrar en local seleccionado"
            aria-label="Centrar en local seleccionado"
            onClick={centerOnSelected}
            disabled={!hasSelected}
            style={{
              background: 'white',
              borderRadius: 6,
              padding: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              cursor: hasSelected ? 'pointer' : 'not-allowed',
              opacity: hasSelected ? 1 : 0.5
            }}
          >
            <MapIcon size={16} />
          </button>

          <button
            title={geolocating ? 'Buscando ubicación...' : 'Mi ubicación'}
            aria-label="Mi ubicación"
            onClick={doGeolocate}
            disabled={!canGeolocate || geolocating}
            style={{
              background: 'white',
              borderRadius: 6,
              padding: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              cursor: canGeolocate && !geolocating ? 'pointer' : 'not-allowed',
              opacity: canGeolocate && !geolocating ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {geolocating ? (
              <svg width="16" height="16" viewBox="0 0 50 50" aria-hidden>
                <circle cx="25" cy="25" r="20" fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            ) : (
              <Compass size={16} />
            )}
          </button>

          <button
            title="Cambiar capa"
            aria-label="Cambiar capa"
            onClick={toggleBasemap}
            style={{
              background: 'white',
              borderRadius: 6,
              padding: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              cursor: 'pointer'
            }}
          >
            <Layers size={16} />
          </button>
        </div>

        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            eventHandlers={{
              click: () => handleMarkerClick(m.id)
            }}
            ref={(r) => {
              // react-leaflet passes either a Leaflet Marker or an object with `.leafletElement`
              type RefUnion = L.Marker | { leafletElement?: L.Marker } | null
              const refVal = r as RefUnion

              if (!refVal) {
                markerRefs.current.delete(m.id)
                return
              }

              let leaf: L.Marker | undefined
              if ('leafletElement' in refVal && refVal.leafletElement) {
                leaf = refVal.leafletElement
              } else {
                // assume it's already a Leaflet Marker
                leaf = refVal as L.Marker
              }

              if (leaf) markerRefs.current.set(m.id, leaf)
            }}
          >
            <Popup>
              <div style={{ fontWeight: 600 }}>{m.nombre}</div>
              {m.direccion && <div style={{ fontSize: 13 }}>{m.direccion}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
