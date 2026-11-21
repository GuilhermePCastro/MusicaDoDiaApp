import React from "react";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { getCurrentSaoPauloDate } from "@/lib/utils";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const isAuthenticated = verifyAdminAuth();
  const isPasswordConfigured = Boolean(
    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0
  );

  // SEGURANÇA (admin-challenge-manager):
  // Nunca buscamos ou serializamos dados do banco antes de confirmar verifyAdminAuth() === true
  if (!isAuthenticated) {
    return <AdminLoginForm isPasswordConfigured={isPasswordConfigured} />;
  }

  const todaySaoPaulo = getCurrentSaoPauloDate();

  const [songs, challenges] = await Promise.all([
    prisma.song.findMany({
      orderBy: [{ artist: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        artist: true,
        releaseYear: true,
        genre: true,
        searchIndex: true,
      },
    }),
    prisma.dailyChallenge.findMany({
      orderBy: { challengeDate: "desc" },
      include: {
        song: {
          select: {
            id: true,
            title: true,
            artist: true,
            releaseYear: true,
            genre: true,
          },
        },
      },
    }),
  ]);

  return (
    <AdminDashboard
      todaySaoPaulo={todaySaoPaulo}
      songs={songs}
      challenges={challenges}
    />
  );
}
