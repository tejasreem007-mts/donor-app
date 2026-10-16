"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [recipients, setRecipients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [matches, setMatches] = useState([]);
  const [msg, setMsg] = useState("");

  async function loadRecipients() {
    const res = await fetch("/api/recipients");
    setRecipients(await res.json());
  }

  useEffect(() => {
    loadRecipients();
  }, []);

  async function findMatches(r) {
    setSelected(r);
    setMsg("");
    const res = await fetch("/api/matches/" + r.RECIPIENT_ID);
    setMatches(await res.json());
  }

  async function confirmMatch(donorId) {
    await fetch("/api/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorId, recipientId: selected.RECIPIENT_ID }),
    });
    setMsg("Match confirmed for " + selected.FULL_NAME);
    setMatches([]);
    setSelected(null);
    loadRecipients();
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <h1 className="text-2xl font-bold mb-1">Blood & Organ Donor Matching</h1>
      <p className="text-gray-600 mb-2">Pick a recipient and find compatible donors.</p><a href="/add" className="mb-6 inline-block text-blue-600 underline">+ Add donor or recipient</a>

      {msg && <p className="mb-4 rounded bg-green-100 p-3 text-green-800">{msg}</p>}

      <h2 className="text-lg font-semibold mb-2">Recipients</h2>
      <div className="overflow-x-auto mb-8">
        <table className="w-full bg-white border text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Group</th>
              <th className="p-2">Need</th>
              <th className="p-2">Urgency</th>
              <th className="p-2">Hospital</th>
              <th className="p-2">Status</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.RECIPIENT_ID} className="border-t">
                <td className="p-2">{r.FULL_NAME}</td>
                <td className="p-2">{r.BLOOD_GROUP}</td>
                <td className="p-2">{r.NEED_TYPE === "organ" ? r.ORGAN_NEEDED : "blood"}</td>
                <td className="p-2">{r.URGENCY}/5</td>
                <td className="p-2">{r.HOSPITAL}</td>
                <td className="p-2">{r.STATUS}</td>
                <td className="p-2">
                  {r.STATUS === "waiting" && (
                    <button
                      onClick={() => findMatches(r)}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      Find matches
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div>
          <h2 className="text-lg font-semibold mb-2">
            Compatible donors for {selected.FULL_NAME} ({selected.BLOOD_GROUP})
          </h2>
          {matches.length === 0 ? (
            <p className="text-gray-600">No compatible donors found.</p>
          ) : (
            <table className="w-full bg-white border text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Group</th>
                  <th className="p-2">City</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {matches.map((d) => (
                  <tr key={d.DONOR_ID} className="border-t">
                    <td className="p-2">{d.FULL_NAME}</td>
                    <td className="p-2">{d.BLOOD_GROUP}</td>
                    <td className="p-2">{d.CITY}</td>
                    <td className="p-2">{d.PHONE}</td>
                    <td className="p-2">
                      <button
                        onClick={() => confirmMatch(d.DONOR_ID)}
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                      >
                        Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}

