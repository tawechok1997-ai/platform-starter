import{O as Q,g as U}from"./vendor-DgdRZPFd.js";var p={},z;function V(){if(z)return p;z=1;function A(r){if(typeof window>"u")return;const u=document.createElement("style");return u.setAttribute("type","text/css"),u.innerHTML=r,document.head.appendChild(u),r}Object.defineProperty(p,"__esModule",{value:!0});var e=Q();function D(r){return r&&typeof r=="object"&&"default"in r?r:{default:r}}var a=D(e);A(`.rfm-marquee-container {
  overflow-x: hidden;
  display: flex;
  flex-direction: row;
  position: relative;
  width: var(--width);
  transform: var(--transform);
}
.rfm-marquee-container:hover div {
  animation-play-state: var(--pause-on-hover);
}
.rfm-marquee-container:active div {
  animation-play-state: var(--pause-on-click);
}

.rfm-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
}
.rfm-overlay::before, .rfm-overlay::after {
  background: linear-gradient(to right, var(--gradient-color), rgba(255, 255, 255, 0));
  content: "";
  height: 100%;
  position: absolute;
  width: var(--gradient-width);
  z-index: 2;
  pointer-events: none;
  touch-action: none;
}
.rfm-overlay::after {
  right: 0;
  top: 0;
  transform: rotateZ(180deg);
}
.rfm-overlay::before {
  left: 0;
  top: 0;
}

.rfm-marquee {
  flex: 0 0 auto;
  min-width: var(--min-width);
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  animation: scroll var(--duration) linear var(--delay) var(--iteration-count);
  animation-play-state: var(--play);
  animation-delay: var(--delay);
  animation-direction: var(--direction);
}
@keyframes scroll {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-100%);
  }
}

.rfm-initial-child-container {
  flex: 0 0 auto;
  display: flex;
  min-width: auto;
  flex-direction: row;
  align-items: center;
}

.rfm-child {
  transform: var(--transform);
}`);const W=e.forwardRef(function({style:u={},className:B="",autoFill:l=!1,play:f=!0,pauseOnHover:w=!1,pauseOnClick:b=!1,direction:n="left",speed:d=50,delay:S=0,loop:q=0,gradient:I=!1,gradientColor:_="white",gradientWidth:v=200,onFinish:L,onCycleComplete:O,onMount:N,children:h},X){const[x,P]=e.useState(0),[y,T]=e.useState(0),[g,C]=e.useState(1),[E,Z]=e.useState(!1),G=e.useRef(null),i=X||G,c=e.useRef(null),m=e.useCallback(()=>{if(c.current&&i.current){const t=i.current.getBoundingClientRect(),R=c.current.getBoundingClientRect();let o=t.width,s=R.width;(n==="up"||n==="down")&&(o=t.height,s=R.height),C(l&&o&&s&&s<o?Math.ceil(o/s):1),P(o),T(s)}},[l,i,n]);e.useEffect(()=>{if(E&&(m(),c.current&&i.current)){const t=new ResizeObserver(()=>m());return t.observe(i.current),t.observe(c.current),()=>{t&&t.disconnect()}}},[m,i,E]),e.useEffect(()=>{m()},[m,h]),e.useEffect(()=>{Z(!0)},[]),e.useEffect(()=>{typeof N=="function"&&N()},[]);const j=e.useMemo(()=>l?y*g/d:y<x?x/d:y/d,[l,x,y,g,d]),J=e.useMemo(()=>Object.assign(Object.assign({},u),{"--pause-on-hover":!f||w?"paused":"running","--pause-on-click":!f||w&&!b||b?"paused":"running","--width":n==="up"||n==="down"?"100vh":"100%","--transform":n==="up"?"rotate(-90deg)":n==="down"?"rotate(90deg)":"none"}),[u,f,w,b,n]),K=e.useMemo(()=>({"--gradient-color":_,"--gradient-width":typeof v=="number"?`${v}px`:v}),[_,v]),k=e.useMemo(()=>({"--play":f?"running":"paused","--direction":n==="left"?"normal":"reverse","--duration":`${j}s`,"--delay":`${S}s`,"--iteration-count":q?`${q}`:"infinite","--min-width":l?"auto":"100%"}),[f,n,j,S,q,l]),M=e.useMemo(()=>({"--transform":n==="up"?"rotate(90deg)":n==="down"?"rotate(-90deg)":"none"}),[n]),$=e.useCallback(t=>[...Array(Number.isFinite(t)&&t>=0?t:0)].map((R,o)=>a.default.createElement(e.Fragment,{key:o},e.Children.map(h,s=>a.default.createElement("div",{style:M,className:"rfm-child"},s)))),[M,h]);return E?a.default.createElement("div",{ref:i,style:J,className:"rfm-marquee-container "+B},I&&a.default.createElement("div",{style:K,className:"rfm-overlay"}),a.default.createElement("div",{className:"rfm-marquee",style:k,onAnimationIteration:O,onAnimationEnd:L},a.default.createElement("div",{className:"rfm-initial-child-container",ref:c},e.Children.map(h,t=>a.default.createElement("div",{style:M,className:"rfm-child"},t))),$(g-1)),a.default.createElement("div",{className:"rfm-marquee",style:k},$(g))):null});return p.default=W,p}var Y=V();const F=U(Y);export{F as M};
