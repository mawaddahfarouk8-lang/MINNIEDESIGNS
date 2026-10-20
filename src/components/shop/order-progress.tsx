import { Check } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { ORDER_FLOW, ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";

const STEP_DETAIL: Record<OrderStatus, string> = {
  pending: "We have your order and will call to confirm it.",
  confirmed: "Your order is confirmed.",
  in_production: "Your design is being printed.",
  out_for_delivery: "The courier is on the way.",
  delivered: "Delivered. Enjoy!",
  cancelled: "This order was cancelled.",
};

export function OrderProgress({
  status,
  events,
}: {
  status: OrderStatus;
  events: { kind: string; to: string | null; at: string }[];
}) {
  if (status === "cancelled") {
    return (
      <p className="rounded-xl bg-danger-soft px-4 py-3 text-danger">
        This order was cancelled. Message us if you have questions.
      </p>
    );
  }

  const current = ORDER_FLOW.indexOf(status);
  const reachedAt = (s: OrderStatus) =>
    [...events].reverse().find((e) => e.to === s)?.at;

  return (
    <ol className="relative space-y-6">
      {ORDER_FLOW.map((step, i) => {
        const done = i <= current;
        const at = reachedAt(step);
        return (
          <li key={step} className="relative flex gap-4">
            {i < ORDER_FLOW.length - 1 && (
              <span
                aria-hidden
                className={`absolute left-[13px] top-8 h-[calc(100%-4px)] w-0.5 ${i < current ? "bg-rose" : "bg-line"}`}
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                done ? "border-rose bg-rose text-card" : "border-line bg-paper"
              }`}
            >
              {done && <Check className="h-4 w-4" strokeWidth={2.5} />}
            </span>
            <div className="-mt-0.5">
              <p className={`font-medium ${done ? "text-ink" : "text-ink-soft"}`}>
                {ORDER_STATUS_LABEL[step]}
                {i === current && <span className="sr-only"> (current step)</span>}
              </p>
              {i === current && <p className="text-sm text-ink-soft">{STEP_DETAIL[step]}</p>}
              {done && at && <p className="text-xs text-ink-soft">{formatDateTime(at)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
