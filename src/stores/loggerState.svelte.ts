// Session log panel. Every showStatus() toast is also recorded here so the user
// has a scrollable history (the toast itself is ephemeral). In-memory only.

export type LogLevel = "info" | "success" | "warn" | "error";

export interface LogEntry {
    id: number;
    time: string;
    level: LogLevel;
    message: string;
}

const MAX_ENTRIES = 500;
let counter = 0;

export const loggerState = $state({
    entries: [] as LogEntry[],
    isOpen: false,
});

export function addLog(level: LogLevel, message: string) {
    const time = new Date().toLocaleTimeString();
    const next = loggerState.entries.slice(-(MAX_ENTRIES - 1));
    next.push({ id: counter++, time, level, message });
    loggerState.entries = next;
}

export function clearLogs() {
    loggerState.entries = [];
}

export function toggleLogger() {
    loggerState.isOpen = !loggerState.isOpen;
}

export function closeLogger() {
    loggerState.isOpen = false;
}
