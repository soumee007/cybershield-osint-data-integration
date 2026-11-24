import { ReviewQueue } from '@/components/review-queue'

export const dynamic = 'force-dynamic'

export default function ThreatsPage() {
  return (
    <ReviewQueue
      kind="threat"
      title="Threat review"
      description="Records whose dataset supplied a risk label (excluding financial-risk records). Charts reflect every record in scope."
    />
  )
}
