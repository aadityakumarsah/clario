import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, User, Clock, Shield, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { getSettings, patchSettings } from "@/lib/api";
import type { SettingsData } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

type FormState = Pick<
  SettingsData,
  "name" | "daily_reminder" | "streak_notifications" | "weekly_digest" | "reminder_time"
>;

function isDirty(form: FormState, remote: SettingsData): boolean {
  return (
    form.name !== remote.name ||
    form.daily_reminder !== remote.daily_reminder ||
    form.streak_notifications !== remote.streak_notifications ||
    form.weekly_digest !== remote.weekly_digest ||
    form.reminder_time !== remote.reminder_time
  );
}

function diff(form: FormState, remote: SettingsData): Partial<FormState> {
  const out: Partial<FormState> = {};
  if (form.name !== remote.name) out.name = form.name;
  if (form.daily_reminder !== remote.daily_reminder) out.daily_reminder = form.daily_reminder;
  if (form.streak_notifications !== remote.streak_notifications)
    out.streak_notifications = form.streak_notifications;
  if (form.weekly_digest !== remote.weekly_digest) out.weekly_digest = form.weekly_digest;
  if (form.reminder_time !== remote.reminder_time) out.reminder_time = form.reminder_time;
  return out;
}

// ── component ─────────────────────────────────────────────────────────────────

const Settings = () => {
  const queryClient = useQueryClient();

  const { data: remote, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const [form, setForm] = useState<FormState>({
    name: "",
    daily_reminder: true,
    streak_notifications: true,
    weekly_digest: false,
    reminder_time: "08:00",
  });

  useEffect(() => {
    if (remote) {
      setForm({
        name: remote.name,
        daily_reminder: remote.daily_reminder,
        streak_notifications: remote.streak_notifications,
        weekly_digest: remote.weekly_digest,
        reminder_time: remote.reminder_time,
      });
    }
  }, [remote]);

  const dirty = remote ? isDirty(form, remote) : false;

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: () => patchSettings(diff(form, remote!)),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
      toast.success("Settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const notifications = [
    {
      label: "Daily reminder",
      desc: "Gentle nudge to journal each day",
      key: "daily_reminder" as const,
    },
    {
      label: "Streak notifications",
      desc: "Celebrate milestones and streaks",
      key: "streak_notifications" as const,
    },
    {
      label: "Weekly digest",
      desc: "Summary of your week's reflections",
      key: "weekly_digest" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grain-overlay" />
      <Navbar />

      <div className="pt-28 pb-16 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.p variants={fadeUp} className="font-body text-sm text-muted-foreground">
              Account
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="font-display text-3xl md:text-4xl font-light text-foreground mt-1 mb-10"
            >
              Your <span className="italic">settings</span>
            </motion.h1>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Profile</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="font-body text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 font-body text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={remote?.email ?? ""}
                      readOnly
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 font-body text-sm text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Notifications
                  </h2>
                </div>
                <div className="space-y-4">
                  {notifications.map((pref) => (
                    <div key={pref.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {pref.label}
                        </p>
                        <p className="font-body text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                      <button
                        onClick={() => set(pref.key, !form[pref.key])}
                        className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                          form[pref.key] ? "bg-primary" : "bg-border"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-primary-foreground shadow-sm absolute top-0.5 transition-transform duration-200 ${
                            form[pref.key] ? "translate-x-[22px]" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-2xl bg-card border border-border/50 mb-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Reminder Time
                  </h2>
                </div>
                <div className="flex items-end justify-between gap-4">
                  <input
                    type="time"
                    value={form.reminder_time}
                    onChange={(e) => set("reminder_time", e.target.value)}
                    className="px-4 py-3 rounded-xl bg-background border border-border/50 font-body text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  <AnimatePresence>
                    {dirty && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Button onClick={() => save()} disabled={isSaving} size="sm">
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Save changes
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Privacy</h2>
                </div>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Your voice recordings are processed on-device and never stored in readable form.
                  Only anonymized mood data is used to generate insights. You can request full data
                  deletion at any time.
                </p>
              </motion.section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
