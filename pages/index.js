import { useEffect } from "react";
import { useRouter } from "next/router";
import { seedIfEmpty } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    seedIfEmpty();
    router.replace("/today");
  }, []);
  return null;
}
