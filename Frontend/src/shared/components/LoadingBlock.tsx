type LoadingBlockProps = {
  title: string
  description: string
}

export function LoadingBlock({ title, description }: LoadingBlockProps) {
  return (
    <div className="loading-block" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  )
}
