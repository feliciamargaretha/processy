'use client'
import { useState } from 'react'

const COLORS = [
  { dot: '#378ADD', bar: '#E6F1FB', text: '#185FA5' },
  { dot: '#9F7FED', bar: '#EEEDFE', text: '#534AB7' },
  { dot: '#D85A30', bar: '#FAECE7', text: '#993C1D' },
  { dot: '#1D9E75', bar: '#E1F5EE', text: '#0F6E56' },
  { dot: '#888780', bar: '#F1EFE8', text: '#5F5E5A' },
  { dot: '#D4537E', bar: '#FBEAF0', text: '#72243E' },
]

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function Home() {
  const [screen, setScreen] = useState('connect')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaToken, setFigmaToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [result, setResult] = useState(null)

  const STEPS = [
    'Reading file metadata',
    'Fetching version history',
    'Reading frames & comments',
    'Claude inferring your process',
    'Building your timeline',
  ]

  async function run() {
    setError('')
    if (!figmaUrl || !figmaToken) { setError('Please enter both a file URL and access token.'); return }
    setLoading(true)
    setScreen('loading')
    setStepIndex(0)

    const stepInterval = setInterval(() => {
      setStepIndex(i => {
        if (i >= 3) { clearInterval(stepInterval); return i }
        return i + 1
      })
    }, 900)

    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl, figmaToken })
      })
      const data = await res.json()
      clearInterval(stepInterval)

      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong.')
        setScreen('connect')
        setLoading(false)
        return
      }

      setStepIndex(4)
      await new Promise(r => setTimeout(r, 700))
      setResult(data)
      setScreen('result')
    } catch (e) {
      clearInterval(stepInterval)
      setError('Network error: ' + e.message)
      setScreen('connect')
    }
    setLoading(false)
  }

  function reset() {
    setScreen('connect')
    setResult(null)
    setError('')
    setStepIndex(0)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9f9f8', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {screen === 'connect' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem 2rem', width: '100%', maxWidth: 480 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="9" width="14" height="2.5" rx="1.25" fill="white"/>
                <rect x="2" y="4" width="8" height="2.5" rx="1.25" fill="white" opacity="0.6"/>
                <rect x="2" y="14" width="11" height="2.5" rx="1.25" fill="white" opacity="0.4"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.3px' }}>Processy</span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.7px', lineHeight: 1.3, marginBottom: 10 }}>
              Turn your Figma file into a<br /><strong style={{ fontWeight: 600 }}>design timeline</strong>
            </h1>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: 0 }}>
              Reads your real file history, then uses Claude to infer your design phases and build a Gantt chart for your case study.
            </p>
          </div>

          <div style={{ width: '100%', background: 'white', border: '0.5px solid #e5e5e3', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: '#888', letterSpacing: '0.3px' }}>Figma file URL</label>
              <input
                type="text"
                value={figmaUrl}
                onChange={e => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/abc123/..."
                style={{ fontSize: 12, padding: '9px 11px', borderRadius: 8, border: '0.5px solid #e5e5e3', background: '#f9f9f8', fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 11, color: '#888', letterSpacing: '0.3px' }}>Personal access token</label>
              <input
                type="password"
                value={figmaToken}
                onChange={e => setFigmaToken(e.target.value)}
                placeholder="figd_xxxxxxxxxxxxxxxxxxxx"
                style={{ fontSize: 12, padding: '9px 11px', borderRadius: 8, border: '0.5px solid #e5e5e3', background: '#f9f9f8', fontFamily: 'monospace', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            {error && (
              <div style={{ fontSize: 12, color: '#c0392b', background: '#fdf0ee', borderRadius: 8, padding: '8px 10px' }}>
                {error}
              </div>
            )}
            <button
              onClick={run}
              disabled={loading}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: 'white', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
            >
              Analyse my project →
            </button>
          </div>

          <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', lineHeight: 1.5, maxWidth: 300, marginTop: '0.875rem' }}>
            Your token is only used to read file data. It's never stored or logged.
          </p>
        </div>
      )}

      {screen === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 2rem', minHeight: '60vh', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: i < stepIndex ? '#888' : i === stepIndex ? '#1a1a1a' : '#ccc', transition: 'color 0.3s' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: i < stepIndex ? '#ccc' : i === stepIndex ? '#1a1a1a' : '#e5e5e3', flexShrink: 0, transition: 'background 0.3s' }} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === 'result' && result && (() => {
        const { projectName, firstDate, lastDate, versionCount, analysis } = result
        const totalWeeks = analysis.totalWeeks || 1

        return (
          <div style={{ width: '100%', maxWidth: 680, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 3 }}>{projectName}</h2>
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{fmtDate(firstDate)} – {fmtDate(lastDate)}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { val: analysis.phases.length, label: 'phases' },
                  { val: totalWeeks, label: 'weeks' },
                  { val: versionCount, label: 'versions' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#f0f0ee', borderRadius: 8, padding: '7px 12px' }}>
                    <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.4px', lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Timeline</div>
            <div style={{ background: 'white', border: '0.5px solid #e5e5e3', borderRadius: 12, overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', borderBottom: '0.5px solid #e5e5e3' }}>
                <div style={{ width: 130, flexShrink: 0, borderRight: '0.5px solid #e5e5e3' }} />
                <div style={{ display: 'flex', flex: 1, padding: '6px 8px' }}>
                  {(analysis.months || []).map((m, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#aaa' }}>{m}</div>
                  ))}
                </div>
              </div>
              {analysis.phases.map((p, i) => {
                const ci = typeof p.colorIndex === 'number' ? p.colorIndex % 6 : i % 6
                const c = COLORS[ci]
                const leftPct = ((p.startWeek - 1) / totalWeeks) * 100
                const widthPct = Math.max(4, ((p.endWeek - p.startWeek) / totalWeeks) * 100)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', borderBottom: i < analysis.phases.length - 1 ? '0.5px solid #e5e5e3' : 'none', minHeight: 42 }}>
                    <div style={{ width: 130, flexShrink: 0, padding: '0 10px', fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, borderRight: '0.5px solid #e5e5e3' }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
                      {p.name}
                    </div>
                    <div style={{ flex: 1, position: 'relative', height: 42 }}>
                      <div style={{
                        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                        left: `calc(${leftPct.toFixed(1)}% + 4px)`,
                        width: `calc(${widthPct.toFixed(1)}% - 8px)`,
                        height: 20, borderRadius: 3,
                        background: c.bar, color: c.text,
                        display: 'flex', alignItems: 'center', padding: '0 7px',
                        fontSize: 10, fontWeight: 500, overflow: 'hidden', whiteSpace: 'nowrap'
                      }}>
                        {p.name}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Process summary</div>
            <div
              style={{ background: '#f5f5f3', borderRadius: 12, padding: '1rem 1.125rem', marginBottom: '1.5rem', fontSize: 13, lineHeight: 1.75, color: '#555' }}
              dangerouslySetInnerHTML={{ __html: analysis.summary }}
            />

            <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>Signals used</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: '1.5rem' }}>
              {(analysis.signals || []).map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 9, fontSize: 12, color: '#666', padding: '9px 12px', background: 'white', border: '0.5px solid #e5e5e3', borderRadius: 8 }}>
                  <span style={{ color: '#ccc', flexShrink: 0, marginTop: 1 }}>◈</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <button onClick={reset} style={{ padding: '8px 12px', borderRadius: 8, border: '0.5px solid #ddd', background: 'transparent', fontSize: 12, color: '#888', cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Analyse another
              </button>
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                  `${projectName}\n${fmtDate(firstDate)} – ${fmtDate(lastDate)}\n\nPhases:\n${analysis.phases.map(p => `- ${p.name} (week ${p.startWeek}–${p.endWeek})`).join('\n')}\n\nSummary:\n${(analysis.summary || '').replace(/<[^>]+>/g, '')}\n\nSignals:\n${(analysis.signals || []).map(s => `- ${s}`).join('\n')}`
                )}`}
                download={`${projectName.replace(/\s+/g, '-')}-timeline.txt`}
                style={{ padding: '8px 14px', borderRadius: 8, border: '0.5px solid #ddd', background: 'transparent', fontSize: 12, color: '#1a1a1a', cursor: 'pointer', textDecoration: 'none' }}
              >
                Export summary ↓
              </a>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
