import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) return { session: null, admin: null };
  const admin = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return { session, admin };
}