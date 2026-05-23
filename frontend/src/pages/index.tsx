import { useEffect } from "react";
import { useRouter } from "next/router";
import { getCurrentUser } from "../lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace("/flights");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
