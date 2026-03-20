// ════════════════════════════════════════════
// DATA
// ════════════════════════════════════════════
const SUPABASE_URL=window.__JIQSYS_SUPABASE_URL__||'https://dznuvdnapgcanljuauhn.supabase.co';
const SUPABASE_ANON_KEY=window.__JIQSYS_SUPABASE_ANON_KEY__||'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bnV2ZG5hcGdjYW5sanVhdWhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzM3MjAsImV4cCI6MjA4ODkwOTcyMH0.r9vn3Ul0LXIN7m0mIZHW8Z5hakQVEsX6HQJkvx6RHRM';
const supabaseClient=window.__JIQSYS_SUPABASE_CLIENT__||(window.supabase?.createClient?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null);
if(!supabaseClient)throw new Error('Supabase client is not initialized. Check your Vite env or Supabase setup.');
const DEFAULT_STATUSES=[
  {id:'backlog',code:'backlog',name:'Backlog',color:'#aaa9a3'},
  {id:'todo',code:'todo',name:'To Do',color:'#6f6e69'},
  {id:'in_progress',code:'in_progress',name:'In Progress',color:'#f5c800'},
  {id:'in_review',code:'in_review',name:'In Review',color:'#3b72d9'},
  {id:'done',code:'done',name:'Done',color:'#2d9a6b'},
  {id:'blocked',code:'blocked',name:'Blocked',color:'#d94f3d'},
];
let statuses=[...DEFAULT_STATUSES];
let smDraft=[];
const PRI={'To Do ASAP':{bg:'#ffe3ec',c:'#b4235d'},Critical:{bg:'#fdecea',c:'#b03a2e'},High:{bg:'#fff3cd',c:'#8a6800'},Normal:{bg:'#f0efeb',c:'#6f6e69'},Low:{bg:'#eaf0fd',c:'#2a56a8'}};
// ════════════════════════════════════════════
// MODULES — seed icon presets for known modules
// ════════════════════════════════════════════
const FEATURE_ICON_SET={
  form:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="14" y1="17" x2="8" y2="17"/>',
  dashboard:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  chart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  project:'<rect x="3" y="3" width="9" height="9" rx="1"/><rect x="13" y="3" width="8" height="4" rx="1"/><rect x="13" y="10" width="8" height="5" rx="1"/><rect x="3" y="15" width="18" height="6" rx="1"/>',
  database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>',
  mobile:'<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  web:'<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  version:'<circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/><polyline points="8 12 10 10 12 12 14 10 16 12"/>',
  server:'<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
  checklist:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>',
  users:'<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41"/>',
  trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
  folder:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="3" y1="12" x2="21" y2="12"/>',
  globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 010 18"/><path d="M12 3a15 15 0 000 18"/>',
  bell:'<path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  megaphone:'<path d="M3 11v2a2 2 0 002 2h2l4 4V5L7 9H5a2 2 0 00-2 2z"/><path d="M16 8a5 5 0 010 8"/><path d="M18 5a9 9 0 010 14"/>',
  layout:'<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><line x1="9" y1="10" x2="21" y2="10"/>',
  document:'<rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  clock:'<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>',
  search:'<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  key:'<circle cx="7.5" cy="15.5" r="3.5"/><path d="M11 13l9-9"/><path d="M17 4h3v3"/><path d="M14 7l3 3"/>',
  lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/>',
  phone:'<path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.08 4.18 2 2 0 014.06 2h3a2 2 0 012 1.72c.12.9.33 1.78.63 2.62a2 2 0 01-.45 2.11L8.1 9.91a16 16 0 006 6l1.46-1.17a2 2 0 012.11-.45c.84.3 1.72.51 2.62.63A2 2 0 0122 16.92z"/>',
  map:'<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
  pin:'<path d="M12 21s6-5.33 6-11a6 6 0 10-12 0c0 5.67 6 11 6 11z"/><circle cx="12" cy="10" r="2.5"/>',
  package:'<path d="M21 8.5L12 13 3 8.5"/><path d="M21 15.5L12 20 3 15.5"/><path d="M3 8.5L12 4l9 4.5v7L12 20l-9-4.5v-7z"/><line x1="12" y1="13" x2="12" y2="20"/>',
  box:'<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 005 5l-8.4 8.4a2 2 0 01-2.8-2.8l8.4-8.4a4 4 0 01-5-5l2.3 2.3 2.8-2.8-2.3-2.3z"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1.1V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-.4-1.1 1.7 1.7 0 00-1-.6 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.6-1 1.7 1.7 0 00-1.1-.4H2.8a2 2 0 110-4h.1a1.7 1.7 0 001.1-.4 1.7 1.7 0 00.6-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.6 1.7 1.7 0 00.4-1.1V2.8a2 2 0 114 0v.1a1.7 1.7 0 00.4 1.1 1.7 1.7 0 001 .6 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019.4 9c.27.32.48.7.6 1.1.09.3.1.62.1.9s-.01.6-.1.9a1.7 1.7 0 00-.6 1z"/>',
  camera:'<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-2h6l2 2h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-4.5-4.5L7 20"/>',
  link:'<path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07L10.8 5.12"/><path d="M14 11a5 5 0 00-7.07 0L4.1 13.83a5 5 0 107.07 7.07L13.2 18.88"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  layers:'<polygon points="12 3 2 8 12 13 22 8 12 3"/><polyline points="2 12 12 17 22 12"/><polyline points="2 16 12 21 22 16"/>',
  star:'<polygon points="12 2 15.1 8.3 22 9.3 17 14.2 18.2 21 12 17.7 5.8 21 7 14.2 2 9.3 8.9 8.3 12 2"/>',
  bookmark:'<path d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"/>',
  tag:'<path d="M20.59 13.41L11 3H4v7l9.59 9.59a2 2 0 002.82 0l4.18-4.18a2 2 0 000-2.82z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  filter:'<polygon points="22 3 2 3 10 12.5 10 19 14 21 14 12.5 22 3"/>',
  book:'<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  home:'<path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
  rocket:'<path d="M5 19c2.5-1 4-2.5 5-5"/><path d="M15 9l-4 4"/><path d="M14 3c4 0 7 3 7 7-4 0-7 3-7 7-4 0-7-3-7-7 0-4 3-7 7-7z"/><path d="M5 14l-2 2v3h3l2-2"/>',
  cloud:'<path d="M18 18H7a4 4 0 010-8 5.5 5.5 0 0110.5-1.5A4.5 4.5 0 1118 18z"/>',
  upload:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download:'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  wifi:'<path d="M5 13.5a10 10 0 0114 0"/><path d="M8.5 17a5 5 0 017 0"/><path d="M12 20h.01"/>',
  printer:'<path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><line x1="17" y1="12" x2="17.01" y2="12"/>',
  creditcard:'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/>',
  cart:'<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h2l2.4 10.2a2 2 0 002 1.6H18a2 2 0 002-1.5L22 7H7"/>',
  truck:'<rect x="1" y="6" width="13" height="10" rx="2"/><path d="M14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  clipboard:'<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4.5h6a1.5 1.5 0 001.5-1.5h0A1.5 1.5 0 0015 1.5H9A1.5 1.5 0 007.5 3h0A1.5 1.5 0 009 4.5z"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/>',
  pencil:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  piechart:'<path d="M12 2a10 10 0 1010 10h-10z"/><path d="M13 2.1A10 10 0 0121.9 11H13z"/>',
  activity:'<polyline points="22 12 18 12 15 19 9 5 6 12 2 12"/>',
  terminal:'<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
  branch:'<path d="M6 3v12"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 9a9 9 0 009 9"/><path d="M18 9V9"/>',
  code:'<polyline points="8 7 3 12 8 17"/><polyline points="16 7 21 12 16 17"/><line x1="13" y1="5" x2="11" y2="19"/>',
  code2:'<polyline points="9 18 3 12 9 6"/><polyline points="15 6 21 12 15 18"/>',
  brackets:'<path d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h2"/><path d="M16 4h2a2 2 0 012 2v12a2 2 0 01-2 2h-2"/>',
  bug:'<path d="M9 9h6"/><path d="M10 4h4"/><path d="M12 4v16"/><rect x="8" y="7" width="8" height="10" rx="4"/><path d="M5 10h3M16 10h3M5 14h3M16 14h3"/><path d="M7 5L5 3M17 5l2-2"/>',
  gitpullrequest:'<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 9v8a4 4 0 004 4h5"/><path d="M14 6h4"/><path d="M15 3l3 3-3 3"/>',
  gitmerge:'<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.6 7.5a7 7 0 006.8 3.5"/><path d="M8.6 16.5a7 7 0 016.8-3.5"/>',
  apinodes:'<circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 12h10M12 7v10"/>',
  webhook:'<path d="M18 16.5A5.5 5.5 0 107 7"/><path d="M6 12a6 6 0 0010.3 4.2"/><polyline points="17 7 17 3 21 3"/><polyline points="7 17 7 21 3 21"/>',
  bot:'<rect x="7" y="8" width="10" height="8" rx="2"/><path d="M12 4v4"/><circle cx="10" cy="12" r="1"/><circle cx="14" cy="12" r="1"/><path d="M9 18h6"/><path d="M5 10H3M21 10h-2M5 14H3M21 14h-2"/>',
  testtube:'<path d="M10 2v5l-5.5 9.5A3 3 0 007.1 21h9.8a3 3 0 002.6-4.5L14 7V2"/><path d="M8 2h8"/><path d="M7.5 14h9"/>',
  deploy:'<path d="M12 3v12"/><polyline points="8 7 12 3 16 7"/><path d="M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4"/>',
  container:'<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/><path d="M12 7v14"/>',
  sparkles:'<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14z"/><path d="M5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14z"/>',
  filecode:'<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 8 15 10 17"/><polyline points="14 13 16 15 14 17"/>',
  cpu:'<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v4M15 1v4M9 19v4M15 19v4M19 9h4M19 15h4M1 9h4M1 15h4"/>',
  harddrive:'<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="7" y1="10" x2="7.01" y2="10"/><line x1="11" y1="10" x2="11.01" y2="10"/>',
  headset:'<path d="M4 12a8 8 0 0116 0"/><rect x="2" y="11" width="4" height="7" rx="2"/><rect x="18" y="11" width="4" height="7" rx="2"/><path d="M18 18a6 6 0 01-6 6h-1"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5"/>'
};
const FEATURE_ICON_CHOICES=[
  {key:'document',label:'Document'},
  {key:'form',label:'Form'},
  {key:'dashboard',label:'Dashboard'},
  {key:'chart',label:'Chart'},
  {key:'project',label:'Project'},
  {key:'database',label:'Database'},
  {key:'mobile',label:'Mobile'},
  {key:'shield',label:'Security'},
  {key:'web',label:'Web'},
  {key:'server',label:'Backend'},
  {key:'checklist',label:'Testing'},
  {key:'users',label:'Users'},
  {key:'folder',label:'Folder'},
  {key:'briefcase',label:'Business'},
  {key:'globe',label:'Global'},
  {key:'bell',label:'Alerts'},
  {key:'megaphone',label:'Announcement'},
  {key:'layout',label:'Workspace'},
  {key:'settings',label:'Settings'},
  {key:'trash',label:'Trash'},
  {key:'calendar',label:'Calendar'},
  {key:'clock',label:'Clock'},
  {key:'search',label:'Search'},
  {key:'key',label:'Key'},
  {key:'lock',label:'Lock'},
  {key:'mail',label:'Mail'},
  {key:'phone',label:'Phone'},
  {key:'map',label:'Map'},
  {key:'pin',label:'Location'},
  {key:'package',label:'Package'},
  {key:'box',label:'Box'},
  {key:'wrench',label:'Tools'},
  {key:'cog',label:'System'},
  {key:'camera',label:'Camera'},
  {key:'image',label:'Image'},
  {key:'link',label:'Link'},
  {key:'grid',label:'Grid'},
  {key:'layers',label:'Layers'},
  {key:'star',label:'Star'},
  {key:'bookmark',label:'Bookmark'},
  {key:'tag',label:'Tag'},
  {key:'filter',label:'Filter'},
  {key:'book',label:'Knowledge'},
  {key:'home',label:'Home'},
  {key:'rocket',label:'Launch'},
  {key:'cloud',label:'Cloud'},
  {key:'upload',label:'Upload'},
  {key:'download',label:'Download'},
  {key:'wifi',label:'Wi-Fi'},
  {key:'printer',label:'Printer'},
  {key:'creditcard',label:'Payment'},
  {key:'cart',label:'Cart'},
  {key:'truck',label:'Delivery'},
  {key:'building',label:'Building'},
  {key:'clipboard',label:'Clipboard'},
  {key:'pencil',label:'Edit'},
  {key:'piechart',label:'Pie Chart'},
  {key:'activity',label:'Activity'},
  {key:'terminal',label:'Terminal'},
  {key:'branch',label:'Branch'},
  {key:'code',label:'Code'},
  {key:'code2',label:'Code Block'},
  {key:'brackets',label:'Brackets'},
  {key:'bug',label:'Bug'},
  {key:'gitpullrequest',label:'Pull Request'},
  {key:'gitmerge',label:'Merge'},
  {key:'apinodes',label:'API'},
  {key:'webhook',label:'Webhook'},
  {key:'bot',label:'Automation'},
  {key:'testtube',label:'Test Lab'},
  {key:'deploy',label:'Deploy'},
  {key:'container',label:'Container'},
  {key:'sparkles',label:'Release'},
  {key:'filecode',label:'Code File'},
  {key:'cpu',label:'CPU'},
  {key:'harddrive',label:'Storage'},
  {key:'headset',label:'Support'},
  {key:'target',label:'Target'},
];
const MODULES=[
  {key:'Digital Form',page:'digital-form',label:'Digital Form',iconKey:'form'},
  {key:'PROMiS',page:'promis',label:'PROMiS Dashboard',iconKey:'dashboard'},
  {key:'Ops',page:'ops',label:'Executive Dashboard',iconKey:'chart'},
  {key:'Project Mgmt',page:'feat-pm',label:'Project Management',iconKey:'project'},
  {key:'Master Data',page:'feat-md',label:'Master Data',iconKey:'database'},
  {key:'Mobile App',page:'feat-mob',label:'Mobile App',iconKey:'mobile'},
  {key:'RBAC',page:'feat-rbac',label:'RBAC / Access Control',iconKey:'shield'},
  {key:'Landing Page',page:'feat-lp',label:'Landing Page',iconKey:'web'},
  {key:'Version Control',page:'feat-vc',label:'Version Control',iconKey:'version'},
  {key:'Backend',page:'feat-be',label:'Backend Integration',iconKey:'server'},
  {key:'Testing',page:'feat-qa',label:'Testing / QA',iconKey:'checklist'},
  {key:'Onboarding',page:'feat-ob',label:'Onboarding',iconKey:'users'},
  {key:'Fox Settings',page:'feat-settings',label:'Settings',iconKey:'settings'},
  {key:'Fox Trash',page:'feat-trash',label:'Trash',iconKey:'trash'},
];

// ════════════════════════════════════════════
// FEATURE DATA — notes + test groups per feature key
// ════════════════════════════════════════════
const featData={};
const FEATURE_ICON_MAP=Object.fromEntries(MODULES.map(m=>[m.key,m.iconKey]));
const DEFAULT_FEATURE_ICON_KEY='document';
const DEFAULT_FEATURE_ICON=FEATURE_ICON_SET[DEFAULT_FEATURE_ICON_KEY];
let moduleRows=[];
let deletedModuleRows=[];
let team=[];
let tickets=[];
let trash=[];
let appReady=false;
const pendingTicketSaves=new Map();
const pendingTestGroupSaves=new Map();
const pendingTestCaseSaves=new Map();
const pendingFeatureNoteSaves=new Map();
const pendingModuleMetaSaves=new Map();
const rteSelectionRanges=new Map();
const rteResizeHandlers=new Map();
const WORKSPACE_SECURITY_KEY='workspace_security';
const WORKSPACE_APPEARANCE_KEY='workspace_appearance';
const HOME_NOTE_KEY='home_quick_note';
const SIDEBAR_COLLAPSE_KEY='jiqsys_sidebar_collapsed';
const SIDEBAR_SCROLL_KEY='jiqsys_sidebar_scroll_top';
const FLOWCHART_SETTING_KEY='system_flowchart';
const FLOWCHART_SVG_NS='http://www.w3.org/2000/svg';
const FLOWCHART_PORT_IDS=['top','right','bottom','left'];
const FLOWCHART_PAD_X=20;
const FLOWCHART_PAD_Y=12;
const FLOWCHART_MIN_W=110;
const FLOWCHART_MIN_H={terminator:40,process:44,decision:52,parallelogram:44};
const FLOWCHART_LINE_H=18;
const FLOWCHART_SNAP_R=28;
const FLOWCHART_BOUND_PAD=28;
const AUTH_REMEMBER_KEY='jiqsys_workspace_unlock_hash';
let workspaceSecurity={password_enabled:false,password_hash:null};
let workspaceAppearance={theme:'light'};
let homeQuickNote='';
let sidebarCollapsed=false;
let sidebarScrollRestoreToken=0;
let flowchartState={nodes:[],conns:[]};
let flowchartUi={
  initialized:false,
  refs:null,
  sel:null,
  editingNodeId:null,
  editingConnId:null,
  nodeDrag:null,
  newConn:null,
  epDrag:null,
  panelType:null,
  dropping:false,
  skipCanvasClick:false,
  dblclickPending:false,
};

function uid(){return Math.random().toString(36).slice(2,9);}
function slugify(v){return String(v||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'item';}
function formatDeletedAt(v){return v?new Date(v).toLocaleString('en-MY',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';}
function showDbError(context,error){
  console.error(context,error);
  toast(`${context} failed`,{icon:'trash',duration:5000});
}
function getWorkspaceAccess(){
  return window.__JIQSYS_WORKSPACE_ACCESS__||null;
}
function hasWorkspacePermission(permission){
  const access=getWorkspaceAccess();
  if(!access||access.status!=='ready')return false;
  if(access.membership?.role==='owner')return true;
  return !!access.membership?.[permission];
}
function requireWorkspacePermission(permission,label='This action'){
  if(hasWorkspacePermission(permission))return true;
  toast(`${label} is not allowed for your account.`,{icon:'trash'});
  return false;
}
function getStatusCodeById(id){return statuses.find(s=>s.id===id)?.code||'';}
function getMemberNameById(id){
  if(!id)return 'Unassigned';
  const member=team.find(m=>m.id===id);
  return member?member.name:'Unassigned';
}
async function sha256Hex(input){
  const data=new TextEncoder().encode(input);
  const hashBuffer=await crypto.subtle.digest('SHA-256',data);
  return [...new Uint8Array(hashBuffer)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
function getDefaultWorkspaceSecurity(){
  return {password_enabled:false,password_hash:null};
}
function getDefaultWorkspaceAppearance(){
  return {theme:'light'};
}
function getDefaultHomeQuickNote(){
  return {blocks:[createHomeNoteBlock()]};
}
function createHomeNoteBlock(type='text',text='',checked=false,id=null){
  return {
    id:id||`hn-${uid()}`,
    type:type==='check'?'check':'text',
    text:String(text||''),
    checked:!!checked,
  };
}
function normalizeHomeQuickNote(raw){
  if(typeof raw==='string'){
    return trimHomeQuickNote({
      blocks:[createHomeNoteBlock('text',String(raw||'').slice(0,180))]
    });
  }
  const blocks=Array.isArray(raw?.blocks)
    ? raw.blocks.map(block=>createHomeNoteBlock(block?.type,block?.text,block?.checked,block?.id))
    : [];
  return trimHomeQuickNote({blocks:blocks.length?blocks:[createHomeNoteBlock()]});
}
function trimHomeQuickNote(note){
  let remaining=180;
  const blocks=(Array.isArray(note?.blocks)?note.blocks:[createHomeNoteBlock()]).map(block=>{
    const nextText=String(block.text||'').slice(0,Math.max(0,remaining));
    remaining=Math.max(0,remaining-nextText.length);
    return {...block,text:nextText};
  });
  return {blocks:blocks.length?blocks:[createHomeNoteBlock()]};
}
function getHomeQuickNoteBlocks(){
  homeQuickNote=normalizeHomeQuickNote(homeQuickNote);
  return homeQuickNote.blocks;
}
function getHomeQuickNoteBlock(id){
  return getHomeQuickNoteBlocks().find(block=>block.id===id)||null;
}
function getHomeQuickNoteCharCount(){
  return getHomeQuickNoteBlocks().reduce((sum,block)=>sum+String(block.text||'').length,0);
}
function getSidebarToggleIcon(){
  return sidebarCollapsed
    ? `<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><polyline points="12 9 15 12 12 15"/>`
    : `<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="9" y1="4" x2="9" y2="20"/><polyline points="14 9 11 12 14 15"/>`;
}
function getSidebarScrollElement(){
  return document.getElementById('app-sidebar-scroll')||document.getElementById('app-sidebar');
}
function getSidebarScrollTop(){
  const sidebar=getSidebarScrollElement();
  if(sidebar)return sidebar.scrollTop;
  try{
    const stored=Number(localStorage.getItem(SIDEBAR_SCROLL_KEY)||'0');
    return Number.isFinite(stored)&&stored>0?stored:0;
  }catch(error){
    return 0;
  }
}
function saveSidebarScroll(scrollTop){
  const next=Math.max(0,Math.round(Number(scrollTop)||0));
  try{
    localStorage.setItem(SIDEBAR_SCROLL_KEY,String(next));
  }catch(error){}
}
function restoreSidebarScroll(scrollTop=getSidebarScrollTop()){
  const sidebar=getSidebarScrollElement();
  if(!sidebar)return;
  const next=Math.max(0,Math.round(Number(scrollTop)||0));
  const token=++sidebarScrollRestoreToken;
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      if(token!==sidebarScrollRestoreToken)return;
      const maxScroll=Math.max(0,sidebar.scrollHeight-sidebar.clientHeight);
      sidebar.scrollTop=Math.min(next,maxScroll);
    });
  });
}
function initSidebarScrollSync(){
  const sidebar=getSidebarScrollElement();
  if(!sidebar||sidebar.dataset.scrollSync==='1')return;
  sidebar.addEventListener('scroll',()=>saveSidebarScroll(sidebar.scrollTop),{passive:true});
  sidebar.dataset.scrollSync='1';
  restoreSidebarScroll();
}
function applySidebarState(){
  document.getElementById('app-shell')?.classList.toggle('sidebar-collapsed',sidebarCollapsed);
  const btn=document.getElementById('sidebar-toggle');
  if(btn){
    const label=sidebarCollapsed?'Open sidebar':'Close sidebar';
    btn.setAttribute('aria-label',label);
    btn.title=label;
    btn.innerHTML=`<svg viewBox="0 0 24 24">${getSidebarToggleIcon()}</svg>`;
  }
}
function loadSidebarState(){
  try{
    sidebarCollapsed=localStorage.getItem(SIDEBAR_COLLAPSE_KEY)==='1';
  }catch(error){
    sidebarCollapsed=false;
  }
  applySidebarState();
  restoreSidebarScroll();
}
function toggleSidebar(){
  const sidebarScrollTop=getSidebarScrollTop();
  sidebarCollapsed=!sidebarCollapsed;
  try{
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY,sidebarCollapsed?'1':'0');
  }catch(error){}
  applySidebarState();
  restoreSidebarScroll(sidebarScrollTop);
}
function applyWorkspaceTheme(theme){
  const nextTheme=theme==='dark'?'dark':'light';
  document.documentElement.setAttribute('data-theme',nextTheme);
}
function hasWorkspacePassword(){
  return !!(workspaceSecurity.password_enabled&&workspaceSecurity.password_hash);
}
function isWorkspaceUnlocked(){
  if(!hasWorkspacePassword())return true;
  return localStorage.getItem(AUTH_REMEMBER_KEY)===workspaceSecurity.password_hash;
}
function setWorkspaceUnlocked(v){
  if(v&&workspaceSecurity.password_hash)localStorage.setItem(AUTH_REMEMBER_KEY,workspaceSecurity.password_hash);
  else localStorage.removeItem(AUTH_REMEMBER_KEY);
}
function setAuthMessage(message,target='auth-msg'){
  const el=document.getElementById(target);
  if(el)el.textContent=message||'';
}
async function loadWorkspaceSecurity(){
  const {data,error}=await supabaseClient
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key',WORKSPACE_SECURITY_KEY)
    .maybeSingle();
  if(error)throw error;
  if(!data){
    const defaults=getDefaultWorkspaceSecurity();
    const {error:insertError}=await supabaseClient
      .from('app_settings')
      .insert({setting_key:WORKSPACE_SECURITY_KEY,setting_value:defaults});
    if(insertError)throw insertError;
    workspaceSecurity=defaults;
    return;
  }
  workspaceSecurity={
    ...getDefaultWorkspaceSecurity(),
    ...(data.setting_value||{})
  };
}
async function loadWorkspaceAppearance(){
  const {data,error}=await supabaseClient
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key',WORKSPACE_APPEARANCE_KEY)
    .maybeSingle();
  if(error)throw error;
  if(!data){
    const defaults=getDefaultWorkspaceAppearance();
    const {error:insertError}=await supabaseClient
      .from('app_settings')
      .insert({setting_key:WORKSPACE_APPEARANCE_KEY,setting_value:defaults});
    if(insertError)throw insertError;
    workspaceAppearance=defaults;
    applyWorkspaceTheme(defaults.theme);
    return;
  }
  workspaceAppearance={
    ...getDefaultWorkspaceAppearance(),
    ...(data.setting_value||{})
  };
  applyWorkspaceTheme(workspaceAppearance.theme);
}
async function persistWorkspaceSecurity(nextSecurity){
  const payload={
    ...getDefaultWorkspaceSecurity(),
    ...(nextSecurity||{})
  };
  const {error}=await supabaseClient
    .from('app_settings')
    .upsert({
      setting_key:WORKSPACE_SECURITY_KEY,
      setting_value:payload
    },{onConflict:'setting_key'});
  if(error)throw error;
  workspaceSecurity=payload;
}
async function persistWorkspaceAppearance(nextAppearance){
  const payload={
    ...getDefaultWorkspaceAppearance(),
    ...(nextAppearance||{})
  };
  const {error}=await supabaseClient
    .from('app_settings')
    .upsert({
      setting_key:WORKSPACE_APPEARANCE_KEY,
      setting_value:payload
    },{onConflict:'setting_key'});
  if(error)throw error;
  workspaceAppearance=payload;
  applyWorkspaceTheme(payload.theme);
}
async function loadHomeQuickNote(){
  const {data,error}=await supabaseClient
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key',HOME_NOTE_KEY)
    .maybeSingle();
  if(error)throw error;
  if(!data){
    const defaults=getDefaultHomeQuickNote();
    const {error:insertError}=await supabaseClient
      .from('app_settings')
      .insert({setting_key:HOME_NOTE_KEY,setting_value:defaults});
    if(insertError)throw insertError;
    homeQuickNote=defaults;
    return;
  }
  homeQuickNote=normalizeHomeQuickNote(data.setting_value);
}
let pendingHomeNoteSave=null;
function queueHomeNoteSave(delay=300){
  clearTimeout(pendingHomeNoteSave);
  pendingHomeNoteSave=setTimeout(async()=>{
    try{
      homeQuickNote=normalizeHomeQuickNote(homeQuickNote);
      const {error}=await supabaseClient
        .from('app_settings')
        .upsert({
          setting_key:HOME_NOTE_KEY,
          setting_value:homeQuickNote
        },{onConflict:'setting_key'});
      if(error)throw error;
    }catch(error){
      showDbError('Saving home quick note',error);
    }finally{
      pendingHomeNoteSave=null;
    }
  },delay);
}
const flowchartMeasureCanvas=document.createElement('canvas');
const flowchartMeasureContext=flowchartMeasureCanvas.getContext('2d');
flowchartMeasureContext.font='500 12px "DM Sans",sans-serif';

