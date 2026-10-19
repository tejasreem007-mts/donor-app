/**
 * Client-Side API Adapter for donor-app-main
 *
 * Connects directly to existing Oracle API routes:
 * - GET  /api/recipients
 * - POST /api/recipients
 * - GET  /api/donors
 * - POST /api/donors
 * - GET  /api/hospitals
 * - GET  /api/matches/[id]
 * - POST /api/confirm
 *
 * Handles errors safely so failed JSON responses never crash the page.
 * Supports explicit Mock Mode when Oracle is offline.
 */

import { mockDonors, mockRecipients, mockHospitals, mockIsCompatible } from "./mockData";

// In-memory mock storage for interactive mock sessions
let mockDonorsStore = [...mockDonors];
let mockRecipientsStore = [...mockRecipients];

export async function getRecipients(forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return { success: true, data: [...mockRecipientsStore], isMock: true };
  }

  try {
    const res = await fetch("/api/recipients");
    if (!res.ok) {
      const errText = await res.text().catch(() => "HTTP " + res.status);
      return { success: false, data: [...mockRecipientsStore], isMock: true, error: `Oracle API unavailable (${res.status}): ${errText}` };
    }
    const data = await res.json();
    return { success: true, data, isMock: false };
  } catch (err) {
    return { success: false, data: [...mockRecipientsStore], isMock: true, error: `Network/DB error: ${err.message}` };
  }
}

export async function getDonors(forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return { success: true, data: [...mockDonorsStore], isMock: true };
  }

  try {
    const res = await fetch("/api/donors");
    if (!res.ok) {
      const errText = await res.text().catch(() => "HTTP " + res.status);
      return { success: false, data: [...mockDonorsStore], isMock: true, error: `Oracle API unavailable (${res.status}): ${errText}` };
    }
    const data = await res.json();
    return { success: true, data, isMock: false };
  } catch (err) {
    return { success: false, data: [...mockDonorsStore], isMock: true, error: `Network/DB error: ${err.message}` };
  }
}

export async function getHospitals(forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    return { success: true, data: [...mockHospitals], isMock: true };
  }

  try {
    const res = await fetch("/api/hospitals");
    if (!res.ok) {
      return { success: false, data: [...mockHospitals], isMock: true };
    }
    const data = await res.json();
    return { success: true, data, isMock: false };
  } catch (err) {
    return { success: false, data: [...mockHospitals], isMock: true };
  }
}

export async function getMatchesForRecipient(recipientId, forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    const recipient = mockRecipientsStore.find((r) => r.RECIPIENT_ID === Number(recipientId));
    if (!recipient) return { success: true, data: [], isMock: true };

    const compatible = mockDonorsStore.filter((d) => {
      if (d.AVAILABLE !== "Y") return false;
      const isBloodMatch = mockIsCompatible(d.BLOOD_GROUP, recipient.BLOOD_GROUP);
      if (!isBloodMatch) return false;
      if (recipient.NEED_TYPE === "organ") {
        const donorOrgans = (d.ORGANS || "").split(",").map((s) => s.trim().toLowerCase());
        return donorOrgans.includes((recipient.ORGAN_NEEDED || "").toLowerCase());
      }
      return true;
    });

    return { success: true, data: compatible, isMock: true };
  }

  try {
    const res = await fetch(`/api/matches/${recipientId}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => "HTTP " + res.status);
      return { success: false, data: [], isMock: true, error: `Oracle match query failed: ${errText}` };
    }
    const data = await res.json();
    return { success: true, data, isMock: false };
  } catch (err) {
    return { success: false, data: [], isMock: true, error: `Match query error: ${err.message}` };
  }
}

export async function confirmMatch(donorId, recipientId, forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    const targetDonor = mockDonorsStore.find((d) => d.DONOR_ID === Number(donorId));
    const targetRecip = mockRecipientsStore.find((r) => r.RECIPIENT_ID === Number(recipientId));
    if (targetDonor) targetDonor.AVAILABLE = "N";
    if (targetRecip) targetRecip.STATUS = "matched";
    return { success: true, status: "matched", isMock: true };
  }

  try {
    const res = await fetch("/api/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorId, recipientId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { success: true, ...data, isMock: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addDonor(donorData, forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    const newDonor = {
      DONOR_ID: Math.floor(100 + Math.random() * 900),
      FULL_NAME: donorData.fullName,
      AGE: Number(donorData.age),
      BLOOD_GROUP: donorData.bloodGroup,
      CITY: donorData.city,
      PHONE: donorData.phone,
      AVAILABLE: "Y",
      ORGANS: donorData.organs,
    };
    mockDonorsStore.unshift(newDonor);
    return { success: true, status: "added", donorId: newDonor.DONOR_ID, isMock: true };
  }

  try {
    const res = await fetch("/api/donors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donorData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || "Failed to add donor" };
    return { success: true, ...data, isMock: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function addRecipient(recipData, forceMock = false) {
  if (forceMock || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
    const newRecip = {
      RECIPIENT_ID: Math.floor(200 + Math.random() * 800),
      FULL_NAME: recipData.fullName,
      AGE: Number(recipData.age),
      BLOOD_GROUP: recipData.bloodGroup,
      CITY: recipData.city,
      HOSPITAL_ID: Number(recipData.hospitalId),
      HOSPITAL: "Associated Hospital",
      NEED_TYPE: recipData.needType,
      ORGAN_NEEDED: recipData.needType === "organ" ? recipData.organNeeded : null,
      URGENCY: Number(recipData.urgency),
      STATUS: "waiting",
    };
    mockRecipientsStore.unshift(newRecip);
    return { success: true, status: "added", isMock: true };
  }

  try {
    const res = await fetch("/api/recipients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: data.error || "Failed to add recipient" };
    return { success: true, ...data, isMock: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
