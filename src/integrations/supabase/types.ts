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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      creators: {
        Row: {
          added_by_user_id: string | null
          avatar_url: string | null
          bio: string | null
          category: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          is_premium: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          merged_into_id: string | null
          name: string
          rating: number | null
          review_count: number | null
          slug: string
          status: Database["public"]["Enums"]["creator_status"] | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          added_by_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          merged_into_id?: string | null
          name: string
          rating?: number | null
          review_count?: number | null
          slug: string
          status?: Database["public"]["Enums"]["creator_status"] | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          added_by_user_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          category?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          is_premium?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          merged_into_id?: string | null
          name?: string
          rating?: number | null
          review_count?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["creator_status"] | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_merged_into_id_fkey"
            columns: ["merged_into_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          reference_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          reference_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      platform_links: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          is_reachable: boolean | null
          is_verified: boolean | null
          last_checked_at: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          url: string
          username: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          is_reachable?: boolean | null
          is_verified?: boolean | null
          last_checked_at?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          url: string
          username: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          is_reachable?: boolean | null
          is_verified?: boolean | null
          last_checked_at?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          url?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_links_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          available_balance: number | null
          avatar_url: string | null
          created_at: string
          id: string
          is_banned: boolean | null
          pending_balance: number | null
          preferred_language: string | null
          risk_score: number | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          available_balance?: number | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_banned?: boolean | null
          pending_balance?: number | null
          preferred_language?: string | null
          risk_score?: number | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          available_balance?: number | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_banned?: boolean | null
          pending_balance?: number | null
          preferred_language?: string | null
          risk_score?: number | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          cons: string[] | null
          content: string
          created_at: string
          creator_id: string
          helpful_count: number | null
          id: string
          language: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          pros: string[] | null
          rating: number
          status: Database["public"]["Enums"]["review_status"] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cons?: string[] | null
          content: string
          created_at?: string
          creator_id: string
          helpful_count?: number | null
          id?: string
          language?: string | null
          platform: Database["public"]["Enums"]["platform_type"]
          pros?: string[] | null
          rating: number
          status?: Database["public"]["Enums"]["review_status"] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cons?: string[] | null
          content?: string
          created_at?: string
          creator_id?: string
          helpful_count?: number | null
          id?: string
          language?: string | null
          platform?: Database["public"]["Enums"]["platform_type"]
          pros?: string[] | null
          rating?: number
          status?: Database["public"]["Enums"]["review_status"] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          processed_at: string | null
          reference_id: string | null
          reference_type: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          processed_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_payout: {
        Args: {
          p_amount: number
          p_payment_details: Json
          p_payment_method: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      creator_status: "active" | "merged" | "pending" | "rejected"
      platform_type: "onlyfans" | "fansly" | "tipmeon" | "loyalfans"
      review_status: "pending" | "approved" | "rejected"
      transaction_status: "pending" | "approved" | "rejected" | "paid"
      transaction_type:
        | "creator_bonus"
        | "review_reward"
        | "payout"
        | "adjustment"
        | "correction"
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
      app_role: ["admin", "moderator", "user"],
      creator_status: ["active", "merged", "pending", "rejected"],
      platform_type: ["onlyfans", "fansly", "tipmeon", "loyalfans"],
      review_status: ["pending", "approved", "rejected"],
      transaction_status: ["pending", "approved", "rejected", "paid"],
      transaction_type: [
        "creator_bonus",
        "review_reward",
        "payout",
        "adjustment",
        "correction",
      ],
    },
  },
} as const
