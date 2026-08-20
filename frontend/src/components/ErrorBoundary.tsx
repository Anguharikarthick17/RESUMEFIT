import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — catches runtime errors in 3D scenes or any child component.
 * Prevents the entire app from going blank.
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
    console.error('[ResumeFit] ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
          <div
            className="rounded-xl p-4 text-center"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            <div className="text-red-400 text-xs font-mono mb-1">3D Scene Error</div>
            <div className="text-white/40 text-xs">
              {this.state.error?.message ?? 'Component failed to render'}
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
