/**
 * Realistic Mock Data Store for offline development and college project demonstration.
 * Mirrors the exact Oracle schema fields of donor-app-main.
 */

export const mockHospitals = [
  { HOSPITAL_ID: 1, NAME: "Apex Multi-Specialty Hospital", CITY: "Mumbai" },
  { HOSPITAL_ID: 2, NAME: "City Care Trauma Center", CITY: "Pune" },
  { HOSPITAL_ID: 3, NAME: "Metro Heart & Renal Institute", CITY: "Hyderabad" },
  { HOSPITAL_ID: 4, NAME: "St. Jude Memorial Hospital", CITY: "Bengaluru" },
  { HOSPITAL_ID: 5, NAME: "Lifeline Health Research", CITY: "Chennai" },
];

export const mockDonors = [
  {
    DONOR_ID: 101,
    FULL_NAME: "Dr. Rajesh Sharma",
    AGE: 34,
    BLOOD_GROUP: "O+",
    CITY: "Mumbai",
    PHONE: "+91 98765 43210",
    AVAILABLE: "Y",
    ORGANS: "kidney,liver",
  },
  {
    DONOR_ID: 102,
    FULL_NAME: "Pooja Hegde",
    AGE: 28,
    BLOOD_GROUP: "A+",
    CITY: "Pune",
    PHONE: "+91 98220 11223",
    AVAILABLE: "Y",
    ORGANS: "cornea",
  },
  {
    DONOR_ID: 103,
    FULL_NAME: "Vikramaditya Rao",
    AGE: 45,
    BLOOD_GROUP: "B-",
    CITY: "Hyderabad",
    PHONE: "+91 94401 88776",
    AVAILABLE: "Y",
    ORGANS: "kidney",
  },
  {
    DONOR_ID: 104,
    FULL_NAME: "Sunita Menon",
    AGE: 39,
    BLOOD_GROUP: "O-",
    CITY: "Bengaluru",
    PHONE: "+91 91234 56789",
    AVAILABLE: "Y",
    ORGANS: "kidney,liver,heart",
  },
  {
    DONOR_ID: 105,
    FULL_NAME: "Mohammed Farhan",
    AGE: 29,
    BLOOD_GROUP: "AB+",
    CITY: "Chennai",
    PHONE: "+91 98450 67890",
    AVAILABLE: "N", // already matched
    ORGANS: "liver",
  },
];

export const mockRecipients = [
  {
    RECIPIENT_ID: 201,
    FULL_NAME: "Sanjay Kapoor",
    AGE: 52,
    BLOOD_GROUP: "O+",
    CITY: "Mumbai",
    HOSPITAL_ID: 1,
    HOSPITAL: "Apex Multi-Specialty Hospital",
    NEED_TYPE: "organ",
    ORGAN_NEEDED: "kidney",
    URGENCY: 5, // critical
    STATUS: "waiting",
  },
  {
    RECIPIENT_ID: 202,
    FULL_NAME: "Meera Sen",
    AGE: 34,
    BLOOD_GROUP: "A+",
    CITY: "Pune",
    HOSPITAL_ID: 2,
    HOSPITAL: "City Care Trauma Center",
    NEED_TYPE: "blood",
    ORGAN_NEEDED: null,
    URGENCY: 4,
    STATUS: "waiting",
  },
  {
    RECIPIENT_ID: 203,
    FULL_NAME: "Rohan Joshi",
    AGE: 41,
    BLOOD_GROUP: "B-",
    CITY: "Hyderabad",
    HOSPITAL_ID: 3,
    HOSPITAL: "Metro Heart & Renal Institute",
    NEED_TYPE: "organ",
    ORGAN_NEEDED: "kidney",
    URGENCY: 5,
    STATUS: "waiting",
  },
  {
    RECIPIENT_ID: 204,
    FULL_NAME: "Kavita Pillai",
    AGE: 23,
    BLOOD_GROUP: "O-",
    CITY: "Bengaluru",
    HOSPITAL_ID: 4,
    HOSPITAL: "St. Jude Memorial Hospital",
    NEED_TYPE: "blood",
    ORGAN_NEEDED: null,
    URGENCY: 3,
    STATUS: "waiting",
  },
  {
    RECIPIENT_ID: 205,
    FULL_NAME: "Harish Kulkarni",
    AGE: 60,
    BLOOD_GROUP: "AB+",
    CITY: "Chennai",
    HOSPITAL_ID: 5,
    HOSPITAL: "Lifeline Health Research",
    NEED_TYPE: "organ",
    ORGAN_NEEDED: "liver",
    URGENCY: 4,
    STATUS: "matched",
  },
];

