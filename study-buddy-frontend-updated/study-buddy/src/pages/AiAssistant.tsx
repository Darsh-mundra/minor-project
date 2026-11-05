import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  Plus,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: number | string;
  title?: string;
  createdAt?: string;
}

type ApiRecord = Record<string, any>;

const getText = (value: any): string => {
  if (typeof value === 'string') return value;

  if (value && typeof value === 'object') {
    for (const key of [
      'answer',
      'assistantMessage',
      'content',
      'text',
      'response',
      'message',
    ]) {
      if (typeof value[key] === 'string') return value[key];

      if (
        value[key] &&
        typeof value[key] === 'object' &&
        key === 'assistantMessage'
      ) {
        const nested = getText(value[key]);
        if (nested) return nested;
      }
    }
  }

  return '';
};

const getTimestamp = (value?: string) => {
  if (!value) {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
};

const normalizeMessage = (item: ApiRecord, index: number): ChatMessage => {
  const role = String(
    item.sender ?? item.role ?? item.messageType ?? item.type ?? ''
  ).toLowerCase();

  const isUser =
    role === 'user' ||
    role === 'human' ||
    role === 'student' ||
    role === 'USER';

  return {
  id: String(item.id ?? item.messageId ?? `msg-${index}-${Date.now()}`),
  sender: isUser ? 'user' : 'assistant',
  text: getText(item) || '',
  timestamp: getTimestamp(
    item.createdAt ?? item.timestamp ?? item.sentAt
  ),
};
};

export const AiAssistant: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | string | null
  >(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(
    'Database Management Systems'
  );
  const [assistantMode, setAssistantMode] = useState<
    'explain' | 'revision_plan' | 'summarize'
  >('explain');

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const initialMessage: ChatMessage = {
    id: 'welcome-message',
    sender: 'assistant',
    text: `Hello ${user?.fullName?.split(' ')[0] || 'Scholar'}! I am your Study Buddy academic study mentor.

I can help you:
1. Break down complex algorithms and syllabus theorems step-by-step.
2. Formulate 5-day structured exam revision schedules.
3. Summarize lecture units into high-yield revision notes.
4. Prepare for viva-voce and interview questions.

What subject or concept are we diving into today?`,
    timestamp: getTimestamp(),
  };

  const loadConversations = useCallback(async () => {
    try {
      const result = await api.getStudyAssistantConversations();

const list: Conversation[] = Array.isArray(result)
  ? result
  : [];

      setConversations(list);

      if (list.length > 0) {
        setActiveConversationId((current) => {
          if (current != null && list.some((c) => String(c.id) === String(current))) {
            return current;
          }
          return list[0].id;
        });
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Conversation History Error',
        message: err.message || 'Could not load your conversations.',
      });
    }
  }, [addToast]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  
const loadMessages = useCallback(
  async (conversationId: number | string) => {
    setIsLoadingMessages(true);

    try {
      const result = await api.getStudyAssistantMessages(conversationId);

      const list = Array.isArray(result) ? result : [];

      setMessages(
        list
          .map(normalizeMessage)
          .filter((message) => message.text.trim().length > 0)
      );
    } catch (err: any) {
      console.error('[Study Assistant] Failed to load messages:', {
        message: err.message,
        status: err.status,
        response: err.data,
      });

      setMessages([]);

      addToast({
        type: 'error',
        title: 'Messages Error',
        message: err.message || 'Could not load this conversation.',
      });
    } finally {
      setIsLoadingMessages(false);
    }
  },
  [addToast]
);


  useEffect(() => {
    if (activeConversationId == null) {
      setMessages([]);
      return;
    }

    void loadMessages(activeConversationId);
  }, [activeConversationId, loadMessages]);

  const handleNewConversation = async () => {
    if (isLoading) return;

    try {
      const result = await api.createStudyAssistantConversation();
      const conversation = result;

      if (conversation?.id == null) {
        throw new Error('The server did not return a conversation ID.');
      }

      setConversations((previous) => [
        conversation,
        ...previous.filter(
          (item) => String(item.id) !== String(conversation.id)
        ),
      ]);

      setActiveConversationId(conversation.id);
      setMessages([]);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'New Chat Error',
        message: err.message || 'Could not create a new conversation.',
      });
    }
  };

  
