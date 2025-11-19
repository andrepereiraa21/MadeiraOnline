"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Conversa, Mensagem } from "@/lib/types";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [novaMensagem, setNovaMensagem] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversa();
      fetchMensagens();
      
      // Subscrever a novas mensagens em tempo real
      const channel = supabase
        .channel(`conversa-${params.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mensagens',
            filter: `conversa_id=eq.${params.id}`
          },
          (payload) => {
            fetchMensagens();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
    } else {
      setUser(user);
    }
  };

  const fetchConversa = async () => {
    const { data, error } = await supabase
      .from('conversas')
      .select(`
        *,
        anuncio:anuncios(titulo, fotos, preco),
        comprador:profiles!conversas_comprador_id_fkey(nome, avatar_url),
        vendedor:profiles!conversas_vendedor_id_fkey(nome, avatar_url)
      `)
      .eq('id', params.id)
      .single();

    if (!error && data) {
      setConversa(data);
    }
  };

  const fetchMensagens = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mensagens')
      .select(`
        *,
        remetente:profiles(nome, avatar_url)
      `)
      .eq('conversa_id', params.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMensagens(data);
      
      // Marcar mensagens como lidas
      const mensagensNaoLidas = data.filter(
        (msg) => !msg.lida && msg.remetente_id !== user?.id
      );
      
      if (mensagensNaoLidas.length > 0) {
        await supabase
          .from('mensagens')
          .update({ lida: true })
          .in('id', mensagensNaoLidas.map(m => m.id));
      }
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user || !conversa) return;

    setSending(true);
    const mensagemTexto = novaMensagem.trim();
    setNovaMensagem("");

    try {
      // Inserir mensagem
      const { error: msgError } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversa.id,
          remetente_id: user.id,
          conteudo: mensagemTexto,
        });

      if (msgError) throw msgError;

      // Atualizar última mensagem da conversa
      await supabase
        .from('conversas')
        .update({
          ultima_mensagem: mensagemTexto,
          ultima_mensagem_at: new Date().toISOString(),
        })
        .eq('id', conversa.id);

      fetchMensagens();
    } catch (error: any) {
      alert('Erro ao enviar mensagem: ' + error.message);
      setNovaMensagem(mensagemTexto);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user || !conversa) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isComprador = conversa.comprador_id === user.id;
  const outraPessoa = isComprador ? conversa.vendedor : conversa.comprador;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/chat"
              className="text-gray-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>

            {/* Foto do anúncio */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
              {conversa.anuncio?.fotos?.[0] ? (
                <img
                  src={conversa.anuncio.fotos[0]}
                  alt={conversa.anuncio.titulo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  📦
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {outraPessoa?.nome || 'Usuário'}
              </p>
              <Link
                href={`/anuncio/${conversa.anuncio_id}`}
                className="text-sm text-emerald-600 hover:underline truncate block"
              >
                {conversa.anuncio?.titulo}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : mensagens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma mensagem ainda</p>
              <p className="text-sm text-gray-400 mt-2">
                Envie uma mensagem para iniciar a conversa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mensagens.map((mensagem) => {
                const isMinha = mensagem.remetente_id === user.id;
                return (
                  <div
                    key={mensagem.id}
                    className={`flex ${isMinha ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
                        isMinha
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                          : 'bg-white text-gray-900 shadow-md'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {mensagem.conteudo}
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          isMinha ? 'text-emerald-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(mensagem.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input de mensagem */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleEnviarMensagem} className="flex gap-3">
            <input
              type="text"
              value={novaMensagem}
              onChange={(e) => setNovaMensagem(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !novaMensagem.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
