"use client";
import { useEffect, useState } from "react";

const groups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const input = "w-full rounded border p-2 bg-white";
const btn = "rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700";

export default function AddPage() {
  const [hospitals, setHospitals] = useState([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [d, setD] = useState({ fullName: "", age: "", bloodGroup: "O+", city: "", phone: "", organs: "" });
  const [r, setR] = useState({ fullName: "", age: "", bloodGroup: "O+", city: "", hospitalId: "", needType: "blood", organNeeded: "", urgency: "3" });

  useEffect(() => {
    fetch("/api/hospitals")
      .then((x) => x.json())
      .then((h) => {
        setHospitals(h);
        if (h.length) setR((p) => ({ ...p, hospitalId: String(h[0].HOSPITAL_ID) }));
      });
  }, []);

  async function submit(url, body, reset) {
    setMsg("");
    setErr("");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Saved successfully");
      reset();
    } else {
      setErr(data.error || "Something went wrong");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <a href="/" className="text-blue-600 underline">Back to matching</a>
      <h1 className="text-2xl font-bold my-4">Add donor or recipient</h1>
      {msg && <p className="mb-4 rounded bg-green-100 p-3 text-green-800">{msg}</p>}
      {err && <p className="mb-4 rounded bg-red-100 p-3 text-red-800">{err}</p>}

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold">New donor</h2>
          <input className={input} placeholder="Full name" value={d.fullName} onChange={(e) => setD({ ...d, fullName: e.target.value })} />
          <input className={input} placeholder="Age (18 to 65)" type="number" value={d.age} onChange={(e) => setD({ ...d, age: e.target.value })} />
          <select className={input} value={d.bloodGroup} onChange={(e) => setD({ ...d, bloodGroup: e.target.value })}>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          <input className={input} placeholder="City" value={d.city} onChange={(e) => setD({ ...d, city: e.target.value })} />
          <input className={input} placeholder="Phone" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
          <input className={input} placeholder="Organs to donate (comma separated, optional)" value={d.organs} onChange={(e) => setD({ ...d, organs: e.target.value })} />
          <button className={btn} onClick={() => submit("/api/donors", d, () => setD({ fullName: "", age: "", bloodGroup: "O+", city: "", phone: "", organs: "" }))}>
            Add donor
          </button>
        </section>

        <section className="rounded border bg-white p-4 space-y-3">
          <h2 className="text-lg font-semibold">New recipient</h2>
          <input className={input} placeholder="Full name" value={r.fullName} onChange={(e) => setR({ ...r, fullName: e.target.value })} />
          <input className={input} placeholder="Age" type="number" value={r.age} onChange={(e) => setR({ ...r, age: e.target.value })} />
          <select className={input} value={r.bloodGroup} onChange={(e) => setR({ ...r, bloodGroup: e.target.value })}>
            {groups.map((g) => <option key={g}>{g}</option>)}
          </select>
          <input className={input} placeholder="City" value={r.city} onChange={(e) => setR({ ...r, city: e.target.value })} />
          <select className={input} value={r.hospitalId} onChange={(e) => setR({ ...r, hospitalId: e.target.value })}>
            {hospitals.map((h) => <option key={h.HOSPITAL_ID} value={h.HOSPITAL_ID}>{h.NAME}</option>)}
          </select>
          <select className={input} value={r.needType} onChange={(e) => setR({ ...r, needType: e.target.value })}>
            <option value="blood">Blood</option>
            <option value="organ">Organ</option>
          </select>
          {r.needType === "organ" && (
            <input className={input} placeholder="Organ needed (e.g. kidney)" value={r.organNeeded} onChange={(e) => setR({ ...r, organNeeded: e.target.value })} />
          )}
          <select className={input} value={r.urgency} onChange={(e) => setR({ ...r, urgency: e.target.value })}>
            {[1, 2, 3, 4, 5].map((u) => <option key={u} value={u}>Urgency {u}</option>)}
          </select>
          <button className={btn} onClick={() => submit("/api/recipients", r, () => setR({ ...r, fullName: "", age: "", city: "", organNeeded: "" }))}>
            Add recipient
          </button>
        </section>
      </div>
    </main>
  );
}
