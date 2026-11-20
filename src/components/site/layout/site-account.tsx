"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { currentMember, signOut, type Member } from "@/lib/account";

type SiteAccount = {
  member: Member | null;
  updateMember: (member: Member | null) => void;
  sessionLoading: boolean;
  accountError: string;
  refreshAccount: () => Promise<void>;
  loggingOut: boolean;
  logout: () => Promise<void>;
};

const SiteAccountContext = createContext<SiteAccount | null>(null);

export function SiteAccountProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accountError, setAccountError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const requestVersion = useRef(0);

  const updateMember = useCallback((value: Member | null) => {
    requestVersion.current += 1;
    setMember(value);
    setAccountError("");
    setSessionLoading(false);
  }, []);

  const refreshAccount = useCallback(() => {
    const version = ++requestVersion.current;
    return currentMember()
      .then((value) => {
        if (version === requestVersion.current) updateMember(value);
      })
      .catch(() => {
        if (version === requestVersion.current) {
          setAccountError("ตรวจสอบบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง");
          setSessionLoading(false);
        }
      });
  }, [updateMember]);

  useEffect(() => {
    void refreshAccount();
    window.addEventListener("focus", refreshAccount);
    return () => {
      requestVersion.current += 1;
      window.removeEventListener("focus", refreshAccount);
    };
  }, [refreshAccount]);

  async function logout() {
    setLoggingOut(true);
    setAccountError("");
    try {
      await signOut();
      updateMember(null);
    } catch (cause) {
      setAccountError((cause as Error).message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SiteAccountContext.Provider
      value={{ member, updateMember, sessionLoading, accountError, refreshAccount, loggingOut, logout }}
    >
      {children}
    </SiteAccountContext.Provider>
  );
}

export function useSiteAccount() {
  const account = useContext(SiteAccountContext);
  if (!account) throw new Error("SiteAccountProvider is missing");
  return account;
}
