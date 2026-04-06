import { readFileSync, writeFileSync } from 'fs';

let src = readFileSync('src/app/aid-agent/page.tsx', 'utf8').replace(/\r\n/g, '\n');

// ── 1. LEFT PANEL ───────────────────────────────────────────────────────────
const LEFT_START = '            <div className="space-y-5">\n\n              {/* \u2500\u2500 Students Quick Actions \u2500\u2500 */}';
const LEFT_END   =
  '            </div>\n          </div>\n\n          {/* Footer */}\n' +
  '          <div className="shrink-0 px-4 py-2.5 border-t border-[#1E2A4A]">\n' +
  '            <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2">\n' +
  '              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />\n' +
  '              <p className="text-[10px] text-amber-300/70 leading-relaxed">General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.</p>\n' +
  '            </div>\n          </div>\n        </aside>\n\n        {/* \u2500\u2500 Main \u2500\u2500 */';

const si = src.indexOf(LEFT_START);
const ei = src.indexOf(LEFT_END, si);
if (si === -1) throw new Error('LEFT START not found');
if (ei === -1) throw new Error('LEFT END not found');

const LEFT_NEW = `            <div className="flex flex-col gap-2.5">

              {/* Section icon grid */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "lc-s-qa",     label: "Students",        img: "/images/sec-students.jpg",        pos: "object-[50%_15%]" },
                  { key: "lc-p-qa",     label: "Parents",          img: "/images/sec-parents.jpg",         pos: "object-[50%_18%]" },
                  { key: "lc-fed-sp",   label: "Federal Aid",      img: "/images/sec-fed-aid.jpg",         pos: "object-[50%_18%]" },
                  { key: "lc-resume",   label: "Resume",            img: "/images/sec-resume.jpg",          pos: "object-[50%_15%]" },
                  { key: "lc-schol",    label: "Scholarships",      img: "/images/sec-scholarship.jpg",     pos: "object-[50%_12%]" },
                  { key: "lc-intern",   label: "Internships",       img: "/images/sec-internship.jpg",      pos: "object-[50%_14%]" },
                  { key: "lc-jobs",     label: "Student Jobs",      img: "/images/sec-jobs.jpg",            pos: "object-[50%_12%]" },
                  { key: "lc-finlit",   label: "Financial Lit",     img: "/images/sec-fin-literacy.jpg",    pos: "object-[50%_22%]" },
                  { key: "lc-loans",    label: "Private Loans",     img: "/images/sec-priv-loans.jpg",      pos: "object-[50%_18%]" },
                  { key: "lc-consumer", label: "Consumer Rights",   img: "/images/sec-consumer.jpg",        pos: "object-[50%_45%]" },
                  { key: "lc-mental",   label: "Mental Health",     img: "/images/sec-mental-health.jpg",   pos: "object-[50%_14%]" },
                  { key: "lc-ai",       label: "AI Literacy",       img: "/images/sec-ai-literacy.jpg",     pos: "object-[50%_14%]" },
                  { key: "lc-faith",    label: "Faith & Spirit",    img: "/images/sec-faith.jpg",           pos: "object-[50%_18%]" },
                  { key: "lc-vol",      label: "Volunteer",         img: "/images/sec-volunteer.jpg",       pos: "object-[50%_16%]" },
                  { key: "lc-va",       label: "VA Resources",      img: "/images/sec-va.jpg",              pos: "object-[50%_18%]" },
                ] as const).map(({ key, label, img, pos }) => (
                  <button
                    key={key}
                    onClick={() => setOverlaySection(key)}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/60 shadow-md shadow-black/40 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
                    style={{ aspectRatio: "1.6 / 1" }}
                  >
                    <img src={img} alt="" className={\`w-full h-full object-cover \${pos}\`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04091A]/95 via-[#04091A]/45 to-transparent group-hover:from-[#04091A]/80 transition-all duration-200" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-[#00D4FF]/40 transition-all duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">{label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Videos (collapsible) */}
              {(() => {
                const ck = "lc-fafsa-vid";
                const expanded = expandedSections.has(ck);
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setExpandedSections(p => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; })}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/[0.14]" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#091222] ring-1 ring-red-500/[0.18]">
                        <Library className="h-2.5 w-2.5 text-red-400/80" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Videos</span>
                        <ChevronDown className={\`h-2.5 w-2.5 text-white/30 transition-transform duration-200\${expanded ? " rotate-180" : ""}\`} />
                      </div>
                      <div className="h-px w-3 bg-red-500/[0.14]" />
                    </div>
                    {expanded && <div className="grid grid-cols-2 gap-2">
                      {[{ id: "RtDYpEfAa5U", title: "How to Fill Out the FAFSA" }, { id: "NmEP38x-1Z8", title: "FAFSA Tips & Common Mistakes" }, { id: "rhgwIhB58PA", title: "Student Aid Overview" }, { id: "C5OJJD3Eytk", title: "Understanding Aid Offers" }].map(({ id, title }) => (
                        <a key={id} href={\`https://www.youtube.com/watch?v=\${id}\`} target="_blank" rel="noopener noreferrer"
                           className="relative rounded-xl overflow-hidden ring-1 ring-white/[0.08] group hover:ring-sky-500/25 transition-all shadow-sm shadow-black/30">
                          <img src={\`https://img.youtube.com/vi/\${id}/mqdefault.jpg\`} alt={title} className="w-full aspect-video object-cover opacity-75 group-hover:opacity-100 transition-opacity"/>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                            <p className="text-[11px] text-white/85 truncate leading-tight">{title}</p>
                          </div>
                        </a>
                      ))}
                    </div>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 border-t border-[#1E2A4A]">
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300/70 leading-relaxed">General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.</p>
            </div>
          </div>
        </aside>

        {/* \u2500\u2500 Main \u2500\u2500 */`;

