import { useState } from "react";
import { Toaster } from "sonner";
import { ListChecks, Wind, BookOpen, Map } from "lucide-react";
import { usePersistentState } from "@/lib/store";
import Header from "@/components/kb/Header";
import ChecklistTab from "@/components/kb/checklist/ChecklistTab";
import MetarTab from "@/components/kb/metar/MetarTab";
import LogbookTab from "@/components/kb/logbook/LogbookTab";
import ChartsTab from "@/components/kb/charts/ChartsTab";
import SettingsDialog from "@/components/kb/SettingsDialog";
import PrintKneeboard from "@/components/kb/PrintKneeboard";
import DriveDialog from "@/components/kb/DriveDialog";
import SyncBanner from "@/components/kb/SyncBanner";
import { useDriveSync } from "@/lib/drive";

const TABS = [
  { id: "sop", label: "SOP & Kontrol Listesi", short: "SOP", icon: ListChecks },
  { id: "metar", label: "METAR & Rüzgâr Hesaplayıcı", short: "METAR", icon: Wind },
  { id: "log", label: "Uçuş & Sefer Defteri", short: "Defter", icon: BookOpen },
  { id: "charts", label: "Havalimanı Chartları", short: "Chart", icon: Map },
];

export default function App() {
  const [state, setState] = usePersistentState();
  const [tab, setTab] = useState("sop");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [driveOpen, setDriveOpen] = useState(false);
  const drive = useDriveSync(state, setState);

  return (
    <>
    <div className="min-h-screen kb-grid-bg print:hidden">
      <Header state={state} setState={setState} onOpenSettings={() => setSettingsOpen(true)} drive={drive} onOpenDrive={() => setDriveOpen(true)} />
      <SyncBanner drive={drive} />
      <nav className="sticky top-0 z-30 border-b border-[#1E293B] bg-[#0B0F19]/90 backdrop-blur-md" data-testid="main-tabs">
        <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-3 sm:px-6">
          {TABS.map(({ id, label, short, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              data-testid={`tab-trigger-${id}`}
              className={`relative flex min-h-[52px] shrink-0 items-center gap-2 px-4 text-sm font-semibold transition-colors ${tab === id ? "text-sky-400" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Icon size={18} />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
              {tab === id && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-sky-400 shadow-[0_0_12px_#38BDF8]" />}
            </button>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 sm:py-8" key={tab}>
        {tab === "sop" && <ChecklistTab state={state} setState={setState} />}
        {tab === "metar" && <MetarTab state={state} setState={setState} />}
        {tab === "log" && <LogbookTab state={state} setState={setState} />}
        {tab === "charts" && <ChartsTab state={state} setState={setState} />}
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} state={state} setState={setState} />
      <DriveDialog open={driveOpen} onOpenChange={setDriveOpen} drive={drive} />
      <Toaster theme="dark" position="top-center" richColors />
    </div>
    <PrintKneeboard state={state} />
    </>
  );
}
