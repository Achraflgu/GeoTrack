import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { geofencesApi, devicesApi } from '@/lib/api';
import { useAppStore, useAuthStore } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import {
    Hexagon, Plus, Trash2, X, Edit3, Eye, EyeOff, MapPin, Radio,
    Shield, RefreshCw, CircleDot, Pentagon, CheckCircle2, AlertTriangle,
    ChevronDown, ChevronUp, Layers, Satellite, Mountain, Map as MapIcon
} from 'lucide-react';

const ZONE_COLORS = ['#00E599', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A78BFA', '#F472B6', '#34D399', '#60A5FA', '#FBBF24', '#FB923C'];

const MAP_LAYERS = {
    dark: {
        name: 'Sombre',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
    street: {
        name: 'Standard',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    satellite: {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
    terrain: {
        name: 'Terrain',
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    },
};
type MapLayerType = keyof typeof MAP_LAYERS;

const GeofencesPage = () => {
    const { user } = useAuthStore();
    const { lang } = useI18n();
    const t = lang === 'fr' ? {
        title: 'Zones GPS (Geofences)',
        subtitle: 'Créez des zones et recevez des alertes quand vos appareils en sortent.',
        newZone: 'Nouvelle Zone',
        zoneName: 'Nom de la zone',
        zoneType: 'Type',
        circle: 'Cercle',
        polygon: 'Polygone',
        radius: 'Rayon (m)',
        color: 'Couleur',
        devices: 'Appareils',
        selectDevices: 'Sélectionner les appareils...',
        alertExit: 'Alerte sortie',
        alertEntry: 'Alerte entrée',
        drawOnMap: 'Dessinez sur la carte →',
        drawCircle: 'Cliquez sur la carte pour placer le centre du cercle',
        drawPolygon: 'Cliquez les points du polygone, puis fermez-le',
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        noZones: 'Aucune zone créée',
        noZonesDesc: 'Cliquez sur "+ Nouvelle Zone" pour commencer',
        checkDevices: 'Vérifier les appareils',
        active: 'Active',
        inactive: 'Inactive',
        zoneCount: 'zones',
        deviceCount: 'appareils assignés',
    } : {
        title: 'GPS Zones (Geofences)',
        subtitle: 'Create zones and get alerts when your devices leave them.',
        newZone: 'New Zone',
        zoneName: 'Zone name',
        zoneType: 'Type',
        circle: 'Circle',
        polygon: 'Polygon',
        radius: 'Radius (m)',
        color: 'Color',
        devices: 'Devices',
        selectDevices: 'Select devices...',
        alertExit: 'Exit alert',
        alertEntry: 'Entry alert',
        drawOnMap: 'Draw on the map →',
        drawCircle: 'Click on the map to place the circle center',
        drawPolygon: 'Click polygon points, then close the shape',
        drawCircleHint: 'Click map to place center',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        noZones: 'No zones created',
        noZonesDesc: 'Click "+ New Zone" to get started',
        checkDevices: 'Check devices',
        active: 'Active',
        inactive: 'Inactive',
        zoneCount: 'zones',
        deviceCount: 'assigned devices',
    };

    const [geofences, setGeofences] = useState<any[]>([]);
    const [allDevices, setAllDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedZone, setExpandedZone] = useState<string | null>(null);
    const [drawMode, setDrawMode] = useState<'idle' | 'circle' | 'polygon'>('idle');
    const [mapLayer, setMapLayer] = useState<MapLayerType>('dark');
    const [showLayerMenu, setShowLayerMenu] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        type: 'circle' as 'circle' | 'polygon',
        color: ZONE_COLORS[0],
        center: null as { lat: number; lng: number } | null,
        radius: 500,
        polygon: [] as { lat: number; lng: number }[],
        devices: [] as string[],
        alertOnExit: true,
        alertOnEntry: false,
        isActive: true,
        enterpriseId: '',
    });

    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const zonesLayerRef = useRef<L.LayerGroup | null>(null);
    const drawLayerRef = useRef<L.LayerGroup | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const devicesLayerRef = useRef<L.LayerGroup | null>(null);
    const autoFitDone = useRef(false);

    // Live devices from app store (same as /map page)
    const storeDevices = useAppStore(s => s.devices);

    // ─── Fetch data ────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const user = useAuthStore.getState().user as any;
            const enterpriseId = user?.role !== 'admin' ? user?.enterpriseId : undefined;
            const userId = user?.role !== 'admin' ? user?.id : undefined;

            const [zones, devices] = await Promise.all([
                geofencesApi.getAll(enterpriseId, userId),
                devicesApi.getAll(),
            ]);
            
            // Strictly filter devices so operators cannot assign or see other enterprise's devices
            const allowedDevices = enterpriseId 
                ? devices.filter((d: any) => d.enterpriseId === enterpriseId)
                : devices;

            setGeofences(zones);
            setAllDevices(allowedDevices);
        } catch (err: any) {
            toast.error('Error loading data', { description: err.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ─── Initialize map ────────────────────────────────────────────
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [34.0, 9.5], // Tunisia center
            zoom: 7,
            zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        const layer = MAP_LAYERS.dark;
        tileLayerRef.current = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            maxZoom: 19,
        }).addTo(map);

        zonesLayerRef.current = L.layerGroup().addTo(map);
        drawLayerRef.current = L.layerGroup().addTo(map);
        devicesLayerRef.current = L.layerGroup().addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // ─── Switch tile layer ─────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || !tileLayerRef.current) return;
        const layer = MAP_LAYERS[mapLayer];
        tileLayerRef.current.remove();
        tileLayerRef.current = L.tileLayer(layer.url, {
            attribution: layer.attribution,
            maxZoom: 19,
        }).addTo(mapRef.current);
    }, [mapLayer]);

    // ─── Render zones on map ───────────────────────────────────────
    useEffect(() => {
        if (!zonesLayerRef.current) return;
        zonesLayerRef.current.clearLayers();

        geofences.forEach((zone) => {
            if (!zone.isActive) return;

            if (zone.type === 'circle' && zone.center) {
                L.circle([zone.center.lat, zone.center.lng], {
                    radius: zone.radius,
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.15,
                    weight: 2,
                }).addTo(zonesLayerRef.current!)
                    .bindPopup(`<b>${zone.name}</b><br>${zone.devices?.length || 0} ${t.devices}`);
            } else if (zone.type === 'polygon' && zone.polygon?.length >= 3) {
                L.polygon(
                    zone.polygon.map((p: any) => [p.lat, p.lng]),
                    {
                        color: zone.color,
                        fillColor: zone.color,
                        fillOpacity: 0.15,
                        weight: 2,
                    }
                ).addTo(zonesLayerRef.current!)
                    .bindPopup(`<b>${zone.name}</b><br>${zone.devices?.length || 0} ${t.devices}`);
            }

        });
    }, [geofences]);

    // ─── Render device markers (like /map) ──────────────────────────
    useEffect(() => {
        if (!devicesLayerRef.current) return;
        devicesLayerRef.current.clearLayers();

        const statusColors: Record<string, string> = {
            online: '#22c55e', moving: '#10b981', idle: '#f59e0b',
            offline: '#6b7280', alert: '#ef4444',
        };

        // CSS for marker animations (inject once)
        if (!document.getElementById('geofence-marker-animations')) {
            const style = document.createElement('style');
            style.id = 'geofence-marker-animations';
            style.textContent = `
                @keyframes gf-ping { 75%, 100% { transform: scale(2); opacity: 0; } }
                @keyframes gf-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
            `;
            document.head.appendChild(style);
        }

        storeDevices.forEach(device => {
            if (!device.location) return;
            
            // Assume default status color
            const color = statusColors[device.status] || '#6b7280';
            
            // Check if device is assigned to an active Geofence
            let assignedZoneColor: string | null = null;
            geofences.forEach(zone => {
                if (zone.isActive && zone.devices) {
                    const isAssigned = zone.devices.some((d: any) => {
                        const devId = typeof d === 'string' ? d : (d._id || d.id);
                        const storeDevId = (device as any)._id || device.id;
                        return devId === storeDevId;
                    });
                    if (isAssigned && !assignedZoneColor) {
                        assignedZoneColor = zone.color;
                    }
                }
            });

            const isMoving = device.status === 'moving';

            const icon = L.divIcon({
                className: 'custom-marker',
                html: `
                    <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
                        ${assignedZoneColor 
                            ? `<div style="position:absolute;width:22px;height:22px;border-radius:50%;border:3px solid ${assignedZoneColor};box-shadow:0 0 10px ${assignedZoneColor}, inset 0 0 5px ${assignedZoneColor}; opacity: 0.9;"></div>` 
                            : `<div style="position:absolute;width:18px;height:18px;border-radius:50%;border:2.5px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`}
                        <div style="width:12px;height:12px;background:${color};border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.8);
                            ${isMoving ? 'animation:gf-pulse 2s infinite;' : ''}"></div>
                        ${isMoving ? `<div style="position:absolute;width:28px;height:28px;background:${color};border-radius:50%;opacity:0.3;animation:gf-ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
                    </div>
                `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const statusLabel = device.status === 'moving' ? (lang === 'fr' ? 'En mouvement' : 'Moving') :
                device.status === 'online' ? (lang === 'fr' ? 'En ligne' : 'Online') :
                    device.status === 'idle' ? (lang === 'fr' ? 'Inactif' : 'Idle') :
                        device.status === 'offline' ? (lang === 'fr' ? 'Hors ligne' : 'Offline') :
                            (lang === 'fr' ? 'Alerte' : 'Alert');

            const popup = `
                <div style="min-width:200px;font-family:Inter,sans-serif;">
                    <h3 style="margin:0 0 4px;font-weight:600;font-size:13px;">${device.name}</h3>
                    <p style="margin:0 0 6px;font-size:11px;color:#888;">${device.enterpriseName || ''}</p>
                    <div style="display:flex;gap:8px;font-size:11px;flex-wrap:wrap;">
                        <span style="color:${color};font-weight:500;">${statusLabel}</span>
                        <span>${device.speed || 0} km/h</span>
                        <span>🔋 ${device.battery || 0}%</span>
                    </div>
                </div>
            `;

            L.marker([device.location.lat, device.location.lng], { icon })
                .addTo(devicesLayerRef.current!)
                .bindPopup(popup);
        });

        // Auto-fit bounds on first load ONLY
        if (storeDevices.length > 0 && mapRef.current && !autoFitDone.current) {
            const validDevices = storeDevices.filter(d => d.location?.lat && d.location?.lng);
            if (validDevices.length > 0) {
                const bounds = L.latLngBounds(validDevices.map(d => [d.location.lat, d.location.lng]));
                mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
                autoFitDone.current = true;
            }
        }
    }, [storeDevices, geofences, lang]);

    // ─── Drawing mode ──────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || !drawLayerRef.current) return;
        const map = mapRef.current;
        drawLayerRef.current.clearLayers();

        if (drawMode === 'idle') {
            map.getContainer().style.cursor = '';
            return;
        }

        map.getContainer().style.cursor = 'crosshair';

        if (drawMode === 'circle') {
            const handler = (e: L.LeafletMouseEvent) => {
                const { lat, lng } = e.latlng;
                setForm(prev => ({ ...prev, center: { lat, lng } }));
                drawLayerRef.current!.clearLayers();
                L.circle([lat, lng], {
                    radius: form.radius,
                    color: form.color,
                    fillColor: form.color,
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '6 4',
                }).addTo(drawLayerRef.current!);
                setDrawMode('idle');
                map.getContainer().style.cursor = '';
            };
            map.once('click', handler);
            return () => { map.off('click', handler); };
        }

        if (drawMode === 'polygon') {
            const points: L.LatLng[] = [];
            let polyline: L.Polyline | null = null;
            let polygon: L.Polygon | null = null;

            const handler = (e: L.LeafletMouseEvent) => {
                points.push(e.latlng);

                drawLayerRef.current!.clearLayers();
                points.forEach(p => {
                    L.circleMarker(p, { radius: 5, color: form.color, fillColor: form.color, fillOpacity: 1 })
                        .addTo(drawLayerRef.current!);
                });

                if (points.length >= 2) {
                    polyline = L.polyline(points, { color: form.color, dashArray: '6 4' })
                        .addTo(drawLayerRef.current!);
                }

                if (points.length >= 3) {
                    // Double click to finish
                    polygon = L.polygon(points, {
                        color: form.color,
                        fillColor: form.color,
                        fillOpacity: 0.15,
                        weight: 2,
                        dashArray: '6 4',
                    });
                }
            };

            const finishHandler = () => {
                if (points.length >= 3) {
                    drawLayerRef.current!.clearLayers();
                    polygon?.addTo(drawLayerRef.current!);
                    setForm(prev => ({
                        ...prev,
                        polygon: points.map(p => ({ lat: p.lat, lng: p.lng })),
                    }));
                    map.off('click', handler);
                    setDrawMode('idle');
                    map.getContainer().style.cursor = '';
                }
            };

            map.on('click', handler);
            map.on('dblclick', finishHandler);
            return () => {
                map.off('click', handler);
                map.off('dblclick', finishHandler);
            };
        }
    }, [drawMode, form.radius, form.color]);

    // ─── Preview drawn shape when radius changes ───────────────────
    useEffect(() => {
        if (!drawLayerRef.current || !form.center) return;
        drawLayerRef.current.clearLayers();
        L.circle([form.center.lat, form.center.lng], {
            radius: form.radius,
            color: form.color,
            fillColor: form.color,
            fillOpacity: 0.2,
            weight: 2,
            dashArray: '6 4',
        }).addTo(drawLayerRef.current);
    }, [form.radius, form.color, form.center]);

    // ─── CRUD ──────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.name.trim()) { toast.error(lang === 'fr' ? 'Nom requis' : 'Name required'); return; }
        if (form.type === 'circle' && !form.center) { toast.error(lang === 'fr' ? 'Placez le centre sur la carte' : 'Place the center on the map'); return; }
        if (form.type === 'polygon' && form.polygon.length < 3) { toast.error(lang === 'fr' ? 'Dessinez au moins 3 points' : 'Draw at least 3 points'); return; }

        const payload: any = {
            name: form.name,
            type: form.type,
            color: form.color,
            devices: form.devices,
            alertOnExit: form.alertOnExit,
            alertOnEntry: form.alertOnEntry,
            isActive: form.isActive,
            enterpriseId: form.enterpriseId || (useAuthStore.getState().user as any)?.enterpriseId || (allDevices[0] as any)?.enterpriseId,
            createdBy: (useAuthStore.getState().user as any)?.id,
        };
        if (form.type === 'circle') {
            payload.center = form.center;
            payload.radius = form.radius;
        } else {
            payload.polygon = form.polygon;
        }

        try {
            if (editingId) {
                await geofencesApi.update(editingId, payload);
                toast.success(lang === 'fr' ? 'Zone mise à jour' : 'Zone updated');
            } else {
                await geofencesApi.create(payload);
                toast.success(lang === 'fr' ? 'Zone créée' : 'Zone created');
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            toast.error('Error', { description: err.message });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(lang === 'fr' ? 'Supprimer cette zone ?' : 'Delete this zone?')) return;
        try {
            await geofencesApi.delete(id);
            toast.success(lang === 'fr' ? 'Zone supprimée' : 'Zone deleted');
            fetchData();
        } catch (err: any) {
            toast.error('Error', { description: err.message });
        }
    };

    const handleEdit = (zone: any) => {
        setForm({
            name: zone.name,
            type: zone.type,
            color: zone.color,
            center: zone.center || null,
            radius: zone.radius || 500,
            polygon: zone.polygon || [],
            devices: zone.devices?.map((d: any) => d._id || d) || [],
            alertOnExit: zone.alertOnExit,
            alertOnEntry: zone.alertOnEntry,
            isActive: zone.isActive,
            enterpriseId: zone.enterpriseId,
        });
        setEditingId(zone._id);
        setShowForm(true);

        // Center map on zone
        if (zone.type === 'circle' && zone.center) {
            mapRef.current?.flyTo([zone.center.lat, zone.center.lng], 14);
        } else if (zone.polygon?.length) {
            const bounds = L.latLngBounds(zone.polygon.map((p: any) => [p.lat, p.lng]));
            mapRef.current?.flyToBounds(bounds, { padding: [50, 50] });
        }
    };

    const handleToggleActive = async (zone: any) => {
        try {
            await geofencesApi.update(zone._id, { isActive: !zone.isActive });
            fetchData();
        } catch (err: any) {
            toast.error('Error', { description: err.message });
        }
    };

    const handleCheckDevices = async () => {
        try {
            const result = await geofencesApi.checkAll();
            toast.success(
                lang === 'fr'
                    ? `${result.checked} zones vérifiées, ${result.alertsCreated} alertes créées`
                    : `${result.checked} zones checked, ${result.alertsCreated} alerts created`
            );
        } catch (err: any) {
            toast.error('Error', { description: err.message });
        }
    };

    const resetForm = () => {
        setForm({
            name: '', type: 'circle', color: ZONE_COLORS[Math.floor(Math.random() * ZONE_COLORS.length)],
            center: null, radius: 500, polygon: [], devices: [], alertOnExit: true,
            alertOnEntry: false, isActive: true, enterpriseId: '',
        });
        setShowForm(false);
        setEditingId(null);
        setDrawMode('idle');
        drawLayerRef.current?.clearLayers();
    };

    const toggleDevice = (deviceId: string) => {
        setForm(prev => ({
            ...prev,
            devices: prev.devices.includes(deviceId)
                ? prev.devices.filter(d => d !== deviceId)
                : [...prev.devices, deviceId],
        }));
    };

    const totalAssigned = geofences.reduce((sum, z) => sum + (z.devices?.length || 0), 0);

    return (
        <DashboardLayout>
            <div className="flex h-screen overflow-hidden">
                {/* ── Left Panel ──────────────────────────────────── */}
                <div className="w-[380px] shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-border space-y-3 shrink-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-bold flex items-center gap-2">
                                    <Hexagon className="w-5 h-5 text-[#00E599]" />
                                    {t.title}
                                </h1>
                                <p className="text-xs text-muted-foreground mt-0.5">{t.subtitle}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-2">
                            <div className="flex-1 rounded-lg bg-muted/30 border border-border px-3 py-2">
                                <p className="text-xl font-bold">{geofences.length}</p>
                                <p className="text-[10px] text-muted-foreground">{t.zoneCount}</p>
                            </div>
                            <div className="flex-1 rounded-lg bg-muted/30 border border-border px-3 py-2">
                                <p className="text-xl font-bold text-[#00E599]">{totalAssigned}</p>
                                <p className="text-[10px] text-muted-foreground">{t.deviceCount}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            {user?.email !== 'demo@geotrack.tn' && (
                                <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}
                                    className="flex-1 bg-[#00E599] text-black hover:bg-[#00D48A] gap-1">
                                    <Plus className="w-4 h-4" /> {t.newZone}
                                </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={handleCheckDevices} className="gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> {t.checkDevices}
                            </Button>
                        </div>
                    </div>

                    {/* Zone List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : geofences.length === 0 ? (
                            <div className="text-center py-12">
                                <Hexagon className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium text-muted-foreground">{t.noZones}</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">{t.noZonesDesc}</p>
                            </div>
                        ) : geofences.map(zone => (
                            <div key={zone._id}
                                className="rounded-xl border border-border bg-card hover:border-[#00E599]/20 transition-all group">
                                {/* Zone header */}
                                <div className="px-3 py-2.5 flex items-center gap-2.5 cursor-pointer"
                                    onClick={() => setExpandedZone(expandedZone === zone._id ? null : zone._id)}>
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{zone.name}</p>
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            {zone.type === 'circle' ? <CircleDot className="w-3 h-3" /> : <Pentagon className="w-3 h-3" />}
                                            {zone.type === 'circle' ? `${t.circle} · ${zone.radius}m` : `${t.polygon} · ${zone.polygon?.length || 0} pts`}
                                            <span className="mx-1">·</span>
                                            <Radio className="w-3 h-3" /> {zone.devices?.length || 0}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${zone.isActive
                                        ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                                        : 'bg-red-400/10 text-red-400 border border-red-400/20'
                                        }`}>
                                        {zone.isActive ? t.active : t.inactive}
                                    </span>
                                    {expandedZone === zone._id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                </div>

                                {/* Expanded details */}
                                {expandedZone === zone._id && (
                                    <div className="px-3 pb-3 border-t border-border/50 pt-2 space-y-2">
                                        {zone.devices?.length > 0 && (
                                            <div className="space-y-1">
                                                {zone.devices.map((dev: any) => (
                                                    <div key={dev._id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${dev.status === 'online' || dev.status === 'moving' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                        {dev.name}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 pt-1">
                                            {user?.email !== 'demo@geotrack.tn' && (
                                                <>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleEdit(zone)}>
                                                        <Edit3 className="w-3 h-3" /> {t.edit}
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => handleToggleActive(zone)}>
                                                        {zone.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                                        {zone.isActive ? t.inactive : t.active}
                                                    </Button>
                                                    {(user?.role === 'admin' || zone.enterpriseId === user?.enterpriseId) && (
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-red-400 hover:text-red-300 ml-auto" onClick={() => handleDelete(zone._id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Right Panel: Map ────────────────────────────── */}
                <div className="flex-1 relative">
                    <div ref={mapContainerRef} className="absolute inset-0 z-0" />

                    {/* Map Layer Switcher */}
                    <div className="absolute top-3 right-3 z-[500]" onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
                        <div className="relative">
                            <button
                                onClick={() => setShowLayerMenu(!showLayerMenu)}
                                className="flex items-center gap-2 px-3 py-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg shadow-lg hover:bg-card transition-colors"
                            >
                                <Layers className="w-4 h-4" />
                                <span className="text-sm font-medium">{MAP_LAYERS[mapLayer].name}</span>
                            </button>

                            {showLayerMenu && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl overflow-hidden">
                                    {(Object.keys(MAP_LAYERS) as MapLayerType[]).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => { setMapLayer(type); setShowLayerMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary/50 transition-colors ${mapLayer === type ? 'bg-primary/10 text-primary' : ''
                                                }`}
                                        >
                                            {type === 'satellite' && <Satellite className="w-4 h-4" />}
                                            {type === 'terrain' && <Mountain className="w-4 h-4" />}
                                            {type === 'street' && <MapIcon className="w-4 h-4" />}
                                            {type === 'dark' && <Layers className="w-4 h-4" />}
                                            <span>{MAP_LAYERS[type].name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Device count + live indicator */}
                    <div className="absolute bottom-4 left-4 z-[500] flex items-center gap-2">
                        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-foreground">{storeDevices.length}</span> {lang === 'fr' ? 'appareils' : 'devices'}
                                {geofences.length > 0 && <> · <span className="text-[#00E599] font-semibold">{geofences.length}</span> zones</>}
                            </p>
                        </div>
                        <div className="bg-card/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-sm font-medium">Live</span>
                        </div>
                    </div>

                    {/* Draw hint banner */}
                    {drawMode !== 'idle' && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-xl bg-[#00E599] text-black font-semibold text-sm shadow-lg flex items-center gap-2 animate-in fade-in"
                             onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
                            <MapPin className="w-4 h-4" />
                            {drawMode === 'circle' ? t.drawCircle : t.drawPolygon}
                            <Button size="sm" variant="ghost" className="h-6 ml-2 text-black/60 hover:text-black" onClick={() => setDrawMode('idle')}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* ── Create/Edit Form (Overlay) ──────────────── */}
                    {showForm && (
                        <div className="absolute bottom-4 left-4 z-[500] w-[360px] bg-card border border-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4"
                             onMouseDown={e => e.stopPropagation()} 
                             onClick={e => e.stopPropagation()} 
                             onDoubleClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-border flex items-center justify-between">
                                <h3 className="font-bold text-sm flex items-center gap-2">
                                    <Hexagon className="w-4 h-4 text-[#00E599]" />
                                    {editingId ? t.edit : t.newZone}
                                </h3>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetForm}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                {/* Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">{t.zoneName}</label>
                                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder={lang === 'fr' ? 'Ex: Zone Tunis Centre' : 'Ex: Tunis Center Zone'}
                                        className="bg-background h-9 text-sm" />
                                </div>

                                {/* Color */}
                                <div className="space-y-1 w-full">
                                    <label className="text-xs font-medium">{t.color}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {ZONE_COLORS.slice(0, 5).map(c => (
                                            <button key={c} onClick={() => setForm({ ...form, color: c, type: 'circle' })}
                                                className={`w-8 h-8 rounded-full border-2 transition-all shadow-sm ${form.color === c ? 'border-foreground scale-110 shadow-md ring-2 ring-foreground/20' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }} />
                                        ))}
                                    </div>
                                </div>

                                {/* Draw button */}
                                <Button variant="outline" size="sm" className="w-full gap-2 border-dashed bg-secondary/30 hover:bg-secondary/50"
                                    onClick={() => { setForm({ ...form, type: 'circle' }); setDrawMode('circle'); }}>
                                    <MapPin className="w-4 h-4 text-[#00E599]" /> {t.drawOnMap}
                                </Button>

                                {/* Radius */}
                                <div className="space-y-1 bg-secondary/20 p-3 rounded-lg border border-border/50">
                                    <div className="flex items-center justify-between">
                                      <label className="text-xs font-medium text-muted-foreground">{t.radius}</label>
                                      <span className="text-xs font-bold text-foreground">{form.radius}m</span>
                                    </div>
                                    <input type="range" min={100} max={5000} step={100} value={form.radius}
                                        onChange={e => setForm({ ...form, radius: parseInt(e.target.value) })}
                                        className="w-full accent-[#00E599] h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer" />
                                </div>

                                {/* Status indicator */}
                                {form.center && (
                                    <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {lang === 'fr' ? 'Centre placé avec succès' : 'Center placed successfully'} ({form.center.lat.toFixed(4)}, {form.center.lng.toFixed(4)})
                                    </div>
                                )}

                                {/* Alert toggles */}
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={form.alertOnExit}
                                            onChange={e => setForm({ ...form, alertOnExit: e.target.checked })}
                                            className="accent-[#00E599]" />
                                        {t.alertExit}
                                    </label>
                                    <label className="flex items-center gap-2 text-xs cursor-pointer">
                                        <input type="checkbox" checked={form.alertOnEntry}
                                            onChange={e => setForm({ ...form, alertOnEntry: e.target.checked })}
                                            className="accent-[#00E599]" />
                                        {t.alertEntry}
                                    </label>
                                </div>

                                {/* Device selection */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium">{t.devices}</label>
                                    <div className="max-h-[140px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                                        {allDevices.map(dev => (
                                            <label key={dev._id || dev.id}
                                                className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors">
                                                <input type="checkbox"
                                                    checked={form.devices.includes(dev._id || dev.id)}
                                                    onChange={() => toggleDevice(dev._id || dev.id)}
                                                    className="accent-[#00E599]" />
                                                <div className={`w-2 h-2 rounded-full ${dev.status === 'online' || dev.status === 'moving' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                                <span className="text-xs flex-1 truncate">{dev.name}</span>
                                                <span className="text-[10px] text-muted-foreground">{dev.imei?.slice(-6)}</span>
                                            </label>
                                        ))}
                                        {allDevices.length === 0 && (
                                            <p className="text-xs text-muted-foreground p-3">{lang === 'fr' ? 'Aucun appareil' : 'No devices'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Form buttons */}
                            <div className="p-4 border-t border-border flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={resetForm}>{t.cancel}</Button>
                                <Button size="sm" className="flex-1 bg-[#00E599] text-black hover:bg-[#00D48A]" onClick={handleSave}>{t.save}</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default GeofencesPage;
