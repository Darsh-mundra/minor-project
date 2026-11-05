import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Opportunity } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import {
  Search,
  Bookmark,
  ExternalLink,
  Calendar,
  MapPin,
  Award,
} from 'lucide-react';

// Spring Boot DTO -> existing frontend Opportunity format
const mapOpportunity = (item: any): Opportunity => {
  const skills =
    typeof item.skills === 'string'
      ? item.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

  const category = String(item.category ?? 'OTHER')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char: string) => char.toUpperCase());

  return {
    id: String(item.id),
    title: item.title ?? 'Untitled Opportunity',
    organization: item.organizer || item.providerName || 'Organization not specified',
    category: category as Opportunity['category'],
    location: item.location || item.mode || 'Not specified',
    deadline: item.deadline
      ? new Date(item.deadline).toLocaleDateString()
      : 'Not specified',
    stipendOrPrize: item.opportunityType || item.mode || 'See details',
    description: item.description || 'No description available.',
    applyUrl: item.applyUrl || item.detailsUrl || '',
    tags: skills,
    userStatuses: {},
    bookmarkedBy: item.saved ? ['__current_user_saved__'] : [],
  };
};

const categoryToBackend: Record<string, string> = {
  Internship: 'INTERNSHIP',
  Hackathon: 'HACKATHON',
  'Coding Competition': 'CODING_COMPETITION',
  Workshop: 'WORKSHOP',
  Scholarship: 'SCHOLARSHIP',
  'College Event': 'COLLEGE_EVENT',
};

export const OpportunitiesHub: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadOpportunities = async () => {
    setIsLoading(true);

    try {
      const params: Record<string, string> = {
        page: '0',
        size: '50',
      };

      if (selectedCategory) {
        params.category = categoryToBackend[selectedCategory] ?? selectedCategory;
      }

      if (searchQuery.trim()) {
        params.keyword = searchQuery.trim();
      }

      const response = await api.getOpportunities(params);

      // API returns Spring Page<OpportunityResponseDto>
      const content = Array.isArray(response)
        ? response
        : response?.content ?? [];

      setOpportunities(content.map(mapOpportunity));
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading opportunities',
        message: err.message || 'Could not load opportunities.',
      });
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadOpportunities();
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [selectedCategory, searchQuery]);

  const handleToggleBookmark = async (opp: Opportunity) => {
    const currentlySaved = opp.bookmarkedBy.includes('__current_user_saved__');

    try {
      await api.toggleOpportunityBookmark(opp.id, currentlySaved);

      setOpportunities(prev =>
        prev.map(item =>
          item.id === opp.id
            ? {
                ...item,
                bookmarkedBy: currentlySaved
                  ? []
                  : ['__current_user_saved__'],
              }
            : item
        )
      );

      addToast({
        type: 'success',
        title: currentlySaved
          ? 'Removed from Bookmarks'
          : 'Saved to Bookmarks',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bookmark error',
        message: err.message || 'Could not update bookmark.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Student Opportunities Hub
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Explore internships, hackathons, coding competitions and other
          opportunities.
        </p>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, organization or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="Internship">Internships</option>
          <option value="Hackathon">Hackathons</option>
          <option value="Coding Competition">Coding Competitions</option>
          <option value="Workshop">Workshops</option>
          <option value="Scholarship">Scholarships</option>
          <option value="College Event">College Events</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div
              key={n}
              className="h-52 bg-white rounded-xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No opportunities found"
          description="No matching opportunities were returned. Try another search or category."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {opportunities.map(opp => {
            const isBookmarked = opp.bookmarkedBy.includes(
              '__current_user_saved__'
            );

            return (
              <div
                key={opp.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-indigo-700 uppercase tracking-wider">
                      {opp.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => void handleToggleBookmark(opp)}
                      aria-label={
                        isBookmarked ? 'Remove bookmark' : 'Save opportunity'
                      }
                      title={
                        isBookmarked ? 'Remove bookmark' : 'Save opportunity'
                      }
                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          isBookmarked
                            ? 'fill-indigo-600 text-indigo-600'
                            : ''
                        }`}
                      />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">
                    {opp.title}
                  </h3>

                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {opp.organization}
                  </p>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {opp.description}
                  </p>

                  {opp.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {opp.tags.slice(0, 5).map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{opp.location}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Deadline: {opp.deadline}</span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Award className="w-3.5 h-3.5" />
                      <span>{opp.stipendOrPrize}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  {opp.applyUrl ? (
                    <a
                      href={opp.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center justify-center gap-1"
                    >
                      <span>Apply Official Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">
                      Application link unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
