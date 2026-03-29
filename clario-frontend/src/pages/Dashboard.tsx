import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Flame, TrendingUp, TrendingDown, Minus, Sparkles, PhoneOff, FileText, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import Navbar from "@/components/Navbar";
import { useVoiceJournal } from "@/hooks/useVoiceJournal";
import { useTranslation } from "react-i18next";
import SessionReportModal from "@/components/SessionReportModal";
import { listSessions, type SessionDetailData } from "@/lib/api";
import {
  sessionDetailToPastCard,
  moodWeatherIcon,
  buildTodaySummaryFromSessions,
  buildMoodTrendSeries,
  computeJournalStreak,
  type PastSessionCardModel,
} from "@/lib/sessionReportView";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const Dashboard = () => {
  const { t } = useTranslation();
  const {
    isRecording,
    isConnecting,
    isMuted,
    isGeneratingReport,
    reportData,
    startSession,
    endSession,
    toggleMute,
    clearReport,
  } = useVoiceJournal();

  const [pastCards, setPastCards] = useState<PastSessionCardModel[]>([]);
  const [pastSessionsLoading, setPastSessionsLoading] = useState(true);
  const [pastSessionsError, setPastSessionsError] = useState<string | null>(null);
  const [archiveReportSession, setArchiveReportSession] = useState<SessionDetailData | null>(null);

  const currentStreak = useMemo(
    () => computeJournalStreak(pastCards.map((c) => c.detail)),
    [pastCards],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPastSessionsLoading(true);
      setPastSessionsError(null);
      try {
        const rows = await listSessions();
        if (cancelled) return;
        setPastCards(rows.map(sessionDetailToPastCard));
      } catch (e) {
        if (!cancelled) {
          setPastSessionsError(e instanceof Error ? e.message : "Could not load sessions");
        }
      } finally {
        if (!cancelled) setPastSessionsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportData]);

  useEffect(() => {
    if (reportData) setArchiveReportSession(null);
  }, [reportData]);

  const modalReportData = archiveReportSession ?? reportData;

  const closeReportModal = () => {
    clearReport();
    setArchiveReportSession(null);
  };

  const todaySummary = useMemo(
    () => buildTodaySummaryFromSessions(pastCards.map((c) => c.detail)),
    [pastCards],
  );

  const moodTrendData = useMemo(
    () => buildMoodTrendSeries(pastCards.map((c) => c.detail), 7),
    [pastCards],
  );

  const hasAnyMoodTrendPoint = useMemo(
    () => moodTrendData.some((p) => p.mood != null),
    [moodTrendData],
  );
  const hasNoSessions = !pastSessionsLoading && !pastSessionsError && pastCards.length === 0;

  const headerDateLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date());
    } catch {
      return "";
    }
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      <div className="grain-overlay" />
      <Navbar />

      <div className="pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
            className="mb-10"
          >
            <motion.p variants={fadeUp} className="font-body text-sm text-muted-foreground">
              {t("dashboard.greeting")} — {headerDateLabel}
            </motion.p>
            <motion.h1 variants={fadeUp} className="font-display text-3xl md:text-4xl font-light text-foreground mt-1">
              {t("dashboard.title_1")} <span className="italic">{t("dashboard.title_2")}</span>
            </motion.h1>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Voice Session Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`${hasNoSessions ? "lg:col-span-3" : "lg:col-span-2"} p-8 rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden`}
            >
              <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-glow)" }} />
              <div className="relative z-10 flex flex-col items-center text-center">
                <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-6">
                  Ready when you are
                </p>
                <button
                  onClick={startSession}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105 my-2"
                >
                  <Mic className="w-8 h-8" />
                </button>
                <p className="font-body text-sm text-muted-foreground mt-4">
                  Tap to start your reflection
                </p>
              </div>
            </motion.div>

            {!hasNoSessions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-2xl bg-card border border-border/50 flex flex-col items-center justify-center text-center"
              >
                <div className="relative mb-4">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
                    <motion.circle
                      cx="50" cy="50" r="42"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={264}
                      strokeDashoffset={264 - (264 * Math.min(currentStreak, 30) / 30)}
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * Math.min(currentStreak, 30) / 30) }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-accent" />
                  </div>
                </div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="font-display text-4xl font-semibold text-foreground"
                >
                  {currentStreak}
                </motion.span>
                <p className="font-body text-xs text-muted-foreground mt-1">day streak</p>
                <p className="font-body text-xs text-muted-foreground mt-2 max-w-[11rem] leading-snug">
                  {pastSessionsLoading
                    ? "…"
                    : currentStreak === 0
                      ? "Days with a saved report, in a row."
                      : currentStreak >= 7
                        ? "Strong streak — keep going."
                        : "Keep logging to grow your streak."}
                </p>
              </motion.div>
            )}
          </div>

          {hasNoSessions ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-6 p-8 rounded-2xl bg-card border border-border/50"
            >
              <div className="max-w-2xl">
                <p className="font-body text-xs uppercase tracking-[0.3em] text-muted-foreground mb-3">
                  First reflection
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-light text-foreground mb-3">
                  You have no saved sessions yet
                </h2>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  Start your first voice reflection to unlock your daily summary, mood trends, streak, and past
                  reports. Once your first report is generated, this dashboard will populate automatically.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-6 p-8 rounded-2xl bg-card border border-border/50"
              >
            <div className="flex flex-col gap-1 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent shrink-0" />
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {pastSessionsLoading || !todaySummary || todaySummary.isFromToday
                    ? "Today's Summary"
                    : "Latest reflection"}
                </h2>
              </div>
              {pastSessionsLoading && (
                <p className="font-body text-sm text-muted-foreground">Loading your summary…</p>
              )}
              {!pastSessionsLoading && todaySummary && !todaySummary.isFromToday && (
                <p className="font-body text-sm text-muted-foreground max-w-2xl">
                  Nothing logged today yet — showing your last session from{" "}
                  <span className="text-foreground/90 font-medium">{todaySummary.sessionDateLabel}</span>.
                </p>
              )}
              {!pastSessionsLoading && todaySummary?.isFromToday && (
                <p className="font-body text-sm text-muted-foreground">{todaySummary.sessionDateLabel}</p>
              )}
            </div>

            {pastSessionsLoading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                <div className="h-28 rounded-xl bg-muted/40 border border-border/20" />
                <div className="h-28 rounded-xl bg-muted/40 border border-border/20" />
                <div className="h-28 rounded-xl bg-muted/40 border border-border/20" />
              </div>
            )}

            {!pastSessionsLoading && !todaySummary && (
              <p className="font-body text-sm text-muted-foreground py-2">
                Complete a voice reflection with a generated report to see your mood, themes, and insights here.
              </p>
            )}

            {!pastSessionsLoading && todaySummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 rounded-xl bg-background border border-border/30">
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Mood score
                  </p>
                  <p className="font-display text-3xl font-semibold text-primary">
                    {todaySummary.mood.toFixed(1)}
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                    {todaySummary.moodDelta != null ? (
                      <>
                        {todaySummary.moodDelta > 0 && (
                          <>
                            <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                            <span>
                              +{todaySummary.moodDelta.toFixed(1)} vs previous session
                            </span>
                          </>
                        )}
                        {todaySummary.moodDelta < 0 && (
                          <>
                            <TrendingDown className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>
                              {todaySummary.moodDelta.toFixed(1)} vs previous session
                            </span>
                          </>
                        )}
                        {todaySummary.moodDelta === 0 && (
                          <>
                            <Minus className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span>Same as previous session</span>
                          </>
                        )}
                      </>
                    ) : (
                      <span>No earlier session to compare</span>
                    )}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/30">
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Themes &amp; moments
                  </p>
                  {todaySummary.keyBullets.length > 0 ? (
                    <ul className="space-y-2">
                      {todaySummary.keyBullets.map((line, i) => (
                        <li
                          key={i}
                          className="font-body text-sm text-foreground/85 leading-snug pl-1 border-l-2 border-primary/25"
                        >
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-body text-sm text-muted-foreground">No themes listed in this report.</p>
                  )}
                </div>
                <div className="p-4 rounded-xl bg-background border border-border/30">
                  <p className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Insight
                  </p>
                  <p className="font-body text-sm text-foreground/85 leading-relaxed italic">
                    &ldquo;{todaySummary.insightLine}&rdquo;
                  </p>
                </div>
              </div>
            )}
              </motion.div>

              {/* Mood Trends — last 7 local days from session reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-6 p-8 rounded-2xl bg-card border border-border/50"
              >
            <div className="mb-6">
              <h2 className="font-display text-xl font-semibold text-foreground">Mood Trends</h2>
              <p className="font-body text-sm text-muted-foreground mt-1">
                Last 7 days · average mood from sessions with a saved report
              </p>
            </div>
            {pastSessionsLoading && (
              <div className="h-48 rounded-xl bg-muted/30 animate-pulse" />
            )}
            {!pastSessionsLoading && !hasAnyMoodTrendPoint && (
              <p className="font-body text-sm text-muted-foreground py-12 text-center border border-dashed border-border/60 rounded-xl">
                No mood data in this window yet. Complete a reflection and generate a report to see your trend.
              </p>
            )}
            {!pastSessionsLoading && hasAnyMoodTrendPoint && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodTrendData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "hsl(30 8% 50%)" }}
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis
                      domain={[0, 10]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(30 8% 50%)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(38 33% 96%)",
                        border: "1px solid hsl(35 20% 87%)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                      formatter={(value: number | null) =>
                        value == null ? "No session" : `${Number(value).toFixed(1)} / 10`
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="mood"
                      stroke="hsl(158 28% 32%)"
                      strokeWidth={2}
                      connectNulls={false}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        if (payload?.mood == null || cx == null || cy == null) return null;
                        return (
                          <circle cx={cx} cy={cy} r={4} fill="hsl(158 28% 32%)" />
                        );
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
              </motion.div>

              {/* Past Sessions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-6"
              >
            <h2 className="font-display text-xl font-semibold text-foreground mb-4">Past Sessions</h2>

            {pastSessionsLoading && (
              <div className="flex items-center gap-2 text-muted-foreground font-body text-sm py-8 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading sessions…
              </div>
            )}

            {!pastSessionsLoading && pastSessionsError && (
              <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 text-sm text-foreground">
                <p className="font-body">{pastSessionsError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setPastSessionsLoading(true);
                    setPastSessionsError(null);
                    listSessions()
                      .then((rows) => setPastCards(rows.map(sessionDetailToPastCard)))
                      .catch((e) =>
                        setPastSessionsError(
                          e instanceof Error ? e.message : "Could not load sessions",
                        ),
                      )
                      .finally(() => setPastSessionsLoading(false));
                  }}
                  className="mt-3 text-primary font-medium text-sm underline-offset-4 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {!pastSessionsLoading && !pastSessionsError && pastCards.length === 0 && (
              <p className="font-body text-sm text-muted-foreground py-6 text-center border border-dashed border-border/60 rounded-2xl">
                No sessions yet. Start a voice reflection to see it here.
              </p>
            )}

            {!pastSessionsLoading && !pastSessionsError && pastCards.length > 0 && (
              <div className="space-y-3">
                {pastCards.map((row, i) => {
                  const MoodIcon = moodWeatherIcon(row.moodScore);
                  return (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 }}
                      className="p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-200 flex flex-col sm:flex-row sm:items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MoodIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                          <span className="font-body text-sm font-medium text-foreground">
                            {row.labelDate}
                          </span>
                          {row.moodScore != null && (
                            <span className="font-body text-xs text-muted-foreground">
                              Mood: {row.moodScore.toFixed(1)}/10
                            </span>
                          )}
                          <span className="font-body text-xs text-accent flex items-center gap-1">
                            <Flame className="w-3 h-3" /> {currentStreak}
                          </span>
                        </div>
                        <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-3">
                          {row.summary}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!row.hasReport}
                        onClick={() => setArchiveReportSession(row.detail)}
                        className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2.5 font-body text-xs font-medium text-foreground transition-colors hover:bg-secondary hover:border-primary/25 disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        View report
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
              </motion.div>
            </>
          )}
          {/* Call-like Full Screen UI */}
          <AnimatePresence>
            {(isRecording || isConnecting || isGeneratingReport) && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between py-16 px-6"
              >
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: "var(--gradient-glow)" }} />

                <div className="relative z-10 text-center mt-12 w-full max-w-md mx-auto">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <p className="font-body text-sm uppercase tracking-[0.3em] text-primary mb-2">
                      {isGeneratingReport ? "Session Complete" : "Active Reflection"}
                    </p>
                    <h2 className="font-display text-4xl text-foreground">
                      {isGeneratingReport ? "Generating report..." : isConnecting ? "Connecting..." : "Listening..."}
                    </h2>
                  </motion.div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-accent/40"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      className="absolute inset-0 -m-8 rounded-full bg-primary/20"
                    />
                    <div className="w-32 h-32 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-2xl relative z-10">
                      {isGeneratingReport ? (
                        <Sparkles className="w-12 h-12" />
                      ) : isMuted ? (
                        <MicOff className="w-12 h-12 text-muted-foreground" />
                      ) : (
                        <Mic className="w-12 h-12" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="relative z-10 pb-8 flex flex-col md:flex-row items-center justify-center gap-8 w-full md:min-h-[120px]">
                  {!isGeneratingReport ? (
                    <>
                      <div className="flex flex-col items-center">
                        <button
                          onClick={toggleMute}
                          disabled={isConnecting}
                          className={`w-16 h-16 rounded-full transition-colors shadow-lg flex items-center justify-center group ${isMuted ? 'bg-secondary text-secondary-foreground hover:bg-secondary/90' : 'bg-primary/20 text-primary hover:bg-primary/30'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          aria-label={isMuted ? "Unmute" : "Mute"}
                        >
                          {isMuted ? (
                            <MicOff className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          ) : (
                            <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
                          )}
                        </button>
                        <p className="font-body text-xs text-muted-foreground mt-3">{isMuted ? "Unmute" : "Mute"}</p>
                      </div>

                      <div className="flex flex-col items-center">
                        <button
                          onClick={endSession}
                          className="w-20 h-20 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-lg flex items-center justify-center group"
                          aria-label="End reflection"
                        >
                          <PhoneOff className="w-8 h-8 group-hover:scale-110 transition-transform" />
                        </button>
                        <p className="font-body text-sm text-muted-foreground mt-4">End Session</p>
                      </div>

                      {/* Invisible placeholder for symmetry to keep End Session button centered */}
                      <div className="w-16 h-16 invisible hidden md:block" aria-hidden="true" />
                    </>
                  ) : (
                    <p className="font-body text-sm text-muted-foreground animate-pulse">This might take a moment...</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Modal (live session or past session) */}
          <AnimatePresence>
            {modalReportData && (
              <SessionReportModal reportData={modalReportData} onClose={closeReportModal} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
