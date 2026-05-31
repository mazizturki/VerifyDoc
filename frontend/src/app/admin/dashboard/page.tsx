'use client';
import { useEffect, useState } from 'react';
import { reportsApi } from '@/lib/api';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, recent: 0 });
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    reportsApi.list(1, 5).then((data) => {
      setStats({ total: data.total, recent: data.data.filter((r: any) => {
        const d = new Date(r.createdAt);
        return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length });
      setRecentReports(data.data);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-slate-800">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Vue d'ensemble de la plateforme VerifyDoc</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Rapports enregistrés', value: stats.total, icon: FileText, color: 'teal' },
          { label: 'Ajoutés cette semaine', value: stats.recent, icon: TrendingUp, color: 'blue' },
          { label: 'Statut plateforme', value: 'Actif', icon: CheckCircle, color: 'green' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
              color === 'teal' ? 'bg-teal-50 text-teal-600' :
              color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-800">{value}</div>
            <div className="text-slate-500 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent reports */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Rapports récents</h2>
          <Link href="/admin/reports" className="text-teal-600 text-sm hover:underline">Voir tout</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentReports.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Aucun rapport enregistré</p>
              <Link href="/admin/reports" className="text-teal-600 text-sm hover:underline mt-1 block">
                Créer un rapport →
              </Link>
            </div>
          ) : (
            recentReports.map((r) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate text-sm">{r.title}</div>
                  <div className="text-slate-400 text-xs">{r.university} · {r.academicYear}</div>
                </div>
                <div className="text-xs text-slate-400 font-mono shrink-0">
                  v{r.versions?.[0]?.version || '—'}
                </div>
                <Link href={`/admin/reports`} className="text-teal-600 text-xs hover:underline shrink-0">Gérer</Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
