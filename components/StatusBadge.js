import React from "react";

export function StatusBadge({ status }) {
  const s = String(status || "").toLowerCase();

  let styles = "bg-slate-100 text-slate-700 border-slate-200";

  if (s === "waiting" || s === "pending") {
    styles = "bg-amber-50 text-amber-800 border-amber-300 font-medium";
  } else if (s === "matched" || s === "y" || s === "available" || s === "added") {
    styles = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
  } else if (s === "n" || s === "cancelled" || s === "expired") {
    styles = "bg-rose-50 text-rose-800 border-rose-300";
  } else if (s === "used" || s === "reserved") {
    styles = "bg-sky-50 text-sky-800 border-sky-300";
  }

  let label = status;
  if (s === "y") label = "Available";
  if (s === "n") label = "Matched / Inactive";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${styles}`}>
      {label}
    </span>
  );
}
