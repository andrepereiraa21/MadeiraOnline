"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MessageCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Conversa } from "@/lib/types";

export default function ChatListPage() {
  const router = useRouter();
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
    } else {
      setUser(user);
      fetchConversas(user.id);
    }
  };

  const fetchConversas = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('conversas')
      .select(`
        *,
        anuncio:anuncios(titulo, fotos, preco),
        comprador:profiles!conversas_comprador_id_fkey(nome, avatar_url),
        vendedor:profiles!conversas_vendedor_id_fkey(nome, avatar_url)
      `)
      .or(`comprador_id.eq.${userId},vendedor_id.eq.${userId}`)
      .order('ultima_mensagem_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setConversas(data);
    }
    setLoading(false);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ontem';
    } else if (days < 7) {
      return `${days} dias atrás`;
    } else {
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <MessageCircle className="w-7 h-7" />
              Minhas Conversas
            </h1>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : conversas.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Nenhuma conversa ainda
              </h3>
              <p className="text-gray-600 mb-6">
                Entre em contato com vendedores para iniciar uma conversa
              </p>
              <Link
                href="/"
                className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
              >
                Ver Anúncios
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversas.map((conversa) => {
                const isComprador = conversa.comprador_id === user.id;
                const outraPessoa = isComprador ? conversa.vendedor : conversa.comprador;

                return (
                  <Link
                    key={conversa.id}
                    href={`/chat/${conversa.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {outraPessoa?.nome?.[0]?.toUpperCase() || 'U'}
                    </div>

                    {/* Foto do anúncio */}
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {outraPessoa?.nome || 'Usuário'}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatDate(conversa.ultima_mensagem_at || conversa.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {conversa.anuncio?.titulo}
                      </p>
                      {conversa.ultima_mensagem && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversa.ultima_mensagem}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
