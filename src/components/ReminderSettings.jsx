
import { useEffect, useState } from "react";

const to12Hour = (time) => {
  const [hour, minute] = time.split(":").map(Number);
  return {
    hour: String(hour % 12 || 12),
    minute: String(minute).padStart(2, "0"),
    period: hour >= 12 ? "PM" : "AM",
  };
};

const to24Hour = (hour, minute, period) => {
  let h = Number(hour) % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
};

function TimePicker({ label, value, onChange }) {
  const parsed = to12Hour(value);

  const update = (field, next) => {
    const time = { ...parsed, [field]: next };
    onChange(to24Hour(time.hour, time.minute, time.period));
  };

  return (
    <div className="setting-row">
      <div className="setting-label">
        <span className="setting-icon">
          {label === "Start time" ? "🌅" : "🌙"}
        </span>
        <div>
          <strong>{label}</strong>
          <small>
            {label === "Start time"
              ? "When reminders begin"
              : "When reminders stop"}
          </small>
        </div>
      </div>

      <div className="time-fields">
        <select
          aria-label={`${label} hour`}
          value={parsed.hour}
          onChange={(e) => update("hour", e.target.value)}
        >
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span>:</span>

        <select
          aria-label={`${label} minute`}
          value={parsed.minute}
          onChange={(e) => update("minute", e.target.value)}
        >
          {Array.from({ length: 60 }, (_, i) =>
            String(i).padStart(2, "0")
          ).map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <select
          aria-label={`${label} AM or PM`}
          value={parsed.period}
          onChange={(e) => update("period", e.target.value)}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

const soundOptions = {
  chime: [880],
  gentle: [660, 880],
  double: [880, 660],
  bell: [1046],
};

function previewSound(sound) {
  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    alert("Audio preview is not supported in this browser.");
    return;
  }

  const context = new AudioContextClass();
  const notes = soundOptions[sound] || soundOptions.chime;

  context.resume().then(() => {
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.24;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(start + 0.4);
    });

    setTimeout(() => context.close(), 1200);
  }).catch(() => context.close());
}

export default function ReminderSettings({ settings, onSave }) {
  const [startTime, setStartTime] = useState(settings.startTime);
  const [endTime, setEndTime] = useState(settings.endTime);
  const [interval, setInterval] = useState(String(settings.interval));
  const [amount, setAmount] = useState(String(settings.amount));
  const [enabled, setEnabled] = useState(settings.remindersEnabled);
  const [reminderSound, setReminderSound] = useState(
    settings.reminderSound || "chime"
  );

  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    setStartTime(settings.startTime);
    setEndTime(settings.endTime);
    setInterval(String(settings.interval));
    setAmount(String(settings.amount));
    setEnabled(settings.remindersEnabled);
    setReminderSound(settings.reminderSound || "chime");
  }, [settings]);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("Notifications are not supported in this browser.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      new Notification("HydroRemind is ready! 💧", {
        body: "Your water reminders are enabled.",
      });
    }
  };

  const save = () => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (startMinutes >= endMinutes) {
      alert("End time must be later than start time on the same day.");
      return;
    }

    onSave({
      startTime,
      endTime,
      interval: Number(interval),
      amount: Number(amount),
      remindersEnabled: enabled,
      reminderSound,
    });

    alert("Reminder settings saved! 💧");
  };

  return (
    <section className="settings-card">
      <div className="settings-card-heading">
        <div className="settings-heading-icon">🔔</div>
        <div>
          <h3>Reminder Settings</h3>
          <p>Build a hydration routine that works for you.</p>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-icon">💧</span>
          <div>
            <strong>Water reminders</strong>
            <small>
              {enabled ? "Reminders are switched on" : "Reminders are paused"}
            </small>
          </div>
        </div>

        <button
          type="button"
          className={`toggle-switch ${enabled ? "is-on" : ""}`}
          role="switch"
          aria-checked={enabled}
          aria-label="Enable water reminders"
          onClick={() => setEnabled((current) => !current)}
        >
          <span />
        </button>
      </div>

      <TimePicker
        label="Start time"
        value={startTime}
        onChange={setStartTime}
      />

      <TimePicker
        label="End time"
        value={endTime}
        onChange={setEndTime}
      />

      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-icon">⏱️</span>
          <div>
            <strong>Reminder interval</strong>
            <small>How often to remind you</small>
          </div>
        </div>

        <select
          className="setting-select"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
        >
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
          <option value="120">2 hours</option>
        </select>
      </div>

      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-icon">🥛</span>
          <div>
            <strong>Water per drink</strong>
            <small>Amount to track each time</small>
          </div>
        </div>

        <select
          className="setting-select"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        >
          <option value="150">150 ml</option>
          <option value="200">200 ml</option>
          <option value="250">250 ml</option>
          <option value="300">300 ml</option>
          <option value="500">500 ml</option>
        </select>
      </div>

      <div className="setting-row">
        <div className="setting-label">
          <span className="setting-icon">🎵</span>
          <div>
            <strong>Reminder sound</strong>
            <small>Choose and preview your chime</small>
          </div>
        </div>

        <div className="sound-controls">
          <select
            className="setting-select"
            value={reminderSound}
            onChange={(e) => setReminderSound(e.target.value)}
            aria-label="Reminder sound"
          >
            <option value="chime">Classic chime</option>
            <option value="gentle">Gentle double</option>
            <option value="double">Two-tone</option>
            <option value="bell">High bell</option>
          </select>

          <button
            type="button"
            className="sound-preview-button"
            onClick={() => previewSound(reminderSound)}
          >
            ▶ Preview
          </button>
        </div>
      </div>

      {enabled && permission !== "granted" && (
        <div className="permission-note">
          <span>🔔</span>
          <div>
            <strong>Allow notifications</strong>
            <small>Needed to show water reminder alerts.</small>
          </div>
          <button
            type="button"
            className="permission-button"
            onClick={requestPermission}
          >
            Allow
          </button>
        </div>
      )}

      <div className="hydration-tip">
        <span>✨</span>
        <p>
          <strong>A little tip</strong><br />
          Keep sipping water throughout the day instead of drinking it all at once.
        </p>
      </div>

      <button
        type="button"
        className="save-settings-button"
        onClick={save}
      >
        Save Reminder Settings <span>→</span>
      </button>
    </section>
  );
}
