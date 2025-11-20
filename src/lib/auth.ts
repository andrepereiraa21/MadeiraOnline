import { supabase } from './supabase'

export async function signUp(email: string, password: string, fullName: string) {
  // 1. Criar usuário no Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  
  if (error) throw error
  
  // 2. Salvar dados na tabela usuarios
  if (data.user) {
    const { error: insertError } = await supabase
      .from('usuarios')
      .insert({
        id: data.user.id,
        nome: fullName,
        email: email,
        created_at: new Date().toISOString()
      })
    
    if (insertError) {
      console.error('Erro ao salvar usuário na tabela usuarios:', insertError)
    }
  }
  
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // Verificar se o usuário existe na tabela usuarios
  if (data.user) {
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('id', data.user.id)
      .single()
    
    // Se não existir, criar registro
    if (!usuarioData) {
      const fullName = data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Usuário'
      
      await supabase
        .from('usuarios')
        .insert({
          id: data.user.id,
          nome: fullName,
          email: data.user.email || '',
          created_at: new Date().toISOString()
        })
    }
  }
  
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}
