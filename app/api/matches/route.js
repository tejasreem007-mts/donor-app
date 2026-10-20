import { getConn } from "../../../lib/db";

export async function GET() {
  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      `select m.match_id, m.matched_on,
              d.donor_id, d.full_name as donor_name, d.blood_group as donor_blood, d.city as donor_city, d.phone as donor_phone,
              r.recipient_id, r.full_name as recipient_name, r.blood_group as recipient_blood, r.need_type, r.organ_needed,
              h.name as hospital_name
       from match_log m
       join donor d on d.donor_id = m.donor_id
       join recipient r on r.recipient_id = m.recipient_id
       left join hospital h on h.hospital_id = r.hospital_id
       order by m.matched_on desc, m.match_id desc`
    );
    return Response.json(r.rows);
  } catch (err) {
    return Response.json(
      { error: `Failed to fetch match history: ${err.message}` },
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

