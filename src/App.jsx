import { useState, useMemo, useEffect } from "react";
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, Tooltip, Legend, ReferenceArea, ResponsiveContainer, CartesianGrid,
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
      // Order in a standard hourly table is precip%, cloud cover%, humidity% — see DEFAULT_FORECAST.
      cloud: pcts.length >= 2 ? pcts[1] : 50, // fallback: assume half-cloudy if not present
      windMatch: (line.match(/(\d+)\s*mph\s*([A-Z]{1,3})/) || [null, null, null]),
    });
  }
  return rows;
}

// ————— Savings estimator, calibrated to June 2026 measured behavior —————
// Counterfactual: what the AC actually consumed at similar hours/outdoor temps in June.
// Evening (6–10pm) is the expensive avoided run (cooling the house for sleep ≈ 3.8 kWh/hr);
// overnight AC maintenance scales with outdoor temp. Open-window hours still cost ~0.6–1.3 kWh/hr
// (house baseline + fans), so savings = counterfactual − actual, floored at zero. Ballpark, not billing-grade.
function counterfactualAC(hour, outdoor) {
  let base;
  if (outdoor <= 70) base = 0.85;
  else if (outdoor <= 75) base = 1.3;
  else if (outdoor <= 80) base = 1.7;
  else if (outdoor <= 85) base = 2.3;
  else if (outdoor <= 90) base = 3.7;
  else base = 5.0;
  if (hour >= 18 && hour <= 21) base = Math.max(base, 3.8); // evening cool-down run
  return base;
}
function openHourLoad(hour) {
  return hour >= 18 && hour <= 22 ? 1.3 : 0.6; // June open-hour actuals: evenings vs late night
}
// Flat-rate billing (PSE&G residential, ~28.1¢/kWh per June 2026 actuals) — editable in the UI.

// Parse "12pm=76, 3pm=74.5, 6pm=72" (or "12pm 76") into { "12pm": 76, ... }
function parseActuals(text) {
  const map = {};
  const parts = text.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  for (const p of parts) {
    const m = p.match(/(\d{1,2}\s*(?:am|pm))\s*[=: ]\s*(-?\d+(?:\.\d+)?)/i);
    if (m) map[m[1].replace(/\s+/g, "").toLowerCase()] = parseFloat(m[2]);
  }
  return map;
}

// Solar gain term, fit from June 2026 whole-house sealed-hour data (R² 0.02 -> 0.50 vs. no-solar model).
// S(t) = clearsky fraction (from forecast cloud cover) x a bump centered on the blended peak solar hour.
function solarGain(cloudPct, hour, peakHour, width) {
  const clearsky = Math.max(0, Math.min(1, (100 - cloudPct) / 100));
  const bump = Math.max(0, 1 - Math.pow((hour - peakHour) / width, 2));
  return clearsky * bump;
}

