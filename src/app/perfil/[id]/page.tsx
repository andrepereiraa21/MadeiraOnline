"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MapPin, Clock, Euro, Mail, Phone, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import type { Anuncio } from "@/lib/types";

export default function PerfilPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkCurrentUser();
    fetchProfile();
    fetchAnuncios();
  }, [userId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const fetchAnuncios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("anuncios")
      .select("*")
      .eq("usuario_id", userId)
      .eq("status", "ativo")
      .eq("moderacao_status", "aprovado")
      .order("created_at", { ascending: false });

    if (data) {
      setAnuncios(data);
    }
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header do Perfil */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-5xl shadow-2xl">
              {profile.nome?.[0]?.toUpperCase() || "U"}
            </div>

            {/* Informações */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-2">{profile.nome || "Usuário"}</h1>
              <div className="flex flex-col md:flex-row gap-4 text-emerald-50">
                {profile.email && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
                {profile.telefone && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Phone className="w-4 h-4" />
                    <span>{profile.telefone}</span>
                  </div>
                )}
                {profile.created_at && (
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <Calendar className="w-4 h-4" />
                    <span>Membro desde {formatDate(profile.created_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold">{anuncios.length}</div>
              <div className="text-emerald-50 text-sm">Anúncios Ativos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Anúncios do Usuário */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          {isOwnProfile ? "Meus Anúncios" : "Anúncios"}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : anuncios.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              {isOwnProfile ? "Você ainda não tem anúncios" : "Este usuário não tem anúncios ativos"}
            </h3>
            {isOwnProfile && (
              <Link
                href="/criar-anuncio"
                className="inline-block mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
              >
                Criar Primeiro Anúncio
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {anuncios.map((anuncio) => (
              <Link
                key={anuncio.id}
                href={`/anuncio/${anuncio.id}`}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Imagem */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {anuncio.fotos && anuncio.fotos.length > 0 ? (
                    <img
                      src={anuncio.fotos[0]}
                      alt={anuncio.titulo}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
                    {anuncio.categoria}
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {anuncio.titulo}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <Euro className="w-5 h-5 text-emerald-600" />
                    <span className="text-2xl font-bold text-emerald-600">
                      {formatPrice(anuncio.preco)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {anuncio.descricao}
                  </p>

                  {/* Detalhes específicos */}
                  {anuncio.categoria === "veiculos" && anuncio.detalhes?.quilometros && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{anuncio.detalhes.quilometros.toLocaleString()} km</span>
                      {anuncio.detalhes.combustivel && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{anuncio.detalhes.combustivel}</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(anuncio.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
