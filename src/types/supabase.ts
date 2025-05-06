export type Database = {
  public: {
    Tables: {
      Calculation: {
        Row: {
          id: string
          createdAt: string
          updatedAt: string
          initialAmount: number
          finalAmount: number
          currencyCode: string
          title: string | null
          userId: string | null
        }
        Insert: {
          id?: string
          createdAt?: string
          updatedAt?: string
          initialAmount: number
          finalAmount: number
          currencyCode?: string
          title?: string | null
          userId?: string | null
        }
        Update: {
          id?: string
          createdAt?: string
          updatedAt?: string
          initialAmount?: number
          finalAmount?: number
          currencyCode?: string
          title?: string | null
          userId?: string | null
        }
      }
      CalculationStep: {
        Row: {
          id: string
          calculationId: string
          order: number
          description: string
          calculationDetails: string
          resultIntermediate: number
          resultRunningTotal: number
          explanation: string | null
          stepType: string
        }
        Insert: {
          id?: string
          calculationId: string
          order: number
          description: string
          calculationDetails: string
          resultIntermediate: number
          resultRunningTotal: number
          explanation?: string | null
          stepType: string
        }
        Update: {
          id?: string
          calculationId?: string
          order?: number
          description?: string
          calculationDetails?: string
          resultIntermediate?: number
          resultRunningTotal?: number
          explanation?: string | null
          stepType?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 