// Achievable AC pulldown rate (°F/hr), scaled by outdoor temperature using the June 2026 measured
// kWh/hr-by-outdoor-bin capacity curve (1.54 / 2.09 / 2.30 / 3.74 / 4.95 for 65-75/75-80/80-85/85-90/90-96°F).
// As outdoor temp rises, more of the AC's capacity goes toward offsetting incoming heat, leaving less
// spare capacity to actually lower indoor temp — so achievable °F/hr is scaled DOWN as kWh/hr rises,
// anchored to the user's baseline rate at the 75-80°F bin (where the flat-rate default was calibrated).
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

  // Reference line: pure sealed-all-day, AC never intervenes (shows what would happen with zero action).
  let sealedT = indoorStart;
  const sealedTrace = [];
  for (let i = 0; i < rows.length; i++) {
    if (i >= startIdx) sealedT = sealedT + aClosed * (rows[i].outdoor - sealedT) + cSolar * S[i];
    sealedTrace.push(sealedT);
  }

  // Step a single hour forward given a mode, from temp T.
  const step = (T, i, mode) => {
    const r = rows[i];
    if (mode === "open") return T + aOpen * (r.outdoor - T);
    if (mode === "ac") return Math.min(T, ceiling); // AC holds/brings to ceiling, never lets it rise above
    return T + aClosed * (r.outdoor - T) + cSolar * S[i]; // sealed/coast
  };

  const inPeak = (i) => rows[i].hour >= peakStart && rows[i].hour < peakEnd;

  // Pass 1: naive plan ignoring comfort ceiling entirely — open whenever eligible & beneficial, else coast.
  const naiveMode = [];
  let nT = indoorStart;
  for (let i = 0; i < rows.length; i++) {
    if (i < startIdx) { naiveMode.push("pre"); continue; }
    const wantOpen = elig[i] && rows[i].outdoor < nT;
    const m = wantOpen ? "open" : "sealed";
    naiveMode.push(m);
    nT = step(nT, i, m);
  }

  // Pass 2: walk forward, upgrading to "ac" wherever naive coasting would breach the ceiling,
  // with peak-window hours specifically routed around via pre-cooling instead of in-window AC.
  const mode = new Array(rows.length).fill("pre");
  const temp = new Array(rows.length).fill(indoorStart);
  let T = indoorStart;
  let i = startIdx;
  let peakAvoidedFully = true, peakPrecoolHours = 0, peakForcedAcHours = 0, peakLimitedByLeadTime = false;

  while (i < rows.length) {
    // Entering a peak window for the first time this pass — try to arrange a pre-cool.
    if (inPeak(i) && (i === startIdx || !inPeak(i - 1))) {
      // Find how many of the immediately-preceding hours are available to precool (bounded by precoolLead and startIdx).
      const leadStart = Math.max(startIdx, i - precoolLead);
      // Binary search the minimum starting temp at peak entry that keeps every peak hour <= ceiling,
      // given each peak hour uses open-if-eligible-else-coast (never AC) once inside the window.
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
        lo = hi; // no precool needed at all — already fine at ceiling
      } else if (!peakHoldsAt(lo)) {
        // Even maximal precool can't prevent a breach (extreme/long event) — flag and fall through to normal AC logic.
        peakAvoidedFully = false;
      } else {
        for (let iter = 0; iter < 20; iter++) {
          const mid = (lo + hi) / 2;
          if (peakHoldsAt(mid)) hi = mid; else lo = mid;
        }
      }
      const target = hi;
      if (peakHoldsAt(target) && target < T - 0.1) {
        // Ventilate-first, temperature-realistic precool: each lead hour has its own achievable
        // pulldown rate (hotter pre-peak hours cool slower — see acRateFor), not one flat number.
        // Walk backward from the hour just before peak entry, using only as much of each hour's
        // capacity as needed, stopping once the gap closes or lead hours run out. This preserves
        // natural ventilation/coast for every hour that isn't actually needed for the precool.
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
        // Apply drops in chronological order (used[] was built latest-hour-first).
        let t = T;
        for (let u = used.length - 1; u >= 0; u--) {
          const { k: kk, drop } = used[u];
          mode[kk] = "ac-precool";
          temp[kk] = t;
          t -= drop;
          peakPrecoolHours++;
        }
        if (remaining <= 1e-6) {
          T = target; // fully closed — set exactly, avoiding float drift from the accumulation above
        } else {
          // Not enough capacity even using every available lead hour at realistic, temperature-scaled rates.
          T = t; // best achievable — still above target
          peakLimitedByLeadTime = true;
          if (!peakHoldsAt(T)) peakAvoidedFully = false; // may still breach ceiling once inside the window
        }
      }
    }

    if (inPeak(i) && peakAvoidedFully) {
      // Coast/ventilate through the peak window using the pre-cooled reserve — no AC inside the window.
      const wantOpen = elig[i] && rows[i].outdoor < T;
      const m = wantOpen ? "open" : "sealed";
      mode[i] = m; temp[i] = T; T = step(T, i, m);
    } else {
      // Normal comfort-driven logic (used outside peak, or inside peak if avoidance genuinely impossible).
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
    if (active && mode[idx] === "ac-precool") reasons.push(`pre-cooling ahead of peak window (${peakStart}:00–${peakEnd}:00)`);
    return {
      label: r.label, hour: r.hour, outdoor: r.outdoor, dew: r.dew, precip: r.precip,
      eligible: active && (mode[idx] === "open"),
      reasons,
      sealed: active ? +sealedTrace[idx].toFixed(1) : null,
      plan: active ? +temp[idx].toFixed(1) : null,
      mode: active ? mode[idx] : "pre",
    };
  });

  // First open/close markers (for the verdict card), and savings accounting (unchanged methodology).
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

