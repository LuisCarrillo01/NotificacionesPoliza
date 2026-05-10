type ErrorAlertProps = {
  message: string
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div className="feedback-box feedback-error" role="alert">
      <strong>Atencion:</strong> {message}
    </div>
  )
}
