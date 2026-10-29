'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
export default function AccountMenu() {
  const [account, setAccount] = useState<{ name: string | null; isAdmin: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/session', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (!controller.signal.aborted) setAccount(data); }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <Link className="sq-account" href="/login">{account?.name ? account.name : 'Logga in med Discord'}</Link>;
}
