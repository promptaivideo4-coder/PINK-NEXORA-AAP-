import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import { NavigationProps } from '../types';
import { Navigation as NavIcon, MapPin, LocateFixed, ShieldAlert, RefreshCw, WifiOff, Clock, Ruler, Satellite } from 'lucide-react';
import {
  LocationTracker,
  GeoLocation,
  LocationPermission,
  SalonWithCoords,
  SalonDistance,
  sortSalonsByDistance,
  getLocationLog,
  clearLocationLog,
  LOCATION_CONFIG,
  PERMISSION_DENIED_MESSAGE,
} from '../lib/geolocation';

/* Demo salon dataset — DB me lat/lng hon to yahan se replace ho jayega.
   Coordinates: Jaipur ke aas-paas. */
const DEMO_SALONS: SalonWithCoords[] = [
  { id: 's1', name: 'Glamour Salon — C-Scheme', latitude: 26.9124, longitude: 75.7873, address: 'C-Scheme, Jaipur', city: 'Jaipur', ratingAverage: 4.8 },
  { id: 's2', name: 'Luxe Beauty Lounge — MI Road', latitude: 26.8920, longitude: 75.7960, address: 'MI Road, Jaipur', city: 'Jaipur', ratingAverage: 4.6 },
  { id: 's3', name: 'Rajwada Salon — Johari Bazar', latitude: 26.9260, longitude: 75.8235, address: 'Johari Bazar, Jaipur', city: 'Jaipur', ratingAverage: 4.5 },
  { id: 's4', name: 'Pink City Cuts — Hawa Mahal', latitude: 26.9239, longitude: 75.8267, address: 'Hawa Mahal Rd, Jaipur', city: 'Jaipur', ratingAverage: 4.7 },
  { id: 's5', name: 'Sunrise Unisex Salon — Tonk Rd', latitude: 26.8800, longitude: 75.8080, address: 'Tonk Road, Jaipur', city: 'Jaipur', ratingAverage: 4.2 },
  { id: 's6', name: 'Bold Beauty Studio — Malviya Nagar', latitude: 26.8575, longitude: 75.8150, address: 'Malviya Nagar, Jaipur', city: 'Jaipur', ratingAverage: 4.4 },
];

const PERMISSION_LABEL: Record<string, string> = {
  granted: '✅ Granted',
  denied: '❌ Denied',
  prompt: '⏳ Ask on next access',
  unsupported: '🚫 Not supported',
  unknown: '❔ Unknown',
};

