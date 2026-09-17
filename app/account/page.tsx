import {requireUser} from '@/app/auth-user';
import {AuthShell} from '@/app/auth-shell';
import ProfileForm from './profile-form';
export const dynamic='force-dynamic';
export const metadata={title:'Your account | CertiCell'};
export default async function Page(){await requireUser('/account');return <AuthShell><ProfileForm mode="edit"/></AuthShell>}
