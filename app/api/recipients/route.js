import { getConn } from "../../../lib/db";

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const VALID_NEED_TYPES = ["blood", "organ"];

export async function GET() {
  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      `select r.recipient_id, r.full_name, r.age, r.blood_group, r.city, r.need_type,
              r.organ_needed, r.urgency, r.status, h.name as hospital
       from recipient r
       left join hospital h on h.hospital_id = r.hospital_id
       order by r.urgency desc, r.recipient_id desc`
    );
    return Response.json(r.rows);
  } catch (e) {
    return Response.json(
      { error: `Failed to fetch recipients: ${e.message}` },
      { status: 500 }
    );
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (_) {}
    }
  }
}

export async function POST(req) {
  let b;
  try {
    b = await req.json();
  } catch (_) {
    return Response.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  // Input Validation
  const fullName = (b.fullName || "").trim();
  const age = Number(b.age);
  const bloodGroup = (b.bloodGroup || "").trim().toUpperCase();
  const city = (b.city || "").trim();
  const hospitalId = Number(b.hospitalId);
  const needType = (b.needType || "").trim().toLowerCase();
  const urgency = Number(b.urgency);
  const organNeeded = needType === "organ" ? (b.organNeeded || "").trim().toLowerCase() : null;

  if (!fullName) {
    return Response.json({ error: "Recipient full name is required" }, { status: 400 });
  }
  if (isNaN(age) || age < 0 || age > 120) {
    return Response.json({ error: "Valid age is required (0-120)" }, { status: 400 });
  }
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return Response.json({ error: `Invalid blood group (${bloodGroup}). Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}` }, { status: 400 });
  }
  if (!hospitalId || isNaN(hospitalId)) {
    return Response.json({ error: "A valid Hospital must be selected" }, { status: 400 });
  }
  if (!VALID_NEED_TYPES.includes(needType)) {
    return Response.json({ error: "needType must be either 'blood' or 'organ'" }, { status: 400 });
  }
  if (needType === "organ" && !organNeeded) {
    return Response.json({ error: "Organ name is required when need type is 'organ'" }, { status: 400 });
  }
  if (isNaN(urgency) || urgency < 1 || urgency > 5) {
    return Response.json({ error: "Urgency level must be between 1 (low) and 5 (critical)" }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConn();
    await conn.execute(
      `insert into recipient (full_name, age, blood_group, city, hospital_id, need_type, organ_needed, urgency)
       values (:n, :a, :g, :c, :h, :t, :o, :u)`,
      {
        n: fullName,
        a: age,
        g: bloodGroup,
        c: city || null,
        h: hospitalId,
        t: needType,
        o: organNeeded,
        u: urgency,
      }
    );
    await conn.commit();
    return Response.json({ status: "added" });
  } catch (e) {
    if (conn) {
      try {
        await conn.rollback();
      } catch (_) {}
    }
    return Response.json({ error: e.message }, { status: 400 });
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (_) {}
    }
  }
}