// Dew point from temp(°F) + relative humidity(%), via the Magnus approximation (same formula used
// in the enthalpy/latent-load work) — OpenWeather's 3-hour forecast endpoint gives temp+humidity,
// not dew point directly, so this fills the gap.
function dewPointF(tempF, rh) {
  const tempC = (tempF - 32) * 5 / 9;
  const a = 17.27, b = 237.3;
  const alpha = (a * tempC) / (b + tempC) + Math.log(Math.max(1, rh) / 100);
  const dewC = (b * alpha) / (a - alpha);
  return dewC * 9 / 5 + 32;
}

// Fetch OpenWeather's free 5-day/3-hour forecast and turn it into the same paste-format text the
// manual box accepts — reuses parseForecast() as-is rather than duplicating row-building logic.
async function fetchOpenWeatherText(apiKey, zip) {
  // Convert zip -> lat/lon first (OpenWeather's Geocoding API), then fetch the forecast.
  const geoUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(zip)},US&appid=${apiKey}`;
  const geoRes = await fetch(geoUrl);
  if (!geoRes.ok) throw new Error(`Couldn't look up zip code "${zip}" (status ${geoRes.status}) — check it's a valid 5-digit US zip and your key is active.`);
  const geo = await geoRes.json();
  const { lat, lon } = geo;

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OpenWeather returned ${res.status} — check your API key and that it's activated (can take ~10 min after signup).`);
  const json = await res.json();
  const list = json.list; // 3-hour steps, ~40 entries covering 5 days

  // Interpolate to hourly by linear-blending each pair of consecutive 3-hour points.
  const hourly = [];
  for (let i = 0; i < list.length - 1 && hourly.length < 30; i++) {
    const a = list[i], b = list[i + 1];
    const ta = new Date(a.dt * 1000), tb = new Date(b.dt * 1000);
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
      // Build one line in the exact format parseForecast() already expects.
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
  const [aClosed, setAClosed] = useState(0.0169); // refit jointly WITH the solar term below — don't use standalone 0.0249 here
  const [cSolar, setCSolar] = useState(0.5575);
  const [peakHour, setPeakHour] = useState(13.0);
  const [bumpWidth, setBumpWidth] = useState(4.5);
  const [ceiling, setCeiling] = useState(80);
  const [peakStart, setPeakStart] = useState(16);
  const [peakEnd, setPeakEnd] = useState(21);
  const [precoolLead, setPrecoolLead] = useState(3);
  const [maxAcRate, setMaxAcRate] = useState(1.5);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("aurynox_owm_key") || "");

