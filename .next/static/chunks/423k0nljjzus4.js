(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,33525,(e,t,n)=>{"use strict";Object.defineProperty(n,"__esModule",{value:!0}),Object.defineProperty(n,"warnOnce",{enumerable:!0,get:function(){return a}});let a=e=>{}},18967,(e,t,n)=>{"use strict";Object.defineProperty(n,"__esModule",{value:!0});var a={DecodeError:function(){return y},MiddlewareNotFoundError:function(){return x},MissingStaticPage:function(){return w},NormalizeError:function(){return b},PageNotFoundError:function(){return v},SP:function(){return f},ST:function(){return g},WEB_VITALS:function(){return i},execOnce:function(){return s},getDisplayName:function(){return d},getLocationOrigin:function(){return c},getURL:function(){return m},isAbsoluteUrl:function(){return l},isResSent:function(){return u},loadGetInitialProps:function(){return h},normalizeRepeatedSlashes:function(){return p},stringifyError:function(){return E}};for(var r in a)Object.defineProperty(n,r,{enumerable:!0,get:a[r]});let i=["CLS","FCP","FID","INP","LCP","TTFB"];function s(e){let t,n=!1;return(...a)=>(n||(n=!0,t=e(...a)),t)}let o=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/,l=e=>o.test(e);function c(){let{protocol:e,hostname:t,port:n}=window.location;return`${e}//${t}${n?":"+n:""}`}function m(){let{href:e}=window.location,t=c();return e.substring(t.length)}function d(e){return"string"==typeof e?e:e.displayName||e.name||"Unknown"}function u(e){return e.finished||e.headersSent}function p(e){let t=e.split("?");return t[0].replace(/\\/g,"/").replace(/\/\/+/g,"/")+(t[1]?`?${t.slice(1).join("?")}`:"")}async function h(e,t){let n=t.res||t.ctx&&t.ctx.res;if(!e.getInitialProps)return t.ctx&&t.Component?{pageProps:await h(t.Component,t.ctx)}:{};let a=await e.getInitialProps(t);if(n&&u(n))return a;if(!a)throw Object.defineProperty(Error(`"${d(e)}.getInitialProps()" should resolve to an object. But found "${a}" instead.`),"__NEXT_ERROR_CODE",{value:"E1025",enumerable:!1,configurable:!0});return a}let f="u">typeof performance,g=f&&["mark","measure","getEntriesByName"].every(e=>"function"==typeof performance[e]);class y extends Error{}class b extends Error{}class v extends Error{constructor(e){super(),this.code="ENOENT",this.name="PageNotFoundError",this.message=`Cannot find module for page: ${e}`}}class w extends Error{constructor(e,t){super(),this.message=`Failed to load static file for page: ${e} ${t}`}}class x extends Error{constructor(){super(),this.code="ENOENT",this.message="Cannot find the middleware module"}}function E(e){return JSON.stringify({message:e.message,stack:e.stack})}},98183,(e,t,n)=>{"use strict";Object.defineProperty(n,"__esModule",{value:!0});var a={assign:function(){return l},searchParamsToUrlQuery:function(){return i},urlQueryToSearchParams:function(){return o}};for(var r in a)Object.defineProperty(n,r,{enumerable:!0,get:a[r]});function i(e){let t={};for(let[n,a]of e.entries()){let e=t[n];void 0===e?t[n]=a:Array.isArray(e)?e.push(a):t[n]=[e,a]}return t}function s(e){return"string"==typeof e?e:("number"!=typeof e||isNaN(e))&&"boolean"!=typeof e?"":String(e)}function o(e){let t=new URLSearchParams;for(let[n,a]of Object.entries(e))if(Array.isArray(a))for(let e of a)t.append(n,s(e));else t.set(n,s(a));return t}function l(e,...t){for(let n of t){for(let t of n.keys())e.delete(t);for(let[t,a]of n.entries())e.append(t,a)}return e}},97815,e=>{"use strict";var t=e.i(43476),n=e.i(71645),a=e.i(17927);let r=(0,n.createContext)({user:null,loading:!0,needsOnboarding:!1,authUserId:null,setUser:()=>{},signOut:async()=>{}});e.s(["AuthProvider",0,function({children:e}){let[i,s]=(0,n.useState)(null),[o,l]=(0,n.useState)(!0),[c,m]=(0,n.useState)(!1),[d,u]=(0,n.useState)(null);async function p(){let e=(0,a.createClient)();await e.auth.signOut(),s(null),m(!1),u(null)}return(0,n.useEffect)(()=>{let e=(0,a.createClient)();async function t(t){u(t);let{data:n}=await e.from("users").select("*").eq("id",t).maybeSingle();n?(s(n),m(!1)):(s(null),m(!0)),l(!1)}let{data:{subscription:n}}=e.auth.onAuthStateChange(async(e,n)=>{"INITIAL_SESSION"===e?n?.user?await t(n.user.id):l(!1):"SIGNED_IN"===e&&n?.user?await t(n.user.id):"SIGNED_OUT"===e&&(s(null),m(!1),u(null),l(!1))});return()=>n.unsubscribe()},[]),(0,t.jsx)(r.Provider,{value:{user:i,loading:o,needsOnboarding:c,authUserId:d,setUser:function(e){s(e),null!==e&&m(!1)},signOut:p},children:e})},"useAuth",0,function(){return(0,n.useContext)(r)}])},5766,e=>{"use strict";let t,n;var a,r=e.i(71645);let i={data:""},s=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,o=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,c=(e,t)=>{let n="",a="",r="";for(let i in e){let s=e[i];"@"==i[0]?"i"==i[1]?n=i+" "+s+";":a+="f"==i[1]?c(s,i):i+"{"+c(s,"k"==i[1]?"":t)+"}":"object"==typeof s?a+=c(s,t?t.replace(/([^,])+/g,e=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)):i):null!=s&&(i="-"==i[1]?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),r+=c.p?c.p(i,s):i+":"+s+";")}return n+(t&&r?t+"{"+r+"}":r)+a},m={},d=e=>{if("object"==typeof e){let t="";for(let n in e)t+=n+d(e[n]);return t}return e};function u(e){let t,n,a=this||{},r=e.call?e(a.p):e;return((e,t,n,a,r)=>{var i;let u=d(e),p=m[u]||(m[u]=(e=>{let t=0,n=11;for(;t<e.length;)n=101*n+e.charCodeAt(t++)>>>0;return"go"+n})(u));if(!m[p]){let t=u!==e?e:(e=>{let t,n,a=[{}];for(;t=s.exec(e.replace(o,""));)t[4]?a.shift():t[3]?(n=t[3].replace(l," ").trim(),a.unshift(a[0][n]=a[0][n]||{})):a[0][t[1]]=t[2].replace(l," ").trim();return a[0]})(e);m[p]=c(r?{["@keyframes "+p]:t}:t,n?"":"."+p)}let h=n&&m.g;return n&&(m.g=m[p]),i=m[p],h?t.data=t.data.replace(h,i):-1===t.data.indexOf(i)&&(t.data=a?i+t.data:t.data+i),p})(r.unshift?r.raw?(t=[].slice.call(arguments,1),n=a.p,r.reduce((e,a,r)=>{let i=t[r];if(i&&i.call){let e=i(n),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;i=t?"."+t:e&&"object"==typeof e?e.props?"":c(e,""):!1===e?"":e}return e+a+(null==i?"":i)},"")):r.reduce((e,t)=>Object.assign(e,t&&t.call?t(a.p):t),{}):r,(e=>{if("object"==typeof window){let t=(e?e.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return t.nonce=window.__nonce__,t.parentNode||(e||document.head).appendChild(t),t.firstChild}return e||i})(a.target),a.g,a.o,a.k)}u.bind({g:1});let p,h,f,g=u.bind({k:1});function y(e,t){let n=this||{};return function(){let a=arguments;function r(i,s){let o=Object.assign({},i),l=o.className||r.className;n.p=Object.assign({theme:h&&h()},o),n.o=/go\d/.test(l),o.className=u.apply(n,a)+(l?" "+l:""),t&&(o.ref=s);let c=e;return e[0]&&(c=o.as||e,delete o.as),f&&c[0]&&f(o),p(c,o)}return t?t(r):r}}var b=(e,t)=>"function"==typeof e?e(t):e,v=(t=0,()=>(++t).toString()),w=()=>{if(void 0===n&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");n=!e||e.matches}return n},x="default",E=(e,t)=>{let{toastLimit:n}=e.settings;switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,n)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===t.toast.id?{...e,...t.toast}:e)};case 2:let{toast:a}=t;return E(e,{type:+!!e.toasts.find(e=>e.id===a.id),toast:a});case 3:let{toastId:r}=t;return{...e,toasts:e.toasts.map(e=>e.id===r||void 0===r?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let i=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+i}))}}},S=[],C={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},P={},N=(e,t=x)=>{P[t]=E(P[t]||C,e),S.forEach(([e,n])=>{e===t&&n(P[t])})},T=e=>Object.keys(P).forEach(t=>N(e,t)),k=(e=x)=>t=>{N(t,e)},O={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},A=e=>(t,n)=>{let a,r=((e,t="blank",n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...n,id:(null==n?void 0:n.id)||v()}))(t,e,n);return k(r.toasterId||(a=r.id,Object.keys(P).find(e=>P[e].toasts.some(e=>e.id===a))))({type:2,toast:r}),r.id},I=(e,t)=>A("blank")(e,t);I.error=A("error"),I.success=A("success"),I.loading=A("loading"),I.custom=A("custom"),I.dismiss=(e,t)=>{let n={type:3,toastId:e};t?k(t)(n):T(n)},I.dismissAll=e=>I.dismiss(void 0,e),I.remove=(e,t)=>{let n={type:4,toastId:e};t?k(t)(n):T(n)},I.removeAll=e=>I.remove(void 0,e),I.promise=(e,t,n)=>{let a=I.loading(t.loading,{...n,...null==n?void 0:n.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let r=t.success?b(t.success,e):void 0;return r?I.success(r,{id:a,...n,...null==n?void 0:n.success}):I.dismiss(a),e}).catch(e=>{let r=t.error?b(t.error,e):void 0;r?I.error(r,{id:a,...n,...null==n?void 0:n.error}):I.dismiss(a)}),e};var j=1e3,L=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,$=g`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,M=g`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,_=y("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${L} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${$} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${M} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,R=g`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,D=y("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${R} 1s linear infinite;
`,U=g`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,z=g`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,F=y("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${U} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${z} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,B=y("div")`
  position: absolute;
`,H=y("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,W=g`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,G=y("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${W} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,K=({toast:e})=>{let{icon:t,type:n,iconTheme:a}=e;return void 0!==t?"string"==typeof t?r.createElement(G,null,t):t:"blank"===n?null:r.createElement(H,null,r.createElement(D,{...a}),"loading"!==n&&r.createElement(B,null,"error"===n?r.createElement(_,{...a}):r.createElement(F,{...a})))},V=y("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Z=y("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,q=r.memo(({toast:e,position:t,style:n,children:a})=>{let i=e.height?((e,t)=>{let n=e.includes("top")?1:-1,[a,r]=w()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[`
0% {transform: translate3d(0,${-200*n}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*n}%,-1px) scale(.6); opacity:0;}
`];return{animation:t?`${g(a)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${g(r)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},s=r.createElement(K,{toast:e}),o=r.createElement(Z,{...e.ariaProps},b(e.message,e));return r.createElement(V,{className:e.className,style:{...i,...n,...e.style}},"function"==typeof a?a({icon:s,message:o}):r.createElement(r.Fragment,null,s,o))});a=r.createElement,c.p=void 0,p=a,h=void 0,f=void 0;var J=({id:e,className:t,style:n,onHeightUpdate:a,children:i})=>{let s=r.useCallback(t=>{if(t){let n=()=>{a(e,t.getBoundingClientRect().height)};n(),new MutationObserver(n).observe(t,{subtree:!0,childList:!0,characterData:!0})}},[e,a]);return r.createElement("div",{ref:s,className:t,style:n},i)},Q=u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;e.s(["Toaster",0,({reverseOrder:e,position:t="top-center",toastOptions:n,gutter:a,children:i,toasterId:s,containerStyle:o,containerClassName:l})=>{let{toasts:c,handlers:m}=((e,t="default")=>{let{toasts:n,pausedAt:a}=((e={},t=x)=>{let[n,a]=(0,r.useState)(P[t]||C),i=(0,r.useRef)(P[t]);(0,r.useEffect)(()=>(i.current!==P[t]&&a(P[t]),S.push([t,a]),()=>{let e=S.findIndex(([e])=>e===t);e>-1&&S.splice(e,1)}),[t]);let s=n.toasts.map(t=>{var n,a,r;return{...e,...e[t.type],...t,removeDelay:t.removeDelay||(null==(n=e[t.type])?void 0:n.removeDelay)||(null==e?void 0:e.removeDelay),duration:t.duration||(null==(a=e[t.type])?void 0:a.duration)||(null==e?void 0:e.duration)||O[t.type],style:{...e.style,...null==(r=e[t.type])?void 0:r.style,...t.style}}});return{...n,toasts:s}})(e,t),i=(0,r.useRef)(new Map).current,s=(0,r.useCallback)((e,t=j)=>{if(i.has(e))return;let n=setTimeout(()=>{i.delete(e),o({type:4,toastId:e})},t);i.set(e,n)},[]);(0,r.useEffect)(()=>{if(a)return;let e=Date.now(),r=n.map(n=>{if(n.duration===1/0)return;let a=(n.duration||0)+n.pauseDuration-(e-n.createdAt);if(a<0){n.visible&&I.dismiss(n.id);return}return setTimeout(()=>I.dismiss(n.id,t),a)});return()=>{r.forEach(e=>e&&clearTimeout(e))}},[n,a,t]);let o=(0,r.useCallback)(k(t),[t]),l=(0,r.useCallback)(()=>{o({type:5,time:Date.now()})},[o]),c=(0,r.useCallback)((e,t)=>{o({type:1,toast:{id:e,height:t}})},[o]),m=(0,r.useCallback)(()=>{a&&o({type:6,time:Date.now()})},[a,o]),d=(0,r.useCallback)((e,t)=>{let{reverseOrder:a=!1,gutter:r=8,defaultPosition:i}=t||{},s=n.filter(t=>(t.position||i)===(e.position||i)&&t.height),o=s.findIndex(t=>t.id===e.id),l=s.filter((e,t)=>t<o&&e.visible).length;return s.filter(e=>e.visible).slice(...a?[l+1]:[0,l]).reduce((e,t)=>e+(t.height||0)+r,0)},[n]);return(0,r.useEffect)(()=>{n.forEach(e=>{if(e.dismissed)s(e.id,e.removeDelay);else{let t=i.get(e.id);t&&(clearTimeout(t),i.delete(e.id))}})},[n,s]),{toasts:n,handlers:{updateHeight:c,startPause:l,endPause:m,calculateOffset:d}}})(n,s);return r.createElement("div",{"data-rht-toaster":s||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...o},className:l,onMouseEnter:m.startPause,onMouseLeave:m.endPause},c.map(n=>{let s,o,l=n.position||t,c=m.calculateOffset(n,{reverseOrder:e,gutter:a,defaultPosition:t}),d=(s=l.includes("top"),o=l.includes("center")?{justifyContent:"center"}:l.includes("right")?{justifyContent:"flex-end"}:{},{left:0,right:0,display:"flex",position:"absolute",transition:w()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${c*(s?1:-1)}px)`,...s?{top:0}:{bottom:0},...o});return r.createElement(J,{id:n.id,key:n.id,onHeightUpdate:m.updateHeight,className:n.visible?Q:"",style:d},"custom"===n.type?b(n.message,n):i?i(n):r.createElement(q,{toast:n,position:l}))}))},"default",0,I],5766)},17139,e=>{"use strict";var t=e.i(43476),n=e.i(71645);let a={"nav.updates":{en:"Updates",hi:"अपडेट",mr:"अपडेट्स",te:"నవీకరణలు",ta:"புதுப்பிப்பு"},"nav.community":{en:"Community",hi:"समुदाय",mr:"समुदाय",te:"సమాజం",ta:"சமூகம்"},"nav.complaints":{en:"Complaints",hi:"शिकायतें",mr:"तक्रारी",te:"ఫిర్యాదులు",ta:"புகார்கள்"},"nav.events":{en:"Events",hi:"कार्यक्रम",mr:"कार्यक्रम",te:"ఈవెంట్లు",ta:"நிகழ்வுகள்"},"nav.chat":{en:"Chat",hi:"चैट",mr:"चॅट",te:"చాట్",ta:"அரட்டை"},"nav.notices":{en:"Notices",hi:"नोटिस",mr:"सूचना",te:"నోటీసులు",ta:"அறிவிப்புகள்"},"nav.messages":{en:"Messages",hi:"संदेश",mr:"संदेश",te:"సందేశాలు",ta:"செய்திகள்"},"updates.title":{en:"Updates",hi:"अपडेट",mr:"अपडेट्स",te:"నవీకరణలు",ta:"புதுப்பிப்புகள்"},"updates.subtitle":{en:"Notices & Announcements",hi:"नोटिस और घोषणाएं",mr:"नोटीस आणि घोषणा",te:"నోటీసులు & ప్రకటనలు",ta:"அறிவிப்புகள்"},"updates.empty":{en:"No notices yet",hi:"कोई नोटिस नहीं",mr:"कोणतीही सूचना नाही",te:"నోటీసులు లేవు",ta:"அறிவிப்புகள் இல்லை"},"updates.emptySub":{en:"Check back later for society announcements",hi:"बाद में देखें",mr:"नंतर तपासा",te:"తర్వాత తనిఖీ చేయండి",ta:"பின்னர் சரிபார்க்கவும்"},"community.title":{en:"Community",hi:"समुदाय",mr:"समुदाय",te:"సమాజం",ta:"சமூகம்"},"community.subtitle":{en:"Residents feed",hi:"निवासियों की फ़ीड",mr:"रहिवाशांचा फीड",te:"నివాసుల ఫీడ్",ta:"குடியிருப்பாளர்கள்"},"community.post":{en:"Post",hi:"पोस्ट",mr:"पोस्ट",te:"పోస్ట్",ta:"இடுகை"},"community.share":{en:"Share",hi:"शेयर करें",mr:"शेअर करा",te:"షేర్ చేయి",ta:"பகிர்"},"community.whats":{en:"What's on your mind?",hi:"क्या सोच रहे हैं?",mr:"काय वाटते?",te:"మీ మనసులో ఏముంది?",ta:"என்ன நினைக்கிறீர்கள்?"},"community.photo":{en:"Photo",hi:"फ़ोटो",mr:"फोटो",te:"ఫోటో",ta:"புகைப்படம்"},"community.comment":{en:"Comment",hi:"टिप्पणी",mr:"टिप्पणी",te:"వ్యాఖ్య",ta:"கருத்து"},"community.empty":{en:"No posts yet",hi:"कोई पोस्ट नहीं",mr:"कोणतीही पोस्ट नाही",te:"పోస్ట్లు లేవు",ta:"இடுகைகள் இல்லை"},"community.emptySub":{en:"Be the first to share something!",hi:"पहले शेयर करें!",mr:"प्रथम शेअर करा!",te:"మొదటిగా పంచుకోండి!",ta:"முதலில் பகிரவும்!"},"complaints.title":{en:"Complaints",hi:"शिकायतें",mr:"तक्रारी",te:"ఫిర్యాదులు",ta:"புகார்கள்"},"complaints.subtitle":{en:"Raise & track issues",hi:"समस्याएं दर्ज करें",mr:"समस्या नोंदवा",te:"సమస్యలు నమోదు చేయండి",ta:"சிக்கல்களை பதிவு செய்யவும்"},"complaints.raise":{en:"Raise",hi:"दर्ज करें",mr:"नोंद करा",te:"దాఖలు",ta:"பதிவு"},"complaints.new":{en:"New Complaint",hi:"नई शिकायत",mr:"नवीन तक्रार",te:"కొత్త ఫిర్యాదు",ta:"புதிய புகார்"},"complaints.title2":{en:"Title",hi:"शीर्षक",mr:"शीर्षक",te:"శీర్షిక",ta:"தலைப்பு"},"complaints.desc":{en:"Describe the issue...",hi:"समस्या बताएं...",mr:"समस्या वर्णन करा...",te:"సమస్యను వివరించండి...",ta:"சிக்கலை விவரிக்கவும்..."},"complaints.submit":{en:"Submit",hi:"जमा करें",mr:"सबमिट करा",te:"సమర్పించు",ta:"சமர்ப்பி"},"complaints.empty":{en:"No complaints raised",hi:"कोई शिकायत नहीं",mr:"कोणतीही तक्रार नाही",te:"ఫిర్యాదులు లేవు",ta:"புகார்கள் இல்லை"},"complaints.emptySub":{en:'Tap "+Raise" to report an issue',hi:'"+दर्ज करें" दबाएं',mr:'"+नोंद करा" टॅप करा',te:'"+దాఖలు" నొక్కండి',ta:'"+பதிவு" அழுத்தவும்'},"complaints.status.pending":{en:"Pending",hi:"लंबित",mr:"प्रलंबित",te:"పెండింగ్",ta:"நிலுவை"},"complaints.status.in_progress":{en:"In Progress",hi:"जारी है",mr:"प्रगतीत",te:"పురోగతిలో",ta:"செயல்பாட்டில்"},"complaints.status.resolved":{en:"Resolved",hi:"हल हुआ",mr:"सोडवले",te:"పరిష్కరించబడింది",ta:"தீர்க்கப்பட்டது"},"events.title":{en:"Society Events",hi:"सोसाइटी कार्यक्रम",mr:"सोसायटी कार्यक्रम",te:"సొసైటీ ఈవెంట్లు",ta:"சமூக நிகழ்வுகள்"},"events.subtitle":{en:"Upcoming activities",hi:"आगामी गतिविधियां",mr:"आगामी उपक्रम",te:"రాబోయే కార్యక్రమాలు",ta:"வரவிருக்கும் நிகழ்வுகள்"},"events.upcoming":{en:"Upcoming",hi:"आगामी",mr:"येणारे",te:"రాబోయే",ta:"வரவிருக்கும்"},"events.past":{en:"Past",hi:"पिछले",mr:"मागील",te:"గత",ta:"கடந்த"},"events.rsvp":{en:"RSVP — I'm attending",hi:"मैं आऊंगा",mr:"मी येतो",te:"నేను వస్తున్నాను",ta:"நான் வருகிறேன்"},"events.going":{en:"Going!",hi:"जा रहे हैं!",mr:"येत आहे!",te:"వస్తున్నాను!",ta:"போகிறேன்!"},"events.attending":{en:"attending",hi:"उपस्थित",mr:"उपस्थित",te:"హాజరవుతున్నారు",ta:"கலந்துகொள்கின்றனர்"},"events.empty":{en:"No events yet",hi:"कोई कार्यक्रम नहीं",mr:"कोणताही कार्यक्रम नाही",te:"ఈవెంట్లు లేవు",ta:"நிகழ்வுகள் இல்லை"},"events.emptySub":{en:"Events will appear here when created",hi:"कार्यक्रम यहां दिखेंगे",mr:"कार्यक्रम येथे दिसतील",te:"ఈవెంట్లు ఇక్కడ కనిపిస్తాయి",ta:"நிகழ்வுகள் இங்கே தோன்றும்"},"chat.title":{en:"Chat",hi:"चैट",mr:"चॅट",te:"చాట్",ta:"அரட்டை"},"chat.subtitle":{en:"Message the admin",hi:"एडमिन को मैसेज करें",mr:"अॅडमिनला मेसेज करा",te:"అడ్మిన్‌కు మెసేజ్ చేయండి",ta:"நிர்வாகியிடம் தொடர்பு கொள்ளுங்கள்"},"chat.new":{en:"New",hi:"नया",mr:"नवीन",te:"కొత్తది",ta:"புதிய"},"chat.subject":{en:"Subject",hi:"विषय",mr:"विषय",te:"విషయం",ta:"விஷயம்"},"chat.message":{en:"Write your message...",hi:"संदेश लिखें...",mr:"संदेश लिहा...",te:"మీ సందేశం రాయండి...",ta:"உங்கள் செய்தியை எழுதுங்கள்..."},"chat.send":{en:"Send Message",hi:"संदेश भेजें",mr:"संदेश पाठवा",te:"సందేశం పంపు",ta:"செய்தி அனுப்பு"},"chat.empty":{en:"No conversations",hi:"कोई बातचीत नहीं",mr:"कोणतीही संभाषणे नाहीत",te:"సంభాషణలు లేవు",ta:"உரையாடல்கள் இல்லை"},"chat.emptySub":{en:'Tap "+New" to message the admin',hi:'"+नया" दबाएं',mr:'"+नवीन" टॅप करा',te:'"+కొత్తది" నొక్కండి',ta:'"+புதிய" அழுத்தவும்'},"chat.type":{en:"Type a message...",hi:"संदेश टाइप करें...",mr:"संदेश टाइप करा...",te:"సందేశం టైప్ చేయండి...",ta:"செய்தி தட்டவும்..."},"chat.newConv":{en:"New Conversation",hi:"नई बातचीत",mr:"नवीन संभाषण",te:"కొత్త సంభాషణ",ta:"புதிய உரையாடல்"},"admin.complaints.title":{en:"Complaint Management",hi:"शिकायत प्रबंधन",mr:"तक्रार व्यवस्थापन",te:"ఫిర్యాదు నిర్వహణ",ta:"புகார் மேலாண்மை"},"admin.complaints.subtitle":{en:"Review and resolve issues",hi:"समस्याएं समीक्षा करें",mr:"समस्या पुनरावलोकन करा",te:"సమస్యలను సమీక్షించండి",ta:"சிக்கல்களை தீர்க்கவும்"},"admin.complaints.filter.all":{en:"All",hi:"सभी",mr:"सर्व",te:"అన్నీ",ta:"அனைத்தும்"},"admin.complaints.filter.pending":{en:"Pending",hi:"लंबित",mr:"प्रलंबित",te:"పెండింగ్",ta:"நிலுவை"},"admin.complaints.filter.in_progress":{en:"In Progress",hi:"जारी है",mr:"प्रगतीत",te:"పురోగతిలో",ta:"செயல்பாட்டில்"},"admin.complaints.filter.resolved":{en:"Resolved",hi:"हल हुआ",mr:"सोडवले",te:"పరిష్కరించబడింది",ta:"தீர்க்கப்பட்டது"},"admin.notices.title":{en:"Send Notice",hi:"नोटिस भेजें",mr:"नोटीस पाठवा",te:"నోటీసు పంపు",ta:"அறிவிப்பு அனுப்பு"},"admin.notices.subtitle":{en:"Publish announcements",hi:"घोषणाएं प्रकाशित करें",mr:"घोषणा प्रकाशित करा",te:"ప్రకటనలు ప్రచురించండి",ta:"அறிவிப்புகளை வெளியிடவும்"},"admin.notices.new":{en:"New",hi:"नया",mr:"नवीन",te:"కొత్తది",ta:"புதிய"},"admin.notices.publish":{en:"Publish",hi:"प्रकाशित करें",mr:"प्रकाशित करा",te:"ప్రచురించు",ta:"வெளியிடு"},"admin.notices.empty":{en:"No notices published",hi:"कोई नोटिस नहीं",mr:"कोणतीही सूचना नाही",te:"నోటీసులు లేవు",ta:"அறிவிப்புகள் இல்லை"},"admin.notices.emptySub":{en:'Tap "+New" to create a notice',hi:'"+नया" दबाएं',mr:'"+नवीन" टॅप करा',te:'"+కొత్తది" నొక్కండి',ta:'"+புதிய" அழுத்தவும்'},"admin.notices.title2":{en:"Title",hi:"शीर्षक",mr:"शीर्षक",te:"శీర్షిక",ta:"தலைப்பு"},"admin.notices.body":{en:"Notice body...",hi:"नोटिस की सामग्री...",mr:"नोटिसची सामग्री...",te:"నోటీసు విషయం...",ta:"அறிவிப்பு உள்ளடக்கம்..."},"admin.notices.image":{en:"Image",hi:"छवि",mr:"प्रतिमा",te:"చిత్రం",ta:"படம்"},"admin.notices.cat.general":{en:"General",hi:"सामान्य",mr:"सामान्य",te:"సాధారణ",ta:"பொதுவான"},"admin.notices.cat.urgent":{en:"Urgent",hi:"तत्काल",mr:"तातडीचे",te:"అత్యవసరం",ta:"அவசரம்"},"admin.notices.cat.event":{en:"Event",hi:"कार्यक्रम",mr:"कार्यक्रम",te:"ఈవెంట్",ta:"நிகழ்வு"},"admin.notices.cat.maintenance":{en:"Maintenance",hi:"रखरखाव",mr:"देखभाल",te:"నిర్వహణ",ta:"பராமரிப்பு"},"admin.events.title":{en:"Manage Events",hi:"कार्यक्रम प्रबंधन",mr:"कार्यक्रम व्यवस्थापन",te:"ఈవెంట్లు నిర్వహించు",ta:"நிகழ்வுகளை நிர்வகி"},"admin.events.subtitle":{en:"Create & organize events",hi:"कार्यक्रम बनाएं",mr:"कार्यक्रम तयार करा",te:"ఈవెంట్లు సృష్టించండి",ta:"நிகழ்வுகளை உருவாக்கவும்"},"admin.events.add":{en:"Add",hi:"जोड़ें",mr:"जोडा",te:"జోడించు",ta:"சேர்க்கவும்"},"admin.events.create":{en:"Create Event",hi:"कार्यक्रम बनाएं",mr:"कार्यक्रम तयार करा",te:"ఈవెంట్ సృష్టించు",ta:"நிகழ்வை உருவாக்கு"},"admin.events.name":{en:"Event name",hi:"कार्यक्रम का नाम",mr:"कार्यक्रमाचे नाव",te:"ఈవెంట్ పేరు",ta:"நிகழ்வு பெயர்"},"admin.events.desc":{en:"Description (optional)",hi:"विवरण (वैकल्पिक)",mr:"वर्णन (पर्यायी)",te:"వివరణ (ఐచ్ఛికం)",ta:"விளக்கம் (விருப்பமான)"},"admin.events.location":{en:"Location (optional)",hi:"स्थान (वैकल्पिक)",mr:"ठिकाण (पर्यायी)",te:"స్థానం (ఐచ్ఛికం)",ta:"இடம் (விருப்பமான)"},"admin.events.empty":{en:"No events created",hi:"कोई कार्यक्रम नहीं",mr:"कोणताही कार्यक्रम नाही",te:"ఈవెంట్లు లేవు",ta:"நிகழ்வுகள் இல்லை"},"admin.events.emptySub":{en:'Tap "+Add" to create an event',hi:'"+जोड़ें" दबाएं',mr:'"+जोडा" टॅप करा',te:'"+జోడించు" నొక్కండి',ta:'"+சேர்" அழுத்தவும்'},"admin.messages.title":{en:"Messages",hi:"संदेश",mr:"संदेश",te:"సందేశాలు",ta:"செய்திகள்"},"admin.messages.subtitle":{en:"Resident conversations",hi:"निवासी बातचीत",mr:"रहिवासी संभाषणे",te:"నివాసి సంభాషణలు",ta:"குடியிருப்பாளர் உரையாடல்கள்"},"admin.messages.unread":{en:"unread",hi:"अपठित",mr:"न वाचलेले",te:"చదవబడలేదు",ta:"படிக்காத"},"admin.messages.empty":{en:"No messages",hi:"कोई संदेश नहीं",mr:"कोणतेही संदेश नाहीत",te:"సందేశాలు లేవు",ta:"செய்திகள் இல்லை"},"admin.messages.emptySub":{en:"Resident messages will appear here",hi:"निवासी संदेश यहां दिखेंगे",mr:"रहिवासी संदेश येथे दिसतील",te:"నివాసి సందేశాలు ఇక్కడ కనిపిస్తాయి",ta:"குடியிருப்பாளர் செய்திகள் இங்கே தோன்றும்"},"admin.messages.reply":{en:"Reply to resident...",hi:"निवासी को जवाब दें...",mr:"रहिवाशाला उत्तर द्या...",te:"నివాసికి జవాబు ఇవ్వండి...",ta:"குடியிருப்பாளருக்கு பதிலளிக்கவும்..."},"sidebar.darkMode":{en:"Dark Mode",hi:"डार्क मोड",mr:"डार्क मोड",te:"డార్క్ మోడ్",ta:"இருண்ட முறை"},"sidebar.lightMode":{en:"Light Mode",hi:"लाइट मोड",mr:"लाइट मोड",te:"లైట్ మోడ్",ta:"வெளிர் முறை"},"sidebar.language":{en:"Language",hi:"भाषा",mr:"भाषा",te:"భాష",ta:"மொழி"},"sidebar.feedback":{en:"Send Feedback",hi:"फीडबैक भेजें",mr:"अभिप्राय पाठवा",te:"అభిప్రాయం పంపు",ta:"கருத்து அனுப்பு"},"sidebar.signedAs":{en:"Signed in as",hi:"के रूप में लॉग इन",mr:"म्हणून साइन इन",te:"గా సైన్ ఇన్ అయ్యారు",ta:"என்று உள்நுழைந்தீர்கள்"},"sidebar.switchRole":{en:"Contact admin to change role",hi:"भूमिका बदलने के लिए एडमिन से संपर्क करें",mr:"भूमिका बदलण्यासाठी अॅडमिनशी संपर्क करा",te:"పాత్ర మార్చడానికి అడ్మిన్‌ని సంప్రదించండి",ta:"பாத்திரத்தை மாற்ற நிர்வாகியை தொடர்பு கொள்ளுங்கள்"},"avatar.profile":{en:"Profile",hi:"प्रोफ़ाइल",mr:"प्रोफाइल",te:"ప్రొఫైల్",ta:"சுயவிவரம்"},"avatar.signOut":{en:"Sign Out",hi:"साइन आउट",mr:"साइन आउट",te:"సైన్ అవుట్",ta:"வெளியேறு"},"common.loading":{en:"Loading...",hi:"लोड हो रहा है...",mr:"लोड होत आहे...",te:"లోడ్ అవుతోంది...",ta:"ஏற்றுகிறது..."},"common.noData":{en:"No data",hi:"कोई डेटा नहीं",mr:"कोणताही डेटा नाही",te:"డేటా లేదు",ta:"தரவு இல்லை"},"common.flat":{en:"Flat",hi:"फ्लैट",mr:"फ्लॅट",te:"ఫ్లాట్",ta:"அபார்ட்மென்ட்"},"common.admin":{en:"Admin",hi:"एडमिन",mr:"अॅडमिन",te:"అడ్మిన్",ta:"நிர்வாகி"},"common.resident":{en:"Resident",hi:"निवासी",mr:"रहिवासी",te:"నివాసి",ta:"குடியிருப்பாளர்"},"common.security":{en:"Security",hi:"सुरक्षा",mr:"सुरक्षा",te:"భద్రత",ta:"பாதுகாப்பு"}},r=(0,n.createContext)({lang:"en",setLang:()=>{},t:e=>e});e.s(["LanguageProvider",0,function({children:e}){let[i,s]=(0,n.useState)("en");return(0,n.useEffect)(()=>{let e=localStorage.getItem("sh_lang");e&&["en","hi","mr","te","ta"].includes(e)&&s(e)},[]),(0,t.jsx)(r.Provider,{value:{lang:i,setLang:function(e){s(e),localStorage.setItem("sh_lang",e)},t:e=>{let t;return(t=a[e])?t[i]??t.en??e:e}},children:e})},"useLanguage",0,function(){return(0,n.useContext)(r)}],17139)},63178,e=>{"use strict";var t=e.i(71645),n=(e,t,n,a,r,i,s,o)=>{let l=document.documentElement,c=["light","dark"];function m(t){var n;(Array.isArray(e)?e:[e]).forEach(e=>{let n="class"===e,a=n&&i?r.map(e=>i[e]||e):r;n?(l.classList.remove(...a),l.classList.add(i&&i[t]?i[t]:t)):l.setAttribute(e,t)}),n=t,o&&c.includes(n)&&(l.style.colorScheme=n)}if(a)m(a);else try{let e=localStorage.getItem(t)||n,a=s&&"system"===e?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":e;m(a)}catch(e){}},a=["light","dark"],r="(prefers-color-scheme: dark)",i="u"<typeof window,s=t.createContext(void 0),o={setTheme:e=>{},themes:[]},l=["light","dark"],c=({forcedTheme:e,disableTransitionOnChange:n=!1,enableSystem:i=!0,enableColorScheme:o=!0,storageKey:c="theme",themes:h=l,defaultTheme:f=i?"system":"light",attribute:g="data-theme",value:y,children:b,nonce:v,scriptProps:w})=>{let[x,E]=t.useState(()=>d(c,f)),[S,C]=t.useState(()=>"system"===x?p():x),P=y?Object.values(y):h,N=t.useCallback(e=>{let t=e;if(!t)return;"system"===e&&i&&(t=p());let r=y?y[t]:t,s=n?u(v):null,l=document.documentElement,c=e=>{"class"===e?(l.classList.remove(...P),r&&l.classList.add(r)):e.startsWith("data-")&&(r?l.setAttribute(e,r):l.removeAttribute(e))};if(Array.isArray(g)?g.forEach(c):c(g),o){let e=a.includes(f)?f:null,n=a.includes(t)?t:e;l.style.colorScheme=n}null==s||s()},[v]),T=t.useCallback(e=>{let t="function"==typeof e?e(x):e;E(t);try{localStorage.setItem(c,t)}catch(e){}},[x]),k=t.useCallback(t=>{C(p(t)),"system"===x&&i&&!e&&N("system")},[x,e]);t.useEffect(()=>{let e=window.matchMedia(r);return e.addListener(k),k(e),()=>e.removeListener(k)},[k]),t.useEffect(()=>{let e=e=>{e.key===c&&(e.newValue?E(e.newValue):T(f))};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[T]),t.useEffect(()=>{N(null!=e?e:x)},[e,x]);let O=t.useMemo(()=>({theme:x,setTheme:T,forcedTheme:e,resolvedTheme:"system"===x?S:x,themes:i?[...h,"system"]:h,systemTheme:i?S:void 0}),[x,T,e,S,i,h]);return t.createElement(s.Provider,{value:O},t.createElement(m,{forcedTheme:e,storageKey:c,attribute:g,enableSystem:i,enableColorScheme:o,defaultTheme:f,value:y,themes:h,nonce:v,scriptProps:w}),b)},m=t.memo(({forcedTheme:e,storageKey:a,attribute:r,enableSystem:i,enableColorScheme:s,defaultTheme:o,value:l,themes:c,nonce:m,scriptProps:d})=>{let u=JSON.stringify([r,a,o,e,c,l,i,s]).slice(1,-1);return t.createElement("script",{...d,suppressHydrationWarning:!0,nonce:"u"<typeof window?m:"",dangerouslySetInnerHTML:{__html:`(${n.toString()})(${u})`}})}),d=(e,t)=>{let n;if(!i){try{n=localStorage.getItem(e)||void 0}catch(e){}return n||t}},u=e=>{let t=document.createElement("style");return e&&t.setAttribute("nonce",e),t.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}")),document.head.appendChild(t),()=>{window.getComputedStyle(document.body),setTimeout(()=>{document.head.removeChild(t)},1)}},p=e=>(e||(e=window.matchMedia(r)),e.matches?"dark":"light");e.s(["ThemeProvider",0,e=>t.useContext(s)?t.createElement(t.Fragment,null,e.children):t.createElement(c,{...e}),"useTheme",0,()=>{var e;return null!=(e=t.useContext(s))?e:o}])},96923,e=>{"use strict";var t=e.i(43476),n=e.i(63178),a=e.i(5766),r=e.i(97815),i=e.i(17139);e.s(["Providers",0,function({children:e}){return(0,t.jsx)(n.ThemeProvider,{attribute:"class",defaultTheme:"light",enableSystem:!1,children:(0,t.jsx)(i.LanguageProvider,{children:(0,t.jsxs)(r.AuthProvider,{children:[e,(0,t.jsx)(a.Toaster,{position:"top-center",toastOptions:{duration:3e3,style:{borderRadius:"12px",fontFamily:"Inter, sans-serif",fontSize:"14px",fontWeight:"500"}}})]})})})}])}]);