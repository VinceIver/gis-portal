// src/utils/reportMetrics.js

export function normalizeRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

export function toTs(d) {
  if (!d) return null;
  if (d instanceof Date) return d.getTime() || null;
  const s = String(d).trim();
  if (!s) return null;
  const dt = new Date(s.includes(" ") ? s.replace(" ", "T") : s);
  return Number.isFinite(dt.getTime()) ? dt.getTime() : null;
}

export function startOfDayTs(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function dayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function buildDayKeys(fromTs, toTsInclusive) {
  const keys = [];
  let cur = startOfDayTs(fromTs);
  const end = startOfDayTs(toTsInclusive);
  while (cur <= end) {
    keys.push(dayKey(cur));
    cur += 24 * 60 * 60 * 1000;
  }
  return keys;
}

export function median(nums) {
  const arr = (nums || []).filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (!arr.length) return null;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}

export function percentile(nums, p) {
  const arr = (nums || []).filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (!arr.length) return null;
  const idx = Math.min(arr.length - 1, Math.max(0, Math.round((p / 100) * (arr.length - 1))));
  return arr[idx];
}

export function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "-";
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(ms / 3600000);
  if (hours < 48) return `${hours}h`;
  const days = Math.round(ms / 86400000);
  return `${days}d`;
}

export function enrichRows(rows) {
  return (rows || []).map((r) => {
    const status = String(r.status || "").trim().toLowerCase();
    const requesterType = String(r.requester_type || "").trim().toLowerCase();
    const submittedTs = toTs(r.submitted_at);
    const handledTs = toTs(r.handled_at);
    const turnaroundMs =
      handledTs && submittedTs && handledTs >= submittedTs ? handledTs - submittedTs : null;

    return {
      ...r,
      __status: status,
      __requesterType: requesterType,
      __submittedTs: submittedTs,
      __handledTs: handledTs,
      __turnaroundMs: turnaroundMs,
    };
  });
}

export function withinRange(ts, fromTs, toTs) {
  if (!ts) return false;
  return ts >= fromTs && ts <= toTs;
}

export function computeKpis(allRows, fromTs, toTs) {
  const received = allRows.filter((r) => withinRange(r.__submittedTs, fromTs, toTs));
  const completed = allRows.filter(
    (r) =>
      (r.__status === "approved" || r.__status === "rejected") &&
      withinRange(r.__handledTs, fromTs, toTs)
  );

  const pendingNow = allRows.filter((r) => r.__status === "pending");
  const pendingReceivedInRange = received.filter((r) => r.__status === "pending");

  const turnaroundList = completed
    .map((r) => r.__turnaroundMs)
    .filter((ms) => Number.isFinite(ms));

  const avgTurnaround =
    turnaroundList.length > 0
      ? turnaroundList.reduce((a, b) => a + b, 0) / turnaroundList.length
      : null;

  const medTurnaround = median(turnaroundList);
  const p90Turnaround = percentile(turnaroundList, 90);

  const completionRate =
    received.length > 0 ? Math.round((completed.length / received.length) * 1000) / 10 : 0;

  return {
    receivedCount: received.length,
    completedCount: completed.length,
    pendingNowCount: pendingNow.length,
    pendingReceivedInRangeCount: pendingReceivedInRange.length,
    completionRate,
    avgTurnaround,
    medTurnaround,
    p90Turnaround,
    received,
    completed,
    pendingNow,
  };
}

export function computeTrend(allRows, fromTs, toTs) {
  const keys = buildDayKeys(fromTs, toTs);

  const receivedMap = Object.fromEntries(keys.map((k) => [k, 0]));
  const completedMap = Object.fromEntries(keys.map((k) => [k, 0]));

  for (const r of allRows) {
    if (r.__submittedTs && withinRange(r.__submittedTs, fromTs, toTs)) {
      const k = dayKey(r.__submittedTs);
      if (receivedMap[k] !== undefined) receivedMap[k]++;
    }
    if (
      (r.__status === "approved" || r.__status === "rejected") &&
      r.__handledTs &&
      withinRange(r.__handledTs, fromTs, toTs)
    ) {
      const k = dayKey(r.__handledTs);
      if (completedMap[k] !== undefined) completedMap[k]++;
    }
  }

  const values = keys.map((k) => ({
    key: k,
    day: k,
    received: receivedMap[k] || 0,
    completed: completedMap[k] || 0,
  }));

  const max = Math.max(
    1,
    ...values.map((v) => Math.max(v.received, v.completed))
  );

  return { keys, values, max };
}

export function groupBreakdown(rows, groupKey) {
  const map = new Map();

  for (const r of rows) {
    const raw = r[groupKey];
    const label = String(raw || "Unspecified").trim() || "Unspecified";

    if (!map.has(label)) {
      map.set(label, {
        label,
        received: 0,
        completed: 0,
        approved: 0,
        rejected: 0,
        turnaroundList: [],
      });
    }

    const item = map.get(label);
    item.received++;

    if (r.__status === "approved" || r.__status === "rejected") {
      item.completed++;
      if (r.__status === "approved") item.approved++;
      if (r.__status === "rejected") item.rejected++;
      if (Number.isFinite(r.__turnaroundMs)) item.turnaroundList.push(r.__turnaroundMs);
    }
  }

  const out = Array.from(map.values()).map((x) => {
    const avg =
      x.turnaroundList.length > 0
        ? x.turnaroundList.reduce((a, b) => a + b, 0) / x.turnaroundList.length
        : null;

    const med = median(x.turnaroundList);

    const approvalRate = x.completed > 0 ? Math.round((x.approved / x.completed) * 1000) / 10 : 0;

    return {
      ...x,
      avgTurnaround: avg,
      medTurnaround: med,
      approvalRate,
    };
  });

  out.sort((a, b) => b.received - a.received);
  return out;
}

export function computeSla(rows, slaDaysByType) {
  const now = Date.now();

  const pending = rows.filter((r) => r.__status === "pending" && r.__submittedTs);
  const completed = rows.filter(
    (r) =>
      (r.__status === "approved" || r.__status === "rejected") &&
      Number.isFinite(r.__turnaroundMs)
  );

  const completedWithin = [];
  const completedOver = [];

  for (const r of completed) {
    const days = slaDaysByType[r.__requesterType] ?? slaDaysByType.default;
    const limitMs = days * 86400000;
    if (r.__turnaroundMs <= limitMs) completedWithin.push(r);
    else completedOver.push(r);
  }

  const overduePending = pending
    .map((r) => {
      const days = slaDaysByType[r.__requesterType] ?? slaDaysByType.default;
      const limitMs = days * 86400000;
      const ageMs = now - r.__submittedTs;
      const overdueByMs = ageMs - limitMs;
      return { r, days, ageMs, overdueByMs };
    })
    .filter((x) => x.overdueByMs > 0)
    .sort((a, b) => b.overdueByMs - a.overdueByMs);

  const compliance =
    completed.length > 0 ? Math.round((completedWithin.length / completed.length) * 1000) / 10 : 0;

  return {
    compliance,
    completedCount: completed.length,
    withinCount: completedWithin.length,
    overCount: completedOver.length,
    overduePendingCount: overduePending.length,
    overduePendingTop: overduePending.slice(0, 10),
  };
}