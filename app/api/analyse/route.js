export async function POST(request) {
  try {
    const { figmaUrl, figmaToken } = await request.json()

    if (!figmaUrl || !figmaToken) {
      return Response.json({ error: 'Missing figmaUrl or figmaToken' }, { status: 400 })
    }

    const fileKeyMatch = figmaUrl.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/)
    if (!fileKeyMatch) {
      return Response.json({ error: 'Could not parse file key from URL. Make sure it\'s a full Figma file URL.' }, { status: 400 })
    }
    const fileKey = fileKeyMatch[1]

    async function figmaGet(path) {
      const res = await fetch(`https://api.figma.com/v1/${path}`, {
        headers: { 'X-Figma-Token': figmaToken }
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Figma API error ${res.status}: ${text}`)
      }
      return res.json()
    }

    const [fileMeta, versionsData, commentsData] = await Promise.all([
      figmaGet(`files/${fileKey}?depth=2`),
      figmaGet(`files/${fileKey}/versions`),
      figmaGet(`files/${fileKey}/comments`)
    ])

    const versions = versionsData.versions || []
    const comments = (commentsData.comments || []).map(c => ({
      text: c.message,
      date: c.created_at
    }))

    function collectFrameNames(node, names = []) {
      if (!node) return names
      if (['FRAME', 'COMPONENT', 'SECTION'].includes(node.type) && node.name) {
        names.push(node.name)
      }
      if (node.children) node.children.forEach(c => collectFrameNames(c, names))
      return names
    }

    const frameNames = collectFrameNames(fileMeta.document)
    const uniqueFrames = [...new Set(frameNames)].slice(0, 60)

    const sortedVersions = [...versions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const firstDate = sortedVersions.length ? sortedVersions[0].created_at : fileMeta.lastModified
    const lastDate = fileMeta.lastModified

    const msPerWeek = 1000 * 60 * 60 * 24 * 7
    const totalWeeks = Math.max(1, Math.round((new Date(lastDate) - new Date(firstDate)) / msPerWeek))

    const versionSummary = sortedVersions.slice(0, 40).map(v =>
      new Date(v.created_at).toISOString().slice(0, 10) + (v.label ? ` [${v.label}]` : '')
    )

    function fmtDate(iso) {
      return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const prompt = `You are analysing a Figma design file to infer the designer's process for a case study.

File name: "${fileMeta.name}"
Project span: ${fmtDate(firstDate)} to ${fmtDate(lastDate)} (${totalWeeks} weeks)
Total saved versions: ${versions.length}

Version save dates (oldest first):
${versionSummary.join('\n')}

Frame/layer names found in the file (sample):
${uniqueFrames.join(', ')}

Comments left in the file:
${comments.length ? comments.slice(0, 20).map(c => `${new Date(c.date).toISOString().slice(0,10)}: "${c.text.slice(0,120)}"`).join('\n') : 'No comments found.'}

Based on this data, infer the design phases this project went through. Respond ONLY with valid JSON, no markdown, no explanation:

{
  "phases": [
    { "name": "Research", "startWeek": 1, "endWeek": 3, "colorIndex": 0 }
  ],
  "summary": "2-3 sentence HTML summary using <strong> for phase names. Be specific about signals you saw.",
  "signals": [
    "Signal description"
  ],
  "totalWeeks": ${totalWeeks},
  "months": ["Jan", "Feb", "Mar"]
}

Rules:
- 3 to 6 phases covering the full project span
- colorIndex cycles 0 to 5
- months: 3 to 6 evenly spaced labels across the timeline
- startWeek and endWeek are 1-indexed week numbers
- Be specific in summary and signals — mention actual frame names, comments, save patterns you found
- If project is short or recent, still infer phases from available data`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!claudeRes.ok) {
      const text = await claudeRes.text()
      throw new Error(`Claude API error ${claudeRes.status}: ${text}`)
    }

    const claudeData = await claudeRes.json()
    const raw = claudeData.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
    const analysis = JSON.parse(raw)

    return Response.json({
      projectName: fileMeta.name,
      firstDate,
      lastDate,
      versionCount: versions.length,
      analysis
    })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
