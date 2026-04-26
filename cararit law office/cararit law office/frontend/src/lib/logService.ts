export interface LogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
}

export const addLog = (action: string, userName: string) => {
  const logs: LogEntry[] = JSON.parse(localStorage.getItem("brgy_logs") || "[]");
  logs.unshift({
    id: Date.now().toString(),
    action,
    user: userName,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("brgy_logs", JSON.stringify(logs.slice(0, 500)));
};

export const getLogs = (): LogEntry[] => {
  return JSON.parse(localStorage.getItem("brgy_logs") || "[]");
};
