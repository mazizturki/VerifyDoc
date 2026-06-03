'use client';
import { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '@/lib/api';
import { Report } from '@/types';
import { toast } from 'sonner';
import {
  Plus, Search, Trash2, QrCode, Download, ChevronDown, ChevronUp,
  FileText, X, Loader2, Upload, Eye, CheckCircle2, AlertTriangle, Shield,
} from 'lucide-react';

// ─── CreateModal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (report: Report) => void }) {
  const [form, setForm] = useState({
    title: '', subtitle: '', university: '', hostCompany: '',
    academicYear: '', authors: '', supervisors: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.subtitle) fd.append('subtitle', form.subtitle);
      fd.append('authors', JSON.stringify(form.authors.split('\n').map((s: string) => s.trim()).filter(Boolean)));
      fd.append('supervisors', JSON.stringify(form.supervisors.split('\n').map((s: string) => s.trim()).filter(Boolean)));
      fd.append('university', form.university);
      if (form.hostCompany) fd.append('hostCompany', form.hostCompany);
      fd.append('academicYear', form.academicYear);
      const created = await reportsApi.create(fd);
      toast.success('Rapport créé — téléchargez le QR code et uploadez le PDF final');
      onCreated(created);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-xl text-slate-800">Nouveau rapport</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Workflow notice */}
        <div className="mx-5 mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg flex gap-2.5">
          <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <p className="text-teal-700 text-xs leading-relaxed">
            <strong>Workflow recommandé :</strong> créez d'abord le rapport sans PDF pour obtenir votre QR code,
            intégrez-le dans votre PDF final, puis uploadez ce PDF via «&nbsp;Uploader PDF final&nbsp;».
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Titre *</label>
              <input className="input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required />
            </div>
            <div className="col-span-2">
              <label className="label">Sous-titre</label>
              <input className="input" value={form.subtitle} onChange={e => setForm(f => ({...f, subtitle: e.target.value}))} />
            </div>
            <div>
              <label className="label">Université *</label>
              <input className="input" value={form.university} onChange={e => setForm(f => ({...f, university: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Entreprise d'accueil</label>
              <input className="input" value={form.hostCompany} onChange={e => setForm(f => ({...f, hostCompany: e.target.value}))} />
            </div>
            <div>
              <label className="label">Année universitaire *</label>
              <input className="input" placeholder="2023-2024" value={form.academicYear} onChange={e => setForm(f => ({...f, academicYear: e.target.value}))} required />
            </div>
            <div>
              <label className="label">Auteurs (un par ligne) *</label>
              <textarea className="input h-20 resize-none" value={form.authors} onChange={e => setForm(f => ({...f, authors: e.target.value}))} required placeholder="Prénom Nom&#10;Prénom Nom" />
            </div>
            <div>
              <label className="label">Encadrants (un par ligne) *</label>
              <textarea className="input h-20 resize-none" value={form.supervisors} onChange={e => setForm(f => ({...f, supervisors: e.target.value}))} required placeholder="Dr. Nom&#10;Prof. Nom" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
              Créer le rapport
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── WorkflowModal ────────────────────────────────────────────────────────────
function WorkflowModal({ report, onClose, onFinalized }: { report: Report; onClose: () => void; onFinalized: () => void }) {
  const [qrSrc, setQrSrc] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('verifydoc_token') : null;
    fetch(reportsApi.qrUrl(report.id, 'png'), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.blob())
      .then(b => setQrSrc(URL.createObjectURL(b)))
      .catch(() => {});
  }, [report.id]);

  const downloadQr = async (fmt: 'png' | 'svg') => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('verifydoc_token') : null;
    const res = await fetch(reportsApi.qrUrl(report.id, fmt), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode-${report.id}.${fmt}`;
    a.click();
  };

  if (showUpload) {
    return (
      <AddVersionModal
        report={report}
        onClose={() => setShowUpload(false)}
        onAdded={() => { onFinalized(); onClose(); }}
        isFinal
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Rapport créé — Finalisez la configuration</h2>
              <p className="text-teal-100 text-xs mt-0.5">Suivez ces 3 étapes pour activer la vérification</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6">

          {/* Étape 1 — Rapport créé */}
          <div className="flex gap-3.5">
            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Rapport enregistré</p>
              <p className="text-slate-600 text-xs mt-0.5 truncate max-w-sm">{report.title}</p>
              <p className="font-mono text-xs text-slate-400 mt-1 break-all">{report.id}</p>
            </div>
          </div>

          {/* Étape 2 — QR code */}
          <div className="flex gap-3.5">
            <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <QrCode className="w-4 h-4 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">Télécharger le QR code</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Intégrez ce QR code dans votre PDF (page de couverture ou dernière page).
              </p>
              <div className="mt-3 flex gap-4 items-start">
                {qrSrc ? (
                  <img src={qrSrc} alt="QR Code" className="w-28 h-28 border border-slate-200 rounded-xl shadow-sm" />
                ) : (
                  <div className="w-28 h-28 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                )}
                <div className="flex flex-col gap-2 mt-1">
                  <button onClick={() => downloadQr('png')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
                    <Download className="w-3 h-3" />PNG
                  </button>
                  <button onClick={() => downloadQr('svg')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
                    <Download className="w-3 h-3" />SVG
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Étape 3 — PDF final */}
          <div className="flex gap-3.5">
            <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <Upload className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800 text-sm">Uploader le PDF final</p>
              <p className="text-slate-500 text-xs mt-0.5">
                Après avoir intégré le QR code, uploadez ce PDF final.
                Son empreinte SHA-256 sera enregistrée comme référence officielle.
              </p>
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-700 text-xs font-medium leading-relaxed">
                  ⚠ Le hash stocké doit correspondre au PDF distribué.
                  Si vous ajoutez le QR code après l'upload, la vérification échouera.
                </p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition shadow-sm"
              >
                <Upload className="w-4 h-4" />Uploader le PDF final
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition">
            Fermer — je configurerai le PDF plus tard
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AddVersionModal ──────────────────────────────────────────────────────────
function AddVersionModal({
  report, onClose, onAdded, isFinal = false,
}: {
  report: Report; onClose: () => void; onAdded: () => void; isFinal?: boolean;
}) {
  const [version, setVersion] = useState(isFinal ? '1.0' : '');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Sélectionner un PDF'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('version', version);
      fd.append('pdf', file);
      await reportsApi.addVersion(report.id, fd);
      toast.success(isFinal ? 'PDF final uploadé — vérification activée ✓' : `Version ${version} ajoutée`);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-xl text-slate-800">
            {isFinal ? 'Uploader le PDF final' : 'Nouvelle version'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 border truncate">{report.title}</p>

          {isFinal && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-700 text-xs leading-relaxed">
                <strong>Important :</strong> uploadez le PDF tel qu'il sera distribué (avec le QR code intégré).
                Le hash calculé sera la référence de vérification. Toute modification ultérieure rendra
                la vérification impossible sans uploader une nouvelle version.
              </p>
            </div>
          )}

          <div>
            <label className="label">Numéro de version *</label>
            {isFinal ? (
              <input className="input bg-slate-50 text-slate-500" value={version} readOnly />
            ) : (
              <input className="input" placeholder="ex: 2.0" value={version} onChange={e => setVersion(e.target.value)} required />
            )}
          </div>

          <div>
            <label className="label">
              {isFinal ? 'PDF officiel avec QR code intégré *' : 'Nouveau PDF *'}
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${file ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}
              onClick={() => document.getElementById('pdf-version')?.click()}
            >
              <input id="pdf-version" type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <span className="text-sm text-teal-700 font-medium">{file.name}</span>
              ) : (
                <div className="text-slate-400">
                  <Upload className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-sm">Sélectionner PDF</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className={`flex-1 ${isFinal ? 'btn-warning' : 'btn-primary'}`}>
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {isFinal ? 'Uploader et activer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── ReportRow ────────────────────────────────────────────────────────────────
function ReportRow({ report, onRefresh }: { report: Report; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [addVersion, setAddVersion] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentVersion = report.versions[0] ?? null;
  const isPending = !currentVersion;

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${report.title}" ?`)) return;
    setDeleting(true);
    try {
      await reportsApi.delete(report.id);
      toast.success('Rapport supprimé');
      onRefresh();
    } catch { toast.error('Erreur lors de la suppression'); setDeleting(false); }
  };

  const downloadQr = async (fmt: 'png' | 'svg') => {
    const token = localStorage.getItem('verifydoc_token');
    const url = reportsApi.qrUrl(report.id, fmt);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `qrcode-${report.id}.${fmt}`;
    a.click();
    toast.info('QR code téléchargé. Intégrez-le dans le PDF, puis uploadez la version finale via « PDF final ».');
  };

  return (
    <>
      {addVersion && (
        <AddVersionModal
          report={report}
          onClose={() => setAddVersion(false)}
          onAdded={onRefresh}
          isFinal={isPending}
        />
      )}
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${isPending ? 'border-amber-200' : 'border-slate-200'}`}>
        <div className="px-5 py-4 flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isPending ? 'bg-amber-50 text-amber-500' : 'bg-teal-50 text-teal-600'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 leading-snug">{report.title}</h3>
                {report.subtitle && <p className="text-slate-500 text-sm">{report.subtitle}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                  <span>{report.university}</span>
                  {report.hostCompany && <span>· {report.hostCompany}</span>}
                  <span>· {report.academicYear}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Auteurs : {report.authors.join(', ')}
                </div>
              </div>
              <div className="shrink-0">
                {isPending ? (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />Sans PDF
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-mono font-medium">
                    v{currentVersion.version}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bandeau d'avertissement si aucun PDF */}
        {isPending && (
          <div className="px-5 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2 text-amber-700 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Aucun PDF uploadé. Téléchargez le QR code → intégrez-le dans votre PDF → uploadez la version finale.
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <a href={`/verify/r/${report.id}`} target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
            <Eye className="w-3.5 h-3.5" />Page publique
          </a>
          <button onClick={() => downloadQr('png')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
            <QrCode className="w-3.5 h-3.5" />QR PNG
          </button>
          <button onClick={() => downloadQr('svg')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
            <QrCode className="w-3.5 h-3.5" />QR SVG
          </button>
          <button onClick={() => setAddVersion(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition font-medium ${
              isPending
                ? 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700'
                : 'border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700'
            }`}>
            {isPending ? <Upload className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isPending ? 'PDF final requis' : 'Nouvelle version'}
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition ml-auto">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {report.versions.length} version(s)
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Versions */}
        {expanded && (
          <div className="px-5 py-3 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Historique des versions</h4>
            {report.versions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun PDF uploadé pour ce rapport.</p>
            ) : (
              <div className="space-y-2">
                {report.versions.map((v, i) => (
                  <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-medium ${i === 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>
                      v{v.version}
                    </span>
                    <span className="text-slate-500 text-xs">{new Date(v.generatedAt).toLocaleDateString('fr-FR')}</span>
                    <span className="font-mono text-xs text-slate-400 flex-1 truncate">{v.sha256Hash.slice(0, 20)}…</span>
                    <a href={reportsApi.downloadUrl(v.id)}
                      className="flex items-center gap-1 text-teal-600 text-xs hover:underline">
                      <Download className="w-3 h-3" />PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Reports page ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [workflowReport, setWorkflowReport] = useState<Report | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reportsApi.list(page, 10);
      setReports(data.data);
      setTotal(data.total);
      setPages(data.pages);
    } catch { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (report: Report) => {
    load();
    setWorkflowReport(report);
  };

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.university.toLowerCase().includes(search.toLowerCase()) ||
    r.authors.some(a => a.toLowerCase().includes(search.toLowerCase()))
  );

  const pendingCount = reports.filter(r => r.versions.length === 0).length;

  return (
    <>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {workflowReport && (
        <WorkflowModal
          report={workflowReport}
          onClose={() => setWorkflowReport(null)}
          onFinalized={() => { load(); setWorkflowReport(null); }}
        />
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-slate-800">Rapports</h1>
            <p className="text-slate-500 mt-0.5">
              {total} rapport(s) enregistré(s)
              {pendingCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />{pendingCount} sans PDF final
                </span>
              )}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4 mr-1.5" />Nouveau rapport
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Rechercher par titre, université, auteur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />Chargement…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Aucun rapport trouvé</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 mx-auto">
              <Plus className="w-4 h-4 mr-1.5" />Créer le premier rapport
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(r => <ReportRow key={r.id} report={r} onRefresh={load} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition ${p === page ? 'bg-teal-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .label { display: block; font-size: 0.875rem; font-weight: 500; color: #475569; margin-bottom: 0.375rem; }
        .input { width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: #0f172a; outline: none; transition: all 0.15s; background: white; }
        .input:focus { border-color: transparent; box-shadow: 0 0 0 2px #14b8a6; }
        .btn-primary { display: inline-flex; align-items: center; background: #14b8a6; color: white; font-weight: 600; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 0.625rem; border: none; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #0d9488; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-warning { display: inline-flex; align-items: center; justify-content: center; background: #f59e0b; color: white; font-weight: 600; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 0.625rem; border: none; cursor: pointer; transition: background 0.15s; }
        .btn-warning:hover { background: #d97706; }
        .btn-warning:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-secondary { display: inline-flex; align-items: center; justify-content: center; background: white; color: #475569; font-weight: 500; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 0.625rem; border: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s; }
        .btn-secondary:hover { background: #f8fafc; }
      `}</style>
    </>
  );
}
