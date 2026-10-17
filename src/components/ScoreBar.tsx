/** Score out of 100 with a marker at the pass threshold. */
export function ScoreBar({ score, threshold, large = false }: { score: number; threshold: number; large?: boolean }) {
  const pass = score >= threshold
  return (
    <div className={`score${large ? ' score--lg' : ''}`}>
      <div className="score__track" role="img" aria-label={`AI score ${score} out of 100. Pass mark ${threshold}.`}>
        <div className="score__fill" data-pass={pass} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
        <div className="score__mark" style={{ left: `${threshold}%` }} />
      </div>
      <span className="score__n">{score}</span>
    </div>
  )
}
