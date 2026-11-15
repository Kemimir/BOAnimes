var CrunchyBoaContent=(()=>{var f=Object.defineProperty;var x=Object.getOwnPropertyDescriptor;var E=Object.getOwnPropertyNames;var y=Object.prototype.hasOwnProperty;var w=(o,i)=>{for(var t in i)f(o,t,{get:i[t],enumerable:!0})},T=(o,i,t,e)=>{if(i&&typeof i=="object"||typeof i=="function")for(let n of E(i))!y.call(o,n)&&n!==t&&f(o,n,{get:()=>i[n],enumerable:!(e=x(i,n))||e.enumerable});return o};var k=o=>T(f({},"__esModule",{value:!0}),o);var C={};w(C,{genericAdapters:()=>b,getAdapterForCurrentSite:()=>A});function d(o,i=document){return i.querySelector(o)}function L(o,i=document){return Array.from(i.querySelectorAll(o))}function m(o){return o?.textContent?.trim()||null}function g(o,i){return o?.getAttribute(i)||null}function h(o,i){return{name:o,matchUrl:new RegExp(`^https?://(www\\.)?${o.replace(".","\\.")}`),getSeriesId(t){let e=t.match(/\/anime\/([^/?#]+)/)||t.match(/\/series\/([^/?#]+)/)||t.match(/[?&]id=([^&#]+)/);return e?e[1]:null},getSeriesTitle(t){for(let e of i.seriesTitle){let n=m(d(e,t));if(n)return n}return m(d('meta[property="og:title"]',t))||m(d("h1",t))},getSeriesCover(t){for(let e of i.seriesCover){let n=g(d(e,t),"src")||g(d(e,t),"data-src");if(n)return n}return g(d('meta[property="og:image"]',t),"content")},getEpisodeList(t){let e=[];return L(i.episodeList,t).forEach((n,p)=>{let c=n.querySelector(i.episodeLink)||(n.tagName==="A"?n:null);if(!c)return;let a=g(c,"href"),l="";for(let r of i.episodeTitle)if(l=m(n.querySelector(r))||"",l)break;l||(l=m(c)||"");let s=l.match(/E?P?(\d+)/i)||l.match(/Episódio\s+(\d+)/i)||l.match(/Episode\s+(\d+)/i);a&&e.push({number:s?parseInt(s[1],10):e.length+1,title:l||void 0,url:a.startsWith("http")?a:a.startsWith("/")?`https://${o}${a}`:`https://${o}/${a}`,watched:!1})}),e},getCurrentEpisode(t){let e="";for(let c of i.currentEpisodeTitle)if(e=m(d(c,t))||"",e)break;e||(e=m(d("h1",t))||"");let n=e.match(/E?P?(\d+)/i)||e.match(/Episódio\s+(\d+)/i)||e.match(/Episode\s+(\d+)/i),p=window.location.href;return{number:n?parseInt(n[1],10):1,title:e||void 0,url:p,watched:!1}},injectUI(t,e,n){let p=[{value:"favorite",label:"\u2605 Favorita",icon:"\u2605",color:"#ffd700"},{value:"watched",label:"\u2713 Assistida",icon:"\u2713",color:"#4caf50"},{value:"watching",label:"\u25B6 Assistindo",icon:"\u25B6",color:"#2196f3"},{value:"plan_to_watch",label:"+ Pretendo assistir",icon:"+",color:"#ff9800"}],c=e?.status||"plan_to_watch",a=document.createElement("div");a.className="crunchyboa-status-widget",a.style.cssText=`
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
      `;let l=document.createElement("span");if(l.textContent="CrunchyBoa: ",l.style.cssText="font-weight: 700; color: #ff6b35; margin-right: 8px; align-self: center; font-size: 14px; white-space: nowrap;",a.appendChild(l),p.forEach(s=>{let r=document.createElement("button");r.type="button",r.textContent=s.icon,r.title=s.label,r.dataset.status=s.value;let u=s.value===c;r.style.cssText=`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: 2px solid ${u?s.color:"rgba(255,255,255,0.15)"};
          background: ${u?s.color+"30":"rgba(255,255,255,0.03)"};
          color: ${u?s.color:"#e0e0e0"};
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          transition: all 0.15s ease;
          pointer-events: auto !important;
          box-shadow: ${u?`0 0 12px ${s.color}60`:"none"};
        `,r.addEventListener("mouseenter",()=>{r.style.background=s.color+"50",r.style.borderColor=s.color,r.style.boxShadow=`0 0 16px ${s.color}80`,r.style.transform="scale(1.05)"}),r.addEventListener("mouseleave",()=>{r.style.background=u?s.color+"30":"rgba(255,255,255,0.03)",r.style.borderColor=u?s.color:"rgba(255,255,255,0.15)",r.style.boxShadow=u?`0 0 12px ${s.color}60`:"none",r.style.transform="scale(1)"}),r.addEventListener("click",v=>{v.stopPropagation(),n(s.value)}),a.appendChild(r)}),e?.episodesWatched!==void 0&&e.totalEpisodes){let s=document.createElement("div");s.style.cssText=`
          width: 100%;
          margin-top: 12px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.1);
        `,s.innerHTML=`
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:#aaa;">
            <span>Progresso: ${e.episodesWatched}/${e.totalEpisodes}</span>
            <span>${Math.round(e.episodesWatched/e.totalEpisodes*100)}%</span>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
            <div style="width:${Math.min(100,e.episodesWatched/e.totalEpisodes*100)}%; height:100%; background:linear-gradient(90deg, #ff6b35, #f7931e); border-radius:3px; transition:width 0.3s;"></div>
          </div>
        `,a.appendChild(s)}t.appendChild(a)},observeMutations(t){let e=new MutationObserver(n=>{for(let p of n)if(p.type==="childList"&&p.addedNodes.length>0){t();break}});return e.observe(document.body,{childList:!0,subtree:!0}),e}}}var b={animesorion:h("animesorion.com",{seriesTitle:[".anime-title h1","h1.title",".entry-title"],seriesCover:[".anime-cover img",".poster img",".anime-img img"],episodeList:".episodios li a, .episode-list a, .eps-list a",episodeLink:"a",episodeTitle:[".ep-title",".episode-title","span"],currentEpisodeTitle:[".player-title h1",".episode-title h1","h1"]}),animesonlinecc:h("animesonlinecc.to",{seriesTitle:[".anime-info h1",".entry-title","h1"],seriesCover:[".anime-cover img",".poster img"],episodeList:".episodios li a, .eps-list a",episodeLink:"a",episodeTitle:[".ep-num",".episode-number","span"],currentEpisodeTitle:[".player-title","h1"]}),animefire:h("animefire.plus",{seriesTitle:[".anime-title","h1.title",".entry-title"],seriesCover:[".anime-cover img",".thumb img"],episodeList:".episodes-list a, .ep-list a",episodeLink:"a",episodeTitle:[".ep-title","span"],currentEpisodeTitle:[".video-title","h1"]}),otakuflix:h("otakuflix.com",{seriesTitle:[".anime-title","h1",".entry-title"],seriesCover:[".cover img",".poster img"],episodeList:".episode-list a, .eps a",episodeLink:"a",episodeTitle:[".ep-title","span"],currentEpisodeTitle:[".player-title","h1"]}),animesonehd:h("animesonehd.com",{seriesTitle:[".anime-title","h1",".entry-title"],seriesCover:[".cover img",".poster img"],episodeList:".episodes a, .ep-list a",episodeLink:"a",episodeTitle:[".ep-title","span"],currentEpisodeTitle:[".video-title","h1"]})};function A(){let o=window.location.hostname.replace("www.","");if(o.includes("crunchyroll.com"))return null;for(let[i,t]of Object.entries(b))if(o.includes(i))return t;return null}return k(C);})();
