"use client";

import React, { useEffect, useState } from "react";
import { StatusBadge } from "../../components/StatusBadge";
import { ModeBanner } from "../../components/ModeBanner";
import { useMock } from "../../context/MockContext";
import { getDonors, addDonor } from "../../lib/api";
import {
  Search,
  Plus,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
} from "lucide-react";

export default function DonorsPage() {
  const { isMockMode } = useMock();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [bloodFilter, setBloodFilter] = useState("ALL");
  const [availFilter, setAvailFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form state matching existing POST /api/donors
  const [form, setForm] = useState({
    fullName: "",
    age: "",
    bloodGroup: "O+",
    city: "",
    phone: "",
    organs: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDonors();
  }, [isMockMode]);

  async function loadDonors() {
    setLoading(true);
    setDbError(null);
    const res = await getDonors(isMockMode);
    setDonors(res.data || []);
    setIsUsingMock(res.isMock);
    if (res.error) setDbError(res.error);
    setLoading(false);
  }

  async function handleRegister(e) {
    e.preventDefault();
    setSubmitting(true);
    const res = await addDonor(form, isMockMode);
    setSubmitting(false);

    if (res.success) {
      setNotification({
        type: "success",
        message: `Donor "${form.fullName}" registered successfully! Inserted into Oracle DONOR table (Assigned ID: #${res.donorId || "N/A"}).`,
      });
      setShowModal(false);
      setForm({
        fullName: "",
        age: "",
        bloodGroup: "O+",
        city: "",
        phone: "",
        organs: "",
      });
      loadDonors();
    } else {
      setNotification({
        type: "error",
        message: res.error || "Failed to register donor.",
      });
    }
  }

  const filtered = donors.filter((d) => {
    const matchesSearch =
      (d.FULL_NAME || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.CITY || "").toLowerCase().includes(search.toLowerCase()) ||
      String(d.DONOR_ID || "").includes(search);
    const matchesBlood = bloodFilter === "ALL" || d.BLOOD_GROUP === bloodFilter;
    const matchesAvail = availFilter === "ALL" || d.AVAILABLE === availFilter;
    return matchesSearch && matchesBlood && matchesAvail;
  });

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Donor Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Voluntary blood and organ donors recorded in Oracle <code className="font-mono text-teal-700">DONOR</code> and <code className="font-mono text-teal-700">DONOR_ORGAN</code> tables
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDonors}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register Donor</span>
          </button>
        </div>
      </div>

      <ModeBanner isMockActive={isUsingMock} dbError={dbError} />

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
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, ID, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase">Blood:</span>
            <select
              value={bloodFilter}
              onChange={(e) => setBloodFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
            >
              <option value="ALL">All Groups</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase">Status:</span>
            <select
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700"
            >
              <option value="ALL">All Status</option>
              <option value="Y">Available (Y)</option>
              <option value="N">Matched / Inactive (N)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Donors Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Registered Donors</h2>
            <span className="text-xs text-slate-500">
              Showing {filtered.length} of {donors.length} donors
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
            Table: DONOR
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Donor ID</th>
                <th className="py-2.5 px-4">Full Name</th>
                <th className="py-2.5 px-4">Age</th>
                <th className="py-2.5 px-4">Blood Group</th>
                <th className="py-2.5 px-4">City</th>
                <th className="py-2.5 px-4">Phone</th>
                <th className="py-2.5 px-4">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    Loading donors from database...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No donors matching the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.DONOR_ID} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      #{d.DONOR_ID}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{d.FULL_NAME}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{d.AGE} yrs</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{d.BLOOD_GROUP}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{d.CITY || "N/A"}</td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.PHONE || "N/A"}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.AVAILABLE} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Registering a New Donor */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-800">Register Donor</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Age (18-65) *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    required
                    placeholder="28"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  >
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98220 12345"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Organs to Donate (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. kidney, liver (comma separated)"
                  value={form.organs}
                  onChange={(e) => setForm({ ...form, organs: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-md p-2 focus:ring-1 focus:ring-teal-600 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Stored in DONOR_ORGAN table</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Donor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
