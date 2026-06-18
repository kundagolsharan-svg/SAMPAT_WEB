"use client";

import { usePathname } from "next/navigation";

export default function HeaderWrapper({ children }) {
  const pathname = usePathname();
  
  // Define routes that should not render the global header
  const isAppRoute = 
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/analyzer") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/transaction");

  if (isAppRoute) {
    return null;
  }

  return children;
}
