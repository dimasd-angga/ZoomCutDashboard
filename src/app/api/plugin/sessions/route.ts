"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const EMAIL_INDEX_COLLECTION = "user_session_emails";
const DEVICES_SUBCOLLECTION = "devices";
const DEFAULT_ALLOWED_DEVICES = 2;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email query parameter is required" },
        { status: 400 }
      );
    }

    const emailDevicesRef = collection(
      db,
      EMAIL_INDEX_COLLECTION,
      email,
      DEVICES_SUBCOLLECTION
    );
    const snapshot = await getDocs(emailDevicesRef);

    const sessions = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const parentUid = docSnap.ref.parent?.parent?.id || data.uid || null;
        const deviceId = data.deviceId ?? null;
        return {
          sessionId: data.sessionId ?? docSnap.id,
          deviceId,
          deviceLabel: data.deviceLabel ?? "unknown-device",
          userAgent: data.userAgent ?? "unknown",
          source: data.source ?? "unknown",
          isActive: data.isActive ?? false,
          createdAt: data.createdAt ?? null,
          lastActivity: data.lastActivity ?? null,
          uid: parentUid,
          token: data.token ?? null,
        };
      })
      .filter((session) => Boolean(session.deviceId));

    const activeCount = sessions.filter((s) => s.isActive).length;

    return NextResponse.json({
      email,
      allowedDevices: DEFAULT_ALLOWED_DEVICES,
      activeCount,
      sessions,
    });
  } catch (error: any) {
    console.error("Failed to fetch plugin sessions", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
