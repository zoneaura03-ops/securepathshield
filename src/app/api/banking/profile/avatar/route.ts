import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { currentUser } from "../../../../../lib/auth";
import { db, type DatabaseRow } from "../../../../../lib/db";

const MAX_SIZE = 3 * 1024 * 1024;

function imageExtension(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return "jpg";
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "png";
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return "webp";
  return null;
}

async function removePreviousAvatar(avatarPath: unknown) {
  if (
    typeof avatarPath !== "string" ||
    !avatarPath.startsWith("/uploads/avatars/")
  )
    return;
  const directory = path.resolve(process.cwd(), "public", "uploads", "avatars");
  const target = path.resolve(process.cwd(), "public", avatarPath.slice(1));
  if (!target.startsWith(directory + path.sep)) return;
  await unlink(target).catch(() => undefined);
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const form = await request.formData();
  const file = form.get("avatar");
  if (!(file instanceof File))
    return NextResponse.json(
      { error: "Choose an image to upload." },
      { status: 400 },
    );
  if (file.size <= 0 || file.size > MAX_SIZE)
    return NextResponse.json(
      { error: "Profile pictures must be 3 MB or smaller." },
      { status: 400 },
    );
  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = imageExtension(buffer);
  if (!extension)
    return NextResponse.json(
      { error: "Use a valid JPEG, PNG, or WebP image." },
      { status: 400 },
    );

  const directory = path.resolve(process.cwd(), "public", "uploads", "avatars");
  await mkdir(directory, { recursive: true });
  const filename = `${user.id}-${randomUUID()}.${extension}`;
  await writeFile(path.join(directory, filename), buffer, { flag: "wx" });
  const avatarUrl = `/uploads/avatars/${filename}`;
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT avatar_path FROM users WHERE id=? LIMIT 1",
    [user.id],
  );
  await db.execute("UPDATE users SET avatar_path=? WHERE id=?", [
    avatarUrl,
    user.id,
  ]);
  await removePreviousAvatar(rows[0]?.avatar_path);
  await db.execute(
    "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'profile','Profile picture updated','Your profile picture was changed successfully.')",
    [user.id],
  );
  return NextResponse.json({ avatarUrl });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user)
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  const [rows] = await db.execute<DatabaseRow[]>(
    "SELECT avatar_path FROM users WHERE id=? LIMIT 1",
    [user.id],
  );
  await db.execute("UPDATE users SET avatar_path=NULL WHERE id=?", [user.id]);
  await removePreviousAvatar(rows[0]?.avatar_path);
  await db.execute(
    "INSERT INTO notifications(user_id,type,title,body) VALUES(?,'profile','Profile picture removed','Your profile picture was removed from the account.')",
    [user.id],
  );
  return NextResponse.json({ avatarUrl: null });
}
