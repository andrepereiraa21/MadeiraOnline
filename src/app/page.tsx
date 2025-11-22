"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search, Plus, MapPin, Clock, Euro, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Anuncio } from "@/lib/types";

export default function HomePage() {
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [user, setUser] = useState<any>(null);
  const [hoveredAnuncio, setHoveredAnuncio] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    checkUser();
    fetchAnuncios();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchAnuncios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('anuncios')
      .select('*')
      .eq('status', 'ativo')
      .order('created_at', { ascending: false });

    if (!error && data) {
      console.log('Anúncios carregados:', data);
      setAnuncios(data);
    } else {
      console.error('Erro ao carregar anúncios:', error);
    }
    setLoading(false);
  };

  const filteredAnuncios = anuncios.filter((anuncio) => {
    const matchSearch = anuncio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       anuncio.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = !categoriaFiltro || anuncio.categoria === categoriaFiltro;
    return matchSearch && matchCategoria;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrevImage = (e: React.MouseEvent, anuncioId: string, totalFotos: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [anuncioId]: ((prev[anuncioId] || 0) - 1 + totalFotos) % totalFotos
    }));
  };

  const handleNextImage = (e: React.MouseEvent, anuncioId: string, totalFotos: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => ({
      ...prev,
      [anuncioId]: ((prev[anuncioId] || 0) + 1) % totalFotos
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Encontre o que procura
          </h1>
          <p className="text-xl text-emerald-50 mb-8">
            Milhares de anúncios de veículos, imóveis e muito mais
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-2 flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center px-4 py-2">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="O que você está procurando?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-4 py-3 rounded-xl border-0 outline-none text-gray-800 bg-gray-50 md:w-48"
            >
              <option value="">Todas Categorias</option>
              <option value="veiculos">Veículos</option>
              <option value="imoveis">Imóveis</option>
              <option value="eletronicos">Eletrônicos</option>
              <option value="moveis">Móveis</option>
              <option value="moda">Moda</option>
              <option value="esportes">Esportes</option>
              <option value="outros">Outros</option>
            </select>
            <button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300">
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* CTA para criar anúncio */}
      {user && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/criar-anuncio"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Criar Anúncio
          </Link>
        </div>
      )}

      {/* Anúncios Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
        ) : filteredAnuncios.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
              Nenhum anúncio encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar seus filtros de busca
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnuncios.map((anuncio) => {
              const currentIndex = currentImageIndex[anuncio.id] || 0;
              const totalFotos = anuncio.fotos?.length || 0;
              const hasFotos = totalFotos > 0;

              return (
                <Link
                  key={anuncio.id}
                  href={`/anuncio/${anuncio.id}`}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                  onMouseEnter={() => setHoveredAnuncio(anuncio.id)}
                  onMouseLeave={() => setHoveredAnuncio(null)}
                >
                  {/* Imagem com Carrossel */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {hasFotos ? (
                      <>
                        <img
                          src={anuncio.fotos[currentIndex]}
                          alt={`${anuncio.titulo} - Foto ${currentIndex + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        
                        {/* Botões de navegação - aparecem no hover */}
                        {totalFotos > 1 && hoveredAnuncio === anuncio.id && (
                          <>
                            <button
                              onClick={(e) => handlePrevImage(e, anuncio.id, totalFotos)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                              aria-label="Foto anterior"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleNextImage(e, anuncio.id, totalFotos)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                              aria-label="Próxima foto"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {/* Indicador de fotos */}
                        {totalFotos > 1 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {anuncio.fotos.map((_, index) => (
                              <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                  index === currentIndex
                                    ? 'w-6 bg-white'
                                    : 'w-1.5 bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Contador de fotos */}
                        {totalFotos > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                            {currentIndex + 1}/{totalFotos}
                          </div>
                        )}
                      </>
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
                    {anuncio.categoria === 'veiculos' && anuncio.detalhes && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 flex-wrap">
                        {anuncio.detalhes.marca && (
                          <span className="font-medium">{anuncio.detalhes.marca}</span>
                        )}
                        {anuncio.detalhes.modelo && (
                          <>
                            <span>•</span>
                            <span>{anuncio.detalhes.modelo}</span>
                          </>
                        )}
                        {anuncio.detalhes.ano && (
                          <>
                            <span>•</span>
                            <span>{anuncio.detalhes.ano}</span>
                          </>
                        )}
                        {anuncio.detalhes.quilometros && (
                          <>
                            <span>•</span>
                            <span>{anuncio.detalhes.quilometros.toLocaleString()} km</span>
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
              );
            })}
          </div>
        )}
      </div>

      {/* CTA para login se não estiver autenticado */}
      {!user && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Quer vender algo?
            </h2>
            <p className="text-emerald-50 mb-6 text-lg">
              Crie sua conta gratuitamente e comece a anunciar hoje mesmo!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-300"
              >
                Criar Conta
              </Link>
              <Link
                href="/auth/login"
                className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition-all duration-300"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
