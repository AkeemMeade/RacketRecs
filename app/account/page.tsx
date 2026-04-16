"use client";

import { useState } from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/85 shadow-xl ring-1 ring-white/40 backdrop-blur-md">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        enabled ? "bg-[#FFC038]" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function DangerButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 rounded-full border-2 border-red-300 text-red-500 text-xs font-semibold hover:bg-red-50 transition"
    >
      {label}
    </button>
  );
}

function ConfirmModal({
  title,
  description,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <h3 className="text-lg font-extrabold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-full border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  // Preferences
  const [darkMode, setDarkMode] = useState(false);
  const [publicProfile, setPublicProfile] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Name editing
  const [name, setName] = useState("Your Name");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  // Modal
  const [modal, setModal] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const confirm = (title: string, description: string, onConfirm: () => void) => {
    setModal({ title, description, onConfirm });
  };

  const handleSaveName = () => {
    setName(nameInput);
    setEditingName(false);
  };

  return (
    <main className={`${outfit.className} min-h-screen`}>
      <div className="fixed inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200 -z-10" />

      {modal && (
        <ConfirmModal
          title={modal.title}
          description={modal.description}
          onConfirm={() => { modal.onConfirm(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm mb-8">
          Settings
        </h1>

        <div className="flex flex-col gap-6">

          {/* Account Details */}
          <SectionCard title="Account Details" subtitle="Manage your personal information">
            <SettingRow label="Display Name" description="This is how you appear on RacketRecs">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 w-36"
                  />
                  <button
                    onClick={handleSaveName}
                    className="text-xs px-3 py-1.5 bg-[#FFC038] text-white rounded-full font-semibold hover:opacity-90 transition"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingName(false)}
                    className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-full font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">{name}</span>
                  <button
                    onClick={() => { setNameInput(name); setEditingName(true); }}
                    className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-full font-semibold hover:bg-slate-50 transition"
                  >
                    Edit
                  </button>
                </div>
              )}
            </SettingRow>

            <SettingRow label="Email" description="Connected to your account">
              <span className="text-sm text-slate-400">youremail@gmail.com</span>
            </SettingRow>

            <SettingRow label="Password" description="Last changed never">
              <button className="text-xs px-3 py-1.5 border border-slate-200 text-slate-500 rounded-full font-semibold hover:bg-slate-50 transition">
                Change
              </button>
            </SettingRow>
          </SectionCard>

          {/* Preferences */}
          <SectionCard title="Preferences" subtitle="Customize your experience">
            <SettingRow label="Dark Mode" description="Switch to a darker interface">
              <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </SettingRow>

            <SettingRow label="Public Profile" description="Allow others to view your profile">
              <Toggle enabled={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
            </SettingRow>

            <SettingRow label="Email Notifications" description="Receive updates and recommendations">
              <Toggle enabled={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />
            </SettingRow>
          </SectionCard>

          {/* Data Management */}
          <SectionCard title="Data Management" subtitle="Clear specific data from your account">
            <SettingRow label="Favorites" description="Remove all saved rackets">
              <DangerButton
                label="Clear all"
                onClick={() => confirm(
                  "Clear all favorites?",
                  "This will permanently remove all your saved rackets. This cannot be undone.",
                  () => console.log("clear favorites")
                )}
              />
            </SettingRow>

            <SettingRow label="Recommendations" description="Remove all generated recommendations">
              <DangerButton
                label="Clear all"
                onClick={() => confirm(
                  "Clear all recommendations?",
                  "This will permanently delete all your racket recommendations. This cannot be undone.",
                  () => console.log("clear recommendations")
                )}
              />
            </SettingRow>

            <SettingRow label="Assessments" description="Remove all completed assessments">
              <DangerButton
                label="Clear all"
                onClick={() => confirm(
                  "Clear all assessments?",
                  "This will permanently delete all your assessment responses. This cannot be undone.",
                  () => console.log("clear assessments")
                )}
              />
            </SettingRow>
          </SectionCard>

          {/* Danger Zone */}
          <SectionCard title="Danger Zone" subtitle="Irreversible account actions">
            <SettingRow label="Delete Account" description="Permanently delete your account and all associated data">
              <DangerButton
                label="Delete account"
                onClick={() => confirm(
                  "Delete your account?",
                  "This will permanently delete your account, all favorites, assessments, and recommendations. This action cannot be undone.",
                  () => console.log("delete account")
                )}
              />
            </SettingRow>
          </SectionCard>

        </div>
      </div>
    </main>
  );
}
