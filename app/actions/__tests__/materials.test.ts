/**
 * Unit Tests for Material Actions
 */

import {
  getMaterials,
  getMaterialCategories,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialStock,
  updateMaterialStock,
  createMaterialRequest,
  approveMaterialRequest,
} from '../materials'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Material Actions', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup mock Supabase client
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'test@example.com' } },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
      })),
      rpc: jest.fn(),
    }
    
    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('getMaterials', () => {
    it('should fetch all active materials with categories', async () => {
      const mockMaterials = [
        {
          id: 'mat-1',
          code: 'MAT001',
          name: 'Concrete',
          unit: 'm³',
          category: { id: 'cat-1', name: 'Building Materials' },
        },
        {
          id: 'mat-2',
          code: 'MAT002',
          name: 'Steel Rebar',
          unit: 'ton',
          category: { id: 'cat-2', name: 'Metal' },
        },
      ]

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockMaterials,
        error: null,
      })

      const result = await getMaterials()

      expect(result).toEqual({ success: true, data: mockMaterials })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('materials')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('is_active', true)
      expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('name')
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getMaterials()

      expect(result).toEqual({
        success: false,
        error: '자재 목록을 불러오는데 실패했습니다.',
      })
    })
  })

  describe('getMaterialCategories', () => {
    it('should fetch all material categories', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Building Materials' },
        { id: 'cat-2', name: 'Metal' },
        { id: 'cat-3', name: 'Electrical' },
      ]

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockCategories,
        error: null,
      })

      const result = await getMaterialCategories()

      expect(result).toEqual({ success: true, data: mockCategories })
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('material_categories')
      expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('name')
    })
  })

  describe('createMaterial', () => {
    const mockMaterialData = {
      code: 'MAT003',
      name: 'Cement',
      category_id: 'cat-1',
      unit: 'bag',
      specification: '50kg Portland Cement',
      manufacturer: 'Cement Co.',
      min_stock_level: 100,
      max_stock_level: 1000,
      unit_price: 10.50,
    }

    it('should create a new material successfully', async () => {
      const mockCreatedMaterial = { id: 'mat-3', ...mockMaterialData }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockCreatedMaterial,
        error: null,
      })

      const result = await createMaterial(mockMaterialData)

      expect(result).toEqual({ success: true, data: mockCreatedMaterial })
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(mockMaterialData)
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/materials')
    })

    it('should handle duplicate material code', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { 
          message: 'duplicate key value violates unique constraint',
          code: '23505',
        },
      })

      const result = await createMaterial(mockMaterialData)

      expect(result).toEqual({
        success: false,
        error: '자재 생성에 실패했습니다.',
      })
    })

    it('should validate required fields', async () => {
      const invalidData = {
        code: '',
        name: '',
        unit: '',
      }

      const result = await createMaterial(invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('updateMaterial', () => {
    it('should update an existing material', async () => {
      const materialId = 'mat-1'
      const updateData = {
        name: 'Updated Concrete',
        unit_price: 12.00,
      }
      const updatedMaterial = { id: materialId, ...updateData }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: updatedMaterial,
        error: null,
      })

      const result = await updateMaterial(materialId, updateData)

      expect(result).toEqual({ success: true, data: updatedMaterial })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(String),
      })
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/materials')
    })
  })

  describe('deleteMaterial', () => {
    it('should soft delete a material', async () => {
      const materialId = 'mat-1'

      mockSupabaseClient.from().single.mockResolvedValue({
        data: { id: materialId, is_active: false },
        error: null,
      })

      const result = await deleteMaterial(materialId)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        is_active: false,
        updated_at: expect.any(String),
      })
    })

    it('should check for existing stock before deletion', async () => {
      const materialId = 'mat-1'

      // Check stock
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: { material_id: materialId, quantity: 100 },
        error: null,
      })

      const result = await deleteMaterial(materialId)

      expect(result).toEqual({
        success: false,
        error: '재고가 있는 자재는 삭제할 수 없습니다.',
      })
    })
  })

  describe('getMaterialStock', () => {
    it('should fetch material stock for a site', async () => {
      const mockStock = [
        {
          id: 'stock-1',
          material_id: 'mat-1',
          material: { name: 'Concrete', unit: 'm³' },
          quantity: 500,
          site_id: 'site-123',
        },
        {
          id: 'stock-2',
          material_id: 'mat-2',
          material: { name: 'Steel', unit: 'ton' },
          quantity: 50,
          site_id: 'site-123',
        },
      ]

      mockSupabaseClient.from().select.mockResolvedValue({
        data: mockStock,
        error: null,
      })

      const result = await getMaterialStock('site-123')

      expect(result).toEqual({ success: true, data: mockStock })
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('site_id', 'site-123')
    })

    it('should filter by material if provided', async () => {
      const mockStock = {
        id: 'stock-1',
        material_id: 'mat-1',
        quantity: 500,
      }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockStock,
        error: null,
      })

      const result = await getMaterialStock('site-123', 'mat-1')

      expect(result).toEqual({ success: true, data: mockStock })
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('material_id', 'mat-1')
    })
  })

  describe('updateMaterialStock', () => {
    it('should update material stock quantity', async () => {
      const stockData = {
        site_id: 'site-123',
        material_id: 'mat-1',
        quantity: 600,
        transaction_type: 'incoming' as const,
        reference_number: 'PO-2025-001',
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true, new_quantity: 600 },
        error: null,
      })

      const result = await updateMaterialStock(stockData)

      expect(result).toEqual({ success: true, data: { success: true, new_quantity: 600 } })
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('update_material_stock', stockData)
    })

    it('should handle insufficient stock for outgoing transactions', async () => {
      const stockData = {
        site_id: 'site-123',
        material_id: 'mat-1',
        quantity: 1000,
        transaction_type: 'outgoing' as const,
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Insufficient stock' },
      })

      const result = await updateMaterialStock(stockData)

      expect(result).toEqual({
        success: false,
        error: '재고 업데이트에 실패했습니다.',
      })
    })
  })

  describe('createMaterialRequest', () => {
    it('should create a material request', async () => {
      const requestData = {
        site_id: 'site-123',
        material_id: 'mat-1',
        quantity: 100,
        required_date: '2025-09-01',
        purpose: 'Foundation work',
      }

      const mockRequest = { id: 'req-1', ...requestData, status: 'pending' }

      mockSupabaseClient.from().single.mockResolvedValue({
        data: mockRequest,
        error: null,
      })

      const result = await createMaterialRequest(requestData)

      expect(result).toEqual({ success: true, data: mockRequest })
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith({
        ...requestData,
        requested_by: 'user-123',
        status: 'pending',
      })
    })
  })

  describe('approveMaterialRequest', () => {
    it('should approve a material request and update stock', async () => {
      const requestId = 'req-1'
      
      // Get request details
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: {
          id: requestId,
          material_id: 'mat-1',
          quantity: 100,
          site_id: 'site-123',
        },
        error: null,
      })

      // Update request status
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: { id: requestId, status: 'approved' },
        error: null,
      })

      // Update stock
      mockSupabaseClient.rpc.mockResolvedValue({
        data: { success: true },
        error: null,
      })

      const result = await approveMaterialRequest(requestId)

      expect(result).toEqual({ success: true })
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        status: 'approved',
        approved_by: 'user-123',
        approved_at: expect.any(String),
      })
    })

    it('should handle request not found', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await approveMaterialRequest('non-existent')

      expect(result).toEqual({
        success: false,
        error: '자재 요청을 찾을 수 없습니다.',
      })
    })

    it('should reject already processed requests', async () => {
      mockSupabaseClient.from().single.mockResolvedValue({
        data: { id: 'req-1', status: 'approved' },
        error: null,
      })

      const result = await approveMaterialRequest('req-1')

      expect(result).toEqual({
        success: false,
        error: '이미 처리된 요청입니다.',
      })
    })
  })
})