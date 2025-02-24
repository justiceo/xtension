var IS_DEV_BUILD=false;
(()=>{var zi=document.createElement("div");zi.innerHTML='<div class=wb-header><div class=wb-control><span title="Minimize" class=wb-min></span><span title="Maximize" class=wb-max></span><span title="Fullscreen" class=wb-full></span><span title="Close" class=wb-close></span></div><div class=wb-drag><div class=wb-icon></div><div class=wb-title></div></div></div><div class=wb-body></div><div class=wb-footer><feedback-form size="inline"></feedback-form></div><div class=wb-n></div><div class=wb-s></div><div class=wb-w></div><div class=wb-e></div><div class=wb-nw></div><div class=wb-ne></div><div class=wb-se></div><div class=wb-sw></div>';function Ii(t){return(t||zi).cloneNode(!0)}var Ci=`
  .winbox {
    position: fixed;
    left: 0;
    top: 0;
    background: #0050ff;
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
    /* using transform make contents blur when applied and requires more gpu memory */
    transition: width 0.3s, height 0.3s, left 0.3s, top 0.3s;
    transition-timing-function: cubic-bezier(0.3, 1, 0.3, 1);
    /* contain "strict" does not make overflow contents selectable */
    contain: layout size;
    /* explicitly set text align to left fixes an issue with iframes alignment when centered */
    text-align: left;
    /* workaround for using passive listeners */
    touch-action: none;
  }
  .wb-header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 35px;
    line-height: 35px;
    color: #fff;
    overflow: hidden;
    z-index: 1;
  }
  .wb-body {
    position: absolute;
    top: 35px;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    overflow-scrolling: touch;
    will-change: contents;
    background: #fff;
    /* when no border is set there is some thin line visible */
    /* always hide top border visually */
    margin-top: 0 !important;
    contain: strict;
    z-index: 0;
  }
  .wb-footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    display: none;
  }
  .winbox.show-footer .wb-body {
    bottom: 35px; /* height of footer */
  }
  .winbox.show-footer .wb-footer {
    display: block;
  }
  body > .wb-body {
    position: relative;
    display: inline-block;
    visibility: hidden;
    contain: none;
  }
  .wb-drag {
    height: 100%;
    padding-left: 10px;
    cursor: move;
  }
  .wb-title {
    font-family: Arial, sans-serif;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .wb-icon {
    display: none;
    width: 20px;
    height: 100%;
    margin: -1px 8px 0 -3px;
    float: left;
    background-repeat: no-repeat;
    background-size: 100%;
    background-position: center;
  }
  .wb-n {
    position: absolute;
    top: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: n-resize;
    z-index: 2;
  }
  .wb-e {
    position: absolute;
    top: 0;
    right: -5px;
    bottom: 0;
    width: 10px;
    cursor: w-resize;
    z-index: 2;
  }
  .wb-s {
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: n-resize;
    z-index: 2;
  }
  .wb-w {
    position: absolute;
    top: 0;
    left: -5px;
    bottom: 0;
    width: 10px;
    cursor: w-resize;
    z-index: 2;
  }
  .wb-nw {
    position: absolute;
    top: -5px;
    left: -5px;
    width: 15px;
    height: 15px;
    cursor: nw-resize;
    z-index: 2;
  }
  .wb-ne {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    cursor: ne-resize;
    z-index: 2;
  }
  .wb-sw {
    position: absolute;
    bottom: -5px;
    left: -5px;
    width: 15px;
    height: 15px;
    cursor: ne-resize;
    z-index: 2;
  }
  .wb-se {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 15px;
    height: 15px;
    cursor: nw-resize;
    z-index: 2;
  }
  .wb-control {
    float: right;
    height: 100%;
    max-width: 100%;
    text-align: center;
  }
  .wb-control * {
    display: inline-block;
    width: 30px;
    height: 100%;
    max-width: 100%;
    background-position: center;
    background-repeat: no-repeat;
    cursor: pointer;
  }
  .wb-min {
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAyIj48cGF0aCBmaWxsPSIjZmZmIiBkPSJNOCAwaDdhMSAxIDAgMCAxIDAgMkgxYTEgMSAwIDAgMSAwLTJoN3oiLz48L3N2Zz4=);
    background-size: 14px auto;
    background-position: center calc(50% + 6px);
  }
  .wb-max {
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9IiNmZmYiIHZpZXdCb3g9IjAgMCA5NiA5NiI+PHBhdGggZD0iTTIwIDcxLjMxMUMxNS4zNCA2OS42NyAxMiA2NS4yMyAxMiA2MFYyMGMwLTYuNjMgNS4zNy0xMiAxMi0xMmg0MGM1LjIzIDAgOS42NyAzLjM0IDExLjMxMSA4SDI0Yy0yLjIxIDAtNCAxLjc5LTQgNHY1MS4zMTF6Ii8+PHBhdGggZD0iTTkyIDc2VjM2YzAtNi42My01LjM3LTEyLTEyLTEySDQwYy02LjYzIDAtMTIgNS4zNy0xMiAxMnY0MGMwIDYuNjMgNS4zNyAxMiAxMiAxMmg0MGM2LjYzIDAgMTItNS4zNyAxMi0xMnptLTUyIDRjLTIuMjEgMC00LTEuNzktNC00VjM2YzAtMi4yMSAxLjc5LTQgNC00aDQwYzIuMjEgMCA0IDEuNzkgNCA0djQwYzAgMi4yMS0xLjc5IDQtNCA0SDQweiIvPjwvc3ZnPg==);
    background-size: 17px auto;
  }
  .wb-close {
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii0xIC0xIDE4IDE4Ij48cGF0aCBmaWxsPSIjZmZmIiBkPSJtMS42MTMuMjEuMDk0LjA4M0w4IDYuNTg1IDE0LjI5My4yOTNsLjA5NC0uMDgzYTEgMSAwIDAgMSAxLjQwMyAxLjQwM2wtLjA4My4wOTRMOS40MTUgOGw2LjI5MiA2LjI5M2ExIDEgMCAwIDEtMS4zMiAxLjQ5N2wtLjA5NC0uMDgzTDggOS40MTVsLTYuMjkzIDYuMjkyLS4wOTQuMDgzQTEgMSAwIDAgMSAuMjEgMTQuMzg3bC4wODMtLjA5NEw2LjU4NSA4IC4yOTMgMS43MDdBMSAxIDAgMCAxIDEuNjEzLjIxeiIvPjwvc3ZnPg==);
    background-size: 15px auto;
    background-position: 5px center;
  }
  .wb-full {
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIuNSIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBkPSJNOCAzSDVhMiAyIDAgMCAwLTIgMnYzbTE4IDBWNWEyIDIgMCAwIDAtMi0yaC0zbTAgMThoM2EyIDIgMCAwIDAgMi0ydi0zTTMgMTZ2M2EyIDIgMCAwIDAgMiAyaDMiLz48L3N2Zz4=);
    background-size: 16px auto;
  }
  /*
  .winbox:not(.max) .wb-max {
    background-image: url(@restore);
    background-size: 20px auto;
    background-position: center bottom 5px;
  }
  */
  /*
  .winbox:fullscreen{
    transition: none !important;
  }
  .winbox:fullscreen .wb-full{
    background-image: url(@minimize);
  }
  .winbox:fullscreen > div,
  .winbox:fullscreen .wb-title,
  */
  .winbox.modal .wb-body ~ div,
  .winbox.modal .wb-drag,
  .winbox.min .wb-body ~ div,
  .winbox.max .wb-body ~ div {
    pointer-events: none;
  }
  .winbox.max .wb-drag {
    cursor: default;
  }
  .winbox.min .wb-full,
  .winbox.min .wb-min {
    display: none;
  }
  .winbox.min .wb-drag {
    cursor: default;
  }
  .winbox.min .wb-body > * {
    display: none;
  }
  .winbox.hide {
    display: none;
  }
  .winbox.max {
    box-shadow: none;
  }
  .winbox.max .wb-body {
    margin: 0 !important;
  }
  .winbox iframe {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 0;
  }
  body.wb-lock .winbox {
    will-change: left, top, width, height;
    transition: none;
  }
  body.wb-lock iframe {
    pointer-events: none;
  }
  .winbox.modal:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: inherit;
    border-radius: inherit;
  }
  .winbox.modal:after {
    content: '';
    position: absolute;
    top: -50vh;
    left: -50vw;
    right: -50vw;
    bottom: -50vh;
    background: #0d1117;
    animation: wb-fade-in 0.2s ease-out forwards;
    z-index: -1;
  }
  .winbox.modal .wb-min,
  .winbox.modal .wb-max,
  .winbox.modal .wb-full {
    display: none;
  }
  @keyframes wb-fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 0.85;
    }
  }
  .no-animation {
    transition: none;
  }
  .no-shadow {
    box-shadow: none;
  }
  .no-header .wb-header {
    display: none;
  }
  .no-header .wb-body {
    top: 0;
  }
  .no-min .wb-min {
    display: none;
  }
  .no-max .wb-max {
    display: none;
  }
  .no-full .wb-full {
    display: none;
  }
  .no-close .wb-close {
    display: none;
  }
  .no-resize .wb-body ~ div {
    display: none;
  }
  .no-move:not(.min) .wb-title {
    pointer-events: none;
  }
  .wb-body .wb-hide {
    display: none;
  }
  .wb-show {
    display: none;
  }
  .wb-body .wb-show {
    display: revert;
  }
`;function m(t,i,e,o){t&&t.addEventListener(i,e,o||!1)}function W(t,i,e,o){t&&t.removeEventListener(i,e,o||!1)}function P(t,i){t.stopPropagation(),t.cancelable&&t.preventDefault()}function p(t,i){return t.getElementsByClassName(i)[0]}function oi(t,i){t.classList.add(i)}function Ai(t,i){return t.classList.contains(i)}function ni(t,i){t.classList.remove(i)}function l(t,i,e){e=""+e,t["_s_"+i]!==e&&(t.style.setProperty(i,e),t["_s_"+i]=e)}function ki(t,i){let e=t.firstChild;e?e.nodeValue=i:t.textContent=i}var V=!1,G=[],q={capture:!0,passive:!0},v,ji=0,U=10,F,E,L,Ni,D,N,Li=class t{constructor(i,e){if(!(this instanceof t))return new t(i);v||Ti();let o,n,s,u,h,z,j,T,Z,_,O,d,C,w,b,x,A,M,y,X,f,g,a,c,Y,H,hi,ri,di,J,ii,S,B,Q,li,ai,ci,mi,ui,wi,bi,xi,fi,gi,pi,Mi,yi;if(i&&(e&&(h=i,i=e),typeof i=="string"?h=i:(o=i.id,n=i.index,s=i.root,u=i.template,h=h||i.title,z=i.icon,j=i.mount,T=i.html,Z=i.url,_=i.shadowel,d=i.framename,C=i.cssurl,w=i.width,b=i.height,x=i.minwidth,A=i.minheight,M=i.maxwidth,y=i.maxheight,X=i.autosize,hi=i.min,ri=i.max,di=i.hidden,J=i.modal,f=i.x||(J?"center":0),g=i.y||(J?"center":0),a=i.top,c=i.left,Y=i.bottom,H=i.right,ii=i.background,S=i.border,B=i.header,Q=i.class,ai=i.onclose,ci=i.onfocus,mi=i.onblur,ui=i.onmove,wi=i.onresize,bi=i.onfullscreen,xi=i.onmaximize,fi=i.onminimize,gi=i.onrestore,pi=i.onhide,Mi=i.onshow,yi=i.onload)),this.dom=Ii(u),this.dom.id=this.id=o||"winbox-"+ ++ji,this.dom.className="winbox"+(Q?" "+(typeof Q=="string"?Q:Q.join(" ")):"")+(J?" modal":""),this.dom.winbox=this,this.window=this.dom,this.body=p(this.dom,"wb-body"),this.header=B||35,(n||n===0)&&(U=n),ii&&this.setBackground(ii),S?l(this.body,"margin",S+(isNaN(S)?"":"px")):S=0,B){let I=p(this.dom,"wb-header");l(I,"height",B+"px"),l(I,"line-height",B+"px"),l(this.body,"top",B+"px")}h&&this.setTitle(h),z&&this.setIcon(z),j?this.mount(j):T?this.body.innerHTML=T:Z&&this.setUrl(Z,yi),a=a?r(a,N):0,Y=Y?r(Y,N):0,c=c?r(c,D):0,H=H?r(H,D):0;let ti=D-c-H,ei=N-a-Y;if(M=M?r(M,ti):ti,y=y?r(y,ei):ei,x=x?r(x,M):150,A=A?r(A,y):this.header,X?((s||v).appendChild(this.body),w=Math.max(Math.min(this.body.clientWidth+S*2+1,M),x),b=Math.max(Math.min(this.body.clientHeight+this.header+S+1,y),A),this.dom.appendChild(this.body)):(w=w?r(w,M):Math.max(M/2,x)|0,b=b?r(b,y):Math.max(y/2,A)|0),f=f?r(f,ti,w):c,g=g?r(g,ei,b):a,this.x=f,this.y=g,this.width=w,this.height=b,this.minwidth=x,this.minheight=A,this.maxwidth=M,this.maxheight=y,this.top=a,this.right=H,this.bottom=Y,this.left=c,this.index=n,this.min=!1,this.max=!1,this.full=!1,this.hidden=!1,this.focused=!1,this.onclose=ai,this.onfocus=ci,this.onblur=mi,this.onmove=ui,this.onresize=wi,this.onfullscreen=bi,this.onmaximize=xi,this.onminimize=fi,this.onrestore=gi,this.onhide=pi,this.onshow=Mi,ri?this.maximize():hi?this.minimize():this.resize().move(),di?this.hide():(this.focus(),(n||n===0)&&(this.index=n,n>U&&(U=n))),l(this.shadowdom?this.shadowdom:this.dom,"z-index",n),_i(this),_){let I=document.createElement(_);I.style.position="absolute";let vi=document.createElement("style");if(vi.textContent=Ci,I.appendChild(vi),C){let R=document.createElement("link");R.rel="stylesheet",R.type="text/css",R.href=C,R.itemprop="url",I.appendChild(R)}I.appendChild(this.dom),I.attachShadow({mode:"open"}).innerHTML="<slot></slot>",this.shadowdom=I,(s||v).appendChild(I)}else(s||v).appendChild(this.dom);(li=i.oncreate)&&li.call(this,i)}static new(i){return new t(i)}mount(i){return this.unmount(),i._backstore||(i._backstore=i.parentNode),this.body.textContent="",this.body.appendChild(i),this}unmount(i){let e=this.body.firstChild;if(e){let o=i||e._backstore;o&&o.appendChild(e),e._backstore=i}return this}setTitle(i){let e=p(this.dom,"wb-title");return ki(e,this.title=i),this}setIcon(i){let e=p(this.dom,"wb-icon");return l(e,"background-image","url("+i+")"),l(e,"display","inline-block"),this}setBackground(i){return l(this.dom,"background",i),this}setUrl(i,e){let o=this.body.firstChild;if(o&&o.tagName.toLowerCase()==="iframe")o.src=i;else{let n=this.framename??"";this.body.innerHTML=`<iframe name="${n}" src="${i}"></iframe>`,e&&(this.body.firstChild.onload=e)}return this}focus(i){return i===!1?this.blur():(E!==this&&this.dom&&(E&&E.blur(),l(this.shadowdom?this.shadowdom:this.dom,"z-index",++U),this.index=U,this.addClass("focus"),E=this,this.focused=!0,this.onfocus&&this.onfocus()),this)}blur(i){return i===!1?this.focus():(E===this&&(this.removeClass("focus"),this.focused=!1,this.onblur&&this.onblur(),E=null),this)}hide(i){if(i===!1)return this.show();if(!this.hidden)return this.onhide&&this.onhide(),this.hidden=!0,this.addClass("hide")}show(i){if(i===!1)return this.hide();if(this.hidden)return this.onshow&&this.onshow(),this.hidden=!1,this.removeClass("hide")}minimize(i){return i===!1?this.restore():(F&&K(),this.max&&(this.removeClass("max"),this.max=!1),this.min||(G.push(this),si(),this.dom.title=this.title,this.addClass("min"),this.min=!0,this.onminimize&&this.onminimize()),this)}restore(){return F&&K(),this.min&&($(this),this.resize().move(),this.onrestore&&this.onrestore()),this.max&&(this.max=!1,this.removeClass("max").resize().move(),this.onrestore&&this.onrestore()),this}maximize(i){return i===!1?this.restore():(F&&K(),this.min&&$(this),this.max||(this.addClass("max").resize(D-this.left-this.right,N-this.top-this.bottom,!0).move(this.left,this.top,!0),this.max=!0,this.onmaximize&&this.onmaximize()),this)}fullscreen(i){if(this.min&&($(this),this.resize().move()),!F||!K())this.body[L](),F=this,this.full=!0,this.onfullscreen&&this.onfullscreen();else if(i===!1)return this.restore();return this}close(i){if(this.onclose&&this.onclose(i))return!0;this.min&&$(this),this.unmount(),this.dom.remove(),this.dom.textContent="",this.dom.winbox=null,this.body=null,this.dom=null,E===this&&(E=null)}move(i,e,o){return!i&&i!==0?(i=this.x,e=this.y):o||(this.x=i?i=r(i,D-this.left-this.right,this.width):0,this.y=e?e=r(e,N-this.top-this.bottom,this.height):0),l(this.dom,"left",i+"px"),l(this.dom,"top",e+"px"),this.onmove&&this.onmove(i,e),this}resize(i,e,o){return!i&&i!==0?(i=this.width,e=this.height):o||(this.width=i?i=r(i,this.maxwidth):0,this.height=e?e=r(e,this.maxheight):0,i=Math.max(i,this.minwidth),e=Math.max(e,this.minheight)),l(this.dom,"width",i+"px"),l(this.dom,"height",e+"px"),this.onresize&&this.onresize(i,e),this}addControl(i){let e=i.class,o=i.image,n=i.click,s=i.index,u=i.title,h=document.createElement("span"),z=p(this.dom,"wb-control"),j=this;return e&&(h.className=e),o&&l(h,"background-image","url("+o+")"),n&&(h.onclick=function(T){n.call(this,T,j)}),u&&(h.title=u),z.insertBefore(h,z.childNodes[s||0]),this}removeControl(i){return i=p(this.dom,i),i&&i.remove(),this}addClass(i){return oi(this.dom,i),this}removeClass(i){return ni(this.dom,i),this}hasClass(i){return Ai(this.dom,i)}toggleClass(i){return this.hasClass(i)?this.removeClass(i):this.addClass(i)}};function r(t,i,e){if(typeof t=="string")if(t==="center")t=(i-e)/2|0;else if(t==="right"||t==="bottom")t=i-e;else{let o=parseFloat(t);(""+o!==t&&t.substring((""+o).length))==="%"?t=i/100*o|0:t=o}return t}function Ti(){v=document.body,v[L="requestFullscreen"]||v[L="msRequestFullscreen"]||v[L="webkitRequestFullscreen"]||v[L="mozRequestFullscreen"]||(L=""),Ni=L&&L.replace("request","exit").replace("mozRequest","mozCancel").replace("Request","Exit"),m(window,"resize",function(){Di(),si()}),Di()}function _i(t){k(t,"drag"),k(t,"n"),k(t,"s"),k(t,"w"),k(t,"e"),k(t,"nw"),k(t,"ne"),k(t,"se"),k(t,"sw"),m(p(t.dom,"wb-min"),"click",function(i){P(i),t.min?t.focus().restore():t.blur().minimize()}),m(p(t.dom,"wb-max"),"click",function(i){t.max?t.restore():t.maximize()}),L?m(p(t.dom,"wb-full"),"click",function(i){t.fullscreen()}):t.addClass("no-full"),m(p(t.dom,"wb-close"),"click",function(i){P(i),t.close()||(t=null)}),m(t.dom,"click",function(i){t.focus()})}function $(t){G.splice(G.indexOf(t),1),si(),t.removeClass("min"),t.min=!1,t.dom.title=""}function si(){let t=G.length,i={},e={};for(let o=0,n,s;o<t;o++)n=G[o],s=(n.left||n.right)+":"+(n.top||n.bottom),e[s]?e[s]++:(i[s]=0,e[s]=1);for(let o=0,n,s,u;o<t;o++)n=G[o],s=(n.left||n.right)+":"+(n.top||n.bottom),u=Math.min((D-n.left-n.right)/e[s],250),n.resize(u+1|0,n.header,!0).move(n.left+i[s]*u|0,N-n.bottom-n.header,!0),i[s]++}function k(t,i){let e=p(t.dom,"wb-"+i);if(!e)return;let o,n,s,u,h,z,j=0;m(e,"mousedown",Z),m(e,"touchstart",Z,q);function T(){u=requestAnimationFrame(T),z&&(t.resize(),z=!1),h&&(t.move(),h=!1)}function Z(d){if(P(d),t.focus(),i==="drag"){if(t.min){t.restore();return}let C=Date.now(),w=C-j;if(j=C,w<300&&!t.dom.classList.contains("no-max")){t.max?t.restore():t.maximize();return}}!t.max&&!t.min&&(oi(v,"wb-lock"),V&&T(),(o=d.touches)&&(o=o[0])?(d=o,m(window,"touchmove",_,q),m(window,"touchend",O,q)):(m(window,"mousemove",_),m(window,"mouseup",O)),n=d.pageX,s=d.pageY)}function _(d){P(d),o&&(d=d.touches[0]);let C=d.pageX,w=d.pageY,b=C-n,x=w-s,A=t.width,M=t.height,y=t.x,X=t.y,f,g,a,c;i==="drag"?(t.x+=b,t.y+=x,a=c=1):(i==="e"||i==="se"||i==="ne"?(t.width+=b,f=1):(i==="w"||i==="sw"||i==="nw")&&(t.x+=b,t.width-=b,f=1,a=1),i==="s"||i==="se"||i==="sw"?(t.height+=x,g=1):(i==="n"||i==="ne"||i==="nw")&&(t.y+=x,t.height-=x,g=1,c=1)),f&&(t.width=Math.max(Math.min(t.width,t.maxwidth,D-t.x-t.right),t.minwidth),f=t.width!==A),g&&(t.height=Math.max(Math.min(t.height,t.maxheight,N-t.y-t.bottom),t.minheight),g=t.height!==M),(f||g)&&(V?z=!0:t.resize()),a&&(t.x=Math.max(Math.min(t.x,D-t.width-t.right),t.left),a=t.x!==y),c&&(t.y=Math.max(Math.min(t.y,N-t.height-t.bottom),t.top),c=t.y!==X),(a||c)&&(V?h=!0:t.move()),(f||a)&&(n=C),(g||c)&&(s=w)}function O(d){P(d),ni(v,"wb-lock"),V&&cancelAnimationFrame(u),o?(W(window,"touchmove",_,q),W(window,"touchend",O,q)):(W(window,"mousemove",_),W(window,"mouseup",O))}}function Di(){let t=document.documentElement;D=t.clientWidth,N=t.clientHeight}function Ei(){return document.fullscreen||document.fullscreenElement||document.webkitFullscreenElement||document.mozFullScreenElement}function K(){if(F.full=!1,Ei())return document[Ni](),!0}})();
