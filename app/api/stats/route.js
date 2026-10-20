import { getConn } from "../../../lib/db";

export async function GET() {
  let conn;
  try {
    conn = await getConn();

    const [donorsRes, availDonorsRes, recipRes, matchRes, bloodDistRes, urgencyRes] =
      await Promise.all([
        conn.execute("select count(*) as count from donor"),
        conn.execute("select count(*) as count from donor where available = 'Y'"),
        conn.execute("select count(*) as count from recipient where status = 'waiting'"),
        conn.execute("select count(*) as count from match_log"),
        conn.execute(
          "select blood_group, count(*) as count from donor group by blood_group order by blood_group"
        ),
        conn.execute(
          "select urgency, count(*) as count from recipient where status = 'waiting' group by urgency order by urgency desc"
        ),
      ]);

    return Response.json({
      totalDonors: donorsRes.rows[0]?.COUNT || 0,
      availableDonors: availDonorsRes.rows[0]?.COUNT || 0,
      waitingRecipients: recipRes.rows[0]?.COUNT || 0,
      totalMatches: matchRes.rows[0]?.COUNT || 0,
      bloodGroupDistribution: bloodDistRes.rows || [],
      urgencyDistribution: urgencyRes.rows || [],
    });
  } catch (err) {
    return Response.json(
      { error: `Failed to calculate system stats: ${err.message}` },
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

