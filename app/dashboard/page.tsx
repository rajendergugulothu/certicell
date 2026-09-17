import Workspace from '@/app/workspace';
import {requireUser} from '@/app/auth-user';
export const dynamic='force-dynamic';
export const metadata={title:'Workspace | CertiCell'};
export default async function Page(){await requireUser('/dashboard');return <Workspace/>;}
