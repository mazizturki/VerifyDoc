'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { reportsApi } from '@/lib/api';
import { Report, VerifyResult } from '@/types';
import {
  ShieldCheck, ShieldX, Upload, Download, CheckCircle2, XCircle,
  FileText, User, GraduationCap, Building2, Calendar, Hash,
  ChevronDown, ChevronUp, Loader2, Shield,
} from 'lucide-react';

function HashDisplay({ hash }: { hash: string }) {
  return (
    <span className="font-mono text-xs break-all text-slate-600 bg-slate-100 px-2 py-1 rounded">
      {hash}
    </span>
  );
}

export default function VerifyPage() {
  const params = useParams();
  const id = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    reportsApi.getPublic(id)
      .then(setReport)
      .catch(() => setError('Rapport introuvable. Vérifiez que le QR code est valide.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleVerify = async () => {
    if (!file) return;
    setVerifying(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('pdf', file);
      const res = await reportsApi.verifyHash(id, fd);
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setVerifying(false);
    }
  };

  const currentVersion = report?.versions[0];

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center">
      <div className="text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
        <p>Vérification en cours…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center shadow-sm shadow-teal-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-slate-800 text-lg leading-none">VerifyDoc</div>
            <div className="text-teal-600 text-[10px] font-mono tracking-widest uppercase">Vérification d'authenticité</div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 py-8 space-y-5">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <ShieldX className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-red-700 font-semibold text-lg mb-1">Rapport introuvable</h2>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : report && (
          <>
            {/* Status badge */}
            <div className="bg-teal-500 text-white rounded-2xl p-5 flex items-center gap-4 shadow-lg shadow-teal-500/20">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <div className="font-semibold text-lg">✓ Rapport officiel enregistré</div>
                <div className="text-teal-100 text-sm mt-0.5">Ce rapport est authentifié par la plateforme VerifyDoc</div>
              </div>
            </div>

            {/* Report info */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h1 className="font-display text-2xl text-slate-800">{report.title}</h1>
                {report.subtitle && <p className="text-slate-500 mt-1">{report.subtitle}</p>}
              </div>

              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: User, label: 'Auteurs', value: report.authors.join(' · ') },
                  { icon: GraduationCap, label: 'Encadrants', value: report.supervisors.join(' · ') },
                  { icon: GraduationCap, label: 'Université', value: report.university },
                  { icon: Building2, label: 'Entreprise', value: report.hostCompany || '—' },
                  { icon: Calendar, label: 'Année universitaire', value: report.academicYear },
                  { icon: FileText, label: 'Version', value: currentVersion ? `v${currentVersion.version} (plateforme v${currentVersion.platformVersion})` : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</div>
                      <div className="text-slate-700 text-sm mt-0.5">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Technical info */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-3">
                <div>
                  <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">UUID</div>
                  <span className="font-mono text-xs text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">{report.id}</span>
                </div>
                {currentVersion && (
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <Hash className="w-3 h-3" />Hash SHA-256 officiel
                    </div>
                    <HashDisplay hash={currentVersion.sha256Hash} />
                  </div>
                )}
                {currentVersion && (
                  <div>
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Date de génération</div>
                    <span className="text-slate-600 text-sm">{new Date(currentVersion.generatedAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Download */}
            {currentVersion && (
              <a href={reportsApi.downloadUrl(currentVersion.id)}
                className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-teal-300 hover:shadow-md transition group">
                <div className="w-10 h-10 bg-teal-50 group-hover:bg-teal-100 rounded-xl flex items-center justify-center text-teal-600 transition">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Télécharger le PDF officiel</div>
                  <div className="text-slate-400 text-xs">Version {currentVersion.version} — référence officielle</div>
                </div>
              </a>
            )}

            {/* Hash verification */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800">Vérifier l'intégrité d'un PDF</h2>
                <p className="text-slate-500 text-sm mt-0.5">Téléversez un fichier PDF pour comparer son empreinte avec l'original</p>
              </div>

              <div className="p-5 space-y-4">
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${file ? 'border-teal-400 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/50'}`}
                  onClick={() => document.getElementById('verify-pdf')?.click()}
                >
                  <input id="verify-pdf" type="file" accept="application/pdf" className="hidden"
                    onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); }} />
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-teal-700">
                      <FileText className="w-5 h-5" />
                      <span className="font-medium text-sm">{file.name}</span>
                      <span className="text-teal-500 text-xs">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <div className="text-slate-400">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-60" />
                      <p className="text-sm font-medium">Cliquer pour sélectionner un PDF</p>
                      <p className="text-xs mt-1 opacity-60">Le fichier ne sera pas stocké</p>
                    </div>
                  )}
                </div>

                <button onClick={handleVerify} disabled={!file || verifying}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2">
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Vérifier l'authenticité
                </button>

                {result && (
                  <div className={`rounded-xl p-4 border ${result.match ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className={`flex items-center gap-2 font-semibold mb-3 ${result.match ? 'text-green-700' : 'text-red-700'}`}>
                      {result.match ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      {result.match ? '✓ Document authentique' : '✗ Document modifié ou différent'}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium">Hash fourni : </span>
                        <HashDisplay hash={result.providedHash} />
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium">Hash officiel : </span>
                        <HashDisplay hash={result.officialHash} />
                      </div>
                      <div className={`font-medium mt-2 ${result.match ? 'text-green-600' : 'text-red-600'}`}>
                        {result.match ? 'Les empreintes correspondent ✓' : 'Les empreintes ne correspondent pas ✗'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Version history */}
            {report.versions.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition"
                >
                  <div>
                    <span className="font-semibold text-slate-800">Historique des versions</span>
                    <span className="text-slate-400 text-sm ml-2">{report.versions.length} versions</span>
                  </div>
                  {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showHistory && (
                  <div className="px-5 pb-5 space-y-2 border-t border-slate-100 pt-4">
                    {report.versions.map((v, i) => (
                      <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold ${i === 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>
                          v{v.version}
                        </span>
                        {i === 0 && <span className="text-[10px] bg-teal-500 text-white px-1.5 py-0.5 rounded-full font-medium">Actuelle</span>}
                        <span className="text-slate-400 text-xs flex-1">{new Date(v.generatedAt).toLocaleDateString('fr-FR')}</span>
                        <a href={reportsApi.downloadUrl(v.id)} className="text-teal-600 text-xs hover:underline flex items-center gap-1">
                          <Download className="w-3 h-3" />PDF
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-teal-500 rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-slate-700 text-sm font-semibold">VerifyDoc</span>
          </div>
          <p className="text-slate-400 text-xs text-center">
            Plateforme conçue par <span className="text-slate-600 font-medium">Mohamed Aziz Turki</span> — une solution pour garantir l'authenticité et l'intégrité des rapports.
          </p>
          <p className="text-slate-300 text-[10px] font-mono">Système de traçabilité et d'authentification des rapports académiques</p>
        </div>
      </footer>
    </div>
  );
}
