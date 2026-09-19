/**
 * Shadow Lab Page - /shadow
 * Interactive trade idea testing - "What would NUMMUSS do?"
 */

import { useState } from 'react'
import { useShadow } from '../lib/useApi'

export default function ShadowLab() {
  const [symbol, setSymbol] = useState('')
  const [idea, setIdea] = useState('')
  const [result, setResult] = useState<any>(null)
  const [step, setStep] = useState<'input' | 'processing' | 'result'>('input')

  const { testIdea } = useShadow()

  const handleSubmit = async () => {
    if (!symbol.trim() || !idea.trim()) return

    setStep('processing')
    setResult(null)

    // Simulate processing steps
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    const response = await testIdea(symbol, idea)
    
    await new Promise((resolve) => setTimeout(resolve, 600))
    setResult(response)
    setStep('result')
  }

  const handleReset = () => {
    setSymbol('')
    setIdea('')
    setResult(null)
    setStep('input')
  }

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-5xl font-display text-snow mb-4">Shadow Lab</h1>
        <p className="text-xl text-snow/60 mb-3 tracking-wide">WHAT WOULD NUMMUSS DO?</p>
        <p className="text-snow/60 max-w-2xl mx-auto">
          Enter a simulated trade idea and see how Nummuss evaluates it through behavioral guardrails.
        </p>
      </div>

      {/* Input Form */}
      {step === 'input' && (
        <div className="bg-[#111412] border border-snow/10 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm text-snow/70 mb-2 uppercase tracking-wide">Symbol</label>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="BTCINR"
              className="w-full px-4 py-3 bg-[#060807] border border-snow/10 rounded-lg text-snow font-mono focus:outline-none focus:border-snow/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-snow/70 mb-2 uppercase tracking-wide">Trade Idea</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe your trade idea..."
              rows={6}
              className="w-full px-4 py-3 bg-[#060807] border border-snow/10 rounded-lg text-snow resize-none focus:outline-none focus:border-snow/30 transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!symbol.trim() || !idea.trim()}
            className="w-full px-6 py-4 bg-snow text-charcoal font-bold rounded-lg hover:bg-snow/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
          >
            Run Through Nummuss →
          </button>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="bg-[#060807] border border-snow/10 rounded-2xl p-12 space-y-6">
          <ProcessingStep label="READING IDEA" active delay={0} />
          <ProcessingStep label="CHECKING EVIDENCE" active delay={300} />
          <ProcessingStep label="CHECKING BEHAVIOR" active delay={600} />
          <ProcessingStep label="VERDICT" active delay={900} />
        </div>
      )}

      {/* Result */}
      {step === 'result' && result && (
        <div className="space-y-6">
          <div className="bg-[#060807] border border-snow/10 rounded-2xl p-8">
            {/* Verdict */}
            <div className="text-center mb-8">
              <div
                className={`inline-block px-8 py-4 rounded-xl font-mono font-bold text-3xl uppercase tracking-wide ${
                  result.verdict === 'blocked'
                    ? 'bg-danger/20 border-2 border-danger text-danger'
                    : 'bg-mint/20 border-2 border-mint text-mint'
                }`}
              >
                {result.verdict}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {result.guardrail_layer && (
                <div className="pb-4 border-b border-snow/10">
                  <p className="text-xs uppercase tracking-widest text-snow/40 mb-2">GUARDRAIL LAYER</p>
                  <p className="text-lg font-mono text-snow">{result.guardrail_layer}</p>
                </div>
              )}

              <div className="pb-4 border-b border-snow/10">
                <p className="text-xs uppercase tracking-widest text-snow/40 mb-2">REASON</p>
                <p className="text-lg font-bold text-snow">{result.reason_label}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-snow/40 mb-2">WHY?</p>
                <p className="text-snow/80 leading-relaxed">{result.explanation}</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full px-6 py-3 border border-snow/20 text-snow/70 rounded-lg hover:border-snow/40 hover:text-snow transition-colors uppercase tracking-wide text-sm"
          >
            Test Another Idea
          </button>
        </div>
      )}
    </div>
  )
}

function ProcessingStep({ label, active, delay }: { label: string; active: boolean; delay: number }) {
  const [visible, setVisible] = useState(false)

  useState(() => {
    if (active) {
      setTimeout(() => setVisible(true), delay)
    }
  })

  return (
    <div className={`flex items-center gap-4 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-30'}`}>
      <div className={`w-3 h-3 rounded-full ${visible ? 'bg-mint' : 'bg-snow/20'}`} />
      <p className="text-lg text-snow/80 font-medium">{label}</p>
    </div>
  )
}
