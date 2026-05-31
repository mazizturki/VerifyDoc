'use client';
import { useEffect, useState, useCallback } from 'react';
import { reportsApi } from '@/lib/api';
import { Report } from '@/types';
import { toast } from 'sonner';
import {
  Plus, Search, Trash2, QrCode, Download, ChevronDown, ChevronUp,
  FileText, RefreshCw, X, Loader2, Upload, Eye,
} from 'lucide-react';

// ─── CreateModal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: '', subtitle: '', university: '', hostCompany: '',
    academicYear: '', version: '1.0', platformVersion: '1.0.0',
    authors: '', supervisors: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('Veuillez sélectionner un fichier PDF'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      if (form.subtitle) fd.append('subtitle', form.subtitle);
      fd.append('authors', JSON.stringify(form.authors.split('\n').map(s => s.trim()).filter(Boolean)));
      fd.append('supervisors', JSON.stringify(form.supervisors.split('\n').map(s => s.trim()).filter(Boolean)));
      fd.append('university', form.university);
      if (form.hostCompany) fd.append('hostCompany', form.hostCompany);
      fd.append('academicYear', form.academicYear);
      fd.append('version', form.version);
      fd.append('platformVersion', form.platformVersion);
      fd.append('pdf', file);
      await reportsApi.create(fd);
      toast.success('Rapport créé avec succès');
      onCreated();
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
              <label className="label">Version</label>
              <input className="input" value={form.version} onChange={e => setForm(f => ({...f, version: e.target.value}))} />
            </div>
            <div>
              <label className="label">Auteurs (un par ligne) *</label>
              <textarea className="input h-20 resize-none" value={form.authors} onChange={e => setForm(f => ({...f, authors: e.target.value}))} required placeholder="Prénom Nom&#10;Prénom Nom" />
            </div>
            <div>
              <label className="label">Encadrants (un par ligne) *</label>
              <textarea className="input h-20 resize-none" value={form.supervisors} onChange={e => setForm(f => ({...f, supervisors: e.target.value}))} required placeholder="Dr. Nom&#10;Prof. Nom" />
            </div>
            <div className="col-span-2">
              <label className="label">PDF officiel *</label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${file ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'}`}
                onClick={() => document.getElementById('pdf-create')?.click()}
              >
                <input id="pdf-create" type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-teal-700">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-teal-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <Upload className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-sm">Cliquer pour sélectionner un PDF</p>
                    <p className="text-xs mt-0.5">Max 50 MB</p>
                  </div>
                )}
              </div>
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

// ─── AddVersionModal ──────────────────────────────────────────────────────────
function AddVersionModal({ report, onClose, onAdded }: { report: Report; onClose: () => void; onAdded: () => void }) {
  const [version, setVersion] = useState('');
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
      toast.success(`Version ${version} ajoutée`);
      onAdded();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-xl text-slate-800">Nouvelle version</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-slate-500 bg-slate-50 rounded-lg p-3 border">{report.title}</p>
          <div>
            <label className="label">Numéro de version *</label>
            <input className="input" placeholder="ex: 2.0" value={version} onChange={e => setVersion(e.target.value)} required />
          </div>
          <div>
            <label className="label">Nouveau PDF *</label>
            <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${file ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300'}`}
              onClick={() => document.getElementById('pdf-version')?.click()}>
              <input id="pdf-version" type="file" accept="application/pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? <span className="text-sm text-teal-700 font-medium">{file.name}</span> :
                <div className="text-slate-400"><Upload className="w-5 h-5 mx-auto mb-1" /><p className="text-sm">Sélectionner PDF</p></div>}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 btn-primary">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              Ajouter
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
  };

  const currentVersion = report.versions[0];

  return (
    <>
      {addVersion && <AddVersionModal report={report} onClose={() => setAddVersion(false)} onAdded={onRefresh} />}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-start gap-4">
          <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 shrink-0 mt-0.5">
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
              <div className="flex items-center gap-1 shrink-0">
                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-mono font-medium">
                  v{currentVersion?.version || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 transition">
            <Plus className="w-3.5 h-3.5" />Nouvelle version
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

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.university.toLowerCase().includes(search.toLowerCase()) ||
    r.authors.some(a => a.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />}

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl text-slate-800">Rapports</h1>
            <p className="text-slate-500 mt-0.5">{total} rapport(s) enregistré(s)</p>
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
        .btn-secondary { display: inline-flex; align-items: center; justify-content: center; background: white; color: #475569; font-weight: 500; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 0.625rem; border: 1px solid #e2e8f0; cursor: pointer; transition: background 0.15s; }
        .btn-secondary:hover { background: #f8fafc; }
      `}</style>
    </>
  );
}
