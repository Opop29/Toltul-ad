import React, { useEffect, useState } from "react";
import {
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSpinner,
  IonTitle,
  IonToolbar,
  useIonViewDidEnter,
} from "@ionic/react";
import {
  barChartOutline,
  locationOutline,
  calendarOutline,
  colorPaletteOutline,
  statsChartOutline,
  trendingUpOutline,
  mapOutline,
  timeOutline,
} from "ionicons/icons";
import { supabase } from "../utils/supabaseClient";
import "../css/Report.css";
interface MarkType {
  id: number;
  value: string;
  label: string;
  category: string;
}

interface Marker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  mark_type: string;
  color: string;
  height: number;
  dates: any[]; // JSONB array
  created_at: string;
  updated_at: string;
  group_name?: string;
  group_index?: number;
}


interface ReportStats {
  totalMarkers: number;
  totalGroups: number;
  markersByType: { [key: string]: number };
  markersByColor: { [key: string]: number };
  markersByCategory: { [key: string]: number };
  recentActivity: Marker[];
  topLocations: { coords: string; count: number }[];
  dateDistribution: { month: string; count: number }[];
  averageHeight: number;
}

const Report: React.FC = () => {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useIonViewDidEnter(() => {
    loadReportData();
  });

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get mark types for category mapping
      const { data: markTypes, error: markTypesError } = await supabase
        .from("mark_types")
        .select("*");

      if (markTypesError) throw markTypesError;

      // Create type to category map
      const typeToCategory: { [key: string]: string } = {};
      markTypes?.forEach(mt => {
        typeToCategory[mt.value] = mt.category;
      });

      // Get total markers count
      const { data: markers, error: markersError } = await supabase
        .from("ar_pois")
        .select("*");

      if (markersError) throw markersError;

      // Calculate statistics
      const totalMarkers = markers?.length || 0;

      // Sort markers for recent activity
      const sortedMarkers = markers
        ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

      const recentActivity = sortedMarkers.slice(0, 10);

      // Initialize counters
      const markersByType: { [key: string]: number } = {};
      const markersByColor: { [key: string]: number } = {};
      const markersByCategory: { [key: string]: number } = {};
      const locationGroups: { [key: string]: number } = {};
      const dateGroups: { [key: string]: number } = {};
      let totalGroups = 0;
      let totalHeight = 0;

      // Process all markers in a single loop for performance
      markers?.forEach(marker => {
        // Count by type
        const type = marker.mark_type || 'Unknown';
        markersByType[type] = (markersByType[type] || 0) + 1;

        // Count by color
        const color = marker.color || '#007cf0';
        markersByColor[color] = (markersByColor[color] || 0) + 1;

        // Count by category
        const category = typeToCategory[type] || 'Other';
        markersByCategory[category] = (markersByCategory[category] || 0) + 1;

        // Count groups
        if (marker.group_name) totalGroups++;

        // Sum heights for average
        totalHeight += marker.height || 1;

        // Location distribution
        const lat = Math.round(marker.lat * 10) / 10;
        const lng = Math.round(marker.lng * 10) / 10;
        const key = `${lat},${lng}`;
        locationGroups[key] = (locationGroups[key] || 0) + 1;

        // Date distribution
        const date = new Date(marker.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        dateGroups[monthKey] = (dateGroups[monthKey] || 0) + 1;
      });

      const averageHeight = totalMarkers > 0 ? totalHeight / totalMarkers : 0;

      const topLocations = Object.entries(locationGroups)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([coords, count]) => ({ coords, count }));

      const dateDistribution = Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({ month, count }));

      setStats({
        totalMarkers,
        totalGroups,
        markersByType,
        markersByColor,
        markersByCategory,
        recentActivity,
        topLocations,
        dateDistribution,
        averageHeight,
      });

    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadReportData();
    event.detail.complete();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getColorName = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      '#007cf0': 'Blue',
      '#00dfd8': 'Teal',
      '#ffc107': 'Yellow',
      '#dc3545': 'Red',
      '#28a745': 'Green',
      '#6f42c1': 'Purple',
      '#fd7e14': 'Orange',
      '#6c757d': 'Gray',
    };
    return colorMap[hexColor] || hexColor;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Reports & Analytics</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding report-content">
          <div className="loading-container">
            <IonSpinner name="crescent" />
            <p>Loading report data...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (error) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Reports & Analytics</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding report-content">
          <div className="error-container">
            <IonIcon icon={statsChartOutline} size="large" color="danger" />
            <h3>Error Loading Reports</h3>
            <p>{error}</p>
            <button className="btn" onClick={loadReportData}>Try Again</button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Reports & Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="report-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <div className="report-header">
          <h1 className="report-title">📊 Toltula-AR Analytics Dashboard</h1>
          <p className="report-subtitle">Comprehensive insights into your AR marker ecosystem</p>
        </div>

        {/* Key Metrics Cards */}
        <IonGrid className="metrics-grid">
          <IonRow>
            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="metric-card total-markers">
                <IonCardContent>
                  <div className="metric-icon">
                    <IonIcon icon={locationOutline} />
                  </div>
                  <div className="metric-content">
                    <h2>{stats?.totalMarkers || 0}</h2>
                    <p>Total Markers</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="metric-card total-groups">
                <IonCardContent>
                  <div className="metric-icon">
                    <IonIcon icon={mapOutline} />
                  </div>
                  <div className="metric-content">
                    <h2>{stats?.totalGroups || 0}</h2>
                    <p>Grouped Markers</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="metric-card marker-types">
                <IonCardContent>
                  <div className="metric-icon">
                    <IonIcon icon={barChartOutline} />
                  </div>
                  <div className="metric-content">
                    <h2>{Object.keys(stats?.markersByType || {}).length}</h2>
                    <p>Marker Types</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="metric-card color-variety">
                <IonCardContent>
                  <div className="metric-icon">
                    <IonIcon icon={colorPaletteOutline} />
                  </div>
                  <div className="metric-content">
                    <h2>{Object.keys(stats?.markersByColor || {}).length}</h2>
                    <p>Color Variations</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="6" sizeLg="3">
              <IonCard className="metric-card average-height">
                <IonCardContent>
                  <div className="metric-icon">
                    <IonIcon icon={trendingUpOutline} />
                  </div>
                  <div className="metric-content">
                    <h2>{stats?.averageHeight ? stats.averageHeight.toFixed(1) : '0'}</h2>
                    <p>Average Height</p>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        {/* Charts and Analytics */}
        <IonGrid>
          <IonRow>
            {/* Marker Types Distribution */}
            <IonCol size="12" sizeLg="6">
              <IonCard className="analytics-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={barChartOutline} />
                    Marker Types Distribution
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="chart-container">
                    {Object.entries(stats?.markersByType || {}).map(([type, count]) => (
                      <div key={type} className="chart-item">
                        <div className="chart-label">{type}</div>
                        <div className="chart-bar">
                          <div
                            className="chart-fill"
                            style={{
                              width: `${(count / (stats?.totalMarkers || 1)) * 100}%`,
                              background: 'linear-gradient(90deg, #007cf0, #00dfd8)'
                            }}
                          ></div>
                        </div>
                        <div className="chart-value">{count}</div>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Color Distribution */}
            <IonCol size="12" sizeLg="6">
              <IonCard className="analytics-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={colorPaletteOutline} />
                    Color Distribution
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="color-distribution">
                    {Object.entries(stats?.markersByColor || {}).map(([color, count]) => (
                      <div key={color} className="color-item">
                        <div
                          className="color-swatch"
                          style={{ backgroundColor: color }}
                        ></div>
                        <span className="color-name">{getColorName(color)}</span>
                        <span className="color-count">{count} markers</span>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            {/* Category Distribution */}
            <IonCol size="12" sizeLg="6">
              <IonCard className="analytics-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={barChartOutline} />
                    Category Distribution
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="chart-container">
                    {Object.entries(stats?.markersByCategory || {}).map(([category, count]) => (
                      <div key={category} className="chart-item">
                        <div className="chart-label">{category}</div>
                        <div className="chart-bar">
                          <div
                            className="chart-fill"
                            style={{
                              width: `${(count / (stats?.totalMarkers || 1)) * 100}%`,
                              background: 'linear-gradient(90deg, #28a745, #20c997)'
                            }}
                          ></div>
                        </div>
                        <div className="chart-value">{count}</div>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            {/* Recent Activity */}
            <IonCol size="12" sizeLg="6">
              <IonCard className="analytics-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={timeOutline} />
                    Recent Activity
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="activity-list">
                    {stats?.recentActivity.slice(0, 5).map((marker, index) => (
                      <div key={marker.id || index} className="activity-item">
                        <div className="activity-icon">
                          <IonIcon icon={locationOutline} />
                        </div>
                        <div className="activity-content">
                          <div className="activity-title">{marker.label}</div>
                          <div className="activity-meta">
                            {marker.mark_type} • {formatDate(marker.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>

            {/* Top Locations */}
            <IonCol size="12" sizeLg="6">
              <IonCard className="analytics-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={trendingUpOutline} />
                    Popular Locations
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="location-list">
                    {stats?.topLocations.map((location, index) => (
                      <div key={index} className="location-item">
                        <div className="location-rank">#{index + 1}</div>
                        <div className="location-content">
                          <div className="location-coords">{location.coords}</div>
                          <div className="location-count">{location.count} markers</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Date Distribution Timeline */}
          <IonRow>
            <IonCol size="12">
              <IonCard className="analytics-card timeline-card">
                <IonCardHeader>
                  <IonCardTitle>
                    <IonIcon icon={calendarOutline} />
                    Marker Creation Timeline
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div className="timeline-container">
                    {stats?.dateDistribution.map((item, index) => (
                      <div key={item.month} className="timeline-item">
                        <div className="timeline-month">{item.month}</div>
                        <div className="timeline-bar">
                          <div
                            className="timeline-fill"
                            style={{
                              width: `${Math.max((item.count / (stats?.totalMarkers || 1)) * 100, 5)}%`
                            }}
                          ></div>
                        </div>
                        <div className="timeline-count">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Report;


