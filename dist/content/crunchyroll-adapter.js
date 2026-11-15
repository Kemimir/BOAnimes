var CrunchyBoaContent=(()=>{var m=Object.defineProperty;var b=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var w=Object.prototype.hasOwnProperty;var x=(t,e)=>{for(var s in e)m(t,s,{get:e[s],enumerable:!0})},y=(t,e,s,r)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of f(e))!w.call(t,i)&&i!==s&&m(t,i,{get:()=>e[i],enumerable:!(r=b(e,i))||r.enumerable});return t};var v=t=>y(m({},"__esModule",{value:!0}),t);var $={};x($,{crunchyrollAdapter:()=>S});function l(t,e=document){return e.querySelector(t)}function E(t,e=document){return Array.from(e.querySelectorAll(t))}function u(t){return t?.textContent?.trim()||null}function p(t,e){return t?.getAttribute(e)||null}function h(t,e,s){let r=`${t||""} ${e||""}`,i=r.match(/(?:episode|epis[oó]dio|ep\.?|e)\s*[-#.]?\s*(\d+)/i)||r.match(/(?:^|[-_/])0*(\d{1,3})(?:[/?#]|$)/);return i?Number(i[1]):s}function A(t){return new URL(t,window.location.origin).href}var S={name:"crunchyroll",matchUrl:/^https?:\/\/(www\.)?crunchyroll\.com/,getSeriesId(t){let e=[/\/series\/([A-Z0-9]+)/,/\/watch\/([A-Z0-9]+)/,/\/[a-z]{2}\/series\/([A-Z0-9]+)/,/\/[a-z]{2}\/watch\/([A-Z0-9]+)/,/[?&]series_id=([A-Z0-9]+)/,/[?&]id=([A-Z0-9]+)/];for(let s of e){let r=t.match(s);if(r)return r[1]}return null},getSeriesTitle(t){return p(l('meta[property="og:title"]',t),"content")||u(l('h1[data-t="series-title"]',t))||u(l(".series-title",t))||u(l("h1",t))},getSeriesCover(t){return p(l('meta[property="og:image"]',t),"content")||p(l(".series-poster img",t),"src")||p(l('[data-t="series-poster"] img',t),"src")},getEpisodeList(t){let e=[],s=new Set;return E('[data-t="episode-item"], [data-testid*="episode"], .episode-item, .season-episodes a[href*="/watch/"], a[href*="/watch/"]',t).forEach((r,i)=>{let a=r.matches('a[href*="/watch/"]')?r:r.querySelector('a[href*="/watch/"]'),c=p(a,"href");if(!c)return;let o=A(c);if(s.has(o))return;s.add(o);let n=u(a?.querySelector('[data-t="episode-title"], [data-testid*="episode-title"], .episode-title, .ellipsized'))||u(a);e.push({number:h(n,c,i+1),title:n||void 0,url:o,watched:r.classList.contains("watched")||r.getAttribute("data-state")==="watched"||r.querySelector('[data-t="watched-badge"], [data-testid*="watched"]')!==null})}),e},getCurrentEpisode(t){let e=window.location.href;if(!/\/watch\//i.test(e))return null;let s=p(l('meta[property="og:title"]',t),"content")||u(l('[data-t="episode-title"], [data-testid*="episode-title"], .episode-title, h1',t));return{number:h(s,e,1),title:s||void 0,url:e,watched:!1}},injectUI(t,e,s){let r=[{value:"favorite",label:"\u2605 Favorita",icon:"\u2605",color:"#ffd700"},{value:"watched",label:"\u2713 Assistida",icon:"\u2713",color:"#4caf50"},{value:"watching",label:"\u25B6 Assistindo",icon:"\u25B6",color:"#2196f3"},{value:"plan_to_watch",label:"+ Pretendo assistir",icon:"+",color:"#ff9800"}],i=e?.status||"plan_to_watch",a=document.createElement("div");a.className="crunchyboa-status-widget",a.style.cssText=`
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 16px 0;
      padding: 12px 16px;
      background: rgba(20, 20, 24, 0.95);
      border-radius: 12px;
      border: 1px solid rgba(255, 107, 53, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      z-index: 2147483647 !important;
      position: relative !important;
      pointer-events: auto !important;
      isolation: isolate;
    `;let c=document.createElement("span");if(c.textContent="CrunchyBoa: ",c.style.cssText="font-weight: 700; color: #ff6b35; margin-right: 8px; align-self: center; font-size: 14px; white-space: nowrap;",a.appendChild(c),r.forEach(o=>{let n=document.createElement("button");n.type="button",n.textContent=o.icon,n.className="crunchyboa-status-button",n.title=o.label,n.setAttribute("aria-label",o.label),n.dataset.status=o.value;let d=o.value===i;n.style.cssText=`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        border: 2px solid ${d?o.color:"rgba(255,255,255,0.15)"};
        background: ${d?o.color+"30":"rgba(255,255,255,0.03)"};
        color: ${d?o.color:"#e0e0e0"};
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.15s ease;
        pointer-events: auto !important;
        box-shadow: ${d?`0 0 12px ${o.color}60`:"none"};
      `,n.addEventListener("mouseenter",()=>{n.style.background=o.color+"50",n.style.borderColor=o.color,n.style.boxShadow=`0 0 16px ${o.color}80`,n.style.transform="scale(1.05)"}),n.addEventListener("mouseleave",()=>{n.style.background=d?o.color+"30":"rgba(255,255,255,0.03)",n.style.borderColor=d?o.color:"rgba(255,255,255,0.15)",n.style.boxShadow=d?`0 0 12px ${o.color}60`:"none",n.style.transform="scale(1)"}),n.addEventListener("click",g=>{g.stopPropagation(),s(o.value)}),a.appendChild(n)}),e?.episodesWatched!==void 0&&e.totalEpisodes){let o=document.createElement("div");o.className="crunchyboa-progress",o.style.cssText=`
        width: 100%;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.08);
      `;let n=Math.min(100,Math.round(e.episodesWatched/e.totalEpisodes*100));o.innerHTML=`
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; color:#aaa;">
          <span>Progresso: ${e.episodesWatched}/${e.totalEpisodes} epis\xF3dios</span>
          <span style="color:#ff6b35; font-weight:600;">${n}%</span>
        </div>
        <div class="crunchyboa-progress-track">
          <div style="width:${n}%; height:100%; background:linear-gradient(90deg, #ff6b35, #f7931e); border-radius:4px; transition:width 0.4s ease; box-shadow:0 0 8px #ff6b3580;"></div>
        </div>
      `,a.appendChild(o)}t.appendChild(a)},observeMutations(t){let e=new MutationObserver(s=>{for(let r of s)if(r.type==="childList"&&r.addedNodes.length>0){t();break}});return e.observe(document.body,{childList:!0,subtree:!0}),e}};return v($);})();
