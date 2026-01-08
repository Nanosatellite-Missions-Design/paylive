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
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth, db } from "@/functions/firebase";
import { getADocument, getSingleDocument } from "@/functions/get-a-document";
import { getACollection } from "@/functions/get-a-collection";
import { listenToSubCollection } from "@/functions/get-a-sub-collection";
import { setToCollection } from "@/functions/add-to-collection";
import { addToSubCollection } from "@/functions/add-to-a-sub-collection";
import { useRouter } from "next/navigation";
import { Catalog, Order } from "@/types/catalog";
import getRealTimeQuery from "@/functions/query-a-collection";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userInfo: any;
  lives: any[];
  userProducts: any[];
  userCatalogs: Catalog[];
  userOrders: Order[];
  userLives: any[];
  userTransactions: any[];
  transactions: any[];
  referrals: any[];
  referralsEarnings: number;
  users: any[];
  login: (email: string, password: string) => Promise<void>;
  signup: (formData: any) => Promise<void>;
  logout: () => Promise<void>;
  loginWithPhoneNumber: (phone: string, appVerifier: any) => Promise<any>;
  confirmOtp: (otp: string, name: string) => Promise<void>;
  refreshUserOrders: () => Promise<void | (() => void)>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [lives, setLives] = useState<any[]>([]);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [userCatalogs, setUserCatalogs] = useState<Catalog[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [userLives, setUserLives] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
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
      console.log(existing);
      if (!existing) {
        await setToCollection("users", user.uid, {
          uid: user.uid,
          name: name,
          phone: user.phoneNumber,
          role: "user",
          paymentMethods: [],
          balance: 0,
        });
      }

      const referrer = document.referrer;
      const isAuthRoute = referrer.includes("/auth");

      if (!isAuthRoute && referrer) {
        router.back();
      } else {
        router.push("/dashboard/lives");
      }
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
      router.push("/dashboard/lives");
    } finally {
      setLoading(false);
    }
  };

  const signup = async (formData: any) => {
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

      // 3. Update user profile
      await updateProfile(user, { displayName: formData.name });

      // 4. Create Firestore document
      try {
        await setToCollection("users", user.uid, {
          uid: user.uid,
          email: user.email,
          name: formData.name,
          phone: formData.phone,
        });
        router.push("/dashboard/lives");
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
      router.push("/login");
      clearAllData();
    } finally {
      setLoading(false);
    }
  };

  // Clear all application data
  const clearAllData = () => {
    setUserInfo(null);
    setLives([]);
    setUserProducts([]);
    setUserCatalogs([]);
    setUserOrders([]);
    setUserTransactions([]);
    setUsers([]);
    setReferrals([]);
    setReferralsEarnings(0);
    setTransactions([]);
  };

  const refreshUserOrders = async () => {
    if (!user?.uid) return;

    try {
      const unsubscribe = listenToSubCollection(
        "users",
        user.uid,
        "orders",
        (orders: Order[]) => {
          setUserOrders(orders);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  };

  // User document listener
  useEffect(() => {
    if (!user) {
      return;
    }

    const unsubscribeUser = getADocument(user.uid, "users", (data) => {
      console.log("User info loaded:", data);
      setUserInfo(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribeUser) unsubscribeUser();
    };
  }, [user]);

  // Role-based data loading
  useEffect(() => {
    if (!userInfo?.role || !user) return;

    console.log(`Loading data for role: ${userInfo.role}, user: ${user.uid}`);

    // Initialize with no-op functions
    let unsubscribeLives: () => void = () => {};
    let unsubscribeUserProducts: () => void = () => {};
    let unsubscribeUserTransactions: () => void = () => {};
    let unsubscribeUserCatalogs: () => void = () => {};
    let unsubscribeUserOrders: () => void = () => {};

    switch (userInfo.role) {
      case "admin":
        // Pour admin, charger toutes les données de la collection principale
        unsubscribeLives =
          getACollection("lives", (livesData) => {
            console.log("Lives loaded:", livesData.length);
            setLives(livesData);
          }) ?? (() => {});

        // Pour admin, charger aussi ses propres données personnelles
        unsubscribeUserProducts =
          listenToSubCollection("users", user.uid, "products", (products) => {
            console.log("User products loaded:", products.length);
            setUserProducts(products);
          }) ?? (() => {});

        unsubscribeUserTransactions =
          listenToSubCollection(
            "users",
            user.uid,
            "transactions",
            (transactions) => {
              console.log("User transactions loaded:", transactions.length);
              setUserTransactions(transactions);
            }
          ) ?? (() => {});

        // Les catalogues de l'admin
        const unsubscribeAdminCatalogs = getRealTimeQuery(
          "catalogs",
          "creatorId",
          user.uid,
          (catalogs: Catalog[]) => {
            console.log("Admin catalogs loaded:", catalogs.length);
            setUserCatalogs(catalogs);
          }
        );
        unsubscribeUserCatalogs = unsubscribeAdminCatalogs || (() => {});

        // Les commandes de l'admin
        const unsubscribeAdminOrders = getRealTimeQuery(
          "orders",
          "sellerId",
          user.uid,
          (orders: Order[]) => {
            console.log("Admin orders loaded:", orders.length);
            setUserOrders(orders);
          }
        );
        unsubscribeUserOrders = unsubscribeAdminOrders || (() => {});
        break;

      case "super":
        // Même logique que admin ou différente selon vos besoins
        break;

      case "user":
        console.log("Loading user data...");

        unsubscribeLives =
          getACollection("lives", (livesData) => {
            console.log("User lives loaded:", livesData.length);
            setLives(livesData);
          }) ?? (() => {});

        // PRODUITS : sous-collection users/{uid}/products
        unsubscribeUserProducts =
          listenToSubCollection("users", user.uid, "products", (products) => {
            console.log("User products loaded:", products.length);
            setUserProducts(products);
          }) ?? (() => {});

        // TRANSACTIONS : sous-collection users/{uid}/transactions
        unsubscribeUserTransactions =
          listenToSubCollection(
            "users",
            user.uid,
            "transactions",
            (transactions) => {
              console.log("User transactions loaded:", transactions.length);
              setUserTransactions(transactions);
            }
          ) ?? (() => {});

        // CATALOGUES : collection catalogs avec creatorId
        const unsubscribeUserCatalogsQuery = getRealTimeQuery(
          "catalogs",
          "creatorId",
          user.uid,
          (catalogs: Catalog[]) => {
            console.log("User catalogs loaded:", catalogs.length);
            setUserCatalogs(catalogs);
          }
        );
        unsubscribeUserCatalogs = unsubscribeUserCatalogsQuery || (() => {});

        // COMMANDES : collection orders avec sellerId
        const unsubscribeUserOrdersQuery = getRealTimeQuery(
          "orders",
          "sellerId",
          user.uid,
          (orders: Order[]) => {
            console.log("User orders loaded:", orders.length);
            setUserOrders(orders);
          }
        );
        unsubscribeUserOrders = unsubscribeUserOrdersQuery || (() => {});
        break;
    }

    return () => {
      console.log("Cleaning up listeners...");
      unsubscribeLives();
      unsubscribeUserProducts();
      unsubscribeUserTransactions();
      unsubscribeUserCatalogs();
      unsubscribeUserOrders();
    };
  }, [userInfo, user]);

  // Auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed:", currentUser?.uid);
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
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
        userProducts,
        userCatalogs,
        userOrders,
        userLives,
        userTransactions,
        referrals,
        users,
        transactions,
        login,
        signup,
        logout,
        loginWithPhoneNumber,
        confirmOtp,
        refreshUserOrders,
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
