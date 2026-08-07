'use client'

import { createContext, useContext, useReducer } from 'react'
import type {
  BuilderState, BuilderAction, BuilderStep, BuilderMode,
  MetaPlatform, SelectedProduct, CampaignStrategy, BuilderSession,
  GeneratedCreative, BrandKit, ProductMode, ProductImageMode,
} from './types'

const initialState: BuilderState = {
  step: 1,
  // Navigation
  maxUnlockedStep: 1,
  lastCompletedStep: 0,
  hasPendingRegeneration: false,
  // Session metadata
  sessionId: null,
  isSaving: false,
  lastSaved: null,
  // Step 1
  productMode: null,
  selectedProduct: null,
  productName: '',
  productDescription: '',
  productCategory: '',
  productImageMode: null,
  // Step 2
  dailyBudget: '',
  currency: 'USD',
  totalBudget: '',
  // Step 3
  country: '',
  city: '',
  radius: '20',
  // Step 4
  platforms: [],
  // Step 5
  aiStrategy: null,
  // Step 7
  generatedCreatives: [],
  brandKit: null,
  selectedCreativeId: null,
  // UX mode
  builderMode: 'auto' as BuilderMode,
}

function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case 'NEXT_STEP': {
      const next = Math.min(state.step + 1, 8) as BuilderStep
      return {
        ...state,
        step: next,
        maxUnlockedStep: Math.max(state.maxUnlockedStep, next) as BuilderStep,
        lastCompletedStep: Math.max(state.lastCompletedStep, state.step),
      }
    }
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) as BuilderStep }
    case 'GO_TO_STEP': {
      const target = action.payload
      // When auto-advancing (e.g. step 5→7), mark all intermediate steps as completed
      const newLastCompleted = target > state.step
        ? Math.max(state.lastCompletedStep, target - 1)
        : state.lastCompletedStep
      return {
        ...state,
        step: target,
        maxUnlockedStep: Math.max(state.maxUnlockedStep, target) as BuilderStep,
        lastCompletedStep: newLastCompleted,
      }
    }
    case 'SET_PRODUCT_MODE':
      return {
        ...state,
        productMode: action.payload,
        selectedProduct: null,
        productImageMode: null,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_PRODUCT_IMAGE_MODE':
      return { ...state, productImageMode: action.payload as ProductImageMode | null }
    case 'SET_SELECTED_PRODUCT':
      return {
        ...state,
        selectedProduct: action.payload as SelectedProduct,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_PRODUCT_NAME':
      return {
        ...state,
        productName: action.payload,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_PRODUCT_DESCRIPTION':
      return { ...state, productDescription: action.payload }
    case 'SET_PRODUCT_CATEGORY':
      return { ...state, productCategory: action.payload }
    case 'SET_DAILY_BUDGET':
      return {
        ...state,
        dailyBudget: action.payload,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_CURRENCY':
      return {
        ...state,
        currency: action.payload,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_TOTAL_BUDGET':
      return {
        ...state,
        totalBudget: action.payload,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_COUNTRY':
      return {
        ...state,
        country: action.payload,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_CITY':
      return {
        ...state,
        city: action.payload,
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    case 'SET_RADIUS':
      return { ...state, radius: action.payload }
    case 'TOGGLE_PLATFORM': {
      const id = action.payload as MetaPlatform
      return {
        ...state,
        platforms: state.platforms.includes(id)
          ? state.platforms.filter((p) => p !== id)
          : [...state.platforms, id],
        hasPendingRegeneration: state.aiStrategy !== null,
      }
    }
    case 'SET_PLATFORMS':
      return { ...state, platforms: action.payload as MetaPlatform[] }
    case 'SET_AI_STRATEGY':
      return { ...state, aiStrategy: action.payload as CampaignStrategy, hasPendingRegeneration: false }
    case 'SET_GENERATED_CREATIVES':
      return { ...state, generatedCreatives: action.payload as GeneratedCreative[] }
    case 'SET_BRAND_KIT':
      return { ...state, brandKit: action.payload as BrandKit }
    case 'SET_SELECTED_CREATIVE':
      return { ...state, selectedCreativeId: action.payload }
    case 'EDIT_CREATIVE':
      return {
        ...state,
        generatedCreatives: state.generatedCreatives.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c,
        ),
      }
    case 'REGENERATE_CREATIVE_IMAGE':
      return {
        ...state,
        generatedCreatives: state.generatedCreatives.map((c) =>
          c.id === action.payload.id ? { ...c, imageUrl: action.payload.imageUrl } : c,
        ),
      }
    case 'LOAD_SESSION': {
      const s = action.payload as BuilderSession

      // Navigation state: use persisted DB values when available (migration 013+).
      // Fall back to derivation for sessions created before the migration.
      const dbMax = s.max_unlocked_step ?? 1
      const dbLastCompleted = s.last_completed_step ?? 0
      let effectiveMax = dbMax

      if (effectiveMax <= 1 && s.current_step > 1) {
        // Pre-013 session: derive maxUnlockedStep from existing data
        let derived: number = s.current_step
        if (s.budget?.dailyBudget) derived = Math.max(derived, 2)
        if (s.destination?.country) derived = Math.max(derived, 3)
        if ((s.platforms ?? []).length > 0) derived = Math.max(derived, 4)
        if (s.ai_strategy) derived = Math.max(derived, 6)
        if ((s.creatives ?? []).length > 0) derived = Math.max(derived, 7)
        if (s.selected_creative_id) derived = Math.max(derived, 8)
        effectiveMax = Math.min(derived, 8)
      }

      const effectiveLastCompleted = dbLastCompleted > 0
        ? dbLastCompleted
        : Math.max(0, effectiveMax - 1)

      return {
        ...state,
        sessionId: s.id,
        step: s.current_step,
        // Navigation state — source of truth is the DB
        maxUnlockedStep: effectiveMax as BuilderStep,
        lastCompletedStep: effectiveLastCompleted,
        hasPendingRegeneration: s.has_pending_regeneration ?? false,
        // Builder settings
        builderMode: (s.builder_mode as BuilderMode | null) ?? 'auto',
        // Product state
        productMode: (s.product_mode as ProductMode | null)
          ?? (s.selected_product ? 'existing' : null),
        productImageMode: (s.product_image_mode as ProductImageMode | null) ?? null,
        selectedProduct: s.selected_product,
        // Campaign data
        dailyBudget: s.budget?.dailyBudget ?? '',
        currency: s.budget?.currency ?? 'USD',
        totalBudget: s.budget?.totalBudget ?? '',
        country: s.destination?.country ?? '',
        city: s.destination?.city ?? '',
        radius: s.destination?.radius ?? '20',
        platforms: s.platforms ?? [],
        aiStrategy: s.ai_strategy,
        generatedCreatives: s.creatives ?? [],
        brandKit: s.brand_kit ?? null,
        selectedCreativeId: s.selected_creative_id ?? null,
      }
    }
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    case 'MARK_SAVED':
      return { ...state, isSaving: false, lastSaved: action.payload }
    case 'SET_BUILDER_MODE':
      return { ...state, builderMode: action.payload as BuilderMode }
    case 'SET_PENDING_REGENERATION':
      return { ...state, hasPendingRegeneration: action.payload }
    case 'RESET':
      return { ...initialState, builderMode: state.builderMode }
    default:
      return state
  }
}

interface CampaignBuilderContextValue {
  state: BuilderState
  dispatch: React.Dispatch<BuilderAction>
}

const CampaignBuilderContext = createContext<CampaignBuilderContextValue | null>(null)

export function CampaignBuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, initialState)
  return (
    <CampaignBuilderContext.Provider value={{ state, dispatch }}>
      {children}
    </CampaignBuilderContext.Provider>
  )
}

export function useCampaignBuilder() {
  const ctx = useContext(CampaignBuilderContext)
  if (!ctx) throw new Error('useCampaignBuilder must be used inside CampaignBuilderProvider')
  return ctx
}
