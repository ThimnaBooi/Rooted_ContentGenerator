'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Send, Loader2, MessageCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PageHeader } from '@/components/app/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { askArchiveAssistant } from '@/lib/ai-queries';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  references?: { type: string; id: string; title: string; href: string }[];
};

const exampleQueries = [
  'Show every story about my father',
  'Which recipes came from my grandmother?',
  'What traditions happen every Christmas?',
  'Which people appear most often in our memories?',
  'Show all memories from Cape Town',
  'Find every memory involving fishing',
  'What events happened during 1998?',
  'Which stories mention our first family home?',
];

const typeIcons: Record<string, string> = {
  person: 'Users', memory: 'BookOpen', recipe: 'UtensilsCrossed', tradition: 'Landmark',
  event: 'CalendarClock', place: 'MapPin', document: 'FileText', photo: 'Camera', voice: 'Mic',
};

export default function AIAssistantPage() {
  const { session, isGuest } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleAsk(query?: string) {
    const q = query ?? input;
    if (!q.trim() || loading || isGuest) return;
    setInput('');
    const userMsg: Message = { role: 'user', content: q };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    try {
      const result = await askArchiveAssistant(
        q,
        supabaseUrl,
        supabaseAnonKey,
        session?.access_token
      );
      if ('error' in result) {
        setMessages((m) => [...m, { role: 'assistant', content: result.error }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: result.answer, references: result.references }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (isGuest) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon={Sparkles}
          title="Intelligent Archive Assistant"
          description="Ask questions about your family archive in natural language. The AI answers using only the information stored in your archive."
        />
        <Card className="border-border/70 bg-card shadow-soft">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Sign in to start asking questions about your archive.</p>
            <Button className="mt-4" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Intelligent Archive Assistant"
        description="Ask questions about your family archive in natural language. The AI answers using only the information stored in your archive — every answer includes references back to the original items."
      />

      {messages.length === 0 && (
        <Card className="border-accent/20 bg-accent/5 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-4 w-4 text-accent-foreground" />
              <h3 className="font-serif text-sm font-semibold">Try asking:</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {exampleQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => handleAsk(q)}
                  className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-left text-sm transition-colors hover:bg-secondary/60"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0 text-primary" />
                  {q}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 bg-card shadow-soft">
        <CardContent className="p-0">
          <div ref={scrollRef} className="max-h-[500px] min-h-[300px] overflow-y-auto p-6 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/60 text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                  {msg.references && msg.references.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-border/30 pt-3">
                      <p className="text-xs font-semibold opacity-70">References:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.references.slice(0, 10).map((ref, j) => (
                          <Link
                            key={j}
                            href={ref.href}
                            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
                          >
                            {ref.title}
                            <ArrowRight className="h-2.5 w-2.5" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary/60 p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your archive..."
                className="min-h-[44px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                rows={1}
              />
              <Button
                onClick={() => handleAsk()}
                disabled={loading || !input.trim()}
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              The assistant only uses information from your archive. It never invents people, memories, or events.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
