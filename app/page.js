"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "../components/StatusBadge";
import { ModeBanner } from "../components/ModeBanner";
import { useMock } from "../context/MockContext";
import {
  getRecipients,
  getMatchesForRecipient,
  confirmMatch,
} from "../lib/api";
import {
  GitMerge,
  UserPlus,
  HeartHandshake,
  Phone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export default function HomePage() {
  const { isMockMode } = useMock();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Matching Workflow State
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [matches, setMatches] = useState([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, [isMockMode]);

  async function loadData() {
    setLoading(true);
    setDbError(null);

    const recRes = await getRecipients(isMockMode);

    setRecipients(recRes.data || []);
    setIsUsingMock(recRes.isMock);

    if (recRes.error) {
      setDbError(recRes.error);
    }

    setLoading(false);
  }

  async function handleFindMatches(recipient) {
    setSelectedRecipient(recipient);
    setMatches([]);
    setMatchLoading(true);
    setNotification(null);

    const res = await getMatchesForRecipient(recipient.RECIPIENT_ID, isMockMode);
    setMatches(res.data || []);
    setMatchLoading(false);

    if (res.error) {
      setNotification({ type: "error", message: res.error });
    }
  }

  async function handleConfirmMatch(donorId) {
    if (!selectedRecipient) return;
    setConfirmingId(donorId);

    const res = await confirmMatch(donorId, selectedRecipient.RECIPIENT_ID, isMockMode);
    setConfirmingId(null);

    if (res.success) {
      setNotification({
        type: "success",
        message: `Match confirmed successfully for recipient "${selectedRecipient.FULL_NAME}" (ID: #${selectedRecipient.RECIPIENT_ID}) with Donor #${donorId}. Oracle procedure confirm_match completed.`,
      });
      setMatches([]);
      setSelectedRecipient(null);
      loadData();
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to confirm match.",
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Recipients &amp; Donor Matching
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View patient waiting list and execute compatibility matching via Oracle PL/SQL procedure <code className="font-mono text-teal-700 font-medium">find_matches()</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/add"
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Recipient</span>
          </Link>
        </div>
      </div>

      {/* Mode / Connection Banner */}
      <ModeBanner isMockActive={isUsingMock} dbError={dbError} />

      {/* Global Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between text-xs font-medium shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Recipient Waiting List Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Recipient Waiting List
            </h2>
            <span className="text-xs text-slate-500">
              {recipients.length} {recipients.length === 1 ? "patient" : "patients"} in database
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
            Table: RECIPIENT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Patient Name</th>
                <th className="py-2.5 px-4">Blood Group</th>
                <th className="py-2.5 px-4">Need Type</th>
                <th className="py-2.5 px-4">Requirement</th>
                <th className="py-2.5 px-4">Urgency</th>
                <th className="py-2.5 px-4">Hospital</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Loading recipients from database...
                  </td>
                </tr>
              ) : recipients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No recipient records found.
                  </td>
                </tr>
              ) : (
                recipients.map((r) => {
                  const isSelected = selectedRecipient?.RECIPIENT_ID === r.RECIPIENT_ID;
                  return (
                    <tr
                      key={r.RECIPIENT_ID}
                      className={`transition-colors ${
                        isSelected ? "bg-teal-50/80" : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {r.FULL_NAME}
                        <span className="block text-[11px] font-mono text-slate-400 font-normal">
                          ID: #{r.RECIPIENT_ID} &bull; Age: {r.AGE}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.BLOOD_GROUP}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${
                            r.NEED_TYPE === "blood"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-teal-50 text-teal-700 border border-teal-200"
                          }`}
                        >
                          {r.NEED_TYPE}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {r.NEED_TYPE === "organ" ? r.ORGAN_NEEDED : "Compatible Blood"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            r.URGENCY >= 4
                              ? "bg-rose-100 text-rose-800"
                              : r.URGENCY >= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          Level {r.URGENCY}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">{r.HOSPITAL || "N/A"}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={r.STATUS} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.STATUS === "waiting" ? (
                          <button
                            onClick={() => handleFindMatches(r)}
                            className="inline-flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-xs transition"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                            <span>Find Matches</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Matched</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compatible Donors Result Panel */}
      {selectedRecipient && (
        <div className="bg-white rounded-lg border border-teal-300 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="font-bold text-sm text-slate-800 flex flex-wrap items-center gap-2">
                <span>Compatible Donors for:</span>
                <span className="text-teal-700">{selectedRecipient.FULL_NAME}</span>
                <span className="px-2 py-0.5 rounded text-xs bg-slate-100 font-mono text-slate-700">
                  Blood Group: {selectedRecipient.BLOOD_GROUP}
                </span>
                <span className="px-2 py-0.5 rounded text-xs bg-teal-50 font-mono text-teal-800 border border-teal-200">
                  Need: {selectedRecipient.NEED_TYPE === "organ" ? selectedRecipient.ORGAN_NEEDED : "Blood"}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated by calling Oracle PL/SQL procedure <code className="font-mono text-teal-700">find_matches({selectedRecipient.RECIPIENT_ID})</code>
              </p>
            </div>
            <button
              onClick={() => setSelectedRecipient(null)}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium self-end sm:self-auto"
            >
              Close Results ✕
            </button>
          </div>

          {matchLoading ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Executing Oracle stored procedure find_matches...
            </div>
          ) : matches.length === 0 ? (
            <div className="py-6 text-center text-xs text-amber-800 bg-amber-50 rounded-lg border border-amber-200">
              No compatible available donors found in the database for this recipient.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2 px-3">Donor ID</th>
                    <th className="py-2 px-3">Donor Name</th>
                    <th className="py-2 px-3">Blood Group</th>
                    <th className="py-2 px-3">City</th>
                    <th className="py-2 px-3">Phone</th>
                    <th className="py-2 px-3 text-right">Confirm Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matches.map((d) => (
                    <tr key={d.DONOR_ID} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">#{d.DONOR_ID}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{d.FULL_NAME}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{d.BLOOD_GROUP}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">{d.CITY}</td>
                      <td className="py-2.5 px-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{d.PHONE}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleConfirmMatch(d.DONOR_ID)}
                          disabled={confirmingId === d.DONOR_ID}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition disabled:opacity-50"
                        >
                          {confirmingId === d.DONOR_ID ? "Confirming..." : "Confirm Match"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
