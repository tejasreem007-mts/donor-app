import { getConn, oracledb } from "../../../../lib/db";

export async function GET(req, { params }) {
  const { id } = await params;
  const conn = await getConn();
  try {
    const r = await conn.execute(
      "begin find_matches(:id, :rc); end;",
      { id: Number(id), rc: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
    );
    const rows = await r.outBinds.rc.getRows();
    await r.outBinds.rc.close();
    return Response.json(rows);
  } finally {
    await conn.close();
  }
}
