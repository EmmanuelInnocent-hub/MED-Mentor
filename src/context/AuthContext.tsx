import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const now = new Date();
            const lastLoginAt = data.lastLoginAt?.toDate();
            let streak = data.streak || 0;
            
            // 1. Calculate Streak
            if (lastLoginAt) {
              const lastDate = new Date(lastLoginAt.getFullYear(), lastLoginAt.getMonth(), lastLoginAt.getDate());
              const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const diffTime = todayDate.getTime() - lastDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 1) {
                streak += 1;
                await setDoc(doc(db, 'users', user.uid), { streak, lastLoginAt: serverTimestamp() }, { merge: true });
              } else if (diffDays > 1) {
                streak = 1;
                await setDoc(doc(db, 'users', user.uid), { streak, lastLoginAt: serverTimestamp() }, { merge: true });
              }
            } else {
              streak = 1;
              await setDoc(doc(db, 'users', user.uid), { streak, lastLoginAt: serverTimestamp() }, { merge: true });
            }

            // 2. Calculate Knowledge Progress based on actual results
            const resultsRef = collection(db, 'sessions');
            const q = query(resultsRef, where('userId', '==', user.uid), where('status', '==', 'completed'));
            const resultsSnap = await getDocs(q);
            const results = resultsSnap.docs.map(d => d.data());
            
            let knowledgeProgress = data.knowledgeProgress || 0;
            if (results.length > 0) {
              const avgScore = results.reduce((acc, r) => acc + (r.score?.overall || 0), 0) / results.length;
              // Progress is a mix of volume and average score
              knowledgeProgress = Math.min(100, Math.round((results.length * 5) + (avgScore * 0.5)));
              if (knowledgeProgress !== data.knowledgeProgress) {
                await setDoc(doc(db, 'users', user.uid), { knowledgeProgress }, { merge: true });
              }
            }
            
            setProfile({ ...data, streak, knowledgeProgress });
          } else {
            // New user signed in via social but no profile yet
            // This will be handled in the Login component for email/password and google
            setProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOutUser = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
