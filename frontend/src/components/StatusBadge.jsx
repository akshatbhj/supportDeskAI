const CLASSIFICATION_LABEL = {
  general_question: "General question",
  technical_issue: "Technical issue",
  billing: "Billing",
  urgent: "Urgent",
};

export function ClassificationBadge({ classification }) {
  if (!classification) return null;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                      bg-[#fbf0dc] text-amber"
    >
      {CLASSIFICATION_LABEL[classification] ?? classification}
    </span>
  );
}

export function EscalationBanner({ reason }) {
  return (
    <div
      className="flex items-start gap-2.5 px-4 py-3 rounded-lg
                     bg-[#fbeae2] border border-[color-mix(in_srgb,var(#c24a24)_25%,transparent)]"
    >
      <i
        className="ti ti-user-exclamation text-[var(#c24a24)] text-lg mt-0.5"
        aria-hidden="true"
      ></i>
      <div>
        <p className="text-sm font-medium text-[var(#c24a24)]">
          Escalated to a human
        </p>
        <p className="text-xs text-[var(#c24a24)] `opacity-80 mt-0.5">
          {reason}
        </p>
      </div>
    </div>
  );
}
