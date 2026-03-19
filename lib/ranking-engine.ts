export interface RankingResult {
  userId: string
  cfHandle: string
  rank: number
  solved: number
  score: number // Can be penalty (ICPC) or points (AtCoder/IOI)
  penalty_time?: number // For tie-breaking in AtCoder/IOI
  problems: Record<string, ProblemResult>
}

export interface ProblemResult {
  solved: boolean
  points: number
  attempts: number
  penalty: number
  verdict: string
  submittedAt: string | null
}

export type RankingRule = 'ICPC' | 'AtCoder' | 'IOI'

export function calculateRankings(
  profiles: any[],
  submissions: any[],
  problems: any[],
  contestStartTime: string,
  rule: RankingRule = 'ICPC'
): RankingResult[] {
  const userMap: Record<string, RankingResult> = {}
  const startTime = new Date(contestStartTime).getTime()

  // Initialize
  profiles.forEach(p => {
    userMap[p.id] = {
      userId: p.id,
      cfHandle: p.cf_handle || 'Anonymous',
      rank: 0,
      solved: 0,
      score: 0,
      problems: {}
    }
    problems.forEach(prob => {
      userMap[p.id].problems[prob.id] = {
        solved: false,
        points: 0,
        attempts: 0,
        penalty: 0,
        verdict: '',
        submittedAt: null
      }
    })
  })

  // Process Submissions (must be sorted by time)
  const sortedSubs = [...submissions].sort((a, b) => 
    new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  )

  sortedSubs.forEach(sub => {
    const user = userMap[sub.user_id]
    if (!user) return

    const prob = user.problems[sub.problem_id]
    if (!prob || prob.solved) return

    const isAccepted = sub.verdict === 'OK' || sub.verdict === 'Accepted'
    const subTime = new Date(sub.submitted_at).getTime()
    const minutesSinceStart = Math.floor((subTime - startTime) / 60000)

    if (isAccepted) {
      prob.solved = true
      prob.verdict = sub.verdict
      prob.submittedAt = sub.submitted_at
      
      if (rule === 'ICPC') {
        prob.penalty = minutesSinceStart + (prob.attempts * 20)
        user.solved += 1
        user.score += prob.penalty
      } else {
        // AtCoder / IOI
        const points = sub.points ?? 100 // Default points if null
        prob.points = points
        user.solved += 1
        user.score += points
        // In AtCoder, penalty is just the time of last AC for tie-breaking
        user.penalty_time = minutesSinceStart
      }
    } else if (!['Judging', 'In Queue', 'Compilation Error'].includes(sub.verdict)) {
      prob.attempts += 1
      prob.verdict = sub.verdict
    }
  })

  // Sort
  const results = Object.values(userMap).sort((a, b) => {
    if (rule === 'ICPC') {
      if (a.solved !== b.solved) return b.solved - a.solved
      return a.score - b.score
    } else {
      if (a.score !== b.score) return b.score - a.score
      return (a.penalty_time || 0) - (b.penalty_time || 0)
    }
  })

  // Assign Ranks
  results.forEach((r, i) => {
    if (i > 0) {
      const prev = results[i-1]
      if (rule === 'ICPC' && r.solved === prev.solved && r.score === prev.score) {
        r.rank = prev.rank
      } else if (rule !== 'ICPC' && r.score === prev.score && r.penalty_time === prev.penalty_time) {
        r.rank = prev.rank
      } else {
        r.rank = i + 1
      }
    } else {
      r.rank = 1
    }
  })

  return results
}
