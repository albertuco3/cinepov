"use client";

import { useState, useEffect, useRef } from "react";
import Link from "@/components/LocaleLink";
import { Bell } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Se cargan al montar, al abrir el desplegable y al volver a la pestaña. Sin
  // polling: preguntar cada minuto en cada pestaña abierta mantiene despierta la
  // base de datos para avisos que llegan de tarde en tarde.
  useEffect(() => {
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // Silencioso: se conserva lo último cargado.
      }
    };

    void load();
    document.addEventListener("visibilitychange", load);
    return () => document.removeEventListener("visibilitychange", load);
  }, [open]);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications/read", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Ignorar
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n.id }),
      }).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-white transition-colors cursor-pointer"
        title="Notificaciones"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-[#0f111a] border border-white/10 shadow-2xl p-4 z-50 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="text-[10px] text-primary-light font-bold hover:underline cursor-pointer"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {notifications.length > 0 ? (
              notifications.map((n) => {
                const dateStr = new Date(n.createdAt).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const content = (
                  <div
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      n.isRead
                        ? "bg-white/[0.01] border-white/5 text-muted-foreground hover:text-white hover:bg-white/5"
                        : "bg-primary/10 border-primary/30 text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold block">{n.title}</span>
                      <span className="text-[9px] text-muted-foreground">{dateStr}</span>
                    </div>
                    <p className="text-xs mt-1 leading-snug">{n.message}</p>
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} href={n.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No tienes notificaciones pendientes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
