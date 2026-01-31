import type { Tab } from "../stores/useAppStore";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// Lucide icon SVGs
const RadioIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4" />
    <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
  </svg>
);

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const FolderIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
);

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: "episodes" as Tab, label: "Episodes", Icon: RadioIcon },
    { id: "local-upload" as Tab, label: "Downloads", Icon: FolderIcon },
    { id: "knowledge" as Tab, label: "Documents", Icon: BookOpenIcon },
  ];

  return (
    <div className="h-14 bg-app-bg backdrop-blur-xl border-b border-white-5 flex items-center px-6 gap-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`h-9 flex items-center gap-2 px-4 rounded-md transition-all ${
              isActive
                ? "bg-white-10 text-[#f4f4f5]"
                : "text-[#a1a1aa] hover:text-[#d4d4d8] hover:bg-white-5"
            }`}
          >
            <tab.Icon className="w-4 h-4" />
            <span
              className={`text-[13px] ${isActive ? "font-medium" : "font-normal"}`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
