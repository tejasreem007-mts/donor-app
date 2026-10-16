import { getConn, oracledb } from "../../../lib/db";

export async function GET() {
  const conn = await getConn();
  try {
    const r = await conn.execute(
      "select donor_id, full_name, age, blood_group, city, phone, available from donor order by donor_id"
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
    const r = await conn.execute(
      "insert into donor (full_name, age, blood_group, city, phone) values (:n, :a, :g, :c, :p) returning donor_id into :id",
      {
        n: b.fullName,
        a: Number(b.age),
        g: b.bloodGroup,
        c: b.city,
        p: b.phone,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      }
    );
    const id = r.outBinds.id[0];
    const organs = [...new Set((b.organs || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))];
    for (const o of organs) {
      await conn.execute("insert into donor_organ (donor_id, organ_name) values (:d, :o)", { d: id, o: o });
    }
    await conn.commit();
    return Response.json({ status: "added", donorId: id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 400 });
  } finally {
    await conn.close();
  }
}
