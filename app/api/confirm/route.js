import { getConn } from "../../../lib/db";

export async function POST(req) {
  const { donorId, recipientId } = await req.json();
  const conn = await getConn();
  try {
    await conn.execute("begin confirm_match(:d, :r); end;", {
      d: Number(donorId),
      r: Number(recipientId),
    });
    return Response.json({ status: "matched" });
  } finally {
    await conn.close();
  }
}
