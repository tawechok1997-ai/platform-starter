const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/vendor-sweetalert2-BcPeYCKr.js","assets/vendor-DgdRZPFd.js","assets/vendor-lodash-Cj-dpfsX.js"])))=>i.map(i=>d[i]);
import{_ as l}from"./index-BWz46_jw.js";import{b7 as t}from"./vendor-DgdRZPFd.js";import{n as c}from"./vendor-emotion-styled-CRNCxoVp.js";import{t as s}from"./vendor-i18next-c-qQjKpv.js";import{g as d}from"./vendor-lodash-Cj-dpfsX.js";import{M as x}from"./vendor-react-icons-4OxeM6v5.js";import{u as m}from"./vendor-react-redux-DBOIg0vb.js";import{W as i,X as p}from"./vendor-headlessui-react-BB503UhP.js";c.div`
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
`;const v=async a=>{const[{default:n},{default:o}]=await Promise.all([l(()=>import("./vendor-sweetalert2-BcPeYCKr.js").then(r=>r.s),__vite__mapDeps([0,1,2])),l(()=>import("./vendor-sweetalert2-BcPeYCKr.js").then(r=>r.a),__vite__mapDeps([0,1,2]))]),e=o(n);a?e.fire({title:t.jsxs("div",{className:"text-2xl xs:text-4xl sm:text-5xl lg:text-6xl text-[#EFC13E] font-NotoSans",onClick:()=>e.close(),children:[t.jsx("span",{className:"inline-block mb-2",children:s("event.predict_win")})," ",t.jsx("span",{className:"inline-block mb-2",children:s("event.win_detail")})]}),width:"90vw",background:"transparent",backdrop:"rgba(0,0,0,0.8)",showConfirmButton:!1}):e.fire({title:t.jsxs("div",{className:"text-2xl xs:text-4xl sm:text-5xl lg:text-6xl text-red-500 font-NotoSans",onClick:()=>e.close(),children:[t.jsx("span",{className:"inline-block mb-2",children:s("event.predict_lose")})," ",t.jsx("span",{className:"inline-block mb-2",children:s("event.lose_detail")})]}),width:"90vw",background:"transparent",backdrop:"rgba(0,0,0,0.8)",showConfirmButton:!1})};function N({children:a,title:n}){const o=m(e=>d(e,"setting.color",{}));return t.jsx(t.Fragment,{children:t.jsx("div",{className:"mb-3",children:t.jsx(i,{children:({open:e})=>t.jsxs(t.Fragment,{children:[t.jsxs(i.Button,{className:`w-full text-left p-3 font-bold flex justify-between text-[14px] ${e?"rounded-t-[4px]":"rounded-[4px]"}`,style:{backgroundColor:o.background.button},children:[n,t.jsx(x,{className:`text-[14px] ${e?"rotate-180 transform":""} h-5 w-5`})]}),t.jsx(p,{enter:"transition duration-100 ease-out",enterFrom:"transform scale-95 opacity-0",enterTo:"transform scale-100 opacity-100",leave:"transition duration-75 ease-out",leaveFrom:"transform scale-100 opacity-100",leaveTo:"transform scale-95 opacity-0",children:t.jsx(i.Panel,{className:"p-4 text-white rounded-b-[4px] text-[14px]",static:!0,style:{background:o.accordion.bg},children:a||t.jsx(t.Fragment,{})})})]})})})})}const b=(a,n)=>a?a(`month_array.${n-1}`):"",C=(a,n)=>{n.prototype.dataByLang=function(o){const e=this.add(o("key")==="th"?543:0,"year").year(),r=b(o,this.month()+1);return`${this.date()} ${r} ${e}`}};export{N as A,v as R,C as d};
