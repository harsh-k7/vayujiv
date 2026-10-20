import React, { useEffect, useRef } from 'react';
import { MapPin, Navigation, AlertOctagon } from 'lucide-react';
import { Soldier, DroneState, BaseStation, NoFlyZone } from '../types';

interface TacticalMapProps {
  soldiers: Soldier[];
  drone: DroneState | null;
  baseStation: BaseStation | null;
  noFlyZones: NoFlyZone[];
  selectedSoldierId: string | null;
  onSelectSoldier: (id: string) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  soldiers,
  drone,
  baseStation,
  noFlyZones,
  selectedSoldierId,
  onSelectSoldier
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const baseMarkerRef = useRef<any>(null);
  const noFlyLayersRef = useRef<any[]>([]);
  const droneMarkerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const lastCenteredOnRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!leafletMapRef.current) {
      const initialCenter = soldiers.length > 0 && soldiers[0].lat
        ? [soldiers[0].lat, soldiers[0].lng]
        : [28.7065, 77.6802];

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    if (!map) return;

    // Base Station Marker update
    if (baseStation) {
      const baseIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: '<div style="background:#0284c7;color:#fff;border-radius:4px;padding:3px 6px;font-family:monospace;font-size:10px;font-weight:bold;border:1px solid #38bdf8;box-shadow:0 0 10px #0284c7;white-space:nowrap;">GATEWAY BASE</div>',
        iconSize: [85, 24]
      });

      if (baseMarkerRef.current) {
        baseMarkerRef.current.setLatLng([baseStation.lat, baseStation.lng]);
      } else {
        baseMarkerRef.current = L.marker([baseStation.lat, baseStation.lng], { icon: baseIcon }).addTo(map);
      }
    }

    // No Fly Zones (red dashed circles)
    noFlyLayersRef.current.forEach(layer => map.removeLayer(layer));
    noFlyLayersRef.current = [];
    noFlyZones.forEach(nfz => {
      const circle = L.circle(nfz.center, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        radius: nfz.radius,
        dashArray: '4, 4'
      }).addTo(map);
      noFlyLayersRef.current.push(circle);
    });

    // Update Soldiers
    soldiers.forEach(soldier => {
      const priorityColor =
        soldier.triage.priority === 'RED' ? '#ef4444' :
        soldier.triage.priority === 'YELLOW' ? '#f59e0b' : '#10b981';

      const isSelected = soldier.id === selectedSoldierId;
      const html = `<div style="background:${priorityColor};color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:10px;font-weight:bold;border:2px solid ${isSelected ? '#38bdf8' : '#ffffff'};box-shadow: 0 0 12px ${priorityColor};cursor:pointer;">${soldier.id}</div>`;

      const icon = L.divIcon({ className: 'custom-marker-icon', html, iconSize: [26, 26] });

      if (markersRef.current[soldier.id]) {
        markersRef.current[soldier.id].setLatLng([soldier.lat, soldier.lng]);
        markersRef.current[soldier.id].setIcon(icon);
      } else {
        const marker = L.marker([soldier.lat, soldier.lng], { icon }).addTo(map);
        marker.on('click', () => onSelectSoldier(soldier.id));
        markersRef.current[soldier.id] = marker;
      }
    });

    // Auto-center on selected soldier or when new hardware GPS is received
    const targetSoldier = soldiers.find(s => s.id === selectedSoldierId) || soldiers[0];
    if (targetSoldier && targetSoldier.lat) {
      const coordKey = `${targetSoldier.id}-${targetSoldier.lat.toFixed(4)}-${targetSoldier.lng.toFixed(4)}`;
      if (lastCenteredOnRef.current !== coordKey) {
        lastCenteredOnRef.current = coordKey;
        map.panTo([targetSoldier.lat, targetSoldier.lng], { animate: true });
      }
    }

    // Update Drone Marker & Flight Path
    if (drone) {
      const isAirborne = drone.status !== 'IDLE';
      const droneHtml = `<div style="background:#082f49;color:#38bdf8;border-radius:6px;padding:3px 7px;border:1px solid #38bdf8;box-shadow:0 0 14px #38bdf8;font-family:monospace;font-size:10px;font-weight:bold;white-space:nowrap;display:flex;align-items:center;gap:4px;"><span>UAV-01</span> <span style="color:#94a3b8;">${drone.altitude}m</span></div>`;
      const droneIcon = L.divIcon({ className: 'custom-marker-icon', html: droneHtml, iconSize: [95, 26] });

      if (droneMarkerRef.current) {
        droneMarkerRef.current.setLatLng([drone.currentLat, drone.currentLng]);
        droneMarkerRef.current.setIcon(droneIcon);
      } else {
        droneMarkerRef.current = L.marker([drone.currentLat, drone.currentLng], { icon: droneIcon }).addTo(map);
      }

      // Waypoints Path (A* trajectory)
      if (drone.waypoints && drone.waypoints.length > 0 && isAirborne) {
        const latlngs = drone.waypoints.map(wp => [wp.lat, wp.lng]);
        if (polylineRef.current) {
          polylineRef.current.setLatLngs(latlngs);
        } else {
          polylineRef.current = L.polyline(latlngs, {
            color: '#38bdf8',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85
          }).addTo(map);
        }
      } else if (!isAirborne && polylineRef.current) {
        map.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
    }
  }, [soldiers, drone, selectedSoldierId, baseStation, noFlyZones, onSelectSoldier]);

  const handleRecenter = () => {
    const map = leafletMapRef.current;
    if (!map) return;
    const target = soldiers.find(s => s.id === selectedSoldierId) || soldiers[0];
    if (target) {
      map.setView([target.lat, target.lng], 16);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
          <h2 style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8', margin: 0, fontFamily: 'var(--font-hud)' }}>
            TACTICAL RADAR & A* UAV PATHFINDING
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '10px', fontFamily: 'monospace' }}>
          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>● GREEN</span>
          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>● YELLOW</span>
          <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>● RED</span>
          <button
            onClick={handleRecenter}
            style={{
              background: '#0369a1',
              color: '#fff',
              border: '1px solid #38bdf8',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            FOCUS SOLDIER
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', flex: 1, minHeight: '340px', borderRadius: '6px' }} />
    </div>
  );
};
