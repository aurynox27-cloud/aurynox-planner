import { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceArea, ResponsiveContainer, CartesianGrid,
} from "recharts";

// ————— Aurynox brand: navy night sky + sage —————
const PALETTE = {
  bg: "#0B1B2B",
  panel: "#102438",
  panelSoft: "#16304A",
  line: "#24405C",
  text: "#F2EDE3",
  dim: "#8FA3B5",
  sage: "#A8C6A0",
  sageDeep: "#7FA277",
  amber: "#E0A458",
  warn: "#C96F5D",
};

const DEFAULT_FORECAST = `12 am\tThunderstorms\t73 °F\t73 °F\t100 %\t0.12 in\t86 %\t70 °F\t90 %\t5 mph ESE\t29.99 in
1 am\tThunderstorms\t71 °F\t71 °F\t96 %\t0.06 in\t100 %\t70 °F\t94 %\t5 mph ESE\t29.98 in
2 am\tThunderstorms\t71 °F\t71 °F\t82 %\t0.06 in\t100 %\t69 °F\t95 %\t4 mph ESE\t29.98 in
3 am\tThunderstorms\t71 °F\t71 °F\t90 %\t0.06 in\t100 %\t69 °F\t96 %\t5 mph E\t29.97 in
4 am\tThunderstorms\t70 °F\t70 °F\t65 %\t0.05 in\t100 %\t69 °F\t97 %\t5 mph E\t29.96 in
5 am\tRain\t71 °F\t73 °F\t95 %\t0.09 in\t100 %\t69 °F\t95 %\t6 mph E\t29.98 in
6 am\tThunderstorms\t71 °F\t73 °F\t97 %\t0.15 in\t100 %\t69 °F\t95 %\t5 mph E\t29.99 in
7 am\tThunderstorms\t69 °F\t72 °F\t99 %\t0.11 in\t100 %\t68 °F\t97 %\t6 mph ENE\t30.00 in
8 am\tThunderstorms\t68 °F\t71 °F\t92 %\t0.04 in\t99 %\t68 °F\t98 %\t7 mph ENE\t30.00 in
9 am\tThunderstorms\t68 °F\t70 °F\t89 %\t0.08 in\t100 %\t67 °F\t100 %\t8 mph ENE\t30.01 in
10 am\tThunderstorms\t68 °F\t70 °F\t69 %\t0.04 in\t97 %\t67 °F\t97 %\t9 mph NE\t30.02 in
11 am\tShowers\t67 °F\t69 °F\t56 %\t0.03 in\t99 %\t67 °F\t98 %\t10 mph NE\t30.02 in
12 pm\tShowers\t68 °F\t70 °F\t54 %\t0.04 in\t98 %\t67 °F\t98 %\t10 mph NE\t30.02 in
1 pm\tRain\t68 °F\t70 °F\t60 %\t0.06 in\t100 %\t67 °F\t97 %\t11 mph NE\t30.02 in
2 pm\tShowers\t69 °F\t71 °F\t53 %\t0.06 in\t98 %\t67 °F\t94 %\t11 mph NE\t30.02 in
3 pm\tShowers\t68 °F\t70 °F\t48 %\t0.03 in\t98 %\t67 °F\t94 %\t12 mph NE\t30.02 in
4 pm\tShowers\t68 °F\t70 °F\t55 %\t0.02 in\t98 %\t66 °F\t93 %\t12 mph NE\t30.02 in
5 pm\tShowers\t68 °F\t70 °F\t45 %\t0.01 in\t97 %\t65 °F\t90 %\t12 mph NE\t30.02 in
6 pm\tCloudy\t68 °F\t70 °F\t24 %\t0 in\t97 %\t64 °F\t87 %\t12 mph NE\t30.02 in
7 pm\tShowers\t68 °F\t69 °F\t35 %\t0.01 in\t97 %\t64 °F\t87 %\t11 mph NE\t30.03 in
8 pm\tShowers\t67 °F\t68 °F\t38 %\t0.01 in\t99 %\t64 °F\t89 %\t11 mph NE\t30.02 in
9 pm\tFew Showers\t66 °F\t67 °F\t34 %\t0.01 in\t99 %\t64 °F\t93 %\t9 mph NE\t30.02 in
10 pm\tFew Showers\t66 °F\t68 °F\t32 %\t0 in\t99 %\t64 °F\t93 %\t8 mph NE\t30.03 in
11 pm\tCloudy\t66 °F\t67 °F\t24 %\t0 in\t98 %\t64 °F\t93 %\t8 mph NE\t30.03 in`;

