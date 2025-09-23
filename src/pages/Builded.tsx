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

type GroupItem = {
  isGroup: true;
  group_name: string;
  group_index: number;
  color: string;
  mark_type: string;
  markers: POI[];
  lat: number;
  lng: number;
  height: number;
  editing?: boolean;
};

type DisplayItem = POI | GroupItem;

const Builded: React.FC = () => {
  const [pois, setPois] = useState<POI[]>([]);
  const [selected, setSelected] = useState<POI | GroupItem | null>(null);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString());
  const [mapLocation, setMapLocation] = useState<POI | GroupItem | null>(null);
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
  const [showCalendarView, setShowCalendarView] = useState<boolean>(false);
  const [selectedDateMarkers, setSelectedDateMarkers] = useState<POI[]>([]);

  const getFilteredPois = (): DisplayItem[] => {
    const filtered = pois.filter(p => {
      if (!showPermanentMarks && !p.dates?.length) return false;
      if (!showGroupMarks && p.group_name) return false;
      if (!showDatedMarks && p.dates?.length) return false;
      return true;
    });

    // Group markers by base group name (everything before the last #)
    const grouped = new Map<string, POI[]>();
    const individual: POI[] = [];

    filtered.forEach(p => {
      if (p.group_name) {
        // Extract base name by removing everything after the last #
        const baseName = p.group_name.replace(/ #\d+$/, '');
        if (!grouped.has(baseName)) {
          grouped.set(baseName, []);
        }
        grouped.get(baseName)!.push(p);
      } else {
        individual.push(p);
      }
    });

    // Convert groups to group objects
    const groupItems: GroupItem[] = Array.from(grouped.entries()).map(([baseName, group]) => ({
      isGroup: true,
      group_name: baseName,
      group_index: 0, // Not used for display anymore
      color: group[0].color,
      mark_type: group[0].mark_type,
      markers: group,
      lat: group[0].lat,
      lng: group[0].lng,
      height: group[0].height
    }));

    return [...groupItems, ...individual];
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

      if ('isGroup' in mapLocation && mapLocation.isGroup) {
        // Display all markers in the group
        const groupItem = mapLocation as unknown as GroupItem;
        groupItem.markers.forEach((marker: POI, index: number) => {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${marker.label}</strong><br>Lat: ${marker.lat}<br>Lng: ${marker.lng}<br>Group: ${groupItem.group_name}`);

          const el = document.createElement('div');
          el.style.backgroundColor = groupItem.color || '#007cf0';
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
          el.textContent = (index + 1).toString(); // Show marker number within group
          el.setAttribute('aria-label', 'Map marker');

          new mapboxgl.Marker({ element: el })
            .setLngLat([marker.lng, marker.lat])
            .setPopup(popup)
            .addTo(map.current!);
        });
      } else if (!('isGroup' in mapLocation) || !mapLocation.isGroup) {
        // Single marker display
        const marker = mapLocation as POI;
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${marker.label}</strong><br>Lat: ${marker.lat}<br>Lng: ${marker.lng}${marker.group_name ? `<br>Group: ${marker.group_name}` : ''}`);

        if (marker.group_index) {
          // For group markers, use custom element with number
          const el = document.createElement('div');
          el.style.backgroundColor = marker.color || '#007cf0';
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
          el.textContent = marker.group_index.toString();
          el.setAttribute('aria-label', 'Map marker');
          new mapboxgl.Marker({ element: el })
            .setLngLat([marker.lng, marker.lat])
            .setPopup(popup)
            .addTo(map.current);
        } else {
          // For other markers, use default marker
          new mapboxgl.Marker({ color: marker.color || '#007cf0' })
            .setLngLat([marker.lng, marker.lat])
            .setPopup(popup)
            .addTo(map.current);
        }
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
      const allIds: number[] = [];
      getFilteredPois().forEach(item => {
        if ('isGroup' in item) {
          item.markers.forEach(m => allIds.push(m.id!));
        } else {
          allIds.push(item.id!);
        }
      });
      setCheckedIds(allIds);
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
              {!selected && !showCalendarView && (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3>All Saved Markers</h3>
                    <button className="btn" onClick={() => setShowCalendarView(true)} style={{padding: '8px', background: 'transparent', color: '#007cf0', border: '1px solid #007cf0'}}>
                      📅
                    </button>
                  </div>
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
                    {getFilteredPois().map((item, index) => {
                      if ('isGroup' in item) {
                        // Group item
                        return (
                          <div key={`group-${item.group_name}-${item.group_index}`} className="poi-item">
                            <div style={{position: 'absolute', top: '12px', right: '12px'}}>
                              <input type="checkbox" checked={item.markers.every(m => checkedIds.includes(m.id!))} onChange={() => {
                                const allChecked = item.markers.every(m => checkedIds.includes(m.id!));
                                const newIds = allChecked
                                  ? checkedIds.filter(id => !item.markers.some(m => m.id === id))
                                  : [...checkedIds, ...item.markers.map(m => m.id!).filter(id => !checkedIds.includes(id))];
                                setCheckedIds(newIds);
                              }} />
                            </div>
                            <div className="poi-meta">
                              <span className="poi-label">{item.group_name}</span>
                              <span className="poi-coords">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</span>
                              <span className="poi-type">{item.mark_type} (Group)</span>
                              <span className="poi-color" style={{backgroundColor: item.color}}></span>
                              <span className="poi-height">{item.markers.length} markers</span>
                            </div>
                            <div className="poi-actions">
                              <button className="btn view" onClick={() => setSelected(item.markers[0])}>Details</button>
                              <button className="btn edit" onClick={() => setSelected({ ...item.markers[0], editing: true })}>Edit</button>
                              <button className="btn view" onClick={() => setMapLocation(item)}>View</button>
                              <button className="btn danger" onClick={() => item.markers.forEach(m => deletePoi(m))}>Delete</button>
                            </div>
                          </div>
                        );
                      } else {
                        // Individual POI
                        return (
                          <div key={item.id} className="poi-item">
                            <div style={{position: 'absolute', top: '12px', right: '12px'}}>
                              <input type="checkbox" checked={checkedIds.includes(item.id!)} onChange={() => handleCheck(item.id!)} />
                            </div>
                            <div className="poi-meta">
                              <span className="poi-label">{item.label}</span>
                              <span className="poi-coords">{item.lat.toFixed(5)}, {item.lng.toFixed(5)}</span>
                              <span className="poi-type">{item.mark_type}</span>
                              <span className="poi-color" style={{backgroundColor: item.color}}></span>
                              <span className="poi-height">Height: {item.height}m</span>
                            </div>
                            <div className="poi-actions">
                              <button className="btn view" onClick={() => setSelected(item)}>Details</button>
                              <button className="btn edit" onClick={() => setSelected({ ...item, editing: true })}>Edit</button>
                              <button className="btn view" onClick={() => setMapLocation(item)}>View</button>
                              <button className="btn danger" onClick={() => deletePoi(item)}>Delete</button>
                            </div>
                          </div>
                        );
                      }
                    })}
                    {pois.length === 0 && <div className="empty">No markers saved yet.</div>}
                  </div>
                </>
              )}

              {!selected && showCalendarView && (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3>Calendar View</h3>
                    <button className="btn" onClick={() => {setShowCalendarView(false); setSelectedDateMarkers([]);}} style={{padding: '8px', background: 'transparent', color: '#007cf0', border: '1px solid #007cf0'}}>
                      ✕
                    </button>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', minHeight: '400px'}}>
                    <div style={{marginBottom: '30px', padding: '20px', background: 'rgba(0, 124, 240, 0.05)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0, 102, 204, 0.1)'}}>
                      <IonDatetime
                        presentation="date"
                        value={selectedDate}
                        onIonChange={(e) => {
                          const date = e.detail.value as string;
                          setSelectedDate(date);
                          // Filter markers for selected date
                          const dateObj = new Date(date);
                          const dateStr = dateObj.toISOString().split('T')[0];
                          const markersForDate = pois.filter(p =>
                            p.dates && p.dates.some(d => d.startsWith(dateStr))
                          );
                          setSelectedDateMarkers(markersForDate);
                        }}
                        style={{'--background': 'transparent', '--color': '#007cf0'}}
                      />
                    </div>
                    {selectedDateMarkers.length > 0 && (
                      <div style={{width: '100%', maxWidth: '600px'}}>
                        <h4 style={{textAlign: 'center', color: '#1a365d', marginBottom: '16px'}}>
                          Markers for {new Date(selectedDate).toLocaleDateString()}
                        </h4>
                        <div className="poi-list" style={{gridTemplateColumns: '1fr'}}>
                          {selectedDateMarkers.map((p) => (
                            <div key={p.id} className="poi-item" style={{minHeight: 'auto', padding: '16px', marginBottom: '12px'}}>
                              <div className="poi-meta" style={{marginBottom: 12}}>
                                <span className="poi-label" style={{fontSize: '1.1rem', fontWeight: '600'}}>{p.label}</span>
                                <span className="poi-coords" style={{fontSize: '0.9rem'}}>{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                                <span className="poi-type" style={{fontSize: '0.85rem'}}>{p.mark_type}</span>
                                <span className="poi-color" style={{backgroundColor: p.color}}></span>
                              </div>
                              <div className="poi-actions" style={{gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                                <button className="btn view" onClick={() => {setSelected(p); setShowCalendarView(false);}}>Details</button>
                                <button className="btn view" onClick={() => setMapLocation(p)}>View on Map</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedDateMarkers.length === 0 && (
                      <div style={{textAlign: 'center', color: '#666', marginTop: '20px'}}>
                        <p>No markers found for the selected date.</p>
                        <p style={{fontSize: '0.9rem', marginTop: '8px'}}>Try selecting a different date.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selected && !('editing' in selected ? selected.editing : false) && (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3>{'isGroup' in selected ? 'Group Details' : 'Marker Details'}</h3>
                    <button className="btn" onClick={() => setSelected(null)} style={{padding: '8px', background: 'transparent', color: '#007cf0', border: '1px solid #007cf0'}}>
                      ✕
                    </button>
                  </div>
                  {'isGroup' in selected ? (
                    // Group details
                    <div>
                      <div style={{padding: '16px', background: 'rgba(0, 124, 240, 0.05)', borderRadius: '12px', marginBottom: 16}}>
                        <p><strong>Group Name:</strong> {selected.group_name}</p>
                        <p><strong>Mark Type:</strong> {selected.mark_type}</p>
                        <p><strong>Color:</strong> <span style={{backgroundColor: selected.color, display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '8px'}}></span> {selected.color}</p>
                        <p><strong>Markers in Group:</strong> {selected.markers.length}</p>
                      </div>
                      <div style={{marginBottom: 16}}>
                        <h4 style={{marginBottom: '16px', color: '#1a365d', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px'}}>All Markers in this Group:</h4>
                        <div style={{display: 'grid', gap: '12px'}}>
                          {selected.markers.map((marker, index) => (
                            <div key={marker.id} style={{
                              padding: '16px',
                              background: 'linear-gradient(135deg, rgba(0, 124, 240, 0.05) 0%, rgba(0, 124, 240, 0.02) 100%)',
                              borderRadius: '12px',
                              border: '1px solid rgba(0, 124, 240, 0.1)',
                              boxShadow: '0 2px 8px rgba(0, 124, 240, 0.08)',
                              position: 'relative'
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                backgroundColor: selected.color,
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {index + 1}
                              </div>
                              <div style={{marginBottom: '12px'}}>
                                <h5 style={{margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.1rem'}}>{marker.label}</h5>
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                                  <span style={{
                                    backgroundColor: selected.color,
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    display: 'inline-block'
                                  }}></span>
                                  <span style={{fontSize: '0.9rem', color: '#4a5568'}}>{selected.mark_type}</span>
                                </div>
                              </div>
                              <div style={{fontSize: '0.9rem', color: '#718096'}}>
                                <div style={{marginBottom: '4px'}}>
                                  <strong>📍 Coordinates:</strong> {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
                                </div>
                                <div>
                                  <strong>📏 Height:</strong> {marker.height}m
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{marginTop:12}}>
                        <button className="btn edit" onClick={() => setSelected({ ...selected, editing: true })}>Edit Group</button>
                        <button className="btn view" onClick={() => setMapLocation(selected.markers[0])} style={{marginLeft:8}}>View on Map</button>
                      </div>
                    </div>
                  ) : (
                    // Individual marker details
                    <div>
                      <div style={{padding: '16px', background: 'rgba(0, 124, 240, 0.05)', borderRadius: '12px', marginBottom: 16}}>
                        <p><strong>Mark Type:</strong> {selected.mark_type}</p>
                        <p><strong>Color:</strong> <span style={{backgroundColor: selected.color, display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '8px'}}></span> {selected.color}</p>
                        <p><strong>Label:</strong> {selected.label}</p>
                        <p><strong>Coordinates:</strong> {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
                        <p><strong>Height:</strong> {selected.height}m</p>
                        {selected.group_name && (() => {
                          // Find the group this marker belongs to and count markers
                          const group = getFilteredPois().find(item =>
                            'isGroup' in item && item.markers.some(m => m.id === selected.id)
                          ) as GroupItem;
                          return group ? (
                            <div style={{
                              marginTop: '12px',
                              padding: '8px 12px',
                              background: 'rgba(255, 193, 7, 0.1)',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 193, 7, 0.3)'
                            }}>
                              <p style={{margin: 0, fontSize: '0.9rem', color: '#856404'}}>
                                <strong>📊 Group Info:</strong> Part of "{group.group_name}" group with {group.markers.length} total markers
                              </p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                      <div style={{marginTop:12}}>
                        <button className="btn edit" onClick={() => setSelected({ ...selected, editing: true })}>Edit</button>
                        <button className="btn view" onClick={() => setMapLocation(selected)} style={{marginLeft:8}}>View on Map</button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {selected && ('editing' in selected ? selected.editing : false) && (
                <>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <h3>{'isGroup' in selected ? 'Edit Group' : 'Edit Marker'}</h3>
                    <button className="btn" onClick={() => setSelected(null)} style={{padding: '8px', background: 'transparent', color: '#007cf0', border: '1px solid #007cf0'}}>
                      ✕
                    </button>
                  </div>
                  {'isGroup' in selected ? (
                    // Group editing - allow editing group properties or individual markers
                    <div style={{display: 'grid', gap: 16}}>
                      <div>
                        <label>Select Marker to Edit</label>
                        <select
                          className="input"
                          onChange={(e) => {
                            const markerIndex = parseInt(e.target.value);
                            if (markerIndex >= 0) {
                              // Switch to editing individual marker
                              setSelected({ ...selected.markers[markerIndex], editing: true });
                            }
                            // Reset select
                            e.target.value = "-1";
                          }}
                        >
                          <option value="-1">Edit Group Properties</option>
                          {selected.markers.map((marker, index) => (
                            <option key={marker.id} value={index}>
                              Edit Marker #{index + 1}: {marker.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label>Group Name</label>
                        <input
                          className="input"
                          value={selected.group_name}
                          onChange={(e) => setSelected({ ...selected, group_name: e.target.value })}
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
                      <div style={{marginTop:20, display: 'flex', gap: 12}}>
                        <button className="btn primary" onClick={() => {
                          // Update all markers in the group
                          selected.markers.forEach((marker, index) => {
                            const newGroupName = `${selected.group_name} #${index + 1}`;
                            updatePoi({ ...marker, mark_type: selected.mark_type, color: selected.color, group_name: newGroupName });
                          });
                          setSelected(null);
                        }}>
                          Save Group Changes
                        </button>
                        <button className="btn danger" onClick={() => {
                          selected.markers.forEach(marker => deletePoi(marker));
                          setSelected(null);
                        }}>
                          Delete Entire Group
                        </button>
                        <button className="btn" onClick={() => setSelected({ ...selected, editing: false })}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Individual marker editing
                    <div style={{display: 'grid', gap: 16}}>
                      {selected.group_name && (
                        <div>
                          <label>Switch to Edit Other Markers in Group</label>
                          <select
                            className="input"
                            onChange={(e) => {
                              const markerIndex = parseInt(e.target.value);
                              if (markerIndex >= 0) {
                                // Find the group this marker belongs to
                                const group = getFilteredPois().find(item =>
                                  'isGroup' in item && item.markers.some(m => m.id === selected.id)
                                ) as GroupItem;
                                if (group) {
                                  setSelected({ ...group.markers[markerIndex], editing: true });
                                }
                              }
                              // Reset select
                              e.target.value = "-1";
                            }}
                          >
                            <option value="-1">Select Marker to Edit</option>
                            {(() => {
                              // Find markers in the same group
                              const group = getFilteredPois().find(item =>
                                'isGroup' in item && item.markers.some(m => m.id === selected.id)
                              ) as GroupItem;
                              return group ? group.markers.map((marker, index) => (
                                <option key={marker.id} value={index}>
                                  Edit Marker #{index + 1}: {marker.label}
                                </option>
                              )) : null;
                            })()}
                          </select>
                        </div>
                      )}
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
                    </div>
                  )}
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