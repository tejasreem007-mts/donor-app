import { getConn, oracledb } from "../../../../lib/db";

export async function GET(req, { params }) {
  const { id } = await params;
  const numId = Number(id);

  if (!numId || isNaN(numId)) {
    return Response.json({ error: "Invalid recipient ID provided." }, { status: 400 });
  }

  let conn;
  let cursor;
  try {
    conn = await getConn();
    const r = await conn.execute(
      "begin find_matches(:id, :rc); end;",
      { id: numId, rc: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
    );
    cursor = r.outBinds.rc;
    const rows = await cursor.getRows(100);
    return Response.json(rows);
  } catch (err) {
    return Response.json(
      { error: `Matching execution failed: ${err.message}` },
      { status: 500 }
    );
  } finally {
    if (cursor) {
      try {
        await cursor.close();
      } catch (_) {}
    }
    if (conn) {
      try {
        await conn.close();
      } catch (_) {}
    }
  }
}
