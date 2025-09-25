"use client";
import { useState, useEffect, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ClientOnly({ children }: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  if (!isClient) {
    return null;
  }
  return <>{children}</>;
}
