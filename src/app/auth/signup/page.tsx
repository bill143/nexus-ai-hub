@"
import { Suspense } from 'react'
import SignupForm from './SignupForm'

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
"@ | Set-Content "src\app\auth\signup\page.tsx" -Encoding UTF8