import { ReviewQueue } from '@/components/review-queue'

export const dynamic = 'force-dynamic'

export default function FinancialPage() {
  return (
    <ReviewQueue
      kind="financial"
      title="Financial-risk review"
      description="Records flagged by the dataset's fraud/financial column, or — when no such column exists — by a rule that detected a UPI ID, card/account number, or crypto wallet."
    />
  )
}
