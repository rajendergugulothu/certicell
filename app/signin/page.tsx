import {getUser} from '@/app/auth-user';
import {AuthShell,SignInContent} from '@/app/auth-shell';
export const dynamic='force-dynamic';
export const metadata={title:'Sign in | CertiCell'};
export default async function Page(){const user=await getUser();return <AuthShell><SignInContent user={user}/></AuthShell>}
