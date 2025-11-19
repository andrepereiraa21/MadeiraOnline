export interface Profile {
  id: string;
  nome: string;
  telefone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Anuncio {
  id: string;
  usuario_id: string;
  titulo: string;
  descricao: string;
  preco: number;
  categoria: string;
  tipo_produto?: string;
  status: 'ativo' | 'vendido' | 'inativo';
  fotos: string[];
  detalhes: Record<string, any>;
  moderacao_status: 'pendente' | 'aprovado' | 'rejeitado';
  moderacao_feedback?: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Conversa {
  id: string;
  anuncio_id: string;
  comprador_id: string;
  vendedor_id: string;
  ultima_mensagem?: string;
  ultima_mensagem_at?: string;
  created_at: string;
  anuncio?: Anuncio;
  comprador?: Profile;
  vendedor?: Profile;
}

export interface Mensagem {
  id: string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
  remetente?: Profile;
}

export type Categoria = 
  | 'veiculos'
  | 'imoveis'
  | 'eletronicos'
  | 'moveis'
  | 'moda'
  | 'esportes'
  | 'outros';

export interface DetalhesVeiculo {
  marca?: string;
  modelo?: string;
  ano?: number;
  quilometros?: number;
  combustivel?: 'gasolina' | 'diesel' | 'eletrico' | 'hibrido';
  transmissao?: 'manual' | 'automatica';
  cor?: string;
}

export interface DetalhesImovel {
  tipo?: 'casa' | 'apartamento' | 'terreno' | 'comercial';
  area?: number;
  quartos?: number;
  banheiros?: number;
  garagem?: number;
  localizacao?: string;
}
