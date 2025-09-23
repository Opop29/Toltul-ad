import React, { useEffect, useState, useRef } from "react";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonDatetime, IonModal, IonInput, IonSelect, IonSelectOption, IonIcon, IonButton, IonItem, IonLabel } from "@ionic/react";
import { checkmark, close } from 'ionicons/icons';
import mapboxgl from 'mapbox-gl';
import { supabase } from "../utils/supabaseClient";
import "../css/Builded.css";

type POI = {
  id?: number;
  lat: number;
  lng: number;
  label: string;
  mark_type: string;
  color: string;
  height: number;
  dates?: string[];
  group_name?: string;
  group_index?: number;
  editing?: boolean;
};

const Builded: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [selected, setSelected] = useState<POI | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [mapLocation, setMapLocation] = useState<POI | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMarkerLabel, setNewMarkerLabel] = useState<string>('');
  const [newMarkerMarkType, setNewMarkerMarkType] = useState<string>('');
  const [newMarkerColor, setNewMarkerColor] = useState<string>('#007cf0');
  const [newMarkerLat, setNewMarkerLat] = useState<string>('');
  const [newMarkerLng, setNewMarkerLng] = useState<string>('');
  const [showPermanentMarks, setShowPermanentMarks] = useState<boolean>(true);
  const [showGroupMarks, setShowGroupMarks] = useState<boolean>(true);
  const [showDatedMarks, setShowDatedMarks] = useState<boolean>(true);
  const [markTypeOptions, setMarkTypeOptions] = useState<any[]>([]);

  const getFilteredPois = () => {
    return pois.filter(p => {
      if (!showPermanentMarks && !p.dates?.length) return false;
      if (!showGroupMarks && p.group_name) return false;
      if (!showDatedMarks && p.dates?.length) return false;
      return true;
    });
  };

  useEffect(() => {
    fetchPois();
    loadMarkTypes();
  }, []);

  const loadMarkTypes = async () => {
    const { data, error } = await supabase.from('mark_types').select('value, label').order('label');
    if (error) {
      console.error('Error loading mark types:', error);
    } else {
      setMarkTypeOptions(data || []);
    }
  };

  useEffect(() => {
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    if (mapLocation && mapContainer.current) {
      mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [mapLocation.lng, mapLocation.lat],
        zoom: 15
      });

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${mapLocation.label}</strong><br>Lat: ${mapLocation.lat}<br>Lng: ${mapLocation.lng}${mapLocation.group_name ? `<br>Group: ${mapLocation.group_name} #${mapLocation.group_index}` : ''}`);
      if (mapLocation.group_index) {
        // For group markers, use custom element with number
        const el = document.createElement('div');
        el.style.backgroundColor = mapLocation.color || '#007cf0';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '12px';
        el.style.fontWeight = 'bold';
        el.style.color = 'white';
        el.textContent = mapLocation.group_index.toString();
        el.setAttribute('aria-label', 'Map marker');
        new mapboxgl.Marker({ element: el })
          .setLngLat([mapLocation.lng, mapLocation.lat])
          .setPopup(popup)
          .addTo(map.current);
      } else {
        // For other markers, use default marker
        new mapboxgl.Marker({ color: mapLocation.color || '#007cf0' })
          .setLngLat([mapLocation.lng, mapLocation.lat])
          .setPopup(popup)
          .addTo(map.current);
      }
    }
  }, [mapLocation]);

  async function fetchPois() {
    const { data, error } = await supabase
      .from("ar_pois")
      .select("id, lat, lng, label, mark_type, color, height, dates, group_name, group_index");
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
       mark_type: p.mark_type,
       color: p.color,
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
      setCheckedIds(getFilteredPois().map(p => p.id!));
    } else {
      setCheckedIds([]);
    }
  }, [selectAll, pois, showPermanentMarks, showGroupMarks, showDatedMarks]);

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
          <div className="combined-container">
            <div className="builded-card">
              {!selected && (
                <>
                  <h3>All Saved Markers</h3>
                  <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:12}}>
                    <div style={{display:'flex', gap:8}}>
                      <label><input type="checkbox" checked={showPermanentMarks} onChange={e => setShowPermanentMarks(e.target.checked)} /> Permanent</label>
                      <label><input type="checkbox" checked={showGroupMarks} onChange={e => setShowGroupMarks(e.target.checked)} /> Groups</label>
                      <label><input type="checkbox" checked={showDatedMarks} onChange={e => setShowDatedMarks(e.target.checked)} /> Dated</label>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <label><input type="checkbox" checked={selectAll} onChange={e => setSelectAll(e.target.checked)} /> Select All</label>
                      <button className="btn danger" onClick={deleteAll}>Delete All</button>
                      <button className="btn danger" onClick={deleteSelected} disabled={checkedIds.length === 0}>Delete Selected</button>
                    </div>
                  </div>
                  <div className="poi-list">
                    {getFilteredPois().map((p) => (
                      <div key={p.id} className="poi-item">
                        <div style={{position: 'absolute', top: '12px', right: '12px'}}>
                          <input type="checkbox" checked={checkedIds.includes(p.id!)} onChange={() => handleCheck(p.id!)} />
                        </div>
                        <div className="poi-meta">
                          <span className="poi-label">{p.label}</span>
                          <span className="poi-coords">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                          <span className="poi-type">{p.mark_type}</span>
                          <span className="poi-color" style={{backgroundColor: p.color}}></span>
                          <span className="poi-height">Height: {p.height}m</span>
                        </div>
                        <div className="poi-actions">
                          <button className="btn view" onClick={() => setSelected(p)}>Details</button>
                          <button className="btn edit" onClick={() => setSelected({ ...p, editing: true })}>Edit</button>
                          <button className="btn view" onClick={() => setMapLocation(p)}>View</button>
                          <button className="btn danger" onClick={() => deletePoi(p)}>Delete</button>
                        </div>
                      </div>
                    ))}
                    {pois.length === 0 && <div className="empty">No markers saved yet.</div>}
                  </div>
                </>
              )}

              {selected && !selected.editing && (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3>Marker Details</h3>
                    <button className="btn" onClick={() => setSelected(null)} style={{padding: '8px', background: 'transparent', color: '#007cf0', border: '1px solid #007cf0'}}>
                      ✕
                    </button>
                  </div>
                  <div style={{padding: '16px', background: 'rgba(0, 124, 240, 0.05)', borderRadius: '12px', marginBottom: 16}}>
                    <p><strong>Mark Type:</strong> {selected.mark_type}</p>
                    <p><strong>Color:</strong> <span style={{backgroundColor: selected.color, display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '8px'}}></span> {selected.color}</p>
                    <p><strong>Label:</strong> {selected.label}</p>
                    <p><strong>Coordinates:</strong> {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
                    <p><strong>Height:</strong> {selected.height}m</p>
                  </div>
                  <div style={{marginTop:12}}>
                    <button className="btn edit" onClick={() => setSelected({ ...selected, editing: true })}>Edit</button>
                    <button className="btn view" onClick={() => setMapLocation(selected)} style={{marginLeft:8}}>View on Map</button>
                  </div>
                </>
              )}

              {selected && selected.editing && (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3>Edit Marker</h3>
                    <button className="btn" onClick={() => setSelected(null)} style={{padding: '8px', background: 'transparent', color: '#007cf0', border: '1px solid #007cf0'}}>
                      ✕
                    </button>
                  </div>
                  <div style={{display: 'grid', gap: 16}}>
                    <div>
                      <label>Label</label>
                      <input
                        className="input"
                        value={selected.label}
                        onChange={(e) => setSelected({ ...selected, label: e.target.value })}
                      />
                    </div>
                    <div>
                      <label>Mark Type</label>
                      <select
                        className="input"
                        value={selected.mark_type}
                        onChange={(e) => setSelected({ ...selected, mark_type: e.target.value })}
                      >
                        <option value="building">Building</option>
                        <option value="department">Department</option>
                        <option value="events">Events</option>
                        <option value="rooms">Rooms</option>
                        <option value="hazard">Hazard</option>
                      </select>
                    </div>
                    <div>
                      <label>Color</label>
                      <input
                        className="input"
                        type="color"
                        value={selected.color}
                        onChange={(e) => setSelected({ ...selected, color: e.target.value })}
                      />
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                      <div>
                        <label>Latitude</label>
                        <input
                          className="input"
                          type="number"
                          step="0.00001"
                          value={selected.lat}
                          onChange={(e) => setSelected({ ...selected, lat: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label>Longitude</label>
                        <input
                          className="input"
                          type="number"
                          step="0.00001"
                          value={selected.lng}
                          onChange={(e) => setSelected({ ...selected, lng: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <label>Height (m)</label>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={selected.height}
                        onChange={(e) => setSelected({ ...selected, height: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div style={{marginTop:20, display: 'flex', gap: 12}}>
                    <button className="btn primary" onClick={() => updatePoi(selected)}>
                      Save Changes
                    </button>
                    <button className="btn danger" onClick={() => deletePoi(selected)}>
                      Delete Marker
                    </button>
                    <button className="btn" onClick={() => setSelected({ ...selected, editing: false })}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="map-container">
            <div className="builded-card">
              <h3>Map View</h3>
              {mapLocation ? (
                <div ref={mapContainer} style={{height: '100%'}} />
              ) : (
                <div style={{height: '100%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  <p>Map integration placeholder</p>
                  <p>Select a marker to view on map</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </IonContent>

      <IonModal isOpen={showAddModal} onDidDismiss={() => setShowAddModal(false)} onDidPresent={() => {
        setTimeout(() => {
          const input = document.querySelector('ion-input input') as HTMLInputElement;
          if (input) input.focus();
        }, 100);
      }}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Add Marker</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowAddModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonItem>
            <IonLabel position="stacked">Label</IonLabel>
            <IonInput value={newMarkerLabel} onIonChange={e => setNewMarkerLabel(e.detail.value!)} placeholder="Enter marker label" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Mark Type</IonLabel>
            <IonSelect value={newMarkerMarkType} placeholder="Select mark type" onIonChange={e => setNewMarkerMarkType(e.detail.value)}>
              {markTypeOptions.map(option => (
                <IonSelectOption key={option.value} value={option.value}>{option.label}</IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Color</IonLabel>
            <input type="color" value={newMarkerColor} onChange={e => setNewMarkerColor(e.target.value)} style={{width: '100%', height: '40px', border: 'none', borderRadius: '8px'}} />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Latitude</IonLabel>
            <IonInput type="number" value={newMarkerLat} onIonChange={e => setNewMarkerLat(e.detail.value!)} placeholder="Latitude" />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">Longitude</IonLabel>
            <IonInput type="number" value={newMarkerLng} onIonChange={e => setNewMarkerLng(e.detail.value!)} placeholder="Longitude" />
          </IonItem>
          <IonButton expand="full" onClick={async () => {
            if (!newMarkerLat || !newMarkerLng || !newMarkerLabel || !newMarkerMarkType) {
              alert('Please fill all fields');
              return;
            }
            const { error } = await supabase.from('ar_pois').insert({
              lat: Number(newMarkerLat),
              lng: Number(newMarkerLng),
              label: newMarkerLabel,
              mark_type: newMarkerMarkType,
              color: newMarkerColor,
              height: 1,
            });
            if (error) {
              console.error('Error saving marker:', error);
            } else {
              setShowAddModal(false);
              setNewMarkerLabel('');
              setNewMarkerMarkType('');
              setNewMarkerColor('#007cf0');
              setNewMarkerLat('');
              setNewMarkerLng('');
              fetchPois();
            }
          }} color="primary">
            <IonIcon icon={checkmark} slot="start" />
            Done
          </IonButton>
          <IonButton expand="full" onClick={() => setShowAddModal(false)} color="danger">
            <IonIcon icon={close} slot="start" />
            Cancel
          </IonButton>
        </IonContent>
      </IonModal>
    </IonPage>
  );
};

export default Builded;