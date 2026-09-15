import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#070a12] text-slate-200">
          <div className="max-w-md w-full p-6 rounded-xl bg-slate-900 border border-red-500/30 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-bold text-red-300">Workspace UI Recovered</h2>
              <p className="text-xs text-slate-400 mt-1 font-sans">
                An unexpected interface issue occurred. You can reset the view safely.
              </p>
            </div>
            {this.state.error && (
              <div className="p-3 rounded bg-black/50 border border-slate-800 text-left font-mono text-[11px] text-red-400 max-h-28 overflow-y-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-semibold flex items-center justify-center gap-2 mx-auto transition shadow-lg shadow-sky-600/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restore Workspace</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