src = src.slice(0, si) + LEFT_NEW + src.slice(ei + LEFT_END.length);
console.log('Left panel replaced OK');

// ── 2. RIGHT PANEL ──────────────────────────────────────────────────────────
const RIGHT_START = '            <div className="space-y-5">\n\n              {/* \u2500\u2500 Administrators Quick Actions \u2500\u2500 */}';
const RIGHT_END   =
  '            </div>\n          </div>\n\n          {/* Footer */}\n' +
  '          <div className="shrink-0 px-4 py-2.5 border-t border-[#1E2A4A]">\n' +
  '            <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2">\n' +
  '              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />\n' +
  '              <p className="text-[10px] text-amber-300/70 leading-relaxed">General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.</p>\n' +
  '            </div>\n          </div>\n        </aside>\n\n      </div>';

const ri = src.indexOf(RIGHT_START);
const rie = src.indexOf(RIGHT_END, ri);
if (ri === -1) throw new Error('RIGHT START not found');
if (rie === -1) throw new Error('RIGHT END not found');

const RIGHT_NEW = `            <div className="flex flex-col gap-2.5">

              {/* Section icon grid */}
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: "rc-adm-qa",       label: "Admin Actions",    img: "/images/sec-admin.jpg",              pos: "object-[50%_14%]" },
                  { key: "rc-lea-qa",       label: "Leader Actions",   img: "/images/sec-leaders.jpg",            pos: "object-[50%_18%]" },
                  { key: "rc-aud-qa",       label: "Compliance QA",    img: "/images/sec-compliance.jpg",         pos: "object-[50%_45%]" },
                  { key: "rc-fa-adm",       label: "Admin Resources",  img: "/images/sec-admin-advisors.jpg",     pos: "object-[50%_22%]" },
                  { key: "rc-lac",          label: "Compliance",       img: "/images/sec-leaders-compliance.jpg", pos: "object-[50%_18%]" },
                  { key: "rc-loan-portals", label: "Loan Portals",     img: "/images/sec-loan-portals.jpg",       pos: "object-[50%_20%]" },
                  { key: "rc-hw",           label: "Health & Wellness", img: "/images/sec-wellness.jpg",          pos: "object-[50%_12%]" },
                  { key: "rc-va",           label: "VA Resources",     img: "/images/sec-va-right.jpg",           pos: "object-[50%_18%]" },
                  { key: "rc-mh-admin",     label: "Mental Health",    img: "/images/sec-mh-pro.jpg",             pos: "object-[50%_14%]" },
                  { key: "rc-vol-admin",    label: "Volunteer",        img: "/images/sec-volunteer-right.jpg",    pos: "object-[50%_18%]" },
                ] as const).map(({ key, label, img, pos }) => (
                  <button
                    key={key}
                    onClick={() => setOverlaySection(key)}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/60 shadow-md shadow-black/40 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200"
                    style={{ aspectRatio: "1.6 / 1" }}
                  >
                    <img src={img} alt="" className={\`w-full h-full object-cover \${pos}\`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#04091A]/95 via-[#04091A]/45 to-transparent group-hover:from-[#04091A]/80 transition-all duration-200" />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.08] group-hover:ring-[#00D4FF]/40 transition-all duration-200" />
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/85">{label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Admin Videos (collapsible) */}
              {(() => {
                const ck = "rc-admin-vid";
                const expanded = expandedSections.has(ck);
                return (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 cursor-pointer" onClick={() => setExpandedSections(p => { const n = new Set(p); n.has(ck) ? n.delete(ck) : n.add(ck); return n; })}>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-red-500/[0.14]" />
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#091222] ring-1 ring-red-500/[0.18]">
                        <Library className="h-2.5 w-2.5 text-red-400/80" />
                        <span className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/50">Videos</span>
                        <ChevronDown className={\`h-2.5 w-2.5 text-white/30 transition-transform duration-200\${expanded ? " rotate-180" : ""}\`} />
                      </div>
                      <div className="h-px w-3 bg-red-500/[0.14]" />
                    </div>
                    {expanded && <div className="grid grid-cols-2 gap-2">
                      {[{ id: "P6FORpg0KVo", title: "Aid Packaging & Verification" }, { id: "HAnw168huqA", title: "Regulatory Compliance" }, { id: "rhgwIhB58PA", title: "Student Aid Overview" }, { id: "kKvK2foOTJM", title: "Financial Aid Administration" }].map(({ id, title }) => (
                        <a key={id} href={\`https://www.youtube.com/watch?v=\${id}\`} target="_blank" rel="noopener noreferrer"
                           className="relative rounded-xl overflow-hidden ring-1 ring-white/[0.08] group hover:ring-sky-500/25 transition-all shadow-sm shadow-black/30">
                          <img src={\`https://img.youtube.com/vi/\${id}/mqdefault.jpg\`} alt={title} className="w-full aspect-video object-cover opacity-75 group-hover:opacity-100 transition-opacity"/>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                            <p className="text-[11px] text-white/85 truncate leading-tight">{title}</p>
                          </div>
                        </a>
                      ))}
                    </div>}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-4 py-2.5 border-t border-[#1E2A4A]">
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/[0.08] ring-1 ring-amber-500/20 px-3 py-2">
              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-300/70 leading-relaxed">General guidance only. Verify with the FSA Handbook and consult legal counsel for institution-specific decisions.</p>
            </div>
          </div>
        </aside>

      </div>`;

