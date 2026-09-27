/* Drafting-table chrome shared by every page (markup in Drafting.astro).
   Everything here is decorative and aria-hidden; the page reads the same
   without it. It only switches on (html.drafting) for a fine pointer on a
   wide screen — touch devices and small screens get the plain sheet. */
(function(){
  "use strict";
  var root=document.documentElement;
  var $=function(id){return document.getElementById(id)};
  var desk=matchMedia("(hover:hover) and (pointer:fine) and (min-width:1100px)");

  /* ── drawing origin ──
     x=0 is the left edge of the content column, so the grid, the rulers
     and the X readout all agree on where the drawing starts. */
  var ox=0;
  function origin(){
    var w=document.querySelector(".wrap");
    if(!w)return;
    ox=Math.round(w.getBoundingClientRect().left+parseFloat(getComputedStyle(w).paddingLeft));
    root.style.setProperty("--ox",ox+"px");
  }
  origin();
  addEventListener("resize",origin,{passive:true});

  /* ── status bar: mode, sheet, scroll position ── */
  var sbMode=$("sbMode"),sbSheet=$("sbSheet"),sbPct=$("sbPct"),sbX=$("sbX"),sbY=$("sbY");
  function mode(){if(sbMode)sbMode.textContent=root.dataset.theme==="light"?"WHITEPRINT":"BLUEPRINT"}
  mode();
  new MutationObserver(mode).observe(root,{attributes:true,attributeFilter:["data-theme"]});

  /* sheets are numbered like the section balloons (data-n); the hero is 00 */
  var sheets=[].slice.call(document.querySelectorAll("[data-sheet]"));
  var total=sheets.reduce(function(m,s){return Math.max(m,+s.dataset.n||0)},0);
  function pad(n,w){n=String(n);while(n.length<w)n="0"+n;return n}
  function setSheet(i){
    var s=sheets[i];
    if(!sbSheet||!s)return;
    sbSheet.textContent=(s.dataset.n!=null&&total?pad(s.dataset.n,2)+"/"+pad(total,2)+" · ":"")+s.dataset.sheet.toUpperCase();
  }
  setSheet(0);
  if(sheets.length>1&&"IntersectionObserver" in window){
    var sio=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting)setSheet(sheets.indexOf(e.target))});
    },{rootMargin:"-45% 0px -50% 0px"});
    sheets.forEach(function(s){sio.observe(s)});
  }
  /* vim's position readout: Top, Bot, or a percentage */
  function pct(){
    if(!sbPct)return;
    var h=document.documentElement.scrollHeight-innerHeight;
    sbPct.textContent=scrollY<=2?"Top":scrollY>=h-2?"Bot":Math.round(scrollY/h*100)+"%";
  }
  pct();

  if($("term")&&$("sbHint"))$("sbHint").hidden=false;

  /* ── desk-only chrome ── */
  var on=false,px=-1,py=-1,raf=0;
  var strip=$("rulerY"),markY=$("rulerMarkY"),markX=$("rulerMarkX"),xhH=$("xhH"),xhV=$("xhV");
  var lamp=document.querySelector(".lamp"),insp=$("inspect"),tag=insp&&insp.firstElementChild;
  var hot=null;
  var TARGETS=".job-card,.card,.skillset,.tty,.fig,.empty,.titleblock";

  function labels(){
    if(!strip)return;
    var H=document.documentElement.scrollHeight,html="";
    for(var y=100;y<H;y+=100)html+='<span style="top:'+(y+3)+'px">'+y+'</span>';
    strip.style.height=H+"px";
    strip.innerHTML=html;
  }

  function place(){
    raf=0;
    if(!on)return;
    var sy=scrollY;
    if(strip)strip.style.transform="translate3d(0,"+(-sy)+"px,0)";
    if(lamp)root.style.setProperty("--sy",sy+"px");
    if(px>=0){
      xhH.style.transform="translate3d(0,"+py+"px,0)";
      xhV.style.transform="translate3d("+px+"px,0,0)";
      markY.style.transform="translate3d(0,"+py+"px,0)";
      markX.style.transform="translate3d("+px+"px,"+(document.querySelector(".nav").offsetHeight-9)+"px,0)";
      if(lamp){lamp.style.setProperty("--cx",px+"px");lamp.style.setProperty("--cy",py+"px")}
      var x=px-ox;
      sbX.textContent=(x<0?"-":"+")+pad(Math.abs(x),4);
      sbY.textContent=pad(Math.round(py+sy),5);
    }
    if(hot){
      var b=hot.getBoundingClientRect();
      insp.style.transform="translate3d("+b.left+"px,"+b.top+"px,0)";
      insp.style.width=b.width+"px";insp.style.height=b.height+"px";
    }
  }
  function queue(){if(!raf)raf=requestAnimationFrame(place)}

  function name(el){
    var cls=[].filter.call(el.classList,function(c){return c!=="r"&&c!=="in"&&c.indexOf("rv-")!==0}).slice(0,2);
    return el.tagName.toLowerCase()+(cls.length?"."+cls.join("."):"");
  }
  function inspect(el){
    if(el===hot)return;
    hot=el;
    if(!el){insp.classList.remove("on");return}
    var b=el.getBoundingClientRect();
    tag.textContent=name(el);
    var sz=document.createElement("b");sz.textContent=Math.round(b.width)+"×"+Math.round(b.height);
    tag.appendChild(sz);
    insp.classList.add("on");
    queue();
  }

  function onMove(e){
    px=e.clientX;py=e.clientY;
    root.classList.add("pointer-in");
    var t=e.target&&e.target.closest?e.target.closest(TARGETS):null;
    inspect(t);
    queue();
  }
  function onLeave(){root.classList.remove("pointer-in");px=py=-1;inspect(null)}
  function onScroll(){pct();queue()}

  function enable(){
    if(on)return;on=true;
    root.classList.add("drafting");
    labels();origin();
    addEventListener("pointermove",onMove,{passive:true});
    document.addEventListener("pointerleave",onLeave);
    addEventListener("blur",onLeave);
    queue();
  }
  function disable(){
    if(!on)return;on=false;
    root.classList.remove("drafting","pointer-in");
    removeEventListener("pointermove",onMove);
    document.removeEventListener("pointerleave",onLeave);
    removeEventListener("blur",onLeave);
    inspect(null);
  }
  addEventListener("scroll",onScroll,{passive:true});
  var rt;
  addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(function(){labels();pct();queue()},150)},{passive:true});
  addEventListener("load",labels);
  /* the page grows as sections reveal and fonts land */
  if(window.ResizeObserver)new ResizeObserver(function(){clearTimeout(rt);rt=setTimeout(labels,150)}).observe(document.body);
  (desk.matches?enable:disable)();
  if(desk.addEventListener)desk.addEventListener("change",function(m){(m.matches?enable:disable)()});
})();
