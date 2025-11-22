"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Euro, 
  User, 
  Phone, 
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import type { Anuncio } from "@/lib/types";

interface Usuario {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export default function AnuncioDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null);
  const [vendedor, setVendedor] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [enviandoMensagem, setEnviandoMensagem] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(false);

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
    
    // Buscar anúncio
    const { data: anuncioData, error: anuncioError } = await supabase
      .from('anuncios')
      .select('*')
      .eq('id', params.id)
      .single();

    if (anuncioError || !anuncioData) {
      console.error('Erro ao carregar anúncio:', anuncioError);
      setLoading(false);
      return;
    }

    console.log('Anúncio carregado:', anuncioData);
    setAnuncio(anuncioData);

    // Buscar dados do vendedor da tabela users
    const { data: vendedorData, error: vendedorError } = await supabase
      .from('users')
      .select('*')
      .eq('id', anuncioData.usuario_id)
      .single();

    console.log('Vendedor da tabela users:', vendedorData, 'Erro:', vendedorError);

    if (vendedorData) {
      setVendedor(vendedorData);
      console.log('Vendedor definido:', vendedorData);
    } else {
      console.error('Não foi possível carregar informações do vendedor');
    }

    setLoading(false);
  };

  const iniciarConversa = async () => {
    if (!user) {
      alert('Você precisa estar logado para enviar mensagens');
      return;
    }

    if (!vendedor || !anuncio) return;

    if (user.id === vendedor.id) {
      alert('Você não pode enviar mensagem para si mesmo');
      return;
    }

    setEnviandoMensagem(true);

    // Verificar se já existe uma conversa
    const { data: conversaExistente } = await supabase
      .from('conversas')
      .select('id')
      .eq('anuncio_id', anuncio.id)
      .eq('comprador_id', user.id)
      .eq('vendedor_id', vendedor.id)
      .single();

    if (conversaExistente) {
      // Redirecionar para a conversa existente
      router.push('/mensagens');
      return;
    }

    // Criar nova conversa
    const { data: novaConversa, error: conversaError } = await supabase
      .from('conversas')
      .insert({
        anuncio_id: anuncio.id,
        comprador_id: user.id,
        vendedor_id: vendedor.id
      })
      .select()
      .single();

    if (conversaError) {
      console.error('Erro ao criar conversa:', conversaError);
      alert('Erro ao iniciar conversa. Tente novamente.');
      setEnviandoMensagem(false);
      return;
    }

    // Enviar mensagem inicial
    const mensagemInicial = `Olá! Tenho interesse no anúncio: ${anuncio.titulo}`;
    
    await supabase
      .from('mensagens')
      .insert({
        conversa_id: novaConversa.id,
        remetente_id: user.id,
        conteudo: mensagemInicial
      });

    setEnviandoMensagem(false);
    router.push('/mensagens');
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

  const nextImage = () => {
    if (anuncio?.fotos && anuncio.fotos.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === anuncio.fotos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (anuncio?.fotos && anuncio.fotos.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? anuncio.fotos.length - 1 : prev - 1
      );
    }
  };

  const openFullscreen = () => {
    setFullscreenImage(true);
  };

  const closeFullscreen = () => {
    setFullscreenImage(false);
  };

  // Navegação com teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenImage) {
        if (e.key === 'ArrowLeft') prevImage();
        if (e.key === 'ArrowRight') nextImage();
        if (e.key === 'Escape') closeFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, anuncio]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!anuncio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Anúncio não encontrado
          </h2>
          <Link
            href="/"
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Voltar para página inicial
          </Link>
        </div>
      </div>
    );
  }

  const isProprioAnuncio = user && vendedor && user.id === vendedor.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com botão voltar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna principal - Imagens e Descrição */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria de Imagens */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {anuncio.fotos && anuncio.fotos.length > 0 ? (
                <div className="relative">
                  <div 
                    className="relative h-96 bg-white cursor-pointer group"
                    onClick={openFullscreen}
                  >
                    <img
                      src={anuncio.fotos[currentImageIndex]}
                      alt={anuncio.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    
                    {anuncio.fotos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevImage();
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextImage();
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                        
                        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {anuncio.fotos.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Thumbnails - MOVIDAS PARA BAIXO */}
                  {anuncio.fotos.length > 1 && (
                    <div className="flex gap-2 p-4 overflow-x-auto bg-gray-50">
                      {anuncio.fotos.map((foto, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            index === currentImageIndex
                              ? 'border-emerald-600 scale-105 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={foto}
                            alt={`${anuncio.titulo} - ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-6xl">📦</span>
                </div>
              )}
            </div>

            {/* Informações do Anúncio */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold capitalize mb-3">
                    {anuncio.categoria}
                  </span>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {anuncio.titulo}
                  </h1>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Publicado em {formatDate(anuncio.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
                <Euro className="w-8 h-8 text-emerald-600" />
                <span className="text-4xl font-bold text-emerald-600">
                  {formatPrice(anuncio.preco)}
                </span>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Descrição
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {anuncio.descricao}
                </p>
              </div>

              {/* Detalhes específicos por categoria */}
              {anuncio.detalhes && Object.keys(anuncio.detalhes).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Detalhes
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(anuncio.detalhes).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 rounded-lg p-3">
                        <span className="text-sm text-gray-500 capitalize block mb-1">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-900 font-medium">
                          {typeof value === 'number' ? value.toLocaleString() : value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {anuncio.localizacao && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium">{anuncio.localizacao}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Informações do Vendedor */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Informações do Vendedor
              </h2>

              {vendedor ? (
                <div className="space-y-4">
                  <Link
                    href={`/usuario/${vendedor.id}`}
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {vendedor.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{vendedor.name}</p>
                      <p className="text-sm text-gray-500">Ver perfil</p>
                    </div>
                  </Link>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm break-all">{vendedor.email}</span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                      <User className="w-4 h-4" />
                      <span>Membro desde {new Date(vendedor.created_at).getFullYear()}</span>
                    </div>
                  </div>

                  {!isProprioAnuncio && (
                    <div className="pt-4">
                      <button
                        onClick={iniciarConversa}
                        disabled={enviandoMensagem}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageCircle className="w-5 h-5" />
                        {enviandoMensagem ? 'Abrindo...' : 'Enviar Mensagem'}
                      </button>
                    </div>
                  )}

                  {isProprioAnuncio && (
                    <div className="pt-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <p className="text-blue-800 font-medium">
                          Este é o seu anúncio
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Você não pode enviar mensagem para si mesmo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 font-medium mb-2">
                    Carregando informações do vendedor...
                  </p>
                  <p className="text-sm text-gray-500">
                    Se o problema persistir, o vendedor pode não ter completado seu perfil.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Fullscreen para Imagens */}
      {fullscreenImage && anuncio?.fotos && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-10"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={anuncio.fotos[currentImageIndex]}
              alt={anuncio.titulo}
              className="max-w-full max-h-full object-contain"
            />

            {anuncio.fotos.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all"
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>

                {/* Thumbnails no fullscreen - ABAIXO DA FOTO */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-full px-4">
                  {anuncio.fotos.map((foto, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-emerald-500 scale-110'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={foto}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Contador de imagens - ACIMA DAS MINIATURAS */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                  {currentImageIndex + 1} / {anuncio.fotos.length}
                </div>
              </>
            )}
          </div>

          <div className="absolute top-4 left-4 text-white text-sm bg-black/50 px-3 py-2 rounded-full">
            Use as setas ← → para navegar | ESC para fechar
          </div>
        </div>
      )}
    </div>
  );
}