// Parse a pasted hourly forecast table. Strategy: per line, read the hour from the
// leading "N am/pm", then take °F values in order (temp, feels-like, dew) and
// % values in order (precip, cloud, humidity). Forgiving about tabs vs spaces.
function parseForecast(text) {
  const rows = [];
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const timeMatch = line.match(/^(\d{1,2})\s*(am|pm)/i);
    if (!timeMatch) continue;
    let hour = parseInt(timeMatch[1], 10) % 12;
    if (/pm/i.test(timeMatch[2])) hour += 12;
    const degs = [...line.matchAll(/(-?\d+(?:\.\d+)?)\s*°\s*F/g)].map((m) => parseFloat(m[1]));
    const pcts = [...line.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => parseFloat(m[1]));
    if (degs.length < 1) continue;
    rows.push({
      hour,
      label: `${((hour + 11) % 12) + 1}${hour < 12 ? "am" : "pm"}`,
      outdoor: degs[0],
      dew: degs.length >= 3 ? degs[2] : degs[degs.length - 1],
      precip: pcts.length >= 1 ? pcts[0] : 0,
      cloud: pcts.length >= 2 ? pcts[1] : 50,
      windMatch: (line.match(/(\d+)\s*mph\s*([A-Z]{1,3})/) || [null, null, null]),
    });
  }
  return rows;
}

function counterfactualAC(hour, outdoor) {
  let base;
  if (outdoor <= 70) base = 0.85;
  else if (outdoor <= 75) base = 1.3;
  else if (outdoor <= 80) base = 1.7;
  else if (outdoor <= 85) base = 2.3;
  else if (outdoor <= 90) base = 3.7;
  else base = 5.0;
  if (hour >= 18 && hour <= 21) base = Math.max(base, 3.8);
  return base;
}
function openHourLoad(hour) {
  return hour >= 18 && hour <= 22 ? 1.3 : 0.6;
}

function solarGain(cloudPct, hour, peakHour, width) {
  const clearsky = Math.max(0, Math.min(1, (100 - cloudPct) / 100));
  const bump = Math.max(0, 1 - Math.pow((hour - peakHour) / width, 2));
  return clearsky * bump;
}

const CAPACITY_RATIO = { lt75: 2.09 / 1.54, r75_80: 1.0, r80_85: 2.09 / 2.30, r85_90: 2.09 / 3.74, gt90: 2.09 / 4.95 };
function acRateFor(outdoor, baseRate) {
  if (outdoor <= 75) return baseRate * CAPACITY_RATIO.lt75;
  if (outdoor <= 80) return baseRate * CAPACITY_RATIO.r75_80;
  if (outdoor <= 85) return baseRate * CAPACITY_RATIO.r80_85;
  if (outdoor <= 90) return baseRate * CAPACITY_RATIO.r85_90;
  return baseRate * CAPACITY_RATIO.gt90;
}

