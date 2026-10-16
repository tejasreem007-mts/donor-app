import { getConn } from "../../../lib/db";

export async function GET() {
  const conn = await getConn();
  try {
    const r = await conn.execute("select hospital_id, name from hospital order by name");
    return Response.json(r.rows);
  } finally {
    await conn.close();
  }
}
