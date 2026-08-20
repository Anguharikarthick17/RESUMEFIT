import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  title?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — catches runtime errors in sub-components.
 * Prevents the entire page from crashing.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ResumeFit] ErrorBoundary caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex items-center justify-center w-full p-6 my-4 rounded-xl bg-[#F8F8F7] border border-[#E5E5E5] text-center">
          <div className="space-y-1.5 max-w-md mx-auto">
            <div className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
              {this.props.title || 'Component Notice'}
            </div>
            <div className="text-xs text-[#666666]">
              {this.state.error?.message ?? 'Component temporarily unavailable.'}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
