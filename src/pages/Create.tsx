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

  // Pen configuration UI state
  const [penType, setPenType] = useState<string>("Point");
  const [penColor, setPenColor] = useState<string>("#0b2e66");
  const [penRadius, setPenRadius] = useState<number>(5);
  const [singleName, setSingleName] = useState<string>("New POI");
  const [groupMode, setGroupMode] = useState<boolean>(false);
  const [groupBaseName, setGroupBaseName] = useState<string>("Pen");
  const [groupIndex, setGroupIndex] = useState<number>(1);

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

      // 3D terrain and sky
      try {
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.mapbox-terrain-dem-v1",
            tileSize: 512,
            maxzoom: 14,
          } as any);
        }
        map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 } as any);
        if (!map.getLayer("sky")) {
          map.addLayer({
            id: "sky",
            type: "sky",
            paint: {
              "sky-type": "atmosphere",
              "sky-atmosphere-sun": [0.0, 0.0],
              "sky-atmosphere-sun-intensity": 15,
            },
          } as any);
        }
        // 3D buildings
        const layers = map.getStyle().layers || [];
        const labelLayerId = layers.find((l: any) => l.type === "symbol" && l.layout && l.layout["text-field"])?.id;
        if (!map.getLayer("3d-buildings")) {
          map.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", "extrude", "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.6,
              },
            } as any,
            labelLayerId || undefined
          );
        }
        map.setPitch(60);
        map.setBearing(-20);
      } catch {}

      map.on("click", async (e) => {
        const lon = e.lngLat.lng;
        const lat = e.lngLat.lat;
        const name = groupMode
          ? `${groupBaseName} ${groupIndex}`
          : (singleName?.trim() || "New POI");
        const radius = penRadius > 0 ? penRadius : 5;

        const { error } = await supabase.from("ar_pois").insert([
          { name, description: "", latitude: lat, longitude: lon, radius_meters: radius },
        ]);
        if (error) {
          alert("Failed to save: " + error.message);
          return;
        }
        fetchPois();
        if (groupMode) setGroupIndex((i) => i + 1);
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
      el.style.background = penColor;
      el.style.width = `${(p.radius_meters || 5) * 2}px`;
      el.style.height = `${(p.radius_meters || 5) * 2}px`;
      el.innerHTML = `<span class="poi-label">${p.name}</span>`;
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
        map.addLayer({ id, type: "fill", source: id, paint: { "fill-color": penColor, "fill-opacity": 0.12 } });
        // add stroke outline for cue route feel
        map.addLayer({ id: `${id}-outline`, type: "line", source: id, paint: { "line-color": penColor, "line-width": 2, "line-opacity": 0.6 } });
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
            {/* Dropdown Create Pen */}
            {/** Dropdown state */}
            {(() => {
              const [open, setOpen] = React.useState(false);
              return (
                <div className="pen-create-card dropdown-form">
                  <button
                    className="dropdown-toggle-btn"
                    onClick={() => setOpen((v) => !v)}
                    style={{ width: "100%", padding: "12px 0", fontWeight: 600, fontSize: "1.1rem", background: "#0b2eec", color: "#fff", borderRadius: "12px", border: "none", boxShadow: "0 2px 8px rgba(11,46,236,0.10)", cursor: "pointer" }}
                  >
                    {open ? "Hide Pen Creation" : "Create Pen"}
                  </button>
                  {open && (
                    <form className="pen-config dropdown-fields" style={{ marginTop: 18 }}>
                      <div className="row">
                        <label>Type</label>
                        <select className="input" value={penType} onChange={(e) => setPenType(e.target.value)}>
                          <option>Point</option>
                          <option>Beacon</option>
                          <option>Zone</option>
                        </select>
                      </div>
                      <div className="row">
                        <label>Color</label>
                        <input className="input" type="color" value={penColor} onChange={(e) => setPenColor(e.target.value)} />
                      </div>
                      <div className="row">
                        <label>Radius (m)</label>
                        <input className="input" type="number" min={1} value={penRadius} onChange={(e) => setPenRadius(Number(e.target.value))} />
                      </div>
                      <div className="row">
                        <label>Mode</label>
                        <div className="mode">
                          <label className="chk"><input type="checkbox" checked={groupMode} onChange={(e) => setGroupMode(e.target.checked)} /> Group</label>
                        </div>
                      </div>
                      {!groupMode && (
                        <div className="row">
                          <label>Name</label>
                          <input className="input" value={singleName} onChange={(e) => setSingleName(e.target.value)} />
                        </div>
                      )}
                      {groupMode && (
                        <div className="row grid2">
                          <div>
                            <label>Group Name</label>
                            <input className="input" value={groupBaseName} onChange={(e) => setGroupBaseName(e.target.value)} />
                          </div>
                          <div>
                            <label>Next #</label>
                            <input className="input" type="number" min={1} value={groupIndex} onChange={(e) => setGroupIndex(Number(e.target.value))} />
                          </div>
                        </div>
                      )}
                      <div className="hint">Tap the map to place the pen using these settings.</div>
                      <div className="pen-preview">
                        <div
                          className="pen-preview-marker"
                          style={{ background: penColor, width: penRadius * 2, height: penRadius * 2 }}
                        />
                        <span className="pen-preview-name">{groupMode ? `${groupBaseName} ${groupIndex}` : singleName}</span>
                      </div>
                    </form>
                  )}
                </div>
              );
            })()}

            <h3 className="panel-title" style={{marginTop:12}}>POIs</h3>
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
                  <button className="btn view" onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.flyTo({ center: [p.longitude, p.latitude], zoom: 18, speed: 1.2 });
                    }
                  }}>
                    View
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