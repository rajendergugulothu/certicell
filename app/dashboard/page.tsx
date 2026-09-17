import Workspace from '@/app/workspace';
import {requireChatGPTUser} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export const metadata={title:'Workspace | CertiCell'};
export default async function Page(){await requireChatGPTUser('/dashboard');return <Workspace/>;}