src = src.slice(0, ri) + RIGHT_NEW + src.slice(rie + RIGHT_END.length);
console.log('Right panel replaced OK');

// ── 3. OVERLAY HEADER ───────────────────────────────────────────────────────
const OLD_HDR_START = '            {/* Header */}\n            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-[#1A2540]"';
const OLD_HDR_END   = '              <button onClick={() => setOverlaySection(null)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">\n                <X className="h-4 w-4" />\n              </button>\n            </div>';

const oi  = src.indexOf(OLD_HDR_START);
const oie = src.indexOf(OLD_HDR_END, oi);
if (oi  === -1) throw new Error('OVERLAY HDR START not found');
if (oie === -1) throw new Error('OVERLAY HDR END not found');

const NEW_HDR = `            {/* Banner header */}
            {(() => {
              const OVERLAY_META: Record<string, { title: string; banner: string; bannerPos: string }> = {
                "lc-s-qa":        { title: "Students Quick Actions",                banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 30%" },
                "lc-p-qa":        { title: "Parents Quick Actions",                 banner: "/images/banner-ov-parent.jpg",        bannerPos: "50% 30%" },
                "lc-fed-sp":      { title: "Federal Student Aid",                   banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 40%" },
                "lc-resume":      { title: "Resume Assistance",                     banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 25%" },
                "lc-schol":       { title: "Scholarship Search Engines",            banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 20%" },
                "lc-intern":      { title: "Internship / Career Search",            banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 30%" },
                "lc-jobs":        { title: "Student Job Search",                    banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 35%" },
                "lc-finlit":      { title: "Financial Literacy",                    banner: "/images/banner-ov-parent.jpg",        bannerPos: "50% 25%" },
                "lc-loans":       { title: "Private Student Loans",                 banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 30%" },
                "lc-consumer":    { title: "Bills & Consumer Rights",               banner: "/images/banner-ov-editor.jpg",        bannerPos: "50% 35%" },
                "lc-mental":      { title: "Mental Health Resources",               banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 25%" },
                "lc-ai":          { title: "AI Literacy",                           banner: "/images/banner-ov-night.jpg",         bannerPos: "50% 20%" },
                "lc-faith":       { title: "Religion & Faith",                      banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 30%" },
                "lc-vol":         { title: "Volunteer & Community",                 banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 35%" },
                "lc-va":          { title: "VA Resources",                          banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 28%" },
                "rc-adm-qa":      { title: "Administrators Quick Actions",          banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 25%" },
                "rc-lea-qa":      { title: "Leaders Quick Actions",                 banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 25%" },
                "rc-aud-qa":      { title: "Compliance/Auditors Quick Actions",     banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 30%" },
                "rc-fa-adm":      { title: "Administrators & Advisors",             banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 30%" },
                "rc-lac":         { title: "Leaders & Compliance/Auditors",         banner: "/images/banner-ov-leader.jpg",        bannerPos: "50% 28%" },
                "rc-loan-portals":{ title: "Private Loan Administrator Portals",    banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 35%" },
                "rc-hw":          { title: "Health & Wellness Support",             banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 22%" },
                "rc-va":          { title: "VA Resources",                          banner: "/images/banner-ov-admin.jpg",         bannerPos: "50% 30%" },
                "rc-mh-admin":    { title: "Mental Health \u2014 Professional Wellness", banner: "/images/banner-ov-contemplative.jpg", bannerPos: "50% 25%" },
                "rc-vol-admin":   { title: "Volunteer & Community Service",         banner: "/images/banner-ov-student.jpg",       bannerPos: "50% 30%" },
              };
              const meta = OVERLAY_META[overlaySection] ?? { title: overlaySection, banner: "/images/banner-ov-admin.jpg", bannerPos: "50% 30%" };
              return (
                <div className="relative shrink-0 h-24 overflow-hidden">
                  <img src={meta.banner} alt="" className="w-full h-full object-cover" style={{ objectPosition: meta.bannerPos }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(6,12,28,0.35) 0%, rgba(6,12,28,0.88) 100%)" }} />
                  <div className="absolute inset-0 flex items-end justify-between px-5 pb-3.5">
                    <h2 className="text-sm font-black tracking-tight" style={{ background: "linear-gradient(90deg,#00B8D4 0%,#00E5C0 18%,#7FFFEA 34%,#00D4FF 50%,#00E5C0 66%,#7FFFEA 82%,#00B8D4 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "genie-teal-shimmer 3s linear infinite" }}>
                      {meta.title}
                    </h2>
                    <button onClick={() => setOverlaySection(null)} className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.12] transition-all">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })()}`;

src = src.slice(0, oi) + NEW_HDR + src.slice(oie + OLD_HDR_END.length);
console.log('Overlay header replaced OK');

writeFileSync('src/app/aid-agent/page.tsx', src.replace(/\n/g, '\r\n'), 'utf8');
console.log('File written successfully');