useEffect(() => {
  if (apiKey) localStorage.setItem("aurynox_owm_key", apiKey);
}, [apiKey]);;
  const [zip, setZip] = useState("07450");
  const [fetchStatus, setFetchStatus] = useState(""); // "", "loading", "error: ...", "ok: ..."

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
  const [dewMax, setDewMax] = useState(65);
  const [precipMax, setPrecipMax] = useState(40);
  const [rate, setRate] = useState(0.281);
  const [actualsText, setActualsText] = useState("");
  const [refMode, setRefMode] = useState("sealed");

  const rows = useMemo(() => parseForecast(raw), [raw]);
  const startIdx = useMemo(() => {
    const i = rows.findIndex((r) => r.hour >= startHour);
    return i === -1 ? 0 : i;
  }, [rows, startHour]);

  const sim = useMemo(
    () => (rows.length ? simulate(rows, { indoorStart, startIdx, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, ceiling, peakStart, peakEnd, precoolLead, maxAcRate }) : null),
    [rows, indoorStart, startIdx, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, ceiling, peakStart, peakEnd, precoolLead, maxAcRate]
  );

  const openRow = sim && sim.openAt !== null ? sim.data[sim.openAt] : null;
  const closeRow = sim && sim.closeAt !== null ? sim.data[sim.closeAt] : null;
