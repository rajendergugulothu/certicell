import {getChatGPTUser} from '@/app/chatgpt-auth';
import {AuthShell,SignInContent} from '@/app/auth-shell';
export const dynamic='force-dynamic';
export const metadata={title:'Sign in | CertiCell'};
export default async function Page(){const user=await getChatGPTUser();return <AuthShell><SignInContent user={user}/></AuthShell>}
