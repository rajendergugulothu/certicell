export const demoAccounts=[
 {id:'fleet-manager',name:'Fleet Manager',view:'Batteries',description:'Explore sample battery batches, customers, and capacity records.'},
 {id:'lab-reviewer',name:'Lab Reviewer',view:'Testing queue',description:'Inspect the sample testing queue and assessment statuses.'},
 {id:'certificate-auditor',name:'Certificate Auditor',view:'Certificates',description:'Review illustrative certificate cards and the pilot methodology.'},
] as const;
export type DemoAccount=typeof demoAccounts[number];
