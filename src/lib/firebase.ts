
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  type Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
  orderBy,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import type { SystemUpdate, Subscription } from "./types";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase for server-side
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

async function isAdmin(email: string): Promise<boolean> {
  if (!email || !db) return false;
  const adminDocRef = doc(db, 'admins', email);
  try {
    const adminDoc = await getDoc(adminDocRef);
    return adminDoc.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

async function isCustomer(email: string): Promise<boolean> {
    if (!email || !db) return false;
    
    try {
        // Check for a customer record (which could be from LS sync or trial creation)
        const customersRef = collection(db, 'customers');
        const qCustomer = query(customersRef, where("email", "==", email));
        const customerSnapshot = await getDocs(qCustomer);
        if (!customerSnapshot.empty) {
            return true;
        }

        // Fallback check for a trial subscription record just in case customer doc isn't ready
        const subscriptionsRef = collection(db, 'subscriptions');
        const qSubscription = query(subscriptionsRef, where("user_email", "==", email), where("status", "==", "on_trial"));
        const subscriptionSnapshot = await getDocs(qSubscription);
        if (!subscriptionSnapshot.empty) {
            return true;
        }
        
        return false;

    } catch (error) {
        console.error("Error checking customer status:", error);
        return false;
    }
}

async function getCustomerByEmail(email: string) {
    if (!email || !db) return null;
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const docData = querySnapshot.docs[0].data();
    
    // Also fetch their trial subscription if it exists
    const subscriptionsRef = collection(db, 'subscriptions');
    const qSub = query(subscriptionsRef, where("user_email", "==", email), where("status", "==", "on_trial"));
    const subSnapshot = await getDocs(qSub);
    const subscriptions = subSnapshot.docs.map(d => ({id: d.id, ...d.data()}));

    return { id: querySnapshot.docs[0].id, ...docData, subscriptions };
}

async function getOrdersByEmailFromFirebase(email: string) {
    if (!email || !db) return [];
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("user_email", "==", email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getSubscriptions(email?: string): Promise<Subscription[]> {
    if (!db) return [];
    const subscriptionsRef = collection(db, 'subscriptions');
    const q = email 
        ? query(subscriptionsRef, where("user_email", "==", email))
        : query(subscriptionsRef);
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Subscription));
}


async function storeAnalyticsData(collectionName: string, data: any[]) {
    if (!data || data.length === 0 || !db) return;
    const batch = writeBatch(db);
    const collectionRef = collection(db, collectionName);

    for (const item of data) {
        const docRef = doc(collectionRef, String(item.id)); // Ensure ID is a string
        batch.set(docRef, { ...item, syncedAt: serverTimestamp() }, { merge: true });
    }

    try {
        await batch.commit();
    } catch (error) {
        console.error(`Error storing ${collectionName} data:`, error);
        throw new Error(`Failed to sync ${collectionName}.`);
    }
}

async function addSystemUpdate(update: Omit<SystemUpdate, 'id' | 'createdAt'>) {
    if (!db) throw new Error("Firestore is not initialized.");

    const cleanUpdate: { [key: string]: any } = {};
    Object.entries(update).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            cleanUpdate[key] = value;
        }
    });

    const updatesRef = collection(db, 'system_updates');
    await addDoc(updatesRef, {
        ...cleanUpdate,
        createdAt: serverTimestamp(),
    });
}

async function getSystemUpdates(): Promise<SystemUpdate[]> {
    if (!db) return [];
    const updatesRef = collection(db, 'system_updates');
    const q = query(updatesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as SystemUpdate));
}

async function updateCustomerName(email: string, newName: string) {
    if (!email || !db) throw new Error("Email and DB must be provided.");
    const customersRef = collection(db, "customers");
    const q = query(customersRef, where("email", "==", email));
    
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const customerDocRef = querySnapshot.docs[0].ref;
            await updateDoc(customerDocRef, { name: newName });
        } else {
            console.warn(`No customer found with email: ${email} to update name.`);
        }
    } catch (error) {
        console.error("Error updating customer name:", error);
        throw new Error("Failed to update customer name.");
    }
}

async function deleteSubscription(id: string) {
  if (!db) throw new Error("Firestore is not initialized.");
  try {
    const docRef = doc(db, 'subscriptions', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting subscription from Firestore:", error);
    throw new Error("Failed to delete subscription from Firestore.");
  }
}

async function deleteCustomer(id: string) {
    if (!db) throw new Error("Firestore is not initialized.");
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
}


export { 
    app, 
    db, 
    auth, 
    isAdmin, 
    isCustomer, 
    getCustomerByEmail,
    getOrdersByEmailFromFirebase,
    getSubscriptions,
    storeAnalyticsData,
    addSystemUpdate,
    getSystemUpdates,
    updateCustomerName,
    deleteSubscription,
    deleteCustomer
};
