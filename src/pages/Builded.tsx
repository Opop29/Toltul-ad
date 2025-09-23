
import React, { useEffect, useState } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonDatetime } from "@ionic/react";
import { supabase } from "../utils/supabaseClient";
import "../css/Builded.css";

type POI = {
  id?: number;
  lat: number;
  lng: number;
  label: string;
  icon: string;
  height: number;
  editing?: boolean;
};

const Builded: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [selected, setSelected] = useState<POI | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());

  useEffect(() => {
    fetchPois();
  }, []);

  async function fetchPois() {
    const { data, error } = await supabase
      .from("ar_pois")
      .select("id, lat, lng, label, icon, height");
    if (error) {
      console.error(error);
      return;
    }
    setPois((data as POI[]) || []);
  }

  async function updatePoi(p: POI) {
   if (!p.id) return;
   await supabase
     .from("ar_pois")
     .update({
       label: p.label,
       icon: p.icon,
       height: p.height,
       lat: p.lat,
       lng: p.lng,
     })
     .eq("id", p.id);

   fetchPois();
   setSelected(null);
 }

  async function setCoords(p: POI) {
    if (!p.id) return;
    const lat = prompt("Set latitude:", p.lat.toString());
    const lon = prompt("Set longitude:", p.lng.toString());
    if (!lat || !lon) return;
    await supabase
      .from("ar_pois")
      .update({ lat: Number(lat), lng: Number(lon) })
      .eq("id", p.id);
    fetchPois();
  }

  async function deletePoi(p: POI) {
  if (!p.id) return;
  await supabase
    .from("ar_pois")
    .delete()
    .eq("id", p.id);
  fetchPois();
  setSelected(null);
}


  // Select all checkbox handler
  useEffect(() => {
    if (selectAll) {
      setCheckedIds(pois.map(p => p.id!));
    } else {
      setCheckedIds([]);
    }
  }, [selectAll, pois]);

  // Individual checkbox handler
  const handleCheck = (id: number) => {
    setCheckedIds(prev => prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]);
  };

 async function deleteSelected() {
  if (checkedIds.length === 0) return;
  await supabase
    .from("ar_pois")
    .delete()
    .in("id", checkedIds);
  fetchPois();
  setCheckedIds([]);
  setSelectAll(false);
}


async function deleteAll() {
  if (pois.length === 0) return;
  await supabase
    .from("ar_pois")
    .delete()
    .in("id", pois.map(p => p.id ?? ""));
  fetchPois();
  setCheckedIds([]);
  setSelectAll(false);
}


  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Builded Pens</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="builded-wrap">
          <div className="details-container">
            {selected ? (
              <div className="builded-card">
                <h4>Marker Details</h4>
                <p><strong>Icon:</strong> {selected.icon}</p>
                <p><strong>Label:</strong> {selected.label}</p>
                <p><strong>Coordinates:</strong> {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
                <p><strong>Height:</strong> {selected.height}m</p>
                <div style={{marginTop:12}}>
                  <button className="btn edit" onClick={() => setSelected({ ...selected, editing: true })}>Edit</button>
                  <button className="btn" style={{marginLeft:8}} onClick={() => setSelected(null)}>Close</button>
                </div>
              </div>
            ) : (
              <div className="builded-card">
                <h4>Marker Details</h4>
                <p>Select a marker to view details</p>
              </div>
            )}
            {selected && (selected as any).editing && (
              <div className="builded-card">
                <h4>Edit Marker</h4>
                <label>Label</label>
                <input
                  className="input"
                  value={selected.label}
                  onChange={(e) => setSelected({ ...selected, label: e.target.value })}
                />
                <label>Icon</label>
                <input
                  className="input"
                  value={selected.icon}
                  onChange={(e) => setSelected({ ...selected, icon: e.target.value })}
                />
                <label>Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="0.00001"
                  value={selected.lat}
                  onChange={(e) => setSelected({ ...selected, lat: Number(e.target.value) })}
                />
                <label>Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="0.00001"
                  value={selected.lng}
                  onChange={(e) => setSelected({ ...selected, lng: Number(e.target.value) })}
                />
                <label>Height (m)</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={selected.height}
                  onChange={(e) => setSelected({ ...selected, height: Number(e.target.value) })}
                />
                <div style={{marginTop:12}}>
                  <button className="btn primary" onClick={() => updatePoi(selected)}>
                    Save
                  </button>
                  <button className="btn danger" style={{marginLeft:8}} onClick={() => deletePoi(selected)}>
                    Delete
                  </button>
                  <button className="btn" style={{marginLeft:8}} onClick={() => setSelected({ ...selected, editing: false })}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="list-container">
            <div className="builded-card">
              <h3>All Saved Markers</h3>
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <label><input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} /> Select All</label>
                <button className="btn danger" onClick={deleteAll}>Delete All</button>
                <button className="btn danger" onClick={deleteSelected} disabled={checkedIds.length === 0}>Delete Selected</button>
              </div>
              <div className="poi-list">
                {pois.map((p) => (
                  <div key={p.id} className="poi-item">
                    <input type="checkbox" checked={checkedIds.includes(p.id!)} onChange={() => handleCheck(p.id!)} style={{marginRight:8}} />
                    <div className="poi-meta">
                      <span className="poi-label">{p.label}</span>
                      <span className="poi-coords">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                      <span className="poi-icon">{p.icon}</span>
                      <span className="poi-height">Height: {p.height}m</span>
                    </div>
                    <div className="poi-actions">
                      <button className="btn view" onClick={() => setSelected(p)}>Details</button>
                      <button className="btn edit" onClick={() => setSelected({ ...p, editing: true })}>Edit</button>
                      <button className="btn coords" onClick={() => window.open(`https://www.google.com/maps?q=${p.lat},${p.lng}`, "_blank")}>View</button>
                      <button className="btn danger" onClick={() => deletePoi(p)}>Delete</button>
                    </div>
                  </div>
                ))}
                {pois.length === 0 && <div className="empty">No markers saved yet.</div>}
              </div>
            </div>
          </div>
          <div className="map-container">
            <div className="builded-card">
              <h3>Map View</h3>
              <div style={{height: '400px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <p>Google Map integration placeholder</p>
                <p>Select a marker to view on map</p>
              </div>
            </div>
          </div>
          <div className="calendar-container">
            <div className="builded-card">
              <h3>Calendar</h3>
              <IonDatetime
                presentation="date"
                value={selectedDate}
                onIonChange={(e) => setSelectedDate(e.detail.value as string)}
              />
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Builded;


