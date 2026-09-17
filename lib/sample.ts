export const samples=[
['CC-LFP-1048','Voltway Mobility','BL-2026-024','LFP',100,'In review',86.4,'A'],
['CC-LFP-1047','Voltway Mobility','BL-2026-024','LFP',100,'Issued',91.2,'A'],
['CC-NMC-0836','Nexa Energy','BL-2026-023','NMC',120,'On hold',68.5,'Hold'],
['CC-LFP-1046','Voltway Mobility','BL-2026-024','LFP',100,'Received',null,null],
['CC-LFP-1045','Gridline Storage','BL-2026-022','LFP',200,'Issued',78.6,'B'],
['CC-NMC-0835','Nexa Energy','BL-2026-023','NMC',120,'In review',82.1,'A'],
['CC-LFP-1044','Gridline Storage','BL-2026-022','LFP',200,'Received',null,null],
['CC-LFP-1043','Gridline Storage','BL-2026-022','LFP',200,'Issued',73.8,'B'],
].map((r,i)=>({id:'sample-'+i,serial:r[0] as string,customer:r[1] as string,batch:r[2] as string,chemistry:r[3] as string,nominal:r[4] as number,status:r[5] as string,soh:r[6] as number|null,grade:r[7] as string|null,created:'2026-09-12T10:00:00Z',test:null}));