// openAt/closeAt only ever track the FIRST open window — a day with an overnight opening,
  // a daytime close, and an evening re-opening would silently report just the first pair.
  // This scans the whole day's per-hour mode to list every open segment instead.
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
  const actualsMap = useMemo(() => parseActuals(actualsText), [actualsText]);
  const chartData = useMemo(() => {
    if (!sim) return [];
    return sim.data.map((d) => ({ ...d, actual: actualsMap[d.label.toLowerCase()] ?? null }));
  }, [sim, actualsMap]);

  const checkRows = useMemo(() => {
    return chartData
      .filter((d) => d.actual != null && d[refMode] != null)
      .map((d) => ({ label: d.label, predicted: d[refMode], actual: d.actual, error: +(d.actual - d[refMode]).toFixed(1) }));
  }, [chartData, refMode]);
  const meanBias = checkRows.length ? checkRows.reduce((s, r) => s + r.error, 0) / checkRows.length : null;

  return (
    <div className="min-h-screen w-full" style={{ background: PALETTE.bg, color: PALETTE.text, fontFamily: "'Avenir Next', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="uppercase" style={{ color: PALETTE.sage, letterSpacing: "0.32em", fontSize: "0.68rem" }}>Aurynox</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold" style={{ letterSpacing: "-0.01em" }}>
              Night Planner
            </h1>
          </div>
          <div className="text-xs" style={{ color: PALETTE.dim }}>
            T(t+1) = T + a·(Out−T) + c·Solar(t)  ·  a<sub>open</sub> {aOpen} · a<sub>closed</sub> {aClosed} · c {cSolar}
          </div>
        </div>

       {/* Verdict card */}
        {sim && (
          <div
            className="mb-6 rounded-xl p-5"
            style={{
              background: openSegments.length > 0 ? `linear-gradient(135deg, ${PALETTE.panel}, #16341F30)` : PALETTE.panel,
              border: `1px solid ${openSegments.length > 0 ? PALETTE.sageDeep : PALETTE.line}`,
            }}
          >
            {openSegments.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <div className="uppercase text-xs" style={{ color: PALETTE.sage, letterSpacing: "0.18em" }}>
                    Tonight's call {openSegments.length > 1 ? `— ${openSegments.length} windows` : ""}
                  </div>
                  <div className="text-xl md:text-2xl font-semibold mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                    {openSegments.map((seg, i) => (
                      <span key={i}>
                        {i > 0 && <span style={{ color: PALETTE.dim, fontWeight: 400 }}>, then </span>}
                        Open <span style={{ color: PALETTE.sage }}>{seg.start}</span>
                        {seg.start !== seg.end && !seg.endIsLastRow && <> · close by <span style={{ color: PALETTE.amber }}>{seg.end}</span></>}
                      </span>
                    ))}
                  </div>
                  {openSegments.some((s) => s.endIsLastRow) && (
                    <div className="text-sm mt-1" style={{ color: PALETTE.warn }}>
                      {openSegments[openSegments.length - 1].start === openSegments[openSegments.length - 1].end ? "The" : "The last"} window above is still open when the pasted forecast runs out — conditions stay favorable through the last hour pasted, but that doesn't mean it's safe to leave windows open indefinitely. Paste a forecast that extends further out for an actual close time, or check conditions again by hand once this window ends.
                    </div>
                  )}
                  {openSegments.length > 1 && (
                    <div className="text-xs mt-1" style={{ color: PALETTE.dim }}>
                      Capture ratio and drop stats below reflect the first window only — check the hourly strip further down for the full picture across all {openSegments.length}.
                    </div>
                  )}
                </div>
                <div className="flex gap-6 text-sm font-mono flex-wrap">
                  <div><div style={{ color: PALETTE.dim }}>proj. drop</div><div className="text-lg" style={{ color: PALETTE.sage }}>{sim.drop.toFixed(1)}°F</div></div>
                  <div><div style={{ color: PALETTE.dim }}>proj. end</div><div className="text-lg">{sim.finalPlan.toFixed(1)}°F</div></div>
                  {sim.capture !== null && (
                    <div><div style={{ color: PALETTE.dim }}>est. capture</div><div className="text-lg">{sim.capture.toFixed(0)}%</div></div>
                  )}
                  <div><div style={{ color: PALETTE.dim }}>vs sealed</div><div className="text-lg" style={{ color: PALETTE.amber }}>−{(sim.finalSealed - sim.finalPlan).toFixed(1)}°F</div></div>
                  <div title="vs. running AC at these hours/temps, benchmarked to June 2026 measured AC behavior. Ballpark.">
                    <div style={{ color: PALETTE.dim }}>est. saved vs AC</div>
                    <div className="text-lg" style={{ color: PALETTE.sage }}>~{sim.savedKwh.toFixed(1)} kWh · ${sim.savedCost.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="uppercase text-xs" style={{ color: PALETTE.warn, letterSpacing: "0.18em" }}>Tonight's call</div>
                <div className="text-xl font-semibold mt-0.5">No eligible window — keep the house sealed.</div>
                <div className="text-sm mt-1" style={{ color: PALETTE.dim }}>
                  No hour after {startHour}:00 clears dew &lt; {dewMax}°F and precip &lt; {precipMax}% while outdoor is below indoor.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Peak-avoidance summary */}
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
                Peak window {peakStart}:00–{peakEnd}:00
              </div>
              {sim.peakAvoidedFully && !sim.peakLimitedByLeadTime ? (
                <div className="text-sm" style={{ color: PALETTE.sage }}>
                  No AC needed during peak.
                  {sim.precoolHours > 0
                    ? ` Pre-cooling ${sim.precoolHours}hr before peak entry (rate scaled to each hour's own outdoor temp) covers it.`
                    : " House already stays under ceiling without intervention."}
                </div>
              ) : sim.peakLimitedByLeadTime && sim.peakAvoidedFully ? (
                <div className="text-sm" style={{ color: PALETTE.amber }}>
                  Used all {precoolLead}hr of available lead time — enough to stay under ceiling, but with less margin than ideal. More lead time would help, especially if pre-peak hours are hot (slower pulldown then).
                </div>
              ) : sim.peakLimitedByLeadTime ? (
                <div className="text-sm" style={{ color: PALETTE.warn }}>
                  Not enough lead time to precool fully — even using all {precoolLead}hr available at realistic, temperature-scaled rates, peak entry will still run warm. Consider more lead hours.
                </div>
              ) : (
                <div className="text-sm" style={{ color: PALETTE.warn }}>
                  Couldn't avoid AC during peak even with a full pre-cool — {sim.peakForcedAcHours}hr of in-window AC needed. This is a genuinely hot/long event.
                </div>
              )}
            </div>
            <div className="text-xs font-mono" style={{ color: PALETTE.dim }}>
              total AC hours (all day): <span style={{ color: PALETTE.text }}>{sim.acHours}</span> · precool hours: <span style={{ color: PALETTE.text }}>{sim.precoolHours}</span>
            </div>
          </div>
        )}

        {/* Night strip — signature element */}
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
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: PALETTE.sageDeep }} />ventilate (open)</span>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: "#2C3E4A" }} />coast (sealed, drifting)</span>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: PALETTE.amber }} />AC — pre-cooling for peak</span>
              <span><span className="inline-block w-3 h-3 rounded-sm align-middle mr-1" style={{ background: PALETTE.warn }} />AC — comfort (unavoidable)</span>
            </div>
            {/* Why closed — grouped reasons */}
            {(() => {
              const spans = [];
              let cur = null;
              for (const d of sim.data) {
                const key = d.reasons.join("; ");
                if (!key) { cur = null; continue; }
                if (cur && cur.key === key) { cur.end = d.label; }
                else { cur = { key, start: d.label, end: d.label }; spans.push(cur); }
              }
              if (!spans.length) return null;
              return (
                <div className="mt-3 rounded-lg p-3" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
                  <div className="uppercase text-xs mb-2" style={{ color: PALETTE.warn, letterSpacing: "0.18em" }}>Why not ventilating</div>
                  <div className="flex flex-col gap-1">
                    {spans.map((s, i) => (
                      <div key={i} className="text-sm flex gap-3 items-baseline">
                        <span className="font-mono shrink-0" style={{ color: PALETTE.amber, fontSize: "0.78rem" }}>
                          {s.start === s.end ? s.start : `${s.start}–${s.end}`}
                        </span>
                        <span style={{ color: PALETTE.text }}>{s.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Trajectory chart */}
        {sim && (
          <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
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
                <Line type="monotone" dataKey="sealed" name="Indoor — sealed all day" stroke={PALETTE.amber} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="plan" name="Indoor — Aurynox plan" stroke={PALETTE.sage} strokeWidth={2.5} dot={false} />
                {checkRows.length > 0 && (
                  <Scatter name="Actual (measured)" dataKey="actual" fill={PALETTE.warn} shape="cross" />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Model check panel */}
        {sim && (
          <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <div className="uppercase text-xs" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
                Model check — is it predicting reality?
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: PALETTE.dim }}>compare actuals against:</span>
                <select
                  value={refMode} onChange={(e) => setRefMode(e.target.value)}
                  className="rounded px-2 py-1 font-mono"
                  style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}` }}
                >
                  <option value="sealed">sealed-all-day line</option>
                  <option value="plan">Aurynox-plan line</option>
                </select>
              </div>
            </div>
            <textarea
              value={actualsText}
              onChange={(e) => setActualsText(e.target.value)}
              placeholder="Type what your thermometer actually reads, e.g.  12pm=76, 3pm=74.5, 6pm=72"
              spellCheck={false}
              className="w-full rounded-lg p-2 font-mono outline-none mb-2"
              style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, fontSize: "0.72rem", minHeight: "2.5rem" }}
            />
            {checkRows.length > 0 ? (
              <>
                <div className="text-sm mb-2">
                  {checkRows.map((r, i) => (
                    <span key={i} className="inline-block mr-4 font-mono" style={{ color: Math.abs(r.error) < 1 ? PALETTE.sage : PALETTE.warn }}>
                      {r.label}: predicted {r.predicted.toFixed(1)}° · actual {r.actual.toFixed(1)}° · off by {r.error > 0 ? "+" : ""}{r.error}°
                    </span>
                  ))}
                </div>
                <div className="text-sm font-semibold" style={{ color: Math.abs(meanBias) < 1 ? PALETTE.sage : PALETTE.warn }}>
                  Average bias: {meanBias > 0 ? "+" : ""}{meanBias.toFixed(1)}°F
                  {" — "}
                  {Math.abs(meanBias) < 1
                    ? "model tracking well."
                    : meanBias > 0
                    ? "house is running WARMER than predicted — model may be cooling too fast (a too high)."
                    : "house is running COOLER than predicted — model may be cooling too slow (a too low)."}
                </div>
              </>
            ) : (
              <div className="text-xs" style={{ color: PALETTE.dim }}>
                No actuals entered yet. Jot down your indoor temp a couple times today (e.g. noon, 3pm, 6pm) and paste them above to see how the model is doing.
              </div>
            )}
          </div>
        )}

        {/* Live forecast fetch */}
        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            Fetch live forecast (OpenWeather)
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-xs flex-1 min-w-[220px]" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>API key (not saved anywhere — retype each session)</span>
              <input
                type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="paste your OpenWeather API key"
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}` }}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Zip code</span>
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
          <div className="text-xs mt-2 leading-relaxed" style={{ color: PALETTE.dim }}>
            Uses the free 5-day/3-hour endpoint, interpolated to hourly (temp/humidity/cloud/rain-chance blended between each 3-hour point; dew point computed from temp+humidity). Coarser than a native hourly source, but works on a plain free-tier key with no extra subscription step. <strong>Security note:</strong> the key lives only in this page's memory for this session — but if you ever publish this artifact or share the link, remove it first; anyone with the link could otherwise see and use it.
          </div>
        </div>

        {/* Controls */}
        <div className="grid gap-6 md:grid-cols-[1fr_260px]">
          <div>
            <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
              Or paste an hourly forecast manually (Wunderground-style table)
            </div>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              spellCheck={false}
              className="w-full rounded-lg p-3 font-mono outline-none"
              style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, fontSize: "0.68rem", minHeight: "12rem", lineHeight: 1.5 }}
            />
            <div className="text-xs mt-1" style={{ color: PALETTE.dim }}>
              Parsed {rows.length} hours. Needs a time like "7 pm" at line start, °F values in order (temp, feels-like, dew), % values in order (precip, cloud cover, humidity) — cloud cover now drives the solar term above.
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="uppercase text-xs" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>Model inputs</div>
            <div className="grid grid-cols-2 gap-3">
              <Num label="Indoor now °F" value={indoorStart} onChange={setIndoorStart} step={0.5} />
              <Num label="Start hour" value={startHour} onChange={setStartHour} />
              <Num label="a — open" value={aOpen} onChange={setAOpen} step={0.01} />
              <Num label="a — closed" value={aClosed} onChange={setAClosed} step={0.01} />
              <Num label="Dew max °F" value={dewMax} onChange={setDewMax} />
              <Num label="Precip max %" value={precipMax} onChange={setPrecipMax} />
              <Num label="Rate $/kWh" value={rate} onChange={setRate} step={0.001} />
              <Num label="Solar coef c" value={cSolar} onChange={setCSolar} step={0.01} />
              <Num label="Solar peak hr" value={peakHour} onChange={setPeakHour} step={0.5} />
              <Num label="Solar width hr" value={bumpWidth} onChange={setBumpWidth} step={0.5} />
              <Num label="Comfort ceiling °F" value={ceiling} onChange={setCeiling} step={1} />
              <Num label="Peak start hr" value={peakStart} onChange={setPeakStart} />
              <Num label="Peak end hr" value={peakEnd} onChange={setPeakEnd} />
              <Num label="Precool lead hrs" value={precoolLead} onChange={setPrecoolLead} />
              <Num label="AC rate @75-80°F" value={maxAcRate} onChange={setMaxAcRate} step={0.1} />
            </div>
            <div className="text-xs leading-relaxed mt-1" style={{ color: PALETTE.dim }}>
              AC engages only when coasting would exceed the comfort ceiling. Pre-cool rate scales with outdoor temperature (June capacity curve: hotter pre-peak hours cool slower) — the number above is the baseline rate at 75-80°F; hotter hours automatically get a reduced, more realistic rate.
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs" style={{ color: PALETTE.dim }}>
          Model only — sanity-check against the sky before opening. Rain reaching windows overrides any recommendation here.
        </div>
      </div>
    </div>
  );
}
