type StatusBadgeProps = {
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger'
  children: string
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{children}</span>
}
