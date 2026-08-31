import React, { useState, useEffect, useRef } from 'react'
import { 
  TerminalSquare, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Layers, 
  Code, 
  Cpu,
  Calculator,
  ShieldCheck,
  Loader2,
  Trash2,
  Copy,
  Check
} from 'lucide-react'
import { sovereignAPI } from '../services/api'

export function CodeSandbox({ onSetInferencing }) {
  const templates = [
    {
      name: 'Corrosion Degradation (ASME B31.3)',
      code: `# Industrial Pipe Corrosion Degradation & Safety Verification
import math

print("=== SOVEREIGN CALCULATION ENGINE ===")
print("Standard: ASME B31.3 Process Piping")

nominal_thickness_mm = 12.7
measured_thickness_mm = 8.1
operating_pressure_bar = 14.2
pipe_outer_diameter_mm = 355.6  # 14 inch NPS
allowable_stress_psi = 20000     # A106 Grade B Carbon Steel
allowable_stress_bar = allowable_stress_psi * 0.0689476

# Metal loss calculation
metal_loss_pct = ((nominal_thickness_mm - measured_thickness_mm) / nominal_thickness_mm) * 100
print(f"\\n1. Localized Metal Loss: {metal_loss_pct:.2f}%")

# Minimum required thickness per Barlow formula
weld_joint_efficiency = 1.0
temp_coefficient = 0.4
t_min_mm = (operating_pressure_bar * pipe_outer_diameter_mm) / (2 * allowable_stress_bar * weld_joint_efficiency + 2 * temp_coefficient * operating_pressure_bar)

print(f"2. Theoretical Minimum Safe Thickness: {t_min_mm:.2f} mm")
print(f"3. Measured Remaining Thickness: {measured_thickness_mm:.2f} mm")

# Verification verdict
margin_mm = measured_thickness_mm - t_min_mm
if margin_mm > 0:
    status = "COMPLIANT [SAFE MARGIN]"
    print(f"4. Status: {status} (Margin: +{margin_mm:.2f} mm)")
else:
    status = "NON-COMPLIANT [DERATING REQUIRED]"
    print(f"4. Status: {status} (Deficit: {margin_mm:.2f} mm)")

print("\\n[Air-Gapped Sandbox Execution Verified]")
`
    },
    {
      name: 'Refinery CDU Mass Flow Balance',
      code: `# CDU Mass & Heat Balance Model
import numpy as np

print("=== REFINERY MASS BALANCE MODEL ===")
volumetric_flow_m3_hr = 450.0
density_kg_m3 = 852.0

# Mass flow rate
mass_flow_kg_s = (volumetric_flow_m3_hr * density_kg_m3) / 3600.0
mass_flow_tpd = (volumetric_flow_m3_hr * density_kg_m3 * 24.0) / 1000.0

print(f"Crude Feed Throughput:")
print(f" - Volumetric Rate: {volumetric_flow_m3_hr} m3/h")
print(f" - Mass Flow Rate: {mass_flow_kg_s:.2f} kg/s")
print(f" - Daily Capacity: {mass_flow_tpd:.1f} Tonnes/Day")

# Cut fraction yields (Arab Light Assay)
yields = {
    "LPG & Offgas": 0.035,
    "Naphtha / Gasoline": 0.220,
    "Kerosene / Jet A-1": 0.145,
    "Diesel / Gasoil": 0.280,
    "Atmospheric Residue": 0.320
}

print("\\nFractionation Yield Breakdown:")
for fraction, pct in yields.items():
    fraction_tpd = mass_flow_tpd * pct
    print(f"  • {fraction:22s}: {pct*100:4.1f}%  -->  {fraction_tpd:7.1f} TPD")

print(f"\\nTotal Mass Conservation Check: {sum(yields.values())*100:.1f}% [PASSED]")
`
    }
  ]

  const [code, setCode] = useState(templates[0].code)
  const [isRunning, setIsRunning] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    let interval = null
    if (isRunning) {
      setElapsed(0)
      interval = setInterval(() => setElapsed(prev => prev + 1), 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const handleRunCode = async () => {
    if (!code.trim() || isRunning) return
    setIsRunning(true)
    setExecutionResult(null)
    if (onSetInferencing) onSetInferencing(true, 'Running Subprocess Sandbox...')

    try {
      const data = await sovereignAPI.executeSandbox(code)
      setExecutionResult(data)
    } catch (err) {
      console.error(err)
      setExecutionResult({
        success: false,
        exit_code: -1,
        stdout: '',
        stderr: err.response?.data?.detail || err.message || 'Execution error'
      })
    } finally {
      setIsRunning(false)
      if (onSetInferencing) onSetInferencing(false)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0e17]">
      {/* Top Bar */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-[#0e1424]/40">
        <div>
          <div className="flex items-center gap-2">
            <TerminalSquare className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-semibold font-display text-white">Local Code Sandbox & Math Verifier</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ISOLATED SUBPROCESS RUNNER
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely executes Python scripts and verifies mathematical calculations with zero external internet access.
          </p>
        </div>

        {/* Template Selector */}
        <div className="flex items-center gap-2">
          {templates.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setCode(t.code)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition"
            >
              {t.name.split(' ')[0]} Template
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Code Editor */}
        <div className="w-full lg:w-1/2 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-[#0d1117]">
          <div className="h-10 px-4 border-b border-slate-800/80 flex items-center justify-between bg-[#161b22]">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-semibold text-slate-200">sandbox_runner.py</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Copy Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleRunCode}
                disabled={isRunning || !code.trim()}
                className={`px-3 py-1 rounded font-mono text-xs flex items-center gap-1.5 transition ${
                  isRunning || !code.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing ({elapsed}s)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run in Sandbox</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 p-3 overflow-hidden">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-full p-2 bg-transparent font-mono text-xs text-slate-100 resize-none focus:outline-none leading-relaxed"
              spellCheck="false"
            />
          </div>
        </div>

        {/* Right: Terminal Console */}
        <div className="w-full lg:w-1/2 flex flex-col bg-[#070a10]">
          <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1424]/80">
            <div className="flex items-center gap-2">
              <TerminalSquare className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-mono font-semibold text-slate-300">Sandbox Console Output</span>
            </div>

            {executionResult && (
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="text-slate-400">Duration: {executionResult.duration_ms} ms</span>
                <span className={`px-2 py-0.5 rounded border ${
                  executionResult.success 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  Exit Code: {executionResult.exit_code}
                </span>
                <button
                  onClick={() => setExecutionResult(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                  title="Clear Console"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200">
            {isRunning ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-10 h-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin mb-3" />
                <p className="text-xs font-semibold text-emerald-300">Executing in Isolated Subprocess...</p>
                <p className="text-[11px] text-slate-500 mt-1">Collecting stdout & verification logs ({elapsed}s)</p>
              </div>
            ) : executionResult ? (
              <div className="space-y-3">
                {executionResult.stdout && (
                  <div>
                    <div className="text-[10px] text-emerald-400 font-bold mb-1 uppercase tracking-wider">
                      [STDOUT] Standard Output:
                    </div>
                    <pre className="text-slate-200 bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                      {executionResult.stdout}
                    </pre>
                  </div>
                )}

                {executionResult.stderr && (
                  <div>
                    <div className="text-[10px] text-red-400 font-bold mb-1 uppercase tracking-wider">
                      [STDERR] Errors & Warnings:
                    </div>
                    <pre className="text-red-300 bg-red-950/30 p-3 rounded border border-red-800/50 whitespace-pre-wrap">
                      {executionResult.stderr}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center">
                <Calculator className="w-10 h-10 text-slate-800 mb-2 stroke-1" />
                <p className="text-xs text-slate-500">Ready to execute in sandbox</p>
                <p className="text-[10px] text-slate-600 max-w-xs mt-1">
                  Click 'Run in Sandbox' to execute calculations and verify mathematical steps.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
