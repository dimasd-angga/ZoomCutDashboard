"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

class DashboardSessionSync {
  private sessionIdStorageKey = "firebase_session_id";
  private heartbeatInterval: number | null = null;
  private heartbeatIntervalMs = 5 * 60 * 1000; // 5 minutes
  private heartbeatContext: { uid: string; sessionId: string } | null = null;
  private beforeUnloadHandler = () => {
    this.sendHeartbeat(true);
  };

  setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("User signed in to dashboard:", user.email);
        await this.storeSessionInFirestore(user);
      } else {
        console.log("User signed out from dashboard");
        await this.clearSessionFromFirestore();
      }
    });
  }

  private getOrCreateSessionId() {
    if (typeof window === "undefined") return null;
    const existing = window.localStorage.getItem(this.sessionIdStorageKey);
    if (existing) return existing;
    const newId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(this.sessionIdStorageKey, newId);
    return newId;
  }

  private getDeviceMetadata() {
    if (typeof window === "undefined") {
      return { deviceId: null, deviceLabel: null, userAgent: null };
    }
    
    // Only read deviceId from URL query parameter, not from storage
    // This prevents dashboard from using stale plugin deviceIds
    let deviceIdFromUrl: string | null = null;
    try {
      const url = new URL(window.location.href);
      deviceIdFromUrl = url.searchParams.get("deviceId");
      
      // Store in sessionStorage/localStorage only if present in URL
      if (deviceIdFromUrl) {
        try {
          window.sessionStorage?.setItem("plugin_deviceId", deviceIdFromUrl);
        } catch {}
        try {
          window.localStorage.setItem("plugin_deviceId", deviceIdFromUrl);
        } catch {}
      }
    } catch (error) {
      console.warn("Failed to parse deviceId from URL", error);
    }

    const deviceLabel = window.navigator?.platform || "unknown-device";
    const userAgent = window.navigator?.userAgent || "unknown";
    return {
      deviceId: deviceIdFromUrl,
      deviceLabel,
      userAgent,
    };
  }

  async storeSessionInFirestore(user: User) {
    try {
      const idToken = await user.getIdToken();
      const sessionId = this.getOrCreateSessionId();

      if (!sessionId) {
        console.warn("Unable to determine sessionId, skipping session store.");
        return;
      }

      await this.ensureDeviceIdConsistency(user.uid, sessionId);

      const { deviceId, deviceLabel, userAgent } = this.getDeviceMetadata();

      const payload: Record<string, any> = {
        sessionId,
        uid: user.uid,
        email: user.email,
        token: idToken,
        deviceLabel,
        userAgent,
        source: deviceId ? "plugin" : "dashboard",
      };

      if (deviceId) {
        payload.deviceId = deviceId;
      }

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {}
        
        // Dispatch custom event for UI to handle
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("session-error", {
              detail: {
                error: errorData.error || "Failed to create session",
                status: response.status,
                data: errorData,
              },
            })
          );
        }
        
        throw new Error(`Session API error: ${errorText}`);
      }

      this.startHeartbeat(user.uid, sessionId);

      console.log("✅ Session stored in Firestore for plugin access");

      // Keep local session for dashboard
      localStorage.setItem("firebase_session_token", idToken);
      localStorage.setItem("firebase_user_email", user.email || "");
      localStorage.setItem("firebase_user_uid", user.uid || "");
      localStorage.setItem(this.sessionIdStorageKey, sessionId);

    } catch (error) {
      console.error("❌ Failed to store session in Firestore:", error);
    }
  }

  async clearSessionFromFirestore() {
    try {
      this.stopHeartbeat();
      const email = localStorage.getItem("firebase_user_email");
      const uid =
        auth.currentUser?.uid || localStorage.getItem("firebase_user_uid");
      const sessionId =
        localStorage.getItem(this.sessionIdStorageKey) ||
        localStorage.getItem("deviceId");

      if (uid && sessionId) {
        await fetch("/api/sessions", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid,
            sessionId,
            email,
          }),
        });
        console.log("✅ Session cleared from backend");
      }

      localStorage.removeItem("firebase_session_token");
      localStorage.removeItem("firebase_user_email");
      localStorage.removeItem("firebase_user_uid");
      localStorage.removeItem(this.sessionIdStorageKey);
      this.clearStoredDeviceIdentifiers();
    } catch (error) {
      console.error("❌ Failed to clear session from Firestore:", error);
    }
  }

  initialize() {
    console.log("Dashboard session sync with Firestore initialized");
    this.setupAuthListener();
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", this.beforeUnloadHandler);
    }
  }

  async updateSessionIfNeeded() {
    const user = auth.currentUser;
    if (user) {
      await this.storeSessionInFirestore(user);
    }
  }

  private startHeartbeat(uid: string, sessionId: string) {
    if (typeof window === "undefined") return;
    this.stopHeartbeat();
    this.heartbeatContext = { uid, sessionId };
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
    this.sendHeartbeat();
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      if (typeof window !== "undefined") {
        window.clearInterval(this.heartbeatInterval);
      } else {
        clearInterval(this.heartbeatInterval);
      }
      this.heartbeatInterval = null;
    }
    this.heartbeatContext = null;
  }

  private async sendHeartbeat(isImmediate = false) {
    if (!this.heartbeatContext) return;
    const { uid, sessionId } = this.heartbeatContext;
    try {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          sessionId,
          isActive: true,
          immediate: isImmediate,
        }),
        keepalive: isImmediate,
      });
    } catch (error) {
      console.error("❌ Heartbeat failed:", error);
    }
  }

  private clearStoredDeviceIdentifiers() {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage?.removeItem("plugin_deviceId");
    } catch {}
    try {
      window.localStorage.removeItem("plugin_deviceId");
    } catch {}
    try {
      window.localStorage.removeItem("deviceId");
    } catch {}
  }

  private hasStoredPluginDeviceId() {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.sessionStorage?.getItem("plugin_deviceId") ||
        window.localStorage.getItem("plugin_deviceId") ||
        window.localStorage.getItem("deviceId")
    );
  }

  private async ensureDeviceIdConsistency(uid: string, sessionId: string) {
    if (typeof window === "undefined" || !this.hasStoredPluginDeviceId()) {
      return;
    }
    try {
      const response = await fetch(`/api/sessions?uid=${uid}`);
      if (!response.ok) return;
      const payload = await response.json().catch(() => ({}));
      const sessions = Array.isArray(payload?.sessions)
        ? payload.sessions
        : [];
      const matchingSession = sessions.find(
        (session: any) =>
          session?.id === sessionId || session?.sessionId === sessionId
      );
      if (matchingSession && !matchingSession.deviceId) {
        this.clearStoredDeviceIdentifiers();
      }
    } catch (error) {
      console.warn("Failed to ensure deviceId consistency with server", error);
    }
  }
}

export default DashboardSessionSync;
