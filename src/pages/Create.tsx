import React, { useEffect, useRef, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from "@ionic/react";
import mapboxgl from "mapbox-gl";
import { supabase } from "../utils/supabaseClient";
import "mapbox-gl/dist/mapbox-gl.css";
import "../css/Create.css";

mapboxgl.accessToken = (import.meta.env.VITE_MAPBOX_TOKEN as string) ||
  "pk.eyJ1Ijoib3BvcDI5IiwiYSI6ImNtZm8za3Q1NjAxcTEyanF4ZjZraWowdjEifQ.jNxrXsiX7Davmhjmp4ihWw";

type POI = {
  id?: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius_meters?: number;
  is_active?: boolean;
};

const Create: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [selected, setSelected] = useState<POI | null>(null);
  const mapLoadedRef = useRef(false);

  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [124.86808678286121, 8.360172178342996],
      zoom: 17,
    });
    mapRef.current = map;

    const onMapLoad = () => {
      mapLoadedRef.current = true;

      map.on("click", async (e) => {
        const lon = e.lngLat.lng;
        const lat = e.lngLat.lat;
        const name = prompt("Name for this AR point?") || "New POI";
        const radius = Number(prompt("Cue radius in meters?", "5") || 5);

        const { error } = await supabase.from("ar_pois").insert([
          { name, description: "", latitude: lat, longitude: lon, radius_meters: radius },
        ]);
        if (error) {
          alert("Failed to save: " + error.message);
          return;
        }
        fetchPois();
      });

      fetchPois();
    };

    map.on("load", onMapLoad);

    return () => {
      map.off("load", onMapLoad);
      map.remove();
    };
  }, []);

  async function fetchPois() {
    const { data, error } = await supabase
      .from("ar_pois")
      .select("*")
      .eq("is_active", true);
    if (error) {
      console.error(error);
      return;
    }
    const list = (data as POI[]) || [];
    setPois(list);
    drawPoisOnMap(list);
  }

  function drawPoisOnMap(points: POI[]) {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    // Clean up previous circle layers/sources
    const existing = map.getStyle().layers || [];
    existing
      .filter((l) => l.id.startsWith("circle-"))
      .forEach((l) => {
        const srcId = l.id;
        try {
          map.removeLayer(l.id);
          if (map.getSource(srcId)) map.removeSource(srcId);
        } catch {}
      });

    // We don't track markers, simple approach: rely on style reload; otherwise keep marker refs
    points.forEach((p) => {
      const el = document.createElement("div");
      el.className = "poi-marker";
      el.title = p.name;
      const marker = new mapboxgl.Marker(el).setLngLat([p.longitude, p.latitude]).addTo(map);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setSelected(p);
      });

      const id = `circle-${p.id}`;
      const circleGeoJSON = makeCircleGeoJSON(p.longitude, p.latitude, p.radius_meters || 5);
      if (map.getSource(id)) {
        (map.getSource(id) as mapboxgl.GeoJSONSource).setData(circleGeoJSON as any);
      } else {
        map.addSource(id, { type: "geojson", data: circleGeoJSON as any });
        map.addLayer({ id, type: "fill", source: id, paint: { "fill-color": "#0b2e66", "fill-opacity": 0.12 } });
      }
    });
  }

  function makeCircleGeoJSON(lon: number, lat: number, radiusMeters: number) {
    const points = 64;
    const coords: [number, number][] = [];
    const R = 6378137;
    for (let i = 0; i < points; i++) {
      const ang = (i / points) * Math.PI * 2;
      const dx = radiusMeters * Math.cos(ang);
      const dy = radiusMeters * Math.sin(ang);
      const dlat = (dy / R) * (180 / Math.PI);
      const dlon = (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
      coords.push([lon + dlon, lat + dlat]);
    }
    coords.push(coords[0]);
    return {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] }, properties: {} },
      ],
    } as GeoJSON.FeatureCollection;
  }

  async function updatePoi(p: POI) {
    if (!p.id) return;
    await supabase
      .from("ar_pois")
      .update({
        name: p.name,
        description: p.description,
        radius_meters: p.radius_meters,
        updated_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    fetchPois();
  }

  async function deletePoi(p: POI) {
    if (!p.id) return;
    await supabase.from("ar_pois").update({ is_active: false }).eq("id", p.id);
    setSelected(null);
    fetchPois();
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Create</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="create-wrap">
          <div ref={mapContainer} className="map-panel" />
          <div className="side-panel">
            <h3 className="panel-title">POIs</h3>
            <div className="poi-list">
              {pois.map((p) => (
                <div key={p.id} className="poi-item">
                  <div className="poi-meta">
                    <strong>{p.name}</strong>
                    <small>
                      {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                    </small>
                  </div>
                  <button className="btn" onClick={() => setSelected(p)}>
                    Edit
                  </button>
                </div>
              ))}
              {pois.length === 0 && <div className="empty">No POIs yet. Tap the map to add one.</div>}
            </div>

            {selected && (
              <div className="editor">
                <h4>Edit POI</h4>
                <label>Name</label>
                <input
                  className="input"
                  value={selected.name}
                  onChange={(e) => setSelected({ ...selected, name: e.target.value })}
                />
                <label>Description</label>
                <textarea
                  className="textarea"
                  value={selected.description || ""}
                  onChange={(e) => setSelected({ ...selected, description: e.target.value })}
                />
                <label>Radius (m)</label>
                <input
                  className="input"
                  type="number"
                  value={selected.radius_meters ?? 5}
                  onChange={(e) => setSelected({ ...selected, radius_meters: Number(e.target.value) })}
                />
                <div className="editor-actions">
                  <button className="btn primary" onClick={() => updatePoi(selected)}>
                    Save
                  </button>
                  <button className="btn danger" onClick={() => deletePoi(selected)}>
                    Disable
                  </button>
                  <button className="btn" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Create;