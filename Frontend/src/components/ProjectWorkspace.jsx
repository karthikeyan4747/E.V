import React, { useState, useEffect, useRef } from 'react'
import { 
  FolderTree, 
  Folder, 
  File, 
  FileCode, 
  Search, 
  Save, 
  FolderGit2, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  FileText,
  Check,
  Code,
  AlertCircle,
  FolderOpen,
  ArrowRight,
  Sparkles,
  Upload,
  FolderPlus,
  FilePlus,
  Compass
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function ProjectWorkspace({ onWorkspaceChange }) {
  const [treeData, setTreeData] = useState(null)
  const [currentFolder, setCurrentFolder] = useState('')
  const [folderInput, setFolderInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [expandedFolders, setExpandedFolders] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [localFileMap, setLocalFileMap] = useState({})

  const folderPickerRef = useRef(null)
  const filePickerRef = useRef(null)

  const quickBookmarks = [
    { label: 'EV Workspace', path: 'c:\\Users\\Karthikeyan K\\Desktop\\EV' },
    { label: 'Backend', path: 'c:\\Users\\Karthikeyan K\\Desktop\\EV\\Backend' },
    { label: 'Frontend', path: 'c:\\Users\\Karthikeyan K\\Desktop\\EV\\Frontend' },
  ]

  const loadBackendTree = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await sovereignAPI.getWorkspaceTree()
      setTreeData(data.tree)
      setCurrentFolder(data.root_path)
      setFolderInput(data.root_path)
      setLocalFileMap({})
      if (onWorkspaceChange) {
        onWorkspaceChange(data.name || data.root_path)
      }
    } catch (err) {
      console.error('Failed to load workspace tree', err)
      setError(err.response?.data?.detail || err.message || 'Failed to load tree')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBackendTree()
  }, [])

  const handleOpenFolderByPath = async (targetPath) => {
    const pathToOpen = targetPath || folderInput
    if (!pathToOpen || !pathToOpen.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await sovereignAPI.setWorkspaceFolder(pathToOpen.trim())
      setFolderInput(res.workspace_path)
      setCurrentFolder(res.workspace_path)
      setSelectedFile(null)
      setFileContent('')
      setLocalFileMap({})
      await loadBackendTree()
      if (onWorkspaceChange) {
        onWorkspaceChange(res.name)
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || err.message || `Could not open folder "${pathToOpen}"`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle native folder picker dialog
  const handleNativeFolderSelect = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const firstRelPath = files[0].webkitRelativePath || ''
      const rootFolderName = firstRelPath ? firstRelPath.split('/')[0] : 'Selected_Folder'
      
      const fileMap = {}
      const rootNode = {
        name: rootFolderName,
        path: rootFolderName,
        is_dir: true,
        children: []
      }

      const insertPath = (relPath, fileObj) => {
        const parts = relPath.split('/')
        let current = rootNode
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i]
          const isFile = (i === parts.length - 1)
          if (isFile) {
            current.children.push({
              name: part,
              path: relPath,
              is_dir: false,
              size_bytes: fileObj.size,
              extension: '.' + part.split('.').pop().toLowerCase(),
              fileObj: fileObj
            })
          } else {
            let childDir = current.children.find(c => c.is_dir && c.name === part)
            if (!childDir) {
              childDir = {
                name: part,
                path: parts.slice(0, i + 1).join('/'),
                is_dir: true,
                children: []
              }
              current.children.push(childDir)
            }
            current = childDir
          }
        }
      }

      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        const rel = f.webkitRelativePath || f.name
        fileMap[rel] = f
        if (f.webkitRelativePath) {
          insertPath(f.webkitRelativePath, f)
        } else {
          rootNode.children.push({
            name: f.name,
            path: f.name,
            is_dir: false,
            size_bytes: f.size,
            extension: '.' + f.name.split('.').pop().toLowerCase(),
            fileObj: f
          })
        }
      }

      setLocalFileMap(fileMap)
      setTreeData(rootNode)
      setCurrentFolder(rootFolderName)
      setFolderInput(rootFolderName)
      setSelectedFile(null)
      setFileContent('')
      if (onWorkspaceChange) {
        onWorkspaceChange(rootFolderName)
      }
    } catch (err) {
      console.error(err)
      setError('Could not process selected folder: ' + err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle native file selection dialog
  const handleNativeFilesSelect = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileMap = { ...localFileMap }
    const children = []

    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      fileMap[f.name] = f
      children.push({
        name: f.name,
        path: f.name,
        is_dir: false,
        size_bytes: f.size,
        extension: '.' + f.name.split('.').pop().toLowerCase(),
        fileObj: f
      })
    }

    const rootNode = {
      name: 'Imported Files',
      path: 'imported_files',
      is_dir: true,
      children: children
    }

    setLocalFileMap(fileMap)
    setTreeData(rootNode)
    setCurrentFolder('Imported Files')
    setFolderInput('Imported Files')
    setSelectedFile(null)
    setFileContent('')
    if (onWorkspaceChange) {
      onWorkspaceChange('Imported Files')
    }
  }

  const handleSelectFile = async (node) => {
    try {
      setError(null)
      // Check if it is a browser-selected local fileObj
      if (node.fileObj) {
        const text = await node.fileObj.text()
        setSelectedFile({
          filename: node.name,
          path: node.path,
          size_bytes: node.size_bytes,
          content: text
        })
        setFileContent(text)
        setIsSaved(false)
        return
      }

      // Check in localFileMap
      if (localFileMap[node.path]) {
        const text = await localFileMap[node.path].text()
        setSelectedFile({
          filename: node.name,
          path: node.path,
          size_bytes: node.size_bytes,
          content: text
        })
        setFileContent(text)
        setIsSaved(false)
        return
      }

      // Fetch from backend workspace
      const data = await sovereignAPI.readWorkspaceFile(node.path || node)
      setSelectedFile(data)
      setFileContent(data.content)
      setIsSaved(false)
    } catch (err) {
      setError('Could not read file: ' + (err.response?.data?.detail || err.message))
    }
  }

  const handleSaveFile = async () => {
    if (!selectedFile) return
    setIsSaving(true)
    try {
      // If backend file path, persist to disk
      if (!localFileMap[selectedFile.path]) {
        await sovereignAPI.writeWorkspaceFile(selectedFile.path, fileContent)
      }
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2500)
    } catch (err) {
      setError('Failed to save file: ' + (err.response?.data?.detail || err.message))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    try {
      const res = await sovereignAPI.searchWorkspace(searchQuery)
      setSearchResults(res.results || [])
    } catch (err) {
      console.error(err)
    }
  }

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }))
  }

  // Recursive Tree Node Renderer
  const renderTreeNode = (node, depth = 0) => {
    if (!node) return null
    const isExpanded = expandedFolders[node.path] ?? (depth < 1)

    if (node.is_dir) {
      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-xs text-slate-300 font-mono"
            style={{ paddingLeft: `${depth * 14 + 6}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <Folder className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>
          {isExpanded && node.children?.map(child => renderTreeNode(child, depth + 1))}
        </div>
      )
    }

    const isSelected = selectedFile?.path === node.path
    return (
      <div
        key={node.path}
        onClick={() => handleSelectFile(node)}
        className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer text-xs font-mono transition ${
          isSelected ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
      >
        <FileCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="truncate">{node.name}</span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c101b]">
      {/* Hidden File / Folder inputs for native OS dialogs */}
      <input
        ref={folderPickerRef}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleNativeFolderSelect}
        className="hidden"
      />
      <input
        ref={filePickerRef}
        type="file"
        multiple
        onChange={handleNativeFilesSelect}
        className="hidden"
      />

      {/* Top Bar for Project Workspace */}
      <div className="p-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0e1424]/60">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Native OS Folder Select Button */}
          <button
            type="button"
            onClick={() => folderPickerRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-2 shadow-md shadow-sky-500/20"
          >
            <FolderOpen className="w-4 h-4 fill-current" />
            <span>Select Folder</span>
          </button>

          {/* Native OS Files Select Button */}
          <button
            type="button"
            onClick={() => filePickerRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition flex items-center gap-1.5 border border-slate-700"
          >
            <FilePlus className="w-3.5 h-3.5 text-sky-400" />
            <span>Select Files</span>
          </button>

          {/* Quick Bookmarks */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline ml-2">Quick:</span>
            {quickBookmarks.map((bm, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setFolderInput(bm.path)
                  handleOpenFolderByPath(bm.path)
                }}
                className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition"
              >
                {bm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Folder Path Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 max-w-sm truncate">
            <FolderGit2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate">{currentFolder || 'No folder open'}</span>
          </div>

          <button
            onClick={loadBackendTree}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Reload Workspace Tree"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-950/40 border-b border-red-800/50 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Tree & Search */}
        <div className="w-72 border-r border-slate-800 bg-[#090d16] flex flex-col shrink-0">
          {/* Document Search Box */}
          <form onSubmit={handleSearch} className="p-2 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files & symbols..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>
          </form>

          {/* Tree View or Search Results */}
          <div className="flex-1 overflow-y-auto p-2">
            {searchResults.length > 0 ? (
              <div className="space-y-1">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] font-mono text-slate-500">
                  <span>Search Matches ({searchResults.length})</span>
                  <button onClick={() => setSearchResults([])} className="hover:text-slate-300">Clear</button>
                </div>
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectFile(res.full_path)}
                    className="p-2 rounded bg-slate-900/60 hover:bg-slate-800/80 cursor-pointer text-xs font-mono border border-slate-800/50"
                  >
                    <div className="text-sky-400 font-semibold text-[11px] truncate">{res.file} (Line {res.line_number})</div>
                    <div className="text-slate-400 text-[10px] truncate mt-0.5">{res.content}</div>
                  </div>
                ))}
              </div>
            ) : treeData ? (
              <div>
                <div className="px-2 py-1 mb-1 text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Project Files</span>
                  <span className="text-sky-400 truncate max-w-[120px]">{treeData.name}</span>
                </div>
                {renderTreeNode(treeData)}
              </div>
            ) : (
              <div className="p-4 text-center text-slate-600 text-xs font-mono">
                {isLoading ? 'Loading workspace...' : 'No files selected.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: File Editor / Viewer */}
        <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono font-semibold text-slate-200">{selectedFile.filename}</span>
                  <span className="text-[10px] font-mono text-slate-500">({selectedFile.size_bytes} bytes)</span>
                </div>

                <button
                  onClick={handleSaveFile}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-mono border border-sky-500/40 transition"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSaved ? 'Saved!' : 'Save'}</span>
                </button>
              </div>

              {/* Code Textarea */}
              <div className="flex-1 p-3 overflow-hidden">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full p-3 rounded bg-transparent font-mono text-xs text-slate-200 resize-none focus:outline-none leading-relaxed"
                  spellCheck="false"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 text-center p-6">
              <FolderOpen className="w-12 h-12 text-slate-800 mb-3 stroke-1" />
              <p className="text-xs font-mono text-slate-400 font-semibold">Click "Select Folder Popup" to choose any directory</p>
              <p className="text-[11px] text-slate-600 mt-1 max-w-xs font-mono">
                Opens your native Windows Explorer file / folder selection dialog directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
