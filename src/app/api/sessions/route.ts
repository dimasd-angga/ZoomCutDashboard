"use server";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

const SESSIONS_COLLECTION = "user_sessions";
const EMAIL_INDEX_COLLECTION = "user_session_emails";
const DEVICES_SUBCOLLECTION = "devices";
const DEFAULT_ALLOWED_DEVICES = 2;

const getSessionDocRef = (uid: string, sessionId: string) =>
  doc(db, SESSIONS_COLLECTION, uid, DEVICES_SUBCOLLECTION, sessionId);

const getEmailIndexDocRef = (email: string, sessionId: string) =>
  doc(db, EMAIL_INDEX_COLLECTION, email, DEVICES_SUBCOLLECTION, sessionId);

async function mirrorToEmailIndex(
  email: string | null | undefined,
  sessionId: string,
  data: Record<string, any>
) {
  if (!email) return;
  await setDoc(getEmailIndexDocRef(email, sessionId), data, { merge: true });
}

async function removeFromEmailIndex(
  email: string | null | undefined,
  sessionId: string
) {
  if (!email) return;
  await deleteDoc(getEmailIndexDocRef(email, sessionId));
}

async function resolveSessionEmail(
  uid: string,
  sessionId: string,
  providedEmail?: string | null
) {
  if (providedEmail) return providedEmail;
  const snapshot = await getDoc(getSessionDocRef(uid, sessionId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as { email?: string | null };
  return data?.email ?? null;
}

async function getAllowedDeviceLimitForUser(uid: string) {
  // TODO: make this dynamic per subscription/tier.
  return DEFAULT_ALLOWED_DEVICES;
}

async function countActiveSessionsForUser(uid: string) {
  const devicesRef = collection(
    db,
    SESSIONS_COLLECTION,
    uid,
    DEVICES_SUBCOLLECTION
  );
  const snapshot = await getDocs(devicesRef);
  return snapshot.docs.reduce((count, docSnap) => {
    const data = docSnap.data() as { isActive?: boolean; deviceId?: string | null };
    if (!data?.deviceId) {
      return count;
    }
    const isActive = data?.isActive !== false;
    return isActive ? count + 1 : count;
  }, 0);
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      uid,
      sessionId,
      email,
      token,
      deviceId,
      deviceLabel,
      userAgent,
      source = "dashboard",
    } = payload;

    if (!uid || !sessionId) {
      return NextResponse.json(
        { error: "uid and sessionId are required" },
        { status: 400 }
      );
    }

    const sessionDocRef = getSessionDocRef(uid, sessionId);
    const existingSessionSnap = await getDoc(sessionDocRef);
    const existingData = existingSessionSnap.exists()
      ? (existingSessionSnap.data() as { deviceId?: string | null })
      : null;
    const isDeviceSession = Boolean(deviceId);
    const existingHasDevice = Boolean(existingData?.deviceId);

    // Enforce device limit when:
    // - This is a new device session, OR
    // - This is an existing session that didn't have a deviceId but now will
    if (isDeviceSession && !existingHasDevice) {
      const allowedDevices = await getAllowedDeviceLimitForUser(uid);
      if (allowedDevices !== null) {
        const activeCount = await countActiveSessionsForUser(uid);
        if (activeCount >= allowedDevices) {
          return NextResponse.json(
            {
              error:
                "Device limit reached. Please log out on another device before signing in here.",
              allowedDevices,
              activeCount,
            },
            { status: 409 }
          );
        }
      }
    }
    const sessionData: Record<string, any> = {
      uid,
      sessionId,
      email: email ?? null,
      token: token ?? null,
      deviceLabel: deviceLabel ?? "unknown-device",
      userAgent: userAgent ?? "unknown",
      source,
      isActive: true,
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    };

    if (deviceId) {
      sessionData.deviceId = deviceId;
    }

    await setDoc(sessionDocRef, sessionData, { merge: true });
    await mirrorToEmailIndex(email, sessionId, sessionData);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to create session", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const payload = await request.json();
    const { uid, sessionId, detachDevice = false } = payload;

    if (!uid || !sessionId) {
      return NextResponse.json(
        { error: "uid and sessionId are required" },
        { status: 400 }
      );
    }

    const sessionDocRef = getSessionDocRef(uid, sessionId);
    const snapshot = await getDoc(sessionDocRef);
    const existingData = snapshot.exists() ? snapshot.data() : null;
    const email =
      payload.email ??
      (existingData
        ? ((snapshot.data() as { email?: string | null }).email ?? null)
        : null);

    if (detachDevice) {
      const updateData: Record<string, any> = {
        deviceId: null,
        source: "dashboard",
      };
      await setDoc(sessionDocRef, updateData, { merge: true });
      await mirrorToEmailIndex(email, sessionId, updateData);
    } else {
      await deleteDoc(sessionDocRef);
      await removeFromEmailIndex(email, sessionId);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete session", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = await request.json();
    const {
      uid,
      sessionId,
      isActive = true,
      clearDeviceId = false,
      deviceId,
      source,
    } = payload;

    if (!uid || !sessionId) {
      return NextResponse.json(
        { error: "uid and sessionId are required" },
        { status: 400 }
      );
    }

    const sessionDocRef = getSessionDocRef(uid, sessionId);
    const email = await resolveSessionEmail(uid, sessionId, payload.email);
    const updateData: Record<string, any> = {
      isActive,
      lastActivity: serverTimestamp(),
    };

    if (typeof deviceId !== "undefined") {
      updateData.deviceId = deviceId || null;
    }

    if (typeof source !== "undefined") {
      updateData.source = source;
    }

    if (clearDeviceId) {
      updateData.deviceId = null;
      updateData.source = "dashboard";
      updateData.token = null;
      updateData.userAgent = "unknown";
      updateData.deviceLabel = "unknown-device";
    }

    await setDoc(sessionDocRef, updateData, { merge: true });
    await mirrorToEmailIndex(email, sessionId, updateData);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to update session", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const email = searchParams.get("email");

    if (!uid && !email) {
      return NextResponse.json(
        { error: "uid or email is required" },
        { status: 400 }
      );
    }

    let snapshot;

    if (uid) {
      const devicesRef = collection(
        db,
        SESSIONS_COLLECTION,
        uid,
        DEVICES_SUBCOLLECTION
      );
      snapshot = await getDocs(devicesRef);
    } else {
      const emailDevicesRef = collection(
        db,
        EMAIL_INDEX_COLLECTION,
        email!,
        DEVICES_SUBCOLLECTION
      );
      snapshot = await getDocs(emailDevicesRef);
    }

    const sessions = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("Failed to fetch sessions", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
