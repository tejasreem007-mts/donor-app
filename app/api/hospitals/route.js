import { getConn } from "../../../lib/db";

export async function GET() {
  let conn;
  try {
    conn = await getConn();
    const r = await conn.execute(
      "select hospital_id, name, city from hospital order by name"
    );
    return Response.json(r.rows);
  } catch (e) {
    return Response.json(
      { error: `Failed to fetch hospitals: ${e.message}` },
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