const handleSendMessage = async (customPrompt?: string) => {
  const question = (customPrompt ?? inputQuestion).trim();

  if (!question || isLoading) return;

  setInputQuestion('');
  setIsLoading(true);

  const userMessage: ChatMessage = {
    id: `user-${Date.now()}`,
    sender: 'user',
    text: question,
    timestamp: getTimestamp(),
  };

  setMessages((previous) => [...previous, userMessage]);

  try {
    let conversationId = activeConversationId;

    // Create a conversation if none is selected.
    if (conversationId == null) {
      const created = await api.createStudyAssistantConversation();
      const conversation = created;

      if (conversation?.id == null) {
        throw new Error('Could not create a conversation.');
      }

      conversationId = conversation.id;

      setActiveConversationId(conversationId);

      setConversations((previous) => [
        conversation,
        ...previous.filter(
          (item) => String(item.id) !== String(conversation.id)
        ),
      ]);
    }

    // Pass the selected subject and study mode to Spring Boot.
    const modeInstruction = {
      explain: 'Explain the concept step by step with examples.',
      revision_plan: 'Create a practical 5-day exam revision plan.',
      summarize: 'Summarize the topic into clear, high-yield study notes.',
    }[assistantMode];

    const messageForBackend =
      `Subject: ${selectedSubject}\n` +
      `Study mode: ${assistantMode}\n` +
      `Instruction: ${modeInstruction}\n\n` +
      question;

    // Call Spring Boot only once.
    if (conversationId == null) {
  throw new Error('Could not create a conversation.');
}

const response = await api.sendStudyAssistantMessage(
  conversationId,
  messageForBackend
);

    const payload = response?.data ?? response;

    // Read the answer returned by the Spring Boot response DTO.
    const answer = payload?.content;

    if (typeof answer !== 'string' || !answer.trim()) {
      throw new Error('Spring Boot returned no answer.');
    }

    const assistantMessage: ChatMessage = {
      id: String(payload?.id ?? `assistant-${Date.now()}`),
      sender: 'assistant',
      text: answer,
      timestamp: getTimestamp(payload?.createdAt),
    };

    setMessages((previous) => [...previous, assistantMessage]);

    // Refresh conversation history once.
    void loadConversations();
  } catch (err: any) {
    addToast({
      type: 'error',
      title: 'AI Assistant Error',
      message: err.message || 'Could not fetch an academic answer.',
    });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Academic Mentor</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            AI Study Assistant
          </h1>

          <p className="text-xs text-slate-500 mt-0.5">
            Ask questions, revise for exams, and revisit saved conversations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
            {([
              ['explain', 'Explain Concept'],
              ['revision_plan', '5-Day Exam Plan'],
              ['summarize', 'Syllabus Summary'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setAssistantMode(mode)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  assistantMode === mode
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={handleNewConversation}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-4">
        {/* Conversation history */}
        <aside className="bg-white border border-slate-200 rounded-2xl p-3 h-fit">
          <div className="flex items-center justify-between px-2 py-2">
            <h2 className="text-xs font-bold text-slate-700">
              Your Conversations
            </h2>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>

          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-xs text-slate-400">
              No saved conversations yet. Ask your first question to get started.
            </p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setActiveConversationId(conversation.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                    String(activeConversationId) === String(conversation.id)
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-semibold truncate">
                    {conversation.title || `Conversation ${conversation.id}`}
                  </span>
                  <span className="block mt-1 text-[10px] opacity-60">
                    {conversation.createdAt
                      ? getTimestamp(conversation.createdAt)
                      : 'Saved conversation'}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => void loadConversations()}
            className="mt-3 w-full inline-flex justify-center items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Refresh history
          </button>
        </aside>

        {/* Chat */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px] min-w-0">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {isLoadingMessages ? (
              <div className="text-xs text-slate-500">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex gap-3 max-w-3xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-none text-xs sm:text-sm leading-relaxed bg-slate-50 border border-slate-200 text-slate-800 whitespace-pre-line">
                  {initialMessage.text}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    msg.sender === 'user'
                      ? 'ml-auto flex-row-reverse'
                      : 'mr-auto'
                  }`}
                >
                  {msg.sender === 'assistant' ? (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold">
                      {user?.fullName?.charAt(0) || 'Y'}
                    </div>
                  )}

                  <div
                    className={`min-w-0 p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-2 ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] opacity-70">
                      <span className="font-semibold">
                        {msg.sender === 'assistant' ? 'Study Buddy Mentor' : 'You'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className="whitespace-pre-line leading-relaxed font-sans">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  Study Buddy is preparing your answer...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
              {[
                'Explain normalization in DBMS with an example',
                'Create a 5-day Operating Systems revision plan',
                'Explain greedy algorithms step by step',
              ].map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => void handleSendMessage(prompt)}
                  disabled={isLoading || isLoadingMessages}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 rounded-lg whitespace-nowrap text-[11px] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <select
                value={selectedSubject}
                onChange={(event) => setSelectedSubject(event.target.value)}
                className="hidden sm:block max-w-36 px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              >
                <option value="Database Management Systems">DBMS</option>
                <option value="Operating Systems">OS</option>
                <option value="Algorithms">DAA</option>
                <option value="Computer Networks">CN</option>
                <option value="Compiler Design">Compiler</option>
                <option value="Distributed Systems">Dist. Systems</option>
              </select>

              <input
                type="text"
                placeholder="Ask an academic question or request a study plan..."
                value={inputQuestion}
                onChange={(event) => setInputQuestion(event.target.value)}
                disabled={isLoading || isLoadingMessages}
                className="flex-1 min-w-0 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={
                  isLoading ||
                  isLoadingMessages ||
                  !inputQuestion.trim()
                }
                className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};