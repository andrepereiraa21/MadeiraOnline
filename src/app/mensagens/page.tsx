"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft, User, MessageCircle } from "lucide-react";

interface Conversa {
  id: string;
  anuncio_id: string;
  comprador_id: string;
  vendedor_id: string;
  created_at: string;
  anuncio?: {
    titulo: string;
    fotos: string[];
  };
  outro_usuario?: {
    id: string;
    nome: string;
    email: string;
  };
  ultima_mensagem?: string;
  mensagens_nao_lidas?: number;
}

interface Mensagem {
  id: string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
}

export default function MensagensPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversas();
    }
  }, [user]);

  useEffect(() => {
    if (conversaSelecionada) {
      fetchMensagens(conversaSelecionada.id);
      marcarComoLidas(conversaSelecionada.id);
    }
  }, [conversaSelecionada]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUser(user);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversas = async () => {
    setLoading(true);
    
    const { data: conversasData, error } = await supabase
      .from('conversas')
      .select('*')
      .or(`comprador_id.eq.${user.id},vendedor_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar conversas:', error);
      setLoading(false);
      return;
    }

    // Buscar informações adicionais para cada conversa
    const conversasComDetalhes = await Promise.all(
      (conversasData || []).map(async (conversa) => {
        // Buscar anúncio
        const { data: anuncio } = await supabase
          .from('anuncios')
          .select('titulo, fotos')
          .eq('id', conversa.anuncio_id)
          .single();

        // Buscar outro usuário
        const outroUsuarioId = conversa.comprador_id === user.id 
          ? conversa.vendedor_id 
          : conversa.comprador_id;

        const { data: outroUsuario } = await supabase
          .from('usuarios')
          .select('id, nome, email')
          .eq('id', outroUsuarioId)
          .single();

        // Buscar última mensagem
        const { data: ultimaMensagem } = await supabase
          .from('mensagens')
          .select('conteudo')
          .eq('conversa_id', conversa.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Contar mensagens não lidas
        const { count } = await supabase
          .from('mensagens')
          .select('*', { count: 'exact', head: true })
          .eq('conversa_id', conversa.id)
          .eq('lida', false)
          .neq('remetente_id', user.id);

        return {
          ...conversa,
          anuncio,
          outro_usuario: outroUsuario,
          ultima_mensagem: ultimaMensagem?.conteudo,
          mensagens_nao_lidas: count || 0
        };
      })
    );

    setConversas(conversasComDetalhes);
    setLoading(false);
  };

  const fetchMensagens = async (conversaId: string) => {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversaId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar mensagens:', error);
      return;
    }

    setMensagens(data || []);
  };

  const marcarComoLidas = async (conversaId: string) => {
    await supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('conversa_id', conversaId)
      .neq('remetente_id', user.id);
  };

  const enviarMensagem = async () => {
    if (!novaMensagem.trim() || !conversaSelecionada) return;

    const { error } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversaSelecionada.id,
        remetente_id: user.id,
        conteudo: novaMensagem.trim()
      });

    if (error) {
      console.error('Erro ao enviar mensagem:', error);
      return;
    }

    setNovaMensagem("");
    fetchMensagens(conversaSelecionada.id);
    fetchConversas();
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return messageDate.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 8rem)' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Lista de Conversas */}
            <div className="md:col-span-1 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-500 to-teal-600">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Mensagens
                </h1>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversas.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Nenhuma conversa ainda</p>
                    <p className="text-sm mt-2">
                      Entre em contato com vendedores através dos anúncios
                    </p>
                  </div>
                ) : (
                  conversas.map((conversa) => (
                    <button
                      key={conversa.id}
                      onClick={() => setConversaSelecionada(conversa)}
                      className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
                        conversaSelecionada?.id === conversa.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conversa.outro_usuario?.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900 truncate">
                              {conversa.outro_usuario?.nome}
                            </p>
                            {conversa.mensagens_nao_lidas! > 0 && (
                              <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {conversa.mensagens_nao_lidas}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate mb-1">
                            {conversa.anuncio?.titulo}
                          </p>
                          {conversa.ultima_mensagem && (
                            <p className="text-xs text-gray-500 truncate">
                              {conversa.ultima_mensagem}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="md:col-span-2 flex flex-col">
              {conversaSelecionada ? (
                <>
                  {/* Header da Conversa */}
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold">
                        {conversaSelecionada.outro_usuario?.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {conversaSelecionada.outro_usuario?.nome}
                        </p>
                        <p className="text-sm text-gray-600">
                          {conversaSelecionada.anuncio?.titulo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {mensagens.map((mensagem, index) => {
                      const isMyMessage = mensagem.remetente_id === user.id;
                      const showDate = index === 0 || 
                        formatDate(mensagens[index - 1].created_at) !== formatDate(mensagem.created_at);

                      return (
                        <div key={mensagem.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                {formatDate(mensagem.created_at)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                isMyMessage
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              <p className="break-words">{mensagem.conteudo}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isMyMessage ? 'text-emerald-100' : 'text-gray-500'
                                }`}
                              >
                                {formatTime(mensagem.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input de Mensagem */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        enviarMensagem();
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={!novaMensagem.trim()}
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Enviar
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Selecione uma conversa</p>
                    <p className="text-sm mt-2">
                      Escolha uma conversa para começar a trocar mensagens
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
