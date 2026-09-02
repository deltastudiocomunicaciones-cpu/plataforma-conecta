export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AccessRole =
  | "superadmin"
  | "direccion"
  | "gerencia"
  | "responsable"
  | "cultura_conecta"
  | "lector";

export type ReportStatus =
  | "borrador"
  | "enviado"
  | "recibido"
  | "en_revision"
  | "aprobado"
  | "observado"
  | "ajuste_solicitado"
  | "escalado"
  | "vencido";

export type PriorityLevel = "baja" | "media" | "alta" | "critica";
export type AssignmentKind = "principal" | "transversal" | "apoyo" | "temporal";

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          status: "active" | "inactive";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          status?: "active" | "inactive";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          company_id: string;
          auth_user_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          document_id: string | null;
          access_role: AccessRole;
          position_id: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          auth_user_id?: string | null;
          full_name: string;
          email: string;
          phone?: string | null;
          document_id?: string | null;
          access_role: AccessRole;
          position_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Insert"]>;
        Relationships: [];
      };
      positions: {
        Row: {
          id: string;
          company_id: string;
          external_key: string;
          title: string;
          area: string;
          business_unit: string;
          reports_to_position_id: string | null;
          responsible_name: string | null;
          identity_document: string | null;
          phone: string | null;
          professional_profile: string | null;
          purpose: string;
          responsibilities: string[];
          activities: Json;
          kpis: string[];
          authority: string[];
          processes: string[];
          documents: string[];
          tags: string[];
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          external_key: string;
          title: string;
          area: string;
          business_unit: string;
          reports_to_position_id?: string | null;
          responsible_name?: string | null;
          identity_document?: string | null;
          phone?: string | null;
          professional_profile?: string | null;
          purpose?: string;
          responsibilities?: string[];
          activities?: Json;
          kpis?: string[];
          authority?: string[];
          processes?: string[];
          documents?: string[];
          tags?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["positions"]["Insert"]>;
        Relationships: [];
      };
      operational_fronts: {
        Row: {
          id: string;
          company_id: string;
          external_key: string;
          name: string;
          description: string | null;
          default_recipient_position_id: string | null;
          status: "active" | "inactive";
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          external_key: string;
          name: string;
          description?: string | null;
          default_recipient_position_id?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["operational_fronts"]["Insert"]>;
        Relationships: [];
      };
      user_position_assignments: {
        Row: {
          id: string;
          company_id: string;
          user_profile_id: string;
          position_id: string;
          operational_front_id: string | null;
          assignment_kind: AssignmentKind;
          label: string | null;
          report_frequency: string;
          is_primary: boolean;
          starts_at: string;
          ends_at: string | null;
          status: "active" | "inactive";
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_profile_id: string;
          position_id: string;
          operational_front_id?: string | null;
          assignment_kind?: AssignmentKind;
          label?: string | null;
          report_frequency?: string;
          is_primary?: boolean;
          starts_at?: string;
          ends_at?: string | null;
          status?: "active" | "inactive";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_position_assignments"]["Insert"]>;
        Relationships: [];
      };
      management_reports: {
        Row: {
          id: string;
          company_id: string;
          position_id: string;
          operational_front_id: string | null;
          assignment_id: string | null;
          submitted_by_profile_id: string | null;
          recipient_profile_id: string | null;
          week_label: string;
          period_start: string | null;
          period_end: string | null;
          status: ReportStatus;
          priority: PriorityLevel;
          approval_deadline: string | null;
          progress_summary: string;
          completed_tasks: string | null;
          pending_tasks: string | null;
          risks: string | null;
          decisions_required: string | null;
          next_actions: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          position_id: string;
          operational_front_id?: string | null;
          assignment_id?: string | null;
          submitted_by_profile_id?: string | null;
          recipient_profile_id?: string | null;
          week_label: string;
          period_start?: string | null;
          period_end?: string | null;
          status?: ReportStatus;
          priority?: PriorityLevel;
          approval_deadline?: string | null;
          progress_summary: string;
          completed_tasks?: string | null;
          pending_tasks?: string | null;
          risks?: string | null;
          decisions_required?: string | null;
          next_actions?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["management_reports"]["Insert"]>;
        Relationships: [];
      };
      report_evidence: {
        Row: {
          id: string;
          report_id: string;
          file_name: string;
          file_url: string;
          file_type: string | null;
          uploaded_by_profile_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          file_name: string;
          file_url: string;
          file_type?: string | null;
          uploaded_by_profile_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_evidence"]["Insert"]>;
        Relationships: [];
      };
      report_reviews: {
        Row: {
          id: string;
          report_id: string;
          reviewer_profile_id: string;
          decision: "aprobado" | "observado" | "ajuste_solicitado" | "escalado";
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          reviewer_profile_id: string;
          decision: "aprobado" | "observado" | "ajuste_solicitado" | "escalado";
          comment?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_reviews"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          company_id: string;
          recipient_profile_id: string | null;
          position_id: string | null;
          report_id: string | null;
          channel: "platform" | "email" | "whatsapp";
          status: "pending" | "sent" | "read" | "failed";
          title: string;
          body: string;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          recipient_profile_id?: string | null;
          position_id?: string | null;
          report_id?: string | null;
          channel?: "platform" | "email" | "whatsapp";
          status?: "pending" | "sent" | "read" | "failed";
          title: string;
          body: string;
          created_at?: string;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      nivelar_employee_links: {
        Row: {
          id: string;
          company_id: string;
          user_profile_id: string | null;
          position_id: string | null;
          cedula: string;
          nivelar_email: string | null;
          grupo_empleado: string | null;
          cargo_empleado: string | null;
          status: "active" | "inactive" | "pending";
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_profile_id?: string | null;
          position_id?: string | null;
          cedula: string;
          nivelar_email?: string | null;
          grupo_empleado?: string | null;
          cargo_empleado?: string | null;
          status?: "active" | "inactive" | "pending";
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["nivelar_employee_links"]["Insert"]>;
        Relationships: [];
      };
      nivelar_daily_summaries: {
        Row: {
          id: string;
          company_id: string;
          employee_link_id: string | null;
          user_profile_id: string | null;
          position_id: string | null;
          cedula: string;
          employee_name: string | null;
          employee_email: string | null;
          employee_group: string | null;
          employee_role: string | null;
          summary_date: string;
          calendar_start: string | null;
          calendar_end: string | null;
          work_start: string | null;
          work_end: string | null;
          total_connection: string | null;
          productive_time: string | null;
          unproductive_time: string | null;
          unclassified_time: string | null;
          neutral_time: string | null;
          inactivity_5_10: string | null;
          inactivity_10_15: string | null;
          inactivity_15_30: string | null;
          inactivity_30_45: string | null;
          inactivity_45_60: string | null;
          inactivity_over_60: string | null;
          dynamic_categories: Json;
          raw_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          employee_link_id?: string | null;
          user_profile_id?: string | null;
          position_id?: string | null;
          cedula: string;
          employee_name?: string | null;
          employee_email?: string | null;
          employee_group?: string | null;
          employee_role?: string | null;
          summary_date: string;
          calendar_start?: string | null;
          calendar_end?: string | null;
          work_start?: string | null;
          work_end?: string | null;
          total_connection?: string | null;
          productive_time?: string | null;
          unproductive_time?: string | null;
          unclassified_time?: string | null;
          neutral_time?: string | null;
          inactivity_5_10?: string | null;
          inactivity_10_15?: string | null;
          inactivity_15_30?: string | null;
          inactivity_30_45?: string | null;
          inactivity_45_60?: string | null;
          inactivity_over_60?: string | null;
          dynamic_categories?: Json;
          raw_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["nivelar_daily_summaries"]["Insert"]>;
        Relationships: [];
      };
      nivelar_sync_runs: {
        Row: {
          id: string;
          company_id: string | null;
          requested_by_profile_id: string | null;
          sync_scope: string;
          date_from: string | null;
          date_to: string | null;
          status: "pending" | "success" | "failed" | "skipped";
          employees_received: number;
          summaries_received: number;
          message: string | null;
          error_detail: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          requested_by_profile_id?: string | null;
          sync_scope?: string;
          date_from?: string | null;
          date_to?: string | null;
          status?: "pending" | "success" | "failed" | "skipped";
          employees_received?: number;
          summaries_received?: number;
          message?: string | null;
          error_detail?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["nivelar_sync_runs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      access_role: AccessRole;
      report_status: ReportStatus;
      priority_level: PriorityLevel;
      assignment_kind: AssignmentKind;
    };
    CompositeTypes: Record<string, never>;
  };
};
