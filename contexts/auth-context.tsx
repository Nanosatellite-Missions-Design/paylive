"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  signInWithPhoneNumber
} from "firebase/auth";
import { auth, db } from "@/functions/firebase";
import { getADocument, getSingleDocument } from "@/functions/get-a-document";
import { getACollection } from "@/functions/get-a-collection";
import { setToCollection } from "@/functions/add-to-collection";
import { addToSubCollection } from "@/functions/add-to-a-sub-collection";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userInfo: any;
  lives: any[];
  deliveries: any[];
  transactions: any[];
  referrals: any[];
  referralsEarnings: number;
  users: any[];
  login: (email: string, password: string) => Promise<void>;
  signup: (
    formData: any
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithPhoneNumber: (phone: string, appVerifier: any) => Promis<void>,
  confirmOtp: (otp: string) => Promise<void>,
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [lives, setLives] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [referralsEarnings, setReferralsEarnings] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const router = useRouter();
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const loginWithPhoneNumber = async (phone: string, appVerifier: any) => {
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      return result;
    } catch (error) {
      console.error("Phone login error:", error);
      throw new Error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async (otp: string, name: string) => {
    setLoading(true);
    try {
      if (!confirmationResult) {
        throw new Error("No confirmation result found");
      }

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      // Create user document if it doesn't exist
      const existing = await getSingleDocument(user.uid, "users");
      console.log(existing)
      if (!existing) {
        await setToCollection("users", user.uid, {
          uid: user.uid,
          name: name,
          phone: user.phoneNumber,
          role: "user"
        });
      }

      router.push("/");
    } catch (error) {
      console.error("OTP confirmation error:", error);
      throw new Error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  // Authentication methods
  const login = async (email: string, password: string) => {
    setLoading(true);
    console.log({ email, password });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/")
    } finally {
      setLoading(false);
    }
  };

  const signup = async (
    formData: any
  ) => {
    setLoading(true);
    try {
      // 1. Create authentication user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // 2. Send email verification
      await sendEmailVerification(user);
      // console.log("Verification email sent");

      // 3. Update user profile
      await updateProfile(user, { displayName: formData.name });
      // console.log("Profile updated");
      // console.log(user.uid);
      // 4. Create Firestore document

      try {
        await setToCollection("users", user.uid, {
          uid: user.uid,
          email: user.email,
          name: formData.name,
          phone: formData.phone,
        });
      router.push("/")

        // console.log("Firestore document created");
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
        throw new Error("Failed to create user profile");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      // Handle specific error cases
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already registered");
      }
      if (error.code === "auth/weak-password") {
        throw new Error("Password too weak");
      }
      throw new Error("Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      router.push("/login"); // Redirect to login page after logout
      clearAllData();
    } finally {
      setLoading(false);
    }
  };

  // Create user document helper
  // const createUserDocument = async (uid: string, email: string, role: string) => {
  //   try {
  //     await fetch('/api/create-user', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ uid, email, role })
  //     });
  //   } catch (error) {
  //     console.error("Error creating user document:", error);
  //   }
  // };

  // Clear all application data
  const clearAllData = () => {
    setUserInfo(null);
    setDeliverers([]);
    setDeliveries([]);
    setUsers([]);
  };

  // User document listener
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeUser = getADocument(user.uid, "users", (data) => {
      setUserInfo(data);
      setLoading(false); // only set loading to false *after* userInfo is set
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [user]);

  // // Role-based data loading
  useEffect(() => {
    if (!userInfo?.role) return;

    // Initialize with no-op functions and proper typing
    let unsubscribeDeliveries: () => void = () => {};
    let unsubscribeDeliverers: () => void = () => {};
    let unsubscribeSellers: () => void = () => {};
    let unsubscribeTransactions: () => void = () => {};
    let unsubscribeLives: () => void = () => {};

    switch (userInfo.role) {
      case "admin":
        unsubscribeDeliverers =
          getACollection("deliverers", setDeliverers) ?? (() => {});
        unsubscribeSellers = getACollection("users", setUsers) ?? (() => {});
        unsubscribeDeliveries =
          getACollection("deliveries", setDeliveries) ?? (() => {});
        unsubscribeTransactions =
          getACollection("transaction", setTransactions) ?? (() => {});
        break;
      case "super":
        unsubscribeDeliverers =
          getACollection("deliverers", setDeliverers) ?? (() => {});
        unsubscribeSellers = getACollection("users", setUsers) ?? (() => {});
        unsubscribeDeliveries =
          getACollection("deliveries", setDeliveries) ?? (() => {});
        unsubscribeTransactions =
          getACollection("transaction", setTransactions) ?? (() => {});
        break;
      case "user":
        unsubscribeLives =
          getACollection("lives", setLives) ?? (() => {});
        break;
    }

    return () => {
      // Safe to call even if undefined due to nullish coalescing
      unsubscribeDeliveries();
      unsubscribeDeliverers();
      unsubscribeSellers();
      unsubscribeTransactions();
      unsubscribeLives();
    };
  }, [userInfo, user]);


  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log(currentUser)
      setLoading(false)
    });
    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        userInfo,
        lives,
        referralsEarnings,
        deliveries,
        referrals,
        users,
        transactions,
        login,
        signup,
        logout,
        loginWithPhoneNumber,
        confirmOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};