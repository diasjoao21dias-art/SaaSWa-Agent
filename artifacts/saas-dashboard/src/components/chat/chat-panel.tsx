/**
 * ChatPanel — slide-out panel showing message history for a conversation.
 * Allows sending messages as an agent. Polls every 5s for new messages.
 */
import { useState, useRef, useEffect } from 'react';
import { useMessages, useSendMessage } from '@/application/use-cases/use-messages';
import { useSocketMessages } from '@/application/use-cases/use-socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatPanelProps {
  conversationId: string;
  clientName: string;
  onClose: () => void;
}

export function ChatPanel({ conversationId, clientName, onClose }: ChatPanelProps) {
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId);
  // Real-time updates via WebSocket (no polling)
  useSocketMessages(conversationId);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;
    sendMessage({ content: input.trim() });
    setInput('');
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/30 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-card border-l border-border flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-border flex items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{clientName}</p>
            <p className="text-xs text-muted-foreground">Conversa #{conversationId.slice(0, 8)}</p>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="text-center text-sm text-muted-foreground py-8">Carregando mensagens…</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">Nenhuma mensagem ainda</div>
          ) : (
            messages.map((msg) => {
              const isAgent = msg.sender === 'agent' || msg.sender === 'bot';
              return (
                <div key={msg.id} className={cn('flex', isAgent ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[75%] rounded-lg px-3 py-2',
                    isAgent
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm',
                  )}>
                    {msg.sender === 'bot' && (
                      <span className="text-[10px] font-semibold opacity-70 block mb-0.5">🤖 Bot</span>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <span className={cn(
                      'text-[10px] mt-1 block',
                      isAgent ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}>
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="shrink-0 border-t border-border p-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem…"
            disabled={isPending}
            autoFocus
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
