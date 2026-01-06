import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    session: null,
    loading: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    async hasGeminiApiKey() {
      if (!this.user) return false
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('gemini_api_key_encrypted')
          .eq('user_id', this.user.id)
          .maybeSingle()
        
        if (error) throw error
        return !!(data && data.gemini_api_key_encrypted)
      } catch (error) {
        console.error('Error checking API key:', error)
        return false
      }
    },

    async saveGeminiApiKey(apiKey) {
      if (!this.user) throw new Error('Not authenticated')
      
      try {
        // Encrypt the API key using the user's ID as the encryption key
        const { data: encrypted, error: encryptError } = await supabase
          .rpc('encrypt_api_key', {
            api_key: apiKey,
            user_secret: this.user.id
          })
        
        if (encryptError) throw encryptError
        
        // Store encrypted key
        const { error } = await supabase
          .from('user_settings')
          .upsert({ 
            user_id: this.user.id,
            gemini_api_key_encrypted: encrypted,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
        
        if (error) throw error
      } catch (error) {
        console.error('Error saving API key:', error)
        throw error
      }
    },

    async deleteGeminiApiKey() {
      if (!this.user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('user_settings')
        .update({ 
          gemini_api_key_encrypted: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.user.id)
      
      if (error) throw error
    },

    async initialize() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        this.session = session
        this.user = session?.user || null

        supabase.auth.onAuthStateChange((_event, session) => {
          this.session = session
          this.user = session?.user || null
        })
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        this.loading = false
      }
    },

    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) throw error

      // Note: user_progress will be auto-created by database trigger
      // No need to manually insert here as RLS policies would block it
      
      return data
    },

    async signIn(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      return data
    },

    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      this.user = null
      this.session = null
    },

    async sendPasswordResetEmail(email) {
      try {
        // Get the redirect URL - use environment variable if available, otherwise use current origin
        const redirectUrl = import.meta.env.VITE_SITE_URL 
          ? `${import.meta.env.VITE_SITE_URL}/reset-password`
          : `${window.location.origin}/reset-password`
        
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl
        })
        
        if (error) {
          console.error('Supabase password reset error:', error)
          throw new Error(error.message || 'Failed to send password reset email')
        }
        
        return data
      } catch (error) {
        console.error('Password reset error:', error)
        throw error
      }
    },

    async updatePassword(newPassword) {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      
      if (error) throw error
    },

    async deleteAccount() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete user data first (cascading should handle related records)
      const { error: dataError } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', user.id)

      if (dataError) console.error('Error deleting user data:', dataError)

      // Delete the auth account using RPC function
      const { error } = await supabase.rpc('delete_user')
      
      if (error) throw error

      this.user = null
      this.session = null
    }
  }
})
