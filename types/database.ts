export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "approval_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance_records: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          id: string
          notes: string | null
          overtime_hours: number | null
          site_id: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          work_date: string
          work_hours: number | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          work_date: string
          work_hours?: number | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          work_date?: string
          work_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "daily_report_workers_daily_report_id_fkey"
            columns: ["daily_report_id"]
            isOneToOne: false
            referencedRelation: "daily_reports"
            referencedColumns: ["id"]
          }
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
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_shared_with_id_fkey"
            columns: ["shared_with_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "documents_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          address: string | null
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
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
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
          phone?: string | null
          role?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "salary_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "site_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      sites: {
        Row: {
          accommodation_address: string | null
          accommodation_name: string | null
          address: string
          construction_manager_phone: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          safety_manager_phone: string | null
          start_date: string
          status: string | null
          updated_at: string
        }
        Insert: {
          accommodation_address?: string | null
          accommodation_name?: string | null
          address: string
          construction_manager_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          safety_manager_phone?: string | null
          start_date: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          accommodation_address?: string | null
          accommodation_name?: string | null
          address?: string
          construction_manager_phone?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          safety_manager_phone?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_organizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
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