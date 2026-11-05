import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Flashcard } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  Layers,
  Sparkles,
  RotateCw,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  BookOpen,
} from 'lucide-react';

const SUBJECT_LABELS: Record<string, string> = {
  JAVA: 'Java',
  DBMS: 'Database Management Systems',
  OPERATING_SYSTEMS: 'Operating Systems',
  COMPUTER_NETWORKS: 'Computer Networks',
  DATA_STRUCTURES: 'Data Structures',
  ALGORITHMS: 'Design & Analysis of Algorithms',
  CYBER_SECURITY: 'Cyber Security',
  INTERNET_OF_THINGS: 'Internet of Things',
  SOFTWARE_ENGINEERING: 'Software Engineering',
  OTHER: 'Other',
};

const toFlashcards = (decks: any[]) =>
  decks.flatMap(deck =>
    (deck.flashcards ?? []).map((card: any) => ({
      id: card.id,
      subject: SUBJECT_LABELS[deck.subject] ?? deck.subject,
      topic: deck.syllabus,
      difficulty: 'Standard',
      front: card.question,
      back: card.answer,
      isKnown: card.status === 'MASTERED',
      status: card.status,
      deckId: deck.id,
    }))
  );
export const FlashcardHub: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Generator Modal
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genForm, setGenForm] = useState({
    subject: 'DBMS',
    topic: 'Transactions & Locking Protocols',
    count: 4,
  });

  const loadFlashcards = async () => {
    setIsLoading(true);
    try {
      const data = await api.getFlashcards();
      setFlashcards(toFlashcards(data));
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error loading flashcards', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const countMap: Record<number, string> = {
        4: 'FOUR',
        5: 'FIVE',
        10: 'TEN',
        20: 'ENTY',
      };

      const createdDeck = await api.generateAiFlashcards({
        subject: genForm.subject,
        syllabus: genForm.topic,
        numberOfFlashcards: countMap[genForm.count],
      });

      const createdCards = toFlashcards([createdDeck]);

      addToast({
        type: 'success',
        title: 'AI Flashcards Generated!',
        message: `Created ${createdCards.length} revision cards.`,
      });

      setIsGenModalOpen(false);
      setFlashcards(prev => [...createdCards, ...prev]);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Flashcard generation error', message: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  const handleToggleKnown = async (isKnown: boolean) => {
    if (!currentCard) return;

    try {
      const status = isKnown ? 'MASTERED' : 'NEED_REVIEW';

      await api.updateFlashcardMastery(currentCard.id, status);

      setFlashcards(prev =>
        prev.map(card =>
          card.id === currentCard.id
            ? { ...card, isKnown, status }
            : card
        )
      );
      addToast({
        type: 'info',
        title: isKnown ? 'Marked as Known' : 'Marked as Needs Review',
      });
      // Advance to next
      if (currentIndex < flashcards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const knownCount = flashcards.filter(c => c.isKnown).length;
  const progressPercent =
    flashcards.length > 0 ? Math.round((knownCount / flashcards.length) * 100) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            AI Flashcards & Spaced Revision
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active recall flashcards generated from syllabus topics and exam concepts.
          </p>
        </div>

        <button
          onClick={() => setIsGenModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </button>
      </div>

      {/* Progress & Deck Stats */}
      {flashcards.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400">Total Cards:</span>{' '}
              <span className="font-bold text-slate-900 tabular-nums">{flashcards.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Mastered:</span>{' '}
              <span className="font-bold text-emerald-600 tabular-nums">{knownCount}</span>
            </div>
            <div>
              <span className="text-slate-400">Needs Review:</span>{' '}
              <span className="font-bold text-amber-600 tabular-nums">
                {flashcards.length - knownCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 tabular-nums">{progressPercent}%</span>
          </div>
        </div>
      )}

      {/* Flashcard Studio Arena */}
      {isLoading ? (
        <div className="h-72 bg-white rounded-2xl border border-slate-200 animate-pulse" />
      ) : flashcards.length === 0 ? (
        <EmptyState
          title="No flashcards generated yet"
          description="Let AI extract high-yield concepts and definitions from your syllabus."
          actionText="Generate Flashcards"
          onAction={() => setIsGenModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Main 3D Flippable Card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`cursor-pointer rounded-2xl border p-8 sm:p-12 min-h-[300px] flex flex-col justify-between transition-all duration-300 shadow-md ${isFlipped
              ? 'bg-slate-900 text-white border-slate-800'
              : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-400'
              }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span
                className={`font-bold uppercase tracking-wider ${isFlipped ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
              >
                {currentCard.subject} · {currentCard.topic}
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${isFlipped ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                {isFlipped ? 'Answer / Explanation' : 'Question / Front'}
              </span>
            </div>

            <div className="my-auto text-center py-6">
              <p
                className={`text-base sm:text-xl font-bold leading-relaxed ${isFlipped ? 'text-slate-100' : 'text-slate-900'
                  }`}
              >
                {isFlipped ? currentCard.back : currentCard.front}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100/20">
              <span className={isFlipped ? 'text-slate-400' : 'text-slate-400'}>
                Difficulty: {currentCard.difficulty}
              </span>
              <div className="flex items-center gap-1.5 text-indigo-500 font-semibold text-[11px]">
                <RotateCw className="w-3.5 h-3.5" />
                <span>Click anywhere to flip</span>
              </div>
            </div>
          </div>

          {/* Controller Navigation Deck */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 font-medium tabular-nums px-2">
                Card {currentIndex + 1} of {flashcards.length}
              </span>
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                }}
                disabled={currentIndex === flashcards.length - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mastery rating buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggleKnown(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 inline-flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Needs Practice
              </button>
              <button
                onClick={() => handleToggleKnown(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                I Know This
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Flashcards Modal */}
      <Modal
        isOpen={isGenModalOpen}
        onClose={() => !isGenerating && setIsGenModalOpen(false)}
        title="Generate Flashcards with AI"
        subtitle="Extract key definitions, formulas, and proofs for quick memorization."
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Subject *
            </label>
            <select
              value={genForm.subject}
              onChange={e => setGenForm({ ...genForm, subject: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value="JAVA">Java</option>
              <option value="DBMS">Database Management Systems</option>
              <option value="OPERATING_SYSTEMS">Operating Systems</option>
              <option value="COMPUTER_NETWORKS">Computer Networks</option>
              <option value="DATA_STRUCTURES">Data Structures</option>
              <option value="ALGORITHMS">Design & Analysis of Algorithms</option>
              <option value="CYBER_SECURITY">Cyber Security</option>
              <option value="INTERNET_OF_THINGS">Internet of Things</option>
              <option value="SOFTWARE_ENGINEERING">Software Engineering</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Syllabus Topic *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. ACID Properties & Concurrency Control"
              value={genForm.topic}
              onChange={e => setGenForm({ ...genForm, topic: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Number of Flashcards
            </label>
            <select
              value={genForm.count}
              onChange={e => setGenForm({ ...genForm, count: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              <option value={4}>4 Cards</option>
              <option value={5}>5 Cards</option>
              <option value={10}>10 Cards</option>
              <option value={20}>20 Cards</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsGenModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Create Flashcards
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
