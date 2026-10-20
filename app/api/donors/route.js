import { getConn, oracledb } from "../../../lib/db";

const VALID_BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export async function GET() {
  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      `select d.donor_id, d.full_name, d.age, d.blood_group, d.city, d.phone, d.available,
              (select listagg(organ_name, ', ') within group (order by organ_name)
               from donor_organ where donor_id = d.donor_id) as organs
       from donor d
       order by d.donor_id`
    );
    return Response.json(r.rows);
  } catch (e) {
    return Response.json(
      { error: `Database query failed: ${e.message}` },
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
  const phone = (b.phone || "").trim();

  if (!fullName) {
    return Response.json({ error: "Full name is required" }, { status: 400 });
  }
  if (isNaN(age) || age < 18 || age > 65) {
    return Response.json({ error: "Donor age must be between 18 and 65" }, { status: 400 });
  }
  if (!VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return Response.json({ error: `Invalid blood group (${bloodGroup}). Must be one of: ${VALID_BLOOD_GROUPS.join(", ")}` }, { status: 400 });
  }
  if (!phone) {
    return Response.json({ error: "Phone number is required" }, { status: 400 });
  }

  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      "insert into donor (full_name, age, blood_group, city, phone) values (:n, :a, :g, :c, :p) returning donor_id into :id",
      {
        n: fullName,
        a: age,
        g: bloodGroup,
        c: city || null,
        p: phone,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const id = r.outBinds.id[0];

    // Normalize organs (handle string or array)
    let organs = [];
    if (Array.isArray(b.organs)) {
      organs = b.organs.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
    } else if (typeof b.organs === "string") {
      organs = b.organs.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    }
    const uniqueOrgans = [...new Set(organs)];

    for (const o of uniqueOrgans) {
      await conn.execute(
        "insert into donor_organ (donor_id, organ_name) values (:d, :o)",
        { d: id, o: o }
      );
    }

    await conn.commit();
    return Response.json({ status: "added", donorId: id });
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
