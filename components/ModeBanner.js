"use client";

import React from "react";
import { useMock } from "../context/MockContext";
import { Database, AlertCircle, CheckCircle2 } from "lucide-react";

export function ModeBanner({ isMockActive, dbError }) {
  const { isMockMode, toggleMockMode, dbStatus } = useMock();
  const usingMock = isMockActive ?? isMockMode;

  if (usingMock) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-amber-900 shadow-xs mb-6">
        <div className="flex items-start sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold">Mock Demo Mode Active:</span> Currently displaying offline mock records.
            {dbError ? (
              <span className="text-rose-800 ml-1">
                (Oracle connection offline: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">{dbError}</code>)
              </span>
            ) : (
              <span className="text-slate-600 ml-1">
                (Use this mode for demonstration when Oracle is offline.)
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleMockMode}
          className="shrink-0 self-start sm:self-auto px-2.5 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-medium text-xs transition"
        >
          Switch to Oracle Live
        </button>
      </div>
    );
  }

  if (dbError || dbStatus === "offline") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-rose-900 shadow-xs mb-6">
        <div className="flex items-start sm:items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <span className="font-semibold">Oracle Database Connection Error:</span> Unable to reach Oracle database API.
            {dbError && (
              <span className="block sm:inline ml-0 sm:ml-1 font-mono text-[11px] text-rose-700">
                [{dbError}]
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleMockMode}
          className="shrink-0 self-start sm:self-auto px-2.5 py-1 rounded bg-rose-200/80 hover:bg-rose-300 text-rose-900 font-medium text-xs transition"
        >
          Enable Demo Mock Mode
        </button>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs mb-6">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <span className="font-semibold">Oracle Live Mode:</span> Connected to backend API routes and Oracle stored procedures (<code className="font-mono text-emerald-800">find_matches</code>, <code className="font-mono text-emerald-800">confirm_match</code>).
        </span>
      </div>
      <button
        onClick={toggleMockMode}
        className="shrink-0 px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-medium text-xs transition"
      >
        Switch to Mock
      </button>
    </div>
  );
}
