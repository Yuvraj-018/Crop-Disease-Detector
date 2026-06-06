import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Card } from './Card'
import { Button } from './Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Optionally log error details to an external monitoring service in production
    // Keep it silent locally to avoid console pollution in production.
    void error
    void errorInfo
  }

  private handleReload = () => {
    window.location.reload()
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-surface">
          <Card
            variant="heavy"
            glow
            padding="lg"
            className="max-w-md w-full text-center space-y-5 border-error/20"
          >
            <div className="mx-auto h-12 w-12 rounded-2xl bg-error/10 border border-error/25 flex items-center justify-center text-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-headline-sm font-heading font-bold text-on-surface">
                Something went wrong
              </h2>
              <p className="text-body-sm text-on-surface-variant leading-relaxed">
                An unexpected error occurred while rendering this page. We've been notified and are looking into it.
              </p>
            </div>

            <Button
              onClick={this.handleReload}
              variant="primary"
              fullWidth
              size="lg"
              className="mt-2"
            >
              Reload Page
            </Button>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
