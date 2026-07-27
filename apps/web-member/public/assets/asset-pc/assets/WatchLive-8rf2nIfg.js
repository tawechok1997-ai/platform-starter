import{b7 as e,r as f,t as J}from"./vendor-DgdRZPFd.js";import{n as k}from"./vendor-emotion-styled-CRNCxoVp.js";import{g as p,a as E}from"./vendor-lodash-Cj-dpfsX.js";import{u as x,a as R}from"./vendor-react-redux-DBOIg0vb.js";import{u as w}from"./vendor-i18next-c-qQjKpv.js";import{b as g}from"./vendor-clsx-BBInnJV-.js";import{h as Y,i as K}from"./vendor-react-icons-4OxeM6v5.js";import{G as Q,H as U,J as X,s as F,o as v,N as ee,K as te,T as se,M as oe}from"./index-BWz46_jw.js";import{L as C}from"./vendor-react-router-dom-B-H9ZiVb.js";import{P as ie,f as ae,N as ne,a as re,E as ce,L as le,e as de,d as pe,C as xe}from"./Header-C3h_mwXy.js";import{a as P,b as T}from"./vendor-emotion-react-LSfKZge4.js";const me=k.div`
  .bg-light {
    animation: bg-light-keys 6s ease-out infinite;
  }

  @keyframes bg-light-keys {
    10%,
    0% {
      background-color: ${t=>t.bg};
    }
    50% {
      background-color: ${t=>t.bg2};
    }
    90%,
    100% {
      background-color: ${t=>t.bg};
    }
  }
`;function he(){const{t}=w(),i=x(o=>p(o,"setting.color",{})),a=[1e3,1500,2e3,2500,3e3,3500,4e3],l=()=>{const o=Math.floor(Math.random()*a.length);return a[o]};return e.jsxs(me,{bg:i.desktop.allianceBg,bg2:i.desktop.allianceBg2,className:"w-[1440px] mx-auto pt-16 pb-10 z-10",children:[e.jsxs("div",{className:"text-xl font-semibold mb-5",children:[t("home.alliance.prefix"),t("home.alliance.suffix")]}),e.jsx("div",{className:"flex gap-[20px] items-center pt-3",children:fe.map((o,r)=>e.jsx("div",{className:"w-[102px] py-[7px] rounded-[5px] bg-light",style:{animationDelay:`${l()}ms`},children:e.jsx("img",{loading:"lazy",className:"h-[10px] mx-auto",alt:`Image ${r+1}`,src:`/images/alliance/${o}.webp`},r)},r))}),e.jsx("div",{className:"flex gap-[20px] items-center pt-3 justify-center",children:ge.map((o,r)=>e.jsx("div",{className:"w-[102px] py-[7px] rounded-[5px] bg-light",style:{animationDelay:`${l()}ms`},children:e.jsx("img",{loading:"lazy",className:"h-[10px] mx-auto",alt:`Image ${r+1}`,src:`/images/alliance/${o}.webp`},r)},r))})]})}const fe=["evoplay","cq9","jili","playstar","joker","ebet","popk","evoplay","cq9","jili","playstar","joker"],ge=["jili","playstar","evoplay","ebet","popk","cq9","evoplay","jili","playstar","joker","evoplay"],ue=k.div`
  .contact-btn {
    height: 72px;
    width: 72px;
    border-radius: 50%;
    background-color: #07183b;
    box-shadow: inset 0 2px 4px #dbe5ff, inset 0 -2px 2px #152d5d,
      0 4px 4px #00000040;
    animation: contact-btn-keys 2s ease-in-out infinite;
    transition: all 0.2s;
  }
  @keyframes contact-btn-keys {
    0% {
      height: 72px;
      width: 72px;
      background-color: #030718;
    }
    10% {
      height: 67px;
      width: 67px;
      background-color: #135ed1;
    }
    20% {
      height: 67px;
      width: 67px;
      background-color: #135ed1;
    }
    25% {
      height: 77px;
      width: 77px;
      background-color: #135ed1;
    }
    35% {
      height: 72px;
      width: 72px;
      background-color: #030718;
    }
    55% {
      height: 72px;
      width: 72px;
      background-color: #030718;
    }
    100% {
      height: 72px;
      width: 72px;
      background-color: #07183b;
    }
  }

  .contact-icon-btn {
    animation: contact-icon-btn-keys 2s ease-in-out infinite;
    transition: all 0.2s;
  }
  @keyframes contact-icon-btn-keys {
    0%,
    9% {
      mix-blend-mode: normal;
    }
    10%,
    34% {
      mix-blend-mode: plus-lighter;
    }
    35%,
    100% {
      mix-blend-mode: normal;
    }
  }

  .contact-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    transition: all 0.1s;
    border-color: #ffffff;
  }

  .contact-ring-1 {
    height: 82px;
    width: 82px;
    animation: contact-ring-keys-1 2s linear infinite;
  }

  .contact-ring-2 {
    height: 112px;
    width: 112px;
    animation: contact-ring-keys-2 2s linear infinite;
  }

  .contact-ring-3 {
    height: 132px;
    width: 132px;
    animation: contact-ring-keys-3 2s linear infinite;
  }

  @keyframes contact-ring-keys-1 {
    0%,
    15% {
      opacity: 0;
    }
    30% {
      opacity: 1;
      border-width: 2px;
      box-shadow: 0 0 12px #ffffff;
    }
    45% {
      opacity: 1;
      border-width: 6px;
      filter: blur(2px);
    }
    60% {
      opacity: 0.3;
      border-width: 0.5px;
      filter: blur(1px);
    }
    75%,
    100% {
      opacity: 0;
    }
  }

  @keyframes contact-ring-keys-2 {
    0%,
    30% {
      opacity: 0;
    }
    45% {
      opacity: 0.7;
      border-width: 1px;
      filter: blur(1px);
    }
    60% {
      opacity: 0.7;
      border-width: 4px;
      filter: blur(2px);
    }
    75% {
      opacity: 0.2;
      border-width: 0.5px;
      filter: blur(1px);
    }
    80%,
    100% {
      opacity: 0;
    }
  }

  @keyframes contact-ring-keys-3 {
    0%,
    30% {
      opacity: 0;
    }
    45% {
      opacity: 0.5;
      border-width: 0.5px;
      filter: blur(1px);
    }
    60% {
      opacity: 0.3;
      border-width: 1px;
      filter: blur(1px);
    }
    75% {
      opacity: 0.3;
      border-width: 2px;
      filter: blur(2px);
    }
    90% {
      opacity: 0.1;
      border-width: 0.5px;
      filter: blur(1px);
    }
    95%,
    100% {
      opacity: 0;
    }
  }

  .contact-name-shadow {
    text-shadow: 0.3px 0.3px 2px #000;
  }
`;function be(){x(c=>p(c,"setting.color",{}));const t=x(c=>p(c,"setting.agent",{})),i=x(c=>p(c,"setting.lobby",{})),[a,l]=f.useState([]),[o,r]=f.useState(!1),[$,L]=f.useState(!1),N=`https://cdn.zabbet.com/${t.agent_code}/lobby_settings/`;f.useEffect(()=>{O()},[]);const O=()=>{var _;const c=[];for(const[m,h]of Object.entries(i))["provider_contact"].includes(m)&&h.value&&h.is_active&&c.push(h);const y=E(JSON.parse(((_=c[0])==null?void 0:_.value)||"[]"),m=>m.sort_contact).sort((m,h)=>m.main===1&&h.main!==1?-1:m.main!==1&&h.main===1?1:m.sort_contact-h.sort_contact);l(y)},d=async()=>{o?r(!1):setTimeout(()=>{r(!0)},100)};return e.jsxs(ue,{className:"fixed bottom-3 right-3 z-[200] pointer-events-none",children:[e.jsx("div",{className:"flex justify-center items-center pb-4 pointer-events-auto",children:e.jsx(Q,{})}),e.jsx("div",{className:g("flex flex-col w-fit mx-auto",o?"gap-4":"pointer-events-none"),children:a==null?void 0:a.filter(c=>c.status===1).map((c,j,y)=>e.jsx("a",{href:c.url||"#",target:"_blank",className:g("contact relative duration-200 ease-out",o?"pointer-events-auto":"opacity-0 h-0"),style:{transitionDelay:o?`${(y.length-j-1)*40}ms`:"0ms"},children:e.jsx("img",{loading:"lazy",className:g("w-[60px] h-[60px] duration-200 ease-out",!o&&"translate-y-[50%] scale-0"),style:{transitionDelay:o?`${(y.length-j-1)*40}ms`:"0ms"},src:c.icon.includes("images/")?"/"+c.icon:N+c.icon})},j))}),e.jsxs("div",{className:g("relative content-center w-[132px] h-[132px]","cursor-pointer duration-300",$?"cursor-not-allowed":"cursor-pointer"),children:[e.jsx("div",{className:"contact-ring contact-ring-1 pointer-events-auto",onClick:d}),e.jsx("div",{className:"contact-ring contact-ring-2"}),e.jsx("div",{className:"contact-ring contact-ring-3"}),e.jsxs("div",{className:"relative mx-auto contact-btn",children:[e.jsx("img",{loading:"lazy",className:`contact-icon-btn w-full h-full p-[4px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 duration-300 ${o?"opacity-0 rotate-90":"opacity-100"}`,src:"/images/footer/contact/icon-open-gold.webp"}),e.jsx(U,{className:`!w-full !h-full p-[6px] duration-300 ${o?"opacity-100 rotate-90":"opacity-0 "}`,children:e.jsx(Y.Provider,{value:{color:"white"},children:e.jsx(K,{})})})]})]})]})}function ve(){var z,S,D,I;const{t}=w(),i=R(),a=x(s=>p(s,"setting.color",{})),l=x(s=>p(s,"user.isLogin",!1)),o=x(s=>p(s,"setting.agent",{})),r=x(s=>p(s,"setting.lobby",{})),[$,L]=f.useState([]),[N,O]=f.useState([]),[d,c]=f.useState(null),j=`https://cdn.zabbet.com/${o.agent_code}/lobby_settings/${l?(z=r==null?void 0:r.logo_after)==null?void 0:z.value:(S=r==null?void 0:r.logo_before)==null?void 0:S.value}`,y=`https://cdn.zabbet.com/${o.agent_code}/lobby_settings/`;f.useEffect(()=>{h(),m(),_()},[]);const _=async()=>{if((o==null?void 0:o.country)!=="PH")try{const{status:s,data:n}=await X();s===200&&n.success&&L(n.data)}catch{}},m=()=>{var s;try{c(JSON.parse((s=r==null?void 0:r.website_setting)==null?void 0:s.value))}catch{}},h=()=>{var M;const s=[];for(const[u,b]of Object.entries(r))["provider_contact"].includes(u)&&b.value&&b.is_active&&s.push(b);const B=E(JSON.parse(((M=s[0])==null?void 0:M.value)||"[]"),u=>u.sort_contact).sort((u,b)=>u.main===1&&b.main!==1?-1:u.main!==1&&b.main===1?1:u.sort_contact-b.sort_contact);O(B)},G=()=>{i(v({title:t("sidebar_profile.promotion"),icon:e.jsx(ae,{}),body:e.jsx(ie,{}),onClose:!0,isCloseOnClickOutside:!1,fit:!0}))},H=()=>{i(v({type:"default",icon:e.jsx(re,{}),title:t("home.highlight.news"),body:e.jsx(ne,{}),onClose:!0,isCloseOnClickOutside:!1}))},V=()=>{i(v({type:"default",title:t("sidebar_profile.event"),body:e.jsx(ce,{}),onClose:!0,isCloseOnClickOutside:!1}))},Z=()=>{i(v({title:t("sidebar_profile.level"),icon:e.jsx(de,{}),body:e.jsx(le,{}),onClose:!0,isCloseOnClickOutside:!1,fit:!0}))},W=()=>{i(v({title:t("network.title"),icon:e.jsx(ee,{}),body:e.jsx(pe,{}),onClose:!0,isCloseOnClickOutside:!1,fit:!0}))},q=()=>{i(v({title:t("sidebar_profile.commission_income"),icon:e.jsx(te,{}),body:e.jsx(xe,{}),onClose:!0,isCloseOnClickOutside:!1,fit:!0}))},A=()=>{i(v({type:"tab",body:e.jsx(se,{selected:"login"}),onClose:!0}))};return e.jsx("div",{className:"w-full relative",style:{background:`linear-gradient(180deg, ${a.desktop.footer.bg} 0%, ${a.desktop.footer.bg2} 100%)`},children:e.jsxs("div",{className:"w-[1440px] mx-auto py-8",children:[e.jsxs("div",{className:"grid grid-cols-none grid-flow-col gap-[56px]",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-[#7CA9B7] font-semibold text-sm",children:(d==null?void 0:d.site_title)||t("footer.about")}),!!(d!=null&&d.footer_description)&&e.jsx("div",{className:"mt-3 text-[#B8B8B8] font-normal text-base",children:d==null?void 0:d.footer_description})]}),e.jsxs("div",{children:[e.jsxs("div",{className:"text-[#7CA9B7] font-normal text-sm",children:[e.jsx("span",{className:"font-semibold",children:t("footer.license_certificate")})," ",t("footer.license_certificate_inner")]}),e.jsx("div",{className:"mt-3 flex gap-6 items-center",children:je.map((s,n)=>e.jsx("img",{loading:"lazy",className:"max-h-[32px]",alt:`Image ${n+1}`,src:`/images/footer/${s}.webp`},n))}),e.jsxs("div",{className:"flex mt-8 gap-12",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-[#7CA9B7] font-semibold text-sm",children:t("footer.security")}),e.jsx("div",{className:"mt-3 flex gap-6 items-center",children:ye.map((s,n)=>e.jsx("img",{loading:"lazy",className:"max-h-[32px]",alt:`Image ${n+1}`,src:`/images/footer/${s}.webp`},n))})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-[#7CA9B7] font-semibold text-sm",children:t("footer.responsible_bet")}),e.jsx("div",{className:"mt-3 flex gap-6 items-center",children:Ce.map((s,n)=>e.jsx("img",{loading:"lazy",className:"max-h-[32px]",alt:`Image ${n+1}`,src:`/images/footer/${s}.webp`},n))})]})]})]}),e.jsxs("div",{className:"flex w-fit 3xl:mx-auto",children:[e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx("div",{className:"text-[#7CA9B7] font-semibold text-sm",children:t("game.game")}),e.jsxs("div",{className:"text-[#B8B8B8] font-normal text-base flex flex-col gap-3",onClick:()=>{F()},children:[e.jsx(C,{to:"/home/casino",className:"cursor-pointer",children:t("sidebar.casino")}),e.jsx(C,{to:"/home/slot",className:"cursor-pointer",children:t("sidebar.slot")}),e.jsx(C,{to:"/home/fishing",className:"cursor-pointer",children:t("sidebar.fishing")}),e.jsx(C,{to:"/home/sport",className:"cursor-pointer",children:t("sidebar.sport")}),e.jsx(C,{to:"/home/card",className:"cursor-pointer",children:t("sidebar.card")}),e.jsx(C,{to:"/home/lotto",className:"cursor-pointer",children:t("sidebar.lotto")})]})]}),e.jsxs("div",{className:"flex flex-col gap-3 ml-20",children:[e.jsx("div",{className:"text-[#7CA9B7] font-semibold text-sm",children:t("footer.information")}),e.jsxs("div",{className:"text-[#B8B8B8] font-normal text-base flex flex-col gap-3",children:[e.jsx("div",{className:"cursor-pointer",onClick:G,children:t("sidebar_profile.promotion")}),e.jsx("div",{className:"cursor-pointer",onClick:H,children:t("sidebar_profile.news")}),e.jsx("div",{className:"cursor-pointer",onClick:V,children:t("sidebar_profile.event")}),e.jsx("div",{className:"cursor-pointer",onClick:Z,children:t("sidebar_profile.level")}),e.jsx("div",{className:"cursor-pointer",onClick:l?W:A,children:t("sidebar_profile.network_income")}),e.jsx("div",{className:"cursor-pointer",onClick:l?q:A,children:t("sidebar_profile.commission_from_income")})]})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"text-[#7CA9B7] font-semibold text-sm",children:t("footer.contact_as")}),e.jsx("div",{className:"mt-3 flex gap-6 flex-wrap items-center",children:N==null?void 0:N.filter(s=>s.status===1).map((s,n)=>e.jsx("a",{href:s.url||"#",target:"_blank",children:e.jsx("img",{loading:"lazy",className:"h-[32px] cursor-pointer",alt:`Image ${n+1}`,src:s.icon.includes("images/")?"/"+s.icon:y+s.icon},n)},n))})]})]}),e.jsx("hr",{className:"my-8",style:{borderColor:(D=a==null?void 0:a.primary)==null?void 0:D.text_allowed}}),e.jsxs("div",{children:[e.jsx("div",{className:"font-semibold text-sm text-center opacity-80",style:{color:(I=a==null?void 0:a.primary)==null?void 0:I.text_allowed},children:t("footer.payment_method")}),e.jsx("div",{className:"mt-3 flex flex-wrap gap-4 items-center justify-center",children:(o==null?void 0:o.country)==="PH"?["/images/deposit/method/gcash.webp","/images/deposit/method/gcash_qr.webp","/images/deposit/method/maya.webp"].map((s,n)=>{var B;return e.jsxs("div",{className:"relative inline-block max-h-[40px]",children:[e.jsx("img",{loading:"lazy",className:"max-h-[40px] object-cover rounded-full",alt:`Image ${n+1}`,src:s}),e.jsx("div",{className:"absolute inset-0 opacity-50",style:{mixBlendMode:"overlay",background:(B=a==null?void 0:a.primary)==null?void 0:B.dark}})]},n)}):$.map((s,n)=>e.jsx("div",{className:"relative inline-block max-h-[32px] rounded-full",children:e.jsx("img",{loading:"lazy",className:"max-h-[32px] rounded-full brightness-75",src:`/images/banks/${o.country}/${s.abbreviation}.webp`,alt:s.abbreviation})},n))})]}),e.jsxs("div",{className:"flex gap-5 items-end mt-12",children:[e.jsx("img",{loading:"lazy",className:"max-h-[25px]",src:j,alt:"logo"}),e.jsxs("div",{className:"font-normal text-sm text-white opacity-50",children:["Copyright © ",o.domain_lobby,", All Rights Reserved."]})]})]})})}const je=["GC-icon 2","iTech","GamingLab","BBM-Cert","Iovation"],ye=["GO DADDY","Group 48102721"],Ce=["18","gamecare","be-gamble-aware"];function Ge(){return e.jsxs(e.Fragment,{children:[e.jsx(be,{}),e.jsx(he,{}),e.jsx(ve,{})]})}const ke=k.div`
  animation: spin 0.7s linear infinite;

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`,Ne=T`
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
`,we=k.div`
  height: fit-content;
  width: 100%;
  position: relative;
  overflow: hidden;
  z-index: 0;
  border-radius: 4.5px;
  /* filter: blur(8px); */

  &::before {
    content: "";
    z-index: -2;
    text-align: center;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: absolute;
    width: 100vw;
    height: 100vh;
    background-repeat: no-repeat;
    background-position: 0 0;
    background-image: ${({reduxColor:t})=>`
    conic-gradient(
      ${t.primary.dark},
      ${t.primary.light},
      #ffffff,
      ${t.primary.light},
      ${t.primary.dark} 80%
    );
  `};

    animation: ${Ne} 800ms infinite reverse;
  }
`,_e=k.div`
  ${({reduxColor:t})=>P`
      height: 100%;
      width: 100%;
      position: relative;
      overflow: hidden;
      z-index: 0;
      border-radius: 3.5px;
      background: linear-gradient(
        165.34deg,
        ${t.primary.light} -17.16%,
        ${t.primary.dark} 91.36%
      );
    `}
`,Be=k.div`
  ${({reduxColor:t})=>{const i=T`
      0% {
      opacity: 1;
      background: ${t.live.button.bg};
      }
     
      80% {
        opacity: 0.7;
        background:transparent;
      } 
    `;return P`
      height: 100%;
      width: 100%;
      position: relative;
      overflow: hidden;
      z-index: 0;
      border-radius: 3.5px;

      &::before {
        content: "";
        z-index: -2;
        text-align: center;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        position: absolute;
        width: 100vw;
        height: 100vh;
        background-repeat: no-repeat;
        background-position: 0 0;

        animation: ${i} 800ms infinite;
      }

      &::after {
        content: "";
        position: absolute;
        z-index: -1;
        left: 2px;
        top: 2px;
        width: calc(100% - 4px);
        height: calc(100% - 4px);
        border-radius: 3px;
      }
    `}}
`;function He({type:t}){const i=x(o=>p(o,"setting.color",{})),{t:a}=w(),l=J();return e.jsx(we,{reduxColor:i,onClick:()=>{F(),l("/home/sport")},children:e.jsx("div",{className:"flex justify-center items-center rounded-[5px] cursor-pointer p-0.5",children:e.jsx(_e,{reduxColor:i,children:e.jsxs(Be,{className:"flex justify-center items-center  py-[6px]",reduxColor:i,children:[e.jsx("div",{className:g(t==="table"?"text-[14px] pr-1":"text-xs xs:text-[13px] sm:text-sm","font-bold text-center"),children:a("sport_live.bet_now")}),e.jsx("div",{children:e.jsx(ke,{children:e.jsx("div",{children:e.jsx($e,{})})})})]})})})})}const $e=()=>e.jsxs("svg",{width:"15",height:"16",viewBox:"0 0 15 16",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("path",{d:"M7.5 14.7778C11.0899 14.7778 14 11.8677 14 8.27783C14 4.68798 11.0899 1.77783 7.5 1.77783C3.91015 1.77783 1 4.68798 1 8.27783C1 11.8677 3.91015 14.7778 7.5 14.7778Z",fill:"#FFCC4D"}),e.jsx("path",{d:"M7.5 14C11.0899 14 14 11.0899 14 7.5C14 3.91015 11.0899 1 7.5 1C3.91015 1 1 3.91015 1 7.5C1 11.0899 3.91015 14 7.5 14Z",fill:"#FFEE57"}),e.jsx("path",{d:"M7.5 2C4.4624 2 2 4.4624 2 7.5C2 10.5376 4.4624 13 7.5 13C10.5376 13 13 10.5376 13 7.5C13 4.4624 10.5376 2 7.5 2ZM7.97492 10.482V11.2566H7.23397V10.4907C6.0181 10.3242 5.48565 9.32513 5.48565 9.32513L6.2425 8.69203C6.2425 8.69203 6.72575 9.53327 7.5999 9.53327C8.08277 9.53327 8.44908 9.2748 8.44908 8.83318C8.44908 7.80085 5.66768 7.9261 5.66768 6.01091C5.66768 5.17837 6.32613 4.57857 7.23359 4.43667V3.66279H7.97454V4.43667C8.60727 4.51992 9.35654 4.85293 9.35654 5.56929V6.11876H8.37416V5.85235C8.37416 5.57761 8.02412 5.39445 7.63245 5.39445C7.13293 5.39445 6.76699 5.64421 6.76699 5.99388C6.76699 7.05119 9.5484 6.79311 9.5484 8.79988C9.5484 9.62485 8.93233 10.3401 7.97492 10.482Z",fill:"#FFCC4D"})]});function Ve(){return e.jsxs("div",{className:"relative",children:[e.jsx("div",{className:g("w-[32px] h-[15px] redLive flex justify-center items-center","text-[13px] font-black")}),e.jsx("div",{className:"absolute top-0 px-0.5 text-xs font-bold",children:"LIVE"})]})}function Ze({title:t,onClick:i}){const{t:a}=w(),l=x(o=>p(o,"setting.color",{}));return e.jsxs("div",{className:g("w-full px-[4px] py-[4px] border rounded-md cursor-pointer","flex justify-center items-center pl-2"),style:{backgroundColor:l.input.bg,borderColor:l.minigame.border},onClick:i,children:[e.jsx("div",{className:"text-[14px] font-bold leading-5",children:a(t)}),e.jsx("div",{className:"scale-75",children:e.jsx(oe,{})})]})}const Oe=()=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:e.jsx("path",{d:"M7 10.5C7.96833 10.5 8.79375 10.1587 9.47625 9.47625C10.1587 8.79375 10.5 7.96833 10.5 7C10.5 6.03167 10.1587 5.20625 9.47625 4.52375C8.79375 3.84125 7.96833 3.5 7 3.5C6.03167 3.5 5.20625 3.84125 4.52375 4.52375C3.84125 5.20625 3.5 6.03167 3.5 7C3.5 7.96833 3.84125 8.79375 4.52375 9.47625C5.20625 10.1587 6.03167 10.5 7 10.5ZM7 14C6.03167 14 5.12167 13.8162 4.27 13.4488C3.41833 13.0813 2.6775 12.5825 2.0475 11.9525C1.4175 11.3225 0.91875 10.5817 0.55125 9.73C0.18375 8.87833 0 7.96833 0 7C0 6.03167 0.18375 5.12167 0.55125 4.27C0.91875 3.41833 1.4175 2.6775 2.0475 2.0475C2.6775 1.4175 3.41833 0.91875 4.27 0.55125C5.12167 0.18375 6.03167 0 7 0C7.96833 0 8.87833 0.18375 9.73 0.55125C10.5817 0.91875 11.3225 1.4175 11.9525 2.0475C12.5825 2.6775 13.0813 3.41833 13.4488 4.27C13.8162 5.12167 14 6.03167 14 7C14 7.96833 13.8162 8.87833 13.4488 9.73C13.0813 10.5817 12.5825 11.3225 11.9525 11.9525C11.3225 12.5825 10.5817 13.0813 9.73 13.4488C8.87833 13.8162 7.96833 14 7 14ZM7 12.6C8.56333 12.6 9.8875 12.0575 10.9725 10.9725C12.0575 9.8875 12.6 8.56333 12.6 7C12.6 5.43667 12.0575 4.1125 10.9725 3.0275C9.8875 1.9425 8.56333 1.4 7 1.4C5.43667 1.4 4.1125 1.9425 3.0275 3.0275C1.9425 4.1125 1.4 5.43667 1.4 7C1.4 8.56333 1.9425 9.8875 3.0275 10.9725C4.1125 12.0575 5.43667 12.6 7 12.6Z",fill:"white"})});function We({onClick:t}){const{t:i}=w();return e.jsxs("div",{className:g("w-full flex justify-center items-center gap-1","rounded-[5px] cursor-pointer bg-[#FF0402] py-[8px] px-[8px]"),onClick:t,children:[e.jsx("div",{className:"text-[14px] font-black",children:i("sport_live.watch_live")}),e.jsx("div",{className:"flex justify-center items-center",children:e.jsx(Oe,{})})]})}export{Ge as F,Ve as S,We as a,He as b,Ze as c};
