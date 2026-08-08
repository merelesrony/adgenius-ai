export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          tokens_used: number | null
          type: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          tokens_used?: number | null
          type: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          tokens_used?: number | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_creatives: {
        Row: {
          id: string
          user_id: string
          campaign_id: string | null
          image_url: string
          prompt: string
          model: string
          format: string
          preset_id: string | null
          created_at: string
          product_id: string | null
          is_favorite: boolean
          category: string | null
          is_primary: boolean
          headline: string | null
          primary_text: string | null
          description: string | null
          cta: string | null
          variant: string | null
          variant_label: string | null
          creative_brief: Json | null
          creative_score: Json | null
          platform_format: string | null
          variant_type: string | null
          generation_model: string | null
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id?: string | null
          image_url: string
          prompt: string
          model?: string
          format?: string
          preset_id?: string | null
          created_at?: string
          product_id?: string | null
          is_favorite?: boolean
          category?: string | null
          is_primary?: boolean
          headline?: string | null
          primary_text?: string | null
          description?: string | null
          cta?: string | null
          variant?: string | null
          variant_label?: string | null
          creative_brief?: Json | null
          creative_score?: Json | null
          platform_format?: string | null
          variant_type?: string | null
          generation_model?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string | null
          image_url?: string
          prompt?: string
          model?: string
          format?: string
          preset_id?: string | null
          created_at?: string
          product_id?: string | null
          is_favorite?: boolean
          category?: string | null
          is_primary?: boolean
          headline?: string | null
          primary_text?: string | null
          description?: string | null
          cta?: string | null
          variant?: string | null
          variant_label?: string | null
          creative_brief?: Json | null
          creative_score?: Json | null
          platform_format?: string | null
          variant_type?: string | null
          generation_model?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_creatives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_creatives_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_optimizations: {
        Row: {
          id: string
          campaign_id: string
          user_id: string
          type: string
          priority: string
          problem: string
          recommendation: string
          before_value: string | null
          after_value: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          user_id: string
          type: string
          priority: string
          problem: string
          recommendation: string
          before_value?: string | null
          after_value?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          user_id?: string
          type?: string
          priority?: string
          problem?: string
          recommendation?: string
          before_value?: string | null
          after_value?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_optimizations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_optimizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_stats: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          reach: number | null
          spend: number | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          reach?: number | null
          spend?: number | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          reach?: number | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_stats_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ai_audience: Json | null
          ai_copy: Json | null
          ai_generated: boolean | null
          ai_recommendations: Json | null
          ai_score_breakdown: Json | null
          ai_strategy: Json | null
          audience_mode: Database["public"]["Enums"]["audience_mode"]
          brand_kit: Json | null
          campaign_score: number | null
          created_at: string
          currency: string | null
          daily_budget: number | null
          end_date: string | null
          error_message: string | null
          facebook_ad_id: string | null
          facebook_adset_id: string | null
          facebook_campaign_id: string | null
          flyer_url: string | null
          id: string
          last_sync: string | null
          meta_ad_id: string | null
          meta_adset_id: string | null
          meta_campaign_id: string | null
          name: string
          objective: string | null
          optimizer_run_at: string | null
          optimizer_score: number | null
          optimizer_strengths: Json | null
          optimizer_summary: string | null
          platforms: Json | null
          product_category: string | null
          product_currency: string | null
          product_description: string | null
          product_id: string | null
          product_name: string | null
          product_price: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          sync_status: string | null
          target_age_max: number | null
          target_age_min: number | null
          target_city: string | null
          target_country: string | null
          target_gender: Database["public"]["Enums"]["gender_target"]
          target_interests: Json | null
          target_languages: Json | null
          target_radius_km: number | null
          total_budget: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_audience?: Json | null
          ai_copy?: Json | null
          ai_generated?: boolean | null
          ai_recommendations?: Json | null
          ai_score_breakdown?: Json | null
          ai_strategy?: Json | null
          audience_mode?: Database["public"]["Enums"]["audience_mode"]
          brand_kit?: Json | null
          campaign_score?: number | null
          created_at?: string
          currency?: string | null
          daily_budget?: number | null
          end_date?: string | null
          error_message?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          flyer_url?: string | null
          id?: string
          last_sync?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          name: string
          objective?: string | null
          optimizer_run_at?: string | null
          optimizer_score?: number | null
          optimizer_strengths?: Json | null
          optimizer_summary?: string | null
          platforms?: Json | null
          product_category?: string | null
          product_currency?: string | null
          product_description?: string | null
          product_id?: string | null
          product_name?: string | null
          product_price?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          sync_status?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_city?: string | null
          target_country?: string | null
          target_gender?: Database["public"]["Enums"]["gender_target"]
          target_interests?: Json | null
          target_languages?: Json | null
          target_radius_km?: number | null
          total_budget?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_audience?: Json | null
          ai_copy?: Json | null
          ai_generated?: boolean | null
          ai_recommendations?: Json | null
          ai_score_breakdown?: Json | null
          ai_strategy?: Json | null
          audience_mode?: Database["public"]["Enums"]["audience_mode"]
          brand_kit?: Json | null
          campaign_score?: number | null
          created_at?: string
          currency?: string | null
          daily_budget?: number | null
          end_date?: string | null
          error_message?: string | null
          facebook_ad_id?: string | null
          facebook_adset_id?: string | null
          facebook_campaign_id?: string | null
          flyer_url?: string | null
          id?: string
          last_sync?: string | null
          meta_ad_id?: string | null
          meta_adset_id?: string | null
          meta_campaign_id?: string | null
          name?: string
          objective?: string | null
          optimizer_run_at?: string | null
          optimizer_score?: number | null
          optimizer_strengths?: Json | null
          optimizer_summary?: string | null
          platforms?: Json | null
          product_category?: string | null
          product_currency?: string | null
          product_description?: string | null
          product_id?: string | null
          product_name?: string | null
          product_price?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          sync_status?: string | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_city?: string | null
          target_country?: string | null
          target_gender?: Database["public"]["Enums"]["gender_target"]
          target_interests?: Json | null
          target_languages?: Json | null
          target_radius_km?: number | null
          total_budget?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_accounts: {
        Row: {
          access_token: string
          account_name: string | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          meta_ad_account_id: string
          meta_user_id: string
          page_id: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          meta_ad_account_id: string
          meta_user_id: string
          page_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          meta_ad_account_id?: string
          meta_user_id?: string
          page_id?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_strategies: {
        Row: {
          id: string
          user_id: string
          product_name: string
          product_description: string | null
          product_price: number | null
          product_currency: string
          product_category: string | null
          strategy_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_name: string
          product_description?: string | null
          product_price?: number | null
          product_currency?: string
          product_category?: string | null
          strategy_json: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_name?: string
          product_description?: string | null
          product_price?: number | null
          product_currency?: string
          product_category?: string | null
          strategy_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_strategies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          ai_generations_limit: number
          campaign_limit: number
          created_at: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          meta_accounts_limit: number
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          product_limit: number
        }
        Insert: {
          ai_generations_limit: number
          campaign_limit: number
          created_at?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          meta_accounts_limit: number
          name: Database["public"]["Enums"]["subscription_plan"]
          price_monthly: number
          product_limit: number
        }
        Update: {
          ai_generations_limit?: number
          campaign_limit?: number
          created_at?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          meta_accounts_limit?: number
          name?: Database["public"]["Enums"]["subscription_plan"]
          price_monthly?: number
          product_limit?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          analyzed_at: string | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          images: Json | null
          is_active: boolean
          master_visual_prompt: string | null
          name: string
          price: number | null
          updated_at: string
          user_id: string
          visual_dna: Json | null
        }
        Insert: {
          analyzed_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          master_visual_prompt?: string | null
          name: string
          price?: number | null
          updated_at?: string
          user_id: string
          visual_dna?: Json | null
        }
        Update: {
          analyzed_at?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          master_visual_prompt?: string | null
          name?: string
          price?: number | null
          updated_at?: string
          user_id?: string
          visual_dna?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          currency: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          price_paid: number | null
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          price_paid?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          price_paid?: number | null
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_connections: {
        Row: {
          id: string
          user_id: string
          meta_user_id: string
          meta_user_name: string | null
          access_token_enc: string
          token_type: string
          expires_at: string | null
          scopes: string[]
          selected_ad_account_id: string | null
          selected_ad_account_name: string | null
          selected_page_id: string | null
          selected_page_name: string | null
          selected_instagram_id: string | null
          business_portfolio: Json | null
          ad_accounts: Json
          pages: Json
          instagram_accounts: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meta_user_id: string
          meta_user_name?: string | null
          access_token_enc: string
          token_type?: string
          expires_at?: string | null
          scopes?: string[]
          selected_ad_account_id?: string | null
          selected_ad_account_name?: string | null
          selected_page_id?: string | null
          selected_page_name?: string | null
          selected_instagram_id?: string | null
          business_portfolio?: Json | null
          ad_accounts?: Json
          pages?: Json
          instagram_accounts?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meta_user_id?: string
          meta_user_name?: string | null
          access_token_enc?: string
          token_type?: string
          expires_at?: string | null
          scopes?: string[]
          selected_ad_account_id?: string | null
          selected_ad_account_name?: string | null
          selected_page_id?: string | null
          selected_page_name?: string | null
          selected_instagram_id?: string | null
          business_portfolio?: Json | null
          ad_accounts?: Json
          pages?: Json
          instagram_accounts?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      check_campaign_limit: { Args: { p_user_id: string }; Returns: boolean }
      get_campaign_stats: {
        Args: { p_user_id: string }
        Returns: {
          active_count: number
          avg_score: number
          draft_count: number
          ready_count: number
        }[]
      }
      is_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      audience_mode: "manual" | "ai"
      campaign_status:
        | "draft"
        | "pending"
        | "active"
        | "paused"
        | "completed"
        | "failed"
      gender_target: "all" | "male" | "female"
      subscription_plan: "starter" | "professional" | "agency"
      subscription_status: "active" | "inactive" | "trial" | "cancelled"
      user_role: "admin" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      audience_mode: ["manual", "ai"],
      campaign_status: [
        "draft",
        "pending",
        "active",
        "paused",
        "completed",
        "failed",
      ],
      gender_target: ["all", "male", "female"],
      subscription_plan: ["starter", "professional", "agency"],
      subscription_status: ["active", "inactive", "trial", "cancelled"],
      user_role: ["admin", "client"],
    },
  },
} as const