function simulate(rows, params) {
  const {
    indoorStart, startIdx, aOpen, aClosed, dewMax, precipMax, cSolar, peakHour, bumpWidth,
    ceiling, peakStart, peakEnd, precoolLead, maxAcRate,
  } = params;

  const staticReasons = rows.map((r) => {
    const rs = [];
    if (r.dew >= dewMax) rs.push(`dew ${r.dew}° ≥ ${dewMax}° limit`);
    if (r.precip >= precipMax) rs.push(`rain risk ${r.precip}%`);
    return rs;
  });
  const elig = staticReasons.map((rs) => rs.length === 0);
  const S = rows.map((r) => solarGain(r.cloud, r.hour, peakHour, bumpWidth));

  let sealedT = indoorStart;
  const sealedTrace = [];
  for (let i = 0; i < rows.length; i++) {
    if (i >= startIdx) sealedT = sealedT + aClosed * (rows[i].outdoor - sealedT) + cSolar * S[i];
    sealedTrace.push(sealedT);
  }

  const step = (T, i, mode) => {
    const r = rows[i];
    if (mode === "open") return T + aOpen * (r.outdoor - T);
    if (mode === "ac") return Math.min(T, ceiling);
    return T + aClosed * (r.outdoor - T) + cSolar * S[i];
  };

  const inPeak = (i) => rows[i].hour >= peakStart && rows[i].hour < peakEnd;

  const mode = new Array(rows.length).fill("pre");
  const temp = new Array(rows.length).fill(indoorStart);
  let T = indoorStart;
  let i = startIdx;
  let peakAvoidedFully = true, peakPrecoolHours = 0, peakForcedAcHours = 0, peakLimitedByLeadTime = false;

  while (i < rows.length) {
    if (inPeak(i) && (i === startIdx || !inPeak(i - 1))) {
      const const leadStart = startIdx; // search the whole available window, not a fixed hour cap
      let lo = 55, hi = ceiling;
      const peakHoldsAt = (startTemp) => {
        let t = startTemp;
        for (let k = i; k < rows.length && inPeak(k); k++) {
          const wantOpen = elig[k] && rows[k].outdoor < t;
          t = step(t, k, wantOpen ? "open" : "sealed");
          if (t > ceiling + 0.05) return false;
        }
        return true;
      };
      if (peakHoldsAt(hi)) {
        lo = hi;
      } else if (!peakHoldsAt(lo)) {
        peakAvoidedFully = false;
      } else {
        for (let iter = 0; iter < 20; iter++) {
          const mid = (lo + hi) / 2;
          if (peakHoldsAt(mid)) lo = mid; else hi = mid;
        }
      }
      const target = lo;
      if (peakHoldsAt(target) && target < T - 0.1) {
        const gap = T - target;
        let remaining = gap;
        let k = i - 1;
        const used = [];
        while (remaining > 1e-6 && k >= leadStart) {
          const cap = acRateFor(rows[k].outdoor, maxAcRate);
          const drop = Math.min(cap, remaining);
          used.push({ k, drop });
          remaining -= drop;
          k--;
        }
        let t = T;
        for (let u = used.length - 1; u >= 0; u--) {
          const { k: kk, drop } = used[u];
          mode[kk] = "ac-precool";
          temp[kk] = t;
          t -= drop;
          peakPrecoolHours++;
        }
        if (remaining <= 1e-6) {
          T = target;
        } else {
          T = t;
          peakLimitedByLeadTime = true;
          if (!peakHoldsAt(T)) peakAvoidedFully = false;
        }
      }
    }

    if (inPeak(i) && peakAvoidedFully) {
      const wantOpen = elig[i] && rows[i].outdoor < T;
      const m = wantOpen ? "open" : "sealed";
      mode[i] = m; temp[i] = T; T = step(T, i, m);
    } else {
      const wantOpen = elig[i] && rows[i].outdoor < T;
      if (wantOpen) {
        mode[i] = "open"; temp[i] = T; T = step(T, i, "open");
      } else {
        const wouldBe = step(T, i, "sealed");
        if (wouldBe > ceiling) {
          mode[i] = "ac"; temp[i] = T; T = Math.min(T, ceiling);
          if (inPeak(i)) peakForcedAcHours++;
        } else {
          mode[i] = "sealed"; temp[i] = T; T = wouldBe;
        }
      }
    }
    i++;
  }

  const data = rows.map((r, idx) => {
    const active = idx >= startIdx;
    const reasons = [...staticReasons[idx]];
    if (active && mode[idx] === "sealed" && elig[idx] && r.outdoor >= temp[idx]) {
      reasons.push(`outside (${r.outdoor}°) not cooler than inside (${temp[idx].toFixed(0)}°)`);
    }
    if (active && mode[idx] === "ac") reasons.push(`would exceed ${ceiling}° comfort ceiling — AC engaged`);
    if (active && mode[idx] === "ac-precool") reasons.push(`set AC to ${temp[idx].toFixed(0)}°F now, hold through peak start (${peakStart}:00–${peakEnd}:00)`);
    return {
      label: r.label, hour: r.hour, outdoor: r.outdoor, dew: r.dew, precip: r.precip,
      eligible: active && (mode[idx] === "open"),
      reasons,
      sealed: active ? +sealedTrace[idx].toFixed(1) : null,
      plan: active ? +temp[idx].toFixed(1) : null,
      mode: active ? mode[idx] : "pre",
    };
  });

  let openAt = null, closeAt = null, savedKwh = 0, savedCost = 0;
  for (let k = startIdx; k < rows.length; k++) {
    if (mode[k] === "open") {
      if (openAt === null) openAt = k;
      closeAt = null;
      const perHr = Math.max(0, counterfactualAC(rows[k].hour, rows[k].outdoor) - openHourLoad(rows[k].hour));
      savedKwh += perHr; savedCost += perHr * params.rate;
    } else if (openAt !== null && closeAt === null) {
      closeAt = k;
    }
  }

  const windowEndIdx = closeAt !== null ? closeAt - 1 : data.length - 1;
  const startTempAtOpen = openAt !== null ? (data[Math.max(openAt - 1, 0)]?.plan ?? indoorStart) : indoorStart;
  const endTempAtClose = openAt !== null ? data[windowEndIdx]?.plan ?? temp[temp.length - 1] : temp[temp.length - 1];
  const outLowInWindow = openAt !== null
    ? Math.min(...rows.slice(openAt, windowEndIdx + 1).map((r) => r.outdoor))
    : Math.min(...rows.slice(startIdx).map((r) => r.outdoor));
  const drop = openAt !== null ? startTempAtOpen - endTempAtClose : 0;
  const capture = openAt !== null && startTempAtOpen > outLowInWindow
    ? (100 * (startTempAtOpen - endTempAtClose)) / (startTempAtOpen - outLowInWindow) : null;

  const acHours = mode.filter((m) => m === "ac").length;
  const precoolHours = mode.filter((m) => m === "ac-precool").length;

  return {
    data, openAt, closeAt, drop, capture, outLow: outLowInWindow,
    finalPlan: temp[temp.length - 1], finalSealed: sealedTrace[sealedTrace.length - 1],
    savedKwh, savedCost, acHours, precoolHours, peakAvoidedFully, peakForcedAcHours, peakLimitedByLeadTime,
  };
}

