import { DEMO_USERS } from "../data/demoUsers";

export default function UserSelect({ selectedUserId, onChange }) {
  return (
    <div className="px-5 py-4 border-b `border-[var(--color-line)]`">
      <label className="block text-xs font-medium `text-[var(--color-ink-muted)]` mb-1.5 uppercase tracking-wide">
        Signed in as
      </label>
      <select
        value={selectedUserId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border `border-[var(--color-line)]` rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 `focus:ring-[var(--color-teal)]` focus:border-transparent"
      >
        {DEMO_USERS.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} — {u.email}
          </option>
        ))}
      </select>
    </div>
  );
}
