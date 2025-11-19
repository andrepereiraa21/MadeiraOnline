"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Upload, X, Loader2 } from "lucide-react";
import type { Categoria, DetalhesVeiculo } from "@/lib/types";

export default function CriarAnuncioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    preco: "",
    categoria: "" as Categoria | "",
    tipo_produto: "",
  });

  const [detalhes, setDetalhes] = useState<any>({});
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotosFiles, setFotosFiles] = useState<File[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
    } else {
      setUser(user);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingImages(true);
    const newFotos: string[] = [];
    const newFiles: File[] = [];

    for (const file of files) {
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        newFotos.push(reader.result as string);
        newFiles.push(file);
        
        if (newFotos.length === files.length) {
          setFotos([...fotos, ...newFotos]);
          setFotosFiles([...fotosFiles, ...newFiles]);
          setUploadingImages(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setFotos(fotos.filter((_, i) => i !== index));
    setFotosFiles(fotosFiles.filter((_, i) => i !== index));
  };

  const uploadToSupabase = async (file: File, index: number): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('anuncios')
      .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from('anuncios')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const moderarConteudo = async (texto: string): Promise<{ aprovado: boolean; feedback?: string }> => {
    // Simulação de moderação por IA
    const palavrasProibidas = ['racista', 'ofensivo', 'golpe', 'fraude'];
    const textoLower = texto.toLowerCase();
    
    for (const palavra of palavrasProibidas) {
      if (textoLower.includes(palavra)) {
        return {
          aprovado: false,
          feedback: `Conteúdo rejeitado: contém linguagem inapropriada ("${palavra}").`
        };
      }
    }

    return { aprovado: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Moderar conteúdo
      const textoCompleto = `${formData.titulo} ${formData.descricao}`;
      const moderacao = await moderarConteudo(textoCompleto);

      // Upload das fotos
      const fotosUrls: string[] = [];
      for (let i = 0; i < fotosFiles.length; i++) {
        const url = await uploadToSupabase(fotosFiles[i], i);
        fotosUrls.push(url);
      }

      // Criar anúncio
      const { error } = await supabase
        .from('anuncios')
        .insert({
          usuario_id: user.id,
          titulo: formData.titulo,
          descricao: formData.descricao,
          preco: parseFloat(formData.preco),
          categoria: formData.categoria,
          tipo_produto: formData.tipo_produto,
          fotos: fotosUrls,
          detalhes: detalhes,
          moderacao_status: moderacao.aprovado ? 'aprovado' : 'rejeitado',
          moderacao_feedback: moderacao.feedback,
        });

      if (error) throw error;

      if (moderacao.aprovado) {
        alert('✅ Anúncio criado com sucesso!');
        router.push('/');
      } else {
        alert(`⚠️ ${moderacao.feedback}`);
        setLoading(false);
      }
    } catch (error: any) {
      alert('Erro ao criar anúncio: ' + error.message);
      setLoading(false);
    }
  };

  const renderDetalhesForm = () => {
    if (formData.categoria === 'veiculos') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Detalhes do Veículo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Marca"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, marca: e.target.value })}
            />
            <input
              type="text"
              placeholder="Modelo"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, modelo: e.target.value })}
            />
            <input
              type="number"
              placeholder="Ano"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, ano: parseInt(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Quilômetros"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, quilometros: parseInt(e.target.value) })}
            />
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, combustivel: e.target.value })}
            >
              <option value="">Combustível</option>
              <option value="gasolina">Gasolina</option>
              <option value="diesel">Diesel</option>
              <option value="eletrico">Elétrico</option>
              <option value="hibrido">Híbrido</option>
            </select>
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, transmissao: e.target.value })}
            >
              <option value="">Transmissão</option>
              <option value="manual">Manual</option>
              <option value="automatica">Automática</option>
            </select>
          </div>
        </div>
      );
    }

    if (formData.categoria === 'imoveis') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Detalhes do Imóvel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, tipo: e.target.value })}
            >
              <option value="">Tipo</option>
              <option value="casa">Casa</option>
              <option value="apartamento">Apartamento</option>
              <option value="terreno">Terreno</option>
              <option value="comercial">Comercial</option>
            </select>
            <input
              type="number"
              placeholder="Área (m²)"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, area: parseInt(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Quartos"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, quartos: parseInt(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Banheiros"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              onChange={(e) => setDetalhes({ ...detalhes, banheiros: parseInt(e.target.value) })}
            />
          </div>
        </div>
      );
    }

    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Criar Novo Anúncio
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título do Anúncio *
              </label>
              <input
                type="text"
                required
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Ex: iPhone 14 Pro Max 256GB"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as Categoria })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Selecione uma categoria</option>
                <option value="veiculos">Veículos</option>
                <option value="imoveis">Imóveis</option>
                <option value="eletronicos">Eletrônicos</option>
                <option value="moveis">Móveis</option>
                <option value="moda">Moda</option>
                <option value="esportes">Esportes</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            {/* Detalhes específicos por categoria */}
            {renderDetalhesForm()}

            {/* Preço */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço (€) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                required
                rows={6}
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Descreva seu produto em detalhes..."
              />
            </div>

            {/* Upload de Fotos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fotos do Produto
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploadingImages}
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  {uploadingImages ? (
                    <Loader2 className="w-12 h-12 mx-auto text-emerald-500 animate-spin" />
                  ) : (
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  )}
                  <p className="mt-2 text-sm text-gray-600">
                    Clique para adicionar fotos
                  </p>
                </label>
              </div>

              {/* Preview das fotos */}
              {fotos.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                  {fotos.map((foto, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={foto}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Submit */}
            <button
              type="submit"
              disabled={loading || uploadingImages}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando anúncio...
                </>
              ) : (
                'Publicar Anúncio'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
