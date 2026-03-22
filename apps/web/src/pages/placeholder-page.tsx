import { Card } from '../components/ui/card'

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl text-center">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{description}</p>
      </Card>
    </div>
  )
}
