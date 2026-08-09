import { useCallback, useEffect, useState } from "react";
import { getServices, type Session } from "@/services";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getServices().auth;
    let active = true;
    void auth.getSession().then((s) => {
      if (!active) return;
      setSession(s);
      setLoading(false);
    });
    const unsubscribe = auth.onSessionChange(setSession);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await getServices().auth.signOut();
  }, []);

  return { session, loading, signOut };
}
