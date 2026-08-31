import React, { useState, useRef, useEffect } from 'react'
import { 
  Dna, 
  Upload, 
  FileText, 
  CheckSquare, 
  Square, 
  Download, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  FileCheck, 
  Building, 
  Cpu, 
  FileSpreadsheet, 
  Presentation,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  Eye,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function ContentDNAStudio({ onDeliverableGenerated, onSetInferencing }) {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [rawText, setRawText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dna, setDna] = useState(null)
  const [generatedArtifacts, setGeneratedArtifacts] = useState([])
  const [copiedDna, setCopiedDna] = useState(false)
  const [elapsedSecs, setElapsedSecs] = useState(0)
  const [extractPhase, setExtractPhase] = useState('')

  const [expandedNodes, setExpandedNodes] = useState({
    identity: true,
    overview: true,
    entities: true,
    claims: true,
    statistics: true,
    dates: false,
    events: false,
    key_findings: true,
    risks: true,
    opportunities: true,
    implications: false,
    evidence: false,
    recommendations: true,
  })

  // Deliverable Selection State
  const [selectedFormats, setSelectedFormats] = useState({
    word_docx: true,
    powerpoint_pptx: true,
    excel_xlsx: true,
    executive_summary: true,
  })

  // Generation Parameters State
  const [genParams, setGenParams] = useState({
    target_audience: 'Board of Directors & PSU Executives',
    tone: 'Formal & Rigorous',
    language: 'English',
    level_of_detail: 'Comprehensive',
    objective: 'Inspection Approval & Risk Mitigation',
    style: 'PSU / Defense Standard',
  })

  useEffect(() => {
    let interval = null
    if (isExtracting || isGenerating) {
      setElapsedSecs(0)
      interval = setInterval(() => {
        setElapsedSecs(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isExtracting, isGenerating])

  const toggleNode = (nodeKey) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeKey]: !prev[nodeKey] }))
  }

  const toggleAllNodes = (expand = true) => {
    const nextState = {}
    Object.keys(expandedNodes).forEach(k => {
      nextState[k] = expand
    })
    setExpandedNodes(nextState)
  }

  const toggleFormat = (fmtKey) => {
    setSelectedFormats((prev) => ({ ...prev, [fmtKey]: !prev[fmtKey] }))
  }

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleExtractDNA = async () => {
    if (!selectedFile && !rawText.trim()) return

    setIsExtracting(true)
    setGeneratedArtifacts([])
    setExtractPhase('Ingesting & Running RapidOCR Preprocessing...')
    if (onSetInferencing) onSetInferencing(true, 'Extracting Content DNA...')

    try {
      setTimeout(() => {
        if (isExtracting) setExtractPhase('Extracting Entities, Claims & Risk Matrices...')
      }, 3000)

      const formData = new FormData()
      if (selectedFile) {
        formData.append('file', selectedFile)
      } else {
        formData.append('text', rawText)
        formData.append('source_name', 'Industrial Document Input')
      }

      const res = await sovereignAPI.extractDNA(formData)
      setDna(res)
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || err.message || 'Content DNA extraction failed')
    } finally {
      setIsExtracting(false)
      setExtractPhase('')
      if (onSetInferencing) onSetInferencing(false)
    }
  }

  const handleGenerateDeliverables = async () => {
    if (!dna) return

    const activeFormats = Object.keys(selectedFormats).filter((k) => selectedFormats[k])
    if (activeFormats.length === 0) {
      alert('Please select at least one deliverable format.')
      return
    }

    setIsGenerating(true)
    if (onSetInferencing) onSetInferencing(true, 'Generating Multi-Format Deliverables...')

    try {
      const res = await sovereignAPI.generateDeliverables({
        dna_id: dna.id,
        formats: activeFormats,
        ...genParams,
      })
      setGeneratedArtifacts(res.generated_items || [])
      if (onDeliverableGenerated) {
        onDeliverableGenerated(res.generated_items || [])
      }
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.detail || err.message || 'Deliverables generation failed')
    } finally {
      setIsGenerating(false)
      if (onSetInferencing) onSetInferencing(false)
    }
  }

  const handleCopyDNAJson = () => {
    if (dna) {
      navigator.clipboard.writeText(JSON.stringify(dna, null, 2))
      setCopiedDna(true)
      setTimeout(() => setCopiedDna(false), 2000)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e17]">
      {/* Top Banner */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1424]/40">
        <div>
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-semibold font-display text-white">Content DNA & Deliverable Engine</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
              SEMANTIC KNOWLEDGE PIPELINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Converts raw documentation into structured semantic Content DNA, then transforms that single foundation into Word, PPTX, and Excel deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(isExtracting || isGenerating) && (
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-sky-950/80 border border-sky-500/40 text-xs font-mono text-sky-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Elapsed: {elapsedSecs}s</span>
            </div>
          )}
          <button
            onClick={() => {
              setRawText(
                'EQUIPMENT INSPECTION & CRUDE DISTILLATION UNIT REPORT (CONFIDENTIAL)\n' +
                'Plant Unit: CDU-04, Jamnagar Refinery Complex\n' +
                'Inspection Date: 2026-08-20 | Lead Inspector: Dr. V. Ramanathan (Chief Integrity Officer)\n' +
                'Subject: Ultrasonic Thickness & Corrosion Assessment on Main Overhead Pipeline (Line 14-P-102)\n\n' +
                '1. Operating Parameters:\n' +
                '- Design Flow Rate: 450 m3/h\n' +
                '- Operating Pressure: 14.2 bar\n' +
                '- Operating Temperature: 185.4 °C\n' +
                '- Crude Density: 852 kg/m3\n\n' +
                '2. Findings & Measurements:\n' +
                '- Nominal wall thickness design: 12.7 mm.\n' +
                '- Measured minimum wall thickness at bend elbow #3: 8.1 mm (36.2% localized metal loss due to naphthenic acid corrosion).\n' +
                '- Allowable retirement thickness per ASME B31.3 is 7.5 mm.\n\n' +
                '3. Risk & Impact Evaluation:\n' +
                '- High risk of uncontained hydrocarbon release within 90 days under full throughput if unmitigated.\n' +
                '- Estimated downtime cost: $1.2M per day if emergency shutdown is triggered.\n\n' +
                '4. Recommendations:\n' +
                '1. Issue immediate engineering approval note to derate unit operating pressure to 11.5 bar.\n' +
                '2. Schedule clamp enclosure installation within 14 days during planned maintenance window.\n' +
                '3. Present replacement capital expenditure ($380,000) for Board sanction.'
              )
            }}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition"
          >
            Load Sample PSU Document
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Ingestion & Visual Content DNA Tree */}
        <div className="w-full lg:w-1/2 p-4 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/80 overflow-y-auto">
          {/* Ingestion Box */}
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 mb-4 shadow-sm">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider block mb-2 font-semibold">
              1. Source Ingestion (PDF, Scanned Drawing, Docx, Text)
            </label>

            {/* File Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition ${
                selectedFile ? 'border-sky-500/50 bg-sky-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg,.txt,.csv"
                className="hidden"
              />
              <Upload className="w-5 h-5 text-sky-400 mx-auto mb-1" />
              <p className="text-xs text-slate-300 font-medium">
                {selectedFile ? selectedFile.name : 'Click to upload scanned PDF, drawing, or document'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                RapidOCR On-Premises Vision Engine Enabled
              </p>
            </div>

            {/* Raw Text Fallback */}
            <div className="mt-2.5">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                Or Paste Source Knowledge Directly:
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste technical inspection notes, meeting minutes, calculations, or specifications..."
                rows={3}
                className="w-full p-2 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
              />
            </div>

            {/* Extraction Phase Loading Indicator */}
            {isExtracting && (
              <div className="mt-2.5 p-2.5 rounded bg-sky-950/40 border border-sky-500/30 flex items-center gap-2.5 animate-pulse text-xs text-sky-300 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                <span>{extractPhase || 'Extracting Content DNA structure...'}</span>
              </div>
            )}

            <button
              onClick={handleExtractDNA}
              disabled={isExtracting || (!selectedFile && !rawText.trim())}
              className={`w-full mt-3 py-2 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition ${
                isExtracting || (!selectedFile && !rawText.trim())
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/10'
              }`}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Content DNA ({elapsedSecs}s)...</span>
                </>
              ) : (
                <>
                  <Dna className="w-3.5 h-3.5" />
                  <span>Extract Content DNA Structure</span>
                </>
              )}
            </button>
          </div>

          {/* Visual Content DNA Tree */}
          {dna ? (
            <div className="flex-1 p-3.5 rounded-lg codex-panel border-sky-500/30">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Content DNA Tree
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAllNodes(true)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
                    title="Expand all branches"
                  >
                    Expand
                  </button>
                  <button
                    onClick={() => toggleAllNodes(false)}
                    className="text-[10px] font-mono text-slate-400 hover:text-slate-200 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700"
                    title="Collapse all branches"
                  >
                    Collapse
                  </button>
                  <button
                    onClick={handleCopyDNAJson}
                    className="text-[10px] font-mono text-sky-400 hover:text-sky-300 px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 flex items-center gap-1"
                    title="Copy full Content DNA JSON"
                  >
                    {copiedDna ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDna ? 'Copied' : 'JSON'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {/* 1. Identity */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('identity')}
                    className="flex items-center justify-between cursor-pointer text-sky-300 font-semibold"
                  >
                    <span>├── Identity</span>
                    {expandedNodes.identity ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.identity && (
                    <div className="mt-1.5 pl-4 text-slate-300 font-sans text-xs font-medium">
                      {dna.identity}
                    </div>
                  )}
                </div>

                {/* 2. Overview */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('overview')}
                    className="flex items-center justify-between cursor-pointer text-sky-300 font-semibold"
                  >
                    <span>├── Overview</span>
                    {expandedNodes.overview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.overview && (
                    <div className="mt-1.5 pl-4 text-slate-300 font-sans text-xs leading-relaxed">
                      {dna.overview}
                    </div>
                  )}
                </div>

                {/* 3. Entities */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('entities')}
                    className="flex items-center justify-between cursor-pointer text-sky-300 font-semibold"
                  >
                    <span>├── Entities</span>
                    {expandedNodes.entities ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.entities && (
                    <div className="mt-1.5 pl-4 space-y-1 text-slate-300 text-xs">
                      {dna.entities?.organizations?.length > 0 && (
                        <div><span className="text-slate-500">Organizations:</span> {dna.entities.organizations.join(', ')}</div>
                      )}
                      {dna.entities?.technologies?.length > 0 && (
                        <div><span className="text-slate-500">Technologies:</span> {dna.entities.technologies.join(', ')}</div>
                      )}
                      {dna.entities?.people?.length > 0 && (
                        <div><span className="text-slate-500">People:</span> {dna.entities.people.join(', ')}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Claims */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('claims')}
                    className="flex items-center justify-between cursor-pointer text-sky-300 font-semibold"
                  >
                    <span>├── Claims ({dna.claims?.length || 0})</span>
                    {expandedNodes.claims ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.claims && (
                    <ul className="mt-1.5 pl-4 list-disc list-inside space-y-1 text-slate-300 font-sans text-xs">
                      {dna.claims?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  )}
                </div>

                {/* 5. Statistics */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('statistics')}
                    className="flex items-center justify-between cursor-pointer text-emerald-400 font-semibold"
                  >
                    <span>├── Statistics & Measurements ({dna.statistics?.length || 0})</span>
                    {expandedNodes.statistics ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.statistics && (
                    <ul className="mt-1.5 pl-4 list-disc list-inside space-y-1 text-emerald-300 font-sans text-xs">
                      {dna.statistics?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  )}
                </div>

                {/* 6. Key Findings */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('key_findings')}
                    className="flex items-center justify-between cursor-pointer text-sky-300 font-semibold"
                  >
                    <span>├── Key Findings ({dna.key_findings?.length || 0})</span>
                    {expandedNodes.key_findings ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.key_findings && (
                    <ul className="mt-1.5 pl-4 list-disc list-inside space-y-1 text-slate-300 font-sans text-xs">
                      {dna.key_findings?.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  )}
                </div>

                {/* 7. Risks & Exposure */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('risks')}
                    className="flex items-center justify-between cursor-pointer text-red-400 font-semibold"
                  >
                    <span>├── Risks & Exposure ({dna.risks?.length || 0})</span>
                    {expandedNodes.risks ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.risks && (
                    <ul className="mt-1.5 pl-4 list-disc list-inside space-y-1 text-red-300 font-sans text-xs">
                      {dna.risks?.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  )}
                </div>

                {/* 8. Recommendations */}
                <div className="rounded border border-slate-800 bg-slate-950/40 p-2">
                  <div 
                    onClick={() => toggleNode('recommendations')}
                    className="flex items-center justify-between cursor-pointer text-emerald-400 font-semibold"
                  >
                    <span>└── Recommendations ({dna.recommendations?.length || 0})</span>
                    {expandedNodes.recommendations ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  {expandedNodes.recommendations && (
                    <ul className="mt-1.5 pl-4 list-decimal list-inside space-y-1 text-slate-200 font-sans text-xs font-medium">
                      {dna.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-600 text-center">
              <Dna className="w-12 h-12 text-slate-800 mb-2 stroke-1" />
              <p className="text-xs text-slate-500">Content DNA Not Extracted Yet</p>
              <p className="text-[11px] text-slate-600 max-w-xs mt-1">
                Upload a file or paste text above and click Extract to generate the structured factual foundation.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Output Formats & Generation Engine */}
        <div className="w-full lg:w-1/2 p-4 flex flex-col bg-[#090d16] overflow-y-auto">
          <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold">
                2. Output Deliverable Selection
              </span>
              <span className="text-[10px] font-mono text-sky-400">Single DNA Foundation</span>
            </div>

            {/* Checkboxes for formats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <div 
                onClick={() => toggleFormat('word_docx')}
                className={`p-2.5 rounded-md border flex items-center gap-2 cursor-pointer transition ${
                  selectedFormats.word_docx ? 'bg-blue-950/40 border-blue-500/50 text-blue-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                {selectedFormats.word_docx ? <CheckSquare className="w-4 h-4 text-blue-400" /> : <Square className="w-4 h-4" />}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Word Approval Note (.docx)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Formal PSU/Refinery format with sign-offs</div>
                </div>
              </div>

              <div 
                onClick={() => toggleFormat('powerpoint_pptx')}
                className={`p-2.5 rounded-md border flex items-center gap-2 cursor-pointer transition ${
                  selectedFormats.powerpoint_pptx ? 'bg-amber-950/40 border-amber-500/50 text-amber-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                {selectedFormats.powerpoint_pptx ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Presentation Deck (.pptx)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Multi-slide deck with speaker notes</div>
                </div>
              </div>

              <div 
                onClick={() => toggleFormat('excel_xlsx')}
                className={`p-2.5 rounded-md border flex items-center gap-2 cursor-pointer transition ${
                  selectedFormats.excel_xlsx ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                {selectedFormats.excel_xlsx ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4" />}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Excel Calculations (.xlsx)</div>
                  <div className="text-[10px] text-slate-400 font-mono">Data matrices & formula calculations</div>
                </div>
              </div>

              <div 
                onClick={() => toggleFormat('executive_summary')}
                className={`p-2.5 rounded-md border flex items-center gap-2 cursor-pointer transition ${
                  selectedFormats.executive_summary ? 'bg-purple-950/40 border-purple-500/50 text-purple-300' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}
              >
                {selectedFormats.executive_summary ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                <div>
                  <div className="text-xs font-semibold text-slate-200">Executive Summary & Advisory</div>
                  <div className="text-[10px] text-slate-400 font-mono">Clean markdown report & briefing</div>
                </div>
              </div>
            </div>

            {/* Generation Parameters */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold block">
                3. Generation Parameters
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={genParams.target_audience}
                    onChange={(e) => setGenParams({ ...genParams, target_audience: e.target.value })}
                    className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Tone</label>
                  <input
                    type="text"
                    value={genParams.tone}
                    onChange={(e) => setGenParams({ ...genParams, tone: e.target.value })}
                    className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Communication Objective</label>
                  <input
                    type="text"
                    value={genParams.objective}
                    onChange={(e) => setGenParams({ ...genParams, objective: e.target.value })}
                    className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-slate-400 block mb-1">Content Style</label>
                  <input
                    type="text"
                    value={genParams.style}
                    onChange={(e) => setGenParams({ ...genParams, style: e.target.value })}
                    className="w-full p-1.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateDeliverables}
              disabled={isGenerating || !dna}
              className={`w-full mt-4 py-2.5 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition ${
                isGenerating || !dna
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Deliverables ({elapsedSecs}s)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Generate All Selected Deliverables</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Deliverables Rack */}
          {generatedArtifacts.length > 0 && (
            <div className="p-3.5 rounded-lg codex-panel border-emerald-500/40 bg-emerald-950/10 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Generated Deliverables ({generatedArtifacts.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">100% On-Premises</span>
              </div>

              <div className="space-y-2">
                {generatedArtifacts.map((art, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-between group hover:border-emerald-500/50 transition"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {art.format?.includes('docx') ? (
                        <FileText className="w-6 h-6 text-blue-400 shrink-0" />
                      ) : art.format?.includes('pptx') ? (
                        <Presentation className="w-6 h-6 text-amber-400 shrink-0" />
                      ) : art.format?.includes('xlsx') ? (
                        <FileSpreadsheet className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : (
                        <FileText className="w-6 h-6 text-purple-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-100 group-hover:text-emerald-300 truncate">
                          {art.title || art.filename}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {art.filename} // {Math.round((art.size_bytes || 1024) / 1024)} KB
                        </div>
                      </div>
                    </div>

                    <a
                      href={sovereignAPI.getDownloadUrl(art.id)}
                      download={art.filename}
                      className="px-3 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-mono text-xs flex items-center gap-1.5 border border-emerald-500/30 transition shrink-0 ml-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