// Compatibility rules mirroring the Oracle function is_compatible()
export function mockIsCompatible(donorGroup, recipGroup) {
  const dRh = donorGroup.slice(-1);
  const rRh = recipGroup.slice(-1);
  const dABO = donorGroup.slice(0, -1);
  const rABO = recipGroup.slice(0, -1);

  if (dRh === "+" && rRh === "-") return false;
  if (dABO === "O") return true;
  if (dABO === rABO) return true;
  if (rABO === "AB") return true;
  return false;
}

// Mock prototypes for Inventory & Reports (clearly labeled as mock-only)
export const mockBloodInventory = [
  { id: "BLD-5001", bloodGroup: "O+", donorId: 101, hospital: "Apex Multi-Specialty Hospital", collectionDate: "2026-09-20", expiryDate: "2026-10-25", status: "AVAILABLE", location: "Vault A-1" },
  { id: "BLD-5002", bloodGroup: "A+", donorId: 102, hospital: "City Care Trauma Center", collectionDate: "2026-10-01", expiryDate: "2026-11-05", status: "AVAILABLE", location: "Vault B-2" },
  { id: "BLD-5003", bloodGroup: "B-", donorId: 103, hospital: "Metro Heart & Renal Institute", collectionDate: "2026-09-12", expiryDate: "2026-10-17", status: "RESERVED", location: "Vault C-1" },
  { id: "BLD-5004", bloodGroup: "O-", donorId: 104, hospital: "St. Jude Memorial Hospital", collectionDate: "2026-08-25", expiryDate: "2026-09-30", status: "EXPIRED", location: "Quarantine Q-1" },
];

export const mockOrganInventory = [
  { id: "ORG-9001", organType: "kidney", bloodGroup: "O+", donorId: 101, hospital: "Apex Multi-Specialty Hospital", harvestDate: "2026-10-19 09:30", remainingHours: 18, status: "AVAILABLE", method: "Hypothermic Machine Perfusion" },
  { id: "ORG-9002", organType: "liver", bloodGroup: "B-", donorId: 103, hospital: "Metro Heart & Renal Institute", harvestDate: "2026-10-19 11:00", remainingHours: 6.5, status: "AVAILABLE", method: "Normothermic Regional Perfusion" },
  { id: "ORG-9003", organType: "cornea", bloodGroup: "A+", donorId: 102, hospital: "City Care Trauma Center", harvestDate: "2026-10-17 14:00", remainingHours: 240, status: "AVAILABLE", method: "Optisol-GS Storage" },
];

export const mockHospitalReports = [
  { hospitalName: "Apex Multi-Specialty Hospital", city: "Mumbai", bloodCount: 145, organCount: 18, totalDonations: 163, matches: 142 },
  { hospitalName: "City Care Trauma Center", city: "Pune", bloodCount: 112, organCount: 12, totalDonations: 124, matches: 105 },
  { hospitalName: "Metro Heart & Renal Institute", city: "Hyderabad", bloodCount: 98, organCount: 24, totalDonations: 122, matches: 110 },
  { hospitalName: "St. Jude Memorial Hospital", city: "Bengaluru", bloodCount: 130, organCount: 15, totalDonations: 145, matches: 128 },
  { hospitalName: "Lifeline Health Research", city: "Chennai", bloodCount: 84, organCount: 9, totalDonations: 93, matches: 76 },
];
