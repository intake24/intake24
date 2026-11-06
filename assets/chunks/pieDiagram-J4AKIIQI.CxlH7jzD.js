import{t as e}from"./chunk-JWPE2WC7.BEzWujz_.js";import{Bt as t,G as n,Gt as r,Kt as i,Ut as a,Xt as o,Y as s,Yt as c,an as l,cn as u,et as d,n as f,on as p,qt as m,rt as h,st as g,vn as _,wn as v}from"./theme.Dw_LQJkG.js";import{n as y}from"./mermaid-parser.core.atU80oyD.js";var b=r.pie,x={sections:new Map,showData:!1,config:b},S=x.sections,C=x.showData,w=structuredClone(b),T={getConfig:v(()=>structuredClone(w),`getConfig`),clear:v(()=>{S=new Map,C=x.showData,t()},`clear`),setDiagramTitle:u,getDiagramTitle:o,setAccTitle:p,getAccTitle:m,setAccDescription:l,getAccDescription:i,addSection:v(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);S.has(e)||(S.set(e,t),_.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:v(()=>S,`getSections`),setShowData:v(e=>{C=e},`setShowData`),getShowData:v(()=>C,`getShowData`)},E=v((t,n)=>{e(t,n),n.setShowData(t.showData),t.sections.map(n.addSection)},`populateDb`),D={parse:v(async e=>{let t=await y(`pie`,e);_.debug(t),E(t,T)},`parse`)},O=v(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),k=v(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1);return h().value(e=>e.value).sort(null)(n)},`createPieArcs`),A={parser:D,db:T,renderer:{draw:v((e,t,r,i)=>{_.debug(`rendering pie chart
`+e);let o=i.db,l=c(),u=n(o.getConfig(),l.pie),p=f(t),m=p.append(`g`);m.attr(`transform`,`translate(225,225)`);let{themeVariables:h}=l,[v]=s(h.pieOuterStrokeWidth);v??=2;let y=u.legendPosition,b=u.textPosition,x=u.donutHole>0&&u.donutHole<=.9?u.donutHole:0,S=d().innerRadius(x*185).outerRadius(185),C=d().innerRadius(185*b).outerRadius(185*b),w=m.append(`g`);w.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+v/2).attr(`class`,`pieOuterCircle`);let T=o.getSections(),E=k(T),D=[h.pie1,h.pie2,h.pie3,h.pie4,h.pie5,h.pie6,h.pie7,h.pie8,h.pie9,h.pie10,h.pie11,h.pie12],O=0;T.forEach(e=>{O+=e});let A=E.filter(e=>(e.data.value/O*100).toFixed(0)!==`0`),j=g(D).domain([...T.keys()]);w.selectAll(`mySlices`).data(A).enter().append(`path`).attr(`d`,S).attr(`fill`,e=>j(e.data.label)).attr(`class`,e=>{let t=`pieCircle`;return u.highlightSlice===`hover`?t+=` highlightedOnHover`:u.highlightSlice===e.data.label&&(t+=` highlighted`),t}),w.selectAll(`mySlices`).data(A).enter().append(`text`).text(e=>(e.data.value/O*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+C.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`);let M=m.append(`text`).text(o.getDiagramTitle()).attr(`x`,0).attr(`y`,-200).attr(`class`,`pieTitleText`),N=[...T.entries()].map(([e,t])=>({label:e,value:t})),P=m.selectAll(`.legend`).data(N).enter().append(`g`).attr(`class`,`legend`);P.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>j(e.label)).style(`stroke`,e=>j(e.label)),P.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>o.getShowData()?`${e.label} [${e.value}]`:e.label);let F=Math.max(...P.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0)),I=450,L=490,R=N.length*22;switch(y){case`center`:P.attr(`transform`,(e,t)=>{let n=22*N.length/2,r=-F/2-22,i=t*22-n;return`translate(`+r+`,`+i+`)`});break;case`top`:I+=R,P.attr(`transform`,(e,t)=>`translate(${-F/2-22}, ${t*22-185})`),w.attr(`transform`,()=>`translate(0, ${R+22})`);break;case`bottom`:I+=R,P.attr(`transform`,(e,t)=>{let n=-F/2-22,r=t*22- -207;return`translate(`+n+`,`+r+`)`});break;case`left`:L+=22+F,P.attr(`transform`,(e,t)=>{let n=22*N.length/2;return`translate(-207,`+(t*22-n)+`)`}),w.attr(`transform`,()=>`translate(${F+18+4}, 0)`);break;default:L+=22+F,P.attr(`transform`,(e,t)=>{let n=22*N.length/2;return`translate(216,`+(t*22-n)+`)`})}let z=M.node()?.getBoundingClientRect().width??0,B=225-z/2,V=225+z/2,H=Math.min(0,B),U=Math.max(L,V)-H;p.attr(`viewBox`,`${H} 0 ${U} ${I}`),a(p,I,U,u.useMaxWidth)},`draw`)},styles:O};export{A as diagram};