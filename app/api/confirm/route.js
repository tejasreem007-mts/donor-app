import { getConn } from "../../../lib/db";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (_) {
    return Response.json({ error: "Invalid JSON request body" }, { status: 400 });
  }

  const donorId = Number(body.donorId);
  const recipientId = Number(body.recipientId);

  if (!donorId || isNaN(donorId) || !recipientId || isNaN(recipientId)) {
    return Response.json(
      { error: "Valid donorId and recipientId are required to confirm a match." },
      { status: 400 }
    );
  }

  let conn;
  try {
    conn = await getConn();
    await conn.execute("begin confirm_match(:d, :r); end;", {
      d: donorId,
      r: recipientId,
    });
    await conn.commit();
    return Response.json({ status: "matched", donorId, recipientId });
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
