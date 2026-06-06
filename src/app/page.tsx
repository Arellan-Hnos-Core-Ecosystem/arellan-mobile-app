import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function HomePage() {
  const hasToken = cookies().get('arellan-auth')?.value === 'true'
  redirect(hasToken ? '/dashboard' : '/login')
}
