const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/sweetalert2.all-BlbzdLFz.js","assets/swiper-vendor-DFMl7zF8.js","assets/swiper-vendor-BObAj_lu.css","assets/sweetalert2-react-content.es-Dcvv1oUc.js","assets/index-DRQdwWX3.js","assets/index-CPY9QRbs.css"])))=>i.map(i=>d[i]);
import{_ as i,j as t,U as o,n as c,u as d,g as x}from"./index-DRQdwWX3.js";import{W as l,M as m,X as b}from"./index-Cvj0j1lz.js";c.div`
  text-align: center;
  letter-spacing: 5px;
  font-weight: bold;
  background-image: linear-gradient(
    3deg,
    #462523 0,
    #cb9b51 22%,
    #f6e27a 45%,
    #f6f2c0 50%,
    #f6e27a 55%,
    #cb9b51 78%,
    #462523 100%
  );
  color: transparent;
  -webkit-background-clip: text;
`;c.div`
  text-align: center;
  letter-spacing: 5px;
  font-weight: bold;
  background-image: linear-gradient(
    3deg,
    #4a0b0b 0,
    #cb5151 22%,
    #f67a7a 45%,
    #d18a8a 50%,
    #f67a7a 55%,
    #cb5151 78%,
    #4a0b0b 100%
  );
  color: transparent;
  -webkit-background-clip: text;
`;const h=async a=>{const[{default:n},{default:s}]=await Promise.all([i(()=>import("./sweetalert2.all-BlbzdLFz.js").then(r=>r.s),__vite__mapDeps([0,1,2])),i(()=>import("./sweetalert2-react-content.es-Dcvv1oUc.js"),__vite__mapDeps([3,1,2,4,5]))]),e=s(n);a?e.fire({title:t.jsxs("div",{className:"text-2xl xs:text-4xl sm:text-5xl lg:text-6xl text-[#EFC13E] font-NotoSans",onClick:()=>e.close(),children:[t.jsx("span",{className:"inline-block mb-2",children:o("event.predict_win")})," ",t.jsx("span",{className:"inline-block mb-2",children:o("event.win_detail")})]}),width:"90vw",background:"transparent",backdrop:"rgba(0,0,0,0.8)",showConfirmButton:!1}):e.fire({title:t.jsxs("div",{className:"text-2xl xs:text-4xl sm:text-5xl lg:text-6xl text-red-500 font-NotoSans",onClick:()=>e.close(),children:[t.jsx("span",{className:"inline-block mb-2",children:o("event.predict_lose")})," ",t.jsx("span",{className:"inline-block mb-2",children:o("event.lose_detail")})]}),width:"90vw",background:"transparent",backdrop:"rgba(0,0,0,0.8)",showConfirmButton:!1})};function w({children:a,title:n}){const s=d(e=>x(e,"setting.color",{}));return t.jsx(t.Fragment,{children:t.jsx("div",{className:"mb-3",children:t.jsx(l,{children:({open:e})=>t.jsxs(t.Fragment,{children:[t.jsxs(l.Button,{className:`w-full text-left p-3 font-bold flex justify-between text-[14px] ${e?"rounded-t-[4px]":"rounded-[4px]"}`,style:{backgroundColor:s.background.button},children:[n,t.jsx(m,{className:`text-[14px] ${e?"rotate-180 transform":""} h-5 w-5`})]}),t.jsx(b,{enter:"transition duration-100 ease-out",enterFrom:"transform scale-95 opacity-0",enterTo:"transform scale-100 opacity-100",leave:"transition duration-75 ease-out",leaveFrom:"transform scale-100 opacity-100",leaveTo:"transform scale-95 opacity-0",children:t.jsx(l.Panel,{className:"p-4 text-white rounded-b-[4px] text-[14px]",static:!0,style:{background:s.accordion.bg},children:a||t.jsx(t.Fragment,{})})})]})})})})}const p=(a,n)=>a?a(`month_array.${n-1}`):"",y=(a,n)=>{n.prototype.dataByLang=function(s){const e=this.add(s("key")==="th"?543:0,"year").year(),r=p(s,this.month()+1);return`${this.date()} ${r} ${e}`}};export{w as A,h as R,y as d};
