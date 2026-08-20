import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ScheduleQueue } from "@/components/ScheduleQueue";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const user = await getCurrentUser();
  if (!user.id) redirect("/");

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold">
        <span className="gradient-text">Расписание публикаций</span>
      </h1>
      <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <ScheduleQueue />
      </div>
    </div>
  );
}