function flowchartNodeId(){return `fc-node-${uid()}`;}
function flowchartConnId(){return `fc-conn-${uid()}`;}
function flowchartDefaultLabel(type){
  return ({
    terminator:'Terminator',
    process:'Process',
    decision:'Decision',
    parallelogram:'Parallelogram',
  })[type]||'Process';
}
function flowchartMeasureLabel(label){
  const lines=String(label||' ').split('\n');
  let maxW=0;
  for(const line of lines)maxW=Math.max(maxW,flowchartMeasureContext.measureText(line||' ').width);
  return {textW:Math.ceil(maxW),lines:lines.length};
}
function flowchartSizeFor(node){
  const {textW,lines}=flowchartMeasureLabel(node.label);
  const minH=FLOWCHART_MIN_H[node.type]||44;
  const extra=node.type==='decision'?1.5:1;
  return {
    w:Math.max(FLOWCHART_MIN_W,(textW+FLOWCHART_PAD_X*2)*extra),
    h:Math.max(minH,(lines*FLOWCHART_LINE_H+FLOWCHART_PAD_Y*2)*extra),
  };
}
function createFlowchartNode(type='process',x=240,y=180,label=null){
  const node={
    id:flowchartNodeId(),
    type:['terminator','process','decision','parallelogram'].includes(type)?type:'process',
    x,
    y,
    label:String(label||flowchartDefaultLabel(type)),
    w:0,
    h:0,
  };
  const size=flowchartSizeFor(node);
  node.w=size.w;
  node.h=size.h;
  return node;
}
function flowchartInferPortBetween(fromNode,toNode){
  if(!fromNode||!toNode)return 'top';
  const dx=toNode.x-fromNode.x;
  const dy=toNode.y-fromNode.y;
  if(Math.abs(dx)>=Math.abs(dy))return dx>=0?'right':'left';
  return dy>=0?'bottom':'top';
}
function createStarterFlowchartState(){
  const start=createFlowchartNode('terminator',480,120,'Start');
  const process=createFlowchartNode('process',480,240,'Process');
  const decision=createFlowchartNode('decision',480,390,'Decision?');
  const end=createFlowchartNode('terminator',480,540,'End');
  return {
    nodes:[start,process,decision,end],
    conns:[
      {id:flowchartConnId(),from:start.id,fromPort:'bottom',to:process.id,toPort:'top',label:''},
      {id:flowchartConnId(),from:process.id,fromPort:'bottom',to:decision.id,toPort:'top',label:''},
      {id:flowchartConnId(),from:decision.id,fromPort:'bottom',to:end.id,toPort:'top',label:'Yes'},
    ],
  };
}
function getDefaultFlowchartState(){
  return createStarterFlowchartState();
}
function migrateLegacyFlowchartState(raw){
  if(!raw||!Array.isArray(raw.canvases))return raw;
  const activeCanvas=raw.canvases.find(canvas=>canvas.id===raw.activeCanvasId)||raw.canvases[0]||{};
  const nodes=(Array.isArray(activeCanvas.shapes)?activeCanvas.shapes:[]).map(shape=>{
    const type=shape.type==='terminal'?'terminator':shape.type;
    const node=createFlowchartNode(type,Number(shape.x)||240,Number(shape.y)||180,String(shape.label||'').trim()||flowchartDefaultLabel(type));
    if(Number.isFinite(Number(shape.w)))node.w=Math.max(flowchartSizeFor(node).w,Number(shape.w));
    if(Number.isFinite(Number(shape.h)))node.h=Math.max(flowchartSizeFor(node).h,Number(shape.h));
    node.id=shape.id||flowchartNodeId();
    return node;
  });
  const nodeMap=new Map(nodes.map(node=>[node.id,node]));
  const conns=(Array.isArray(activeCanvas.links)?activeCanvas.links:[]).map(link=>{
    const fromNode=nodeMap.get(link.from);
    const toNode=nodeMap.get(link.to);
    if(!fromNode||!toNode)return null;
    return {
      id:link.id||flowchartConnId(),
      from:fromNode.id,
      fromPort:FLOWCHART_PORT_IDS.includes(link.fromSide)?link.fromSide:flowchartInferPortBetween(fromNode,toNode),
      to:toNode.id,
      toPort:FLOWCHART_PORT_IDS.includes(link.toSide)?link.toSide:flowchartInferPortBetween(toNode,fromNode),
      label:'',
    };
  }).filter(Boolean);
  return {nodes,conns};
}
function ensureFlowchartState(){
  let next=flowchartState;
  if(next&&Array.isArray(next.canvases))next=migrateLegacyFlowchartState(next);
  let nodes=Array.isArray(next?.nodes)?next.nodes:[];
  let conns=Array.isArray(next?.conns)?next.conns:[];
  if(!nodes.length&&!conns.length){
    const starter=getDefaultFlowchartState();
    nodes=starter.nodes;
    conns=starter.conns;
  }
  const normalizedNodes=nodes.map(node=>{
    const type=['terminator','process','decision','parallelogram'].includes(node?.type)?node.type:'process';
    const label=String(node?.label||'').trim()||flowchartDefaultLabel(type);
    const normalized={
      id:node?.id||flowchartNodeId(),
      type,
      x:Number.isFinite(Number(node?.x))?Number(node.x):240,
      y:Number.isFinite(Number(node?.y))?Number(node.y):180,
      label,
      w:0,
      h:0,
    };
    const size=flowchartSizeFor(normalized);
    normalized.w=Math.max(size.w,Number.isFinite(Number(node?.w))?Number(node.w):0);
    normalized.h=Math.max(size.h,Number.isFinite(Number(node?.h))?Number(node.h):0);
    return normalized;
  });
  const nodeMap=new Map(normalizedNodes.map(node=>[node.id,node]));
  const normalizedConns=conns.map(conn=>{
    const fromNode=nodeMap.get(conn?.from);
    const toNode=nodeMap.get(conn?.to);
    if(!fromNode||!toNode)return null;
    return {
      id:conn?.id||flowchartConnId(),
      from:fromNode.id,
      fromPort:FLOWCHART_PORT_IDS.includes(conn?.fromPort)?conn.fromPort:flowchartInferPortBetween(fromNode,toNode),
      to:toNode.id,
      toPort:FLOWCHART_PORT_IDS.includes(conn?.toPort)?conn.toPort:flowchartInferPortBetween(toNode,fromNode),
      label:String(conn?.label||''),
    };
  }).filter(Boolean);
  flowchartState={nodes:normalizedNodes,conns:normalizedConns};
  if(flowchartUi.sel){
    const exists=flowchartUi.sel.type==='node'
      ? normalizedNodes.some(node=>node.id===flowchartUi.sel.id)
      : normalizedConns.some(conn=>conn.id===flowchartUi.sel.id);
    if(!exists)flowchartUi.sel=null;
  }
  if(flowchartUi.editingNodeId&&!nodeMap.has(flowchartUi.editingNodeId))flowchartUi.editingNodeId=null;
  if(flowchartUi.editingConnId&&!normalizedConns.some(conn=>conn.id===flowchartUi.editingConnId))flowchartUi.editingConnId=null;
  return flowchartState;
}
async function loadFlowchartState(){
  const {data,error}=await supabaseClient
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key',FLOWCHART_SETTING_KEY)
    .maybeSingle();
  if(error)throw error;
  if(!data){
    flowchartState=getDefaultFlowchartState();
    const {error:insertError}=await supabaseClient
      .from('app_settings')
      .insert({setting_key:FLOWCHART_SETTING_KEY,setting_value:serializeFlowchartState()});
    if(insertError)throw insertError;
    return;
  }
  flowchartState=data.setting_value||getDefaultFlowchartState();
  ensureFlowchartState();
}
function serializeFlowchartState(){
  const state=ensureFlowchartState();
  return {
    nodes:state.nodes.map(node=>({
      id:node.id,
      type:node.type,
      x:node.x,
      y:node.y,
      w:node.w,
      h:node.h,
      label:node.label,
    })),
    conns:state.conns.map(conn=>({
      id:conn.id,
      from:conn.from,
      fromPort:conn.fromPort,
      to:conn.to,
      toPort:conn.toPort,
      label:conn.label||'',
    })),
  };
}
let pendingFlowchartSave=null;
function queueFlowchartSave(delay=250){
  clearTimeout(pendingFlowchartSave);
  pendingFlowchartSave=setTimeout(async()=>{
    try{
      const {error}=await supabaseClient
        .from('app_settings')
        .upsert({
          setting_key:FLOWCHART_SETTING_KEY,
          setting_value:serializeFlowchartState()
        },{onConflict:'setting_key'});
      if(error)throw error;
    }catch(error){
      showDbError('Saving system flowchart',error);
    }finally{
      pendingFlowchartSave=null;
    }
  },delay);
}
function configureAuthScreen(){
  const subtitle=document.getElementById('auth-subtitle');
  const submit=document.getElementById('auth-submit-btn');
  const confirmWrap=document.getElementById('auth-confirm-wrap');
  const note=document.getElementById('auth-note');
  const password=document.getElementById('auth-password');
  const confirm=document.getElementById('auth-password-confirm');
  if(subtitle)subtitle.textContent='Enter your password to unlock the workspace.';
  if(submit)submit.textContent='Unlock';
  if(confirmWrap)confirmWrap.style.display='none';
  if(note)note.textContent='This device stays remembered after you unlock. Change the password later from Settings.';
  if(password)password.value='';
  if(confirm)confirm.value='';
  setAuthMessage('');
  const label=document.getElementById('auth-password-label');
  if(label)label.textContent='Password';
  setTimeout(()=>document.getElementById('auth-password')?.focus(),40);
}
function openAuthGate(){
  if(!hasWorkspacePassword()){
    closeAuthGate();
    return;
  }
  configureAuthScreen();
  const ovl=document.getElementById('auth-ovl');
  if(ovl)ovl.classList.remove('hidden');
}
function closeAuthGate(){
  const ovl=document.getElementById('auth-ovl');
  if(ovl)ovl.classList.add('hidden');
}
async function submitAccessPassword(){
  if(!hasWorkspacePassword()){
    closeAuthGate();
    return;
  }
  const password=document.getElementById('auth-password')?.value||'';
  if(password.length<4){
    setAuthMessage('Use at least 4 characters.');
    return;
  }
  const matches=await sha256Hex(password)===workspaceSecurity.password_hash;
  if(!matches){
    setAuthMessage('Incorrect password.');
    return;
  }
  setWorkspaceUnlocked(true);
  closeAuthGate();
}
function initWorkspaceAccess(){
  if(!hasWorkspacePassword()||isWorkspaceUnlocked()){
    closeAuthGate();
  }else{
    openAuthGate();
  }
}
function switchSettingsSection(section){
  if(section==='members'&&!hasWorkspacePermission('can_manage_members')){
    section='general';
  }
  document.querySelectorAll('[data-st-section]').forEach(btn=>btn.classList.toggle('active',btn.dataset.stSection===section));
  document.querySelectorAll('[data-st-pane]').forEach(pane=>pane.classList.toggle('active',pane.dataset.stPane===section));
}
function refreshSettingsSecurityUi(syncToggle=true){
  const hasPassword=hasWorkspacePassword();
  const status=document.getElementById('security-status-text');
  if(status)status.textContent=hasPassword?'Password enabled and saved in Supabase':'Password disabled';
  const enabled=document.getElementById('settings-password-enabled');
  if(enabled&&syncToggle)enabled.checked=!!workspaceSecurity.password_enabled;
  const effectiveEnabled=enabled?enabled.checked:!!workspaceSecurity.password_enabled;
  const password=document.getElementById('settings-password');
  const confirm=document.getElementById('settings-password-confirm');
  if(password)password.disabled=!effectiveEnabled;
  if(confirm)confirm.disabled=!effectiveEnabled;
  const lockBtn=[...document.querySelectorAll('#settings-ovl .st-actions .btn')].find(btn=>btn.textContent.trim()==='Lock Now');
  if(lockBtn)lockBtn.disabled=!hasPassword;
  const msg=document.getElementById('settings-password-msg');
  if(msg)msg.textContent='';
}
function refreshSettingsAppearanceUi(syncInputs=true){
  const theme=(workspaceAppearance.theme==='dark')?'dark':'light';
  const checkedTheme=syncInputs?theme:(document.querySelector('input[name="appearance-theme"]:checked')?.value||theme);
  const lightInput=document.querySelector('input[name="appearance-theme"][value="light"]');
  const darkInput=document.querySelector('input[name="appearance-theme"][value="dark"]');
  if(syncInputs){
    if(lightInput)lightInput.checked=theme==='light';
    if(darkInput)darkInput.checked=theme==='dark';
  }
  document.getElementById('appearance-option-light')?.classList.toggle('active',checkedTheme==='light');
  document.getElementById('appearance-option-dark')?.classList.toggle('active',checkedTheme==='dark');
}
function openSettingsModal(section='general'){
  switchSettingsSection(section);
  refreshSettingsAppearanceUi();
  refreshSettingsSecurityUi();
  openOvl('settings-ovl');
}
async function saveSettingsAppearance(){
  if(!requireWorkspacePermission('can_manage_settings','Managing workspace settings'))return;
  const theme=document.querySelector('input[name="appearance-theme"]:checked')?.value||'light';
  try{
    await persistWorkspaceAppearance({theme});
    refreshSettingsAppearanceUi();
    toast(`Switched to ${theme==='dark'?'dark':'light'} mode`,{icon:'settings'});
  }catch(error){
    showDbError('Saving workspace appearance',error);
  }
}
async function saveSettingsPassword(){
  if(!requireWorkspacePermission('can_manage_settings','Managing workspace settings'))return;
  const enabled=!!document.getElementById('settings-password-enabled')?.checked;
  const password=document.getElementById('settings-password')?.value||'';
  const confirm=document.getElementById('settings-password-confirm')?.value||'';
  try{
    if(!enabled){
      await persistWorkspaceSecurity(getDefaultWorkspaceSecurity());
      setWorkspaceUnlocked(false);
      document.getElementById('settings-password').value='';
      document.getElementById('settings-password-confirm').value='';
      refreshSettingsSecurityUi();
      closeAuthGate();
      toast('Password disabled',{icon:'restore'});
      return;
    }
    let nextHash=workspaceSecurity.password_hash||null;
    const wantsPasswordChange=password||confirm;
    if(!nextHash&&!wantsPasswordChange){
      setAuthMessage('Set a password before enabling the lock.','settings-password-msg');
      return;
    }
    if(wantsPasswordChange){
      if(password.length<4){
        setAuthMessage('Use at least 4 characters.','settings-password-msg');
        return;
      }
      if(password!==confirm){
        setAuthMessage('Passwords do not match.','settings-password-msg');
        return;
      }
      nextHash=await sha256Hex(password);
    }
    await persistWorkspaceSecurity({
      password_enabled:true,
      password_hash:nextHash
    });
    setWorkspaceUnlocked(true);
    document.getElementById('settings-password').value='';
    document.getElementById('settings-password-confirm').value='';
    refreshSettingsSecurityUi();
    closeAuthGate();
    toast(wantsPasswordChange?'Password updated':'Password lock enabled',{icon:'check'});
  }catch(error){
    showDbError('Saving workspace security',error);
    setAuthMessage('Could not save security settings.','settings-password-msg');
  }
}
function clearWorkspacePassword(){
  if(!requireWorkspacePermission('can_manage_settings','Managing workspace settings'))return;
  const toggle=document.getElementById('settings-password-enabled');
  if(toggle)toggle.checked=false;
  document.getElementById('settings-password').value='';
  document.getElementById('settings-password-confirm').value='';
  saveSettingsPassword();
}
function lockWorkspaceNow(){
  if(!requireWorkspacePermission('can_manage_settings','Managing workspace settings'))return;
  closeOvl('settings-ovl');
  setWorkspaceUnlocked(false);
  if(hasWorkspacePassword())openAuthGate();
}
function normalizeTicket(t){
  t.modules=t.modules||[];
  t.frefs=t.frefs||[];
  t.activity=t.activity||[];
  t.assignee=getMemberNameById(t.assigneeId);
  t.deletedAt=t.deletedAtRaw?formatDeletedAt(t.deletedAtRaw):'';
  return t;
}
function refreshDerivedTickets(){
  tickets=tickets.map(normalizeTicket);
  trash=trash.map(normalizeTicket);
}
function buildTicketPayload(ticket){
  return {
    ticket_no:ticket.id,
    title:ticket.title,
    description:ticket.desc||null,
    status_id:ticket.statusId,
    priority:ticket.priority,
    assignee_id:ticket.assigneeId||null,
    start_date:ticket.start||null,
    due_date:ticket.due||null,
    deleted_at:ticket.deletedAtRaw||null,
  };
}
function nextTicketNo(){
  return `TK-${Date.now().toString().slice(-6)}${Math.floor(Math.random()*10)}`;
}
function getFeatureRows(){
  return [...moduleRows].sort((a,b)=>(a.sort_order??999)-(b.sort_order??999)||String(a.name||'').localeCompare(String(b.name||'')));
}
function getFeatureKeyFromRow(row){return `feature-${row.page_slug}`;}
function getFeatureRowByKey(fk){return getFeatureRows().find(row=>getFeatureKeyFromRow(row)===fk)||null;}
function getFeatureKeyByModuleKey(moduleKey){
  const row=moduleRows.find(r=>r.module_key===moduleKey);
  return row?getFeatureKeyFromRow(row):null;
}
function getDeletedFeatureRows(){
  return [...deletedModuleRows].sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
}
function buildFeatureDetailSnapshot(fk){
  const state=ensureFeatureState(fk);
  return {
    activeCanvasId:state.activeCanvasId,
    sidebarCollapsed:!!state.sidebarCollapsed,
    canvases:state.canvases.map((canvas,index)=>({
      id:canvas.id,
      title:canvas.title,
      content:canvas.content||'',
      preview:featureCanvasPreview(canvas),
      index:index+1,
    })),
  };
}
function syncFeatureBridge(){
  const active=getFeatureRows().map(row=>({
    ...row,
    fk:getFeatureKeyFromRow(row),
    iconSvg:getFeatureIcon(row),
    summary:buildFeatureSummary(row.module_key),
    linkedTickets:buildFeatureLinkedTickets(row.module_key),
    detail:buildFeatureDetailSnapshot(getFeatureKeyFromRow(row)),
    testGroups:ensureFeatureState(getFeatureKeyFromRow(row)).testGroups.map(group=>({
      id:group.id,
      name:group.name,
      open:!!group.open,
      items:(group.items||[]).map(item=>({
        id:item.id,
        label:item.label||'',
      })),
    })),
  }));
  const deleted=getDeletedFeatureRows().map(row=>({
    ...row,
    fk:getFeatureKeyFromRow(row),
    iconSvg:getFeatureIcon(row),
  }));
  window.__jiqsysFeatures=active;
  window.__jiqsysDeletedFeatures=deleted;
  window.dispatchEvent(new CustomEvent('jiqsys:features-change',{detail:{active,deleted}}));
}
function buildFeatureSummary(moduleKey){
  const linked=tickets.filter(t=>t.modules.includes(moduleKey));
  const counts={};
  linked.forEach(t=>{
    counts[t.statusId]=(counts[t.statusId]||0)+1;
  });
  const activeStatuses=statuses
    .filter(s=>counts[s.id]>0)
    .map(s=>({id:s.id,name:s.name,color:s.color,count:counts[s.id]}))
    .sort((a,b)=>b.count-a.count);
  return {
    linkedTickets:linked.length,
    activeStatuses:activeStatuses.length,
    statuses:activeStatuses,
  };
}
function buildFeatureLinkedTickets(moduleKey){
  return tickets
    .filter(t=>t.modules.includes(moduleKey))
    .map(t=>{
      const s=getSt(t.statusId);
      return {
        id:t.id,
        title:t.title,
        assignee:t.assignee,
        dueText:t.due?`Due ${fmtD(t.due)}`:'',
        priority:t.priority,
        priorityColor:({'To Do ASAP':'#b4235d',Critical:'#b03a2e',High:'#8a6800',Normal:'#6f6e69',Low:'#2a56a8'})[t.priority]||'var(--tm)',
        status:{id:s.id,name:s.name,color:s.color},
        refs:t.frefs&&t.frefs.length?[...t.frefs]:[],
      };
    });
}
function syncNavigationBridge(page){
  window.__jiqsysActivePage=page;
  window.dispatchEvent(new CustomEvent('jiqsys:active-page-change',{detail:page}));
}
function createFeatureCanvas(title='Canvas 1',content=''){
  return {id:`canvas-${uid()}`,title,content};
}
function ensureFeatureState(fk){
  if(!featData[fk])featData[fk]={canvases:[createFeatureCanvas()],activeCanvasId:null,sidebarCollapsed:false,testGroups:[]};
  if(!Array.isArray(featData[fk].canvases)||!featData[fk].canvases.length){
    featData[fk].canvases=[createFeatureCanvas()];
  }
  featData[fk].canvases=featData[fk].canvases.map((canvas,index)=>({
    id:canvas.id||`canvas-${uid()}`,
    title:(canvas.title||`Canvas ${index+1}`).trim()||`Canvas ${index+1}`,
    content:canvas.content||''
  }));
  if(!featData[fk].activeCanvasId||!featData[fk].canvases.some(canvas=>canvas.id===featData[fk].activeCanvasId)){
    featData[fk].activeCanvasId=featData[fk].canvases[0].id;
  }
  if(typeof featData[fk].sidebarCollapsed!=='boolean')featData[fk].sidebarCollapsed=false;
  return featData[fk];
}
function getActiveFeatureCanvas(fk){
  const state=ensureFeatureState(fk);
  return state.canvases.find(canvas=>canvas.id===state.activeCanvasId)||state.canvases[0];
}
function parseFeatureNotesPayload(raw){
  if(!raw)return {canvases:[createFeatureCanvas()],activeCanvasId:null};
  try{
    const parsed=JSON.parse(raw);
    if(parsed&&Array.isArray(parsed.canvases)&&parsed.canvases.length){
      return {
        canvases:parsed.canvases.map((canvas,index)=>({
          id:canvas.id||`canvas-${uid()}`,
          title:(canvas.title||`Canvas ${index+1}`).trim()||`Canvas ${index+1}`,
          content:canvas.content||''
        })),
        activeCanvasId:parsed.activeCanvasId||parsed.canvases[0]?.id||null,
        sidebarCollapsed:!!parsed.sidebarCollapsed,
      };
    }
  }catch(error){}
  return {canvases:[createFeatureCanvas('Canvas 1',raw)],activeCanvasId:null,sidebarCollapsed:false};
}
function serializeFeatureNotesPayload(fk){
  const state=ensureFeatureState(fk);
  return JSON.stringify({
    version:2,
    activeCanvasId:state.activeCanvasId,
    sidebarCollapsed:state.sidebarCollapsed,
    canvases:state.canvases.map(canvas=>({
      id:canvas.id,
      title:canvas.title,
      content:canvas.content||''
    }))
  });
}
function getModuleRowByFeatKey(fk){
  return getFeatureRowByKey(fk);
}
function getTestGroupById(fk,gid){
  return ensureFeatureState(fk).testGroups.find(group=>group.id===gid)||null;
}
function upsertLocalTrash(ticket){
  const idx=trash.findIndex(x=>x.rowId===ticket.rowId);
  if(idx>-1)trash[idx]=ticket;
  else trash.unshift(ticket);
}
function removeLocalTrash(rowId){trash=trash.filter(t=>t.rowId!==rowId);}
async function appendActivity(ticket,actionType,message,meta={}){
  ticket.activity.unshift({user:'System',av:'SY',text:message,time:'Just now'});
  if(!ticket.rowId)return;
  const {error}=await supabaseClient.from('ticket_activity').insert({
    ticket_id:ticket.rowId,
    action_type:actionType,
    message,
    meta
  });
  if(error)console.error('append activity failed',error);
}
async function syncTicketModules(ticket){
  if(!ticket.rowId)return;
  const moduleIds=ticket.modules
    .map(key=>moduleRows.find(row=>row.module_key===key)?.id)
    .filter(Boolean);
  const {error:deleteError}=await supabaseClient.from('ticket_modules').delete().eq('ticket_id',ticket.rowId);
  if(deleteError)throw deleteError;
  if(!moduleIds.length)return;
  const {error:insertError}=await supabaseClient.from('ticket_modules').insert(
    moduleIds.map(moduleId=>({ticket_id:ticket.rowId,module_id:moduleId}))
  );
  if(insertError)throw insertError;
}
async function persistTicket(ticket){
  if(!ticket.rowId)return;
  const {error}=await supabaseClient.from('tickets').update(buildTicketPayload(ticket)).eq('id',ticket.rowId);
  if(error)throw error;
}
function queueTicketPersist(ticket,delay=300){
  if(!ticket?.rowId)return;
  clearTimeout(pendingTicketSaves.get(ticket.rowId));
  const timeout=setTimeout(async()=>{
    try{
      await persistTicket(ticket);
    }catch(error){
      showDbError(`Saving ticket ${ticket.id}`,error);
    }finally{
      pendingTicketSaves.delete(ticket.rowId);
    }
  },delay);
  pendingTicketSaves.set(ticket.rowId,timeout);
}
async function loadStatuses(){
  const {data,error}=await supabaseClient
    .from('statuses')
    .select('id, code, name, color, sort_order')
    .eq('is_active',true)
    .order('sort_order');
  if(error)throw error;
  statuses=(data&&data.length?data:DEFAULT_STATUSES).map((row,i)=>({
    id:row.id||`status-${i}`,
    code:row.code||slugify(row.name),
    name:row.name,
    color:row.color
  }));
  syncFeatureBridge();
}
async function loadModules(){
  const [{data:activeRows,error:activeError},{data:inactiveRows,error:inactiveError}]=await Promise.all([
    supabaseClient
      .from('modules')
      .select('id, module_key, name, page_slug, icon_key, description, sort_order')
      .eq('is_active',true)
      .order('sort_order'),
    supabaseClient
      .from('modules')
      .select('id, module_key, name, page_slug, icon_key, description, sort_order')
      .eq('is_active',false)
      .order('name')
  ]);
  if(activeError)throw activeError;
  if(inactiveError)throw inactiveError;
  moduleRows=activeRows||[];
  deletedModuleRows=inactiveRows||[];
  syncFeatureBridge();
}
function updateFeatureNavLabel(fk,name){
  const item=document.querySelector(`#feature-nav .ni-feat[data-feature-key="${fk}"] span`);
  if(item)item.textContent=name;
}
function updateFeatureNavIcon(fk,row){
  const icon=document.querySelector(`#feature-nav .ni-feat[data-feature-key="${fk}"] > svg`);
  if(icon)icon.innerHTML=getFeatureIcon(row);
}
function queueModuleMetaSave(fk,delay=350){
  clearTimeout(pendingModuleMetaSaves.get(fk));
  const timeout=setTimeout(async()=>{
    try{
      const row=getFeatureRowByKey(fk);
      if(!row)return;
      const {error}=await supabaseClient
        .from('modules')
        .update({
          name:row.name,
          description:row.description||null,
          icon_key:getFeatureIconKey(row),
        })
        .eq('id',row.id);
      if(error)throw error;
    }catch(error){
      showDbError('Saving feature title and description',error);
    }finally{
      pendingModuleMetaSaves.delete(fk);
    }
  },delay);
  pendingModuleMetaSaves.set(fk,timeout);
}
function updateFeatureMeta(fk,field,value){
  if(!requireWorkspacePermission('can_edit_features','Editing features'))return;
  const row=getFeatureRowByKey(fk);
  if(!row)return;
  row[field]=field==='name'?String(value||'').trimStart():String(value||'');
  if(field==='name'){
    updateFeatureNavLabel(fk,row.name||'Untitled Feature');
  }
  syncFeatureBridge();
  queueModuleMetaSave(fk);
}
function autosizeFeatureDescription(el){
  if(!el)return;
  el.style.height='auto';
  el.style.height=`${Math.max(el.scrollHeight,24)}px`;
}
function mountFeatureSidebarShell(){
  if(document.getElementById('feature-nav'))return;
  const shellHost=document.getElementById('feature-sidebar-shell');
  if(!shellHost)return;
  const shell=document.createElement('div');
  shell.innerHTML=`
    <div class="feature-side-head">
      <div class="slbl" style="padding:0;margin:0">Features</div>
      <button class="feat-add-btn" type="button" onclick="openFeatureModal()" aria-label="Add feature" title="Add feature">+</button>
    </div>
    <div class="ss" id="feature-nav"></div>`;
  shellHost.replaceChildren(shell);
}
function mountFeaturePagesShell(){
  return document.getElementById('dynamic-feature-pages');
}
function mountFeatureModalShell(){
  if(document.getElementById('feature-ovl'))return;
  document.body.insertAdjacentHTML('beforeend',`
  <div class="ovl" id="feature-ovl">
    <div class="modal" style="width:420px;max-width:95vw">
      <div class="mhd">
        <div class="mttl">Add Feature</div>
        <button class="mcls" onclick="closeOvl('feature-ovl')">×</button>
      </div>
      <div class="mbdy">
        <div class="feature-create-head">
          <div class="feature-icon-side">
            <div class="ilbl">Icon</div>
            <div class="feature-icon-preview" id="feature-icon-preview" aria-hidden="true"></div>
            <input id="feature-icon" type="hidden" value="${DEFAULT_FEATURE_ICON_KEY}"/>
          </div>
          <div class="fr" style="margin-bottom:0">
            <div class="ilbl">Title <span style="color:var(--red)">*</span></div>
            <input class="inf" id="feature-title" placeholder="e.g. Procurement"/>
          </div>
        </div>
        <div class="fr">
          <div class="ilbl">Choose Icon</div>
          <div class="feature-icon-grid" id="feature-icon-grid"></div>
          <div class="feature-icon-help">These icons are hand-picked inline SVG icons in the same stroke style as the rest of Jiqsys.</div>
        </div>
        <div class="fr" style="margin-bottom:0">
          <div class="ilbl">Description</div>
          <textarea class="inf" id="feature-desc" rows="3" style="resize:none" placeholder="What this feature is for..."></textarea>
        </div>
      </div>
      <div class="mft">
        <button class="btn btn-s" onclick="closeOvl('feature-ovl')">Cancel</button>
        <button class="btn btn-p" onclick="saveFeature()">Create Feature</button>
      </div>
    </div>
  </div>`);
  document.getElementById('feature-ovl').addEventListener('click',e=>{if(e.target.id==='feature-ovl')closeOvl('feature-ovl');});
  renderFeatureIconPicker(DEFAULT_FEATURE_ICON_KEY);
}
function ensureFeatureUi(){
  mountFeatureSidebarShell();
  mountFeaturePagesShell();
  mountFeatureModalShell();
}
function getFeatureIconKey(row){
  return row?.icon_key||FEATURE_ICON_MAP[row?.module_key]||DEFAULT_FEATURE_ICON_KEY;
}
function getFeatureIcon(row){
  return FEATURE_ICON_SET[getFeatureIconKey(row)]||DEFAULT_FEATURE_ICON;
}
function buildFeatureIconButtonOptions(fk,selectedKey){
  return FEATURE_ICON_CHOICES.map(icon=>`<button class="feature-icon-btn${icon.key===selectedKey?' active':''}" type="button" onclick="selectFeaturePageIcon('${fk}','${icon.key}')" title="${escHtml(icon.label)}" aria-label="${escHtml(icon.label)}">
    <svg viewBox="0 0 24 24">${FEATURE_ICON_SET[icon.key]}</svg>
  </button>`).join('');
}
function renderFeatureIconPicker(selectedKey=DEFAULT_FEATURE_ICON_KEY){
  const grid=document.getElementById('feature-icon-grid');
  if(!grid)return;
  grid.innerHTML=FEATURE_ICON_CHOICES.map(icon=>`<button class="feature-icon-btn${icon.key===selectedKey?' active':''}" type="button" onclick="setFeatureIconSelection('${icon.key}')" title="${escHtml(icon.label)}" aria-label="${escHtml(icon.label)}">
    <svg viewBox="0 0 24 24">${FEATURE_ICON_SET[icon.key]}</svg>
  </button>`).join('');
  const input=document.getElementById('feature-icon');
  if(input)input.value=selectedKey;
  const preview=document.getElementById('feature-icon-preview');
  if(preview)preview.innerHTML=`<svg viewBox="0 0 24 24">${FEATURE_ICON_SET[selectedKey]||DEFAULT_FEATURE_ICON}</svg>`;
}
function setFeatureIconSelection(iconKey){
  renderFeatureIconPicker(iconKey);
}
function renderFeaturePageIconControls(fk){
  const row=getFeatureRowByKey(fk);
  if(!row)return;
  const trigger=document.getElementById(`${fk}-icon-trigger`);
  if(trigger)trigger.innerHTML=`<svg viewBox="0 0 24 24">${getFeatureIcon(row)}</svg>`;
  const grid=document.getElementById(`${fk}-icon-grid`);
  if(grid)grid.innerHTML=buildFeatureIconButtonOptions(fk,getFeatureIconKey(row));
}
function closeFeaturePageIconPickers(){
  document.querySelectorAll('.feat-icon-picker.open').forEach(el=>el.classList.remove('open'));
}
function toggleFeaturePageIconPicker(fk,event){
  if(!requireWorkspacePermission('can_edit_features','Editing features'))return;
  event?.stopPropagation();
  const picker=document.getElementById(`${fk}-icon-picker`);
  if(!picker)return;
  const willOpen=!picker.classList.contains('open');
  closeFeaturePageIconPickers();
  if(!willOpen)return;
  renderFeaturePageIconControls(fk);
  picker.classList.add('open');
}
function selectFeaturePageIcon(fk,iconKey){
  if(!requireWorkspacePermission('can_edit_features','Editing features'))return;
  const row=getFeatureRowByKey(fk);
  if(!row)return;
  row.icon_key=iconKey;
  updateFeatureNavIcon(fk,row);
  renderFeaturePageIconControls(fk);
  syncFeatureBridge();
  queueModuleMetaSave(fk);
  closeFeaturePageIconPickers();
}
function buildFeaturePage(row){
  const fk=getFeatureKeyFromRow(row);
  ensureFeatureState(fk);
  return `<div class="page feature-page" id="page-${fk}"><div class="feat-page-shell">
    <div class="feat-top">
      <div class="feat-top-main">
        <div class="feat-meta-icon-wrap">
          <button class="feat-meta-icon-btn" id="${fk}-icon-trigger" type="button" onclick="toggleFeaturePageIconPicker('${fk}',event)" aria-label="Change feature icon" title="Change feature icon">
            <svg viewBox="0 0 24 24">${getFeatureIcon(row)}</svg>
          </button>
          <div class="feat-icon-picker" id="${fk}-icon-picker">
            <div class="feat-icon-picker-title">Choose Icon</div>
            <div class="feature-icon-grid feat-icon-picker-grid" id="${fk}-icon-grid">${buildFeatureIconButtonOptions(fk,getFeatureIconKey(row))}</div>
          </div>
        </div>
        <div class="feat-top-copy">
          <input class="feat-meta-title" value="${escHtml(row.name)}" placeholder="Feature title" oninput="updateFeatureMeta('${fk}','name',this.value)">
          <textarea class="feat-meta-desc" rows="1" maxlength="140" placeholder="Add a short description for this feature" oninput="updateFeatureMeta('${fk}','description',this.value);autosizeFeatureDescription(this)">${escHtml(row.description||'')}</textarea>
        </div>
      </div>
      <div id="${fk}-stat-cards" class="feat-top-stats"></div>
    </div>
    <div class="feat-page-body">
    <div class="feat-tabs">
      <button class="feat-tab active" onclick="switchFeatTab('${fk}','tickets',this)">Linked Tickets</button>
      <button class="feat-tab" onclick="switchFeatTab('${fk}','details',this)">Feature Details</button>
      <button class="feat-tab" onclick="switchFeatTab('${fk}','tests',this)">Checklist</button>
    </div>
    <div id="${fk}-tab-tickets" class="feat-tab-panel active"><div id="${fk}-ticket-list"></div></div>
    <div id="${fk}-tab-details" class="feat-tab-panel"><div class="feat-notes-wrap" id="${fk}-editor-wrap"></div></div>
    <div id="${fk}-tab-tests" class="feat-tab-panel">
      <div class="feat-panel-shell">
        <div id="${fk}-tests" class="feat-panel-scroll feat-panel-scroll-main"></div>
        <div class="feat-panel-foot"><button class="btn btn-s" onclick="addTestGroup('${fk}')">+ Add Test Group</button></div>
      </div>
    </div>
    </div>
  </div></div>`;
}
let featureDragKey=null;
async function reorderFeatures(fromKey,targetKey){
  if(!requireWorkspacePermission('can_edit_features','Reordering features'))return;
  if(!fromKey||!targetKey||fromKey===targetKey)return;
  const ordered=getFeatureRows();
  const from=ordered.findIndex(row=>getFeatureKeyFromRow(row)===fromKey);
  const to=ordered.findIndex(row=>getFeatureKeyFromRow(row)===targetKey);
  if(from<0||to<0)return;
  const moved=ordered.splice(from,1)[0];
  ordered.splice(to,0,moved);
  moduleRows=ordered.map((row,index)=>({...row,sort_order:index+1}));
  renderFeatureUi();
  try{
    for(const row of moduleRows){
      const {error}=await supabaseClient.from('modules').update({sort_order:row.sort_order}).eq('id',row.id);
      if(error)throw error;
    }
  }catch(error){
    showDbError('Reordering features',error);
  }
}
function attachFeatureDnD(){
  document.querySelectorAll('#feature-nav .ni-feat').forEach(item=>{
    const grip=item.querySelector('.ni-feat-grip');
    if(grip){
      grip.addEventListener('dragstart',()=>{
        featureDragKey=item.dataset.featureKey;
        item.style.opacity='.45';
      });
      grip.addEventListener('dragend',()=>{
        featureDragKey=null;
        item.style.opacity='';
        document.querySelectorAll('#feature-nav .ni-feat').forEach(el=>el.classList.remove('drag-over'));
      });
    }
    item.addEventListener('dragover',e=>{
      e.preventDefault();
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave',()=>item.classList.remove('drag-over'));
    item.addEventListener('drop',async e=>{
      e.preventDefault();
      item.classList.remove('drag-over');
      const targetKey=item.dataset.featureKey;
      if(!featureDragKey||featureDragKey===targetKey)return;
      await reorderFeatures(featureDragKey,targetKey);
    });
  });
}
function renderFeatureSidebar(){
  const nav=document.getElementById('feature-nav');
  if(!nav)return;
  syncFeatureBridge();
  if(nav.dataset.reactManaged==='true')return;
  nav.innerHTML=getFeatureRows().map(row=>{
    const pageId=getFeatureKeyFromRow(row);
    return `<div class="ni ni-feat" data-page="${pageId}" data-feature-key="${pageId}" title="${escHtml(row.name)}" aria-label="${escHtml(row.name)}" onclick="nav('${pageId}')">
      <svg viewBox="0 0 24 24">${getFeatureIcon(row)}</svg>
      <span>${escHtml(row.name)}</span>
      <div class="ni-feat-actions">
        <button class="ni-feat-grip" type="button" draggable="true" onclick="event.stopPropagation()" aria-label="Reorder feature" title="Drag to reorder">
          <svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="9" y1="12" x2="9.01" y2="12"/><line x1="9" y1="18" x2="9.01" y2="18"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="15" y1="18" x2="15.01" y2="18"/></svg>
        </button>
        <button class="ni-feat-more" type="button" onclick="event.stopPropagation();toggleFeatureMenu('${pageId}',event)" aria-label="Feature actions">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
        </button>
        <div class="feat-menu">
          <button class="feat-menu-btn" type="button" onclick="event.stopPropagation();softDeleteFeature('${pageId}')">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            Delete Feature
          </button>
        </div>
      </div>
    </div>`;
  }).join('')||`<div style="padding:8px 10px;font-size:12px;color:var(--tm)">No features yet.</div>`;
  attachFeatureDnD();
}
function renderFeaturePages(){
  const container=mountFeaturePagesShell();
  if(!container)return;
  if(container.dataset.reactManaged==='true')return;
  container.innerHTML=getFeatureRows().map(buildFeaturePage).join('');
  container.querySelectorAll('.feat-meta-desc').forEach(autosizeFeatureDescription);
}
function renderFeatureUi(){
  const activePage=document.querySelector('.page.active')?.id.replace(/^page-/,'');
  const sidebarScrollTop=getSidebarScrollTop();
  syncFeatureBridge();
  renderFeatureSidebar();
  renderFeaturePages();
  applySidebarState();
  restoreSidebarScroll(sidebarScrollTop);
  if(activePage&&document.getElementById(`page-${activePage}`))nav(activePage);
}
function closeFeatureMenus(){
  document.querySelectorAll('#feature-nav .ni-feat.menu-open').forEach(item=>item.classList.remove('menu-open'));
}
function toggleFeatureMenu(fk,event){
  const item=event.currentTarget.closest('.ni-feat');
  if(!item)return;
  const alreadyOpen=item.classList.contains('menu-open');
  closeFeatureMenus();
  if(!alreadyOpen)item.classList.add('menu-open');
}
async function softDeleteFeature(fk){
  if(!requireWorkspacePermission('can_delete_features','Deleting features'))return;
  const row=getFeatureRowByKey(fk);
  if(!row)return;
  if(!confirm(`Move "${row.name}" to trash?`))return;
  closeFeatureMenus();
  try{
    const {error}=await supabaseClient.from('modules').update({is_active:false}).eq('id',row.id);
    if(error)throw error;
    moduleRows=moduleRows.filter(entry=>entry.id!==row.id);
    deletedModuleRows.unshift({...row});
    syncTrashBridge();
    renderFeatureUi();
    renderTrashPage();
    if(document.querySelector(`.page.active#page-${fk}`))nav('home');
    toast(`"${row.name}" moved to Trash`,{icon:'trash'});
  }catch(error){
    showDbError('Deleting feature',error);
  }
}
async function restoreFeature(fk){
  const row=deletedModuleRows.find(entry=>getFeatureKeyFromRow(entry)===fk);
  if(!row)return;
  try{
    const nextOrder=getFeatureRows().length+1;
    const {error}=await supabaseClient.from('modules').update({is_active:true,sort_order:nextOrder}).eq('id',row.id);
    if(error)throw error;
    deletedModuleRows=deletedModuleRows.filter(entry=>entry.id!==row.id);
    moduleRows.push({...row,sort_order:nextOrder});
    syncTrashBridge();
    renderFeatureUi();
    renderTrashPage();
    renderActive();
    toast(`"${row.name}" restored`,{icon:'restore'});
  }catch(error){
    showDbError('Restoring feature',error);
  }
}
function openFeatureModal(){
  if(!requireWorkspacePermission('can_create_features','Creating features'))return;
  document.getElementById('feature-title').value='';
  document.getElementById('feature-desc').value='';
  renderFeatureIconPicker(DEFAULT_FEATURE_ICON_KEY);
  openOvl('feature-ovl');
  setTimeout(()=>document.getElementById('feature-title')?.focus(),80);
}
function uniqueField(base,selector){
  const values=new Set(moduleRows.map(row=>row[selector]));
  if(!values.has(base))return base;
  let i=2;
  while(values.has(`${base}-${i}`))i++;
  return `${base}-${i}`;
}
async function saveFeature(){
  if(!requireWorkspacePermission('can_create_features','Creating features'))return;
  const name=document.getElementById('feature-title').value.trim();
  const description=document.getElementById('feature-desc').value.trim();
  const iconKey=document.getElementById('feature-icon')?.value||DEFAULT_FEATURE_ICON_KEY;
  if(!name){
    document.getElementById('feature-title').focus();
    return;
  }
  const pageSlug=uniqueField(slugify(name),'page_slug');
  const moduleKey=uniqueField(name,'module_key');
  try{
    const {data,error}=await supabaseClient
      .from('modules')
      .insert({
        module_key:moduleKey,
        name,
        page_slug:pageSlug,
        icon_key:iconKey,
        description:description||null,
        sort_order:getFeatureRows().length+1,
        is_active:true
      })
      .select('id, module_key, name, page_slug, icon_key, description, sort_order')
      .single();
    if(error)throw error;
    moduleRows.push(data);
    ensureFeatureState(getFeatureKeyFromRow(data));
    closeOvl('feature-ovl');
    renderFeatureUi();
    nav(getFeatureKeyFromRow(data));
  }catch(error){
    showDbError('Creating feature',error);
  }
}
async function loadTeam(){
  const {data,error}=await supabaseClient
    .from('team_members')
    .select('id, full_name, role_title, email')
    .eq('is_active',true)
    .order('full_name');
  if(error)throw error;
  team=(data||[]).map(row=>({
    id:row.id,
    name:row.full_name,
    role:row.role_title||'',
    email:row.email||''
  }));
  syncTeamBridge();
}
async function loadTickets(){
  const [{data:ticketRows,error:ticketsError},{data:linkRows,error:linksError},{data:refRows,error:refsError},{data:activityRows,error:activityError}]=await Promise.all([
    supabaseClient.from('tickets').select('id, ticket_no, title, description, status_id, priority, assignee_id, start_date, due_date, deleted_at').order('created_at',{ascending:false}),
    supabaseClient.from('ticket_modules').select('ticket_id, module_id'),
    supabaseClient.from('ticket_references').select('ticket_id, ref_value').order('created_at'),
    supabaseClient.from('ticket_activity').select('ticket_id, message, created_at').order('created_at',{ascending:false}),
  ]);
  if(ticketsError)throw ticketsError;
  if(linksError)throw linksError;
  if(refsError)throw refsError;
  if(activityError)throw activityError;
  const moduleKeyById=Object.fromEntries(moduleRows.map(row=>[row.id,row.module_key]));
  const modulesByTicket={};
  (linkRows||[]).forEach(row=>{
    const moduleKey=moduleKeyById[row.module_id];
    if(!moduleKey)return;
    if(!modulesByTicket[row.ticket_id])modulesByTicket[row.ticket_id]=[];
    modulesByTicket[row.ticket_id].push(moduleKey);
  });
  const refsByTicket={};
  (refRows||[]).forEach(row=>{
    if(!refsByTicket[row.ticket_id])refsByTicket[row.ticket_id]=[];
    refsByTicket[row.ticket_id].push(row.ref_value);
  });
  const activitiesByTicket={};
  (activityRows||[]).forEach(row=>{
    if(!activitiesByTicket[row.ticket_id])activitiesByTicket[row.ticket_id]=[];
    activitiesByTicket[row.ticket_id].push({
      user:'System',
      av:'SY',
      text:row.message,
      time:formatDeletedAt(row.created_at)
    });
  });
  tickets=[];
  trash=[];
  (ticketRows||[]).forEach(row=>{
    const ticket=normalizeTicket({
      rowId:row.id,
      id:row.ticket_no,
      title:row.title,
      desc:row.description||'',
      statusId:row.status_id,
      priority:row.priority,
      assigneeId:row.assignee_id||'',
      assignee:'',
      start:row.start_date||'',
      due:row.due_date||'',
      deletedAtRaw:row.deleted_at||null,
      deletedAt:'',
      modules:modulesByTicket[row.id]||[],
      frefs:refsByTicket[row.id]||[],
      activity:activitiesByTicket[row.id]||[],
      testProgress:{},
    });
    if(ticket.deletedAtRaw)trash.push(ticket);
    else tickets.push(ticket);
  });
  syncFeatureBridge();
}
async function loadFeatureTests(){
  const [{data:groupRows,error:groupsError},{data:caseRows,error:casesError}]=await Promise.all([
    supabaseClient.from('test_groups').select('id, module_id, name, sort_order').order('sort_order'),
    supabaseClient.from('test_cases').select('id, test_group_id, label, sort_order').order('sort_order'),
  ]);
  if(groupsError)throw groupsError;
  if(casesError)throw casesError;
  getFeatureRows().forEach(row=>{ensureFeatureState(getFeatureKeyFromRow(row)).testGroups=[];});
  const casesByGroup={};
  (caseRows||[]).forEach(row=>{
    if(!casesByGroup[row.test_group_id])casesByGroup[row.test_group_id]=[];
    casesByGroup[row.test_group_id].push({id:row.id,label:row.label});
  });
  (groupRows||[]).forEach(row=>{
    const moduleRow=moduleRows.find(m=>m.id===row.module_id);
    const fk=moduleRow?getFeatureKeyFromRow(moduleRow):null;
    if(!fk)return;
    ensureFeatureState(fk).testGroups.push({
      id:row.id,
      name:row.name,
      open:true,
      items:casesByGroup[row.id]||[],
    });
  });
  syncFeatureBridge();
}
async function loadFeatureNotes(){
  const {data,error}=await supabaseClient
    .from('module_notes')
    .select('module_id, notes_html');
  if(error)throw error;
  getFeatureRows().forEach(row=>{
    const state=ensureFeatureState(getFeatureKeyFromRow(row));
    state.canvases=[createFeatureCanvas()];
    state.activeCanvasId=state.canvases[0].id;
  });
  (data||[]).forEach(row=>{
    const moduleRow=moduleRows.find(m=>m.id===row.module_id);
    const fk=moduleRow?getFeatureKeyFromRow(moduleRow):null;
    if(!fk)return;
    const state=ensureFeatureState(fk);
    const parsed=parseFeatureNotesPayload(row.notes_html||'');
    state.canvases=parsed.canvases;
    state.activeCanvasId=parsed.activeCanvasId;
    state.sidebarCollapsed=parsed.sidebarCollapsed;
    ensureFeatureState(fk);
  });
  syncFeatureBridge();
}
function queueFeatureNoteSave(fk,delay=400){
  clearTimeout(pendingFeatureNoteSaves.get(fk));
  const timeout=setTimeout(async()=>{
    try{
      const moduleRow=getModuleRowByFeatKey(fk);
      if(!moduleRow)return;
      const {error}=await supabaseClient
        .from('module_notes')
        .upsert({
          module_id:moduleRow.id,
          notes_html:serializeFeatureNotesPayload(fk)
        },{onConflict:'module_id'});
      if(error)throw error;
    }catch(error){
      showDbError('Saving feature details',error);
    }finally{
      pendingFeatureNoteSaves.delete(fk);
    }
  },delay);
  pendingFeatureNoteSaves.set(fk,timeout);
}
function queueTestGroupSave(fk,gid,delay=250){
  clearTimeout(pendingTestGroupSaves.get(gid));
  const timeout=setTimeout(async()=>{
    try{
      const group=getTestGroupById(fk,gid);
      if(!group)return;
      const order=ensureFeatureState(fk).testGroups.findIndex(x=>x.id===gid);
      const {error}=await supabaseClient
        .from('test_groups')
        .update({name:group.name,sort_order:order>-1?order:0})
        .eq('id',gid);
      if(error)throw error;
    }catch(error){
      showDbError('Saving test group',error);
    }finally{
      pendingTestGroupSaves.delete(gid);
    }
  },delay);
  pendingTestGroupSaves.set(gid,timeout);
}
function queueTestCaseSave(fk,gid,iid,delay=250){
  clearTimeout(pendingTestCaseSaves.get(iid));
  const timeout=setTimeout(async()=>{
    try{
      const group=getTestGroupById(fk,gid);
      const item=group?.items.find(x=>x.id===iid);
      if(!group||!item)return;
      const order=group.items.findIndex(x=>x.id===iid);
      const {error}=await supabaseClient
        .from('test_cases')
        .update({label:item.label,sort_order:order>-1?order:0})
        .eq('id',iid);
      if(error)throw error;
    }catch(error){
      showDbError('Saving test case',error);
    }finally{
      pendingTestCaseSaves.delete(iid);
    }
  },delay);
  pendingTestCaseSaves.set(iid,timeout);
}
async function hydrateApp(){
  try{
    ensureFeatureUi();
    await loadStatuses();
    await loadModules();
    renderFeatureUi();
    await loadTeam();
    await loadTickets();
    await loadFeatureNotes();
    await loadFeatureTests();
    await loadHomeQuickNote();
    refreshAssigneeDropdowns();
    populateNtStatus();
    populateFltStatus();
    renderTeamPage();
    renderTrashPage();
    renderActive();
    appReady=true;
  }catch(error){
    showDbError('Loading Supabase data',error);
    homeQuickNote=getDefaultHomeQuickNote();
    refreshAssigneeDropdowns();
    populateNtStatus();
    populateFltStatus();
    renderTeamPage();
    renderTrashPage();
    renderActive();
  }
}

async function initApp(){
  loadSidebarState();
  initSidebarScrollSync();
  try{
    await loadWorkspaceAppearance();
  }catch(error){
    showDbError('Loading workspace appearance',error);
    workspaceAppearance=getDefaultWorkspaceAppearance();
    applyWorkspaceTheme(workspaceAppearance.theme);
  }
  try{
    await loadWorkspaceSecurity();
  }catch(error){
    showDbError('Loading workspace security',error);
    workspaceSecurity=getDefaultWorkspaceSecurity();
  }
  refreshSettingsAppearanceUi();
  refreshSettingsSecurityUi();
  initWorkspaceAccess();
  await hydrateApp();
}

// ── Tab switcher ──
function switchFeatTab(fk,tab,btn){
  const pg=btn.closest('[id^="page-"]');
  pg.querySelectorAll('.feat-tab').forEach(t=>t.classList.toggle('active',t===btn));
  pg.querySelectorAll('.feat-tab-panel').forEach(p=>p.classList.toggle('active',p.id===`${fk}-tab-${tab}`));
  if(tab==='details') rteMountEditor(fk);
  if(tab==='tests') renderTestGroups(fk);
}

// ── Notes ──
function saveFeatNotes(fk,val){
  const canvas=getActiveFeatureCanvas(fk);
  if(canvas)canvas.content=val;
  queueFeatureNoteSave(fk);
}

// ════════════════════════════════════════════
// RICH TEXT EDITOR
// ════════════════════════════════════════════
const RTE_TOOLBAR=[
  {type:'heading',tag:'h1',label:'H1',title:'Heading 1'},
  {type:'heading',tag:'h2',label:'H2',title:'Heading 2'},
  {type:'heading',tag:'h3',label:'H3',title:'Heading 3'},
  {type:'sep'},
  {type:'cmd',cmd:'bold',      icon:'<b>B</b>',         title:'Bold'},
  {type:'cmd',cmd:'italic',    icon:'<i>I</i>',          title:'Italic'},
  {type:'cmd',cmd:'underline', icon:'<u style="text-decoration:underline">U</u>', title:'Underline'},
  {type:'sep'},
  {type:'action', action:'image', icon:'<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="14" height="12" rx="2"/><circle cx="6.5" cy="7" r="1.2"/><path d="M16 12l-3.5-3.5L5 15"/></svg>', title:'Add Image'},
  {type:'sep'},
  {type:'cmd',cmd:'insertUnorderedList', icon:'<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="6" y1="5" x2="16" y2="5"/><line x1="6" y1="9" x2="16" y2="9"/><line x1="6" y1="13" x2="16" y2="13"/><circle cx="2.5" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="2.5" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="2.5" cy="13" r="1" fill="currentColor" stroke="none"/></svg>', title:'Bullet List'},
  {type:'cmd',cmd:'insertOrderedList',   icon:'<svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="6" y1="5" x2="16" y2="5"/><line x1="6" y1="9" x2="16" y2="9"/><line x1="6" y1="13" x2="16" y2="13"/><text x="1" y="6" font-size="5" font-family="DM Sans" fill="currentColor" stroke="none" font-weight="700">1</text><text x="1" y="10" font-size="5" font-family="DM Sans" fill="currentColor" stroke="none" font-weight="700">2</text><text x="1" y="14" font-size="5" font-family="DM Sans" fill="currentColor" stroke="none" font-weight="700">3</text></svg>', title:'Numbered List'},
  {type:'sep'},
  {type:'table', rows:2, cols:2, label:'2x2', title:'Insert 2x2 Table'},
  {type:'table', rows:1, cols:2, label:'1x2', title:'Insert 1x2 Table'},
];
const RTE_SLASH_COMMANDS=[
  {id:'h1',label:'Heading 1',hint:'/h1',keywords:['h1','heading 1','heading one'],type:'heading',tag:'h1'},
  {id:'h2',label:'Heading 2',hint:'/h2',keywords:['h2','heading 2','heading two'],type:'heading',tag:'h2'},
  {id:'h3',label:'Heading 3',hint:'/h3',keywords:['h3','heading 3','heading three'],type:'heading',tag:'h3'},
  {id:'bullet',label:'Bullet List',hint:'/bullet',keywords:['bullet','bullets','bullet point','list'],type:'list',tag:'ul'},
  {id:'number',label:'Numbered List',hint:'/number',keywords:['number','numbering','ordered list'],type:'list',tag:'ol'},
  {id:'table',label:'Table',hint:'/table',keywords:['table','grid'],type:'table'}
];
const rteSlashState=new Map();

function rteToolbarHTML(fk){
  const state=ensureFeatureState(fk);
  const toggleTitle=state.sidebarCollapsed?'Show canvas sidebar':'Hide canvas sidebar';
  const toggleIcon=state.sidebarCollapsed
    ? '<polyline points="9 18 15 12 9 6"/><line x1="4" y1="5" x2="4" y2="19"/>'
    : '<polyline points="15 18 9 12 15 6"/><line x1="20" y1="5" x2="20" y2="19"/>';
  return `<div class="rte-toolbar" id="rte-tb-${fk}">
    <button class="rte-sidebar-btn" title="${toggleTitle}" onmousedown="event.preventDefault();toggleFeatureCanvasSidebar('${fk}')">
      <svg viewBox="0 0 24 24">${toggleIcon}</svg>
    </button>
    <div class="rte-sep"></div>
    ${RTE_TOOLBAR.map(t=>{
      if(t.type==='sep') return `<div class="rte-sep"></div>`;
      if(t.type==='heading') return `<button class="rte-btn wide" title="${t.title}" onmousedown="event.preventDefault();rteHeading('${fk}','${t.tag}')">${t.label}</button>`;
      if(t.type==='cmd') return `<button class="rte-btn" title="${t.title}" id="rteb-${fk}-${t.cmd}" onmousedown="event.preventDefault();rteCmd('${fk}','${t.cmd}')">${t.icon}</button>`;
      if(t.type==='action') return `<button class="rte-btn" title="${t.title}" onmousedown="event.preventDefault();rteAction('${fk}','${t.action}')">${t.icon}</button>`;
      if(t.type==='table') return `<button class="rte-btn wide" title="${t.title}" onmousedown="event.preventDefault();rteInsertTable('${fk}',${t.rows},${t.cols})">⊞ ${t.label}</button>`;
    }).join('')}
  </div>`;
}

function featureCanvasPreview(canvas){
  const plain=String(canvas.content||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  return plain||'Blank canvas';
}
function featureCanvasTitleForIndex(state,index){
  const base=`Canvas ${index}`;
  const titles=new Set(state.canvases.map(canvas=>canvas.title));
  if(!titles.has(base))return base;
  let n=index+1;
  while(titles.has(`Canvas ${n}`))n++;
  return `Canvas ${n}`;
}
function focusCanvasTitleInput(fk,canvasId){
  const page=document.getElementById(`page-${fk}`);
  const input=page?.querySelector('.feat-canvas-item.active .feat-canvas-name');
  if(input){
    input.focus();
    input.select();
  }
}
function addFeatureCanvas(fk){
  if(!requireWorkspacePermission('can_edit_features','Editing feature details'))return;
  const state=ensureFeatureState(fk);
  const canvas=createFeatureCanvas(featureCanvasTitleForIndex(state,state.canvases.length+1),'');
  state.canvases.push(canvas);
  state.activeCanvasId=canvas.id;
  syncFeatureBridge();
  queueFeatureNoteSave(fk);
  setTimeout(()=>focusCanvasTitleInput(fk,canvas.id),40);
}
function selectFeatureCanvas(fk,canvasId){
  const state=ensureFeatureState(fk);
  if(state.activeCanvasId===canvasId)return;
  state.activeCanvasId=canvasId;
  syncFeatureBridge();
  queueFeatureNoteSave(fk);
}
function renameFeatureCanvas(fk,canvasId,val){
  if(!requireWorkspacePermission('can_edit_features','Editing feature details'))return;
  const state=ensureFeatureState(fk);
  const canvas=state.canvases.find(entry=>entry.id===canvasId);
  if(!canvas)return;
  canvas.title=String(val||'').trimStart()||'Untitled Canvas';
  syncFeatureBridge();
  queueFeatureNoteSave(fk);
}
function deleteFeatureCanvas(fk,canvasId){
  if(!requireWorkspacePermission('can_edit_features','Editing feature details'))return;
  const state=ensureFeatureState(fk);
  if(state.canvases.length<=1)return;
  const idx=state.canvases.findIndex(entry=>entry.id===canvasId);
  if(idx<0)return;
  state.canvases.splice(idx,1);
  if(state.activeCanvasId===canvasId){
    state.activeCanvasId=(state.canvases[idx]||state.canvases[idx-1]||state.canvases[0]).id;
  }
  syncFeatureBridge();
  queueFeatureNoteSave(fk);
}
function toggleFeatureCanvasSidebar(fk){
  const state=ensureFeatureState(fk);
  state.sidebarCollapsed=!state.sidebarCollapsed;
  syncFeatureBridge();
  queueFeatureNoteSave(fk);
}

function renderFeatureDetailShell(fk){
  const state=ensureFeatureState(fk);
  const activeCanvas=getActiveFeatureCanvas(fk);
  return `<div class="feat-detail-shell">
    ${state.sidebarCollapsed?'':`<aside class="feat-detail-side">
      <div class="feat-detail-head">
        <div class="feat-detail-copy">
          <div class="feat-detail-eyebrow">Canvas Stack</div>
          <div class="feat-detail-title">${escHtml(activeCanvas?.title||'Canvas 1')}</div>
        </div>
      </div>
      <div class="feat-detail-top">
        <button class="feat-canvas-add" type="button" onclick="addFeatureCanvas('${fk}')">
          <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>New Canvas</span>
        </button>
      </div>
      <div class="feat-canvas-list">
        ${state.canvases.map((canvas,index)=>`<div class="feat-canvas-item${canvas.id===state.activeCanvasId?' active':''}" onclick="selectFeatureCanvas('${fk}','${canvas.id}')">
          <div class="feat-canvas-top">
            <div class="feat-canvas-dot">
              <svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><polyline points="14 3 14 8 19 8"/></svg>
            </div>
            <input class="feat-canvas-name" value="${escHtml(canvas.title)}" placeholder="Canvas title" onclick="event.stopPropagation()" oninput="renameFeatureCanvas('${fk}','${canvas.id}',this.value)" />
            <button class="feat-canvas-del" type="button" onclick="event.stopPropagation();deleteFeatureCanvas('${fk}','${canvas.id}')" ${state.canvases.length===1?'disabled':''} aria-label="Delete canvas">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
          <div class="feat-canvas-meta">Canvas ${index+1} · ${escHtml(featureCanvasPreview(canvas).slice(0,52))}${featureCanvasPreview(canvas).length>52?'...':''}</div>
        </div>`).join('')}
      </div>
    </aside>`}
    <div class="feat-detail-main">
      <div class="feat-notes-wrap" id="${fk}-rte-wrap">
        ${rteToolbarHTML(fk)}
        ${rteBodyHTML(fk)}
        <div class="rte-tbl-ctrl" id="rte-tblctrl-${fk}"></div>
        <div class="rte-slash-menu" id="rte-slash-${fk}"></div>
      </div>
    </div>
  </div>`;
}

function rteBodyHTML(fk){
  const content=getActiveFeatureCanvas(fk)?.content||'';
  return `<input type="file" id="rte-file-${fk}" accept="image/*" style="display:none" onchange="rtePickImage(event,'${fk}')">
  <div class="rte-body" id="rte-${fk}" contenteditable="true"
    data-placeholder="Describe this feature — goals, scope, requirements, edge cases, open questions…"
    oninput="rteInput('${fk}')"
    onkeydown="rteKey(event,'${fk}')"
    onmouseup="rteUpdateToolbar('${fk}')"
    onkeyup="rteUpdateToolbar('${fk}')"
  >${content}</div>`;
}

function rteMountEditor(fk){
  const wrap=document.getElementById(`${fk}-editor-wrap`);
  if(!wrap)return;
  if(wrap.dataset.reactManaged==='true'){
    rteHideSlashMenu(fk);
    rteHideTableCtrl(fk);
    rteCheckTable(fk);
    rteUpdateToolbar(fk);
    return;
  }
  wrap.innerHTML=renderFeatureDetailShell(fk);
  // show/hide table controls based on cursor position
  const body=document.getElementById(`rte-${fk}`);
  body.addEventListener('click',()=>{rteRememberSelection(fk);rteCheckTable(fk);rteUpdateSlashMenu(fk);});
  body.addEventListener('click',e=>{
    const link=e.target.closest('a[href]');
    if(link&&body.contains(link)){
      const selection=window.getSelection();
      if(selection&&selection.toString().trim())return;
      e.preventDefault();
      window.open(link.href,'_blank','noopener,noreferrer');
    }
  });
  body.addEventListener('keyup',()=>{rteRememberSelection(fk);rteCheckTable(fk);rteUpdateSlashMenu(fk);});
  body.addEventListener('mouseup',()=>{rteRememberSelection(fk);rteUpdateSlashMenu(fk);});
  body.addEventListener('paste',e=>rteHandlePaste(e,fk));
  body.addEventListener('mousemove',e=>{
    const cell=e.target.closest('td,th');
    if(cell&&body.contains(cell))rteCheckTable(fk,cell);
  });
  body.addEventListener('scroll',()=>{rteCheckTable(fk);rtePositionSlashMenu(fk);});
  body.addEventListener('dragover',e=>{
    if(![...e.dataTransfer?.files||[]].some(file=>file.type.startsWith('image/')))return;
    e.preventDefault();
    body.classList.add('drop-active');
  });
  body.addEventListener('dragleave',()=>body.classList.remove('drop-active'));
  body.addEventListener('drop',e=>{
    const files=[...e.dataTransfer?.files||[]].filter(file=>file.type.startsWith('image/'));
    body.classList.remove('drop-active');
    if(!files.length)return;
    e.preventDefault();
    const range=rteRangeFromPoint(e.clientX,e.clientY,body);
    files.forEach((file,index)=>rteInsertImageFile(fk,file,index===0?range:null));
  });
  wrap.addEventListener('mouseleave',()=>rteHideTableCtrl(fk));
  if(!rteResizeHandlers.has(fk)){
    const handler=()=>{rteCheckTable(fk);rtePositionSlashMenu(fk);};
    window.addEventListener('resize',handler);
    rteResizeHandlers.set(fk,handler);
  }
  rteHideSlashMenu(fk);
}

function rteInput(fk){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return;
  rteNormalizeContent(body);
  saveFeatNotes(fk,body.innerHTML);
  rteUpdateSlashMenu(fk);
}

function rteNormalizeUrl(url){
  const raw=String(url||'').trim();
  if(!raw)return '';
  if(/^(https?:|mailto:|tel:|data:)/i.test(raw))return raw;
  return `https://${raw}`;
}

function rteNormalizeContent(body){
  body.querySelectorAll('a[href]').forEach(link=>{
    const href=rteNormalizeUrl(link.getAttribute('href'));
    if(href)link.setAttribute('href',href);
    link.setAttribute('target','_blank');
    link.setAttribute('rel','noopener noreferrer');
  });
  body.querySelectorAll('img[src]').forEach(img=>{
    const src=rteNormalizeUrl(img.getAttribute('src'));
    if(src)img.setAttribute('src',src);
    if(!img.getAttribute('alt'))img.setAttribute('alt','Feature image');
  });
}

function rteInsertHtmlAtCursor(html){
  const sel=window.getSelection();
  if(!sel.rangeCount)return false;
  const range=sel.getRangeAt(0);
  range.deleteContents();
  const fragment=range.createContextualFragment(html);
  const lastNode=fragment.lastChild;
  range.insertNode(fragment);
  if(lastNode){
    range.setStartAfter(lastNode);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  return true;
}
function rteRememberSelection(fk){
  const sel=window.getSelection();
  if(!sel.rangeCount)return;
  rteSelectionRanges.set(fk,sel.getRangeAt(0).cloneRange());
}
function rteRestoreSelection(fk,rangeOverride=null){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return false;
  body.focus();
  const range=rangeOverride||rteSelectionRanges.get(fk);
  if(!range)return false;
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range.cloneRange());
  return true;
}
function rteRangeFromPoint(x,y,container){
  if(document.caretRangeFromPoint){
    const range=document.caretRangeFromPoint(x,y);
    if(range&&container.contains(range.startContainer))return range;
  }
  if(document.caretPositionFromPoint){
    const pos=document.caretPositionFromPoint(x,y);
    if(pos&&container.contains(pos.offsetNode)){
      const range=document.createRange();
      range.setStart(pos.offsetNode,pos.offset);
      range.collapse(true);
      return range;
    }
  }
  return null;
}

function rteAction(fk,action){
  if(action==='image')return rteInsertImage(fk);
}
function rteHandlePaste(event,fk){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return;
  const text=event.clipboardData?.getData('text/plain')?.trim()||'';
  const sel=window.getSelection();
  const hasSelection=!!(sel&&sel.rangeCount&&!sel.getRangeAt(0).collapsed&&sel.toString().trim());
  if(hasSelection&&text&&/^(https?:\/\/|mailto:|tel:)/i.test(text)){
    event.preventDefault();
    body.focus();
    document.execCommand('createLink',false,rteNormalizeUrl(text));
    rteInput(fk);
    rteUpdateToolbar(fk);
  }
}

function rteInsertImage(fk){
  rteRememberSelection(fk);
  const input=document.getElementById(`rte-file-${fk}`);
  if(!input)return;
  input.value='';
  input.click();
}
function rtePickImage(event,fk){
  const files=[...event.target.files||[]].filter(file=>file.type.startsWith('image/'));
  files.forEach(file=>rteInsertImageFile(fk,file));
  event.target.value='';
}
function rteInsertImageFile(fk,file,rangeOverride=null){
  if(!file||!file.type.startsWith('image/'))return;
  const reader=new FileReader();
  reader.onload=()=>{
    const body=document.getElementById(`rte-${fk}`);
    if(!body)return;
    const alt=file.name.replace(/\.[^.]+$/,'')||'Feature image';
    rteRestoreSelection(fk,rangeOverride);
    if(!rteInsertHtmlAtCursor(`<p><img src="${escHtml(reader.result)}" alt="${escHtml(alt)}"></p>`)){
      body.insertAdjacentHTML('beforeend',`<p><img src="${escHtml(reader.result)}" alt="${escHtml(alt)}"></p>`);
    }
    rteInput(fk);
    rteUpdateToolbar(fk);
    rteRememberSelection(fk);
  };
  reader.readAsDataURL(file);
}

function rteCmd(fk,cmd){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return;
  body.focus();
  document.execCommand(cmd,false,null);
  rteInput(fk);
  rteUpdateToolbar(fk);
}

function rteHeading(fk,tag){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return;
  body.focus();
  // toggle: if already in this heading, convert to paragraph
  const sel=window.getSelection();
  if(sel.rangeCount){
    const node=sel.anchorNode;
    const block=node.nodeType===3?node.parentElement:node;
    const cur=block.closest('h1,h2,h3');
    if(cur&&cur.tagName.toLowerCase()===tag){
      document.execCommand('formatBlock',false,'p');
    } else {
      document.execCommand('formatBlock',false,tag);
    }
  } else {
    document.execCommand('formatBlock',false,tag);
  }
  rteInput(fk);
  rteUpdateToolbar(fk);
}

function rteUpdateToolbar(fk){
  ['bold','italic','underline','insertUnorderedList','insertOrderedList'].forEach(cmd=>{
    const btn=document.getElementById(`rteb-${fk}-${cmd}`);
    if(btn)btn.classList.toggle('active',document.queryCommandState(cmd));
  });
}

function rteGetSlashCommandById(id){
  return RTE_SLASH_COMMANDS.find(command=>command.id===id)||null;
}

function rteGetSlashMatches(query=''){
  const term=String(query||'').trim().toLowerCase();
  const scored=RTE_SLASH_COMMANDS.map(command=>{
    const haystacks=[command.hint.replace(/^\//,''),command.label,...command.keywords].map(v=>String(v).toLowerCase());
    if(!term)return {command,score:0};
    const exact=haystacks.find(v=>v===term);
    if(exact)return {command,score:0};
    const starts=haystacks.find(v=>v.startsWith(term));
    if(starts)return {command,score:1};
    const includes=haystacks.find(v=>v.includes(term));
    if(includes)return {command,score:2};
    return null;
  }).filter(Boolean);
  return scored.sort((a,b)=>a.score-b.score||a.command.label.localeCompare(b.command.label)).map(entry=>entry.command);
}

function rteGetSlashQuery(fk){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return null;
  const block=rteGetCurrentBlock(body);
  if(!block)return null;
  const text=String(block.textContent||'').replace(/\u200B/g,'').trim();
  if(!text.startsWith('/'))return null;
  return {body,block,text,query:text.slice(1).trim().toLowerCase()};
}

function rteHideSlashMenu(fk){
  const menu=document.getElementById(`rte-slash-${fk}`);
  if(menu){
    menu.classList.remove('open');
    menu.innerHTML='';
  }
  rteSlashState.delete(fk);
}

function rteGetCaretRect(){
  const sel=window.getSelection();
  if(!sel||!sel.rangeCount)return null;
  const range=sel.getRangeAt(0).cloneRange();
  range.collapse(false);
  const rects=[...range.getClientRects()].filter(rect=>rect.width||rect.height);
  if(rects.length)return rects[rects.length-1];

  const marker=document.createElement('span');
  marker.textContent='\u200b';
  marker.style.display='inline-block';
  marker.style.width='0';
  marker.style.overflow='hidden';
  range.insertNode(marker);
  const rect=marker.getBoundingClientRect();
  range.setStartAfter(marker);
  range.collapse(true);
  marker.remove();
  sel.removeAllRanges();
  sel.addRange(range);
  return rect.width||rect.height?rect:null;
}

function rtePositionSlashMenu(fk){
  const menu=document.getElementById(`rte-slash-${fk}`);
  const wrap=document.getElementById(`${fk}-rte-wrap`);
  const body=document.getElementById(`rte-${fk}`);
  if(!menu||!wrap||!body||!menu.classList.contains('open'))return;
  let rect=rteGetCaretRect();
  if(!rect||(!rect.width&&!rect.height)){
    const info=rteGetSlashQuery(fk);
    rect=info?.block?.getBoundingClientRect()||null;
  }
  if(!rect)return;
  const wrapRect=wrap.getBoundingClientRect();
  const bodyRect=body.getBoundingClientRect();
  const maxLeft=Math.max(12,wrapRect.width-menu.offsetWidth-12);
  const left=Math.min(Math.max(12,rect.left-wrapRect.left),maxLeft);
  const minTop=Math.max(12,bodyRect.top-wrapRect.top+8);
  const top=Math.max(minTop,rect.bottom-wrapRect.top+10);
  menu.style.left=`${left}px`;
  menu.style.top=`${top}px`;
}

function rteChooseSlashCommand(fk,id){
  const command=rteGetSlashCommandById(id);
  if(!command)return;
  rteHandleSlashCommand(fk,command);
}

function rteUpdateSlashMenu(fk){
  const menu=document.getElementById(`rte-slash-${fk}`);
  if(!menu)return;
  const info=rteGetSlashQuery(fk);
  if(!info){
    rteHideSlashMenu(fk);
    return;
  }
  const matches=rteGetSlashMatches(info.query);
  const nextState=rteSlashState.get(fk)||{index:0,query:''};
  const index=nextState.query===info.query?Math.min(nextState.index,Math.max(matches.length-1,0)):0;
  rteSlashState.set(fk,{index,query:info.query,matches:matches.map(match=>match.id)});
  if(!matches.length){
    menu.innerHTML=`<div class="rte-slash-empty">No matching command</div>`;
    menu.classList.add('open');
    rtePositionSlashMenu(fk);
    return;
  }
  menu.innerHTML=matches.map((command,matchIndex)=>`
    <button class="rte-slash-item${matchIndex===index?' active':''}" type="button" onmousedown="event.preventDefault()" onclick="rteChooseSlashCommand('${fk}','${command.id}')">
      <span class="rte-slash-copy">
        <span class="rte-slash-label">${escHtml(command.label)}</span>
        <span class="rte-slash-hint">${escHtml(command.hint)}</span>
      </span>
    </button>`).join('');
  menu.classList.add('open');
  rtePositionSlashMenu(fk);
}

function rteGetCurrentBlock(body){
  const sel=window.getSelection();
  if(!sel.rangeCount)return null;
  const node=sel.anchorNode;
  const el=node?.nodeType===3?node.parentElement:node;
  if(!el)return null;
  const block=el.closest('p,div,h1,h2,h3,li');
  if(block&&body.contains(block))return block;
  return body;
}

function rteSetCaretInElement(el){
  if(!el)return;
  const target=el.matches('li')?el:el;
  const range=document.createRange();
  range.selectNodeContents(target);
  range.collapse(true);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function rteParseSlashCommand(text){
  const normalized=String(text||'').trim().replace(/\s+/g,' ').toLowerCase();
  const term=normalized.startsWith('/')?normalized.slice(1).trim():normalized;
  return rteGetSlashMatches(term).find(command=>command.hint.toLowerCase()===normalized||command.keywords.some(keyword=>keyword===term))||null;
}

function rteHandleSlashCommand(fk,commandOverride=null){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return false;
  const block=rteGetCurrentBlock(body);
  if(!block)return false;
  const command=commandOverride||rteParseSlashCommand(block.textContent);
  if(!command)return false;

  let activeBlock=block;
  if(activeBlock===body){
    body.innerHTML='';
    activeBlock=document.createElement('p');
    activeBlock.innerHTML='<br>';
    body.appendChild(activeBlock);
  }

  if(command.type==='heading'){
    const next=document.createElement(command.tag);
    next.innerHTML='<br>';
    activeBlock.replaceWith(next);
    rteSetCaretInElement(next);
  }else if(command.type==='list'){
    const list=document.createElement(command.tag);
    const item=document.createElement('li');
    item.innerHTML='<br>';
    list.appendChild(item);
    activeBlock.replaceWith(list);
    rteSetCaretInElement(item);
  }else if(command.type==='table'){
    const table=rteBuildTable();
    const after=document.createElement('p');
    after.innerHTML='<br>';
    activeBlock.replaceWith(table,after);
    rteSetCaretInElement(table.querySelector('th,td')||after);
    rteInput(fk);
    rteCheckTable(fk);
    rteRememberSelection(fk);
    rteHideSlashMenu(fk);
    return true;
  }

  rteRememberSelection(fk);
  rteInput(fk);
  rteUpdateToolbar(fk);
  rteHideSlashMenu(fk);
  return true;
}

function rteHandleLineShortcut(fk){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return false;
  const sel=window.getSelection();
  if(!sel||!sel.rangeCount)return false;
  const block=rteGetCurrentBlock(body);
  if(!block||block.closest('li,td,th'))return false;
  let text='';
  try{
    const lineRange=document.createRange();
    lineRange.selectNodeContents(block===body?body:block);
    lineRange.setEnd(sel.getRangeAt(0).endContainer,sel.getRangeAt(0).endOffset);
    text=String(lineRange.toString()||'').replace(/\u200B/g,'').split(/\r?\n/).pop().trim();
  }catch{
    text=String(block.textContent||'').replace(/\u200B/g,'').trim();
  }
  let tag='';
  if(text==='-')tag='ul';
  else if(text==='1'||text==='1.')tag='ol';
  if(!tag)return false;

  const list=document.createElement(tag);
  const item=document.createElement('li');
  item.innerHTML='<br>';
  list.appendChild(item);

  if(block===body){
    body.innerHTML='';
    body.appendChild(list);
  }else{
    block.replaceWith(list);
  }

  rteSetCaretInElement(item);
  rteRememberSelection(fk);
  rteInput(fk);
  rteUpdateToolbar(fk);
  return true;
}

function rteKey(e,fk){
  const slashState=rteSlashState.get(fk);
  if(slashState&&slashState.matches?.length){
    if(e.key==='ArrowDown'){
      e.preventDefault();
      slashState.index=(slashState.index+1)%slashState.matches.length;
      rteSlashState.set(fk,slashState);
      rteUpdateSlashMenu(fk);
      return;
    }
    if(e.key==='ArrowUp'){
      e.preventDefault();
      slashState.index=(slashState.index-1+slashState.matches.length)%slashState.matches.length;
      rteSlashState.set(fk,slashState);
      rteUpdateSlashMenu(fk);
      return;
    }
    if((e.key==='Enter'||e.key==='Tab')&&slashState.matches[slashState.index]){
      e.preventDefault();
      rteChooseSlashCommand(fk,slashState.matches[slashState.index]);
      return;
    }
  }
  if(e.key==='Escape'&&slashState){
    e.preventDefault();
    rteHideSlashMenu(fk);
    return;
  }
  if((e.key===' '||e.key==='Spacebar')&&rteHandleLineShortcut(fk)){
    e.preventDefault();
    return;
  }
  if(e.key==='Enter'&&rteHandleSlashCommand(fk)){
    e.preventDefault();
    return;
  }
  if(e.key==='Tab'){
    const sel=window.getSelection();
    const node=sel.anchorNode&&(sel.anchorNode.nodeType===3?sel.anchorNode.parentElement:sel.anchorNode);
    const listItem=node?.closest('li');
    if(listItem){
      e.preventDefault();
      document.execCommand(e.shiftKey?'outdent':'indent',false,null);
      rteInput(fk);
      rteUpdateToolbar(fk);
      rteRememberSelection(fk);
      return;
    }
  }
  // Tab in table: move between cells
  if(e.key==='Tab'){
    const sel=window.getSelection();
    const cell=sel.anchorNode&&(sel.anchorNode.nodeType===3?sel.anchorNode.parentElement:sel.anchorNode).closest('td,th');
    if(cell){
      e.preventDefault();
      const cells=[...cell.closest('table').querySelectorAll('td,th')];
      const idx=cells.indexOf(cell);
      const next=e.shiftKey?cells[idx-1]:cells[idx+1];
      if(next){next.focus();const r=document.createRange();r.selectNodeContents(next);r.collapse(false);sel.removeAllRanges();sel.addRange(r);}
    }
  }
}

// ── Table helpers ──
function rteBuildTable(rows=2,cols=2){
  const tbl=document.createElement('table');
  const thead=tbl.createTHead();
  const hr=thead.insertRow();
  Array.from({length:cols},(_,i)=>`Column ${i+1}`).forEach(h=>{
    const th=document.createElement('th');
    th.contentEditable='true';
    th.textContent=h;
    hr.appendChild(th);
  });
  const tbody=tbl.createTBody();
  for(let r=0;r<rows;r++){
    const row=tbody.insertRow();
    for(let c=0;c<cols;c++){
      const td=row.insertCell();
      td.contentEditable='true';
      td.innerHTML='<br>';
    }
  }
  return tbl;
}

function rteInsertTable(fk,rows=2,cols=2){
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return;
  body.focus();
  const tbl=rteBuildTable(rows,cols);
  // insert at cursor or append
  const sel=window.getSelection();
  if(sel.rangeCount){
    const range=sel.getRangeAt(0);
    range.collapse(false);
    range.insertNode(tbl);
    // move cursor after table
    const after=document.createElement('p');after.innerHTML='<br>';
    tbl.parentNode.insertBefore(after,tbl.nextSibling);
    const r2=document.createRange();r2.setStart(after,0);r2.collapse(true);sel.removeAllRanges();sel.addRange(r2);
  } else {
    body.appendChild(tbl);
  }
  rteInput(fk);
  rteCheckTable(fk);
}

function rteGetActiveTable(fk){
  const sel=window.getSelection();if(!sel.rangeCount)return null;
  const node=sel.anchorNode;
  const el=node.nodeType===3?node.parentElement:node;
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return null;
  const tbl=el.closest('table');
  return tbl&&body.contains(tbl)?tbl:null;
}
function rteGetActiveTableCell(fk){
  const sel=window.getSelection();if(!sel.rangeCount)return null;
  const node=sel.anchorNode;
  const el=node.nodeType===3?node.parentElement:node;
  const body=document.getElementById(`rte-${fk}`);
  if(!body)return null;
  const cell=el.closest('td,th');
  return cell&&body.contains(cell)?cell:null;
}
function rteHideTableCtrl(fk){
  const ctrl=document.getElementById(`rte-tblctrl-${fk}`);
  if(!ctrl)return;
  ctrl.classList.remove('show');
  ctrl.innerHTML='';
}

function rteCheckTable(fk,anchorCell=null){
  const ctrl=document.getElementById(`rte-tblctrl-${fk}`);
  const wrap=document.getElementById(`${fk}-editor-wrap`);
  const body=document.getElementById(`rte-${fk}`);
  const activeCell=anchorCell||rteGetActiveTableCell(fk);
  const tbl=activeCell?.closest('table')||rteGetActiveTable(fk);
  if(!ctrl||!wrap||!body)return;
  if(!tbl){
    rteHideTableCtrl(fk);
    return;
  }
  const wrapRect=wrap.getBoundingClientRect();
  const headerRow=tbl.rows[0];
  if(!headerRow){
    rteHideTableCtrl(fk);
    return;
  }
  const colSourceCell=activeCell&&tbl.contains(activeCell)?activeCell:headerRow.cells[0];
  if(!colSourceCell){
    rteHideTableCtrl(fk);
    return;
  }
  const colIdx=Math.max(0,[...colSourceCell.parentElement.cells].indexOf(colSourceCell));
  const headerCell=headerRow.cells[colIdx]||headerRow.cells[0];
  const tblRect=tbl.getBoundingClientRect();
  const colRect=headerCell.getBoundingClientRect();
  const colLeft=colRect.left-wrapRect.left+colRect.width/2;
  const colTop=colRect.top-wrapRect.top-18;
  const tableLeft=tblRect.left-wrapRect.left-18;
  const tableTop=tblRect.top-wrapRect.top-18;

  let rowButtons='';
  const tbody=tbl.tBodies[0];
  const rowSource=activeCell?.closest('tbody tr');
  if(tbody&&tbody.rows.length&&rowSource){
    const rowIdx=[...tbody.rows].indexOf(rowSource);
    if(rowIdx>-1){
      const rowRect=rowSource.getBoundingClientRect();
      const rowTop=rowRect.top-wrapRect.top+rowRect.height/2;
      const rowLeft=rowRect.left-wrapRect.left-18;
      rowButtons=`<div class="rte-tbl-line row" style="left:${rowLeft}px;top:${rowTop}px">
        <button class="rte-tbl-btn" title="Add row here" onmousedown="event.preventDefault();rteTblAddRowAt('${fk}',${rowIdx})">+</button>
        <button class="rte-tbl-btn" title="Remove this row" onmousedown="event.preventDefault();rteTblDelRowAt('${fk}',${rowIdx})">−</button>
      </div>`;
    }
  }
  ctrl.classList.add('show');
  ctrl.style.left='0px';
  ctrl.style.top='0px';
  ctrl.innerHTML=`<div class="rte-tbl-line table" style="left:${tableLeft}px;top:${tableTop}px">
      <button class="rte-tbl-btn" title="Delete table" onmousedown="event.preventDefault();rteTblDelete('${fk}')">×</button>
    </div>
    <div class="rte-tbl-line col" style="left:${colLeft}px;top:${colTop}px">
      <button class="rte-tbl-btn" title="Add column here" onmousedown="event.preventDefault();rteTblAddColAt('${fk}',${colIdx})">+</button>
      <button class="rte-tbl-btn" title="Remove this column" onmousedown="event.preventDefault();rteTblDelColAt('${fk}',${colIdx})">−</button>
    </div>${rowButtons}`;
}

function rteTblAddRow(fk){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  rteTblAddRowAt(fk,tbl.rows.length-1);
}
function rteTblAddRowAt(fk,idx){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  const cols=tbl.rows[0].cells.length;
  const body=tbl.querySelector('tbody')||tbl;
  const row=body.insertRow(Math.max(0,Math.min(idx+1,body.rows.length)));
  for(let c=0;c<cols;c++){const td=row.insertCell();td.contentEditable='true';td.innerHTML='<br>';}
  rteInput(fk);
  rteCheckTable(fk);
}

function rteTblDelRow(fk){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  const sel=window.getSelection();
  const node=sel.anchorNode;
  const el=node.nodeType===3?node.parentElement:node;
  const row=el.closest('tr');
  const body=tbl.querySelector('tbody')||tbl;
  const idx=row?[...body.rows].indexOf(row):-1;
  if(idx>=0)rteTblDelRowAt(fk,idx);
}
function rteTblDelRowAt(fk,idx){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  const body=tbl.querySelector('tbody')||tbl;
  if(body.rows.length<=1)return;
  if(body.rows[idx])body.deleteRow(idx);
  rteInput(fk);
  rteCheckTable(fk);
}

function rteTblAddCol(fk){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  rteTblAddColAt(fk,tbl.rows[0].cells.length-1);
}
function rteTblAddColAt(fk,idx){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  [...tbl.rows].forEach((row,i)=>{
    const insertAt=Math.max(0,Math.min(idx+1,row.cells.length));
    const cell=i===0?document.createElement('th'):row.insertCell(insertAt);
    cell.contentEditable='true';
    if(i===0){
      cell.textContent=`Column ${insertAt+1}`;
      if(insertAt>=row.cells.length)row.appendChild(cell);
      else row.insertBefore(cell,row.cells[insertAt]);
    } else {
      cell.innerHTML='<br>';
    }
  });
  rteTblRenumberHeaders(tbl);
  rteInput(fk);
  rteCheckTable(fk);
}

function rteTblDelCol(fk){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  const sel=window.getSelection();
  const node=sel.anchorNode;
  const el=node.nodeType===3?node.parentElement:node;
  const cell=el.closest('td,th');
  const idx=cell?[...cell.parentElement.cells].indexOf(cell):-1;
  if(idx>=0)rteTblDelColAt(fk,idx);
}
function rteTblDelColAt(fk,colIdx){
  const tbl=rteGetActiveTable(fk);if(!tbl)return;
  if(colIdx<0||tbl.rows[0].cells.length<=1)return;
  [...tbl.rows].forEach(row=>{if(row.cells[colIdx])row.deleteCell(colIdx);});
  rteTblRenumberHeaders(tbl);
  rteInput(fk);
  rteCheckTable(fk);
}
function rteTblDelete(fk){
  const tbl=rteGetActiveTable(fk);
  const body=document.getElementById(`rte-${fk}`);
  if(!tbl||!body)return;
  const after=document.createElement('p');
  after.innerHTML='<br>';
  tbl.replaceWith(after);
  rteHideTableCtrl(fk);
  rteSetCaretInElement(after);
  rteRememberSelection(fk);
  rteInput(fk);
  rteUpdateToolbar(fk);
}
function rteTblRenumberHeaders(tbl){
  [...tbl.rows[0].cells].forEach((cell,i)=>{
    if(!cell.textContent.trim()||/^Column \d+$/.test(cell.textContent.trim()))cell.textContent=`Column ${i+1}`;
  });
}

// ── Test Groups ──
async function addTestGroup(fk){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  const moduleRow=getModuleRowByFeatKey(fk);
  if(!moduleRow){
    showDbError('Adding test group',new Error(`Module mapping missing for ${fk}`));
    return;
  }
  try{
    const {data,error}=await supabaseClient
      .from('test_groups')
      .insert({
        module_id:moduleRow.id,
        name:'New Test Group',
        sort_order:ensureFeatureState(fk).testGroups.length
      })
      .select('id, name')
      .single();
    if(error)throw error;
    ensureFeatureState(fk).testGroups.push({id:data.id,name:data.name,open:true,items:[]});
    syncFeatureBridge();
    renderTestGroups(fk);
  }catch(error){
    showDbError('Adding test group',error);
  }
}
async function deleteTestGroup(fk,gid){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  try{
    const {error}=await supabaseClient.from('test_groups').delete().eq('id',gid);
    if(error)throw error;
    ensureFeatureState(fk).testGroups=ensureFeatureState(fk).testGroups.filter(g=>g.id!==gid);
    syncFeatureBridge();
    renderTestGroups(fk);
  }catch(error){
    showDbError('Deleting test group',error);
  }
}
async function duplicateTestGroup(fk,gid){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  const moduleRow=getModuleRowByFeatKey(fk);
  const sourceGroup=getTestGroupById(fk,gid);
  if(!moduleRow||!sourceGroup){
    showDbError('Duplicating checklist',new Error(`Checklist mapping missing for ${fk}/${gid}`));
    return;
  }
  const sourceItems=sourceGroup.items.map((item,index)=>({
    label:String(item.label||''),
    sort_order:index,
  }));
  let createdGroupId=null;
  try{
    const copyName=`Copy of ${String(sourceGroup.name||'Untitled checklist').trim()||'Untitled checklist'}`;
    const {data:groupData,error:groupError}=await supabaseClient
      .from('test_groups')
      .insert({
        module_id:moduleRow.id,
        name:copyName,
        sort_order:ensureFeatureState(fk).testGroups.length
      })
      .select('id, name')
      .single();
    if(groupError)throw groupError;
    createdGroupId=groupData.id;

    let clonedItems=[];
    if(sourceItems.length){
      const {data:itemData,error:itemError}=await supabaseClient
        .from('test_cases')
        .insert(sourceItems.map(item=>({
          test_group_id:createdGroupId,
          label:item.label,
          sort_order:item.sort_order
        })))
        .select('id, label, sort_order');
      if(itemError)throw itemError;
      clonedItems=(itemData||[])
        .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))
        .map(item=>({id:item.id,label:item.label||''}));
    }

    ensureFeatureState(fk).testGroups.push({
      id:createdGroupId,
      name:groupData.name,
      open:true,
      items:clonedItems
    });
    syncFeatureBridge();
    renderTestGroups(fk);
  }catch(error){
    if(createdGroupId){
      try{
        await supabaseClient.from('test_groups').delete().eq('id',createdGroupId);
      }catch{}
    }
    showDbError('Duplicating checklist',error);
  }
}
function toggleTestGroup(fk,gid){
  const g=ensureFeatureState(fk).testGroups.find(x=>x.id===gid);
  if(g)g.open=!g.open;
  syncFeatureBridge();
  renderTestGroups(fk);
}
function renameTestGroup(fk,gid,val){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  const g=ensureFeatureState(fk).testGroups.find(x=>x.id===gid);
  if(g)g.name=val;
  syncFeatureBridge();
  queueTestGroupSave(fk,gid);
}

// ── Test Items ──
async function addTestItem(fk,gid){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  const g=ensureFeatureState(fk).testGroups.find(x=>x.id===gid);
  if(!g)return;
  try{
    const {data,error}=await supabaseClient
      .from('test_cases')
      .insert({
        test_group_id:gid,
        label:'',
        sort_order:g.items.length
      })
      .select('id, label')
      .single();
    if(error)throw error;
    g.items.push({id:data.id,label:data.label||''});
    syncFeatureBridge();
    renderTestGroups(fk);
  }catch(error){
    showDbError('Adding test case',error);
  }
}
async function deleteTestItem(fk,gid,iid){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  const g=ensureFeatureState(fk).testGroups.find(x=>x.id===gid);
  if(!g)return;
  try{
    const {error}=await supabaseClient.from('test_cases').delete().eq('id',iid);
    if(error)throw error;
    g.items=g.items.filter(i=>i.id!==iid);
    syncFeatureBridge();
    renderTestGroups(fk);
  }catch(error){
    showDbError('Deleting test case',error);
  }
}
function editTestItem(fk,gid,iid,val){
  if(!requireWorkspacePermission('can_edit_features','Editing feature checklists'))return;
  const g=ensureFeatureState(fk).testGroups.find(x=>x.id===gid);
  const it=g&&g.items.find(i=>i.id===iid);
  if(it)it.label=val;
  syncFeatureBridge();
  queueTestCaseSave(fk,gid,iid);
}

// ── Render: feature page — pure authoring, no checkboxes/progress ──
function renderTestGroups(fk){
  const c=document.getElementById(`${fk}-tests`);if(!c)return;
  syncFeatureBridge();
  if(c.dataset.reactManaged==='true')return;
  const groups=ensureFeatureState(fk).testGroups;
  if(!groups.length){
    c.innerHTML=`<div style="padding:32px 0;text-align:center;color:var(--tm);font-size:13px">No test groups yet — click <strong>+ Add Test Group</strong> to get started.</div>`;
    return;
  }
  c.innerHTML=groups.map(g=>`
    <div class="tc-group${g.open?' open':''}" id="tcg-${g.id}">
      <div class="tc-group-hd" onclick="toggleTestGroup('${fk}','${g.id}')">
        <svg class="tc-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        <input class="tc-group-name-input" value="${escHtml(g.name)}" onclick="event.stopPropagation()" oninput="renameTestGroup('${fk}','${g.id}',this.value)" placeholder="Group name"/>
        <span style="font-size:11.5px;color:var(--tm);flex-shrink:0;margin-right:6px">${g.items.length} item${g.items.length!==1?'s':''}</span>
        <button class="tc-dup-btn" onclick="event.stopPropagation();duplicateTestGroup('${fk}','${g.id}')" title="Duplicate checklist">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/></svg>
        </button>
        <button class="tc-del-btn" onclick="event.stopPropagation();deleteTestGroup('${fk}','${g.id}')" title="Delete group">
          <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
      <div class="tc-body">
        ${g.items.length?g.items.map(it=>`
        <div class="tc-item">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--bdr);flex-shrink:0;margin-top:7px"></div>
          <textarea class="tc-label" id="tci-${it.id}" rows="1" placeholder="Describe this test case…" oninput="editTestItem('${fk}','${g.id}','${it.id}',this.value);autoResize(this)">${escHtml(it.label)}</textarea>
          <button class="tc-item-del" onclick="deleteTestItem('${fk}','${g.id}','${it.id}')" title="Remove">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`).join(''):`<div class="tc-empty">No test cases yet.</div>`}
        <button class="tc-add-btn" onclick="addTestItem('${fk}','${g.id}')">
          <svg viewBox="0 0 24 24" style="width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add test case
        </button>
      </div>
    </div>`).join('');
}

// ════════════════════════════════════════════
// PER-TICKET TEST PROGRESS
// ticket.testProgress = { [fk]: { selected:[gid,...], checks:{ [gid]:{ [iid]:bool } } } }
// ════════════════════════════════════════════
function getTkProgress(tid,fk){
  const t=tickets.find(x=>x.id===tid);if(!t)return null;
  if(!t.testProgress)t.testProgress={};
  if(!t.testProgress[fk])t.testProgress[fk]={selected:[],checks:{}};
  return t.testProgress[fk];
}

// ── Group Picker Modal ──
let gpDraft={};// { fk+gid : bool }

function openGroupPicker(){
  const t=tickets.find(x=>x.id===dwTid);if(!t)return;
  const linked=t.modules.map(mk=>({mk,fk:getFeatureKeyByModuleKey(mk)})).filter(({fk})=>fk&&ensureFeatureState(fk).testGroups.length);
  const listEl=document.getElementById('gp-list');
  const emptyEl=document.getElementById('gp-empty');
  if(!linked.length){listEl.innerHTML='';emptyEl.style.display='';openOvl('gp-ovl');return;}
  emptyEl.style.display='none';
  // init draft from current selections
  gpDraft={};
  linked.forEach(({fk})=>{
    const p=getTkProgress(t.id,fk);
    ensureFeatureState(fk).testGroups.forEach(g=>{gpDraft[fk+'::'+g.id]=p.selected.includes(g.id);});
  });
  listEl.innerHTML=linked.map(({mk,fk})=>`
    <div class="gp-section">
      <div class="gp-mod-label">${mk}</div>
      ${ensureFeatureState(fk).testGroups.map(g=>{
        const preview=g.items.slice(0,3).map(i=>escHtml(i.label)||'Untitled').join(' · ')+(g.items.length>3?' · …':'');
        return `<div class="gp-row" onclick="gpToggle('${fk}','${g.id}')">
          <div class="gp-chk${gpDraft[fk+'::'+g.id]?' sel':''}" id="gpck-${fk}-${g.id}"></div>
          <div class="gp-info">
            <div class="gp-name">${escHtml(g.name)||'Unnamed group'}</div>
            <div class="gp-count">${g.items.length} test case${g.items.length!==1?'s':''}</div>
            ${preview?`<div class="gp-items-preview">${preview}</div>`:''}
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
  openOvl('gp-ovl');
}

function gpToggle(fk,gid){
  const key=fk+'::'+gid;
  gpDraft[key]=!gpDraft[key];
  const el=document.getElementById(`gpck-${fk}-${gid}`);
  if(el)el.classList.toggle('sel',gpDraft[key]);
}

function saveGroupPicker(){
  const t=tickets.find(x=>x.id===dwTid);if(!t)return;
  // apply draft back to testProgress
  Object.entries(gpDraft).forEach(([key,sel])=>{
    const [fk,gid]=key.split('::');
    const p=getTkProgress(t.id,fk);
    const idx=p.selected.indexOf(gid);
    if(sel&&idx===-1){p.selected.push(gid);if(!p.checks[gid])p.checks[gid]={};}
    else if(!sel&&idx>-1){p.selected.splice(idx,1);}
  });
  closeOvl('gp-ovl');
  renderDwTestCases(t);
}

function toggleDwCheck(tid,fk,gid,iid,val){
  const p=getTkProgress(tid,fk);if(!p)return;
  if(!p.checks[gid])p.checks[gid]={};
  p.checks[gid][iid]=val;
  // lightweight DOM update — no full re-render
  const g=ensureFeatureState(fk).testGroups.find(x=>x.id===gid);if(!g)return;
  const done=g.items.filter(i=>p.checks[gid]&&p.checks[gid][i.id]).length;
  const pct=g.items.length?Math.round(done/g.items.length*100):0;
  const fill=document.getElementById(`dwf-${tid}-${fk}-${gid}`);
  const lbl=document.getElementById(`dwl-${tid}-${fk}-${gid}`);
  if(fill)fill.style.width=pct+'%';
  if(lbl)lbl.textContent=g.items.length?`${done}/${g.items.length}`:'';
  const chkEl=document.getElementById(`dwc-${tid}-${fk}-${gid}-${iid}`);
  if(chkEl)chkEl.classList.toggle('done',val);
  const lblEl=document.getElementById(`dwlb-${tid}-${fk}-${gid}-${iid}`);
  if(lblEl)lblEl.classList.toggle('done',val);
}

function autoResize(el){el.style.height='auto';el.style.height=el.scrollHeight+'px';}
function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// ════════════════════════════════════════════
// TEAM
// ════════════════════════════════════════════

function tmInitials(name){
  return name.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
}

function syncTeamBridge(){
  const snapshot=team.map(member=>({...member}));
  window.__jiqsysTeam=snapshot;
  window.dispatchEvent(new CustomEvent('jiqsys:team-change',{detail:snapshot}));
}

function renderTeamPage(){
  syncTeamBridge();
  const c=document.getElementById('team-list');if(!c)return;
  if(c.dataset.reactManaged==='true')return;
  if(!team.length){
    c.innerHTML=`<div style="padding:48px 0;text-align:center;color:var(--tm);font-size:13.5px">No team members yet. Click <strong>+ Add Member</strong> to get started.</div>`;
    return;
  }
  c.innerHTML=team.map(m=>`
    <div class="tm-card">
      <div class="tm-av">${tmInitials(m.name)}</div>
      <div class="tm-info">
        <div class="tm-name">${escHtml(m.name)}</div>
        <div class="tm-meta">${escHtml(m.role)||'<span style="color:var(--tm)">No role set</span>'}${m.email?` · ${escHtml(m.email)}`:''}</div>
      </div>
      <div class="tm-actions">
        <button class="tm-btn" onclick="openEditMember('${m.id}')">Edit</button>
        <button class="tm-btn del" onclick="deleteMember('${m.id}')">Delete</button>
      </div>
    </div>`).join('');
}

function refreshAssigneeDropdowns(){
  refreshDerivedTickets();
  const ids=team.map(m=>m.id);
  const opts=`<option value="">Unassigned</option>`+team.map(m=>`<option value="${m.id}">${escHtml(m.name)}</option>`).join('');
  // filter bar
  const fb=document.getElementById('flt-assignee');
  if(fb){const v=fb.value;fb.innerHTML=`<option value="">All Assignees</option>`+team.map(m=>`<option value="${m.id}">${escHtml(m.name)}</option>`).join('');if(ids.includes(v))fb.value=v;}
  // drawer
  const dw=document.getElementById('dw-assignee');
  if(dw){const v=dw.value;dw.innerHTML=opts;dw.value=ids.includes(v)||v===''?v:'';}
  // new ticket modal
  const nt=document.getElementById('nt-asgn');
  if(nt){const v=nt.value;nt.innerHTML=opts;nt.value=ids.includes(v)||v===''?v:'';}
  syncTicketControlsBridge();
}

// ── Add / Edit modal state ──
let tmEditId=null;

function openAddMember(){
  if(!requireWorkspacePermission('can_manage_team','Managing team'))return;
  tmEditId=null;
  document.getElementById('tm-modal-title').textContent='Add Member';
  document.getElementById('tm-save-btn').textContent='Add Member';
  document.getElementById('tm-name').value='';
  document.getElementById('tm-role').value='';
  document.getElementById('tm-email').value='';
  document.getElementById('tm-av-preview').textContent='?';
  openOvl('tm-ovl');
  setTimeout(()=>document.getElementById('tm-name').focus(),80);
}

function openEditMember(id){
  if(!requireWorkspacePermission('can_manage_team','Managing team'))return;
  const m=team.find(x=>x.id===id);if(!m)return;
  tmEditId=id;
  document.getElementById('tm-modal-title').textContent='Edit Member';
  document.getElementById('tm-save-btn').textContent='Save Changes';
  document.getElementById('tm-name').value=m.name;
  document.getElementById('tm-role').value=m.role||'';
  document.getElementById('tm-email').value=m.email||'';
  document.getElementById('tm-av-preview').textContent=tmInitials(m.name);
  openOvl('tm-ovl');
  setTimeout(()=>document.getElementById('tm-name').focus(),80);
}

function tmPreviewAv(){
  const val=document.getElementById('tm-name').value;
  document.getElementById('tm-av-preview').textContent=tmInitials(val)||'?';
}

async function saveMember(){
  if(!requireWorkspacePermission('can_manage_team','Managing team'))return;
  const name=document.getElementById('tm-name').value.trim();
  if(!name){document.getElementById('tm-name').focus();return;}
  const role=document.getElementById('tm-role').value.trim();
  const email=document.getElementById('tm-email').value.trim();
  try{
    if(tmEditId){
      const {error}=await supabaseClient
        .from('team_members')
        .update({full_name:name,role_title:role||null,email:email||null})
        .eq('id',tmEditId);
      if(error)throw error;
      const m=team.find(x=>x.id===tmEditId);
      if(m){m.name=name;m.role=role;m.email=email;}
    } else {
      const {data,error}=await supabaseClient
        .from('team_members')
        .insert({full_name:name,role_title:role||null,email:email||null})
        .select('id, full_name, role_title, email')
        .single();
      if(error)throw error;
      team.push({id:data.id,name:data.full_name,role:data.role_title||'',email:data.email||''});
    }
    syncTeamBridge();
    closeOvl('tm-ovl');
    renderTeamPage();
    refreshAssigneeDropdowns();
    renderActive();
  }catch(error){
    showDbError('Saving team member',error);
  }
}

async function deleteMember(id){
  if(!requireWorkspacePermission('can_manage_team','Managing team'))return;
  const m=team.find(x=>x.id===id);if(!m)return;
  if(!confirm(`Remove ${m.name} from the team? They will be unassigned from any tickets.`))return;
  try{
    const {error}=await supabaseClient.from('team_members').delete().eq('id',id);
    if(error)throw error;
    team=team.filter(x=>x.id!==id);
    syncTeamBridge();
    [...tickets,...trash].forEach(t=>{
      if(t.assigneeId===id){t.assigneeId='';t.assignee='Unassigned';}
    });
    renderTeamPage();
    refreshAssigneeDropdowns();
    renderActive();
  }catch(error){
    showDbError('Deleting team member',error);
  }
}

// ════════════════════════════════════════════
// TRASH HELPERS
// ════════════════════════════════════════════
function updateTrashBadge(){
  const badge=document.getElementById('trash-badge');
  if(!badge)return;
  if(trash.length){badge.style.display='inline-block';badge.textContent=trash.length;}
  else{badge.style.display='none';}
}

async function softDelete(ids){
  const toDelete=tickets.filter(t=>ids.includes(t.id));
  if(!toDelete.length)return;
  const deletedAtRaw=new Date().toISOString();
  try{
    const rowIds=toDelete.map(t=>t.rowId).filter(Boolean);
    const {error}=await supabaseClient.from('tickets').update({deleted_at:deletedAtRaw}).in('id',rowIds);
    if(error)throw error;
    toDelete.forEach(t=>{
      t.deletedAtRaw=deletedAtRaw;
      normalizeTicket(t);
      upsertLocalTrash(t);
    });
    tickets=tickets.filter(t=>!ids.includes(t.id));
    updateTrashBadge();
    syncTrashBridge();
  }catch(error){
    showDbError('Moving tickets to trash',error);
  }
}

function renderTrashPage(){
  const empty=document.getElementById('trash-empty-state');
  const wrap=document.getElementById('trash-table-wrap');
  const featureWrap=document.getElementById('feature-trash-wrap');
  const featureCount=document.getElementById('feature-trash-count');
  const emptyBtn=document.getElementById('empty-trash-btn');
  const deletedFeatures=getDeletedFeatureRows();
  if(!empty||!wrap||!featureWrap)return;
  syncTrashBridge();
  if(empty.dataset.reactManaged==='true'&&wrap.dataset.reactManaged==='true'&&featureWrap.dataset.reactManaged==='true'){
    updateTrashBulkBar();
    return;
  }
  if(trash.length===0&&deletedFeatures.length===0){
    empty.style.display='block';wrap.style.display='none';featureWrap.style.display='none';
    if(emptyBtn)emptyBtn.style.display='none';
  } else {
    empty.style.display='none';
    wrap.style.display=trash.length?'block':'none';
    featureWrap.style.display=deletedFeatures.length?'block':'none';
    if(featureCount)featureCount.textContent=`${deletedFeatures.length} feature${deletedFeatures.length!==1?'s':''}`;
    if(emptyBtn)emptyBtn.style.display=trash.length?'inline-flex':'none';
    if(trash.length)renderTrashRows();
    renderFeatureTrashRows();
  }
  updateTrashBulkBar();
}

function syncTrashBridge(){
  const deletedFeatures=getDeletedFeatureRows();
  const payload={
    tickets:trash.map(t=>({
      id:t.id,
      title:t.title,
      statusHtml:pill(t.statusId),
      priorityHtml:priBdg(t.priority),
      assignee:t.assignee,
      deletedAt:t.deletedAt||'—',
      selected:trashSelected.has(t.id),
    })),
    features:deletedFeatures.map(row=>({
      key:getFeatureKeyFromRow(row),
      name:row.name,
      description:row.description||'No description',
      iconSvg:getFeatureIcon(row),
    })),
    selectedIds:[...trashSelected],
    allSelected:trash.length>0&&trash.every(t=>trashSelected.has(t.id)),
    partiallySelected:trashSelected.size>0&&!(trash.length>0&&trash.every(t=>trashSelected.has(t.id))),
    hasTrashTickets:trash.length>0,
    hasDeletedFeatures:deletedFeatures.length>0,
  };
  payload.isEmpty=!payload.hasTrashTickets&&!payload.hasDeletedFeatures;
  window.__jiqsysTrash=payload;
  window.dispatchEvent(new CustomEvent('jiqsys:trash-change',{detail:payload}));
}

function renderTrashRows(){
  document.getElementById('trash-body').innerHTML=trash.map(t=>`
    <tr class="${trashSelected.has(t.id)?'row-sel':''}">
      <td><input type="checkbox" class="tkchk" ${trashSelected.has(t.id)?'checked':''} onclick="toggleTrashRow('${t.id}',this)"/></td>
      <td><div style="font-weight:500;font-size:13px;color:var(--t2)">${t.title}</div></td>
      <td>${pill(t.statusId)}</td>
      <td>${priBdg(t.priority)}</td>
      <td style="font-size:13px;color:var(--t2)">${t.assignee}</td>
      <td style="font-size:12px;color:var(--tm);white-space:nowrap">${t.deletedAt||'—'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="trash-restore-btn" onclick="restoreTicket('${t.id}')">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Restore
          </button>
          <button class="trash-del-btn" onclick="permanentDelete('${t.id}')">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Delete
          </button>
        </div>
      </td>
    </tr>`).join('');
}
function renderFeatureTrashRows(){
  const container=document.getElementById('feature-trash-list');
  if(!container)return;
  const rows=getDeletedFeatureRows();
  container.innerHTML=rows.map(row=>{
    const fk=getFeatureKeyFromRow(row);
    return `<div style="display:flex;align-items:center;gap:12px;padding:12px 2px;border-top:1px solid #f0eeea">
      <div style="width:34px;height:34px;border-radius:10px;background:var(--sb);display:flex;align-items:center;justify-content:center;color:var(--t2);flex-shrink:0">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${getFeatureIcon(row)}</svg>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:var(--t1)">${escHtml(row.name)}</div>
        <div style="font-size:12px;color:var(--tm);margin-top:2px">${escHtml(row.description||'No description')}</div>
      </div>
      <button class="trash-restore-btn" onclick="restoreFeature('${fk}')">
        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>Restore
      </button>
    </div>`;
  }).join('');
}

// single restore / permanent delete
async function restoreTicket(id){
  const t=trash.find(x=>x.id===id);if(!t)return;
  const label=t.title;
  try{
    const {error}=await supabaseClient.from('tickets').update({deleted_at:null}).eq('id',t.rowId);
    if(error)throw error;
    t.deletedAtRaw=null;
    t.deletedAt='';
    tickets.push(normalizeTicket(t));
    removeLocalTrash(t.rowId);
    trashSelected.delete(id);
    updateTrashBadge();
    syncTrashBridge();
    renderTrashPage();
    renderActive();
    toast(`"${label.length>32?label.slice(0,32)+'…':label}" restored`,{icon:'restore'});
  }catch(error){
    showDbError('Restoring ticket',error);
  }
}
async function permanentDelete(id){
  if(!confirm('Permanently delete this ticket? This cannot be undone.'))return;
  const t=trash.find(x=>x.id===id);if(!t)return;
  try{
    const {error}=await supabaseClient.from('tickets').delete().eq('id',t.rowId);
    if(error)throw error;
    trash=trash.filter(x=>x.id!==id);
    trashSelected.delete(id);
    updateTrashBadge();
    syncTrashBridge();
    renderTrashPage();
  }catch(error){
    showDbError('Deleting ticket forever',error);
  }
}
async function emptyTrash(){
  if(!trash.length)return;
  if(!confirm(`Permanently delete all ${trash.length} ticket${trash.length>1?'s':''} in trash? This cannot be undone.`))return;
  try{
    const rowIds=trash.map(t=>t.rowId).filter(Boolean);
    const {error}=await supabaseClient.from('tickets').delete().in('id',rowIds);
    if(error)throw error;
    trash=[];trashSelected.clear();
    updateTrashBadge();syncTrashBridge();renderTrashPage();
  }catch(error){
    showDbError('Emptying trash',error);
  }
}

// trash selection
let trashSelected=new Set();
function toggleTrashSelectAll(el){
  if(el.checked)trash.forEach(t=>trashSelected.add(t.id));
  else trashSelected.clear();
  syncTrashBridge();
  updateTrashBulkBar();renderTrashRows();
}
function toggleTrashRow(id,el){
  if(el.checked)trashSelected.add(id);else trashSelected.delete(id);
  syncTrashBridge();
  updateTrashBulkBar();
}
function clearTrashSelection(){trashSelected.clear();syncTrashBridge();updateTrashBulkBar();renderTrashRows();}
function updateTrashBulkBar(){
  const bar=document.getElementById('trash-bulk-bar');
  const cnt=document.getElementById('trash-bulk-cnt');
  const chkAll=document.getElementById('trash-chk-all');
  if(!bar)return;
  syncTrashBridge();
  if(bar.dataset.reactManaged==='true'){
    if(chkAll){
      chkAll.checked=trash.length>0&&trash.every(t=>trashSelected.has(t.id));
      chkAll.indeterminate=trashSelected.size>0&&!chkAll.checked;
    }
    return;
  }
  if(trashSelected.size>0){
    bar.style.display='flex';
    cnt.textContent=`${trashSelected.size} selected`;
  } else bar.style.display='none';
  if(chkAll){
    chkAll.checked=trash.length>0&&trash.every(t=>trashSelected.has(t.id));
    chkAll.indeterminate=trashSelected.size>0&&!chkAll.checked;
  }
}
async function bulkRestore(idsArg=null){
  const ids=idsArg||[...trashSelected];
  const n=ids.length;
  if(!n)return;
  try{
    const restoreRows=trash.filter(t=>ids.includes(t.id));
    const rowIds=restoreRows.map(t=>t.rowId);
    const {error}=await supabaseClient.from('tickets').update({deleted_at:null}).in('id',rowIds);
    if(error)throw error;
    restoreRows.forEach(t=>{
      t.deletedAtRaw=null;
      t.deletedAt='';
      tickets.push(normalizeTicket(t));
    });
    trash=trash.filter(t=>!ids.includes(t.id));
    if(!idsArg)trashSelected.clear();
    updateTrashBadge();syncTrashBridge();renderTrashPage();renderActive();
    toast(`${n} ticket${n>1?'s':''} restored`,{icon:'restore'});
  }catch(error){
    showDbError('Restoring selected tickets',error);
  }
}
async function bulkPermanentDelete(){
  const n=trashSelected.size;
  if(!confirm(`Permanently delete ${n} ticket${n>1?'s':''}? This cannot be undone.`))return;
  try{
    const rowIds=trash.filter(t=>trashSelected.has(t.id)).map(t=>t.rowId);
    const {error}=await supabaseClient.from('tickets').delete().in('id',rowIds);
    if(error)throw error;
    trash=trash.filter(t=>!trashSelected.has(t.id));
    trashSelected.clear();
    updateTrashBadge();syncTrashBridge();renderTrashPage();
    toast(`${n} ticket${n>1?'s':''} permanently deleted`,{icon:'trash'});
  }catch(error){
    showDbError('Deleting selected tickets forever',error);
  }
}

// ════════════════════════════════════════════
// SYSTEM FLOWCHART
// ════════════════════════════════════════════
function getFlowchartRefs(){
  return flowchartUi.refs;
}
function getFlowchartNode(id){
  return ensureFlowchartState().nodes.find(node=>node.id===id)||null;
}
function getFlowchartConn(id){
  return ensureFlowchartState().conns.find(conn=>conn.id===id)||null;
}
function getFlowchartPortDefs(node){
  const {w,h}=node;
  return FLOWCHART_PORT_IDS.map(id=>{
    let x=0,y=0;
    if(id==='top'){x=0;y=-h/2;}
    if(id==='bottom'){x=0;y=h/2;}
    if(id==='left'){x=-w/2;y=0;}
    if(id==='right'){x=w/2;y=0;}
    return {id,x,y};
  });
}
function getFlowchartPortAbs(node,portId){
  const port=getFlowchartPortDefs(node).find(entry=>entry.id===portId);
  return port?{x:node.x+port.x,y:node.y+port.y}:{x:node.x,y:node.y};
}
function canConnectFlowchart(fromNodeId,fromPortId,toNodeId,toPortId,excludeConnId=null){
  if(!fromNodeId||!toNodeId)return false;
  if(fromNodeId===toNodeId)return false;
  return !ensureFlowchartState().conns.some(conn=>{
    if(excludeConnId&&conn.id===excludeConnId)return false;
    return conn.from===fromNodeId&&conn.fromPort===fromPortId&&conn.to===toNodeId&&conn.toPort===toPortId;
  });
}
function getFlowchartShapePath(node){
  const {type,w,h}=node;
  if(type==='terminator'){
    const rx=h/2;
    return `M${-w/2+rx},${-h/2} H${w/2-rx} A${rx},${h/2} 0 0 1 ${w/2-rx},${h/2} H${-w/2+rx} A${rx},${h/2} 0 0 1 ${-w/2+rx},${-h/2}Z`;
  }
  if(type==='process'){
    const r=3;
    return `M${-w/2+r},${-h/2} H${w/2-r} A${r},${r} 0 0 1 ${w/2},${-h/2+r} V${h/2-r} A${r},${r} 0 0 1 ${w/2-r},${h/2} H${-w/2+r} A${r},${r} 0 0 1 ${-w/2},${h/2-r} V${-h/2+r} A${r},${r} 0 0 1 ${-w/2+r},${-h/2}Z`;
  }
  if(type==='decision'){
    return `M0,${-h/2} L${w/2},0 L0,${h/2} L${-w/2},0Z`;
  }
  if(type==='parallelogram'){
    const skew=w*0.18;
    return `M${-w/2+skew},${-h/2} L${w/2+skew},${-h/2} L${w/2-skew},${h/2} L${-w/2-skew},${h/2}Z`;
  }
  return '';
}
function getFlowchartCurvePath(fromPoint,toPoint,fromPortId,toPortId){
  const offset=55;
  const c1x=fromPoint.x+(fromPortId==='right'?offset:fromPortId==='left'?-offset:0);
  const c1y=fromPoint.y+(fromPortId==='bottom'?offset:fromPortId==='top'?-offset:0);
  const c2x=toPoint.x+(toPortId==='right'?offset:toPortId==='left'?-offset:0);
  const c2y=toPoint.y+(toPortId==='bottom'?offset:toPortId==='top'?-offset:0);
  return `M${fromPoint.x},${fromPoint.y} C${c1x},${c1y} ${c2x},${c2y} ${toPoint.x},${toPoint.y}`;
}
function getFlowchartCurveMid(fromPoint,toPoint,fromPortId,toPortId){
  const offset=55;
  const c1x=fromPoint.x+(fromPortId==='right'?offset:fromPortId==='left'?-offset:0);
  const c1y=fromPoint.y+(fromPortId==='bottom'?offset:fromPortId==='top'?-offset:0);
  const c2x=toPoint.x+(toPortId==='right'?offset:toPortId==='left'?-offset:0);
  const c2y=toPoint.y+(toPortId==='bottom'?offset:toPortId==='top'?-offset:0);
  return {
    x:0.125*fromPoint.x+0.375*c1x+0.375*c2x+0.125*toPoint.x,
    y:0.125*fromPoint.y+0.375*c1y+0.375*c2y+0.125*toPoint.y,
  };
}
function flowchartSvgPoint(event){
  const refs=getFlowchartRefs();
  const rect=refs.svg.getBoundingClientRect();
  return {x:event.clientX-rect.left,y:event.clientY-rect.top};
}
function focusFlowchartCanvas(){
  getFlowchartRefs()?.canvasWrap?.focus({preventScroll:true});
}
function clampFlowchartNodePosition(node,x,y){
  const refs=getFlowchartRefs();
  const rect=refs?.canvasWrap?.getBoundingClientRect();
  if(!rect||rect.width<=0||rect.height<=0)return {x,y};
  const minX=node.w/2+FLOWCHART_BOUND_PAD;
  const maxX=Math.max(minX,rect.width-node.w/2-FLOWCHART_BOUND_PAD);
  const minY=node.h/2+FLOWCHART_BOUND_PAD;
  const maxY=Math.max(minY,rect.height-node.h/2-FLOWCHART_BOUND_PAD);
  return {
    x:Math.min(maxX,Math.max(minX,x)),
    y:Math.min(maxY,Math.max(minY,y)),
  };
}
function makeFlowchartSvg(tag,attrs){
  const el=document.createElementNS(FLOWCHART_SVG_NS,tag);
  Object.entries(attrs||{}).forEach(([key,val])=>el.setAttribute(key,val));
  return el;
}
function makeFlowchartDeleteHandle(kind,id,x,y){
  const group=makeFlowchartSvg('g',{
    class:'flowbuilder-delete-handle',
    transform:`translate(${x},${y})`,
    'data-kind':kind,
    'data-id':id,
  });
  group.appendChild(makeFlowchartSvg('circle',{class:'flowbuilder-delete-disc',cx:0,cy:0,r:11}));
  group.appendChild(makeFlowchartSvg('path',{class:'flowbuilder-delete-icon',d:'M-3.5,-3.5 L3.5,3.5 M3.5,-3.5 L-3.5,3.5'}));
  group.addEventListener('mousedown',handleFlowchartDeleteHandleDown);
  return group;
}
function positionFlowchartNodeEditor(node){
  const refs=getFlowchartRefs();
  const width=node.w-FLOWCHART_PAD_X;
  const height=node.h;
  const x=node.x-node.w/2+FLOWCHART_PAD_X/2;
  const y=node.y-node.h/2;
  refs.foWrap.setAttribute('x',x);
  refs.foWrap.setAttribute('y',y);
  refs.foWrap.setAttribute('width',width);
  refs.foWrap.setAttribute('height',height);
  const lines=(refs.foTa.value||' ').split('\n').length;
  const topPad=Math.max(FLOWCHART_PAD_Y,(height-lines*FLOWCHART_LINE_H)/2);
  refs.foTa.style.width=`${width}px`;
  refs.foTa.style.height=`${height}px`;
  refs.foTa.style.paddingTop=`${topPad}px`;
  refs.foTa.style.paddingBottom=`${FLOWCHART_PAD_Y}px`;
  refs.foTa.style.paddingLeft='2px';
  refs.foTa.style.paddingRight='2px';
}
function closeFlowchartNodeEditor(silent=false){
  const refs=getFlowchartRefs();
  if(!refs||!flowchartUi.editingNodeId)return;
  const node=getFlowchartNode(flowchartUi.editingNodeId);
  if(node){
    const nextLabel=refs.foTa.value.trim()||flowchartDefaultLabel(node.type);
    node.label=nextLabel;
    const size=flowchartSizeFor(node);
    node.w=size.w;
    node.h=size.h;
    const clamped=clampFlowchartNodePosition(node,node.x,node.y);
    node.x=clamped.x;
    node.y=clamped.y;
  }
  flowchartUi.editingNodeId=null;
  refs.foWrap.classList.remove('is-editing');
  refs.foWrap.setAttribute('x',-9999);
  refs.foWrap.setAttribute('y',-9999);
  refs.foWrap.setAttribute('width',1);
  refs.foWrap.setAttribute('height',1);
  if(!silent){
    queueFlowchartSave();
    renderSystemFlowchart();
  }
}
function openFlowchartNodeEditor(node){
  const refs=getFlowchartRefs();
  if(!refs||!node)return;
  if(flowchartUi.editingNodeId===node.id){
    refs.foTa.focus();
    return;
  }
  commitFlowchartConnEditor();
  if(flowchartUi.editingNodeId)closeFlowchartNodeEditor(true);
  flowchartUi.editingNodeId=node.id;
  flowchartUi.sel={type:'node',id:node.id};
  refs.foTa.value=node.label||'';
  renderSystemFlowchart();
  positionFlowchartNodeEditor(node);
  refs.foWrap.classList.add('is-editing');
  refs.foTa.focus();
  refs.foTa.select();
}
function commitFlowchartNodeEditor(){
  if(flowchartUi.editingNodeId)closeFlowchartNodeEditor(false);
}
function positionFlowchartConnEditor(mid,text){
  const refs=getFlowchartRefs();
  const lines=(text||' ').split('\n');
  const lineWidth=Math.max(...lines.map(line=>flowchartMeasureContext.measureText(line||' ').width));
  const width=Math.max(56,Math.ceil(lineWidth)+16);
  const height=lines.length*16+10;
  refs.connFo.setAttribute('x',mid.x-width/2);
  refs.connFo.setAttribute('y',mid.y-height/2);
  refs.connFo.setAttribute('width',width);
  refs.connFo.setAttribute('height',height);
  refs.connTa.style.width=`${width}px`;
  refs.connTa.style.height=`${height}px`;
}
function openFlowchartConnEditor(connId){
  const refs=getFlowchartRefs();
  if(!refs)return;
  if(flowchartUi.editingConnId===connId){
    refs.connTa.focus();
    return;
  }
  commitFlowchartConnEditor();
  commitFlowchartNodeEditor();
  flowchartUi.editingConnId=connId;
  flowchartUi.sel={type:'conn',id:connId};
  const conn=getFlowchartConn(connId);
  if(!conn)return;
  const fromNode=getFlowchartNode(conn.from);
  const toNode=getFlowchartNode(conn.to);
  if(!fromNode||!toNode)return;
  const mid=getFlowchartCurveMid(getFlowchartPortAbs(fromNode,conn.fromPort),getFlowchartPortAbs(toNode,conn.toPort),conn.fromPort,conn.toPort);
  refs.connTa.value=conn.label||'';
  positionFlowchartConnEditor(mid,refs.connTa.value);
  refs.connFo.classList.add('is-editing');
  refs.connTa.focus();
  refs.connTa.select();
  renderSystemFlowchart();
}
function commitFlowchartConnEditor(){
  const refs=getFlowchartRefs();
  if(!refs||!flowchartUi.editingConnId)return;
  const conn=getFlowchartConn(flowchartUi.editingConnId);
  if(conn)conn.label=refs.connTa.value.trim();
  flowchartUi.editingConnId=null;
  refs.connFo.classList.remove('is-editing');
  refs.connFo.setAttribute('x',-9999);
  refs.connFo.setAttribute('y',-9999);
  refs.connFo.setAttribute('width',1);
  refs.connFo.setAttribute('height',1);
  queueFlowchartSave();
  renderSystemFlowchart();
}
function partialRenderFlowchartNode(node){
  const refs=getFlowchartRefs();
  const group=refs.nodeLayer.querySelector(`g[data-id="${node.id}"]`);
  if(!group){
    renderSystemFlowchart();
    return;
  }
  group.setAttribute('transform',`translate(${node.x},${node.y})`);
  const body=group.querySelector('.flowbuilder-node-body');
  if(body)body.setAttribute('d',getFlowchartShapePath(node));
  group.querySelectorAll('.flowbuilder-node-label').forEach(label=>label.remove());
  if(flowchartUi.editingNodeId!==node.id){
    const lines=(node.label||'').split('\n');
    const totalHeight=lines.length*FLOWCHART_LINE_H;
    lines.forEach((line,index)=>{
      const text=makeFlowchartSvg('text',{class:'flowbuilder-node-label',x:0,y:-totalHeight/2+index*FLOWCHART_LINE_H+FLOWCHART_LINE_H/2});
      text.textContent=line;
      group.appendChild(text);
    });
  }
  getFlowchartPortDefs(node).forEach(port=>{
    const dot=group.querySelector(`[data-port="${port.id}"]`);
    const ring=group.querySelector(`.flowbuilder-snap-ring[data-sp="${port.id}"]`);
    if(dot){
      dot.setAttribute('cx',port.x);
      dot.setAttribute('cy',port.y);
    }
    if(ring){
      ring.setAttribute('cx',port.x);
      ring.setAttribute('cy',port.y);
    }
  });
}
function renderFlowchartConns(){
  const refs=getFlowchartRefs();
  refs.connLayer.innerHTML='';
  ensureFlowchartState().conns.forEach(conn=>{
    const fromNode=getFlowchartNode(conn.from);
    const toNode=getFlowchartNode(conn.to);
    if(!fromNode||!toNode)return;
    const fromPoint=getFlowchartPortAbs(fromNode,conn.fromPort);
    const toPoint=getFlowchartPortAbs(toNode,conn.toPort);
    const path=getFlowchartCurvePath(fromPoint,toPoint,conn.fromPort,conn.toPort);
    const isSelected=flowchartUi.sel?.type==='conn'&&flowchartUi.sel.id===conn.id;
    const hit=makeFlowchartSvg('path',{class:'flowbuilder-conn-hit',d:path,'data-id':conn.id});
    hit.addEventListener('mousedown',handleFlowchartConnDown);
    refs.connLayer.appendChild(hit);
    refs.connLayer.appendChild(makeFlowchartSvg('path',{
      class:`flowbuilder-conn-path${isSelected?' selected':''}`,
      d:path,
      'marker-end':isSelected?'url(#flowbuilder-arr-sel)':'url(#flowbuilder-arr)',
    }));
    if(conn.label&&flowchartUi.editingConnId!==conn.id){
      const mid=getFlowchartCurveMid(fromPoint,toPoint,conn.fromPort,conn.toPort);
      const labelWidth=Math.max(44,Math.ceil(flowchartMeasureContext.measureText(conn.label).width)+16);
      const labelBg=makeFlowchartSvg('rect',{
        x:mid.x-labelWidth/2,
        y:mid.y-10,
        width:labelWidth,
        height:20,
        rx:3,
        fill:'var(--wh)',
        stroke:'var(--bdr)',
        'stroke-width':1,
        class:'flowbuilder-conn-label-bg',
        'data-id':conn.id,
      });
      labelBg.addEventListener('mousedown',handleFlowchartConnDown);
      refs.connLayer.appendChild(labelBg);
      const label=makeFlowchartSvg('text',{class:'flowbuilder-conn-label',x:mid.x,y:mid.y,'data-id':conn.id});
      label.addEventListener('mousedown',handleFlowchartConnDown);
      label.textContent=conn.label;
      refs.connLayer.appendChild(label);
    }
    if(isSelected){
      addFlowchartEndpointHandle(conn.id,'from',fromPoint);
      addFlowchartEndpointHandle(conn.id,'to',toPoint);
      const mid=getFlowchartCurveMid(fromPoint,toPoint,conn.fromPort,conn.toPort);
      refs.connLayer.appendChild(makeFlowchartDeleteHandle('conn',conn.id,mid.x+20,mid.y-20));
    }
  });
}
function addFlowchartEndpointHandle(connId,end,pos){
  const refs=getFlowchartRefs();
  const handle=makeFlowchartSvg('circle',{
    class:'flowbuilder-ep-handle',
    cx:pos.x,
    cy:pos.y,
    r:7,
    'data-conn':connId,
    'data-end':end,
  });
  handle.addEventListener('mousedown',handleFlowchartEndpointDown);
  refs.connLayer.appendChild(handle);
}
function renderFlowchartNodes(){
  const refs=getFlowchartRefs();
  refs.nodeLayer.innerHTML='';
  ensureFlowchartState().nodes.forEach(node=>{
    const isEditing=flowchartUi.editingNodeId===node.id;
    const isSelected=flowchartUi.sel?.type==='node'&&flowchartUi.sel.id===node.id;
    const group=makeFlowchartSvg('g',{
      class:'flowbuilder-node-group',
      'data-id':node.id,
      transform:`translate(${node.x},${node.y})`,
    });
    let bodyClass='flowbuilder-node-body';
    if(isSelected)bodyClass+=' sel';
    if(isEditing)bodyClass+=' editing-ring';
    group.appendChild(makeFlowchartSvg('path',{class:bodyClass,d:getFlowchartShapePath(node)}));
    if(!isEditing){
      const lines=(node.label||'').split('\n');
      const totalHeight=lines.length*FLOWCHART_LINE_H;
      lines.forEach((line,index)=>{
        const text=makeFlowchartSvg('text',{
          class:'flowbuilder-node-label',
          x:0,
          y:-totalHeight/2+index*FLOWCHART_LINE_H+FLOWCHART_LINE_H/2,
        });
        text.textContent=line;
        group.appendChild(text);
      });
    }
    const ports=makeFlowchartSvg('g',{class:'flowbuilder-node-ports'});
    getFlowchartPortDefs(node).forEach(port=>{
      const dot=makeFlowchartSvg('circle',{
        class:'flowbuilder-port-dot',
        cx:port.x,
        cy:port.y,
        r:5,
        'data-node':node.id,
        'data-port':port.id,
      });
      dot.addEventListener('mousedown',handleFlowchartPortDown);
      ports.appendChild(dot);
      ports.appendChild(makeFlowchartSvg('circle',{
        class:'flowbuilder-snap-ring',
        cx:port.x,
        cy:port.y,
        r:11,
        'data-sn':node.id,
        'data-sp':port.id,
      }));
    });
    group.appendChild(ports);
    if(isSelected){
      group.appendChild(makeFlowchartDeleteHandle('node',node.id,node.w/2+14,-node.h/2-14));
    }
    group.addEventListener('mousedown',handleFlowchartNodeDown);
    group.addEventListener('dblclick',handleFlowchartNodeDblClick);
    refs.nodeLayer.appendChild(group);
  });
}
function updateFlowchartSnapRings(snapTarget){
  document.querySelectorAll('.flowbuilder-snap-ring').forEach(ring=>ring.classList.remove('valid','invalid'));
  if(!snapTarget)return;
  document.querySelector(`.flowbuilder-snap-ring[data-sn="${snapTarget.nid}"][data-sp="${snapTarget.pid}"]`)?.classList.add(snapTarget.valid?'valid':'invalid');
}
function findFlowchartSnap(pos,mode,fromNodeId,fromPortId,excludeNodeId,excludePortId,excludeConnId){
  let best=null;
  let bestDistance=FLOWCHART_SNAP_R;
  ensureFlowchartState().nodes.forEach(node=>{
    if(mode==='new-conn'&&node.id===fromNodeId)return;
    getFlowchartPortDefs(node).forEach(port=>{
      if(node.id===excludeNodeId&&port.id===excludePortId)return;
      const abs=getFlowchartPortAbs(node,port.id);
      const distance=Math.hypot(pos.x-abs.x,pos.y-abs.y);
      if(distance>=bestDistance)return;
      let valid=false;
      if(mode==='new-conn'){
        valid=canConnectFlowchart(fromNodeId,fromPortId,node.id,port.id);
      }else if(mode==='ep-from'){
        const conn=getFlowchartConn(excludeConnId);
        valid=conn?canConnectFlowchart(node.id,port.id,conn.to,conn.toPort,excludeConnId):false;
      }else if(mode==='ep-to'){
        const conn=getFlowchartConn(excludeConnId);
        valid=conn?canConnectFlowchart(conn.from,conn.fromPort,node.id,port.id,excludeConnId):false;
      }
      bestDistance=distance;
      best={nid:node.id,pid:port.id,pos:abs,valid};
    });
  });
  return best;
}
function moveFlowchartNewConn(pos){
  const refs=getFlowchartRefs();
  if(!flowchartUi.newConn)return;
  const fromNode=getFlowchartNode(flowchartUi.newConn.fromId);
  if(!fromNode)return;
  const snap=findFlowchartSnap(pos,'new-conn',flowchartUi.newConn.fromId,flowchartUi.newConn.fromPort);
  flowchartUi.newConn.snapTarget=snap;
  updateFlowchartSnapRings(snap);
  const fromPoint=getFlowchartPortAbs(fromNode,flowchartUi.newConn.fromPort);
  const tip=snap?snap.pos:pos;
  const tipPort=snap?snap.pid:'top';
  refs.tempConn.setAttribute('class',snap?(snap.valid?'valid-drop':'invalid-drop'):'dragging');
  if(snap)refs.tempConn.setAttribute('marker-end',snap.valid?'url(#flowbuilder-arr-valid)':'url(#flowbuilder-arr-invalid)');
  else refs.tempConn.removeAttribute('marker-end');
  refs.tempConn.setAttribute('d',getFlowchartCurvePath(fromPoint,tip,flowchartUi.newConn.fromPort,tipPort));
}
function commitFlowchartNewConn(){
  const refs=getFlowchartRefs();
  if(!flowchartUi.newConn)return;
  refs.tempConn.setAttribute('d','');
  refs.tempConn.setAttribute('class','dragging');
  refs.tempConn.removeAttribute('marker-end');
  refs.canvasWrap.classList.remove('conn-mode');
  refs.nodeLayer.classList.remove('flowbuilder-show-ports');
  updateFlowchartSnapRings(null);
  const snap=flowchartUi.newConn.snapTarget;
  if(snap&&snap.valid){
    ensureFlowchartState().conns.push({
      id:flowchartConnId(),
      from:flowchartUi.newConn.fromId,
      fromPort:flowchartUi.newConn.fromPort,
      to:snap.nid,
      toPort:snap.pid,
      label:'',
    });
    queueFlowchartSave();
    renderSystemFlowchart();
  }
  flowchartUi.newConn=null;
}
function moveFlowchartEndpoint(pos){
  const refs=getFlowchartRefs();
  if(!flowchartUi.epDrag)return;
  const conn=getFlowchartConn(flowchartUi.epDrag.connId);
  if(!conn)return;
  const mode=flowchartUi.epDrag.end==='from'?'ep-from':'ep-to';
  const snap=findFlowchartSnap(pos,mode,null,null,flowchartUi.epDrag.excludeNodeId,flowchartUi.epDrag.excludePortId,flowchartUi.epDrag.connId);
  flowchartUi.epDrag.snapTarget=snap;
  updateFlowchartSnapRings(snap);
  let anchorPoint,anchorPort;
  if(flowchartUi.epDrag.end==='to'){
    const fromNode=getFlowchartNode(conn.from);
    anchorPoint=getFlowchartPortAbs(fromNode,conn.fromPort);
    anchorPort=conn.fromPort;
  }else{
    const toNode=getFlowchartNode(conn.to);
    anchorPoint=getFlowchartPortAbs(toNode,conn.toPort);
    anchorPort=conn.toPort;
  }
  const tip=snap?snap.pos:pos;
  const tipPort=snap?snap.pid:(flowchartUi.epDrag.end==='to'?'top':'bottom');
  refs.tempConn.setAttribute('class',snap?(snap.valid?'valid-drop':'invalid-drop'):'dragging');
  if(snap)refs.tempConn.setAttribute('marker-end',snap.valid?'url(#flowbuilder-arr-valid)':'url(#flowbuilder-arr-invalid)');
  else refs.tempConn.removeAttribute('marker-end');
  refs.tempConn.setAttribute('d',flowchartUi.epDrag.end==='to'
    ? getFlowchartCurvePath(anchorPoint,tip,anchorPort,tipPort)
    : getFlowchartCurvePath(tip,anchorPoint,tipPort,anchorPort));
}
function commitFlowchartEndpoint(){
  const refs=getFlowchartRefs();
  if(!flowchartUi.epDrag)return;
  refs.tempConn.setAttribute('d','');
  refs.tempConn.setAttribute('class','dragging');
  refs.tempConn.removeAttribute('marker-end');
  refs.canvasWrap.classList.remove('ep-drag-mode');
  refs.nodeLayer.classList.remove('flowbuilder-show-ports');
  updateFlowchartSnapRings(null);
  const snap=flowchartUi.epDrag.snapTarget;
  const conn=getFlowchartConn(flowchartUi.epDrag.connId);
  if(snap&&snap.valid&&conn){
    if(flowchartUi.epDrag.end==='from'){
      conn.from=snap.nid;
      conn.fromPort=snap.pid;
    }else{
      conn.to=snap.nid;
      conn.toPort=snap.pid;
    }
    queueFlowchartSave();
  }
  flowchartUi.sel={type:'conn',id:flowchartUi.epDrag.connId};
  flowchartUi.epDrag=null;
  renderSystemFlowchart();
}
function addFlowchartNode(type,x=null,y=null){
  const refs=getFlowchartRefs();
  const rect=refs.canvasWrap.getBoundingClientRect();
  const nextX=Number.isFinite(x)?x:rect.width/2+(Math.random()*40-20);
  const nextY=Number.isFinite(y)?y:rect.height/2+(Math.random()*40-20);
  const node=createFlowchartNode(type,nextX,nextY);
  const clamped=clampFlowchartNodePosition(node,node.x,node.y);
  node.x=clamped.x;
  node.y=clamped.y;
  ensureFlowchartState().nodes.push(node);
  flowchartUi.sel={type:'node',id:node.id};
  focusFlowchartCanvas();
  queueFlowchartSave();
  renderSystemFlowchart();
}
function deleteFlowchartSelection(){
  if(!flowchartUi.sel)return;
  commitFlowchartNodeEditor();
  if(flowchartUi.sel.type==='node'){
    const nodeId=flowchartUi.sel.id;
    flowchartState.nodes=ensureFlowchartState().nodes.filter(node=>node.id!==nodeId);
    flowchartState.conns=ensureFlowchartState().conns.filter(conn=>conn.from!==nodeId&&conn.to!==nodeId);
  }else if(flowchartUi.sel.type==='conn'){
    if(flowchartUi.editingConnId===flowchartUi.sel.id)commitFlowchartConnEditor();
    flowchartState.conns=ensureFlowchartState().conns.filter(conn=>conn.id!==flowchartUi.sel.id);
  }
  flowchartUi.sel=null;
  queueFlowchartSave();
  renderSystemFlowchart();
}
function syncFlowchartSelectionFromDom(){
  if(flowchartUi.sel) return flowchartUi.sel;
  const refs = getFlowchartRefs();

  // Node: check both class names to be safe
  const nodeGroup = refs?.nodeLayer
    ?.querySelector('.flowbuilder-node-body.sel, .flowbuilder-node-body.selected')
    ?.closest('g[data-id]');
  if(nodeGroup){
    flowchartUi.sel = { type:'node', id:nodeGroup.dataset.id };
    return flowchartUi.sel;
  }

  // Connection: find the hit element directly, not via sibling traversal
  const connHit = refs?.connLayer
    ?.querySelector('.flowbuilder-conn-hit[data-id]');
  const connPath = connHit?.nextElementSibling;
  if(connHit && connPath?.classList?.contains('flowbuilder-conn-path') 
     && (connPath.classList.contains('selected') || connPath.classList.contains('sel'))){
    flowchartUi.sel = { type:'conn', id:connHit.dataset.id };
    return flowchartUi.sel;
  }

  return null;
}
function handleFlowchartDeleteKey(event){
  if(event.key!=='Delete'&&event.key!=='Backspace')return;
  if(!document.getElementById('page-flowchart')?.classList.contains('active'))return;
  const target=event.target;
  if(target instanceof HTMLElement&&target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(!syncFlowchartSelectionFromDom())return;
  event.preventDefault();
  deleteFlowchartSelection();
}
function handleFlowchartNodeDown(event){
  if(event.target.classList.contains('flowbuilder-port-dot'))return;
  if(flowchartUi.editingNodeId===event.currentTarget.dataset.id)return;
  commitFlowchartConnEditor();
  event.stopPropagation();
  event.preventDefault();
  flowchartUi.skipCanvasClick=true;
  const node=getFlowchartNode(event.currentTarget.dataset.id);
  if(!node)return;
  if(flowchartUi.sel?.type==='node'&&flowchartUi.sel.id===node.id&&event.detail>1){
    openFlowchartNodeEditor(node);
    return;
  }
  const pos=flowchartSvgPoint(event);
  flowchartUi.sel={type:'node',id:node.id};
  focusFlowchartCanvas();
  flowchartUi.nodeDrag={id:node.id,startX:pos.x,startY:pos.y,originX:node.x,originY:node.y,moved:false};
  renderSystemFlowchart();
}
function handleFlowchartNodeDblClick(event){
  event.stopPropagation();
  event.preventDefault();
  flowchartUi.dblclickPending=true;
  openFlowchartNodeEditor(getFlowchartNode(event.currentTarget.dataset.id));
  Promise.resolve().then(()=>{flowchartUi.dblclickPending=false;});
}
function handleFlowchartPortDown(event){
  const refs=getFlowchartRefs();
  event.stopPropagation();
  event.preventDefault();
  flowchartUi.skipCanvasClick=true;
  commitFlowchartNodeEditor();
  commitFlowchartConnEditor();
  const nodeId=event.target.dataset.node;
  const portId=event.target.dataset.port;
  const node=getFlowchartNode(nodeId);
  if(!node)return;
  const fromPoint=getFlowchartPortAbs(node,portId);
  flowchartUi.newConn={fromId:nodeId,fromPort:portId,snapTarget:null};
  refs.tempConn.setAttribute('d',`M${fromPoint.x},${fromPoint.y}`);
  refs.canvasWrap.classList.add('conn-mode');
  refs.nodeLayer.classList.add('flowbuilder-show-ports');
}
function handleFlowchartConnDown(event){
  event.stopPropagation();
  event.preventDefault();
  flowchartUi.skipCanvasClick=true;
  commitFlowchartNodeEditor();
  const connId=event.currentTarget.dataset.id;
  if(flowchartUi.sel?.type==='conn'&&flowchartUi.sel.id===connId&&event.detail>1){
    openFlowchartConnEditor(connId);
  }else{
    if(flowchartUi.editingConnId)commitFlowchartConnEditor();
    flowchartUi.sel={type:'conn',id:connId};
    focusFlowchartCanvas();
    renderSystemFlowchart();
  }
}
function handleFlowchartEndpointDown(event){
  const refs=getFlowchartRefs();
  event.stopPropagation();
  event.preventDefault();
  flowchartUi.skipCanvasClick=true;
  commitFlowchartNodeEditor();
  const connId=event.currentTarget.dataset.conn;
  const end=event.currentTarget.dataset.end;
  const conn=getFlowchartConn(connId);
  if(!conn)return;
  flowchartUi.epDrag={
    connId,
    end,
    snapTarget:null,
    excludeNodeId:end==='from'?conn.from:conn.to,
    excludePortId:end==='from'?conn.fromPort:conn.toPort,
  };
  refs.canvasWrap.classList.add('ep-drag-mode');
  refs.nodeLayer.classList.add('flowbuilder-show-ports');
  moveFlowchartEndpoint(flowchartSvgPoint(event));
}
function handleFlowchartDeleteHandleDown(event){
  event.stopPropagation();
  event.preventDefault();
  flowchartUi.skipCanvasClick=true;
  const kind=event.currentTarget.dataset.kind;
  const id=event.currentTarget.dataset.id;
  if(!kind||!id)return;
  flowchartUi.sel={type:kind,id};
  deleteFlowchartSelection();
  focusFlowchartCanvas();
}
function handleFlowchartCanvasClick(event){
  const refs=getFlowchartRefs();
  if(flowchartUi.dropping){
    flowchartUi.dropping=false;
    return;
  }
  if(flowchartUi.skipCanvasClick){
    flowchartUi.skipCanvasClick=false;
    return;
  }
  if(flowchartUi.newConn||flowchartUi.epDrag)return;
  if(event.target!==refs.svg&&event.target!==refs.canvasWrap)return;
  if(flowchartUi.editingConnId){
    commitFlowchartConnEditor();
    return;
  }
  if(!flowchartUi.editingNodeId&&flowchartUi.sel){
    flowchartUi.sel=null;
    renderSystemFlowchart();
  }
  focusFlowchartCanvas();
}
function handleFlowchartDocumentPointerDown(event){
  const refs=getFlowchartRefs();
  if(!refs)return;
  if(flowchartUi.editingNodeId&&!flowchartUi.dblclickPending){
    const rect=refs.foWrap.getBoundingClientRect();
    const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    if(!inside)commitFlowchartNodeEditor();
  }
  if(flowchartUi.editingConnId){
    const rect=refs.connFo.getBoundingClientRect();
    const inside=event.clientX>=rect.left&&event.clientX<=rect.right&&event.clientY>=rect.top&&event.clientY<=rect.bottom;
    if(!inside)commitFlowchartConnEditor();
  }
}
function handleFlowchartMouseMove(event){
  const pos=flowchartSvgPoint(event);
  if(flowchartUi.nodeDrag){
    const node=getFlowchartNode(flowchartUi.nodeDrag.id);
    if(node){
      const clamped=clampFlowchartNodePosition(
        node,
        flowchartUi.nodeDrag.originX+(pos.x-flowchartUi.nodeDrag.startX),
        flowchartUi.nodeDrag.originY+(pos.y-flowchartUi.nodeDrag.startY)
      );
      node.x=clamped.x;
      node.y=clamped.y;
      flowchartUi.nodeDrag.moved=true;
      partialRenderFlowchartNode(node);
      renderFlowchartConns();
      if(flowchartUi.editingNodeId===node.id)positionFlowchartNodeEditor(node);
    }
  }
  if(flowchartUi.newConn)moveFlowchartNewConn(pos);
  if(flowchartUi.epDrag)moveFlowchartEndpoint(pos);
}
function handleFlowchartMouseUp(){
  if(flowchartUi.nodeDrag){
    if(flowchartUi.nodeDrag.moved){
      queueFlowchartSave();
      renderSystemFlowchart();
    }
    flowchartUi.nodeDrag=null;
  }
  if(flowchartUi.newConn)commitFlowchartNewConn();
  if(flowchartUi.epDrag)commitFlowchartEndpoint();
}
function handleFlowchartNodeEditorInput(){
  const refs=getFlowchartRefs();
  const node=getFlowchartNode(flowchartUi.editingNodeId);
  if(!node)return;
  node.label=refs.foTa.value;
  const size=flowchartSizeFor(node);
  if(size.w!==node.w||size.h!==node.h){
    node.w=size.w;
    node.h=size.h;
    const clamped=clampFlowchartNodePosition(node,node.x,node.y);
    node.x=clamped.x;
    node.y=clamped.y;
    partialRenderFlowchartNode(node);
    renderFlowchartConns();
  }
  positionFlowchartNodeEditor(node);
}
function handleFlowchartNodeEditorKeydown(event){
  if(event.key==='Escape'){
    event.preventDefault();
    commitFlowchartNodeEditor();
  }
  event.stopPropagation();
}
function handleFlowchartConnEditorInput(){
  const refs=getFlowchartRefs();
  const conn=getFlowchartConn(flowchartUi.editingConnId);
  if(!conn)return;
  conn.label=refs.connTa.value;
  const fromNode=getFlowchartNode(conn.from);
  const toNode=getFlowchartNode(conn.to);
  if(!fromNode||!toNode)return;
  const mid=getFlowchartCurveMid(getFlowchartPortAbs(fromNode,conn.fromPort),getFlowchartPortAbs(toNode,conn.toPort),conn.fromPort,conn.toPort);
  positionFlowchartConnEditor(mid,refs.connTa.value);
}
function handleFlowchartConnEditorKeydown(event){
  if(event.key==='Escape'){
    event.preventDefault();
    commitFlowchartConnEditor();
  }
  event.stopPropagation();
}
function handleFlowchartPanelDragStart(event){
  flowchartUi.panelType=event.currentTarget.dataset.type;
  if(event.dataTransfer){
    event.dataTransfer.effectAllowed='copy';
    event.dataTransfer.setData('text/plain',flowchartUi.panelType);
  }
}
function handleFlowchartPanelDragEnd(){
  flowchartUi.panelType=null;
}
function handleFlowchartCanvasDragOver(event){
  event.preventDefault();
  if(event.dataTransfer)event.dataTransfer.dropEffect='copy';
}
function handleFlowchartCanvasDrop(event){
  event.preventDefault();
  const type=flowchartUi.panelType||(event.dataTransfer&&event.dataTransfer.getData('text/plain'));
  if(!type)return;
  flowchartUi.dropping=true;
  commitFlowchartNodeEditor();
  commitFlowchartConnEditor();
  const pos=flowchartSvgPoint(event);
  addFlowchartNode(type,pos.x,pos.y);
  flowchartUi.panelType=null;
}
function initSystemFlowchart(){
  if(flowchartUi.initialized)return getFlowchartRefs();
  const refs={
    canvasWrap:document.getElementById('flowbuilder-canvas-wrap'),
    svg:document.getElementById('flowbuilder-canvas'),
    connLayer:document.getElementById('flowbuilder-conn-layer'),
    nodeLayer:document.getElementById('flowbuilder-node-layer'),
    tempConn:document.getElementById('flowbuilder-temp-conn'),
    foWrap:document.getElementById('flowbuilder-fo-wrap'),
    foTa:document.getElementById('flowbuilder-fo-ta'),
    connFo:document.getElementById('flowbuilder-conn-fo'),
    connTa:document.getElementById('flowbuilder-conn-ta'),
  };
  if(Object.values(refs).some(ref=>!ref))return null;
  flowchartUi.refs=refs;
  refs.canvasWrap.tabIndex=0;
  refs.foTa.addEventListener('input',handleFlowchartNodeEditorInput);
  refs.foTa.addEventListener('keydown',handleFlowchartNodeEditorKeydown);
  refs.connTa.addEventListener('input',handleFlowchartConnEditorInput);
  refs.connTa.addEventListener('keydown',handleFlowchartConnEditorKeydown);
  refs.canvasWrap.addEventListener('keydown',handleFlowchartDeleteKey,true);
  refs.canvasWrap.addEventListener('click',handleFlowchartCanvasClick);
  refs.canvasWrap.addEventListener('dragover',handleFlowchartCanvasDragOver);
  refs.canvasWrap.addEventListener('drop',handleFlowchartCanvasDrop);
  document.addEventListener('pointerdown',handleFlowchartDocumentPointerDown);
  window.addEventListener('mousemove',handleFlowchartMouseMove);
  window.addEventListener('mouseup',handleFlowchartMouseUp);
  document.querySelectorAll('.flowbuilder-shape-item').forEach(item=>{
    item.addEventListener('dragstart',handleFlowchartPanelDragStart);
    item.addEventListener('dragend',handleFlowchartPanelDragEnd);
    item.addEventListener('click',()=>{commitFlowchartNodeEditor();commitFlowchartConnEditor();addFlowchartNode(item.dataset.type);});
  });
  flowchartUi.initialized=true;
  return refs;
}
function renderSystemFlowchart(){
  if(!initSystemFlowchart())return;
  ensureFlowchartState();
  renderFlowchartConns();
  renderFlowchartNodes();
}

// ════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════
function nav(p){
  syncNavigationBridge(p);
  document.querySelectorAll('.ni').forEach(e=>e.classList.remove('active'));
  document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));
  const ni=document.querySelector(`.ni[data-page="${p}"]`);
  if(ni)ni.classList.add('active');
  const pg=document.getElementById(`page-${p}`);
  if(pg){pg.classList.add('active');pg.scrollTop=0;}
  if(p==='home')renderHome();
  if(p==='tickets')renderActive();
  if(p==='trash')renderTrashPage();
  if(p==='team')renderTeamPage();
  const featureRow=getFeatureRowByKey(p);
  if(featureRow){
    const fk=getFeatureKeyFromRow(featureRow);
    renderStatCards(`${fk}-stat-cards`,featureRow.module_key);
    renderModuleTicketList(`${fk}-ticket-list`,featureRow.module_key);
    // restore Linked Tickets tab as default on each navigation
    const allTabs=document.querySelectorAll(`#page-${p} .feat-tab`);
    const allPanels=document.querySelectorAll(`#page-${p} .feat-tab-panel`);
    allTabs.forEach((t,i)=>{t.classList.toggle('active',i===0);});
    allPanels.forEach((t,i)=>{t.classList.toggle('active',i===0);});
  }
}
document.addEventListener('click',e=>{
  if(!e.target.closest('.feat-meta-icon-wrap'))closeFeaturePageIconPickers();
  if(!e.target.closest('#feature-nav .ni-feat'))closeFeatureMenus();
});
document.addEventListener('keydown',e=>{
  handleFlowchartDeleteKey(e);
},{capture:true});

// ════════════════════════════════════════════
// VIEW SWITCH
// ════════════════════════════════════════════
function switchView(v){
  syncTicketViewBridge(v);
  document.querySelectorAll('.vtab').forEach(t=>t.classList.toggle('active',t.dataset.view===v));
  document.querySelectorAll('.tkv').forEach(t=>t.classList.toggle('active',t.id===`view-${v}`));
  if(v==='table')renderTable();
  if(v==='kanban')renderKanban();
  if(v==='gantt')renderGantt();
}
function renderActive(){
  syncFeatureBridge();
  renderHome();
  const v=window.__jiqsysTicketView||document.querySelector('.vtab.active')?.dataset.view||'table';
  switchView(v);
}

// ════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════
const getSt=id=>statuses.find(s=>s.id===id)||{name:'Unknown',color:'#aaa'};
function pill(sid){const s=getSt(sid);return `<span class="spl" style="background:${s.color}1a;color:${s.color};border-color:${s.color}40"><span class="sdot" style="background:${s.color}"></span>${s.name}</span>`;}
function priBdg(p){const m=PRI[p]||PRI.Normal;return `<span class="pri" style="background:${m.bg};color:${m.c}">${p}</span>`;}
function fmtD(d){if(!d)return'—';return new Date(d+'T00:00:00').toLocaleDateString('en-MY',{day:'numeric',month:'short'});}
function modTag(m){
  const row=moduleRows.find(x=>x.module_key===m);
  const icon=row?getFeatureIcon(row):(FEATURE_ICON_SET[FEATURE_ICON_MAP[m]||DEFAULT_FEATURE_ICON_KEY]||DEFAULT_FEATURE_ICON);
  const label=row?.name||m;
  return `<span class="mtag">${icon?`<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>`:''}${escHtml(label)}</span>`;
}
function getPriorityRank(p){return ({'To Do ASAP':0,Critical:1,High:2,Normal:3,Low:4})[p]??99;}
function compareTicketImportance(a,b){
  const pr=getPriorityRank(a.priority)-getPriorityRank(b.priority);
  if(pr!==0)return pr;
  const statusOrder={blocked:0,in_progress:1,todo:2,in_review:3,backlog:4,done:5};
  const sr=(statusOrder[getStatusCodeById(a.statusId)]??99)-(statusOrder[getStatusCodeById(b.statusId)]??99);
  if(sr!==0)return sr;
  const ad=a.due?new Date(a.due+'T00:00:00').getTime():Number.POSITIVE_INFINITY;
  const bd=b.due?new Date(b.due+'T00:00:00').getTime():Number.POSITIVE_INFINITY;
  if(ad!==bd)return ad-bd;
  return String(a.id).localeCompare(String(b.id));
}
function getMostImportantTicket(){
  return tickets
    .filter(t=>getStatusCodeById(t.statusId)!=='done')
    .sort(compareTicketImportance)[0]||null;
}
function buildHomeSnapshot(){
  const top=getMostImportantTicket();
  const total=tickets.length;
  return {
    top:top?{
      id:top.id,
      title:top.title,
      desc:top.desc||'',
      due:fmtD(top.due),
      priorityHtml:priBdg(top.priority),
      statusHtml:pill(top.statusId),
      modulesHtml:top.modules.length?top.modules.slice(0,3).map(modTag).join(''):'<span class="mtag">No module linked</span>',
    }:null,
    chart:statuses.map(s=>{
      const count=tickets.filter(t=>t.statusId===s.id).length;
      const width=total?Math.max((count/total)*100,count>0?6:0):0;
      return {id:s.id,name:s.name,color:s.color,count,width};
    }),
    totalTickets:total,
    note:{
      blocks:getHomeQuickNoteBlocks().map(block=>({...block})),
      count:getHomeQuickNoteCharCount(),
    }
  };
}
function syncHomeBridge(){
  const payload=buildHomeSnapshot();
  window.__jiqsysHome=payload;
  window.dispatchEvent(new CustomEvent('jiqsys:home-change',{detail:payload}));
}
function getHomeNoteEditableText(el){
  return String(el?.textContent||'').replace(/\u00a0/g,' ').replace(/\r?\n+/g,' ').trim();
}
function updateHomeQuickNoteCount(){
  const count=document.getElementById('home-note-count');
  if(count)count.textContent=`${getHomeQuickNoteCharCount()}/180`;
  syncHomeBridge();
}
function focusHomeNoteBlock(id,toStart=false){
  requestAnimationFrame(()=>{
    const el=document.querySelector(`[data-home-note-edit="${id}"]`);
    if(!el)return;
    el.focus();
    const range=document.createRange();
    range.selectNodeContents(el);
    range.collapse(!!toStart);
    const sel=window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
}
function renderHomeQuickNote(){
  const editor=document.getElementById('home-note-editor');
  if(!editor)return;
  if(editor.dataset.reactManaged==='true'){
    updateHomeQuickNoteCount();
    return;
  }
  const blocks=getHomeQuickNoteBlocks();
  editor.innerHTML=blocks.map((block,index)=>block.type==='check'
    ? `<div class="home-note-check-row${block.checked?' checked':''}" id="home-note-row-${block.id}">
        <button class="home-note-check-toggle" type="button" contenteditable="false" onclick="toggleHomeQuickNoteCheck('${block.id}')" aria-label="Toggle checklist item">
          <svg viewBox="0 0 12 12"><polyline points="2 6.5 4.6 9 10 3.5"/></svg>
        </button>
        <div class="home-note-check-text" contenteditable="true" spellcheck="false" data-home-note-edit="${block.id}" data-placeholder="Checklist item" oninput="handleHomeQuickNoteBlockInput('${block.id}',this)" onkeydown="handleHomeQuickNoteBlockKey(event,'${block.id}')">${escHtml(block.text)}</div>
      </div>`
    : `<div class="home-note-line" contenteditable="true" spellcheck="false" data-home-note-edit="${block.id}" data-placeholder="${index===0?'Write a short note for today, a reminder, or a quick focus point...':'Add another note...'}" oninput="handleHomeQuickNoteBlockInput('${block.id}',this)" onkeydown="handleHomeQuickNoteBlockKey(event,'${block.id}')">${escHtml(block.text)}</div>`
  ).join('');
  updateHomeQuickNoteCount();
}
function handleHomeQuickNoteBlockInput(id,el){
  const block=getHomeQuickNoteBlock(id);
  if(!block)return;
  block.text=getHomeNoteEditableText(el);
  homeQuickNote=trimHomeQuickNote(homeQuickNote);
  const nextBlock=getHomeQuickNoteBlock(id);
  const nextText=String(nextBlock?.text||'');
  if(getHomeNoteEditableText(el)!==nextText){
    el.textContent=nextText;
    focusHomeNoteBlock(id);
  }
  updateHomeQuickNoteCount();
  queueHomeNoteSave();
}
function toggleHomeQuickNoteCheck(id){
  const block=getHomeQuickNoteBlock(id);
  if(!block||block.type!=='check')return;
  block.checked=!block.checked;
  document.getElementById(`home-note-row-${id}`)?.classList.toggle('checked',block.checked);
  syncHomeBridge();
  queueHomeNoteSave();
}
function handleHomeQuickNoteBlockKey(event,id){
  const blocks=getHomeQuickNoteBlocks();
  const blockIndex=blocks.findIndex(block=>block.id===id);
  if(blockIndex<0)return;
  const block=blocks[blockIndex];
  const currentText=getHomeNoteEditableText(event.currentTarget);
  if(event.key===' '&&block.type==='text'&&currentText==='[]'){
    event.preventDefault();
    block.type='check';
    block.text='';
    block.checked=false;
    renderHomeQuickNote();
    focusHomeNoteBlock(id,true);
    queueHomeNoteSave();
    return;
  }
  if(event.key==='Enter'){
    event.preventDefault();
    const nextBlock=createHomeNoteBlock(block.type==='check'?'check':'text');
    blocks.splice(blockIndex+1,0,nextBlock);
    homeQuickNote=trimHomeQuickNote(homeQuickNote);
    renderHomeQuickNote();
    focusHomeNoteBlock(nextBlock.id,true);
    queueHomeNoteSave();
    return;
  }
  if(event.key==='Backspace'&&!currentText){
    if(block.type==='check'){
      event.preventDefault();
      if(blocks.length===1){
        block.type='text';
        block.checked=false;
        renderHomeQuickNote();
        focusHomeNoteBlock(id,true);
      }else{
        const prevId=blocks[Math.max(0,blockIndex-1)]?.id||blocks[0]?.id;
        blocks.splice(blockIndex,1);
        homeQuickNote=trimHomeQuickNote(homeQuickNote);
        renderHomeQuickNote();
        focusHomeNoteBlock(prevId);
      }
      queueHomeNoteSave();
    }else if(blocks.length>1){
      event.preventDefault();
      const prevId=blocks[Math.max(0,blockIndex-1)]?.id||blocks[0]?.id;
      blocks.splice(blockIndex,1);
      homeQuickNote=trimHomeQuickNote(homeQuickNote);
      renderHomeQuickNote();
      focusHomeNoteBlock(prevId);
      queueHomeNoteSave();
    }
  }
}
function setHomeQuickNoteBlockText(id,text=''){
  const block=getHomeQuickNoteBlock(id);
  if(!block)return;
  block.text=String(text||'');
  homeQuickNote=trimHomeQuickNote(homeQuickNote);
  syncHomeBridge();
  queueHomeNoteSave();
}
function convertHomeQuickNoteBlockToCheck(id){
  const block=getHomeQuickNoteBlock(id);
  if(!block)return;
  block.type='check';
  block.text='';
  block.checked=false;
  homeQuickNote=trimHomeQuickNote(homeQuickNote);
  syncHomeBridge();
  queueHomeNoteSave();
}
function insertHomeQuickNoteBlockAfter(id,type='text'){
  const blocks=getHomeQuickNoteBlocks();
  const blockIndex=blocks.findIndex(block=>block.id===id);
  if(blockIndex<0)return null;
  const nextBlock=createHomeNoteBlock(type==='check'?'check':'text');
  blocks.splice(blockIndex+1,0,nextBlock);
  homeQuickNote=trimHomeQuickNote(homeQuickNote);
  syncHomeBridge();
  queueHomeNoteSave();
  return nextBlock.id;
}
function removeHomeQuickNoteBlock(id){
  const blocks=getHomeQuickNoteBlocks();
  const blockIndex=blocks.findIndex(block=>block.id===id);
  if(blockIndex<0)return null;
  const block=blocks[blockIndex];
  if(block.type==='check'&&blocks.length===1){
    block.type='text';
    block.checked=false;
    syncHomeBridge();
    queueHomeNoteSave();
    return id;
  }
  if(blocks.length===1)return id;
  const prevId=blocks[Math.max(0,blockIndex-1)]?.id||blocks[0]?.id||id;
  blocks.splice(blockIndex,1);
  homeQuickNote=trimHomeQuickNote(homeQuickNote);
  syncHomeBridge();
  queueHomeNoteSave();
  return prevId;
}
function renderHome(){
  const focus=document.getElementById('home-focus-card');
  const chart=document.getElementById('home-status-chart');
  if(!focus||!chart)return;
  syncHomeBridge();
  renderHomeQuickNote();
  const top=getMostImportantTicket();
  if(focus.dataset.reactManaged==='true'&&chart.dataset.reactManaged==='true')return;
  if(!top){
    focus.innerHTML=`
      <div class="home-focus-label">Top Priority Right Now</div>
      <div class="home-focus-title">No active tickets yet</div>
      <div class="home-focus-desc">Create your first ticket to surface the most important task here and start tracking workload by status.</div>
      <div style="margin-top:18px">
        <button class="btn btn-s btn-sm" onclick="openNt(null)">New Ticket</button>
      </div>`;
  } else {
    const modules=top.modules.length?top.modules.slice(0,3).map(modTag).join(''):`<span class="mtag">No module linked</span>`;
    focus.innerHTML=`
      <div class="home-focus-label">Top Priority Right Now</div>
      <div class="home-focus-title">${escHtml(top.title)}</div>
      <div class="home-focus-meta">
        ${priBdg(top.priority)}
        ${pill(top.statusId)}
        <span class="bdg bg">Due ${fmtD(top.due)}</span>
        <span class="bdg bg">${escHtml(top.id)}</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">${modules}</div>
      <div class="home-focus-desc">${escHtml(top.desc)||'No description added yet.'}</div>
      <div style="margin-top:18px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-s btn-sm" onclick="nav('tickets')">View Tickets</button>
      </div>`;
  }

  const total=tickets.length;
  chart.innerHTML=statuses.map(s=>{
    const count=tickets.filter(t=>t.statusId===s.id).length;
    const width=total?Math.max((count/total)*100,count>0?6:0):0;
    return `
      <div class="home-chart-row">
        <div class="home-chart-label">${escHtml(s.name)}</div>
        <div class="home-chart-track"><div class="home-chart-fill" style="width:${width}%;background:${s.color}"></div></div>
        <div class="home-chart-val">${count}</div>
      </div>`;
  }).join('')+`<div style="font-size:12px;color:var(--tm);padding-top:2px">${total} total ticket${total!==1?'s':''}</div>`;
}

// ════════════════════════════════════════════
// STAT CARDS — live ticket counts by status
// ════════════════════════════════════════════
function renderStatCards(containerId, moduleKey){
  const el=document.getElementById(containerId);
  if(!el)return;
  syncFeatureBridge();
  if(el.dataset.reactManaged==='true')return;

  const linked=tickets.filter(t=>t.modules.includes(moduleKey));
  const total=linked.length;
  const counts={};
  linked.forEach(t=>{
    counts[t.statusId]=(counts[t.statusId]||0)+1;
  });
  const activeStatuses=statuses
    .filter(s=>counts[s.id]>0)
    .map(s=>({id:s.id,name:s.name,color:s.color,count:counts[s.id]}))
    .sort((a,b)=>b.count-a.count);

  const summaryCol=`
    <div class="feat-top-summary-col">
      <div class="feat-top-summary-row"><span class="feat-top-summary-label">Linked tickets</span><strong>${total}</strong></div>
      <div class="feat-top-summary-row"><span class="feat-top-summary-label">Active statuses</span><strong>${activeStatuses.length}</strong></div>
    </div>`;

  if(!activeStatuses.length){
    el.innerHTML=summaryCol+`
      <div class="feat-top-status-col">
        <div class="feat-top-summary-row feat-top-summary-muted">
          <span class="feat-top-summary-dot"></span>
          <span class="feat-top-summary-label">No linked ticket activity yet</span>
        </div>
      </div>`;
    return;
  }

  const visibleStatuses=activeStatuses.slice(0,3).map(s=>`
    <div class="feat-top-summary-row">
      <span class="feat-top-summary-dot" style="background:${s.color}"></span>
      <span class="feat-top-summary-label">${escHtml(s.name)}</span>
      <strong>${s.count}</strong>
    </div>`).join('');

  const overflow=activeStatuses.length>3
    ? `<div class="feat-top-summary-row feat-top-summary-muted"><span class="feat-top-summary-label">+${activeStatuses.length-3} more statuses</span></div>`
    : '';

  el.innerHTML=summaryCol+`<div class="feat-top-status-col">${visibleStatuses}${overflow}</div>`;
}

// ════════════════════════════════════════════
// MODULE TICKET LIST — view-only linked tickets
// ════════════════════════════════════════════
function renderModuleTicketList(containerId, moduleKey){
  const el=document.getElementById(containerId);
  if(!el)return;
  syncFeatureBridge();
  if(el.dataset.reactManaged==='true')return;

  const linked=tickets.filter(t=>t.modules.includes(moduleKey));

  if(linked.length===0){
    el.innerHTML=`
      <div class="feat-panel-shell">
        <div class="feat-panel-head">
          <span class="mtl-title">Linked Tickets</span>
          <span class="mtl-count">0 tickets</span>
        </div>
        <div class="feat-panel-scroll">
          <div class="mtl-empty">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block;margin:0 auto 10px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            No tickets linked to this module
          </div>
        </div>
      </div>`;
    return;
  }

  const rows=linked.map(t=>{
    const s=getSt(t.statusId);
    const pri=t.priority;
    const priMeta={'To Do ASAP':'#b4235d',Critical:'#b03a2e',High:'#8a6800',Normal:'#6f6e69',Low:'#2a56a8'};
    const priColor=priMeta[pri]||'var(--tm)';
    const frefs=t.frefs&&t.frefs.length
      ? t.frefs.map(r=>`<span class="mtl-id">${r}</span>`).join('')
      : '';
    return `
      <div class="mtl-row">
        <div class="mtl-dot" style="background:${s.color}"></div>
        <div class="mtl-main">
          <div class="mtl-name">${t.title}</div>
          <div class="mtl-meta">
            <span style="color:var(--tm)">${t.assignee}</span>
            ${t.due?`<span style="color:var(--bdr)">·</span><span style="color:var(--tm)">Due ${fmtD(t.due)}</span>`:''}
            ${frefs?`<span style="color:var(--bdr)">·</span>${frefs}`:''}
          </div>
        </div>
        <div class="mtl-right">
          <span style="font-size:11.5px;font-weight:500;color:${priColor}">${pri}</span>
          ${pill(t.statusId)}
          <span class="mtl-id">${t.id}</span>
        </div>
      </div>`;
  }).join('');

  el.innerHTML=`
    <div class="feat-panel-shell">
      <div class="feat-panel-head">
        <span class="mtl-title">Linked Tickets</span>
        <span class="mtl-count">${linked.length} ticket${linked.length!==1?'s':''}</span>
      </div>
      <div class="feat-panel-scroll">${rows}</div>
    </div>`;
}

// ════════════════════════════════════════════
// TOAST
// ════════════════════════════════════════════
let _toastId=0;
function toast(msg,{icon='trash',undoFn=null,duration=4000}={}){
  const stack=document.getElementById('toast-stack');if(!stack)return;
  const id=++_toastId;
  const icons={
    trash:'<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>',
    restore:'<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>',
    check:'<polyline points="20 6 9 17 4 12"/>',
  };
  const el=document.createElement('div');
  el.className='toast';el.dataset.id=id;
  el.innerHTML=`<svg viewBox="0 0 24 24">${icons[icon]||icons.check}</svg><span>${msg}</span>`
    +(undoFn?`<button class="toast-undo" onclick="_toastUndo(${id})">Undo</button>`:'');
  stack.appendChild(el);

  let timer=setTimeout(()=>dismissToast(id),duration);
  el._timer=timer;
  if(undoFn) el._undoFn=undoFn;
}

function _toastUndo(id){
  const el=document.querySelector(`#toast-stack [data-id="${id}"]`);
  if(!el)return;
  if(el._undoFn)el._undoFn();
  dismissToast(id);
}

function dismissToast(id){
  const el=document.querySelector(`#toast-stack [data-id="${id}"]`);
  if(!el)return;
  clearTimeout(el._timer);
  el.classList.add('out');
  setTimeout(()=>el.remove(),220);
}

// ════════════════════════════════════════════
// FILTER + SORT STATE
// ════════════════════════════════════════════
const fltState={status:'',priority:'',assignee:'',q:''};
let srtCol='id', srtDir='asc';
const PRI_ORDER={'To Do ASAP':0,Critical:1,High:2,Normal:3,Low:4};

function syncTicketControlsBridge(){
  const payload={
    filters:{
      status:fltState.status||'',
      priority:fltState.priority||'',
      assignee:fltState.assignee||'',
      q:fltState.q||'',
    },
    sort:{
      col:srtCol,
      dir:srtDir,
    },
    statuses:statuses.map(s=>({id:s.id,name:s.name,color:s.color})),
    assignees:team.map(m=>({id:m.id,name:m.name})),
    tags:[
      ...(fltState.status?[{key:'status',label:`Status: ${getSt(fltState.status).name}`}]:[]),
      ...(fltState.priority?[{key:'priority',label:`Priority: ${fltState.priority}`}]:[]),
      ...(fltState.assignee?[{key:'assignee',label:`Assignee: ${getMemberNameById(fltState.assignee)}`}]:[]),
      ...(fltState.q?[{key:'q',label:`Search: "${fltState.q}"`}]:[]),
    ],
  };
  payload.anyActive=payload.tags.length>0;
  window.__jiqsysTicketControls=payload;
  window.dispatchEvent(new CustomEvent('jiqsys:ticket-controls-change',{detail:payload}));
}

function getFilteredSorted(){
  const q=(fltState.q||'').toLowerCase();
  let list=tickets.filter(t=>{
    if(fltState.status&&t.statusId!==fltState.status)return false;
    if(fltState.priority&&t.priority!==fltState.priority)return false;
    if(fltState.assignee&&t.assigneeId!==fltState.assignee)return false;
    const assignee=t.assignee.toLowerCase();
    if(q&&!t.title.toLowerCase().includes(q)&&!assignee.includes(q)&&!t.id.toLowerCase().includes(q))return false;
    return true;
  });
  list.sort((a,b)=>{
    let va,vb;
    if(srtCol==='id'){va=a.id;vb=b.id;}
    else if(srtCol==='title'){va=a.title.toLowerCase();vb=b.title.toLowerCase();}
    else if(srtCol==='status'){va=getSt(a.statusId).name;vb=getSt(b.statusId).name;}
    else if(srtCol==='priority'){va=PRI_ORDER[a.priority]??99;vb=PRI_ORDER[b.priority]??99;}
    else if(srtCol==='assignee'){va=a.assignee.toLowerCase();vb=b.assignee.toLowerCase();}
    else if(srtCol==='due'){va=a.due||'9999';vb=b.due||'9999';}
    if(va<vb)return srtDir==='asc'?-1:1;
    if(va>vb)return srtDir==='asc'?1:-1;
    return 0;
  });
  return list;
}

function syncTicketFilterDom(){
  const statusEl=document.getElementById('flt-status');
  if(statusEl){
    statusEl.value=fltState.status||'';
    statusEl.classList.toggle('active-flt',!!fltState.status);
  }
  const priorityEl=document.getElementById('flt-priority');
  if(priorityEl){
    priorityEl.value=fltState.priority||'';
    priorityEl.classList.toggle('active-flt',!!fltState.priority);
  }
  const assigneeEl=document.getElementById('flt-assignee');
  if(assigneeEl){
    assigneeEl.value=fltState.assignee||'';
    assigneeEl.classList.toggle('active-flt',!!fltState.assignee);
  }
  const queryEl=document.getElementById('tv-q');
  if(queryEl&&queryEl.value!==fltState.q)queryEl.value=fltState.q||'';
  const sortEl=document.getElementById('srt-col');
  if(sortEl)sortEl.value=srtCol;
  const icon=document.getElementById('srt-icon');
  if(icon){
    icon.innerHTML=srtDir==='asc'
      ?'<line x1="12" y1="5" x2="12" y2="19"/><polyline points="5 12 12 5 19 12"/>'
      :'<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>';
  }
  const btn=document.getElementById('srt-dir');
  if(btn)btn.title=srtDir==='asc'?'Ascending':'Descending';
  const clrBtn=document.getElementById('flt-clr-btn');
  if(clrBtn)clrBtn.style.display=Object.values(fltState).some(Boolean)?'inline-flex':'none';
}

function applyFilters(nextState=null){
  if(nextState&&typeof nextState==='object'){
    if('status' in nextState)fltState.status=nextState.status||'';
    if('priority' in nextState)fltState.priority=nextState.priority||'';
    if('assignee' in nextState)fltState.assignee=nextState.assignee||'';
    if('q' in nextState)fltState.q=nextState.q||'';
  }else{
    fltState.status=document.getElementById('flt-status')?.value||'';
    fltState.priority=document.getElementById('flt-priority')?.value||'';
    fltState.assignee=document.getElementById('flt-assignee')?.value||'';
    fltState.q=document.getElementById('tv-q')?.value||'';
  }
  // mark active selects
  ['flt-status','flt-priority','flt-assignee'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.classList.toggle('active-flt',!!el.value);
  });
  // show/hide clear button
  const anyActive=Object.values(fltState).some(Boolean);
  const clrBtn=document.getElementById('flt-clr-btn');
  if(clrBtn)clrBtn.style.display=anyActive?'inline-flex':'none';
  syncTicketFilterDom();
  syncTicketControlsBridge();
  // render active filter tags
  renderFltTags();
  renderTable();
}

function renderFltTags(){
  const row=document.getElementById('flt-tags-row');if(!row)return;
  syncTicketControlsBridge();
  if(row.dataset.reactManaged==='true')return;
  const tags=[];
  if(fltState.status){const s=getSt(fltState.status);tags.push({key:'status',label:`Status: ${s.name}`});}
  if(fltState.priority)tags.push({key:'priority',label:`Priority: ${fltState.priority}`});
  if(fltState.assignee)tags.push({key:'assignee',label:`Assignee: ${getMemberNameById(fltState.assignee)}`});
  const q=fltState.q||'';
  if(q)tags.push({key:'q',label:`Search: "${q}"`});
  if(tags.length){
    row.style.display='flex';
    row.innerHTML=tags.map(t=>`<div class="flt-tag">${t.label}<button class="flt-tag-rm" onclick="clearOneFilter('${t.key}')">×</button></div>`).join('');
  } else {
    row.style.display='none';row.innerHTML='';
  }
}

function clearOneFilter(key){
  fltState[key]='';
  applyFilters();
}

function clearFilters(){
  Object.keys(fltState).forEach(k=>fltState[k]='');
  applyFilters(fltState);
}

function setTicketSearch(value=''){
  applyFilters({q:value});
}

function setTicketFilter(key,value=''){
  if(!['status','priority','assignee'].includes(key))return;
  applyFilters({[key]:value});
}

function setTicketSortCol(value='id'){
  srtCol=value||'id';
  syncTicketFilterDom();
  syncTicketControlsBridge();
  renderTable();
}

function toggleSortDir(){
  srtDir=srtDir==='asc'?'desc':'asc';
  syncTicketFilterDom();
  syncTicketControlsBridge();
  applyFilters();
}

// ════════════════════════════════════════════
// SELECTION STATE
// ════════════════════════════════════════════
let selected=new Set();
let activeTicketView='table';

function syncTicketViewBridge(view=activeTicketView){
  activeTicketView=view||'table';
  window.__jiqsysTicketView=activeTicketView;
  window.dispatchEvent(new CustomEvent('jiqsys:ticket-view-change',{detail:activeTicketView}));
}

function syncKanbanBridge(){
  const filtered=getFilteredSorted();
  const payload=statuses.map(s=>({
    id:s.id,
    name:s.name,
    color:s.color,
    cards:filtered.filter(t=>t.statusId===s.id).map(t=>({
      id:t.id,
      title:t.title,
      assignee:t.assignee,
      priorityHtml:priBdg(t.priority),
      modulesHtml:t.modules.map(modTag).join(''),
      refsHtml:t.frefs.map(r=>`<span class="mono" style="font-size:10px">${r}</span>`).join(''),
      dueText:t.due?`Due ${fmtD(t.due)}`:'',
    })),
  }));
  window.__jiqsysKanban=payload;
  window.dispatchEvent(new CustomEvent('jiqsys:kanban-change',{detail:payload}));
}

function syncTicketTableBridge(){
  const list=getFilteredSorted();
  const tags=[];
  if(fltState.status){const s=getSt(fltState.status);tags.push({key:'status',label:`Status: ${s.name}`});}
  if(fltState.priority)tags.push({key:'priority',label:`Priority: ${fltState.priority}`});
  if(fltState.assignee)tags.push({key:'assignee',label:`Assignee: ${getMemberNameById(fltState.assignee)}`});
  if(fltState.q)tags.push({key:'q',label:`Search: "${fltState.q}"`});
  const payload={
    count:list.length,
    selectedIds:[...selected],
    allVisibleSelected:list.length>0&&list.every(t=>selected.has(t.id)),
    partiallySelected:selected.size>0&&!(list.length>0&&list.every(t=>selected.has(t.id))),
    tags,
    rows:list.map(t=>({
      id:t.id,
      title:t.title,
      assignee:t.assignee,
      dueText:fmtD(t.due),
      statusHtml:pill(t.statusId),
      priorityHtml:priBdg(t.priority),
      linkedHtml:`${t.modules.map(modTag).join('')}${t.frefs.map(r=>`<span class="mono" style="font-size:10.5px;margin-left:2px">${r}</span>`).join('')}`,
      selected:selected.has(t.id),
    })),
  };
  window.__jiqsysTicketTable=payload;
  window.dispatchEvent(new CustomEvent('jiqsys:ticket-table-change',{detail:payload}));
}

function updateBulkBar(){
  const bar=document.getElementById('bulk-bar');
  const cnt=document.getElementById('bulk-cnt');
  const chkAll=document.getElementById('chk-all');
  if(!bar)return;
  syncTicketTableBridge();
  if(bar.dataset.reactManaged==='true')return;
  if(selected.size>0){
    bar.style.display='flex';
    cnt.textContent=`${selected.size} ticket${selected.size>1?'s':''} selected`;
  } else {
    bar.style.display='none';
  }
  // update header checkbox state
  const list=getFilteredSorted();
  if(chkAll){
    chkAll.checked=list.length>0&&list.every(t=>selected.has(t.id));
    chkAll.indeterminate=selected.size>0&&!chkAll.checked;
  }
}

function toggleSelectAll(el){
  const list=getFilteredSorted();
  if(el.checked){list.forEach(t=>selected.add(t.id));}
  else{list.forEach(t=>selected.delete(t.id));}
  updateBulkBar();
  syncTicketTableBridge();
  // re-render rows to sync checkboxes
  renderTableRows(list);
}

function toggleRow(tid,el){
  if(el.checked)selected.add(tid);else selected.delete(tid);
  updateBulkBar();
  syncTicketTableBridge();
}

function clearSelection(){
  selected.clear();
  updateBulkBar();
  syncTicketTableBridge();
  renderTable();
}

async function bulkDelete(){
  if(selected.size===0)return;
  const ids=[...selected];
  const n=ids.length;
  await softDelete(ids);
  selected.clear();
  updateBulkBar();
  renderTable();
  toast(`${n} ticket${n>1?'s':''} moved to Trash`,{icon:'trash',undoFn:()=>{
    bulkRestore(ids);
  }});
}

// ════════════════════════════════════════════
// TABLE VIEW
// ════════════════════════════════════════════
function renderTableRows(list){
  const body=document.getElementById('tkt-body');
  if(!body)return;
  syncTicketTableBridge();
  if(body.dataset.reactManaged==='true')return;
  body.innerHTML=list.length
    ? list.map(t=>`
    <tr onclick="openDw('${t.id}')" class="${selected.has(t.id)?'row-sel':''}">
      <td><input type="checkbox" class="tkchk" ${selected.has(t.id)?'checked':''} onclick="event.stopPropagation();toggleRow('${t.id}',this)"/></td>
      <td><div style="font-weight:500;font-size:13px">${t.title}</div></td>
      <td>${pill(t.statusId)}</td>
      <td>${priBdg(t.priority)}</td>
      <td style="font-size:13px;white-space:nowrap">${t.assignee}</td>
      <td>${t.modules.map(modTag).join('')}${t.frefs.map(r=>`<span class="mono" style="font-size:10.5px;margin-left:2px">${r}</span>`).join('')}</td>
      <td style="font-size:12.5px;color:var(--t2);white-space:nowrap">${fmtD(t.due)}</td>
      <td><span class="mono">${t.id}</span></td>
    </tr>`).join('')
    : `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--tm);font-size:13px">No tickets match the current filters.</td></tr>`;
}

function renderTable(){
  const list=getFilteredSorted();
  syncTicketControlsBridge();
  syncTicketTableBridge();
  const cnt=document.getElementById('tv-cnt');
  if(cnt&&!cnt.dataset.reactManaged){
    cnt.textContent=`${list.length} ticket${list.length!==1?'s':''}`;
  }
  renderTableRows(list);
  updateBulkBar();
}

// ════════════════════════════════════════════
// KANBAN — rebuilt with pointer events drag
// ════════════════════════════════════════════
let dragTid=null, dragEl=null, ghostEl=null, dragCol=null;

function renderKanban(){
  const board=document.getElementById('kv-board');
  syncKanbanBridge();
  if(!board)return;
  if(board.dataset.reactManaged==='true')return;
  board.innerHTML='';
  const filtered=getFilteredSorted();
  statuses.forEach(s=>{
    const col=document.createElement('div');
    col.className='kvc';
    col.dataset.sid=s.id;
    const colTs=filtered.filter(t=>t.statusId===s.id);
    col.innerHTML=`
      <div class="kvch">
        <span class="sdot" style="background:${s.color};width:8px;height:8px"></span>
        <span class="kvct">${s.name}</span>
        <span class="kvcc">${colTs.length}</span>
      </div>
      <div class="kvcb" id="kvb-${s.id}">
        ${colTs.map(t=>buildKCard(t)).join('')}
      </div>
      <div class="kvadd" onclick="openNt('${s.id}')">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add ticket
      </div>`;
    board.appendChild(col);
  });
  attachKanbanDrag();
}

function buildKCard(t){
  const s=getSt(t.statusId);
  const mods=t.modules.map(modTag).join('');
  const frefs=t.frefs.map(r=>`<span class="mono" style="font-size:10px">${r}</span>`).join('');
  return `<div class="kcard" data-tid="${t.id}" id="kc-${t.id}">
    <div class="kcard-ttl">${t.title}</div>
    <div class="kcard-meta">
      <span class="kcard-id">${t.id}</span>
      ${priBdg(t.priority)}
      <span style="margin-left:auto;font-size:11.5px;color:var(--tm)">${t.assignee}</span>
    </div>
    ${(t.modules.length||t.frefs.length)?`<div class="kcard-modules">${mods}${frefs}</div>`:''}
    ${t.due?`<div class="kcard-due">Due ${fmtD(t.due)}</div>`:''}
  </div>`;
}

function attachKanbanDrag(){
  const cards=document.querySelectorAll('.kcard');
  cards.forEach(card=>{
    // click to open drawer (only if not dragging)
    card.addEventListener('click',e=>{
      if(!card.classList.contains('dragging')) openDw(card.dataset.tid);
    });
    // pointer-based drag
    card.addEventListener('pointerdown',pdStart);
  });
}

let pdStartX,pdStartY,pdScrollX,pdScrollY,pdMoved;

function pdStart(e){
  if(e.button!==0)return;
  const card=e.currentTarget;
  pdStartX=e.clientX; pdStartY=e.clientY; pdMoved=false;
  dragTid=card.dataset.tid;
  dragEl=card;

  const onMove=ev=>pdMove(ev,card);
  const onUp=ev=>pdEnd(ev,card,onMove,onUp);
  document.addEventListener('pointermove',onMove,{passive:false});
  document.addEventListener('pointerup',onUp);
}

function pdMove(e,card){
  const dx=e.clientX-pdStartX, dy=e.clientY-pdStartY;
  if(!pdMoved&&Math.hypot(dx,dy)<6)return;
  e.preventDefault();
  if(!pdMoved){
    pdMoved=true;
    card.classList.add('dragging');
    // create ghost
    ghostEl=card.cloneNode(true);
    ghostEl.classList.add('kcard-ghost');
    ghostEl.classList.remove('dragging');
    ghostEl.style.cssText=`width:${card.offsetWidth}px;height:${card.offsetHeight}px;pointer-events:none;position:fixed;z-index:9999;opacity:.85;`;
    document.body.appendChild(ghostEl);
  }
  ghostEl.style.left=(e.clientX-card.offsetWidth/2)+'px';
  ghostEl.style.top=(e.clientY-30)+'px';

  // highlight drop zone
  document.querySelectorAll('.kvcb').forEach(b=>b.classList.remove('drop-active'));
  const el=document.elementFromPoint(e.clientX,e.clientY);
  const body=el?.closest('.kvcb');
  if(body)body.classList.add('drop-active');
}

function pdEnd(e,card,onMove,onUp){
  document.removeEventListener('pointermove',onMove);
  document.removeEventListener('pointerup',onUp);
  card.classList.remove('dragging');
  if(ghostEl){ghostEl.remove();ghostEl=null;}
  document.querySelectorAll('.kvcb').forEach(b=>b.classList.remove('drop-active'));

  if(!pdMoved){dragTid=null;return;} // was a click, handled by click listener

  // find drop target
  const el=document.elementFromPoint(e.clientX,e.clientY);
  const targetCol=el?.closest('.kvc');
  if(targetCol&&dragTid){
    const newSid=targetCol.dataset.sid;
    const t=tickets.find(t=>t.id===dragTid);
    if(t&&t.statusId!==newSid){
      const oldSt=getSt(t.statusId).name;
      t.statusId=newSid;
      queueTicketPersist(normalizeTicket(t),0);
      appendActivity(t,'status_changed',`Status changed from "${oldSt}" to "${getSt(newSid).name}".`,{from:oldSt,to:getSt(newSid).name});
      syncFeatureBridge();
      renderKanban();
      renderTable(document.getElementById('tv-q')?.value||'');
    }
  }
  dragTid=null;
}

// ════════════════════════════════════════════
// GANTT VIEW
// ════════════════════════════════════════════
let ganttScale='month';

function buildGanttSnapshot(){
  const filteredTickets=getFilteredSorted();
  const lw=260;

  let rMin=null,rMax=null;
  filteredTickets.forEach(t=>{
    if(t.start){const d=new Date(t.start+'T00:00:00');if(!rMin||d<rMin)rMin=d;}
    if(t.due){const d=new Date(t.due+'T00:00:00');if(!rMax||d>rMax)rMax=d;}
  });
  if(!rMin)rMin=new Date();
  if(!rMax)rMax=new Date(rMin.getTime()+86400000*30);

  const scale=ganttScale;
  let rs,re,cols,cw,subLabel,mainLabel;

  if(scale==='day'){
    rs=new Date(rMin);rs.setDate(rs.getDate()-1);
    re=new Date(rMax);re.setDate(re.getDate()+1);
    cw=40;
    cols=[];let cur=new Date(rs);
    while(cur<=re){cols.push(new Date(cur));cur=new Date(cur.getTime()+86400000);}
    mainLabel=(d)=>d.toLocaleDateString('en-MY',{month:'short',year:'numeric'});
    subLabel=(d)=>d.toLocaleDateString('en-MY',{weekday:'short',day:'numeric'});
  } else if(scale==='week'){
    rs=new Date(rMin);rs.setDate(rs.getDate()-rs.getDay()+1);
    re=new Date(rMax);re.setDate(re.getDate()+(7-re.getDay()));
    cw=20;
    cols=[];let cur=new Date(rs);
    while(cur<=re){cols.push(new Date(cur));cur=new Date(cur.getTime()+7*86400000);}
    mainLabel=(d)=>{
      const end=new Date(d.getTime()+6*86400000);
      return d.toLocaleDateString('en-MY',{month:'short',day:'numeric'})+' – '+end.toLocaleDateString('en-MY',{month:'short',day:'numeric'});
    };
    subLabel=null;
  } else if(scale==='month'){
    rs=new Date(rMin.getFullYear(),rMin.getMonth(),1);
    re=new Date(rMax.getFullYear(),rMax.getMonth()+1,0);
    cw=24;
    cols=[];let cur=new Date(rs);
    while(cur<=re){cols.push(new Date(cur));cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);}
    mainLabel=(d)=>d.toLocaleDateString('en-MY',{month:'long',year:'numeric'});
    subLabel=null;
  } else if(scale==='quarter'){
    const qStart=Math.floor(rMin.getMonth()/3)*3;
    rs=new Date(rMin.getFullYear(),qStart,1);
    const qEnd=Math.floor(rMax.getMonth()/3)*3+2;
    re=new Date(rMax.getFullYear(),qEnd+1,0);
    cw=8;
    cols=[];let cur=new Date(rs);
    while(cur<=re){cols.push(new Date(cur));cur=new Date(cur.getFullYear(),cur.getMonth()+3,1);}
    mainLabel=(d)=>`Q${Math.floor(d.getMonth()/3)+1} ${d.getFullYear()}`;
    subLabel=null;
  } else {
    rs=new Date(rMin.getFullYear(),0,1);
    re=new Date(rMax.getFullYear(),11,31);
    cw=3;
    cols=[];let cur=new Date(rs);
    while(cur<=re){cols.push(new Date(cur));cur=new Date(cur.getFullYear()+1,0,1);}
    mainLabel=(d)=>String(d.getFullYear());
    subLabel=null;
  }

  const totalDays=Math.ceil((re-rs)/86400000)+1;
  const totalW=totalDays*cw;
  const headerH=subLabel?64:36;
  const today=new Date();today.setHours(0,0,0,0);
  const px=(d)=>Math.round((d-rs)/86400000)*cw;

  const headerMain=[];
  const headerSub=[];
  if(subLabel){
    const groups=[];
    cols.forEach(d=>{
      const lbl=mainLabel(d);
      const last=groups[groups.length-1];
      if(last&&last.lbl===lbl)last.end=new Date(d);
      else groups.push({lbl,start:new Date(d),end:new Date(d)});
    });
    groups.forEach(g=>{
      const x=px(g.start),w=px(new Date(g.end.getTime()+86400000))-x;
      headerMain.push({x,w,label:g.lbl});
    });
    cols.forEach(d=>headerSub.push({x:px(d),w:cw,label:subLabel(d)}));
  } else {
    cols.forEach((d,i)=>{
      const next=cols[i+1]||(scale==='year'?new Date(d.getFullYear()+1,0,1):new Date(re.getTime()+86400000));
      headerMain.push({x:px(d),w:Math.round((next-d)/86400000)*cw,label:mainLabel(d)});
    });
  }

  const gridLines=cols.map((d,i)=>{
    const next=cols[i+1]||(scale==='year'?new Date(d.getFullYear()+1,0,1):new Date(re.getTime()+86400000));
    return Math.round((next-rs)/86400000)*cw-1;
  });

  const rows=filteredTickets.map(t=>{
    const s=getSt(t.statusId);
    let bar=null;
    if(t.start&&t.due){
      const ts=new Date(t.start+'T00:00:00'),te=new Date(t.due+'T00:00:00');
      const bl=Math.max(0,px(ts)),br=Math.min(totalW,px(te)+cw);
      const bw=Math.max(br-bl,cw);
      bar={
        left:bl+2,
        width:bw-4,
        background:`${s.color}22`,
        color:s.color,
        borderColor:`${s.color}55`,
        label:cw>=12?t.title:'',
        title:`${t.title}\n${fmtD(t.start)} → ${fmtD(t.due)}`
      };
    }
    return {
      id:t.id,
      title:t.title,
      assignee:t.assignee,
      statusColor:s.color,
      bar
    };
  });

  return {
    scale,
    lw,
    totalW,
    headerH,
    headerMain,
    headerSub,
    gridLines,
    todayOffset:today>=rs&&today<=re?px(today):null,
    rows,
    empty:!filteredTickets.length
  };
}

function syncGanttBridge(){
  const payload=buildGanttSnapshot();
  window.__jiqsysGantt=payload;
  window.dispatchEvent(new CustomEvent('jiqsys:gantt-change',{detail:payload}));
}

function setGanttScale(s){
  ganttScale=s;
  syncGanttBridge();
  document.querySelectorAll('.gscale-btn').forEach(b=>b.classList.toggle('active',b.dataset.scale===s));
  renderGantt();
}

function renderGantt(){
  const wrap=document.getElementById('gv-inner');
  syncGanttBridge();
  if(!wrap)return;
  if(wrap.dataset.reactManaged==='true')return;
  wrap.innerHTML='';
  const filteredTickets=getFilteredSorted();
  const lw=260;

  // ── compute date range from tickets ──
  let rMin=null,rMax=null;
  filteredTickets.forEach(t=>{
    if(t.start){const d=new Date(t.start+'T00:00:00');if(!rMin||d<rMin)rMin=d;}
    if(t.due){const d=new Date(t.due+'T00:00:00');if(!rMax||d>rMax)rMax=d;}
  });
  // fallback if no tickets
  if(!rMin)rMin=new Date();
  if(!rMax)rMax=new Date(rMin.getTime()+86400000*30);

  const scale=ganttScale;

  // ── snap range & build columns ──
  let rs,re,cols,cw,subLabel,mainLabel,vertLines;

  if(scale==='day'){
    // snap to week
    rs=new Date(rMin);rs.setDate(rs.getDate()-1);
    re=new Date(rMax);re.setDate(re.getDate()+1);
    cw=40; // px per day
    // columns = days, grouped under weeks
    cols=[];let cur=new Date(rs);
    while(cur<=re){
      cols.push(new Date(cur));
      cur=new Date(cur.getTime()+86400000);
    }
    mainLabel=(d)=>d.toLocaleDateString('en-MY',{month:'short',year:'numeric'});
    subLabel=(d)=>d.toLocaleDateString('en-MY',{weekday:'short',day:'numeric'});
    vertLines='day';
  } else if(scale==='week'){
    // snap to start of week (Mon)
    rs=new Date(rMin);rs.setDate(rs.getDate()-rs.getDay()+1);
    re=new Date(rMax);re.setDate(re.getDate()+(7-re.getDay()));
    cw=20; // px per day
    cols=[];let cur=new Date(rs);
    while(cur<=re){
      // each col = 1 week
      cols.push(new Date(cur));
      cur=new Date(cur.getTime()+7*86400000);
    }
    mainLabel=(d)=>{
      const end=new Date(d.getTime()+6*86400000);
      return d.toLocaleDateString('en-MY',{month:'short',day:'numeric'})+' – '+end.toLocaleDateString('en-MY',{month:'short',day:'numeric'});
    };
    subLabel=null;
    vertLines='week';
  } else if(scale==='month'){
    rs=new Date(rMin.getFullYear(),rMin.getMonth(),1);
    re=new Date(rMax.getFullYear(),rMax.getMonth()+1,0);
    cw=24; // px per day
    cols=[];let cur=new Date(rs);
    while(cur<=re){
      cols.push(new Date(cur));
      cur=new Date(cur.getFullYear(),cur.getMonth()+1,1);
    }
    mainLabel=(d)=>d.toLocaleDateString('en-MY',{month:'long',year:'numeric'});
    subLabel=null;
    vertLines='month';
  } else if(scale==='quarter'){
    const qStart=Math.floor(rMin.getMonth()/3)*3;
    rs=new Date(rMin.getFullYear(),qStart,1);
    const qEnd=Math.floor(rMax.getMonth()/3)*3+2;
    re=new Date(rMax.getFullYear(),qEnd+1,0);
    cw=8; // px per day
    cols=[];let cur=new Date(rs);
    while(cur<=re){
      cols.push(new Date(cur));
      cur=new Date(cur.getFullYear(),cur.getMonth()+3,1);
    }
    mainLabel=(d)=>{
      const q=Math.floor(d.getMonth()/3)+1;
      return `Q${q} ${d.getFullYear()}`;
    };
    subLabel=null;
    vertLines='quarter';
  } else { // year
    rs=new Date(rMin.getFullYear(),0,1);
    re=new Date(rMax.getFullYear(),11,31);
    cw=3; // px per day
    cols=[];let cur=new Date(rs);
    while(cur<=re){
      cols.push(new Date(cur));
      cur=new Date(cur.getFullYear()+1,0,1);
    }
    mainLabel=(d)=>String(d.getFullYear());
    subLabel=null;
    vertLines='year';
  }

  const totalDays=Math.ceil((re-rs)/86400000)+1;
  const totalW=totalDays*cw;
  const today=new Date();today.setHours(0,0,0,0);

  // helper: px offset for a date
  const px=(d)=>Math.round((d-rs)/86400000)*cw;

  // ── build DOM ──
  const c=document.createElement('div');c.className='gvc';

  // ── header row(s) ──
  const headerH=subLabel?64:36;
  const hr=document.createElement('div');hr.style.cssText='display:flex;border-bottom:1px solid var(--bdr);position:sticky;top:0;z-index:2';
  const lh=document.createElement('div');lh.className='glh';
  lh.style.cssText=`width:${lw}px;min-width:${lw}px;flex-shrink:0;height:${headerH}px;display:flex;align-items:center`;
  lh.textContent='Ticket';
  const rh=document.createElement('div');
  rh.style.cssText=`width:${totalW}px;flex-shrink:0;position:relative;height:${headerH}px;background:var(--bg)`;

  if(subLabel){
    // two-tier: top = grouped label, bottom = sub cols
    // top tier grouping by day cols → group by month for day scale
    const groups=[];
    cols.forEach(d=>{
      const lbl=mainLabel(d);
      const last=groups[groups.length-1];
      if(last&&last.lbl===lbl){last.end=new Date(d);}
      else groups.push({lbl,start:new Date(d),end:new Date(d)});
    });
    groups.forEach(g=>{
      const x=px(g.start),w=px(new Date(g.end.getTime()+86400000))-x;
      const el=document.createElement('div');
      el.style.cssText=`position:absolute;top:0;left:${x}px;width:${w}px;height:32px;display:flex;align-items:center;justify-content:center;border-right:1px solid var(--bdr);font-size:10.5px;font-weight:600;color:var(--t2);letter-spacing:.04em`;
      el.textContent=g.lbl;rh.appendChild(el);
    });
    cols.forEach(d=>{
      const x=px(d),w=cw;
      const el=document.createElement('div');
      el.className='gsub';el.style.cssText=`left:${x}px;width:${w}px;top:32px`;
      el.textContent=subLabel(d);rh.appendChild(el);
    });
  } else {
    cols.forEach((d,i)=>{
      const next=cols[i+1]||(scale==='year'?new Date(d.getFullYear()+1,0,1):new Date(re.getTime()+86400000));
      const x=px(d),w=Math.round((next-d)/86400000)*cw;
      const el=document.createElement('div');el.className='gmon';
      el.style.cssText=`left:${x}px;width:${w}px`;
      el.textContent=mainLabel(d);rh.appendChild(el);
    });
  }
  hr.appendChild(lh);hr.appendChild(rh);c.appendChild(hr);

  // ── ticket rows ──
  filteredTickets.forEach(t=>{
    const row=document.createElement('div');row.style.cssText='display:flex;border-bottom:1px solid var(--bdr)';
    row.style.cursor='pointer';
    row.addEventListener('click',()=>openDw(t.id));
    const s=getSt(t.statusId);
    const lr=document.createElement('div');lr.className='glr';
    lr.style.cssText=`width:${lw}px;min-width:${lw}px;flex-shrink:0`;
    lr.innerHTML=`<span class="sdot" style="background:${s.color};width:7px;height:7px;border-radius:50%;flex-shrink:0"></span><div style="min-width:0"><div style="font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:${lw-44}px">${t.title}</div><div style="font-size:11px;color:var(--tm)">${t.assignee}</div></div>`;
    const rr=document.createElement('div');rr.className='grr';rr.style.cssText=`width:${totalW}px;flex-shrink:0;position:relative`;

    // vertical grid lines
    cols.forEach((d,i)=>{
      const next=cols[i+1]||(scale==='year'?new Date(d.getFullYear()+1,0,1):new Date(re.getTime()+86400000));
      const x=Math.round((next-rs)/86400000)*cw-1;
      const gl=document.createElement('div');gl.className='gdl';gl.style.left=x+'px';rr.appendChild(gl);
    });

    // today line
    if(today>=rs&&today<=re){
      const tl=document.createElement('div');tl.className='gtoday';tl.style.left=px(today)+'px';rr.appendChild(tl);
    }

    // bar
    if(t.start&&t.due){
      const ts=new Date(t.start+'T00:00:00'),te=new Date(t.due+'T00:00:00');
      const bl=Math.max(0,px(ts)),br=Math.min(totalW,px(te)+cw);
      const bw=Math.max(br-bl,cw);
      const bar=document.createElement('div');bar.className='gbar';
      bar.style.cssText=`left:${bl+2}px;width:${bw-4}px;background:${s.color}22;color:${s.color};border-color:${s.color}55`;
      if(cw>=12)bar.textContent=t.title;
      bar.title=`${t.title}\n${fmtD(t.start)} → ${fmtD(t.due)}`;
      rr.appendChild(bar);
    }
    row.appendChild(lr);row.appendChild(rr);c.appendChild(row);
  });

  if(!filteredTickets.length){
    const empty=document.createElement('div');
    empty.style.cssText='padding:48px;text-align:center;color:var(--tm);font-size:13px';
    empty.textContent='No tickets match the current filters.';c.appendChild(empty);
  }

  // legend footer
  const scaleLabel={day:'Day',week:'Week',month:'Month',quarter:'Quarter',year:'Year'};
  const leg=document.createElement('div');
  leg.style.cssText='padding:10px 16px;border-top:1px solid var(--bdr);display:flex;align-items:center;gap:16px;background:var(--bg)';
  leg.innerHTML=`<span style="font-size:11.5px;color:var(--tm)">Scale: ${scaleLabel[scale]}</span><span style="display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--red)"><span style="width:2px;height:12px;background:var(--red);opacity:.6;display:inline-block"></span>Today</span>`;
  c.appendChild(leg);
  wrap.appendChild(c);
}

// ════════════════════════════════════════════
// DRAWER
// ════════════════════════════════════════════
let dwTid=null;

function openDw(tid){
  const t=tickets.find(x=>x.id===tid);if(!t)return;
  dwTid=tid;
  const ss=document.getElementById('dw-status');
  ss.innerHTML=statuses.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('dw-id').textContent=t.id;
  document.getElementById('dw-title').value=t.title;
  ss.value=t.statusId;
  document.getElementById('dw-priority').value=t.priority;
  document.getElementById('dw-assignee').value=t.assigneeId||'';
  document.getElementById('dw-start').value=t.start||'';
  document.getElementById('dw-due').value=t.due||'';
  document.getElementById('dw-desc').value=t.desc||'';
  renderModTags(t);
  renderDwTestCases(t);
  document.getElementById('dw-ovl').classList.add('open');
}

function closeDw(){
  document.getElementById('dw-ovl').classList.remove('open');
  renderActive();
}

function dwField(field,val){
  if(!requireWorkspacePermission('can_edit_tickets','Editing tickets'))return;
  const t=tickets.find(x=>x.id===dwTid);if(!t)return;
  t[field]=val;
  if(field==='assigneeId')t.assignee=getMemberNameById(val);
  queueTicketPersist(normalizeTicket(t));
  renderActive();
}

function renderModTags(t){
  const c=document.getElementById('mod-tags-dyn');if(!c)return;
  c.innerHTML=getFeatureRows().map(row=>`
    <div class="mod-tag${t.modules.includes(row.module_key)?' sel':''}" onclick="toggleMod('${row.module_key.replace(/'/g,"\\'")}',this)">
      <svg viewBox="0 0 24 24">${getFeatureIcon(row)}</svg>${escHtml(row.name)}
    </div>`).join('');
}

async function toggleMod(mod){
  if(!requireWorkspacePermission('can_edit_tickets','Editing tickets'))return;
  const t=tickets.find(x=>x.id===dwTid);if(!t)return;
  const idx=t.modules.indexOf(mod);
  if(idx>-1)t.modules.splice(idx,1);
  else t.modules.push(mod);
  renderModTags(t);
  renderDwTestCases(t);
  renderActive();
  try{
    await syncTicketModules(t);
  }catch(error){
    showDbError(`Saving modules for ${t.id}`,error);
  }
}
function renderDwTestCases(t){
  const c=document.getElementById('dw-testcases');if(!c)return;
  const linked=t.modules
    .map(mk=>({mk,fk:getFeatureKeyByModuleKey(mk)}))
    .filter(({fk})=>fk&&ensureFeatureState(fk).testGroups.length);
  if(!linked.length){
    c.innerHTML=`<div class="dtc-empty">No test groups available — add test cases in a linked feature's Test Cases tab first.</div>`;
    return;
  }
  // check if any groups selected at all
  const anySelected=linked.some(({fk})=>getTkProgress(t.id,fk).selected.length>0);
  if(!anySelected){
    c.innerHTML=`<div class="dtc-empty" style="padding:16px 0">No groups selected yet. Click <strong>＋ Select Groups</strong> to choose which test groups apply to this ticket.</div>`;
    return;
  }
  c.innerHTML=linked.map(({mk,fk})=>{
    const groups=ensureFeatureState(fk).testGroups;
    const p=getTkProgress(t.id,fk);
    if(!p.selected.length)return '';
    const selItems=p.selected.reduce((s,gid)=>{const g=groups.find(x=>x.id===gid);return s+(g?g.items.length:0);},0);
    const doneItems=p.selected.reduce((s,gid)=>{const g=groups.find(x=>x.id===gid);if(!g)return s;return s+g.items.filter(i=>p.checks[gid]&&p.checks[gid][i.id]).length;},0);
    const pctAll=selItems?Math.round(doneItems/selItems*100):0;
    return `<div class="dtc-module open" id="dtcm-${fk}">
      <div class="dtc-mod-hd" onclick="toggleDtcMod('${fk}')">
        <svg class="dtc-mod-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        <span class="dtc-mod-name">${mk}</span>
        <div style="flex:1"></div>
        ${selItems?`<span class="dtc-mod-prog">${doneItems}/${selItems} passed</span>
        <div style="width:48px;height:3px;background:var(--bdr);border-radius:2px;overflow:hidden;margin-left:8px;flex-shrink:0"><div style="height:100%;width:${pctAll}%;background:var(--grn);border-radius:2px;transition:width .2s"></div></div>`:''}
      </div>
      <div class="dtc-mod-body">
        ${p.selected.map(gid=>{
          const g=groups.find(x=>x.id===gid);if(!g)return '';
          const chks=p.checks[gid]||{};
          const done=g.items.filter(i=>chks[i.id]).length;
          const pct=g.items.length?Math.round(done/g.items.length*100):0;
          return `<div class="dtc-group open" id="dtcg-${fk}-${gid}">
            <div class="dtc-group-hd" onclick="toggleDtcGroup('${fk}','${gid}')">
              <svg class="dtc-grp-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              <span class="dtc-group-name">${escHtml(g.name)}</span>
              <div class="dtc-grp-bar"><div class="dtc-grp-fill" id="dwf-${t.id}-${fk}-${gid}" style="width:${pct}%"></div></div>
              <span class="dtc-grp-prog" id="dwl-${t.id}-${fk}-${gid}">${g.items.length?`${done}/${g.items.length}`:''}</span>
            </div>
            <div class="dtc-items">
              ${g.items.length?g.items.map(it=>`
              <div class="dtc-item">
                <div class="dtc-chk${chks[it.id]?' done':''}" id="dwc-${t.id}-${fk}-${gid}-${it.id}" onclick="toggleDwCheck('${t.id}','${fk}','${gid}','${it.id}',${!chks[it.id]})" style="cursor:pointer;flex-shrink:0"></div>
                <span class="dtc-label${chks[it.id]?' done':''}" id="dwlb-${t.id}-${fk}-${gid}-${it.id}">${escHtml(it.label)||'<em style="color:var(--tm)">Untitled</em>'}</span>
              </div>`).join(''):`<div style="font-size:12px;color:var(--tm);padding:6px 0">No items in this group.</div>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).filter(Boolean).join('');
}

function toggleDtcMod(fk){
  const el=document.getElementById(`dtcm-${fk}`);
  if(el)el.classList.toggle('open');
}
function toggleDtcGroup(fk,gid){
  const el=document.getElementById(`dtcg-${fk}-${gid}`);
  if(el)el.classList.toggle('open');
}

async function deleteTicket(){
  if(!requireWorkspacePermission('can_delete_tickets','Deleting tickets'))return;
  if(!dwTid)return;
  const tid=dwTid;
  const t=tickets.find(x=>x.id===tid);
  const label=t?t.title:'Ticket';
  await softDelete([tid]);
  selected.delete(tid);
  updateBulkBar();
  closeDw();
  toast(`"${label.length>32?label.slice(0,32)+'…':label}" moved to Trash`,{icon:'trash',undoFn:()=>{
    restoreTicket(tid);
  }});
}

// ════════════════════════════════════════════
// STATUS MANAGER
// ════════════════════════════════════════════
function openSmgr(){
  if(!requireWorkspacePermission('can_manage_statuses','Managing statuses'))return;
  smDraft=statuses.map(s=>({...s}));smRender();openOvl('sm-ovl');
}
function smRender(){
  const list=document.getElementById('sm-list');
  list.innerHTML=smDraft.map((s,i)=>`
    <div class="sli" draggable="true" data-i="${i}" ondragstart="smDS(event)" ondragover="smDO(event)" ondrop="smDD(event)" ondragleave="this.classList.remove('drag-over')">
      <div class="slhnd"><svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></svg></div>
      <div class="slsw" style="background:${s.color}" id="sw${i}"><input type="color" class="slci" value="${s.color}" oninput="smCC(${i},this.value)"/></div>
      <input class="slnm" value="${s.name}" oninput="smCN(${i},this.value)" placeholder="Status name"/>
      <button class="sldl" onclick="smDel(${i})"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
    </div>`).join('');
}
let smDI=null;
function smDS(e){smDI=parseInt(e.currentTarget.dataset.i);}
function smDO(e){e.preventDefault();e.currentTarget.closest('.sli')?.classList.add('drag-over');}
function smDD(e){
  e.preventDefault();
  document.querySelectorAll('.sli').forEach(el=>el.classList.remove('drag-over'));
  const ti=parseInt(e.currentTarget.closest('.sli')?.dataset.i);
  if(smDI===null||isNaN(ti)||smDI===ti)return;
  const moved=smDraft.splice(smDI,1)[0];smDraft.splice(ti,0,moved);smDI=null;smRender();
}
function smCN(i,v){smDraft[i].name=v;}
function smCC(i,v){smDraft[i].color=v;const sw=document.getElementById(`sw${i}`);if(sw)sw.style.background=v;}
function smDel(i){smDraft.splice(i,1);smRender();}
function smAdd(){
  const pal=['#9b59b6','#e67e22','#1abc9c','#e74c3c','#3498db','#f39c12'];
  smDraft.push({id:`tmp-${Date.now()}`,code:'',name:'New Status',color:pal[smDraft.length%pal.length]});smRender();
}
async function smSave(){
  if(!requireWorkspacePermission('can_manage_statuses','Managing statuses'))return;
  const removed=statuses.filter(s=>!smDraft.some(d=>d.id===s.id));
  const blockedRemoval=removed.find(s=>[...tickets,...trash].some(t=>t.statusId===s.id));
  if(blockedRemoval){
    alert(`Cannot remove "${blockedRemoval.name}" because tickets still use it.`);
    return;
  }
  try{
    for(let i=0;i<smDraft.length;i++){
      const s=smDraft[i];
      const payload={
        code:s.code||slugify(s.name)+(String(s.id).startsWith('tmp-')?`_${String(Date.now()).slice(-4)}`:''),
        name:s.name,
        color:s.color,
        sort_order:i+1,
        is_active:true,
      };
      if(String(s.id).startsWith('tmp-')){
        const {error}=await supabaseClient.from('statuses').insert(payload);
        if(error)throw error;
      }else{
        const {error}=await supabaseClient.from('statuses').update(payload).eq('id',s.id);
        if(error)throw error;
      }
    }
    for(const s of removed){
      const {error}=await supabaseClient.from('statuses').update({is_active:false}).eq('id',s.id);
      if(error)throw error;
    }
    await loadStatuses();
    closeOvl('sm-ovl');
    populateNtStatus();
    populateFltStatus();
    renderActive();
  }catch(error){
    showDbError('Saving statuses',error);
  }
}

// ════════════════════════════════════════════
// NEW TICKET MODAL
// ════════════════════════════════════════════
function populateNtStatus(){
  const sel=document.getElementById('nt-status');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=statuses.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  if(cur)sel.value=cur;
}
function openNt(sid){
  if(!requireWorkspacePermission('can_create_tickets','Creating tickets'))return;
  populateNtStatus();
  if(sid)document.getElementById('nt-status').value=sid;
  document.getElementById('nt-title').value='';
  document.getElementById('nt-desc').value='';
  document.getElementById('nt-start').value=new Date().toISOString().split('T')[0];
  document.getElementById('nt-due').value='';
  document.getElementById('nt-asgn').value='';
  document.getElementById('nt-title').style.borderColor='';
  openOvl('nt-ovl');
}
async function ntCreate(){
  if(!requireWorkspacePermission('can_create_tickets','Creating tickets'))return;
  const title=document.getElementById('nt-title').value.trim();
  if(!title){document.getElementById('nt-title').style.borderColor='var(--red)';return;}
  document.getElementById('nt-title').style.borderColor='';
  const ticketNo=nextTicketNo();
  const ticket=normalizeTicket({
    rowId:'',
    id:ticketNo,
    title,
    desc:document.getElementById('nt-desc').value.trim(),
    statusId:document.getElementById('nt-status').value,
    priority:document.getElementById('nt-pri').value,
    assigneeId:document.getElementById('nt-asgn').value,
    assignee:'',
    start:document.getElementById('nt-start').value,
    due:document.getElementById('nt-due').value,
    deletedAtRaw:null,
    deletedAt:'',
    modules:[],
    frefs:[],
    activity:[],
    testProgress:{},
  });
  try{
    const {data,error}=await supabaseClient
      .from('tickets')
      .insert(buildTicketPayload(ticket))
      .select('id')
      .single();
    if(error)throw error;
    ticket.rowId=data.id;
    tickets.unshift(ticket);
    await appendActivity(ticket,'created','Ticket created.');
    closeOvl('nt-ovl');
    renderActive();
  }catch(error){
    showDbError('Creating ticket',error);
  }
}

// ════════════════════════════════════════════
// OVERLAY HELPERS
// ════════════════════════════════════════════
function openOvl(id){document.getElementById(id).classList.add('open');}
function closeOvl(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.ovl').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
function populateFltStatus(){
  const sel=document.getElementById('flt-status');if(!sel)return;
  const cur=sel.value;
  sel.innerHTML=`<option value="">All Statuses</option>`+statuses.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');
  if(cur)sel.value=cur;
  syncTicketControlsBridge();
}
window.__bootJiqsysLegacyApp=()=>window.__JiqsysLegacyBootPromise||(window.__JiqsysLegacyBootPromise=initApp().then(result=>{
  syncHomeBridge();
  syncNavigationBridge(window.__jiqsysActivePage||'home');
  syncTicketViewBridge(window.__jiqsysTicketView||'table');
  syncKanbanBridge();
  syncGanttBridge();
  syncTicketControlsBridge();
  syncTicketTableBridge();
  syncTrashBridge();
  syncFeatureBridge();
  syncTeamBridge();
  return result;
}));
