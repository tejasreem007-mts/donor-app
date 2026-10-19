"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ModeBanner } from "../../components/ModeBanner";
import { useMock } from "../../context/MockContext";
import { getHospitals, addRecipient } from "../../lib/api";
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function RegisterRecipientPage() {
  const { isMockMode } = useMock();
  const [hospitals, setHospitals] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    bloodGroup: "O+",
    city: "",
    hospitalId: "",
    needType: "blood",
    organNeeded: "",
    urgency: "3",
  });

  useEffect(() => {
    getHospitals(isMockMode).then((res) => {
      if (res.data) {
        setHospitals(res.data);
        if (res.data.length) {
          setForm((prev) => ({
            ...prev,
            hospitalId: String(res.data[0].HOSPITAL_ID),
          }));
        }
      }
    });
  }, [isMockMode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    setLoading(true);

    const res = await addRecipient(form, isMockMode);
    setLoading(false);

    if (res.success) {
      setMsg(`Recipient "${form.fullName}" enrolled successfully! Inserted into Oracle RECIPIENT table.`);
      setForm((prev) => ({
        ...prev,
        fullName: "",
        age: "",
        city: "",
        organNeeded: "",
        urgency: "3",
      }));
    } else {
      setErr(res.error || "Failed to enroll recipient in database.");
    }
  }

  const inputStyle =
    "w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-teal-600";
  const labelStyle = "block text-xs font-semibold text-slate-700 uppercase mb-1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Register Recipient
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add a patient to the waiting list in the Oracle <code className="font-mono text-teal-700">RECIPIENT</code> table
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to List</span>
        </Link>
      </div>

      <ModeBanner isMockActive={isMockMode} />

      {msg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
          <button onClick={() => setMsg("")} className="font-bold text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {err && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{err}</span>
          </div>
          <button onClick={() => setErr("")} className="font-bold text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelStyle}>Patient Full Name *</label>
            <input
              required
              className={inputStyle}
              placeholder="e.g. Anjali Deshmukh"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Age *</label>
              <input
                required
                type="number"
                min="1"
                max="100"
                className={inputStyle}
                placeholder="35"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Blood Group *</label>
              <select
                className={inputStyle}
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              >
                {bloodGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>City *</label>
              <input
                required
                className={inputStyle}
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <label className={labelStyle}>Hospital Facility *</label>
              <select
                className={inputStyle}
                value={form.hospitalId}
                onChange={(e) => setForm({ ...form, hospitalId: e.target.value })}
              >
                {hospitals.map((h) => (
                  <option key={h.HOSPITAL_ID} value={h.HOSPITAL_ID}>
                    {h.NAME} ({h.CITY})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>Requirement Type *</label>
              <select
                className={inputStyle}
                value={form.needType}
                onChange={(e) => setForm({ ...form, needType: e.target.value })}
              >
                <option value="blood">Blood</option>
                <option value="organ">Organ</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Urgency Level (1 to 5) *</label>
              <select
                className={inputStyle}
                value={form.urgency}
                onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              >
                {[1, 2, 3, 4, 5].map((u) => (
                  <option key={u} value={u}>
                    Level {u} {u >= 4 ? "(Critical)" : u === 3 ? "(Moderate)" : "(Normal)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.needType === "organ" && (
            <div>
              <label className={labelStyle}>Organ Needed *</label>
              <input
                required
                className={inputStyle}
                placeholder="e.g. kidney, liver, cornea"
                value={form.organNeeded}
                onChange={(e) => setForm({ ...form, organNeeded: e.target.value })}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-teal-600 hover:bg-teal-700 py-2.5 text-white text-sm font-semibold transition shadow-xs disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Enrolling Recipient..." : "Enroll Recipient"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
