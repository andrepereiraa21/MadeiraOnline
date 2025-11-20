import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types para o banco de dados
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nome: string | null
          telefone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          nome?: string | null
          telefone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          nome?: string | null
          telefone?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      anuncios: {
        Row: {
          id: string
          usuario_id: string
          titulo: string
          descricao: string
          preco: number
          categoria: string
          fotos: string[]
          detalhes: Record<string, any>
          status: 'ativo' | 'vendido' | 'inativo'
          moderacao_status: 'pendente' | 'aprovado' | 'rejeitado'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          titulo: string
          descricao: string
          preco: number
          categoria: string
          fotos?: string[]
          detalhes?: Record<string, any>
          status?: 'ativo' | 'vendido' | 'inativo'
          moderacao_status?: 'pendente' | 'aprovado' | 'rejeitado'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          titulo?: string
          descricao?: string
          preco?: number
          categoria?: string
          fotos?: string[]
          detalhes?: Record<string, any>
          status?: 'ativo' | 'vendido' | 'inativo'
          moderacao_status?: 'pendente' | 'aprovado' | 'rejeitado'
          created_at?: string
          updated_at?: string
        }
      }
      conversas: {
        Row: {
          id: string
          anuncio_id: string
          comprador_id: string
          vendedor_id: string
          created_at: string
        }
        Insert: {
          id?: string
          anuncio_id: string
          comprador_id: string
          vendedor_id: string
          created_at?: string
        }
        Update: {
          id?: string
          anuncio_id?: string
          comprador_id?: string
          vendedor_id?: string
          created_at?: string
        }
      }
      mensagens: {
        Row: {
          id: string
          conversa_id: string
          remetente_id: string
          conteudo: string
          lida: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversa_id: string
          remetente_id: string
          conteudo: string
          lida?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversa_id?: string
          remetente_id?: string
          conteudo?: string
          lida?: boolean
          created_at?: string
        }
      }
    }
  }
}
