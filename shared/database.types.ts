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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_target_id: string | null
          action_target_type: string | null
          action_type: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
        }
        Insert: {
          action_target_id?: string | null
          action_target_type?: string | null
          action_type: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Update: {
          action_target_id?: string | null
          action_target_type?: string | null
          action_type?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_permissions: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          display_name: string
          display_name_ar: string | null
          id: string
          is_active: boolean | null
          module: string
          permission_key: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          display_name: string
          display_name_ar?: string | null
          id?: string
          is_active?: boolean | null
          module: string
          permission_key: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          display_name?: string
          display_name_ar?: string | null
          id?: string
          is_active?: boolean | null
          module?: string
          permission_key?: string
        }
        Relationships: []
      }
      admin_role_permissions: {
        Row: {
          created_at: string | null
          id: string
          is_customizable: boolean | null
          permission_id: string
          role_type: Database["public"]["Enums"]["admin_role_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_customizable?: boolean | null
          permission_id: string
          role_type: Database["public"]["Enums"]["admin_role_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          is_customizable?: boolean | null
          permission_id?: string
          role_type?: Database["public"]["Enums"]["admin_role_type"]
        }
        Relationships: [
          {
            foreignKeyName: "admin_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "admin_permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_roles: {
        Row: {
          created_at: string | null
          description: string | null
          description_ar: string | null
          display_name: string
          display_name_ar: string | null
          hierarchy_level: number
          id: string
          is_active: boolean | null
          role_type: Database["public"]["Enums"]["admin_role_type"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          display_name: string
          display_name_ar?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          role_type: Database["public"]["Enums"]["admin_role_type"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          display_name?: string
          display_name_ar?: string | null
          hierarchy_level?: number
          id?: string
          is_active?: boolean | null
          role_type?: Database["public"]["Enums"]["admin_role_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          admin_role_type: Database["public"]["Enums"]["admin_role_type"]
          created_at: string | null
          created_by: string | null
          custom_permissions_added: string[] | null
          custom_permissions_removed: string[] | null
          deactivated_at: string | null
          deactivated_by: string | null
          deactivation_reason: string | null
          department: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_login_ip: string | null
          last_password_change: string | null
          login_count: number | null
          password_reset_required: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_role_type?: Database["public"]["Enums"]["admin_role_type"]
          created_at?: string | null
          created_by?: string | null
          custom_permissions_added?: string[] | null
          custom_permissions_removed?: string[] | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_password_change?: string | null
          login_count?: number | null
          password_reset_required?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_role_type?: Database["public"]["Enums"]["admin_role_type"]
          created_at?: string | null
          created_by?: string | null
          custom_permissions_added?: string[] | null
          custom_permissions_removed?: string[] | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          deactivation_reason?: string | null
          department?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          last_password_change?: string | null
          login_count?: number | null
          password_reset_required?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          actor_email: string | null
          actor_role: string | null
          attempt_id: string | null
          created_at: string
          description: string
          error_message: string | null
          event_details: Json | null
          event_timestamp: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          flagged_as_suspicious: boolean | null
          http_method: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          quiz_id: string | null
          request_url: string | null
          security_level: string | null
          session_id: string | null
          subject_id: string | null
          subject_type: string | null
          subject_user_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actor_email?: string | null
          actor_role?: string | null
          attempt_id?: string | null
          created_at?: string
          description: string
          error_message?: string | null
          event_details?: Json | null
          event_timestamp?: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          flagged_as_suspicious?: boolean | null
          http_method?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          quiz_id?: string | null
          request_url?: string | null
          security_level?: string | null
          session_id?: string | null
          subject_id?: string | null
          subject_type?: string | null
          subject_user_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actor_email?: string | null
          actor_role?: string | null
          attempt_id?: string | null
          created_at?: string
          description?: string
          error_message?: string | null
          event_details?: Json | null
          event_timestamp?: string
          event_type?: Database["public"]["Enums"]["audit_event_type"]
          flagged_as_suspicious?: boolean | null
          http_method?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          quiz_id?: string | null
          request_url?: string | null
          security_level?: string | null
          session_id?: string | null
          subject_id?: string | null
          subject_type?: string | null
          subject_user_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      bock_competencies: {
        Row: {
          code: string
          created_at: string
          description: string | null
          description_ar: string | null
          domain: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          domain: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          domain?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      certification_products: {
        Row: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          quiz_id: string | null
          updated_at: string
          voucher_validity_months: number
          vouchers_per_purchase: number
          woocommerce_product_id: number
          woocommerce_product_name: string
          woocommerce_product_sku: string | null
        }
        Insert: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          quiz_id?: string | null
          updated_at?: string
          voucher_validity_months?: number
          vouchers_per_purchase?: number
          woocommerce_product_id: number
          woocommerce_product_name: string
          woocommerce_product_sku?: string | null
        }
        Update: {
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          quiz_id?: string | null
          updated_at?: string
          voucher_validity_months?: number
          vouchers_per_purchase?: number
          woocommerce_product_id?: number
          woocommerce_product_name?: string
          woocommerce_product_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certification_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_products_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          consent_text: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          consent_version: string
          consented: boolean
          consented_at: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consent_text?: string | null
          consent_type: Database["public"]["Enums"]["consent_type"]
          consent_version: string
          consented?: boolean
          consented_at?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consent_text?: string | null
          consent_type?: Database["public"]["Enums"]["consent_type"]
          consent_version?: string
          consented?: boolean
          consented_at?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_flashcard_decks: {
        Row: {
          card_count: number | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          competency_id: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          estimated_study_time_minutes: number | null
          id: string
          is_published: boolean | null
          order_index: number
          section_type: string
          sub_unit_id: string | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          card_count?: number | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          competency_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_study_time_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          section_type: string
          sub_unit_id?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          card_count?: number | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          competency_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_study_time_minutes?: number | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          section_type?: string
          sub_unit_id?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_flashcard_decks_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcard_decks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcard_decks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcard_decks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcard_decks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcard_decks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcard_decks_sub_unit_id_fkey"
            columns: ["sub_unit_id"]
            isOneToOne: false
            referencedRelation: "curriculum_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_flashcards: {
        Row: {
          back_image_url: string | null
          back_text: string
          back_text_ar: string | null
          created_at: string | null
          created_by: string | null
          deck_id: string
          difficulty_level: string | null
          front_image_url: string | null
          front_text: string
          front_text_ar: string | null
          hint: string | null
          hint_ar: string | null
          id: string
          is_published: boolean | null
          order_index: number
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          back_image_url?: string | null
          back_text: string
          back_text_ar?: string | null
          created_at?: string | null
          created_by?: string | null
          deck_id: string
          difficulty_level?: string | null
          front_image_url?: string | null
          front_text: string
          front_text_ar?: string | null
          hint?: string | null
          hint_ar?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          back_image_url?: string | null
          back_text?: string
          back_text_ar?: string | null
          created_at?: string | null
          created_by?: string | null
          deck_id?: string
          difficulty_level?: string | null
          front_image_url?: string | null
          front_text?: string
          front_text_ar?: string | null
          hint?: string | null
          hint_ar?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_flashcards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "curriculum_flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_lessons: {
        Row: {
          content: Json
          content_ar: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          estimated_duration_hours: number | null
          id: string
          is_published: boolean
          learning_objectives: string[] | null
          learning_objectives_ar: string[] | null
          lesson_quiz_id: string | null
          module_id: string
          order_index: number
          quiz_passing_score: number
          quiz_required: boolean
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          content?: Json
          content_ar?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_published?: boolean
          learning_objectives?: string[] | null
          learning_objectives_ar?: string[] | null
          lesson_quiz_id?: string | null
          module_id: string
          order_index: number
          quiz_passing_score?: number
          quiz_required?: boolean
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json
          content_ar?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_duration_hours?: number | null
          id?: string
          is_published?: boolean
          learning_objectives?: string[] | null
          learning_objectives_ar?: string[] | null
          lesson_quiz_id?: string | null
          module_id?: string
          order_index?: number
          quiz_passing_score?: number
          quiz_required?: boolean
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_lesson_quiz_id_fkey"
            columns: ["lesson_quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_modules: {
        Row: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          competency_assessment_exam_id: string | null
          competency_name: string
          competency_name_ar: string | null
          content: Json
          content_ar: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          description_ar: string | null
          estimated_minutes: number | null
          icon: string | null
          id: string
          is_published: boolean
          learning_objectives: string[] | null
          learning_objectives_ar: string[] | null
          order_index: number
          prerequisite_module_id: string | null
          quiz_id: string | null
          quiz_passing_score: number
          quiz_required: boolean
          section_type: string
          updated_at: string
        }
        Insert: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          competency_assessment_exam_id?: string | null
          competency_name: string
          competency_name_ar?: string | null
          content?: Json
          content_ar?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          is_published?: boolean
          learning_objectives?: string[] | null
          learning_objectives_ar?: string[] | null
          order_index: number
          prerequisite_module_id?: string | null
          quiz_id?: string | null
          quiz_passing_score?: number
          quiz_required?: boolean
          section_type: string
          updated_at?: string
        }
        Update: {
          certification_type?: Database["public"]["Enums"]["certification_type"]
          competency_assessment_exam_id?: string | null
          competency_name?: string
          competency_name_ar?: string | null
          content?: Json
          content_ar?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          estimated_minutes?: number | null
          icon?: string | null
          id?: string
          is_published?: boolean
          learning_objectives?: string[] | null
          learning_objectives_ar?: string[] | null
          order_index?: number
          prerequisite_module_id?: string | null
          quiz_id?: string | null
          quiz_passing_score?: number
          quiz_required?: boolean
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_modules_competency_assessment_exam_id_fkey"
            columns: ["competency_assessment_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_prerequisite_module_id_fkey"
            columns: ["prerequisite_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_modules_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_practice_questions: {
        Row: {
          correct_option_id: string
          created_at: string | null
          created_by: string | null
          difficulty_level: string | null
          explanation: string | null
          explanation_ar: string | null
          id: string
          is_published: boolean | null
          options: Json
          order_index: number
          points: number | null
          question_set_id: string
          question_text: string
          question_text_ar: string | null
          question_type: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          correct_option_id: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: string | null
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          is_published?: boolean | null
          options?: Json
          order_index?: number
          points?: number | null
          question_set_id: string
          question_text: string
          question_text_ar?: string | null
          question_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          correct_option_id?: string
          created_at?: string | null
          created_by?: string | null
          difficulty_level?: string | null
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          is_published?: boolean | null
          options?: Json
          order_index?: number
          points?: number | null
          question_set_id?: string
          question_text?: string
          question_text_ar?: string | null
          question_type?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_practice_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_practice_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_practice_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_practice_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_practice_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_practice_questions_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "curriculum_question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_question_sets: {
        Row: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          competency_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          is_final_test: boolean | null
          is_published: boolean | null
          order_index: number
          passing_score: number | null
          question_count: number | null
          section_type: string
          sub_unit_id: string | null
          time_limit_minutes: number | null
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          competency_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_final_test?: boolean | null
          is_published?: boolean | null
          order_index?: number
          passing_score?: number | null
          question_count?: number | null
          section_type: string
          sub_unit_id?: string | null
          time_limit_minutes?: number | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          certification_type?: Database["public"]["Enums"]["certification_type"]
          competency_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          is_final_test?: boolean | null
          is_published?: boolean | null
          order_index?: number
          passing_score?: number | null
          question_count?: number | null
          section_type?: string
          sub_unit_id?: string | null
          time_limit_minutes?: number | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_question_sets_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_question_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_question_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_question_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_question_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_question_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curriculum_question_sets_sub_unit_id_fkey"
            columns: ["sub_unit_id"]
            isOneToOne: false
            referencedRelation: "curriculum_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_compliance_requirements: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number
          id: string
          is_active: boolean
          requirement_key: string
          title: string
          title_ar: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          requirement_key: string
          title: string
          title_ar?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          requirement_key?: string
          title?: string
          title_ar?: string | null
        }
        Relationships: []
      }
      ecp_license_documents: {
        Row: {
          description: string | null
          document_type: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_current: boolean
          license_id: string
          mime_type: string | null
          title: string
          uploaded_at: string
          uploaded_by: string | null
          version: string | null
        }
        Insert: {
          description?: string | null
          document_type: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_current?: boolean
          license_id: string
          mime_type?: string | null
          title: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Update: {
          description?: string | null
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_current?: boolean
          license_id?: string
          mime_type?: string | null
          title?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecp_license_documents_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "ecp_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_license_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          license_id: string
          partner_id: string
          request_type: string
          requested_programs:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          requested_territories: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          license_id: string
          partner_id: string
          request_type: string
          requested_programs?:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          requested_territories?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          license_id?: string
          partner_id?: string
          request_type?: string
          requested_programs?:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          requested_territories?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecp_license_requests_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "ecp_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_license_terms: {
        Row: {
          created_at: string
          description: string
          description_ar: string | null
          display_order: number
          id: string
          is_active: boolean
          term_key: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          description_ar?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          term_key: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          description_ar?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          term_key?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ecp_licenses: {
        Row: {
          agreement_document_url: string | null
          agreement_signed_date: string | null
          created_at: string
          created_by: string | null
          expiry_date: string
          id: string
          issue_date: string
          last_renewal_date: string | null
          license_number: string
          notes: string | null
          partner_code: string
          partner_id: string
          programs: Database["public"]["Enums"]["certification_type"][]
          renewal_requested: boolean
          renewal_requested_at: string | null
          status: string
          territories: string[]
          updated_at: string
        }
        Insert: {
          agreement_document_url?: string | null
          agreement_signed_date?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date: string
          id?: string
          issue_date?: string
          last_renewal_date?: string | null
          license_number: string
          notes?: string | null
          partner_code: string
          partner_id: string
          programs?: Database["public"]["Enums"]["certification_type"][]
          renewal_requested?: boolean
          renewal_requested_at?: string | null
          status?: string
          territories?: string[]
          updated_at?: string
        }
        Update: {
          agreement_document_url?: string | null
          agreement_signed_date?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string
          id?: string
          issue_date?: string
          last_renewal_date?: string | null
          license_number?: string
          notes?: string | null
          partner_code?: string
          partner_id?: string
          programs?: Database["public"]["Enums"]["certification_type"][]
          renewal_requested?: boolean
          renewal_requested_at?: string | null
          status?: string
          territories?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecp_licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_licenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_licenses_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_performance_metrics: {
        Row: {
          average_score: number | null
          batches_conducted: number | null
          calculated_at: string
          certifications_issued: number | null
          cp_certifications: number | null
          exams_passed: number | null
          exams_taken: number | null
          id: string
          nps_score: number | null
          partner_id: string
          pass_rate: number | null
          period_end: string
          period_start: string
          period_type: string
          scp_certifications: number | null
          trainee_satisfaction_score: number | null
          trainees_trained: number | null
          training_completion_rate: number | null
        }
        Insert: {
          average_score?: number | null
          batches_conducted?: number | null
          calculated_at?: string
          certifications_issued?: number | null
          cp_certifications?: number | null
          exams_passed?: number | null
          exams_taken?: number | null
          id?: string
          nps_score?: number | null
          partner_id: string
          pass_rate?: number | null
          period_end: string
          period_start: string
          period_type: string
          scp_certifications?: number | null
          trainee_satisfaction_score?: number | null
          trainees_trained?: number | null
          training_completion_rate?: number | null
        }
        Update: {
          average_score?: number | null
          batches_conducted?: number | null
          calculated_at?: string
          certifications_issued?: number | null
          cp_certifications?: number | null
          exams_passed?: number | null
          exams_taken?: number | null
          id?: string
          nps_score?: number | null
          partner_id?: string
          pass_rate?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          scp_certifications?: number | null
          trainee_satisfaction_score?: number | null
          trainees_trained?: number | null
          training_completion_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ecp_performance_metrics_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_toolkit_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ecp_trainees: {
        Row: {
          batch_id: string | null
          certificate_number: string | null
          certification_date: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          certified: boolean | null
          company_name: string | null
          created_at: string
          email: string
          enrollment_status: string
          exam_date: string | null
          exam_passed: boolean | null
          exam_scheduled: boolean | null
          exam_score: number | null
          exam_voucher_id: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          notes: string | null
          partner_id: string
          phone: string | null
          training_completed: boolean | null
          training_completion_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          batch_id?: string | null
          certificate_number?: string | null
          certification_date?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          certified?: boolean | null
          company_name?: string | null
          created_at?: string
          email: string
          enrollment_status?: string
          exam_date?: string | null
          exam_passed?: boolean | null
          exam_scheduled?: boolean | null
          exam_score?: number | null
          exam_voucher_id?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          notes?: string | null
          partner_id: string
          phone?: string | null
          training_completed?: boolean | null
          training_completion_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          batch_id?: string | null
          certificate_number?: string | null
          certification_date?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          certified?: boolean | null
          company_name?: string | null
          created_at?: string
          email?: string
          enrollment_status?: string
          exam_date?: string | null
          exam_passed?: boolean | null
          exam_scheduled?: boolean | null
          exam_score?: number | null
          exam_voucher_id?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          notes?: string | null
          partner_id?: string
          phone?: string | null
          training_completed?: boolean | null
          training_completion_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecp_trainees_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ecp_training_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_trainees_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_trainees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_trainees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_trainees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_trainees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_trainees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_trainers: {
        Row: {
          bio: string | null
          certifications:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          linkedin_url: string | null
          partner_id: string
          phone: string | null
          photo_url: string | null
          status: string
          trainer_certification_date: string | null
          trainer_certification_expiry: string | null
          trainer_code: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          certifications?:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          linkedin_url?: string | null
          partner_id: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          trainer_certification_date?: string | null
          trainer_certification_expiry?: string | null
          trainer_code?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          certifications?:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          linkedin_url?: string | null
          partner_id?: string
          phone?: string | null
          photo_url?: string | null
          status?: string
          trainer_certification_date?: string | null
          trainer_certification_expiry?: string | null
          trainer_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecp_trainers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_training_batches: {
        Row: {
          batch_code: string
          batch_name: string
          batch_name_ar: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          description: string | null
          exam_date: string | null
          id: string
          max_capacity: number
          partner_id: string
          status: string
          trainer_id: string | null
          training_end_date: string
          training_location: string | null
          training_mode: string
          training_start_date: string
          updated_at: string
        }
        Insert: {
          batch_code: string
          batch_name: string
          batch_name_ar?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          description?: string | null
          exam_date?: string | null
          id?: string
          max_capacity?: number
          partner_id: string
          status?: string
          trainer_id?: string | null
          training_end_date: string
          training_location?: string | null
          training_mode?: string
          training_start_date: string
          updated_at?: string
        }
        Update: {
          batch_code?: string
          batch_name?: string
          batch_name_ar?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          description?: string | null
          exam_date?: string | null
          id?: string
          max_capacity?: number
          partner_id?: string
          status?: string
          trainer_id?: string | null
          training_end_date?: string
          training_location?: string | null
          training_mode?: string
          training_start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecp_training_batches_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_training_batches_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "ecp_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_voucher_allocations: {
        Row: {
          allocated_by: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          id: string
          order_reference: string | null
          partner_id: string
          payment_status: string | null
          quantity: number
          status: string
          total_amount: number | null
          unit_price: number | null
          updated_at: string
          valid_from: string
          valid_until: string
          vouchers_remaining: number | null
          vouchers_used: number
        }
        Insert: {
          allocated_by?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          id?: string
          order_reference?: string | null
          partner_id: string
          payment_status?: string | null
          quantity: number
          status?: string
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
          valid_from?: string
          valid_until: string
          vouchers_remaining?: number | null
          vouchers_used?: number
        }
        Update: {
          allocated_by?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          id?: string
          order_reference?: string | null
          partner_id?: string
          payment_status?: string | null
          quantity?: number
          status?: string
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string
          vouchers_remaining?: number | null
          vouchers_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "ecp_voucher_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_allocations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_voucher_requests: {
        Row: {
          admin_notes: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          paid_at: string | null
          partner_id: string
          payment_method: string | null
          payment_reference: string | null
          quantity: number
          request_number: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["voucher_request_status"]
          total_amount: number
          unit_price: number
          updated_at: string
          vouchers_generated: number | null
          woocommerce_invoice_url: string | null
          woocommerce_order_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          paid_at?: string | null
          partner_id: string
          payment_method?: string | null
          payment_reference?: string | null
          quantity: number
          request_number: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["voucher_request_status"]
          total_amount: number
          unit_price?: number
          updated_at?: string
          vouchers_generated?: number | null
          woocommerce_invoice_url?: string | null
          woocommerce_order_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          paid_at?: string | null
          partner_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          quantity?: number
          request_number?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["voucher_request_status"]
          total_amount?: number
          unit_price?: number
          updated_at?: string
          vouchers_generated?: number | null
          woocommerce_invoice_url?: string | null
          woocommerce_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ecp_voucher_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_voucher_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ecp_vouchers: {
        Row: {
          allocation_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to_email: string | null
          assigned_to_name: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          exam_attempt_id: string | null
          id: string
          notes: string | null
          order_id: string | null
          order_reference: string | null
          partner_id: string
          purchased_at: string | null
          status: Database["public"]["Enums"]["voucher_status"]
          trainee_id: string | null
          unit_price: number | null
          updated_at: string
          used_at: string | null
          valid_from: string
          valid_until: string
          voucher_code: string
        }
        Insert: {
          allocation_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          exam_attempt_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          order_reference?: string | null
          partner_id: string
          purchased_at?: string | null
          status?: Database["public"]["Enums"]["voucher_status"]
          trainee_id?: string | null
          unit_price?: number | null
          updated_at?: string
          used_at?: string | null
          valid_from?: string
          valid_until: string
          voucher_code: string
        }
        Update: {
          allocation_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to_email?: string | null
          assigned_to_name?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          exam_attempt_id?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          order_reference?: string | null
          partner_id?: string
          purchased_at?: string | null
          status?: Database["public"]["Enums"]["voucher_status"]
          trainee_id?: string | null
          unit_price?: number | null
          updated_at?: string
          used_at?: string | null
          valid_from?: string
          valid_until?: string
          voucher_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecp_vouchers_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "ecp_voucher_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecp_vouchers_trainee_id_fkey"
            columns: ["trainee_id"]
            isOneToOne: false
            referencedRelation: "ecp_trainees"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          last_attempt_at: string | null
          max_attempts: number
          metadata: Json | null
          priority: number
          recipient_email: string
          recipient_name: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
          template_data: Json
          template_name: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          metadata?: Json | null
          priority?: number
          recipient_email: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject: string
          template_data?: Json
          template_name: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          last_attempt_at?: string | null
          max_attempts?: number
          metadata?: Json | null
          priority?: number
          recipient_email?: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_data?: Json
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      exam_bookings: {
        Row: {
          attempt_id: string | null
          booking_notes: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmation_code: string | null
          confirmation_email_sent: boolean | null
          confirmation_sent_at: string | null
          created_at: string
          id: string
          metadata: Json | null
          original_booking_id: string | null
          quiz_id: string
          reminder_24h_sent: boolean | null
          reminder_24h_sent_at: string | null
          reminder_48h_sent: boolean | null
          reminder_48h_sent_at: string | null
          reschedule_count: number | null
          reschedule_reason: string | null
          rescheduled_from_time: string | null
          scheduled_end_time: string
          scheduled_start_time: string
          status: Database["public"]["Enums"]["exam_booking_status"]
          timeslot_id: string | null
          timezone: string
          updated_at: string
          user_id: string
          voucher_id: string | null
        }
        Insert: {
          attempt_id?: string | null
          booking_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmation_code?: string | null
          confirmation_email_sent?: boolean | null
          confirmation_sent_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          original_booking_id?: string | null
          quiz_id: string
          reminder_24h_sent?: boolean | null
          reminder_24h_sent_at?: string | null
          reminder_48h_sent?: boolean | null
          reminder_48h_sent_at?: string | null
          reschedule_count?: number | null
          reschedule_reason?: string | null
          rescheduled_from_time?: string | null
          scheduled_end_time: string
          scheduled_start_time: string
          status?: Database["public"]["Enums"]["exam_booking_status"]
          timeslot_id?: string | null
          timezone: string
          updated_at?: string
          user_id: string
          voucher_id?: string | null
        }
        Update: {
          attempt_id?: string | null
          booking_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmation_code?: string | null
          confirmation_email_sent?: boolean | null
          confirmation_sent_at?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          original_booking_id?: string | null
          quiz_id?: string
          reminder_24h_sent?: boolean | null
          reminder_24h_sent_at?: string | null
          reminder_48h_sent?: boolean | null
          reminder_48h_sent_at?: string | null
          reschedule_count?: number | null
          reschedule_reason?: string | null
          rescheduled_from_time?: string | null
          scheduled_end_time?: string
          scheduled_start_time?: string
          status?: Database["public"]["Enums"]["exam_booking_status"]
          timeslot_id?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          voucher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_bookings_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "exam_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_timeslot_id_fkey"
            columns: ["timeslot_id"]
            isOneToOne: false
            referencedRelation: "exam_timeslots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_bookings_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "exam_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_timeslots: {
        Row: {
          certification_product_id: string | null
          created_at: string
          created_by: string | null
          current_bookings: number
          end_time: string
          id: string
          is_available: boolean
          max_capacity: number
          notes: string | null
          quiz_id: string
          start_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          certification_product_id?: string | null
          created_at?: string
          created_by?: string | null
          current_bookings?: number
          end_time: string
          id?: string
          is_available?: boolean
          max_capacity?: number
          notes?: string | null
          quiz_id: string
          start_time: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          certification_product_id?: string | null
          created_at?: string
          created_by?: string | null
          current_bookings?: number
          end_time?: string
          id?: string
          is_available?: boolean
          max_capacity?: number
          notes?: string | null
          quiz_id?: string
          start_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_timeslots_certification_product_id_fkey"
            columns: ["certification_product_id"]
            isOneToOne: false
            referencedRelation: "certification_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_timeslots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_timeslots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_timeslots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_timeslots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_timeslots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_timeslots_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_vouchers: {
        Row: {
          admin_notes: string | null
          attempt_id: string | null
          certification_product_id: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          code: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          purchased_at: string | null
          quiz_id: string | null
          status: Database["public"]["Enums"]["voucher_status"]
          updated_at: string
          used_at: string | null
          user_id: string
          woocommerce_order_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          attempt_id?: string | null
          certification_product_id?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          code: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          purchased_at?: string | null
          quiz_id?: string | null
          status?: Database["public"]["Enums"]["voucher_status"]
          updated_at?: string
          used_at?: string | null
          user_id: string
          woocommerce_order_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          attempt_id?: string | null
          certification_product_id?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          purchased_at?: string | null
          quiz_id?: string | null
          status?: Database["public"]["Enums"]["voucher_status"]
          updated_at?: string
          used_at?: string | null
          user_id?: string
          woocommerce_order_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_vouchers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_certification_product_id_fkey"
            columns: ["certification_product_id"]
            isOneToOne: false
            referencedRelation: "certification_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      honor_code_acceptances: {
        Row: {
          accepted_at: string
          attempt_id: string | null
          context: string
          created_at: string
          honor_code_text: string
          honor_code_version: string
          id: string
          ip_address: unknown
          quiz_id: string | null
          signature_data: string | null
          signature_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          attempt_id?: string | null
          context: string
          created_at?: string
          honor_code_text: string
          honor_code_version?: string
          id?: string
          ip_address?: unknown
          quiz_id?: string | null
          signature_data?: string | null
          signature_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          attempt_id?: string | null
          context?: string
          created_at?: string
          honor_code_text?: string
          honor_code_version?: string
          id?: string
          ip_address?: unknown
          quiz_id?: string | null
          signature_data?: string | null
          signature_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "honor_code_acceptances_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_code_acceptances_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_code_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_code_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_code_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_code_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honor_code_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_verifications: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_back_url: string | null
          document_expiry_date: string | null
          document_front_url: string | null
          document_number: string | null
          document_type: string
          external_verification_id: string | null
          external_verification_response: Json | null
          external_verification_status: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_back_url?: string | null
          document_expiry_date?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type: string
          external_verification_id?: string | null
          external_verification_response?: Json | null
          external_verification_status?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_back_url?: string | null
          document_expiry_date?: string | null
          document_front_url?: string | null
          document_number?: string | null
          document_type?: string
          external_verification_id?: string | null
          external_verification_response?: Json | null
          external_verification_status?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "identity_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_system_products: {
        Row: {
          created_at: string
          id: string
          includes_curriculum: boolean
          includes_flashcards: boolean
          includes_question_bank: boolean
          is_active: boolean
          language: string
          updated_at: string
          validity_months: number
          woocommerce_product_id: number
          woocommerce_product_name: string
          woocommerce_product_sku: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          includes_curriculum?: boolean
          includes_flashcards?: boolean
          includes_question_bank?: boolean
          is_active?: boolean
          language: string
          updated_at?: string
          validity_months?: number
          woocommerce_product_id: number
          woocommerce_product_name: string
          woocommerce_product_sku?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          includes_curriculum?: boolean
          includes_flashcards?: boolean
          includes_question_bank?: boolean
          is_active?: boolean
          language?: string
          updated_at?: string
          validity_months?: number
          woocommerce_product_id?: number
          woocommerce_product_name?: string
          woocommerce_product_sku?: string | null
        }
        Relationships: []
      }
      membership_activation_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          error_message: string | null
          id: string
          membership_id: string | null
          new_expiry_date: string | null
          new_status: Database["public"]["Enums"]["membership_status"] | null
          notes: string | null
          previous_expiry_date: string | null
          previous_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          triggered_by: string
          user_id: string
          woocommerce_order_id: number | null
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          membership_id?: string | null
          new_expiry_date?: string | null
          new_status?: Database["public"]["Enums"]["membership_status"] | null
          notes?: string | null
          previous_expiry_date?: string | null
          previous_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          triggered_by: string
          user_id: string
          woocommerce_order_id?: number | null
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          membership_id?: string | null
          new_expiry_date?: string | null
          new_status?: Database["public"]["Enums"]["membership_status"] | null
          notes?: string | null
          previous_expiry_date?: string | null
          previous_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          triggered_by?: string
          user_id?: string
          woocommerce_order_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_activation_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "user_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_activation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_benefits: {
        Row: {
          benefit_description: string | null
          benefit_description_ar: string | null
          benefit_key: string
          benefit_name: string
          benefit_name_ar: string | null
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          updated_at: string
        }
        Insert: {
          benefit_description?: string | null
          benefit_description_ar?: string | null
          benefit_key: string
          benefit_name: string
          benefit_name_ar?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
        }
        Update: {
          benefit_description?: string | null
          benefit_description_ar?: string | null
          benefit_key?: string
          benefit_name?: string
          benefit_name_ar?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          membership_type?: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
        }
        Relationships: []
      }
      membership_product_mapping: {
        Row: {
          created_at: string
          duration_months: number
          id: string
          is_active: boolean | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          updated_at: string
          woocommerce_product_id: number
        }
        Insert: {
          created_at?: string
          duration_months?: number
          id?: string
          is_active?: boolean | null
          membership_type: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
          woocommerce_product_id: number
        }
        Update: {
          created_at?: string
          duration_months?: number
          id?: string
          is_active?: boolean | null
          membership_type?: Database["public"]["Enums"]["membership_type"]
          updated_at?: string
          woocommerce_product_id?: number
        }
        Relationships: []
      }
      mock_exam_answers: {
        Row: {
          answer_text: string
          answer_text_ar: string | null
          created_at: string
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
        }
        Insert: {
          answer_text: string
          answer_text_ar?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
        }
        Update: {
          answer_text?: string
          answer_text_ar?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mock_exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exam_attempt_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_answer_ids: string[]
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_answer_ids: string[]
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          selected_answer_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "mock_exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mock_exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exam_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          exam_id: string
          id: string
          passed: boolean
          score: number
          started_at: string
          time_spent_minutes: number
          total_points_earned: number
          total_points_possible: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exam_id: string
          id?: string
          passed: boolean
          score: number
          started_at: string
          time_spent_minutes: number
          total_points_earned: number
          total_points_possible: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          passed?: boolean
          score?: number
          started_at?: string
          time_spent_minutes?: number
          total_points_earned?: number
          total_points_possible?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exam_premium_access: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          mock_exam_id: string
          user_id: string
          woocommerce_order_id: number | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          mock_exam_id: string
          user_id: string
          woocommerce_order_id?: number | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          mock_exam_id?: string
          user_id?: string
          woocommerce_order_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_premium_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_mock_exam_id_fkey"
            columns: ["mock_exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exam_premium_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exam_questions: {
        Row: {
          competency_name: string | null
          competency_section: string | null
          created_at: string
          difficulty: string | null
          exam_id: string
          explanation: string | null
          explanation_ar: string | null
          id: string
          order_index: number
          points: number
          question_text: string
          question_text_ar: string | null
          question_type: Database["public"]["Enums"]["exam_question_type"]
          sub_competency_name: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          competency_name?: string | null
          competency_section?: string | null
          created_at?: string
          difficulty?: string | null
          exam_id: string
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text: string
          question_text_ar?: string | null
          question_type?: Database["public"]["Enums"]["exam_question_type"]
          sub_competency_name?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          competency_name?: string | null
          competency_section?: string | null
          created_at?: string
          difficulty?: string | null
          exam_id?: string
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          order_index?: number
          points?: number
          question_text?: string
          question_text_ar?: string | null
          question_type?: Database["public"]["Enums"]["exam_question_type"]
          sub_competency_name?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mock_exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "mock_exams"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_exams: {
        Row: {
          category: Database["public"]["Enums"]["exam_category"]
          competency_module_id: string | null
          created_at: string
          created_by: string | null
          description: string
          description_ar: string | null
          difficulty: Database["public"]["Enums"]["exam_difficulty"]
          duration_minutes: number
          id: string
          is_active: boolean
          is_premium: boolean
          language: Database["public"]["Enums"]["mock_exam_language"]
          passing_score: number
          title: string
          title_ar: string | null
          total_questions: number
          updated_at: string
          woocommerce_product_id: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["exam_category"]
          competency_module_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          description_ar?: string | null
          difficulty?: Database["public"]["Enums"]["exam_difficulty"]
          duration_minutes: number
          id?: string
          is_active?: boolean
          is_premium?: boolean
          language?: Database["public"]["Enums"]["mock_exam_language"]
          passing_score?: number
          title: string
          title_ar?: string | null
          total_questions: number
          updated_at?: string
          woocommerce_product_id?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["exam_category"]
          competency_module_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          description_ar?: string | null
          difficulty?: Database["public"]["Enums"]["exam_difficulty"]
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_premium?: boolean
          language?: Database["public"]["Enums"]["mock_exam_language"]
          passing_score?: number
          title?: string
          title_ar?: string | null
          total_questions?: number
          updated_at?: string
          woocommerce_product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_exams_competency_module_id_fkey"
            columns: ["competency_module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mock_exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          company_name_ar: string | null
          contact_email: string
          contact_person: string
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          license_number: string | null
          license_valid_from: string | null
          license_valid_until: string | null
          partner_type: string
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          company_name_ar?: string | null
          contact_email: string
          contact_person: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          license_number?: string | null
          license_valid_from?: string | null
          license_valid_until?: string | null
          partner_type: string
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          company_name_ar?: string | null
          contact_email?: string
          contact_person?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          license_number?: string | null
          license_valid_from?: string | null
          license_valid_until?: string | null
          partner_type?: string
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pdc_entries: {
        Row: {
          activity_date: string
          activity_description: string | null
          activity_title: string
          activity_title_ar: string | null
          activity_type: Database["public"]["Enums"]["pdc_activity_type"]
          certificate_url: string | null
          certification_id: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          credits_approved: number | null
          credits_claimed: number
          id: string
          notes: string | null
          program_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["pdc_status"]
          submission_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_description?: string | null
          activity_title: string
          activity_title_ar?: string | null
          activity_type: Database["public"]["Enums"]["pdc_activity_type"]
          certificate_url?: string | null
          certification_id?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          credits_approved?: number | null
          credits_claimed: number
          id?: string
          notes?: string | null
          program_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["pdc_status"]
          submission_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_description?: string | null
          activity_title?: string
          activity_title_ar?: string | null
          activity_type?: Database["public"]["Enums"]["pdc_activity_type"]
          certificate_url?: string | null
          certification_id?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          credits_approved?: number | null
          credits_claimed?: number
          id?: string
          notes?: string | null
          program_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["pdc_status"]
          submission_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdc_entries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdc_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_annual_reports: {
        Row: {
          average_satisfaction_score: number | null
          challenges: string | null
          completion_rate: number | null
          created_at: string
          id: string
          improvements_planned: string | null
          partner_id: string
          report_file_url: string | null
          report_year: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          summary: string | null
          supporting_documents: Json | null
          total_completions: number
          total_enrollments: number
          total_pdc_credits_issued: number
          total_programs: number
          updated_at: string
        }
        Insert: {
          average_satisfaction_score?: number | null
          challenges?: string | null
          completion_rate?: number | null
          created_at?: string
          id?: string
          improvements_planned?: string | null
          partner_id: string
          report_file_url?: string | null
          report_year: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          summary?: string | null
          supporting_documents?: Json | null
          total_completions?: number
          total_enrollments?: number
          total_pdc_credits_issued?: number
          total_programs?: number
          updated_at?: string
        }
        Update: {
          average_satisfaction_score?: number | null
          challenges?: string | null
          completion_rate?: number | null
          created_at?: string
          id?: string
          improvements_planned?: string | null
          partner_id?: string
          report_file_url?: string | null
          report_year?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          summary?: string | null
          supporting_documents?: Json | null
          total_completions?: number
          total_enrollments?: number
          total_pdc_credits_issued?: number
          total_programs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdp_annual_reports_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_annual_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_annual_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_annual_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_annual_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_annual_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_guidelines: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          description_ar: string | null
          download_count: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          last_updated_by: string | null
          sort_order: number | null
          title: string
          title_ar: string | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          download_count?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          last_updated_by?: string | null
          sort_order?: number | null
          title: string
          title_ar?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          download_count?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          last_updated_by?: string | null
          sort_order?: number | null
          title?: string
          title_ar?: string | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdp_guidelines_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_guidelines_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_guidelines_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_guidelines_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_guidelines_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_license_documents: {
        Row: {
          document_name: string
          document_type: string
          document_url: string
          file_size: number | null
          id: string
          license_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_name: string
          document_type: string
          document_url: string
          file_size?: number | null
          id?: string
          license_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_name?: string
          document_type?: string
          document_url?: string
          file_size?: number | null
          id?: string
          license_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdp_license_documents_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "pdp_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_license_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          current_slots: number | null
          id: string
          justification: string | null
          license_id: string
          partner_id: string
          request_type: string
          requested_slots: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          current_slots?: number | null
          id?: string
          justification?: string | null
          license_id: string
          partner_id: string
          request_type: string
          requested_slots?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          current_slots?: number | null
          id?: string
          justification?: string | null
          license_id?: string
          partner_id?: string
          request_type?: string
          requested_slots?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdp_license_requests_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "pdp_licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_license_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_license_terms: {
        Row: {
          created_at: string
          id: string
          is_required: boolean
          license_id: string
          term_description: string | null
          term_key: string
          term_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_required?: boolean
          license_id: string
          term_description?: string | null
          term_key: string
          term_title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_required?: boolean
          license_id?: string
          term_description?: string | null
          term_key?: string
          term_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdp_license_terms_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "pdp_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_licenses: {
        Row: {
          admin_notes: string | null
          agreement_document_url: string | null
          agreement_signed_date: string | null
          created_at: string
          expiry_date: string
          id: string
          issue_date: string
          license_number: string
          max_programs: number
          partner_code: string
          partner_id: string
          program_submission_enabled: boolean
          programs_used: number
          renewal_requested: boolean
          renewal_requested_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          agreement_document_url?: string | null
          agreement_signed_date?: string | null
          created_at?: string
          expiry_date: string
          id?: string
          issue_date?: string
          license_number: string
          max_programs?: number
          partner_code: string
          partner_id: string
          program_submission_enabled?: boolean
          programs_used?: number
          renewal_requested?: boolean
          renewal_requested_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          agreement_document_url?: string | null
          agreement_signed_date?: string | null
          created_at?: string
          expiry_date?: string
          id?: string
          issue_date?: string
          license_number?: string
          max_programs?: number
          partner_code?: string
          partner_id?: string
          program_submission_enabled?: boolean
          programs_used?: number
          renewal_requested?: boolean
          renewal_requested_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdp_licenses_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_partner_profiles: {
        Row: {
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          city: string | null
          country: string | null
          created_at: string | null
          delivery_methods: Json | null
          description: string | null
          facebook_url: string | null
          id: string
          legal_name: string | null
          linkedin_url: string | null
          logo_url: string | null
          organization_name: string | null
          partner_id: string
          postal_code: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_contact_title: string | null
          registration_number: string | null
          specializations: Json | null
          state_province: string | null
          street_address: string | null
          target_audiences: Json | null
          tax_id: string | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          website: string | null
          year_established: number | null
        }
        Insert: {
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          delivery_methods?: Json | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          legal_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          organization_name?: string | null
          partner_id: string
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_title?: string | null
          registration_number?: string | null
          specializations?: Json | null
          state_province?: string | null
          street_address?: string | null
          target_audiences?: Json | null
          tax_id?: string | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
          year_established?: number | null
        }
        Update: {
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_contact_phone?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          delivery_methods?: Json | null
          description?: string | null
          facebook_url?: string | null
          id?: string
          legal_name?: string | null
          linkedin_url?: string | null
          logo_url?: string | null
          organization_name?: string | null
          partner_id?: string
          postal_code?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_contact_title?: string | null
          registration_number?: string | null
          specializations?: Json | null
          state_province?: string | null
          street_address?: string | null
          target_audiences?: Json | null
          tax_id?: string | null
          timezone?: string | null
          twitter_url?: string | null
          updated_at?: string | null
          website?: string | null
          year_established?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pdp_partner_profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_program_competencies: {
        Row: {
          competency_id: string
          created_at: string
          id: string
          program_id: string
          relevance_level: string
        }
        Insert: {
          competency_id: string
          created_at?: string
          id?: string
          program_id: string
          relevance_level?: string
        }
        Update: {
          competency_id?: string
          created_at?: string
          id?: string
          program_id?: string
          relevance_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdp_program_competencies_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "bock_competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_competencies_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "pdp_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_program_enrollments: {
        Row: {
          certificate_issued: boolean | null
          certificate_number: string | null
          completion_date: string | null
          created_at: string
          enrollment_date: string
          id: string
          participant_email: string
          participant_name: string
          pdc_credits_earned: number | null
          program_id: string
          slot_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_date?: string | null
          created_at?: string
          enrollment_date?: string
          id?: string
          participant_email: string
          participant_name: string
          pdc_credits_earned?: number | null
          program_id: string
          slot_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          certificate_issued?: boolean | null
          certificate_number?: string | null
          completion_date?: string | null
          created_at?: string
          enrollment_date?: string
          id?: string
          participant_email?: string
          participant_name?: string
          pdc_credits_earned?: number | null
          program_id?: string
          slot_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdp_program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "pdp_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_enrollments_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "pdp_program_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_program_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_program_slots: {
        Row: {
          available_slots: number | null
          created_at: string
          currency: string | null
          id: string
          is_active: boolean
          period_end: string
          period_start: string
          program_id: string
          slot_price: number | null
          total_slots: number
          updated_at: string
          used_slots: number
        }
        Insert: {
          available_slots?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          period_end: string
          period_start: string
          program_id: string
          slot_price?: number | null
          total_slots: number
          updated_at?: string
          used_slots?: number
        }
        Update: {
          available_slots?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          period_end?: string
          period_start?: string
          program_id?: string
          slot_price?: number | null
          total_slots?: number
          updated_at?: string
          used_slots?: number
        }
        Relationships: [
          {
            foreignKeyName: "pdp_program_slots_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "pdp_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_programs: {
        Row: {
          activity_type: Database["public"]["Enums"]["pdc_activity_type"]
          admin_edited_at: string | null
          agenda_url: string | null
          bock_domain: string[] | null
          brochure_url: string | null
          country: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          delivery_language: string | null
          delivery_mode: string | null
          description: string | null
          description_ar: string | null
          duration_hours: number | null
          edited_by_admin: boolean | null
          id: string
          is_active: boolean
          key_topics: string[] | null
          learning_outcomes: string[] | null
          max_pdc_credits: number
          prerequisites: string | null
          program_id: string
          program_name: string
          program_name_ar: string | null
          provider_id: string | null
          provider_name: string
          removed_by_admin: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          target_audience: string | null
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          activity_type?: Database["public"]["Enums"]["pdc_activity_type"]
          admin_edited_at?: string | null
          agenda_url?: string | null
          bock_domain?: string[] | null
          brochure_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          delivery_language?: string | null
          delivery_mode?: string | null
          description?: string | null
          description_ar?: string | null
          duration_hours?: number | null
          edited_by_admin?: boolean | null
          id?: string
          is_active?: boolean
          key_topics?: string[] | null
          learning_outcomes?: string[] | null
          max_pdc_credits: number
          prerequisites?: string | null
          program_id: string
          program_name: string
          program_name_ar?: string | null
          provider_id?: string | null
          provider_name: string
          removed_by_admin?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["pdc_activity_type"]
          admin_edited_at?: string | null
          agenda_url?: string | null
          bock_domain?: string[] | null
          brochure_url?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          delivery_language?: string | null
          delivery_mode?: string | null
          description?: string | null
          description_ar?: string | null
          duration_hours?: number | null
          edited_by_admin?: boolean | null
          id?: string
          is_active?: boolean
          key_topics?: string[] | null
          learning_outcomes?: string[] | null
          max_pdc_credits?: number
          prerequisites?: string | null
          program_id?: string
          program_name?: string
          program_name_ar?: string | null
          provider_id?: string | null
          provider_name?: string
          removed_by_admin?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          target_audience?: string | null
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdp_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdp_programs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      pdp_toolkit_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answer_text: string
          answer_text_ar: string | null
          created_at: string | null
          explanation: string | null
          explanation_ar: string | null
          id: string
          is_correct: boolean
          order_index: number
          question_id: string
        }
        Insert: {
          answer_text: string
          answer_text_ar?: string | null
          created_at?: string | null
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id: string
        }
        Update: {
          answer_text?: string
          answer_text_ar?: string | null
          created_at?: string | null
          explanation?: string | null
          explanation_ar?: string | null
          id?: string
          is_correct?: boolean
          order_index?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: string
          created_at: string | null
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_answer_ids: string[]
        }
        Insert: {
          attempt_id: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          selected_answer_ids: string[]
        }
        Update: {
          attempt_id?: string
          created_at?: string | null
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          selected_answer_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          exam_type: string | null
          id: string
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          time_spent_minutes: number | null
          total_points_earned: number | null
          total_points_possible: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          exam_type?: string | null
          id?: string
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          total_points_earned?: number | null
          total_points_possible?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          exam_type?: string | null
          id?: string
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          time_spent_minutes?: number | null
          total_points_earned?: number | null
          total_points_possible?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          bock_domain: string | null
          competency_name: string | null
          competency_section: string | null
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          id: string
          is_shared: boolean | null
          order_index: number
          points: number
          question_text: string
          question_text_ar: string | null
          question_type: Database["public"]["Enums"]["question_type"]
          quiz_id: string
          sub_competency_name: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          bock_domain?: string | null
          competency_name?: string | null
          competency_section?: string | null
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          is_shared?: boolean | null
          order_index?: number
          points?: number
          question_text: string
          question_text_ar?: string | null
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id: string
          sub_competency_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          bock_domain?: string | null
          competency_name?: string | null
          competency_section?: string | null
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          is_shared?: boolean | null
          order_index?: number
          points?: number
          question_text?: string
          question_text_ar?: string | null
          question_type?: Database["public"]["Enums"]["question_type"]
          quiz_id?: string
          sub_competency_name?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string | null
          created_by: string | null
          description: string | null
          description_ar: string | null
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          id: string
          is_active: boolean
          passing_score_percentage: number
          time_limit_minutes: number
          title: string
          title_ar: string | null
          updated_at: string | null
        }
        Insert: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          is_active?: boolean
          passing_score_percentage?: number
          time_limit_minutes?: number
          title: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Update: {
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          description_ar?: string | null
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          id?: string
          is_active?: boolean
          passing_score_percentage?: number
          time_limit_minutes?: number
          title?: string
          title_ar?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_access_log: {
        Row: {
          accessed_at: string
          action: string
          id: string
          ip_address: unknown
          resource_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          id?: string
          ip_address?: unknown
          resource_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          id?: string
          ip_address?: unknown
          resource_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_access_log_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          category_key: string
          color: string | null
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label_ar: string | null
          label_en: string
          updated_at: string
        }
        Insert: {
          category_key: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label_ar?: string | null
          label_en: string
          updated_at?: string
        }
        Update: {
          category_key?: string
          color?: string | null
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label_ar?: string | null
          label_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_types: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label_ar: string | null
          label_en: string
          type_key: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label_ar?: string | null
          label_en: string
          type_key: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label_ar?: string | null
          label_en?: string
          type_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_visibility_rules: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_active: boolean | null
          label_ar: string | null
          label_en: string
          rule_key: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          label_ar?: string | null
          label_en: string
          rule_key: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_active?: boolean | null
          label_ar?: string | null
          label_en?: string
          rule_key?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category_id: string | null
          certification_type:
            | Database["public"]["Enums"]["certification_type"]
            | null
          created_at: string
          description: string | null
          description_ar: string | null
          download_count: number | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_featured: boolean | null
          language: string | null
          published_at: string | null
          requires_certification: boolean | null
          requires_purchase: boolean | null
          resource_type_id: string
          status: string
          tags: string[] | null
          thumbnail_path: string | null
          title: string
          title_ar: string | null
          updated_at: string
          uploaded_by: string | null
          version: string | null
          visibility_rule_id: string
          woocommerce_product_id: number | null
        }
        Insert: {
          category_id?: string | null
          certification_type?:
            | Database["public"]["Enums"]["certification_type"]
            | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          download_count?: number | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_featured?: boolean | null
          language?: string | null
          published_at?: string | null
          requires_certification?: boolean | null
          requires_purchase?: boolean | null
          resource_type_id: string
          status?: string
          tags?: string[] | null
          thumbnail_path?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
          visibility_rule_id: string
          woocommerce_product_id?: number | null
        }
        Update: {
          category_id?: string | null
          certification_type?:
            | Database["public"]["Enums"]["certification_type"]
            | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          download_count?: number | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_featured?: boolean | null
          language?: string | null
          published_at?: string | null
          requires_certification?: boolean | null
          requires_purchase?: boolean | null
          resource_type_id?: string
          status?: string
          tags?: string[] | null
          thumbnail_path?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          uploaded_by?: string | null
          version?: string | null
          visibility_rule_id?: string
          woocommerce_product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_resource_type_id_fkey"
            columns: ["resource_type_id"]
            isOneToOne: false
            referencedRelation: "resource_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_visibility_rule_id_fkey"
            columns: ["visibility_rule_id"]
            isOneToOne: false
            referencedRelation: "resource_visibility_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: Database["public"]["Enums"]["user_role"]
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: Database["public"]["Enums"]["user_role"]
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: Database["public"]["Enums"]["user_role"]
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      roles_mapping: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          supabase_role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          wordpress_role: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          supabase_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          wordpress_role: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          supabase_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          wordpress_role?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at: string | null
          created_at: string | null
          description: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          closed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          message_id: string | null
          mime_type: string
          ticket_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          message_id?: string | null
          mime_type: string
          ticket_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          message_id?: string | null
          mime_type?: string
          ticket_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "ticket_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          is_internal_note: boolean
          message: string
          ticket_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_internal_note?: boolean
          message: string
          ticket_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_internal_note?: boolean
          message?: string
          ticket_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["ticket_status"]
          old_status: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["ticket_status"]
          old_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["ticket_status"]
          old_status?: Database["public"]["Enums"]["ticket_status"] | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          category: Database["public"]["Enums"]["ticket_category"] | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["ticket_category"] | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["ticket_category"] | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          certificate_url: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          created_by: string | null
          credential_id: string
          expiry_date: string
          id: string
          issued_date: string
          last_renewed_at: string | null
          notes: string | null
          pdc_credits_earned: number | null
          quiz_attempt_id: string | null
          renewal_count: number
          revocation_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          created_by?: string | null
          credential_id: string
          expiry_date: string
          id?: string
          issued_date: string
          last_renewed_at?: string | null
          notes?: string | null
          pdc_credits_earned?: number | null
          quiz_attempt_id?: string | null
          renewal_count?: number
          revocation_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          created_by?: string | null
          credential_id?: string
          expiry_date?: string
          id?: string
          issued_date?: string
          last_renewed_at?: string | null
          notes?: string | null
          pdc_credits_earned?: number | null
          quiz_attempt_id?: string | null
          renewal_count?: number
          revocation_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_certifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_quiz_attempt_id_fkey"
            columns: ["quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_certifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_curriculum_access: {
        Row: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          expires_at: string
          id: string
          includes_flashcards: boolean | null
          includes_question_bank: boolean | null
          is_active: boolean
          language: string
          last_checked_at: string | null
          purchased_at: string
          source: string | null
          updated_at: string
          user_id: string
          woocommerce_order_id: number | null
          woocommerce_product_id: number | null
        }
        Insert: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          expires_at: string
          id?: string
          includes_flashcards?: boolean | null
          includes_question_bank?: boolean | null
          is_active?: boolean
          language: string
          last_checked_at?: string | null
          purchased_at: string
          source?: string | null
          updated_at?: string
          user_id: string
          woocommerce_order_id?: number | null
          woocommerce_product_id?: number | null
        }
        Update: {
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          expires_at?: string
          id?: string
          includes_flashcards?: boolean | null
          includes_question_bank?: boolean | null
          is_active?: boolean
          language?: string
          last_checked_at?: string | null
          purchased_at?: string
          source?: string | null
          updated_at?: string
          user_id?: string
          woocommerce_order_id?: number | null
          woocommerce_product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_curriculum_progress: {
        Row: {
          best_quiz_score: number | null
          completed_at: string | null
          created_at: string
          id: string
          last_accessed_at: string | null
          last_quiz_attempt_id: string | null
          module_id: string
          progress_percentage: number
          quiz_attempts_count: number
          status: string
          time_spent_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_quiz_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          last_quiz_attempt_id?: string | null
          module_id: string
          progress_percentage?: number
          quiz_attempts_count?: number
          status?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_quiz_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          last_quiz_attempt_id?: string | null
          module_id?: string
          progress_percentage?: number
          quiz_attempts_count?: number
          status?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_progress_last_quiz_attempt_id_fkey"
            columns: ["last_quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcard_deck_progress: {
        Row: {
          cards_learning: number | null
          cards_mastered: number | null
          cards_new: number | null
          cards_reviewing: number | null
          created_at: string | null
          deck_id: string
          id: string
          last_studied_at: string | null
          longest_streak_days: number | null
          study_streak_days: number | null
          total_reviews: number | null
          total_study_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cards_learning?: number | null
          cards_mastered?: number | null
          cards_new?: number | null
          cards_reviewing?: number | null
          created_at?: string | null
          deck_id: string
          id?: string
          last_studied_at?: string | null
          longest_streak_days?: number | null
          study_streak_days?: number | null
          total_reviews?: number | null
          total_study_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cards_learning?: number | null
          cards_mastered?: number | null
          cards_new?: number | null
          cards_reviewing?: number | null
          created_at?: string | null
          deck_id?: string
          id?: string
          last_studied_at?: string | null
          longest_streak_days?: number | null
          study_streak_days?: number | null
          total_reviews?: number | null
          total_study_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_deck_progress_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "curriculum_flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_deck_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_deck_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_deck_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_deck_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_deck_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcard_progress: {
        Row: {
          created_at: string | null
          deck_id: string
          ease_factor: number | null
          flashcard_id: string
          id: string
          interval_days: number | null
          is_favorited: boolean | null
          last_reviewed_at: string | null
          mastered_at: string | null
          next_review_date: string | null
          repetition_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deck_id: string
          ease_factor?: number | null
          flashcard_id: string
          id?: string
          interval_days?: number | null
          is_favorited?: boolean | null
          last_reviewed_at?: string | null
          mastered_at?: string | null
          next_review_date?: string | null
          repetition_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deck_id?: string
          ease_factor?: number | null
          flashcard_id?: string
          id?: string
          interval_days?: number | null
          is_favorited?: boolean | null
          last_reviewed_at?: string | null
          mastered_at?: string | null
          next_review_date?: string | null
          repetition_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_progress_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "curriculum_flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "curriculum_flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flashcard_study_sessions: {
        Row: {
          cards_correct: number | null
          cards_incorrect: number | null
          cards_studied: number | null
          deck_id: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          started_at: string | null
          user_id: string
        }
        Insert: {
          cards_correct?: number | null
          cards_incorrect?: number | null
          cards_studied?: number | null
          deck_id: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          user_id: string
        }
        Update: {
          cards_correct?: number | null
          cards_incorrect?: number | null
          cards_studied?: number | null
          deck_id?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_flashcard_study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "curriculum_flashcard_decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_flashcard_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          best_quiz_score: number | null
          completed_at: string | null
          created_at: string
          id: string
          last_accessed_at: string | null
          last_quiz_attempt_id: string | null
          lesson_id: string
          progress_percentage: number
          quiz_attempts_count: number
          status: string
          time_spent_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_quiz_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          last_quiz_attempt_id?: string | null
          lesson_id: string
          progress_percentage?: number
          quiz_attempts_count?: number
          status?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_quiz_score?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          last_accessed_at?: string | null
          last_quiz_attempt_id?: string | null
          lesson_id?: string
          progress_percentage?: number
          quiz_attempts_count?: number
          status?: string
          time_spent_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_last_quiz_attempt_id_fkey"
            columns: ["last_quiz_attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "curriculum_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          activated_by: string | null
          admin_notes: string | null
          auto_renew: boolean | null
          certificate_url: string | null
          created_at: string
          deactivated_by: string | null
          deactivation_reason: string | null
          expiry_date: string
          id: string
          last_renewed_at: string | null
          membership_id: string
          membership_type: Database["public"]["Enums"]["membership_type"]
          renewal_count: number
          start_date: string
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
          woocommerce_order_id: number | null
          woocommerce_product_id: number | null
        }
        Insert: {
          activated_by?: string | null
          admin_notes?: string | null
          auto_renew?: boolean | null
          certificate_url?: string | null
          created_at?: string
          deactivated_by?: string | null
          deactivation_reason?: string | null
          expiry_date: string
          id?: string
          last_renewed_at?: string | null
          membership_id: string
          membership_type: Database["public"]["Enums"]["membership_type"]
          renewal_count?: number
          start_date: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
          woocommerce_order_id?: number | null
          woocommerce_product_id?: number | null
        }
        Update: {
          activated_by?: string | null
          admin_notes?: string | null
          auto_renew?: boolean | null
          certificate_url?: string | null
          created_at?: string
          deactivated_by?: string | null
          deactivation_reason?: string | null
          expiry_date?: string
          id?: string
          last_renewed_at?: string | null
          membership_id?: string
          membership_type?: Database["public"]["Enums"]["membership_type"]
          renewal_count?: number
          start_date?: string
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
          woocommerce_order_id?: number | null
          woocommerce_product_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_activated_by_fkey"
            columns: ["activated_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_deactivated_by_fkey"
            columns: ["deactivated_by"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          certification_updates: boolean | null
          created_at: string | null
          exam_reminders: boolean | null
          membership_updates: boolean | null
          new_resources: boolean | null
          pdc_reminders: boolean | null
          system_alerts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certification_updates?: boolean | null
          created_at?: string | null
          exam_reminders?: boolean | null
          membership_updates?: boolean | null
          new_resources?: boolean | null
          pdc_reminders?: boolean | null
          system_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certification_updates?: boolean | null
          created_at?: string | null
          exam_reminders?: boolean | null
          membership_updates?: boolean | null
          new_resources?: boolean | null
          pdc_reminders?: boolean | null
          system_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          language: string | null
          theme: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          language?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          language?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_question_attempts: {
        Row: {
          attempted_at: string | null
          id: string
          is_correct: boolean
          is_favorited: boolean | null
          is_marked_for_review: boolean | null
          question_id: string
          question_set_id: string
          selected_option_id: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          attempted_at?: string | null
          id?: string
          is_correct: boolean
          is_favorited?: boolean | null
          is_marked_for_review?: boolean | null
          question_id: string
          question_set_id: string
          selected_option_id: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          attempted_at?: string | null
          id?: string
          is_correct?: boolean
          is_favorited?: boolean | null
          is_marked_for_review?: boolean | null
          question_id?: string
          question_set_id?: string
          selected_option_id?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "curriculum_practice_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_attempts_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "curriculum_question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_question_bank_progress: {
        Row: {
          attempts_count: number | null
          best_score_percentage: number | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_attempted_at: string | null
          last_score_percentage: number | null
          question_set_id: string
          questions_attempted: number | null
          questions_correct: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts_count?: number | null
          best_score_percentage?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_attempted_at?: string | null
          last_score_percentage?: number | null
          question_set_id: string
          questions_attempted?: number | null
          questions_correct?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts_count?: number | null
          best_score_percentage?: number | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_attempted_at?: string | null
          last_score_percentage?: number | null
          question_set_id?: string
          questions_attempted?: number | null
          questions_correct?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_question_bank_progress_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "curriculum_question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_bank_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_bank_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_bank_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_bank_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_question_bank_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_name: string | null
          country_code: string | null
          created_at: string | null
          created_from: string | null
          date_of_birth: string | null
          email: string
          experience_years: number | null
          first_name: string | null
          id: string
          identity_verified: boolean | null
          identity_verified_at: string | null
          identity_verified_by: string | null
          industry: string | null
          is_active: boolean | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          national_id_number: string | null
          nationality: string | null
          notifications_enabled: boolean | null
          organization: string | null
          passport_number: string | null
          phone: string | null
          preferred_language: string | null
          profile_completed: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          signup_type: string | null
          timezone: string | null
          updated_at: string | null
          wp_last_sync: string | null
          wp_sync_status: string | null
          wp_user_id: number | null
        }
        Insert: {
          company_name?: string | null
          country_code?: string | null
          created_at?: string | null
          created_from?: string | null
          date_of_birth?: string | null
          email: string
          experience_years?: number | null
          first_name?: string | null
          id: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          industry?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          national_id_number?: string | null
          nationality?: string | null
          notifications_enabled?: boolean | null
          organization?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_type?: string | null
          timezone?: string | null
          updated_at?: string | null
          wp_last_sync?: string | null
          wp_sync_status?: string | null
          wp_user_id?: number | null
        }
        Update: {
          company_name?: string | null
          country_code?: string | null
          created_at?: string | null
          created_from?: string | null
          date_of_birth?: string | null
          email?: string
          experience_years?: number | null
          first_name?: string | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          industry?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          national_id_number?: string | null
          nationality?: string | null
          notifications_enabled?: boolean | null
          organization?: string | null
          passport_number?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          signup_type?: string | null
          timezone?: string | null
          updated_at?: string | null
          wp_last_sync?: string | null
          wp_sync_status?: string | null
          wp_user_id?: number | null
        }
        Relationships: []
      }
      wordpress_role_mappings: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          supabase_role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          wordpress_role: string
          wordpress_role_display: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          supabase_role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          wordpress_role: string
          wordpress_role_display?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          supabase_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          wordpress_role?: string
          wordpress_role_display?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_learning_system_access: {
        Row: {
          certification_type:
            | Database["public"]["Enums"]["certification_type"]
            | null
          created_at: string | null
          currently_active: boolean | null
          email: string | null
          expires_at: string | null
          first_name: string | null
          id: string | null
          includes_flashcards: boolean | null
          includes_question_bank: boolean | null
          is_active: boolean | null
          language: string | null
          last_name: string | null
          purchased_at: string | null
          source: string | null
          user_id: string | null
          woocommerce_order_id: number | null
          woocommerce_product_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_unified"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_curriculum_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_wordpress_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_user_stats: {
        Row: {
          active_users: number | null
          completed_profiles: number | null
          recent_signups_ratio: number | null
          role: Database["public"]["Enums"]["user_role"] | null
          user_count: number | null
        }
        Relationships: []
      }
      users_unified: {
        Row: {
          company_name: string | null
          country_code: string | null
          created_at: string | null
          created_from: string | null
          email: string | null
          first_name: string | null
          has_portal_access: boolean | null
          has_store_access: boolean | null
          id: string | null
          is_active: boolean | null
          job_title: string | null
          last_name: string | null
          organization: string | null
          phone: string | null
          preferred_language: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          signup_type: string | null
          timezone: string | null
          updated_at: string | null
          wp_last_sync: string | null
          wp_sync_status: string | null
          wp_user_id: number | null
        }
        Insert: {
          company_name?: string | null
          country_code?: string | null
          created_at?: string | null
          created_from?: string | null
          email?: string | null
          first_name?: string | null
          has_portal_access?: never
          has_store_access?: never
          id?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_name?: string | null
          organization?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          signup_type?: string | null
          timezone?: string | null
          updated_at?: string | null
          wp_last_sync?: string | null
          wp_sync_status?: string | null
          wp_user_id?: number | null
        }
        Update: {
          company_name?: string | null
          country_code?: string | null
          created_at?: string | null
          created_from?: string | null
          email?: string | null
          first_name?: string | null
          has_portal_access?: never
          has_store_access?: never
          id?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_name?: string | null
          organization?: string | null
          phone?: string | null
          preferred_language?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          signup_type?: string | null
          timezone?: string | null
          updated_at?: string | null
          wp_last_sync?: string | null
          wp_sync_status?: string | null
          wp_user_id?: number | null
        }
        Relationships: []
      }
      users_with_details: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          profile_completed: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          role_display_name: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_display_name?: never
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_display_name?: never
        }
        Relationships: []
      }
      users_with_roles: {
        Row: {
          company_name: string | null
          country_code: string | null
          created_at: string | null
          email: string | null
          experience_years: number | null
          first_name: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          notifications_enabled: boolean | null
          phone: string | null
          preferred_language: string | null
          profile_completed: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          role_display_name: string | null
          role_name: Database["public"]["Enums"]["user_role"] | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          first_name?: string | null
          id?: string | null
          industry?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_display_name?: never
          role_name?: Database["public"]["Enums"]["user_role"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          experience_years?: number | null
          first_name?: string | null
          id?: string | null
          industry?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          notifications_enabled?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          profile_completed?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          role_display_name?: never
          role_name?: Database["public"]["Enums"]["user_role"] | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users_with_wordpress_roles: {
        Row: {
          company_name: string | null
          country_code: string | null
          created_at: string | null
          email: string | null
          experience_years: number | null
          first_name: string | null
          id: string | null
          industry: string | null
          is_active: boolean | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          notifications_enabled: boolean | null
          phone: string | null
          preferred_language: string | null
          profile_completed: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          timezone: string | null
          updated_at: string | null
          wordpress_roles: string[] | null
          wordpress_roles_descriptions: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_membership: {
        Args: {
          p_admin_user_id?: string
          p_duration_months?: number
          p_membership_type: Database["public"]["Enums"]["membership_type"]
          p_notes?: string
          p_user_id: string
          p_woocommerce_order_id?: number
          p_woocommerce_product_id?: number
        }
        Returns: string
      }
      admin_has_permission: {
        Args: { p_permission_key: string; p_user_id: string }
        Returns: boolean
      }
      approve_identity_verification: {
        Args: { p_admin_notes?: string; p_verification_id: string }
        Returns: boolean
      }
      assign_voucher: {
        Args: {
          p_email: string
          p_name: string
          p_trainee_id?: string
          p_voucher_id: string
        }
        Returns: boolean
      }
      auto_grant_curriculum_access: {
        Args: {
          p_certification_type: string
          p_expires_at?: string
          p_purchased_at?: string
          p_user_id: string
          p_woocommerce_order_id?: number
          p_woocommerce_product_id?: number
        }
        Returns: Json
      }
      calculate_sm2: {
        Args: {
          p_ease_factor: number
          p_interval: number
          p_quality: number
          p_repetition: number
        }
        Returns: Json
      }
      can_access_quiz: { Args: { quiz_uuid: string }; Returns: boolean }
      can_pdp_submit_program: { Args: { p_partner_id: string }; Returns: Json }
      change_admin_role: {
        Args: {
          p_admin_user_id: string
          p_new_role: Database["public"]["Enums"]["admin_role_type"]
        }
        Returns: boolean
      }
      check_learning_system_access: {
        Args: { p_language: string; p_user_id: string }
        Returns: Json
      }
      check_permission: { Args: { required_permission: string }; Returns: Json }
      create_admin_user: {
        Args: {
          p_admin_role_type: Database["public"]["Enums"]["admin_role_type"]
          p_created_by?: string
          p_department?: string
          p_email: string
          p_first_name: string
          p_last_name: string
        }
        Returns: string
      }
      create_exam_booking: {
        Args: {
          p_quiz_id: string
          p_timeslot_id: string
          p_timezone?: string
          p_user_id: string
          p_voucher_id?: string
        }
        Returns: string
      }
      create_portal_user_from_wp: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_organization?: string
          p_role?: Database["public"]["Enums"]["user_role"]
          p_user_id: string
          p_wp_user_id: number
        }
        Returns: Json
      }
      deactivate_admin_user: {
        Args: { p_admin_user_id: string; p_reason: string }
        Returns: boolean
      }
      expire_memberships: { Args: never; Returns: number }
      expire_vouchers: { Args: never; Returns: number }
      fulfill_voucher_request: {
        Args: { p_admin_id: string; p_request_id: string }
        Returns: number
      }
      generate_batch_code: {
        Args: {
          p_certification_type: Database["public"]["Enums"]["certification_type"]
          p_partner_id: string
        }
        Returns: string
      }
      generate_confirmation_code: { Args: never; Returns: string }
      generate_credential_id: {
        Args: { cert_type: Database["public"]["Enums"]["certification_type"] }
        Returns: string
      }
      generate_license_number: { Args: never; Returns: string }
      generate_membership_id: { Args: never; Returns: string }
      generate_pdp_program_id: {
        Args: { p_country_code?: string; p_provider_id: string }
        Returns: string
      }
      generate_voucher_code: {
        Args: { cert_type: Database["public"]["Enums"]["certification_type"] }
        Returns: string
      }
      generate_voucher_request_number: { Args: never; Returns: string }
      get_accessible_resources: {
        Args: { p_user_id: string }
        Returns: {
          category_key: string
          category_label: string
          description: string
          file_path: string
          id: string
          resource_type_key: string
          resource_type_label: string
          title: string
        }[]
      }
      get_admin_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_key: string
        }[]
      }
      get_available_timeslots: {
        Args: { p_end_date?: string; p_quiz_id: string; p_start_date?: string }
        Returns: {
          available_slots: number
          end_time: string
          id: string
          start_time: string
          timezone: string
        }[]
      }
      get_cards_due_for_review: {
        Args: { p_deck_id?: string; p_user_id: string }
        Returns: {
          back_text: string
          back_text_ar: string
          deck_id: string
          ease_factor: number
          flashcard_id: string
          front_text: string
          front_text_ar: string
          hint: string
          hint_ar: string
          interval_days: number
          repetition_count: number
          status: string
        }[]
      }
      get_certificate_details: {
        Args: { p_credential_id: string }
        Returns: {
          certificate_url: string
          certification_type: string
          credential_id: string
          exam_date: string
          exam_score: number
          exam_title: string
          expiry_date: string
          issued_date: string
          status: string
          user_email: string
          user_full_name: string
        }[]
      }
      get_ecp_dashboard_stats: { Args: { p_partner_id: string }; Returns: Json }
      get_email_template: {
        Args: { p_template_name: string }
        Returns: {
          html_body: string
          subject: string
          text_body: string
        }[]
      }
      get_exam_audit_trail: {
        Args: { p_attempt_id?: string; p_quiz_id: string }
        Returns: {
          actor_email: string
          description: string
          event_details: Json
          event_timestamp: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          success: boolean
          user_id: string
        }[]
      }
      get_latest_identity_verification: {
        Args: { p_user_id: string }
        Returns: {
          document_type: string
          id: string
          rejection_reason: string
          reviewed_at: string
          status: string
          submitted_at: string
        }[]
      }
      get_lesson_progress_summary: {
        Args: { p_user_id: string }
        Returns: {
          completed_lessons: number
          completion_percentage: number
          in_progress_lessons: number
          locked_lessons: number
          total_lessons: number
        }[]
      }
      get_membership_days_remaining: {
        Args: { mem_id: string }
        Returns: number
      }
      get_next_unlocked_module: {
        Args: {
          p_certification_type: Database["public"]["Enums"]["certification_type"]
          p_user_id: string
        }
        Returns: string
      }
      get_partner_license_info: {
        Args: { p_partner_id: string }
        Returns: Json
      }
      get_partner_voucher_stats: {
        Args: { p_partner_id: string }
        Returns: Json
      }
      get_pdp_dashboard_stats: { Args: { p_partner_id: string }; Returns: Json }
      get_pdp_license_info: { Args: { p_partner_id: string }; Returns: Json }
      get_pdp_partner_profile: {
        Args: { p_partner_id: string }
        Returns: {
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_contact_phone: string | null
          city: string | null
          country: string | null
          created_at: string | null
          delivery_methods: Json | null
          description: string | null
          facebook_url: string | null
          id: string
          legal_name: string | null
          linkedin_url: string | null
          logo_url: string | null
          organization_name: string | null
          partner_id: string
          postal_code: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_contact_title: string | null
          registration_number: string | null
          specializations: Json | null
          state_province: string | null
          street_address: string | null
          target_audiences: Json | null
          tax_id: string | null
          timezone: string | null
          twitter_url: string | null
          updated_at: string | null
          website: string | null
          year_established: number | null
        }
        SetofOptions: {
          from: "*"
          to: "pdp_partner_profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_questions_by_competency: {
        Args: {
          p_competency_name?: string
          p_competency_section: string
          p_include_shared?: boolean
          p_sub_competency_name?: string
        }
        Returns: {
          competency_name: string
          competency_section: string
          question_id: string
          question_text: string
          question_type: string
          source_table: string
          sub_competency_name: string
        }[]
      }
      get_quiz_question_count: { Args: { quiz_uuid: string }; Returns: number }
      get_supabase_role_from_wp: {
        Args: { wp_role: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_suspicious_activities: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          actor_email: string
          description: string
          event_details: Json
          event_timestamp: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: unknown
          security_level: string
          user_id: string
        }[]
      }
      get_ticket_stats: { Args: { ticket_uuid: string }; Returns: Json }
      get_upcoming_reminders: {
        Args: never
        Returns: {
          booking_id: string
          confirmation_code: string
          exam_time: string
          hours_until_exam: number
          needs_24h_reminder: boolean
          needs_48h_reminder: boolean
          user_email: string
        }[]
      }
      get_user_active_membership: {
        Args: { p_user_id: string }
        Returns: {
          certificate_url: string
          days_remaining: number
          expiry_date: string
          id: string
          is_expiring_soon: boolean
          membership_id: string
          membership_type: Database["public"]["Enums"]["membership_type"]
          start_date: string
          status: Database["public"]["Enums"]["membership_status"]
        }[]
      }
      get_user_audit_history: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          description: string
          event_details: Json
          event_timestamp: string
          event_type: Database["public"]["Enums"]["audit_event_type"]
          id: string
          ip_address: unknown
          success: boolean
        }[]
      }
      get_user_certificates: {
        Args: { p_user_id: string }
        Returns: {
          certificate_url: string
          certification_type: string
          credential_id: string
          exam_score: number
          exam_title: string
          expiry_date: string
          id: string
          is_expiring_soon: boolean
          issued_date: string
          status: string
        }[]
      }
      get_user_consent_summary: {
        Args: { p_user_id: string }
        Returns: {
          consent_type: Database["public"]["Enums"]["consent_type"]
          consent_version: string
          is_consented: boolean
          last_updated: string
        }[]
      }
      get_user_event_summary: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          event_count: number
          event_type: Database["public"]["Enums"]["audit_event_type"]
          last_occurrence: string
        }[]
      }
      get_user_learning_system_accesses: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_user_pdc_total: {
        Args: {
          p_certification_type: Database["public"]["Enums"]["certification_type"]
          p_user_id: string
        }
        Returns: number
      }
      get_user_profile: { Args: never; Returns: Json }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_upcoming_bookings: {
        Args: { p_user_id: string }
        Returns: {
          confirmation_code: string
          id: string
          quiz_id: string
          scheduled_end_time: string
          scheduled_start_time: string
          status: Database["public"]["Enums"]["exam_booking_status"]
          timezone: string
        }[]
      }
      grant_learning_system_access: {
        Args: {
          p_includes_flashcards?: boolean
          p_includes_question_bank?: boolean
          p_language: string
          p_purchased_at: string
          p_user_id: string
          p_validity_months?: number
          p_woocommerce_order_id: number
          p_woocommerce_product_id: number
        }
        Returns: string
      }
      has_accepted_honor_code: {
        Args: { p_context?: string; p_quiz_id?: string; p_user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { required_permission: string }
        Returns: boolean
      }
      has_user_consented: {
        Args: {
          p_consent_type: Database["public"]["Enums"]["consent_type"]
          p_user_id: string
        }
        Returns: boolean
      }
      increment_guideline_download: {
        Args: { p_guideline_id: string }
        Returns: undefined
      }
      initialize_lesson_progress: {
        Args: {
          p_certification_type: Database["public"]["Enums"]["certification_type"]
          p_user_id: string
        }
        Returns: number
      }
      initialize_user_progress: {
        Args: {
          p_certification_type: Database["public"]["Enums"]["certification_type"]
          p_user_id: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_certification_expiring_soon: {
        Args: { cert_id: string }
        Returns: boolean
      }
      is_identity_verified: { Args: { p_user_id: string }; Returns: boolean }
      is_lesson_unlocked: {
        Args: { p_lesson_id: string; p_user_id: string }
        Returns: boolean
      }
      is_membership_expiring_soon: {
        Args: { mem_id: string }
        Returns: boolean
      }
      is_module_unlocked: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_timeslot_available: {
        Args: { p_timeslot_id: string }
        Returns: boolean
      }
      issue_certification: {
        Args: {
          p_certification_type: Database["public"]["Enums"]["certification_type"]
          p_credential_id: string
          p_expiry_date: string
          p_issued_date: string
          p_quiz_attempt_id: string
          p_user_id: string
        }
        Returns: {
          certificate_url: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          created_by: string | null
          credential_id: string
          expiry_date: string
          id: string
          issued_date: string
          last_renewed_at: string | null
          notes: string | null
          pdc_credits_earned: number | null
          quiz_attempt_id: string | null
          renewal_count: number
          revocation_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_certifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_audit_event: {
        Args: {
          p_attempt_id?: string
          p_description: string
          p_error_message?: string
          p_event_details?: Json
          p_event_type: Database["public"]["Enums"]["audit_event_type"]
          p_flagged_as_suspicious?: boolean
          p_ip_address?: unknown
          p_quiz_id?: string
          p_security_level?: string
          p_subject_id?: string
          p_subject_type?: string
          p_subject_user_id?: string
          p_success?: boolean
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_consent: {
        Args: {
          p_consent_text: string
          p_consent_type: Database["public"]["Enums"]["consent_type"]
          p_consent_version: string
          p_consented: boolean
          p_ip_address?: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_honor_code_acceptance: {
        Args: {
          p_attempt_id?: string
          p_context: string
          p_honor_code_text: string
          p_ip_address?: unknown
          p_quiz_id?: string
          p_signature_data?: string
          p_signature_type?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      process_all_reminders: {
        Args: never
        Returns: {
          bookings_processed: number
          emails_queued: number
          reminder_type: string
        }[]
      }
      promote_user: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          target_user_id: string
        }
        Returns: Json
      }
      queue_24h_reminders: {
        Args: never
        Returns: {
          booking_id: string
          exam_time: string
          queued: boolean
          recipient_email: string
        }[]
      }
      queue_48h_reminders: {
        Args: never
        Returns: {
          booking_id: string
          exam_time: string
          queued: boolean
          recipient_email: string
        }[]
      }
      queue_email: {
        Args: {
          p_priority?: number
          p_recipient_email: string
          p_recipient_name: string
          p_related_entity_id?: string
          p_related_entity_type?: string
          p_scheduled_for?: string
          p_template_data: Json
          p_template_name: string
        }
        Returns: string
      }
      reactivate_admin_user: {
        Args: { p_admin_user_id: string }
        Returns: boolean
      }
      reject_identity_verification: {
        Args: {
          p_admin_notes?: string
          p_rejection_reason: string
          p_verification_id: string
        }
        Returns: boolean
      }
      sync_from_wordpress: {
        Args: {
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_organization?: string
          p_wp_user_id: number
        }
        Returns: Json
      }
      unassign_voucher: { Args: { p_voucher_id: string }; Returns: boolean }
      update_certificate_url: {
        Args: { p_certificate_url: string; p_credential_id: string }
        Returns: boolean
      }
      upsert_role_mapping: {
        Args: {
          p_priority?: number
          p_supabase_role: Database["public"]["Enums"]["user_role"]
          p_wordpress_role: string
          p_wordpress_role_display: string
        }
        Returns: Json
      }
      upsert_user_account: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_password: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_wp_user_id?: number
        }
        Returns: Json
      }
      validate_program_id: {
        Args: { p_program_id: string }
        Returns: {
          is_valid: boolean
          max_credits: number
          program_name: string
        }[]
      }
      verify_certificate: {
        Args: { p_credential_id: string }
        Returns: {
          certification_type: string
          expiry_date: string
          holder_name: string
          is_valid: boolean
          issued_date: string
          message: string
          status: string
        }[]
      }
    }
    Enums: {
      admin_role_type:
        | "super_admin"
        | "certification_manager"
        | "partner_manager"
        | "pdc_manager"
        | "content_manager"
        | "finance_admin"
        | "support_admin"
        | "read_only_reviewer"
      audit_event_type:
        | "user_login"
        | "user_logout"
        | "user_registered"
        | "password_changed"
        | "email_changed"
        | "profile_updated"
        | "identity_verification_submitted"
        | "identity_verification_approved"
        | "identity_verification_rejected"
        | "consent_accepted"
        | "consent_withdrawn"
        | "honor_code_accepted"
        | "exam_registered"
        | "exam_access_granted"
        | "exam_access_denied"
        | "exam_launched"
        | "exam_started"
        | "exam_paused"
        | "exam_resumed"
        | "exam_submitted"
        | "exam_auto_submitted"
        | "exam_terminated"
        | "answer_saved"
        | "answer_changed"
        | "answer_submitted"
        | "exam_graded"
        | "exam_passed"
        | "exam_failed"
        | "certificate_issued"
        | "certificate_revoked"
        | "certificate_downloaded"
        | "suspicious_activity_detected"
        | "exam_violation_logged"
        | "session_timeout"
        | "multiple_login_attempt"
        | "unauthorized_access_attempt"
        | "admin_user_modified"
        | "admin_exam_modified"
        | "admin_certificate_issued"
        | "admin_certificate_revoked"
        | "admin_verification_reviewed"
        | "system_error"
        | "data_export_requested"
        | "data_deleted"
        | "certificate_generated"
      certification_type: "CP" | "SCP"
      consent_type:
        | "terms_of_use"
        | "privacy_policy"
        | "exam_code_of_conduct"
        | "data_processing"
        | "marketing_communications"
      difficulty_level: "easy" | "medium" | "hard"
      exam_booking_status:
        | "scheduled"
        | "rescheduled"
        | "cancelled"
        | "no_show"
        | "completed"
        | "expired"
      exam_category:
        | "cp"
        | "scp"
        | "general"
        | "pre_assessment"
        | "post_assessment"
        | "competency_assessment"
      exam_difficulty: "easy" | "medium" | "hard"
      exam_question_type: "single_choice" | "multiple_choice"
      membership_status: "active" | "expired" | "cancelled" | "suspended"
      membership_type: "basic" | "professional"
      mock_exam_language: "en" | "ar"
      pdc_activity_type:
        | "training_course"
        | "conference"
        | "workshop"
        | "webinar"
        | "self_study"
        | "teaching"
        | "publication"
        | "volunteer_work"
        | "other"
      pdc_status: "pending" | "approved" | "rejected" | "expired"
      pdp_guideline_category:
        | "policy"
        | "template"
        | "guide"
        | "logo"
        | "format"
      question_type: "multiple_choice" | "true_false" | "multi_select"
      ticket_category:
        | "certification"
        | "exam"
        | "pdc"
        | "account"
        | "partnership"
        | "technical"
        | "other"
      ticket_priority: "low" | "normal" | "high"
      ticket_status:
        | "new"
        | "in_progress"
        | "waiting_user"
        | "resolved"
        | "closed"
      user_role:
        | "individual"
        | "admin"
        | "ecp"
        | "pdp"
        | "super_admin"
        | "ecp_partner"
        | "pdp_partner"
      voucher_request_status:
        | "pending"
        | "approved"
        | "paid"
        | "fulfilled"
        | "cancelled"
        | "refunded"
      voucher_status:
        | "available"
        | "assigned"
        | "used"
        | "expired"
        | "cancelled"
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
      admin_role_type: [
        "super_admin",
        "certification_manager",
        "partner_manager",
        "pdc_manager",
        "content_manager",
        "finance_admin",
        "support_admin",
        "read_only_reviewer",
      ],
      audit_event_type: [
        "user_login",
        "user_logout",
        "user_registered",
        "password_changed",
        "email_changed",
        "profile_updated",
        "identity_verification_submitted",
        "identity_verification_approved",
        "identity_verification_rejected",
        "consent_accepted",
        "consent_withdrawn",
        "honor_code_accepted",
        "exam_registered",
        "exam_access_granted",
        "exam_access_denied",
        "exam_launched",
        "exam_started",
        "exam_paused",
        "exam_resumed",
        "exam_submitted",
        "exam_auto_submitted",
        "exam_terminated",
        "answer_saved",
        "answer_changed",
        "answer_submitted",
        "exam_graded",
        "exam_passed",
        "exam_failed",
        "certificate_issued",
        "certificate_revoked",
        "certificate_downloaded",
        "suspicious_activity_detected",
        "exam_violation_logged",
        "session_timeout",
        "multiple_login_attempt",
        "unauthorized_access_attempt",
        "admin_user_modified",
        "admin_exam_modified",
        "admin_certificate_issued",
        "admin_certificate_revoked",
        "admin_verification_reviewed",
        "system_error",
        "data_export_requested",
        "data_deleted",
        "certificate_generated",
      ],
      certification_type: ["CP", "SCP"],
      consent_type: [
        "terms_of_use",
        "privacy_policy",
        "exam_code_of_conduct",
        "data_processing",
        "marketing_communications",
      ],
      difficulty_level: ["easy", "medium", "hard"],
      exam_booking_status: [
        "scheduled",
        "rescheduled",
        "cancelled",
        "no_show",
        "completed",
        "expired",
      ],
      exam_category: [
        "cp",
        "scp",
        "general",
        "pre_assessment",
        "post_assessment",
        "competency_assessment",
      ],
      exam_difficulty: ["easy", "medium", "hard"],
      exam_question_type: ["single_choice", "multiple_choice"],
      membership_status: ["active", "expired", "cancelled", "suspended"],
      membership_type: ["basic", "professional"],
      mock_exam_language: ["en", "ar"],
      pdc_activity_type: [
        "training_course",
        "conference",
        "workshop",
        "webinar",
        "self_study",
        "teaching",
        "publication",
        "volunteer_work",
        "other",
      ],
      pdc_status: ["pending", "approved", "rejected", "expired"],
      pdp_guideline_category: ["policy", "template", "guide", "logo", "format"],
      question_type: ["multiple_choice", "true_false", "multi_select"],
      ticket_category: [
        "certification",
        "exam",
        "pdc",
        "account",
        "partnership",
        "technical",
        "other",
      ],
      ticket_priority: ["low", "normal", "high"],
      ticket_status: [
        "new",
        "in_progress",
        "waiting_user",
        "resolved",
        "closed",
      ],
      user_role: [
        "individual",
        "admin",
        "ecp",
        "pdp",
        "super_admin",
        "ecp_partner",
        "pdp_partner",
      ],
      voucher_request_status: [
        "pending",
        "approved",
        "paid",
        "fulfilled",
        "cancelled",
        "refunded",
      ],
      voucher_status: ["available", "assigned", "used", "expired", "cancelled"],
    },
  },
} as const
