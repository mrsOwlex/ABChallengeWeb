import { TileState } from './tileState'

export function getStateColor(state: TileState): string {
  switch (state) {
    case 'done': return 'var(--theme-done)'
    case 'planned': return 'var(--theme-g2)'
    case 'idea': return 'var(--theme-idea)'
    default: return 'rgba(255,255,255,0.2)'
  }
}

export const STATE_CONFIG: Record<TileState, { icon: string; badgeClass: string; labelKey: string }> = {
  done: { icon: '\u2713', badgeClass: 'state-badge-done', labelKey: 'tileDetail.stateDone' },
  planned: { icon: '\uD83D\uDCC5', badgeClass: 'state-badge-planned', labelKey: 'tileDetail.statePlanned' },
  idea: { icon: '\uD83D\uDCA1', badgeClass: 'state-badge-idea', labelKey: 'tileDetail.stateIdea' },
  incomplete: { icon: '\u2014', badgeClass: 'state-badge-incomplete', labelKey: 'tileDetail.stateIncomplete' },
}

export const ACCENT_CLASS: Record<string, string> = {
  done: 'card-accent-done',
  planned: 'card-accent-planned',
  idea: 'card-accent-idea',
}