function Num({ label, value, onChange, step = 1, width = "5.5rem" }) {
  return (
    <label className="flex flex-col gap-1 text-xs" style={{ color: PALETTE.dim }}>
      <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem", letterSpacing: "0.14em" }}>{label}</span>
      <input
        type="number" value={value} step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="rounded px-2 py-1.5 font-mono text-sm outline-none"
        style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, width }}
      />
    </label>
  );
}

function dewPointF(tempF, rh) {
  const tempC = (tempF - 32) * 5 / 9;
  const a = 17.27, b = 237.3;
  const alpha = (a * tempC) / (b + tempC) + Math.log(Math.max(1, rh) / 100);
  const dewC = (b * alpha) / (a - alpha);
  return dewC * 9 / 5 + 32;
}

// Your Apps Script Web App already handles SwitchBot auth server-side and returns clean JSON —
// no CORS problem (unlike calling SwitchBot directly from a browser) and no credentials needed here.
// Averages every room's temperature found in the response (works with however many sensors exist).
async function fetchAppsScriptIndoorTemp(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Apps Script returned ${res.status} — check the URL is correct and still deployed.`);
  const json = await res.json();
  const temps = [];
  for (const key of Object.keys(json)) {
    const tempC = json[key]?.body?.temperature;
    if (typeof tempC === "number") temps.push({ room: key, f: tempC * 9 / 5 + 32 });
  }
  if (!temps.length) throw new Error("No temperature readings found in the response — check the Apps Script is returning sensor data.");
  const avg = temps.reduce((s, t) => s + t.f, 0) / temps.length;
  return { avg, temps };
}

async function fetchOpenWeatherText(apiKey, zip) {
  const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zip)},US&appid=${apiKey}`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error(`Couldn't look up zip code "${zip}" (status ${geoRes.status}) — check it's a valid 5-digit US zip and your key is active.`);
  const geo = await geoRes.json();
  const { lat, lon } = geo;

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather returned ${res.status} — check your API key and that it's activated (can take ~10 min after signup).`);
  const json = await res.json();
  const list = json.list;

  const hourly = [];
  for (let i = 0; i < list.length - 1 && hourly.length < 30; i++) {
    const a = list[i], b = list[i + 1];
    const ta = new Date(a.dt * 1000);
    for (let h = 0; h < 3; h++) {
      const frac = h / 3;
      const t = new Date(ta.getTime() + h * 3600 * 1000);
      const temp = a.main.temp + (b.main.temp - a.main.temp) * frac;
      const hum = a.main.humidity + (b.main.humidity - a.main.humidity) * frac;
      const cloud = a.clouds.all + (b.clouds.all - a.clouds.all) * frac;
      const pop = ((a.pop ?? 0) + ((b.pop ?? 0) - (a.pop ?? 0)) * frac) * 100;
      const dew = dewPointF(temp, hum);
      const hr = t.getHours();
      const label = `${hr % 12 === 0 ? 12 : hr % 12} ${hr < 12 ? "am" : "pm"}`;
      hourly.push(`${label}\tForecast\t${temp.toFixed(0)} °F\t${temp.toFixed(0)} °F\t${pop.toFixed(0)} %\t0 in\t${cloud.toFixed(0)} %\t${dew.toFixed(0)} °F\t${hum.toFixed(0)} %\t0 mph N\t30.00 in`);
    }
  }
  return hourly.join("\n");
}

