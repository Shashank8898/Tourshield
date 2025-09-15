import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <SignUp 
        appearance={{
          elements: {
            formButtonPrimary: 'bg-gradient-to-r from-cyan-500 to-blue-500',
            card: 'bg-slate-800 border-slate-700'
          }
        }}
      />
    </div>
  )
}
