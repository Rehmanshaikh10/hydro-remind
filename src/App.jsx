import { useEffect, useState } from "react";
import ReminderSettings from "./components/ReminderSettings";
import "./index.css";

const defaultSettings = {
  startTime: "08:00",
  endTime: "22:00",
  interval: 60,
  amount: 250,
  remindersEnabled: true,
  reminderSound: "chime",
};

function playChime(sound = "chime") {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;

  const context = new Audio();

  const sounds = {
    chime: [880],
    gentle: [660, 880],
    double: [880, 660],
    bell: [1046],
  };

  const notes = sounds[sound] || sounds.chime;

  const playNote = (frequency, delay) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.12, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
  };

  context
    .resume()
    .then(() => {
      notes.forEach((frequency, index) => {
        playNote(frequency, index * 0.22);
      });

      setTimeout(() => context.close(), 1000);
    })
    .catch(() => context.close());
}

function getToday() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function readDailyAmount(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "null");

    return data?.date === getToday()
      ? Number(data.amount) || 0
      : 0;
  } catch {
    return 0;
  }
}

function App() {
  const [water, setWater] = useState(() =>
    readDailyAmount("hydroWater")
  );

  const [drinkHistory, setDrinkHistory] = useState(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("hydroDrinkHistory") || "null"
      );

      return saved?.date === getToday() &&
        Array.isArray(saved.entries)
        ? saved.entries
        : [];
    } catch {
      return [];
    }
  });
  

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("hydroSettings");

      return saved
        ? { ...defaultSettings, ...JSON.parse(saved) }
        : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  const goal = 2500;
  const progress = Math.min((water / goal) * 100, 100);
  const remaining = Math.max(goal - water, 0);

  useEffect(() => {
    localStorage.setItem(
      "hydroWater",
      JSON.stringify({
        date: getToday(),
        amount: water,
      })
    );
  }, [water]);

  useEffect(() => {
    localStorage.setItem(
      "hydroDrinkHistory",
      JSON.stringify({
        date: getToday(),
        entries: drinkHistory,
      })
    );
  }, [drinkHistory]);

  useEffect(() => {
    if (!settings.remindersEnabled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const checkReminder = () => {
      const now = new Date();
      const current = now.getHours() * 60 + now.getMinutes();

      const [sh, sm] = settings.startTime.split(":").map(Number);
      const [eh, em] = settings.endTime.split(":").map(Number);

      const start = sh * 60 + sm;
      const end = eh * 60 + em;

      if (start >= end || current < start || current >= end) {
        return;
      }

      const key = "hydroLastReminderDate";
      const today = getToday();

      let last = null;

      try {
        last = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        last = null;
      }

      if (!last || last.date !== today) {
        last = { date: today, timestamp: 0 };
      }

      const intervalMs = Number(settings.interval) * 60000;

      if (Date.now() - last.timestamp < intervalMs) return;

      try {
        new Notification("💧 Time to hydrate!", {
          body: `Enjoy ${settings.amount} ml of water.`,
          tag: "hydro-water-reminder",
        });

        if (document.visibilityState === "visible") {
          playChime(settings.reminderSound);
        }

        localStorage.setItem(
          key,
          JSON.stringify({
            date: today,
            timestamp: Date.now(),
          })
        );
      } catch (error) {
        console.error("Reminder error:", error);
      }
    };

    checkReminder();

    const timer = setInterval(checkReminder, 15000);

    return () => clearInterval(timer);
  }, [settings]);

  const addWater = () => {
    const amount = Math.min(
      Number(settings.amount),
      goal - water
    );

    if (amount <= 0) return;

    setWater((current) => Math.min(current + amount, goal));

    setDrinkHistory((history) => [
      ...history,
      {
        id: `${Date.now()}-${history.length}`,
        amount,
      },
    ]);
  };

  const undoLastDrink = () => {
    if (drinkHistory.length === 0) return;

    const lastEntry = drinkHistory[drinkHistory.length - 1];

    setWater((current) =>
      Math.max(current - lastEntry.amount, 0)
    );

    setDrinkHistory((history) => history.slice(0, -1));
  };

  const saveSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings };

    setSettings(updated);

    try {
      localStorage.setItem(
        "hydroSettings",
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error("Could not save settings:", error);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <span className="brand-icon">💧</span>

          <div>
            <h1>HydroRemind</h1>
            <p>Your daily hydration companion</p>
          </div>
        </div>

        <span className="header-badge">
          ● Daily wellness
        </span>
      </header>

      <main className="dashboard">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">YOUR DAILY GOAL</span>

            <h2>
              Drink well.
              <br />
              Feel better.
            </h2>

            <p>
              Small sips today, healthier habits tomorrow.
            </p>
          </div>

          <div
            className="water-ring"
            style={{
              background: `conic-gradient(#43d5f5 ${
                progress * 3.6
              }deg, #24446d 0deg)`,
            }}
          >
            <div className="water-ring-inner">
              <span className="big-drop">💧</span>
              <strong>{water}</strong>
              <span>of {goal} ml</span>
              <b>{Math.round(progress)}% complete</b>
            </div>
          </div>
        </section>

        <section className="remaining-card">
          <div className="remaining-icon">🏆</div>

          <div className="remaining-copy">
            <span>Keep going!</span>
            <strong>{remaining} ml left</strong>
            <p>You're building a great habit.</p>
          </div>

          <div className="remaining-percent">
            {Math.round(progress)}%
          </div>
        </section>

        <button
          type="button"
          className="drink-button"
          onClick={addWater}
        >
          <span>＋</span> Drink {settings.amount} ml
        </button>

        <button
          type="button"
          className="undo-button"
          onClick={undoLastDrink}
          disabled={drinkHistory.length === 0}
        >
          ↩ Undo
        </button>

        <div className="stats-grid">
          <div className="stat-card">
            <span>🎯</span>
            <p>Daily goal</p>
            <strong>2,500 ml</strong>
          </div>

          <div className="stat-card">
            <span>🥛</span>
            <p>Per drink</p>
            <strong>{settings.amount} ml</strong>
          </div>

          <div className="stat-card">
            <span>🔔</span>
            <p>Interval</p>
            <strong>{settings.interval} min</strong>
          </div>
        </div>

        <section className="next-reminder">
          <div className="reminder-icon">🔔</div>

          <div className="reminder-copy">
            <h3>Water reminders</h3>

            <p>
              {settings.remindersEnabled
                ? `${settings.startTime} – ${settings.endTime}`
                : "Reminders are currently paused"}
            </p>
          </div>

          <span
            className={
              settings.remindersEnabled
                ? "status-dot active"
                : "status-dot"
            }
          >
            ●
          </span>
        </section>

        <section className="settings-section">
          <div className="section-heading">
            <span className="eyebrow">MAKE IT YOURS</span>
            <h2>Reminder settings</h2>
            <p>Choose when and how often to hydrate.</p>
          </div>

          <ReminderSettings
            settings={settings}
            onSave={saveSettings}
          />
        </section>

        <footer className="app-footer">
          <span>💧</span> One sip at a time.
        </footer>
      </main>
    </div>
  );
}

export default App;