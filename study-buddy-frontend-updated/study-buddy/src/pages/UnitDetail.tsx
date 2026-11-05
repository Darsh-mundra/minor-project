import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { AcademicResource } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { ArrowLeft, Download, FileText, Star, ThumbsUp, Upload } from 'lucide-react';

interface Props {
  subject: string;
  semester?: string;
  branch?: string;
  unit: string;
  onBack: () => void;
  onUpload: () => void; // jump to Resource Hub upload
  onChangeUnit: (unit: string) => void;
}

const TYPE_ORDER: AcademicResource['resourceType'][] = [
  'Notes', 'PDF', 'PYQ', 'Assignment', 'Question Bank', 'Lab Manual', 'Presentation',
];

export const UnitDetail: React.FC<Props> = ({ subject, semester, branch, unit, onBack, onUpload, onChangeUnit }) => {
  const { addToast } = useToast();
  const [items, setItems] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params: Record<string, string> = { subject };
    if (semester) params.semester = semester;
    if (branch) params.branch = branch;
    api.getResources(params)
      .then(d => { if (alive) setItems(d); })
      .catch((e: any) => addToast({ type: 'error', title: 'Could not load unit', message: e.message }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [subject, semester, branch]);

  const unitItems = useMemo(
    () => items.filter(r => r.unit === unit || r.unit === 'All Units'),
    [items, unit]
  );
  const grouped = useMemo(() => {
    const m = new Map<string, AcademicResource[]>();
    TYPE_ORDER.forEach(t => {
      const g = unitItems.filter(r => r.resourceType === t);
      if (g.length) m.set(t, g);
    });
    return m;
  }, [unitItems]);

  const unitNum = Number(unit.replace(/\D/g, '')) || 1;

  const download = async (r: AcademicResource) => {
    try {
      await api.downloadResource(r.id);
      setItems(prev => prev.map(x => (x.id === r.id ? { ...x, downloadCount: x.downloadCount + 1 } : x)));
      window.open(r.fileUrl, '_blank');
    } catch (e: any) {
      addToast({ type: 'error', title: 'Download failed', message: e.message });
    }
  };

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to syllabus map
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">
          {semester ? `Semester ${semester} · ` : ''}{subject}
        </p>
        <h1 className="text-xl font-bold text-slate-900 mt-1">{unit}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => onChangeUnit(`Unit ${n}`)}
                className={`px-3 py-1 text-xs rounded-full border font-semibold ${
                  n === unitNum ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                U{n}
              </button>
            ))}
          </div>
          <button onClick={onUpload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Upload className="w-3.5 h-3.5" /> Upload to {unit}
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {unitItems.length} resource{unitItems.length === 1 ? '' : 's'} · {grouped.size} categor{grouped.size === 1 ? 'y' : 'ies'}
        </p>
      </div>

      {loading ? (
        <div className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : unitItems.length === 0 ? (
        <EmptyState
          title={`No material for ${unit} yet`}
          description="Be the first to upload notes or question papers for this unit and earn contribution points."
          actionText="Upload Resource"
          onAction={onUpload}
        />
      ) : (
        Array.from(grouped.entries()).map(([type, list]) => (
          <section key={type} className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800">{type} <span className="text-slate-400 font-medium">({list.length})</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map(r => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                      <p className="text-[11px] text-slate-500">by {r.uploaderName} · {r.fileSize}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{r.rating.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{r.helpfulVotes}</span>
                    </span>
                    <button onClick={() => download(r)} className="flex items-center gap-1 font-semibold text-indigo-600 hover:underline">
                      <Download className="w-3.5 h-3.5" /> Get ({r.downloadCount})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
