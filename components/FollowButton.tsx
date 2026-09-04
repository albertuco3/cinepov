"use client";

import { useState } from "react";
import { toast } from "sonner";

interface Props {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  currentUserId?: string | null;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  currentUserId,
}: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [loading, setLoading] = useState(false);

  // No permitir seguirse a sí mismo
  if (currentUserId && currentUserId === targetUserId) {
    return null;
  }

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      toast.info("Inicia sesión para seguir a este cinéfilo");
      return;
    }

    setLoading(true);
    // Optimismo
    const nextState = !isFollowing;
    setIsFollowing(nextState);
    setFollowerCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await fetch(`/api/user/${targetUserId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar seguimiento");

      setIsFollowing(data.isFollowing);
      toast.success(
        data.isFollowing ? "Ahora sigues a este usuario" : "Has dejado de seguir a este usuario"
      );
    } catch (err: any) {
      // Revertir optimismo
      setIsFollowing(!nextState);
      setFollowerCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
      toast.error(err.message || "Error al actualizar seguimiento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground font-semibold">
        <strong className="text-white tabular-nums">{followerCount}</strong>{" "}
        {followerCount === 1 ? "seguidor" : "seguidores"}
      </span>
      <button
        onClick={handleToggleFollow}
        disabled={loading}
        className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
          isFollowing
            ? "bg-white/10 border-white/20 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300"
            : "bg-primary hover:bg-primary-hover border-primary text-white shadow-lg shadow-primary/20"
        }`}
      >
        {isFollowing ? "Siguiendo" : "+ Seguir"}
      </button>
    </div>
  );
}