export default function AurynoxNightPlanner() {
  const [raw, setRaw] = useState(DEFAULT_FORECAST);
  const [indoorStart, setIndoorStart] = useState(78);
  const [startHour, setStartHour] = useState(8);
  const [aOpen, setAOpen] = useState(0.0677);
  const [aClosed, setAClosed] = useState(0.0105);
  const [cSolar, setCSolar] = useState(0.7071);
  const [peakHour, setPeakHour] = useState(12.5);
  const [bumpWidth, setBumpWidth] = useState(6.0);
  const [ceiling, setCeiling] = useState(76);
  const [peakStart, setPeakStart] = useState(16);
  const [peakEnd, setPeakEnd] = useState(21);
  
  const [maxAcRate, setMaxAcRate] = useState(1.5);
  const [dewMax, setDewMax] = useState(63);
  const [precipMax, setPrecipMax] = useState(40);
  const [rate, setRate] = useState(0.281);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem("aurynox_owm_key") || "");
  useEffect(() => { if (apiKey) localStorage.setItem("aurynox_owm_key", apiKey); }, [apiKey]);
  const [zip, setZip] = useState(() => localStorage.getItem("aurynox_zip") || "07450");
  useEffect(() => { if (zip) localStorage.setItem("aurynox_zip", zip); }, [zip]);
  const [fetchStatus, setFetchStatus] = useState("");

  const [sensorUrl, setSensorUrl] = useState(() => localStorage.getItem("aurynox_sensor_url") || "");
  useEffect(() => { if (sensorUrl) localStorage.setItem("aurynox_sensor_url", sensorUrl); }, [sensorUrl]);
  const [sensorFetchStatus, setSensorFetchStatus] = useState("");

  const [simpleMode, setSimpleMode] = useState(() => localStorage.getItem("aurynox_simple") !== "false");
  useEffect(() => { localStorage.setItem("aurynox_simple", String(simpleMode)); }, [simpleMode]);

  const handleFetchLive = async () => {
    if (!apiKey.trim()) { setFetchStatus("error: paste your OpenWeather API key first"); return; }
    setFetchStatus("loading");
    try {
      const text = await fetchOpenWeatherText(apiKey.trim(), zip.trim());
      setRaw(text);
      setFetchStatus(`ok: fetched live forecast at ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setFetchStatus(`error: ${e.message}`);
    }
  };

  const fetchSensorData = async () => {
    if (!sensorUrl.trim()) { setSensorFetchStatus("error: paste your Apps Script URL first"); return; }
    setSensorFetchStatus("loading");
    try {
      const { avg, temps } = await fetchAppsScriptIndoorTemp(sensorUrl.trim());
      setIndoorStart(+avg.toFixed(1));
      const detail = temps.map((t) => `${t.room}: ${t.f.toFixed(1)}°F`).join(", ");
      setSensorFetchStatus(`ok: avg ${avg.toFixed(1)}°F (${detail}) at ${new Date().toLocaleTimeString()}`);
    } catch (e) {
      setSensorFetchStatus(`error: ${e.message}`);
    }
  };

  const rows = useMemo(() => parseForecast(raw), [raw]);
  const startIdx = useMemo(() => {
    const i = rows.findIndex((r) => r.hour >= startHour);
    return i === -1 ? 0 : i;
  }, [rows, startHour]);

  const sim = useMemo(
    () => (rows.length ? simulate(rows, { indoorStart, startIdx, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, ceiling, peakStart, peakEnd, maxAcRate }) : null),
    [rows, indoorStart, startIdx, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, ceiling, peakStart, peakEnd, maxAcRate]
  );

  const openSegments = useMemo(() => {
    if (!sim) return [];
    const segs = [];
    let cur = null;
    for (const d of sim.data) {
      if (d.mode === "open") {
        if (!cur) cur = { start: d.label, end: d.label, endIsLastRow: false };
        else cur.end = d.label;
      } else if (cur) {
        segs.push(cur);
        cur = null;
      }
    }
    if (cur) { cur.endIsLastRow = true; segs.push(cur); }
    return segs;
  }, [sim]);

  return (
    <div className="min-h-screen w-full" style={{ background: PALETTE.bg, color: PALETTE.text, fontFamily: "'Avenir Next', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="uppercase" style={{ color: PALETTE.sage, letterSpacing: "0.32em", fontSize: "0.68rem" }}>Aurynox</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold" style={{ letterSpacing: "-0.01em" }}>
              Night Planner
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {!simpleMode && (
              <div className="text-xs hidden md:block" style={{ color: PALETTE.dim }}>
                T(t+1) = T + a·(Out−T) + c·Solar(t)
              </div>
            )}
            <button
              onClick={() => setSimpleMode((s) => !s)}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: PALETTE.panelSoft, color: PALETTE.sage, border: `1px solid ${PALETTE.line}` }}
            >
              {simpleMode ? "Simple view" : "Advanced view"}
            </button>
          </div>
        </div>

        {sim && (
          <div
            className="mb-6 rounded-xl p-4"
            style={{
              background: openSegments.length > 0 ? `linear-gradient(135deg, ${PALETTE.panel}, #16341F30)` : PALETTE.panel,
              border: `1px solid ${openSegments.length > 0 ? PALETTE.sageDeep : PALETTE.line}`,
            }}
          >
            {openSegments.length > 0 ? (
              <>
                <div className="uppercase text-xs mb-1" style={{ color: PALETTE.sage, letterSpacing: "0.18em" }}>Tonight</div>
                <div className="text-lg md:text-xl font-semibold">
                  {openSegments.map((seg, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      {seg.start === seg.end || seg.endIsLastRow ? `Open ${seg.start}` : `Open ${seg.start}–${seg.end}`}
                    </span>
                  ))}
                </div>
                {openSegments.some((s) => s.endIsLastRow) && (
                  <div className="text-xs mt-1" style={{ color: PALETTE.warn }}>
                    ⚠ Still open at forecast end — extend the forecast or check by hand.
                  </div>
                )}
                <div className="flex gap-5 text-sm font-mono flex-wrap mt-3">
                  <div><div style={{ color: PALETTE.dim, fontSize: "0.7rem" }}>drop</div><div style={{ color: PALETTE.sage }}>{sim.drop.toFixed(1)}°F</div></div>
                  <div><div style={{ color: PALETTE.dim, fontSize: "0.7rem" }}>end</div><div>{sim.finalPlan.toFixed(1)}°F</div></div>
                  {sim.capture !== null && (
                    <div><div style={{ color: PALETTE.dim, fontSize: "0.7rem" }}>capture</div><div>{sim.capture.toFixed(0)}%</div></div>
                  )}
                  <div title="vs. running AC at these hours/temps, benchmarked to June 2026 measured behavior. Ballpark.">
                    <div style={{ color: PALETTE.dim, fontSize: "0.7rem" }}>saved vs AC</div>
                    <div style={{ color: PALETTE.sage }}>~{sim.savedKwh.toFixed(1)}kWh · ${sim.savedCost.toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="uppercase text-xs mb-1" style={{ color: PALETTE.warn, letterSpacing: "0.18em" }}>Tonight</div>
                <div className="text-lg font-semibold">Keep windows closed.</div>
                <div className="text-xs mt-1" style={{ color: PALETTE.dim }}>
                  No hour clears the dew/rain limits with outdoor cooler than indoor.
                </div>
              </>
            )}
          </div>
        )}

        {sim && (
          <div
            className="mb-6 rounded-xl p-4 flex items-center justify-between flex-wrap gap-2"
            style={{
              background: PALETTE.panel,
              border: `1px solid ${sim.peakAvoidedFully ? PALETTE.sageDeep : PALETTE.warn}`,
            }}
          >
            <div>
              <div className="uppercase text-xs mb-1" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
                Peak {peakStart}:00–{peakEnd}:00
              </div>
              {sim.peakAvoidedFully && !sim.peakLimitedByLeadTime ? (
                <div className="text-sm" style={{ color: PALETTE.sage }}>
                  No AC needed during peak.
                  {sim.precoolHours > 0 ? ` Pre-cooling ${sim.precoolHours}hr before covers it.` : " Stays under ceiling on its own."}
                </div>
              ) : sim.peakLimitedByLeadTime && sim.peakAvoidedFully ? (
                <div className="text-sm" style={{ color: PALETTE.amber }}>
                  Tight — used all {sim.precoolHours}hr of available lead time, just made it. Extending the forecast further back would help.
                </div>
              ) : sim.peakLimitedByLeadTime ? (
                <div className="text-sm" style={{ color: PALETTE.warn }}>
                  Not enough lead time to precool fully — peak entry will run warm.
                </div>
              ) : (
                <div className="text-sm" style={{ color: PALETTE.warn }}>
                  Couldn't avoid AC during peak — {sim.peakForcedAcHours}hr needed. Genuinely hot/long event.
                </div>
              )}
            </div>
            <div className="text-xs font-mono" style={{ color: PALETTE.dim }}>
              AC hrs: <span style={{ color: PALETTE.text }}>{sim.acHours}</span> · precool: <span style={{ color: PALETTE.text }}>{sim.precoolHours}</span>
            </div>
          </div>
        )}

        {sim && (
          <div className="mb-6">
            <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
              24-hour plan · ventilate / coast / AC
            </div>
            <div className="flex w-full overflow-hidden rounded-lg" style={{ border: `1px solid ${PALETTE.line}` }}>
              {sim.data.map((d, i) => {
                const bg =
                  d.mode === "open" ? PALETTE.sageDeep :
                  d.mode === "ac" ? PALETTE.warn :
                  d.mode === "ac-precool" ? PALETTE.amber :
                  d.mode === "sealed" ? "#2C3E4A" :
                  PALETTE.panel;
                const modeLabel =
                  d.mode === "open" ? "OPEN (ventilate)" :
                  d.mode === "ac" ? "AC (comfort)" :
                  d.mode === "ac-precool" ? "AC (pre-cool for peak)" :
                  d.mode === "sealed" ? "COAST (sealed, no action)" : "";
                return (
                  <div key={i} className="flex-1 text-center py-2"
                    title={`${d.label} · out ${d.outdoor}° · dew ${d.dew}° · precip ${d.precip}%${d.reasons.length ? " — " + d.reasons.join("; ") : modeLabel ? " — " + modeLabel : ""}`}
                    style={{ background: bg, borderLeft: i > 0 ? `1px solid ${PALETTE.bg}` : "none", minWidth: 0 }}
                  >
                    <div className="font-mono" style={{ fontSize: "0.55rem", color: d.mode === "sealed" || d.mode === "pre" ? PALETTE.dim : PALETTE.text }}>
                      {d.hour % 3 === 0 ? d.label : "·"}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 text-xs flex-wrap" style={{ color: PALETTE.dim }}>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: PALETTE.sageDeep }} />ventilate</span>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: "#2C3E4A" }} />coast</span>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: PALETTE.amber }} />AC (pre-cool)</span>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: PALETTE.warn }} />AC (comfort)</span>
            </div>
          {(() => {
              // Categorize each reason by TYPE (dew/rain/ceiling/etc), separate from its specific
              // number, so consecutive hours merge whenever the underlying story is the same —
              // showing "dew 64-67° (limit 65°)" as one line instead of several near-duplicates.
              const categorize = (r) => {
                let m = r.match(/dew (-?[\d.]+)° ≥ ([\d.]+)° limit/);
                if (m) return { type: "dew", val: +m[1], limit: +m[2] };
                m = r.match(/rain risk ([\d.]+)%/);
                if (m) return { type: "rain", val: +m[1] };
                m = r.match(/outside \((-?[\d.]+)°\) not cooler than inside \((-?[\d.]+)°\)/);
                if (m) return { type: "notCooler", out: +m[1], inside: +m[2] };
                m = r.match(/would exceed ([\d.]+)° comfort ceiling/);
                if (m) return { type: "ceiling", val: +m[1] };
                m = r.match(/set AC to ([\d.]+)°F now, hold through peak start \((\d+):00–(\d+):00\)/);
                if (m) return { type: "precool", val: +m[1], ps: m[2], pe: m[3] };
                return { type: "other", raw: r };
              };

              const spans = [];
              let cur = null;
              for (const d of sim.data) {
                if (!d.reasons.length) { cur = null; continue; }
                const cats = d.reasons.map(categorize);
                const typeKey = cats.map((c) => c.type).sort().join(",");
                if (cur && cur.typeKey === typeKey) {
                  cur.end = d.label;
                  cats.forEach((c, idx) => cur.cats[idx].push(c));
                } else {
                  cur = { typeKey, start: d.label, end: d.label, cats: cats.map((c) => [c]) };
                  spans.push(cur);
                }
              }
              if (!spans.length) return null;

              const renderCat = (group) => {
                const first = group[0];
                if (first.type === "dew") {
                  const vals = group.map((g) => g.val);
                  const lo = Math.min(...vals), hi = Math.max(...vals);
                  return `dew ${lo === hi ? lo : `${lo}–${hi}`}° (limit ${first.limit}°)`;
                }
                if (first.type === "rain") {
                  const vals = group.map((g) => g.val);
                  const lo = Math.min(...vals), hi = Math.max(...vals);
                  return `rain risk ${lo === hi ? lo : `${lo}–${hi}`}%`;
                }
                if (first.type === "notCooler") return `outside not yet cooler than inside`;
                if (first.type === "ceiling") return `would exceed ${first.val}° comfort ceiling — AC engaged`;
                if (first.type === "precool") return `set AC to ${first.val}°F now, hold through peak start (${first.ps}:00–${first.pe}:00)`;
                return first.raw;
              };

              return (
                <div className="mt-3 rounded-lg p-3" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
                  <div className="uppercase text-xs mb-2" style={{ color: PALETTE.warn, letterSpacing: "0.18em" }}>Why not ventilating</div>
                  <div className="flex flex-col gap-1">
                    {spans.map((s, i) => (
                      <div key={i} className="text-sm flex gap-3 items-baseline">
                        <span className="font-mono shrink-0" style={{ color: PALETTE.amber, fontSize: "0.78rem" }}>
                          {s.start === s.end ? s.start : `${s.start}–${s.end}`}
                        </span>
                        <span style={{ color: PALETTE.text }}>{s.cats.map(renderCat).join("; ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          
          </div>
        )}

        {sim && !simpleMode && (
          <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={sim.data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={PALETTE.line} strokeDasharray="2 6" />
                <XAxis dataKey="label" tick={{ fill: PALETTE.dim, fontSize: 11 }} interval={2} />
                <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fill: PALETTE.dim, fontSize: 11 }} unit="°" />
                <Tooltip
                  contentStyle={{ background: PALETTE.panelSoft, border: `1px solid ${PALETTE.line}`, borderRadius: 8, color: PALETTE.text }}
                  labelStyle={{ color: PALETTE.sage }}
                />
                <Legend wrapperStyle={{ color: PALETTE.dim, fontSize: 12 }} />
                {sim.openAt !== null && (
                  <ReferenceArea
                    x1={sim.data[sim.openAt].label}
                    x2={sim.data[sim.closeAt !== null ? sim.closeAt : sim.data.length - 1].label}
                    fill={PALETTE.sageDeep} fillOpacity={0.12}
                  />
                )}
                <Line type="monotone" dataKey="outdoor" name="Outdoor" stroke={PALETTE.dim} strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
                <Line type="monotone" dataKey="sealed" name="Sealed all day" stroke={PALETTE.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="plan" name="Aurynox plan" stroke={PALETTE.sage} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            Fetch live forecast
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-xs flex-1 min-w-[220px]" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>OpenWeather API key (remembered on this device)</span>
              <input
                type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="paste your OpenWeather API key"
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}` }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Zip</span>
              <input
                type="text" value={zip} onChange={(e) => setZip(e.target.value)}
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, width: "6rem" }}
              />
            </label>
            <button
              onClick={handleFetchLive}
              className="rounded px-4 py-2 text-sm font-semibold"
              style={{ background: PALETTE.sageDeep, color: PALETTE.text }}
            >
              {fetchStatus === "loading" ? "Fetching…" : "Fetch forecast"}
            </button>
          </div>
          {fetchStatus && fetchStatus !== "loading" && (
            <div className="text-xs mt-2" style={{ color: fetchStatus.startsWith("error") ? PALETTE.warn : PALETTE.sage }}>
              {fetchStatus}
            </div>
          )}
          {!simpleMode && (
            <div className="text-xs mt-2 leading-relaxed" style={{ color: PALETTE.dim }}>
              Free 5-day/3-hour endpoint, interpolated to hourly. <strong>Security note:</strong> this repo is public — anyone with the link could see a hardcoded key. As built, keys stay in each person's own browser only.
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            Indoor sensor (Apps Script)
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-xs flex-1 min-w-[280px]" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Apps Script URL (remembered on this device)</span>
              <input
                type="text" value={sensorUrl} onChange={(e) => setSensorUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}` }}
              />
            </label>
            <button
              onClick={fetchSensorData}
              className="rounded px-4 py-2 text-sm font-semibold"
              style={{ background: PALETTE.sageDeep, color: PALETTE.text }}
            >
              {sensorFetchStatus === "loading" ? "Reading…" : "Read indoor temp"}
            </button>
          </div>
          {sensorFetchStatus && sensorFetchStatus !== "loading" && (
            <div className="text-xs mt-2" style={{ color: sensorFetchStatus.startsWith("error") ? PALETTE.warn : PALETTE.sage }}>
              {sensorFetchStatus}
            </div>
          )}
          {!simpleMode && (
            <div className="text-xs mt-2 leading-relaxed" style={{ color: PALETTE.dim }}>
              Averages every room your Apps Script returns and fills "Indoor now °F" below — matches how the model itself was calibrated, on a whole-house average, not any single room. No credentials needed here; your Apps Script already handles that server-side.
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            Or paste an hourly forecast manually
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            className="w-full rounded-lg p-3 font-mono outline-none"
            style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, fontSize: "0.68rem", minHeight: "10rem", lineHeight: 1.5 }}
          />
          <div className="text-xs mt-1" style={{ color: PALETTE.dim }}>
            Parsed {rows.length} hours.
          </div>
        </div>

        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-3" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            {simpleMode ? "Settings" : "Model inputs"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Num label="Indoor now °F" value={indoorStart} onChange={setIndoorStart} step={0.5} />
            <Num label="Dew max °F" value={dewMax} onChange={setDewMax} />
            <Num label="Rate $/kWh" value={rate} onChange={setRate} step={0.001} />
            <Num label="Comfort ceiling °F" value={ceiling} onChange={setCeiling} step={1} />
            {!simpleMode && (
              <>
                <Num label="Start hour" value={startHour} onChange={setStartHour} />
                <Num label="a — open" value={aOpen} onChange={setAOpen} step={0.01} />
                <Num label="a — closed" value={aClosed} onChange={setAClosed} step={0.01} />
                <Num label="Precip max %" value={precipMax} onChange={setPrecipMax} />
                <Num label="Solar coef c" value={cSolar} onChange={setCSolar} step={0.01} />
                <Num label="Solar peak hr" value={peakHour} onChange={setPeakHour} step={0.5} />
                <Num label="Solar width hr" value={bumpWidth} onChange={setBumpWidth} step={0.5} />
                <Num label="Peak start hr" value={peakStart} onChange={setPeakStart} />
                <Num label="Peak end hr" value={peakEnd} onChange={setPeakEnd} />
        
                <Num label="AC rate @75-80°F" value={maxAcRate} onChange={setMaxAcRate} step={0.1} />
              </>
            )}
          </div>
          {!simpleMode && (
            <div className="text-xs leading-relaxed mt-2" style={{ color: PALETTE.dim }}>
              AC engages only when coasting would exceed the comfort ceiling. Pre-cool rate scales with outdoor temperature — the number above is the baseline at 75-80°F; hotter hours automatically get a reduced, more realistic rate.
            </div>
          )}
        </div>

        <div className="mt-4 text-xs" style={{ color: PALETTE.dim }}>
          Model only — sanity-check against the sky before opening. Rain reaching windows overrides any recommendation here.
        </div>
      </div>
    </div>
  );
}
