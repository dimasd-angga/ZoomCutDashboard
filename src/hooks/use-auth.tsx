"use client";

import * as React from "react";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  type User,
  type AuthProvider as FirebaseAuthProvider,
} from "firebase/auth";
import {
  auth,
  isAdmin,
  isCustomer,
  updateCustomerName,
  storeAnalyticsData,
} from "@/lib/firebase";
import { useRouter } from "next/navigation";
import type { Subscription } from "@/lib/types";

type UserRole = "admin" | "customer" | null;

interface AuthState {
  user: User | null;
  userRole: UserRole;
  userProviders: string[];
  loading: boolean;
  needsTrialActivation: boolean;
  authError: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (currentPass: string, newPass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  registerWithGoogle: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  linkGoogleAccount: () => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
  sendPasswordResetEmail: () => Promise<void>;
  sendPasswordResetLink: (email: string) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  userRole: null,
  userProviders: [],
  loading: true,
  needsTrialActivation: false,
  authError: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = React.useState<AuthState>(initialState);
  const router = useRouter();

  const activateTrial = React.useCallback(async (user: User) => {
    if (!user || !user.email) return;

    try {
      const now = new Date();
      const trialEnds = new Date(now);
      trialEnds.setDate(trialEnds.getDate() + 7);

      const trialSubscription: Partial<Subscription> = {
        status: "on_trial",
        user_email: user.email,
        user_name: user.displayName || "New User",
        product_name: "ZoomCut Pro",
        variant_name: "Trial",
        created_at: now.toISOString(),
        trial_ends_at: trialEnds.toISOString(),
        trial_activated_at: now.toISOString(),
        test_mode: true,
        customer_id: 0,
        order_id: 0,
        product_id: 0,
        variant_id: 0,
        cancelled: false,
        renews_at: trialEnds.toISOString(),
        ends_at: trialEnds.toISOString(),
        urls: {
          customer_portal: "#",
        },
      };

      const newId = `trial_${user.uid}`;
      await storeAnalyticsData("subscriptions", [
        { ...trialSubscription, id: newId },
      ]);
      // Also create a placeholder customer doc so isCustomer check passes immediately
      await storeAnalyticsData("customers", [
        {
          id: `trial_${user.uid}`,
          email: user.email,
          name: user.displayName || "New User",
          status: "on_trial",
          subscriptions: [{ ...trialSubscription, id: newId }],
        },
      ]);
    } catch (err: any) {
      console.error("Failed to activate trial:", err);
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthState((prev) => ({ ...prev, loading: true, authError: null }));
      if (user) {
        // Check for role (admin or customer)
        const adminStatus = await isAdmin(user.email!);
        let customerStatus = false;

        if (!adminStatus) {
          customerStatus = await isCustomer(user.email!);
          if (!customerStatus) {
            // Not an admin and not a customer, so they need a trial
            setAuthState((prev) => ({
              ...prev,
              needsTrialActivation: true,
              user,
            }));
            await activateTrial(user);
            // Re-check customer status after activation attempt
            customerStatus = await isCustomer(user.email!);
          }
        }

        const role = adminStatus ? "admin" : customerStatus ? "customer" : null;

        setAuthState({
          user,
          userRole: role,
          userProviders: user.providerData.map((p) => p.providerId),
          loading: false,
          needsTrialActivation: !role,
          authError: null,
        });
      } else {
        setAuthState({ ...initialState, loading: false });
      }
    });

    return () => unsubscribe();
  }, [activateTrial]);

  const handleAuthError = (error: any, customMessage?: string) => {
    let message =
      customMessage || error.message || "An unexpected error occurred.";
    if (error.code === "auth/popup-closed-by-user") {
      message =
        "The sign-in popup was closed before completing. Please try again.";
    }
    if (error.code === "auth/account-exists-with-different-credential") {
      message =
        "An account already exists with this email. Please sign in with your original method to link your Google account.";
    }
    if (error.code === "auth/invalid-email") {
      message = "The email address is not valid.";
    }
    if (error.code === "auth/user-not-found") {
      message = "No account found with this email address.";
    }
    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      message = "Incorrect password. Please try again.";
    }
    setAuthState((prev) => ({ ...prev, authError: message, loading: false }));
    throw new Error(message);
  };

  const performGoogleAuth = async (isRegister: boolean) => {
    setAuthState((prev) => ({ ...prev, loading: true, authError: null }));
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      handleAuthError(error);
    }
  };

  const loginWithGoogle = () => performGoogleAuth(false);
  const registerWithGoogle = () => performGoogleAuth(true);

  const login = async (email: string, pass: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/invalid-credential"
      ) {
        handleAuthError(
          error,
          "Invalid email or password. Please try again or use the 'Forgot Password' link."
        );
        return;
      }
      handleAuthError(error);
    }
  };

  const register = async (email: string, pass: string, name: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        pass
      );
      await firebaseUpdateProfile(userCredential.user, { displayName: name });
      // onAuthStateChanged will set needsTrialActivation
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        handleAuthError(
          error,
          "An account with this email already exists. Please log in."
        );
      }
      handleAuthError(error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setAuthState({ ...initialState, loading: false });
    router.push("/login");
  };

  const resetPassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    if (!auth.currentUser || !auth.currentUser.email)
      throw new Error("No user is currently logged in.");

    setAuthState((prev) => ({ ...prev, authError: null }));

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const linkGoogleAccount = async () => {
    if (!auth.currentUser)
      throw new Error("You must be logged in to link an account.");
    const provider = new GoogleAuthProvider();
    try {
      await linkWithPopup(auth.currentUser, provider);
      // Refresh user state
      await auth.currentUser.reload();
      const user = auth.currentUser;
      setAuthState((prev) => ({
        ...prev,
        user,
        userProviders: user.providerData.map((p) => p.providerId),
      }));
    } catch (error: any) {
      handleAuthError(error);
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!auth.currentUser?.email)
      throw new Error("You must be logged in to update your profile.");
    await firebaseUpdateProfile(auth.currentUser, { displayName: name });
    await updateCustomerName(auth.currentUser.email, name);
    await auth.currentUser.reload();
    const user = auth.currentUser;
    setAuthState((prev) => ({ ...prev, user }));
  };

  const sendPasswordResetEmail = async () => {
    if (!auth.currentUser?.email) throw new Error("No user email found.");
    await firebaseSendPasswordResetEmail(auth, auth.currentUser.email);
  };

  const sendPasswordResetLink = async (email: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, authError: null }));
    try {
      await firebaseSendPasswordResetEmail(auth, email);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    resetPassword,
    register,
    loginWithGoogle,
    registerWithGoogle,
    linkGoogleAccount,
    updateUserProfile,
    sendPasswordResetEmail,
    sendPasswordResetLink,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
