import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db } from "../../../../lib/db";
import { notificationData } from "../../../../lib/banking";


export async function GET() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  return NextResponse.json({
    ...(await notificationData(user.id)),
    kycVerified: user.kycVerified,
  });
}
export async function POST() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  await db.execute(
    "UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE user_id=?",
    [user.id],
  );
  return NextResponse.json({
    success: true,
    ...(await notificationData(user.id)),
  });
}
export async function PATCH(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id) || id < 1 || typeof body.read !== "boolean")
    return NextResponse.json(
      { error: "A valid notification and read state are required." },
      { status: 400 },
    );

  const [result] = await db.execute(
    "UPDATE notifications SET read_at=? WHERE id=? AND user_id=?",
    [body.read ? new Date() : null, id, user.id],
  );
  if (!(result as { affectedRows: number }).affectedRows)
    return NextResponse.json({ error: "Notification not found." }, { status: 404 });

  return NextResponse.json({
    success: true,
    ...(await notificationData(user.id)),
  });
}
