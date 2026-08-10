import { DEMO_USERS } from "../data/demoUsers";

export default function UserSelect({ selectedUserId, onChange }) {
  return (
    <div className="px-5 py-4 border-b border-[#e4e2da]">
      <label className="block text-xs font-medium text-[#6b6f6a] mb-1.5 uppercase tracking-wide">
        Signed in as
      </label>
      <select
        value={selectedUserId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#e4e2da] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 `focus:ring-[var(--color-teal)]` focus:border-transparent"
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
