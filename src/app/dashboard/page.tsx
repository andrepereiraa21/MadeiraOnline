"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Euro, 
  Eye,
  Edit,
  Trash2,
  Loader2,
  TrendingUp,
  ShoppingBag,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import type { Anuncio } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login");
      return;
    }
    
    setUser(user);
    fetchAnuncios(user.id);
  };

  const fetchAnuncios = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("anuncios")
      .select("*")
      .eq("usuario_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setAnuncios(data);
    }
    setLoading(false);
  };

  const handleStatusChange = async (anuncioId: string, novoStatus: 'ativo' | 'vendido' | 'inativo') => {
    const { error } = await supabase
      .from("anuncios")
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq("id", anuncioId);

    if (!error) {
      setAnuncios(anuncios.map(a => 
        a.id === anuncioId ? { ...a, status: novoStatus } : a
      ));
    }
  };

  const handleDelete = async (anuncioId: string) => {
    if (!confirm("Tem certeza que deseja excluir este anúncio?")) return;

    const { error } = await supabase
      .from("anuncios")
      .delete()
      .eq("id", anuncioId);

    if (!error) {
      setAnuncios(anuncios.filter(a => a.id !== anuncioId));
    }
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

  const anunciosFiltrados = anuncios.filter(a => {
    if (filtroStatus === "todos") return true;
    return a.status === filtroStatus;
  });

  const stats = {
    total: anuncios.length,
    ativos: anuncios.filter(a => a.status === "ativo").length,
    vendidos: anuncios.filter(a => a.status === "vendido").length,
    inativos: anuncios.filter(a => a.status === "inativo").length,
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: "bg-emerald-100 text-emerald-700 border-emerald-200",
      vendido: "bg-blue-100 text-blue-700 border-blue-200",
      inativo: "bg-gray-100 text-gray-700 border-gray-200",
    };
    return badges[status as keyof typeof badges] || badges.inativo;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      ativo: <CheckCircle className="w-4 h-4" />,
      vendido: <ShoppingBag className="w-4 h-4" />,
      inativo: <XCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons] || icons.inativo;
  };

  const getModeracaoStatusBadge = (status: string) => {
    const badges = {
      aprovado: "bg-green-100 text-green-700",
      pendente: "bg-yellow-100 text-yellow-700",
      rejeitado: "bg-red-100 text-red-700",
    };
    return badges[status as keyof typeof badges] || badges.pendente;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Meus Anúncios</h1>
          <p className="text-emerald-50">Gerencie todos os seus anúncios em um só lugar</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-gray-400" />
              <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
            </div>
            <p className="text-gray-600 font-medium">Total de Anúncios</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-emerald-500" />
              <span className="text-3xl font-bold text-emerald-600">{stats.ativos}</span>
            </div>
            <p className="text-gray-600 font-medium">Anúncios Ativos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-blue-500" />
              <span className="text-3xl font-bold text-blue-600">{stats.vendidos}</span>
            </div>
            <p className="text-gray-600 font-medium">Vendidos</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-gray-400" />
              <span className="text-3xl font-bold text-gray-600">{stats.inativos}</span>
            </div>
            <p className="text-gray-600 font-medium">Inativos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFiltroStatus("todos")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroStatus === "todos"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setFiltroStatus("ativo")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroStatus === "ativo"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Ativos ({stats.ativos})
              </button>
              <button
                onClick={() => setFiltroStatus("vendido")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroStatus === "vendido"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Vendidos ({stats.vendidos})
              </button>
              <button
                onClick={() => setFiltroStatus("inativo")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filtroStatus === "inativo"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Inativos ({stats.inativos})
              </button>
            </div>

            <Link
              href="/criar-anuncio"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 whitespace-nowrap"
            >
              + Novo Anúncio
            </Link>
          </div>
        </div>

        {/* Lista de Anúncios */}
        {anunciosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Nenhum anúncio encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              {filtroStatus === "todos" 
                ? "Você ainda não criou nenhum anúncio"
                : `Você não tem anúncios ${filtroStatus}s`}
            </p>
            {filtroStatus === "todos" && (
              <Link
                href="/criar-anuncio"
                className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300"
              >
                Criar Primeiro Anúncio
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {anunciosFiltrados.map((anuncio) => (
              <div
                key={anuncio.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Imagem */}
                  <div className="md:w-48 h-48 bg-gray-200 flex-shrink-0">
                    {anuncio.fotos && anuncio.fotos.length > 0 ? (
                      <img
                        src={anuncio.fotos[0]}
                        alt={anuncio.titulo}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {anuncio.titulo}
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(anuncio.status)}`}>
                                {getStatusIcon(anuncio.status)}
                                {anuncio.status.charAt(0).toUpperCase() + anuncio.status.slice(1)}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getModeracaoStatusBadge(anuncio.moderacao_status)}`}>
                                {anuncio.moderacao_status === "aprovado" && "✓ Aprovado"}
                                {anuncio.moderacao_status === "pendente" && "⏳ Pendente"}
                                {anuncio.moderacao_status === "rejeitado" && "✗ Rejeitado"}
                              </span>
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                                {anuncio.categoria}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {anuncio.descricao}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(anuncio.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Euro className="w-4 h-4" />
                            <span className="font-semibold text-emerald-600">
                              {formatPrice(anuncio.preco)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2 lg:min-w-[200px]">
                        {/* Alterar Status */}
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-semibold text-gray-600 uppercase">
                            Alterar Status
                          </label>
                          <select
                            value={anuncio.status}
                            onChange={(e) => handleStatusChange(anuncio.id, e.target.value as any)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="ativo">Ativo</option>
                            <option value="vendido">Vendido</option>
                            <option value="inativo">Inativo</option>
                          </select>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex gap-2">
                          <Link
                            href={`/anuncio/${anuncio.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </Link>
                          <button
                            onClick={() => handleDelete(anuncio.id)}
                            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
