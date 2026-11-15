var CrunchyBoaContent=(()=>{var h=Object.defineProperty;var g=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var w=Object.prototype.hasOwnProperty;var x=(e,t)=>{for(var s in t)h(e,s,{get:t[s],enumerable:!0})},y=(e,t,s,r)=>{if(t&&typeof t=="object"||typeof t=="function")for(let a of f(t))!w.call(e,a)&&a!==s&&h(e,a,{get:()=>t[a],enumerable:!(r=g(t,a))||r.enumerable});return e};var v=e=>y(h({},"__esModule",{value:!0}),e);var $={};x($,{crunchyrollAdapter:()=>S});function l(e,t=document){return t.querySelector(e)}function E(e,t=document){return Array.from(t.querySelectorAll(e))}function u(e){return e?.textContent?.trim()||null}function p(e,t){return e?.getAttribute(t)||null}function m(e,t,s){let r=`${e||""} ${t||""}`,a=r.match(/(?:episode|epis[oó]dio|ep\.?|e)\s*[-#.]?\s*(\d+)/i)||r.match(/(?:^|[-_/])0*(\d{1,3})(?:[/?#]|$)/);return a?Number(a[1]):s}function A(e){return new URL(e,window.location.origin).href}var S={name:"crunchyroll",matchUrl:/^https?:\/\/(www\.)?crunchyroll\.com/,getSeriesId(e){let t=[/\/series\/([A-Z0-9]+)/,/\/watch\/([A-Z0-9]+)/,/\/[a-z]{2}\/series\/([A-Z0-9]+)/,/\/[a-z]{2}\/watch\/([A-Z0-9]+)/,/[?&]series_id=([A-Z0-9]+)/,/[?&]id=([A-Z0-9]+)/];for(let s of t){let r=e.match(s);if(r)return r[1]}return null},getSeriesTitle(e){return p(l('meta[property="og:title"]',e),"content")||u(l('h1[data-t="series-title"]',e))||u(l(".series-title",e))||u(l("h1",e))},getSeriesCover(e){return p(l('meta[property="og:image"]',e),"content")||p(l(".series-poster img",e),"src")||p(l('[data-t="series-poster"] img',e),"src")},getEpisodeList(e){let t=[],s=new Set;return E('[data-t="episode-item"], [data-testid*="episode"], .episode-item, .season-episodes a[href*="/watch/"], a[href*="/watch/"]',e).forEach((r,a)=>{let i=r.matches('a[href*="/watch/"]')?r:r.querySelector('a[href*="/watch/"]'),c=p(i,"href");if(!c)return;let o=A(c);if(s.has(o))return;s.add(o);let n=u(i?.querySelector('[data-t="episode-title"], [data-testid*="episode-title"], .episode-title, .ellipsized'))||u(i);t.push({number:m(n,c,a+1),title:n||void 0,url:o,watched:r.classList.contains("watched")||r.getAttribute("data-state")==="watched"||r.querySelector('[data-t="watched-badge"], [data-testid*="watched"]')!==null})}),t},getCurrentEpisode(e){let t=window.location.href;if(!/\/watch\//i.test(t))return null;let s=p(l('meta[property="og:title"]',e),"content")||u(l('[data-t="episode-title"], [data-testid*="episode-title"], .episode-title, h1',e));return{number:m(s,t,1),title:s||void 0,url:t,watched:!1}},injectUI(e,t,s){let r=[{value:"favorite",label:"\u2605 Favorita",icon:"\u2605",color:"#ffd700"},{value:"watched",label:"\u2713 Assistida",icon:"\u2713",color:"#4caf50"},{value:"watching",label:"\u25B6 Assistindo",icon:"\u25B6",color:"#2196f3"},{value:"plan_to_watch",label:"+ Pretendo assistir",icon:"+",color:"#ff9800"}],a=t?.status||"plan_to_watch",i=document.createElement("div");i.className="crunchyboa-status-widget crunchyboa-acrylic-panel",i.style.cssText=`
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
    `;let c=document.createElement("span");if(c.className="crunchyboa-widget-label",c.textContent="CrunchyBoa",c.style.cssText="font-weight: 700; color: #ff6b35; margin-right: 8px; align-self: center; font-size: 14px; white-space: nowrap;",i.appendChild(c),r.forEach(o=>{let n=document.createElement("button");n.type="button",n.textContent=`${o.icon} ${o.label.replace(/^[^ ]+\s*/,"")}`,n.className="crunchyboa-status-button",n.title=o.label,n.setAttribute("aria-label",o.label),n.dataset.status=o.value;let d=o.value===a;n.style.cssText=`
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
      `,n.addEventListener("mouseenter",()=>{n.style.background=o.color+"50",n.style.borderColor=o.color,n.style.boxShadow=`0 0 16px ${o.color}80`,n.style.transform="scale(1.05)"}),n.addEventListener("mouseleave",()=>{n.style.background=d?o.color+"30":"rgba(255,255,255,0.03)",n.style.borderColor=d?o.color:"rgba(255,255,255,0.15)",n.style.boxShadow=d?`0 0 12px ${o.color}60`:"none",n.style.transform="scale(1)"}),n.addEventListener("click",b=>{b.stopPropagation(),s(o.value)}),i.appendChild(n)}),t?.episodesWatched!==void 0&&t.totalEpisodes){let o=document.createElement("div");o.className="crunchyboa-progress",o.style.cssText=`
        width: 100%;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.08);
      `;let n=Math.min(100,Math.round(t.episodesWatched/t.totalEpisodes*100));o.innerHTML=`
        <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; color:#aaa;">
          <span>Progresso: ${t.episodesWatched}/${t.totalEpisodes} epis\xF3dios</span>
          <span style="color:#ff6b35; font-weight:600;">${n}%</span>
        </div>
        <div class="crunchyboa-progress-track">
          <div style="width:${n}%; height:100%; background:linear-gradient(90deg, #ff6b35, #f7931e); border-radius:4px; transition:width 0.4s ease; box-shadow:0 0 8px #ff6b3580;"></div>
        </div>
      `,i.appendChild(o)}e.appendChild(i)},observeMutations(e){let t=new MutationObserver(s=>{for(let r of s)if(r.type==="childList"&&r.addedNodes.length>0){e();break}});return t.observe(document.body,{childList:!0,subtree:!0}),t}};return v($);})();
