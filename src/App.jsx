import { useState, useMemo, useEffect } from "react";

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
  acBlue: "#5B8DBE",
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
function openHourLoad(hour) { return hour >= 18 && hour <= 22 ? 1.3 : 0.6; }

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

function noNewOpenOvernight(hour) { return hour >= 22 || hour < 7; }
function ceilingForHour(zone, hour) {
  if (zone === "downstairs") return (hour >= 21 || hour < 6) ? 78 : 76;
  return (hour >= 8 && hour < 20) ? 80 : 76;
}
function thermostatOffset(zone, hour) {
  if (zone === "upstairs" && (hour >= 20 || hour < 8)) return 2;
  return 0;
}

// Same simulate() logic as before, now taking a per-hour ceilings array instead of one flat
// number, and with the AC rate-limiting fix (no more instant-snap to ceiling).
function simulateZone(rows, startIdx, params, ceilings) {
  const { indoorStart, aOpen, aClosed, dewMax, precipMax, cSolar, peakHour, bumpWidth, peakStart, peakEnd, maxAcRate } = params;
  const staticReasons = rows.map((r) => {
    const rs = [];
    if (r.dew >= dewMax) rs.push(`dew ${r.dew}° ≥ ${dewMax}° limit`);
    if (r.precip >= precipMax) rs.push(`rain risk ${r.precip}%`);
    return rs;
  });
  const elig = staticReasons.map((rs) => rs.length === 0);
  const S = rows.map((r) => solarGain(r.cloud, r.hour, peakHour, bumpWidth));
  const step = (T, i, mode) => {
    const r = rows[i];
    if (mode === "open") return T + aOpen * (r.outdoor - T);
    if (mode === "ac") {
      const rate = acRateFor(r.outdoor, maxAcRate);
      return Math.max(ceilings[i], T - rate);
    }
    return T + aClosed * (r.outdoor - T) + cSolar * S[i];
  };
  const inPeak = (i) => rows[i].hour >= peakStart && rows[i].hour < peakEnd;
  const mode = new Array(rows.length).fill("pre");
  const temp = new Array(rows.length).fill(indoorStart);
  const acSetpoint = new Array(rows.length).fill(null);
  let T = indoorStart;
  let i = startIdx;
  let peakAvoidedFully = true, peakPrecoolHours = 0, peakForcedAcHours = 0, peakLimitedByLeadTime = false;
  const canOpenAt = (i) => {
    if (!noNewOpenOvernight(rows[i].hour)) return true;
    return i > startIdx && mode[i - 1] === "open";
  };

  while (i < rows.length) {
    if (inPeak(i) && (i === startIdx || !inPeak(i - 1))) {
      const leadStart = startIdx;
      let lo = 55, hi = ceilings[i];
      const peakHoldsAt = (startTemp) => {
        let t = startTemp;
        let prevOpen = i > startIdx && mode[i - 1] === "open";
        for (let k = i; k < rows.length && inPeak(k); k++) {
          const freshOk = !noNewOpenOvernight(rows[k].hour) || prevOpen;
          const wantOpen = elig[k] && rows[k].outdoor < t && freshOk;
          t = step(t, k, wantOpen ? "open" : "sealed");
          if (t > ceilings[k] + 0.05) return false;
          prevOpen = wantOpen;
        }
        return true;
      };
      if (peakHoldsAt(hi)) { lo = hi; }
      else if (!peakHoldsAt(lo)) { peakAvoidedFully = false; }
      else {
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
          mode[kk] = "ac-precool"; temp[kk] = t; t -= drop; peakPrecoolHours++;
        }
        if (remaining <= 1e-6) { T = target; }
        else { T = t; peakLimitedByLeadTime = true; if (!peakHoldsAt(T)) peakAvoidedFully = false; }
        for (const u of used) acSetpoint[u.k] = T;
      }
    }
    if (inPeak(i) && peakAvoidedFully) {
      const wantOpen = elig[i] && rows[i].outdoor < T && canOpenAt(i);
      const m = wantOpen ? "open" : "sealed";
      mode[i] = m; temp[i] = T; T = step(T, i, m);
    } else {
      const wantOpen = elig[i] && rows[i].outdoor < T && canOpenAt(i);
      if (wantOpen) { mode[i] = "open"; temp[i] = T; T = step(T, i, "open"); }
      else {
        const wouldBe = step(T, i, "sealed");
        if (wouldBe > ceilings[i]) {
          mode[i] = "ac"; temp[i] = T; T = Math.max(ceilings[i], T - acRateFor(rows[i].outdoor, maxAcRate));
          if (inPeak(i)) peakForcedAcHours++;
        } else { mode[i] = "sealed"; temp[i] = T; T = wouldBe; }
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
    if (active && mode[idx] === "ac") reasons.push(`would exceed ${ceilings[idx]}° comfort ceiling — AC engaged`);
    if (active && mode[idx] === "ac-precool") reasons.push(`set AC to ${(acSetpoint[idx] ?? temp[idx]).toFixed(0)}°F now, hold through peak start (${peakStart}:00–${peakEnd}:00)`);
    return {
      label: r.label, hour: r.hour, outdoor: r.outdoor, dew: r.dew, precip: r.precip,
      reasons,
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
      savedKwh += perHr; savedCost += perHr * (params.rate ?? 0);
    } else if (openAt !== null && closeAt === null) {
      closeAt = k;
    }
  }

  const acHours = mode.filter((m) => m === "ac").length;
  const precoolHours = mode.filter((m) => m === "ac-precool").length;

  return {
    data, openAt, closeAt, savedKwh, savedCost, acHours, precoolHours,
    peakAvoidedFully, peakForcedAcHours, peakPrecoolHours, peakLimitedByLeadTime,
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

function fetchAppsScriptIndoorByZone(url) {
  return new Promise((resolve, reject) => {
    const callbackName = "aurynoxCb_" + Date.now();
    window[callbackName] = (json) => {
      delete window[callbackName];
      script.remove();
      try {
        const bedroomC = json.primary_bedroom?.body?.temperature;
        const livingC = json.living_room?.body?.temperature;
        const kitchenC = json.kitchen?.body?.temperature;
        if (typeof bedroomC !== "number" || typeof livingC !== "number" || typeof kitchenC !== "number") {
          reject(new Error("Expected primary_bedroom, living_room, and kitchen readings — check the Apps Script response."));
          return;
        }
        const upstairs = bedroomC * 9 / 5 + 32;
        const downstairs = ((livingC + kitchenC) / 2) * 9 / 5 + 32;
        resolve({ upstairs, downstairs });
      } catch (e) { reject(e); }
    };
    const script = document.createElement("script");
    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${callbackName}`;
    script.onerror = () => { delete window[callbackName]; reject(new Error("Couldn't load the Apps Script URL — check it's correct and still deployed.")); };
    document.body.appendChild(script);
  });
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

// Same thematic grouping as before — categorizes by reason TYPE, not exact string match,
// so consecutive hours merge whenever the underlying story is the same (e.g. "dew 64-67°
// (limit 65°)" as one line instead of several near-duplicates with slightly different values).
function categorizeReason(r) {
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
}

function renderReasonCat(group) {
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
}

function ZonePanel({ title, sim }) {
  if (!sim) return null;
  return (
    <div className="mb-6">
      <div className="uppercase text-xs mb-2" style={{ color: PALETTE.sage, letterSpacing: "0.18em" }}>{title}</div>
      <div className="flex w-full overflow-hidden rounded-lg mb-2" style={{ border: `1px solid ${PALETTE.line}` }}>
        {sim.data.map((d, i) => {
          const bg =
            d.mode === "open" ? PALETTE.sageDeep :
            d.mode === "ac" ? PALETTE.acBlue :
            d.mode === "ac-precool" ? PALETTE.amber :
            d.mode === "sealed" ? "#2C3E4A" : PALETTE.panel;
          return (
            <div key={i} className="flex-1 text-center py-2"
              title={`${d.label} · out ${d.outdoor}° · ${d.mode}${d.reasons.length ? " — " + d.reasons.join("; ") : ""}`}
              style={{ background: bg, borderLeft: i > 0 ? `1px solid ${PALETTE.bg}` : "none", minWidth: 0 }}
            >
              <div className="font-mono" style={{ fontSize: "0.55rem", color: d.mode === "sealed" || d.mode === "pre" ? PALETTE.dim : PALETTE.text }}>
                {d.hour % 3 === 0 ? d.label : "·"}
              </div>
            </div>
          );
        })}
      </div>
      {(() => {
        const spans = [];
        let cur = null;
        for (const d of sim.data) {
          if (!d.reasons.length) { cur = null; continue; }
          const cats = d.reasons.map(categorizeReason);
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
        return (
          <div className="rounded-lg p-3" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
            {spans.map((s, i) => (
              <div key={i} className="text-xs flex gap-2 items-baseline">
                <span className="font-mono shrink-0" style={{ color: PALETTE.amber }}>{s.start === s.end ? s.start : `${s.start}–${s.end}`}</span>
                <span style={{ color: PALETTE.dim }}>{s.cats.map(renderReasonCat).join("; ")}</span>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

export default function AurynoxNightPlanner() {
  const [raw, setRaw] = useState(DEFAULT_FORECAST);
  const [indoorDown, setIndoorDown] = useState(76);
  const [indoorUp, setIndoorUp] = useState(76);
  const [startHour, setStartHour] = useState(8);
  const [aOpen, setAOpen] = useState(0.0677);
  const [aClosed, setAClosed] = useState(0.0105);
  const [cSolar, setCSolar] = useState(0.7071);
  const [peakHour, setPeakHour] = useState(12.5);
  const [bumpWidth, setBumpWidth] = useState(6.0);
  const [peakStart, setPeakStart] = useState(16);
  const [peakEnd, setPeakEnd] = useState(21);
  const maxAcRate = 1.5;
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
    } catch (e) { setFetchStatus(`error: ${e.message}`); }
  };

  const fetchSensorData = async () => {
    if (!sensorUrl.trim()) { setSensorFetchStatus("error: paste your Apps Script URL first"); return; }
    setSensorFetchStatus("loading");
    try {
      const { upstairs, downstairs } = await fetchAppsScriptIndoorByZone(sensorUrl.trim());
      setIndoorUp(+upstairs.toFixed(1));
      setIndoorDown(+downstairs.toFixed(1));
      setSensorFetchStatus(`ok: downstairs ${downstairs.toFixed(1)}°F, upstairs ${upstairs.toFixed(1)}°F at ${new Date().toLocaleTimeString()}`);
    } catch (e) { setSensorFetchStatus(`error: ${e.message}`); }
  };

  const rows = useMemo(() => parseForecast(raw), [raw]);
  const startIdx = useMemo(() => {
    const i = rows.findIndex((r) => r.hour >= startHour);
    return i === -1 ? 0 : i;
  }, [rows, startHour]);

  const baseParams = { startIdx, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, peakStart, peakEnd, maxAcRate };

  const simDown = useMemo(() => {
    if (!rows.length) return null;
    const ceilings = rows.map((r) => ceilingForHour("downstairs", r.hour));
    return simulateZone(rows, startIdx, { ...baseParams, indoorStart: indoorDown }, ceilings);
  }, [rows, startIdx, indoorDown, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, peakStart, peakEnd]);

  const simUp = useMemo(() => {
    if (!rows.length) return null;
    const ceilings = rows.map((r) => ceilingForHour("upstairs", r.hour));
    return simulateZone(rows, startIdx, { ...baseParams, indoorStart: indoorUp }, ceilings);
  }, [rows, startIdx, indoorUp, aOpen, aClosed, dewMax, precipMax, rate, cSolar, peakHour, bumpWidth, peakStart, peakEnd]);

  return (
    <div className="min-h-screen w-full" style={{ background: PALETTE.bg, color: PALETTE.text, fontFamily: "'Avenir Next', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="uppercase" style={{ color: PALETTE.sage, letterSpacing: "0.32em", fontSize: "0.68rem" }}>Aurynox</div>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold" style={{ letterSpacing: "-0.01em" }}>Night Planner</h1>
          </div>
          <button onClick={() => setSimpleMode((s) => !s)}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: PALETTE.panelSoft, color: PALETTE.sage, border: `1px solid ${PALETTE.line}` }}>
            {simpleMode ? "Simple view" : "Advanced view"}
          </button>
        </div>

        <ZonePanel title="Downstairs" sim={simDown} />
        <ZonePanel title="Upstairs" sim={simUp} />

        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>Fetch live forecast</div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-xs flex-1 min-w-[220px]" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>OpenWeather API key</span>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="paste your OpenWeather API key"
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}` }} />
            </label>
            <label className="flex flex-col gap-1 text-xs" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Zip</span>
              <input type="text" value={zip} onChange={(e) => setZip(e.target.value)}
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, width: "6rem" }} />
            </label>
            <button onClick={handleFetchLive} className="rounded px-4 py-2 text-sm font-semibold"
              style={{ background: PALETTE.sageDeep, color: PALETTE.text }}>
              {fetchStatus === "loading" ? "Fetching…" : "Fetch forecast"}
            </button>
          </div>
          {fetchStatus && fetchStatus !== "loading" && (
            <div className="text-xs mt-2" style={{ color: fetchStatus.startsWith("error") ? PALETTE.warn : PALETTE.sage }}>{fetchStatus}</div>
          )}
        </div>

        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-2" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>Indoor sensors (Apps Script)</div>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex flex-col gap-1 text-xs flex-1 min-w-[280px]" style={{ color: PALETTE.dim }}>
              <span className="uppercase tracking-widest" style={{ fontSize: "0.62rem" }}>Apps Script URL</span>
              <input type="text" value={sensorUrl} onChange={(e) => setSensorUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="rounded px-2 py-1.5 font-mono text-sm outline-none"
                style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}` }} />
            </label>
            <button onClick={fetchSensorData} className="rounded px-4 py-2 text-sm font-semibold"
              style={{ background: PALETTE.sageDeep, color: PALETTE.text }}>
              {sensorFetchStatus === "loading" ? "Reading…" : "Read indoor temps"}
            </button>
          </div>
          {sensorFetchStatus && sensorFetchStatus !== "loading" && (
            <div className="text-xs mt-2" style={{ color: sensorFetchStatus.startsWith("error") ? PALETTE.warn : PALETTE.sage }}>{sensorFetchStatus}</div>
          )}
          {!simpleMode && (
            <div className="text-xs mt-2 leading-relaxed" style={{ color: PALETTE.dim }}>
              Reads bedroom (upstairs) and living room + kitchen average (downstairs) separately — matches how the model treats them as genuinely different zones.
            </div>
          )}
        </div>

        <details open={!simpleMode} className="mb-6">
          <summary className="uppercase text-xs mb-2 cursor-pointer" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            {simpleMode ? "Trouble fetching? Paste a forecast manually ▸" : "Or paste an hourly forecast manually"}
          </summary>
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} spellCheck={false}
            className="w-full rounded-lg p-3 font-mono outline-none"
            style={{ background: PALETTE.panelSoft, color: PALETTE.text, border: `1px solid ${PALETTE.line}`, fontSize: "0.68rem", minHeight: "10rem", lineHeight: 1.5 }} />
          <div className="text-xs mt-1" style={{ color: PALETTE.dim }}>Parsed {rows.length} hours.</div>
        </details>

        <div className="mb-6 rounded-xl p-4" style={{ background: PALETTE.panel, border: `1px solid ${PALETTE.line}` }}>
          <div className="uppercase text-xs mb-3" style={{ color: PALETTE.dim, letterSpacing: "0.18em" }}>
            {simpleMode ? "Settings" : "Model inputs"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Num label="Downstairs now °F" value={indoorDown} onChange={setIndoorDown} step={0.5} />
            <Num label="Upstairs now °F" value={indoorUp} onChange={setIndoorUp} step={0.5} />
            <Num label="Dew max °F" value={dewMax} onChange={setDewMax} />
            <Num label="Rate $/kWh" value={rate} onChange={setRate} step={0.001} />
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
              </>
            )}
          </div>
          {!simpleMode && (
            <div className="text-xs leading-relaxed mt-2" style={{ color: PALETTE.dim }}>
              Downstairs: 78°F overnight (9pm-6am), 76°F daytime. Upstairs: 80°F daytime (8am-8pm), 76°F overnight — with a 2°F thermostat offset overnight to reliably hit that target.
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
