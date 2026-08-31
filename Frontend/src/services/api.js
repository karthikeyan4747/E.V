import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 0, // Unlimited timeout for local on-premises models
})

// Sovereign API Helpers
export const sovereignAPI = {
  // Health & Models
  getHealth: () => api.get('/health').then(r => r.data),
  getModels: () => api.get('/api/models').then(r => r.data),
  getNetworkAudit: () => api.get('/api/network/audit').then(r => r.data),

  // Chat & LLM
  chat: (message, options = {}) => 
    api.post('/api/chat', {
      message,
      task_type: options.task_type || 'general',
      model: options.model || null,
      messages: options.messages || null,
      custom_workflows: options.custom_workflows || []
    }).then(r => r.data),

  // Plan Formulation with Permissions
  planAgent: (prompt, options = {}) =>
    api.post('/api/agent/plan', {
      prompt,
      workspace_path: options.workspace_path || null,
      attached_files: options.attached_files || null
    }).then(r => r.data),

  // Stop Ongoing Agent Execution
  stopAgent: () => api.post('/api/agent/stop').then(r => r.data),

  // Autonomous SSE Streaming
  streamAgent: async (payload, onEvent, onDone, onError, abortSignal) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    try {
      const response = await fetch(`${baseUrl}/api/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortSignal
      })

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() // keep remainder

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(trimmed.slice(6))
              if (onEvent) onEvent(eventData)
            } catch (err) {
              console.error('Error parsing SSE event', err, trimmed)
            }
          }
        }
      }
      if (onDone) onDone()
    } catch (err) {
      if (err.name === 'AbortError') {
        if (onEvent) onEvent({ type: 'aborted', message: 'Execution stopped by user.' })
      } else {
        if (onError) onError(err)
      }
    }
  },

  // Chat Memory
  getChatMemory: () => api.get('/api/chat/memory').then(r => r.data),
  clearChatMemory: () => api.post('/api/chat/memory/clear').then(r => r.data),

  // Council Debate
  runDebate: (message) =>
    api.post('/api/debate', { message }).then(r => r.data),

  // Content DNA Engine
  extractDNA: (formData) =>
    api.post('/api/dna/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  listDNA: () => api.get('/api/dna/list').then(r => r.data),
  getDNA: (id) => api.get(`/api/dna/${id}`).then(r => r.data),

  // Deliverables Generation
  generateDeliverables: (payload) =>
    api.post('/api/dna/generate', payload).then(r => r.data),

  listDeliverables: () => api.get('/api/deliverables/list').then(r => r.data),
  getDownloadUrl: (fileId) => `${api.defaults.baseURL || 'http://localhost:8000'}/api/deliverables/download/${fileId}`,

  // Code Sandbox
  executeSandbox: (code, timeout = 25.0) =>
    api.post('/api/sandbox/execute', { code, timeout }).then(r => r.data),

  // Project Workspace
  getWorkspaceTree: () => api.get('/api/project/tree').then(r => r.data),
  setWorkspaceFolder: (folderPath) => api.post('/api/project/set_folder', { folder_path: folderPath }).then(r => r.data),
  readWorkspaceFile: (filePath) => api.get('/api/project/read_file', { params: { file_path: filePath } }).then(r => r.data),
  writeWorkspaceFile: (filePath, content) => api.post('/api/project/write_file', { file_path: filePath, content }).then(r => r.data),
  searchWorkspace: (query) => api.get('/api/project/search', { params: { query } }).then(r => r.data),
}
