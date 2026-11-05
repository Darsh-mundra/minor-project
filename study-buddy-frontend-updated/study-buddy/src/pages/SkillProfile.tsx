import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Award,
  User,
  BrainCircuit,
  BookOpen,
  FolderGit2,
  CheckCircle2,
  Trophy,
  ExternalLink,
} from 'lucide-react';

export const SkillProfile: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getSkillProfile();
        setProfileData(data);
      } catch (err: any) {
        addToast({ type: 'error', title: 'Error loading skill profile', message: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (isLoading || !profileData) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading verified student skill profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={user?.avatarUrl || '/src/assets/images/avatar_student_sarah_1791044501841.jpg'}
            alt={user?.fullName}
            referrerPolicy="no-referrer"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-100 shadow-sm"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://api.dicebear.com/7.x/bottts/svg?seed=student';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {user?.fullName}
              </h1>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Verified Scholar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{user?.email}</p>
            <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
              <span>{user?.college}</span>
              <span>·</span>
              <span>{user?.branch}</span>
              <span>·</span>
              <span>Semester {user?.semester}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 self-stretch sm:self-auto justify-around">
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Points</span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {user?.points}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Badges</span>
            <span className="text-xl font-extrabold text-indigo-600 tabular-nums">
              {user?.badges?.length || 0}
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase">Uploads</span>
            <span className="text-xl font-extrabold text-slate-900 tabular-nums">
              {profileData.uploadedResourcesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Technical Skills & Verified Peer Endorsements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {profileData.skills.map((s: any, idx: number) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                <span className="text-[11px] text-indigo-600 font-semibold">{s.level}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500 tabular-nums">
                +{s.endorsements} endorsements
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges & Contributions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Badges earned */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Earned Achievement Badges
          </h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {user?.badges?.map((badge, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 text-xs font-bold"
              >
                <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Quiz Performance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Recent Assessment History
          </h2>
          <div className="space-y-2">
            {profileData.recentQuizAttempts.slice(0, 3).map((a: any) => (
              <div
                key={a.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{a.quizTitle}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(a.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-emerald-600 tabular-nums">
                  {a.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Associated Projects */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">
          Portfolio Projects & Team Roles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profileData.projects.map((p: any) => (
            <div key={p.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-700 uppercase">{p.projectType}</span>
                <span className="text-slate-400 font-medium">{p.status}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{p.projectName}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
              {p.githubUrl && (
                <a
                  href={p.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 font-semibold hover:underline inline-flex items-center gap-1 pt-1"
                >
                  GitHub Repository <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
