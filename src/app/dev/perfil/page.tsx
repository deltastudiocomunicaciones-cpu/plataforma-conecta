import { notFound } from "next/navigation";
import { ProfileDesignReview } from "./review";

export default function ProfileReviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <ProfileDesignReview />;
}