function fmtDistance(km: number | null): string {
  if (km === null) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function NearbySalons({ navigate }: NavigationProps) {
  const trackerRef = useRef<LocationTracker | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = new LocationTracker();
  }
  const tracker = trackerRef.current;

  const [watchOn, setWatchOn] = useState(false);
  const [acceptedFix, setAcceptedFix] = useState<GeoLocation | null>(null);
  const [rawFix, setRawFix] = useState<GeoLocation | null>(null);
  const [permission, setPermission] = useState<LocationPermission>('unknown');
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [movedNotif, setMovedNotif] = useState<string | null>(null);
  const [logs, setLogs] = useState(getLocationLog());
  const [sorted, setSorted] = useState<SalonDistance[]>(() => sortSalonsByDistance(DEMO_SALONS, null));
  const logEndRef = useRef<HTMLDivElement>(null);

  // Wire tracker callbacks once
  useEffect(() => {
    const t = trackerRef.current!;

    // Wrapper jo React state me mirror karta hai
    const origStart = t.start.bind(t);
    const origStop = t.stop.bind(t);
    const origRestart = t.restart.bind(t);

    (t as unknown as { __mirror: unknown }).__mirror = true;

    // Simple approach: re-create tracker with callbacks on mount
    const live = new LocationTracker({
      onRawUpdate: (_fix, s) => {
        setRawFix(s.lastFix);
        setPermission(s.permission);
        setLogs(getLocationLog());
      },
      onAcceptedFix: (fix, s) => {
        setAcceptedFix(fix);
        setPermission(s.permission);
        setLogs(getLocationLog());
        setMovedNotif(null);
        setSorted(sortSalonsByDistance(DEMO_SALONS, { latitude: fix.latitude, longitude: fix.longitude }));
      },
      onMoved: (_from, to, dist) => {
        setMovedNotif(`📡 Moved ${dist} m — location refreshed (${to.latitude.toFixed(5)}, ${to.longitude.toFixed(5)})`);
        setLogs(getLocationLog());
      },
      onPermissionDenied: () => {
        setPermissionDenied(true);
        setErrorMsg(PERMISSION_DENIED_MESSAGE);
        setLogs(getLocationLog());
      },
      onError: (_code, msg) => {
        setErrorMsg(msg);
        setLogs(getLocationLog());
      },
      onWatchStateChange: (active) => setWatchOn(active),
    });

    // Tracker ko start/stop ke liye expose karo
    (trackerRef as unknown as { live: LocationTracker }).live = live;

    return () => {
      live.stop();
      void origStart; void origStop; void origRestart;
    };
  }, []);

  const doStart = () => {
    setPermissionDenied(false);
    setErrorMsg(null);
    setMovedNotif(null);
    const live = (trackerRef as unknown as { live?: LocationTracker }).live;
    (live || tracker).restart();
    setLogs(getLocationLog());
  };

  const doStop = () => {
    const live = (trackerRef as unknown as { live?: LocationTracker }).live;
    (live || tracker).stop();
    setLogs(getLocationLog());
  };

  const doClearLogs = () => {
    clearLocationLog();
    setLogs([]);
  };

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [logs]);

  return (
    <Layout currentScreen="nearby-salons" navigate={navigate} title="Nearby Salons" showBack onBack={() => navigate('dashboard')}>
      <div className="px-4 py-5 flex flex-col gap-5 max-w-md mx-auto w-full pb-28">

        {/* ===== Permission denied banner (requirement #11) ===== */}
        {permissionDenied && (
          <div className="bg-error/10 border border-error/25 rounded-2xl p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-error">{PERMISSION_DENIED_MESSAGE}</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Browser settings → Location → Allow, phir yahan wapas aakar "Start GPS" dabao.
              </p>
            </div>
          </div>
        )}

        {/* ===== Live location card ===== */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              <LocateFixed className="w-4 h-4 text-primary" /> My Location
            </h2>
            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${watchOn ? 'bg-emerald-500/15 text-emerald-700' : 'bg-surface-variant text-on-surface-variant'}`}>
              {watchOn ? '● Watching' : '○ Stopped'}
            </span>
          </div>

          {/* Config row */}
          <div className="flex flex-wrap gap-2 text-[10.5px] font-bold text-on-surface-variant">
            <span className="bg-surface-container-high px-2 py-1 rounded-lg inline-flex items-center gap-1"><Ruler className="w-3 h-3" /> acc ≤ {LOCATION_CONFIG.ACCEPT_ACCURACY_M}m</span>
            <span className="bg-surface-container-high px-2 py-1 rounded-lg inline-flex items-center gap-1"><RefreshCw className="w-3 h-3" /> refresh ≥ {LOCATION_CONFIG.MOVEMENT_THRESHOLD_M}m move</span>
            <span className="bg-surface-container-high px-2 py-1 rounded-lg inline-flex items-center gap-1"><Clock className="w-3 h-3" /> timeout {LOCATION_CONFIG.timeout / 1000}s</span>
          </div>

          {/* Permission status (requirement #12) */}
          <p className="text-[11px] font-bold text-on-surface-variant">
            Permission: <span className={permission === 'denied' ? 'text-error' : 'text-emerald-600'}>{PERMISSION_LABEL[permission] || permission}</span>
          </p>

          {/* Accepted fix (requirement #7 — saved values) */}
          <div className="bg-surface-container-low rounded-xl p-3 font-mono text-[12px] space-y-1">
            {acceptedFix ? (
              <>
                <p><span className="opacity-50">latitude&nbsp;&nbsp;:</span> <b>{acceptedFix.latitude.toFixed(6)}</b></p>
                <p><span className="opacity-50">longitude :</span> <b>{acceptedFix.longitude.toFixed(6)}</b></p>
                <p><span className="opacity-50">accuracy&nbsp;:</span> <b>{acceptedFix.accuracy} m</b></p>
                <p><span className="opacity-50">timestamp:</span> {new Date(acceptedFix.timestamp).toLocaleTimeString()}</p>
                <p><span className="opacity-50">provider&nbsp;:</span>
                  <span className="inline-flex items-center gap-1">
                    <Satellite className="w-3 h-3" /> {acceptedFix.provider}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-on-surface-variant text-[11px]">
                {watchOn
                  ? '⏳ GPS fix ka wait… (accuracy ≤ 30m hone par hi location accept hogi)'
                  : 'Location abhi nahi — "Start GPS Tracking" dabao.'}
              </p>
            )}
          </div>

          {/* Last raw fix — accuracy gate info (requirement #6) */}
          {rawFix && !acceptedFix && (
            <p className="text-[10.5px] text-amber-700 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
              Last raw fix: acc {rawFix.accuracy}m &gt; {LOCATION_CONFIG.ACCEPT_ACCURACY_M}m — better GPS fix ka wait (raw fix kabhi use nahi hota).
            </p>
          )}

          {/* Moved notification (requirement #10) */}
          {movedNotif && (
            <p className="text-[11px] text-primary bg-primary/10 rounded-lg px-2.5 py-2">{movedNotif}</p>
          )}

          {/* Error */}
          {errorMsg && !permissionDenied && (
            <p className="text-[11px] text-error bg-error/10 rounded-lg px-2.5 py-2">{errorMsg}</p>
          )}

          {/* Controls */}
          <div className="flex gap-2 pt-1">
            {!watchOn ? (
              <button onClick={doStart} className="flex-1 bg-primary text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
                <LocateFixed className="w-4 h-4" /> Start GPS Tracking
              </button>
            ) : (
              <button onClick={doStop} className="flex-1 bg-surface-container-high text-on-surface font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                <WifiOff className="w-4 h-4" /> Stop
              </button>
            )}
            <button onClick={doClearLogs} className="px-3 py-3 rounded-xl bg-surface-variant text-on-surface-variant text-xs font-bold active:scale-95">
              Clear log
            </button>
          </div>
        </div>

        {/* ===== Salons sorted by distance (requirements #8, #9) ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold flex items-center gap-2">
              <NavIcon className="w-4 h-4 text-primary" /> Salons by Distance
            </h2>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              {acceptedFix ? `${sorted.filter((s) => s.distanceKm !== null).length} nearest` : 'needs location'}
            </span>
          </div>

          {!acceptedFix ? (
            <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-2xl p-6 text-center">
              <MapPin className="w-8 h-8 mx-auto text-on-surface-variant/40 mb-2" />
              <p className="text-sm text-on-surface-variant">
                {permissionDenied ? PERMISSION_DENIED_MESSAGE : 'Location enable karo to saare salons distance ke hisaab se sorted dikhenge.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {sorted.map(({ salon, distanceKm }) => (
                <div key={salon.id} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate">{salon.name}</h3>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {salon.address || 'Address unavailable'}
                    </p>
                    {typeof salon.ratingAverage === 'number' && (
                      <p className="text-[10px] font-bold text-amber-600 mt-0.5">★ {salon.ratingAverage.toFixed(1)}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-primary">{fmtDistance(distanceKm)}</p>
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">
                      {distanceKm === null ? 'no coords' : 'away'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== Live log (requirement #12 — complete logging) ===== */}
        <div className="bg-[#0b0f1a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-white/80 uppercase tracking-wider">📍 Live GPS Log</h3>
            <span className="text-[9px] font-bold text-white/40">{logs.length} entries</span>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 font-mono text-[10px] leading-relaxed">
            {logs.length === 0 && <p className="text-white/30">No log entries yet.</p>}
            {logs.map((l, i) => (
              <p key={i} className={
                l.kind === 'accepted' ? 'text-emerald-400' :
                l.kind === 'error' || l.kind === 'permission' ? 'text-red-400' :
                l.kind === 'moved' ? 'text-cyan-400' : 'text-white/60'
              }>
                [{new Date(l.at).toLocaleTimeString()}] {l.message}
              </p>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

        <p className="text-center text-[10px] text-on-surface-variant/70">
          Powered by browser <b>navigator.geolocation</b> (watchPosition · high accuracy) — koi Google/external API use nahi hota.
        </p>
      </div>
    </Layout>
  );
}
