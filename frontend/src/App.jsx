import "./App.css";
import { useState } from "react";
import { DEMO_USERS } from "./data/demoUsers";
import UserSelect from "./components/UserSelect";

function App() {
  const [selectedUserId, setSelectedUserId] = useState(DEMO_USERS[0].id);

  return (
    <>
      <div className="min-h-screen `bg-[var(--color-paper)]` flex items-center justify-center p-4">
        <div className="w-full max-w-3xl h-[85vh] `bg-[var(--color-panel)]` rounded-xl border `border-[var(--color-line)]` shadow-sm overflow-hidden flex flex-col">
          <UserSelect
            selectedUserId={selectedUserId}
            onChange={setSelectedUserId}
          />
        </div>
      </div>
    </>
  );
}

export default App;
