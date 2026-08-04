'use client'

import { createContext, useContext, useReducer } from 'react'
import type {
  BuilderState, BuilderAction, BuilderStep, BuilderMode,
  MetaPlatform, SelectedProduct, CampaignStrategy, BuilderSession,
  GeneratedCreative, BrandKit,
} from './types'

const initialState: BuilderState = {
  step: 1,
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
    case 'NEXT_STEP':
      return { ...state, step: Math.min(state.step + 1, 8) as BuilderStep }
    case 'PREV_STEP':
      return { ...state, step: Math.max(state.step - 1, 1) as BuilderStep }
    case 'GO_TO_STEP':
      return { ...state, step: action.payload }
    case 'SET_PRODUCT_MODE':
      return { ...state, productMode: action.payload, selectedProduct: null }
    case 'SET_SELECTED_PRODUCT':
      return { ...state, selectedProduct: action.payload as SelectedProduct }
    case 'SET_PRODUCT_NAME':
      return { ...state, productName: action.payload }
    case 'SET_PRODUCT_DESCRIPTION':
      return { ...state, productDescription: action.payload }
    case 'SET_PRODUCT_CATEGORY':
      return { ...state, productCategory: action.payload }
    case 'SET_DAILY_BUDGET':
      return { ...state, dailyBudget: action.payload }
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload }
    case 'SET_TOTAL_BUDGET':
      return { ...state, totalBudget: action.payload }
    case 'SET_COUNTRY':
      return { ...state, country: action.payload }
    case 'SET_CITY':
      return { ...state, city: action.payload }
    case 'SET_RADIUS':
      return { ...state, radius: action.payload }
    case 'TOGGLE_PLATFORM': {
      const id = action.payload as MetaPlatform
      return {
        ...state,
        platforms: state.platforms.includes(id)
          ? state.platforms.filter((p) => p !== id)
          : [...state.platforms, id],
      }
    }
    case 'SET_AI_STRATEGY':
      return { ...state, aiStrategy: action.payload as CampaignStrategy }
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
      return {
        ...state,
        sessionId: s.id,
        step: s.current_step,
        selectedProduct: s.selected_product,
        productMode: s.selected_product ? 'existing' : null,
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
