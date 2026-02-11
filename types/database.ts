export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'activity_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      auth_identity_verifications: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email: string | null
          expires_at: string
          flow: 'find_id' | 'signup_status'
          id: string
          metadata: Json | null
          profile_id: string | null
          status: 'pending' | 'verified' | 'expired' | 'invalid' | 'locked'
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email?: string | null
          expires_at: string
          flow: 'find_id' | 'signup_status'
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          status?: 'pending' | 'verified' | 'expired' | 'invalid' | 'locked'
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          flow?: 'find_id' | 'signup_status'
          id?: string
          metadata?: Json | null
          profile_id?: string | null
          status?: 'pending' | 'verified' | 'expired' | 'invalid' | 'locked'
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'auth_identity_verifications_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          priority: string | null
          target_roles: string[] | null
          target_sites: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          target_roles?: string[] | null
          target_sites?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          priority?: string | null
          target_roles?: string[] | null
          target_sites?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcements_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      announcement_dispatches: {
        Row: {
          announcement_id: string
          created_at: string
          created_by: string | null
          dispatched_count: number
          dispatch_batch_id: string
          failed_count: number
          id: string
          status: string
          target_roles: string[] | null
          target_site_ids: string[] | null
          target_user_ids: string[] | null
          updated_at: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          created_by?: string | null
          dispatched_count?: number
          dispatch_batch_id?: string
          failed_count?: number
          id?: string
          status?: string
          target_roles?: string[] | null
          target_site_ids?: string[] | null
          target_user_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          created_by?: string | null
          dispatched_count?: number
          dispatch_batch_id?: string
          failed_count?: number
          id?: string
          status?: string
          target_roles?: string[] | null
          target_site_ids?: string[] | null
          target_user_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'announcement_dispatches_announcement_id_fkey'
            columns: ['announcement_id']
            isOneToOne: false
            referencedRelation: 'announcements'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'announcement_dispatches_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      approval_requests: {
        Row: {
          approved_by: string | null
          comments: string | null
          created_at: string
          entity_id: string
          id: string
          processed_at: string | null
          request_type: string
          requested_at: string
          requested_by: string | null
          status: string | null
        }
        Insert: {
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          entity_id: string
          id?: string
          processed_at?: string | null
          request_type: string
          requested_at?: string
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          approved_by?: string | null
          comments?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          processed_at?: string | null
          request_type?: string
          requested_at?: string
          requested_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'approval_requests_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'approval_requests_requested_by_fkey'
            columns: ['requested_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      daily_report_workers: {
        Row: {
          created_at: string
          daily_report_id: string | null
          id: string
          work_hours: number
          worker_name: string
        }
        Insert: {
          created_at?: string
          daily_report_id?: string | null
          id?: string
          work_hours: number
          worker_name: string
        }
        Update: {
          created_at?: string
          daily_report_id?: string | null
          id?: string
          work_hours?: number
          worker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_report_workers_daily_report_id_fkey'
            columns: ['daily_report_id']
            isOneToOne: false
            referencedRelation: 'daily_reports'
            referencedColumns: ['id']
          },
        ]
      }
      daily_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          id: string
          issues: string | null
          member_name: string
          npc1000_incoming: number | null
          npc1000_remaining: number | null
          npc1000_used: number | null
          process_type: string
          site_id: string | null
          status: string | null
          total_workers: number | null
          total_labor_hours: number | null
          updated_at: string
          work_date: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          issues?: string | null
          member_name: string
          npc1000_incoming?: number | null
          npc1000_remaining?: number | null
          npc1000_used?: number | null
          process_type: string
          site_id?: string | null
          status?: string | null
          total_workers?: number | null
          total_labor_hours?: number | null
          updated_at?: string
          work_date: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          issues?: string | null
          member_name?: string
          npc1000_incoming?: number | null
          npc1000_remaining?: number | null
          npc1000_used?: number | null
          process_type?: string
          site_id?: string | null
          status?: string | null
          total_workers?: number | null
          total_labor_hours?: number | null
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_reports_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_reports_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_reports_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string | null
          id: string
          permission: string | null
          shared_with_id: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          id?: string
          permission?: string | null
          shared_with_id?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          id?: string
          permission?: string | null
          shared_with_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'document_shares_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'document_shares_shared_with_id_fkey'
            columns: ['shared_with_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          description: string | null
          document_type: string | null
          file_name: string
          file_size: number | null
          file_url: string
          folder_path: string | null
          id: string
          is_public: boolean | null
          mime_type: string | null
          owner_id: string | null
          site_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          folder_path?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          owner_id?: string | null
          site_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          folder_path?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          owner_id?: string | null
          site_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_owner_id_fkey'
            columns: ['owner_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          phone?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          last_login_at: string | null
          login_count: number | null
          mfa_enabled: boolean | null
          mfa_enabled_at: string | null
          mfa_failed_attempts: number | null
          mfa_last_failed_at: string | null
          mfa_lock_until: string | null
          mfa_secret: string | null
          mfa_session_expires_at: string | null
          mfa_session_token: string | null
          phone: string | null
          role: string
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          last_login_at?: string | null
          login_count?: number | null
          mfa_enabled?: boolean | null
          mfa_enabled_at?: string | null
          mfa_failed_attempts?: number | null
          mfa_last_failed_at?: string | null
          mfa_lock_until?: string | null
          mfa_secret?: string | null
          mfa_session_expires_at?: string | null
          mfa_session_token?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          last_login_at?: string | null
          login_count?: number | null
          mfa_enabled?: boolean | null
          mfa_enabled_at?: string | null
          mfa_failed_attempts?: number | null
          mfa_last_failed_at?: string | null
          mfa_lock_until?: string | null
          mfa_secret?: string | null
          mfa_session_expires_at?: string | null
          mfa_session_token?: string | null
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      salary_info: {
        Row: {
          base_salary: number | null
          created_at: string
          effective_date: string
          end_date: string | null
          hourly_rate: number | null
          id: string
          overtime_rate: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          base_salary?: number | null
          created_at?: string
          effective_date: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          overtime_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          base_salary?: number | null
          created_at?: string
          effective_date?: string
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          overtime_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'salary_info_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      site_assignments: {
        Row: {
          assigned_date: string
          created_at: string
          id: string
          is_active: boolean | null
          site_id: string | null
          unassigned_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_date: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          site_id?: string | null
          unassigned_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          site_id?: string | null
          unassigned_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'site_assignments_site_id_fkey'
            columns: ['site_id']
            isOneToOne: false
            referencedRelation: 'sites'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'site_assignments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      sites: {
        Row: {
          accommodation_address: string | null
          accommodation_name: string | null
          accommodation_phone: string | null
          address: string
          organization_id: string | null
          construction_manager_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          manager_name: string | null
          manager_phone: string | null
          manager_email: string | null
          safety_manager_name: string | null
          safety_manager_phone: string | null
          safety_manager_email: string | null
          start_date: string
          status: string | null
          is_deleted: boolean | null
          updated_at: string
        }
        Insert: {
          accommodation_address?: string | null
          accommodation_name?: string | null
          accommodation_phone?: string | null
          address: string
          organization_id?: string | null
          construction_manager_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          manager_name?: string | null
          manager_phone?: string | null
          manager_email?: string | null
          safety_manager_name?: string | null
          safety_manager_phone?: string | null
          safety_manager_email?: string | null
          start_date: string
          status?: string | null
          is_deleted?: boolean | null
          updated_at?: string
        }
        Update: {
          accommodation_address?: string | null
          accommodation_name?: string | null
          accommodation_phone?: string | null
          address?: string
          organization_id?: string | null
          construction_manager_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          manager_name?: string | null
          manager_phone?: string | null
          manager_email?: string | null
          safety_manager_name?: string | null
          safety_manager_phone?: string | null
          safety_manager_email?: string | null
          start_date?: string
          status?: string | null
          is_deleted?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'sites_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          organization_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          organization_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          organization_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_organizations_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_organizations_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      work_reports: {
        Row: {
          id: string
          daily_report_id: string
          file_url: string
          created_at: string
          created_by: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          daily_report_id: string
          file_url: string
          created_at?: string
          created_by?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          daily_report_id?: string
          file_url?: string
          created_at?: string
          created_by?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'work_reports_daily_report_id_fkey'
            columns: ['daily_report_id']
            isOneToOne: true
            referencedRelation: 'daily_reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'work_reports_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      communication_overview_v: {
        Row: {
          announcement_created_at: string | null
          announcement_id: string | null
          announcement_is_active: boolean | null
          announcement_priority: string | null
          announcement_target_roles: string[] | null
          announcement_target_sites: string[] | null
          announcement_title: string | null
          dispatch_batch_id: string | null
          dispatch_created_at: string | null
          dispatch_created_by: string | null
          dispatch_id: string | null
          dispatch_status: string | null
          dispatch_target_roles: string[] | null
          dispatch_target_site_ids: string[] | null
          dispatch_target_user_ids: string[] | null
          latest_engagement_at: string | null
          latest_engagement_type: string | null
          log_body: string | null
          log_id: string | null
          log_is_starred: boolean | null
          log_notification_type: string | null
          log_sent_at: string | null
          log_status: string | null
          log_target_partner_company_id: string | null
          log_target_partner_company_name: string | null
          log_target_role: string | null
          log_target_site_id: string | null
          log_target_site_name: string | null
          log_title: string | null
          log_user_id: string | null
          profile_organization_id: string | null
          profile_partner_company_id: string | null
          profile_role: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_npc1000_shortage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      handle_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
