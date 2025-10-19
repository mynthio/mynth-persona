import { redirect } from "next/navigation";

// Legacy/unused Sparks route – kept for rollback only.
export default function SparksPage() {
  redirect("/plans");
}
