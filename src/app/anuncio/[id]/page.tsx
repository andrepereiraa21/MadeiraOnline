"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MessageCircle, Euro, MapPin, Calendar, User, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Anuncio } from "@/lib/types";

export default function AnuncioPage() {
  const params = useParams();
  const router = useRouter();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fotoAtual, setFotoAtual] = useState(0);

  useEffect(() => {
    checkUser();
    fetchAnuncio();
  }, [params.id]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchAnuncio = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('anuncios')
      .select(`
        *,
        profile:profiles(nome, telefone, avatar_url)
      `)
      .eq('id', params.id)
      .single();

    if (!error && data) {
      setAnuncio(data);
    }
    setLoading(false);
  };

  const handleContactar = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!anuncio) return;

    // Criar ou buscar conversa existente
    const { data: conversaExistente } = await supabase
      .from('conversas')
      .select('id')
      .eq('anuncio_id', anuncio.id)
      .eq('comprador_id', user.id)
      .eq('vendedor_id', anuncio.usuario_id)
      .single();

    if (conversaExistente) {
      router.push(`/chat/${conversaExistente.id}`);
    } else {
      const { data: novaConversa, error } = await supabase
        .from('conversas')
        .insert({
          anuncio_id: anuncio.id,
          comprador_id: user.id,
          vendedor_id: anuncio.usuario_id,
        })
        .select()
        .single();

      if (!error && novaConversa) {
        router.push(`/chat/${novaConversa.id}`);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!anuncio) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Anúncio não encontrado</h2>
          <Link href="/" className="text-emerald-600 hover:underline">
            Voltar para página inicial
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Botão Voltar */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Fotos e Detalhes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria de Fotos */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {anuncio.fotos && anuncio.fotos.length > 0 ? (
                <>
                  <div className="relative h-96 bg-gray-200">
                    <img
                      src={anuncio.fotos[fotoAtual]}
                      alt={anuncio.titulo}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {anuncio.fotos.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto">
                      {anuncio.fotos.map((foto, index) => (
                        <button
                          key={index}
                          onClick={() => setFotoAtual(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            fotoAtual === index
                              ? 'border-emerald-500 scale-105'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <img
                            src={foto}
                            alt={`Foto ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Detalhes do Anúncio */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <span className="inline-block bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    {anuncio.categoria}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {anuncio.titulo}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Publicado em {formatDate(anuncio.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <Euro className="w-8 h-8 text-emerald-600" />
                  <span className="text-4xl font-bold text-emerald-600">
                    {formatPrice(anuncio.preco)}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Descrição</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {anuncio.descricao}
                </p>
              </div>

              {/* Detalhes Específicos */}
              {anuncio.categoria === 'veiculos' && anuncio.detalhes && Object.keys(anuncio.detalhes).length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Características do Veículo</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {anuncio.detalhes.marca && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Marca</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.marca}</p>
                      </div>
                    )}
                    {anuncio.detalhes.modelo && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Modelo</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.modelo}</p>
                      </div>
                    )}
                    {anuncio.detalhes.ano && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Ano</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.ano}</p>
                      </div>
                    )}
                    {anuncio.detalhes.quilometros && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Quilômetros</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.quilometros.toLocaleString()} km</p>
                      </div>
                    )}
                    {anuncio.detalhes.combustivel && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Combustível</p>
                        <p className="font-semibold text-gray-900 capitalize">{anuncio.detalhes.combustivel}</p>
                      </div>
                    )}
                    {anuncio.detalhes.transmissao && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Transmissão</p>
                        <p className="font-semibold text-gray-900 capitalize">{anuncio.detalhes.transmissao}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {anuncio.categoria === 'imoveis' && anuncio.detalhes && Object.keys(anuncio.detalhes).length > 0 && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Características do Imóvel</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {anuncio.detalhes.tipo && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Tipo</p>
                        <p className="font-semibold text-gray-900 capitalize">{anuncio.detalhes.tipo}</p>
                      </div>
                    )}
                    {anuncio.detalhes.area && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Área</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.area} m²</p>
                      </div>
                    )}
                    {anuncio.detalhes.quartos && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Quartos</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.quartos}</p>
                      </div>
                    )}
                    {anuncio.detalhes.banheiros && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">Banheiros</p>
                        <p className="font-semibold text-gray-900">{anuncio.detalhes.banheiros}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Informações do Vendedor */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendedor</h3>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {anuncio.profile?.nome?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {anuncio.profile?.nome || 'Usuário'}
                  </p>
                  <p className="text-sm text-gray-500">Membro</p>
                </div>
              </div>

              {user?.id !== anuncio.usuario_id && (
                <button
                  onClick={handleContactar}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-5 h-5" />
                  Contactar Vendedor
                </button>
              )}

              {user?.id === anuncio.usuario_id && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-emerald-700 font-medium">
                    Este é o seu anúncio
                  </p>
                </div>
              )}

              {!user && (
                <div className="space-y-3">
                  <Link
                    href="/auth/login"
                    className="block w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 text-center shadow-lg hover:shadow-xl"
                  >
                    Fazer Login para Contactar
                  </Link>
                  <p className="text-xs text-gray-500 text-center">
                    Não tem conta?{' '}
                    <Link href="/auth/register" className="text-emerald-600 hover:underline">
                      Criar conta
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
