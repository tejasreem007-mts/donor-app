import { getConn } from "../../../lib/db";

export async function GET() {
  const conn = await getConn();
  try {
    const r = await conn.execute(
      `select r.recipient_id, r.full_name, r.blood_group, r.need_type,
              r.organ_needed, r.urgency, r.status, h.name as hospital
       from recipient r left join hospital h on h.hospital_id = r.hospital_id
       order by r.urgency desc`
    );
    return Response.json(r.rows);
  } finally {
    await conn.close();
  }
}

export async function POST(req) {
  const b = await req.json();
  const conn = await getConn();
  try {
    await conn.execute(
      `insert into recipient (full_name, age, blood_group, city, hospital_id, need_type, organ_needed, urgency)
       values (:n, :a, :g, :c, :h, :t, :o, :u)`,
      {
        n: b.fullName,
        a: Number(b.age),
        g: b.bloodGroup,
        c: b.city,
        h: Number(b.hospitalId),
        t: b.needType,
        o: b.needType === "organ" ? (b.organNeeded || "").trim().toLowerCase() : null,
        u: Number(b.urgency),
      }
    );
    await conn.commit();
    return Response.json({ status: "added" });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  } finally {
    await conn.close();
  }
}
