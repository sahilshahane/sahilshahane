(function(){
  "use strict";
  var root=document.documentElement;
  var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ── reveal on scroll ──
     Set up FIRST and guarded: content must never be stuck invisible.
     showAll() is the failsafe — on error, on timeout, or where IO is missing. */
  var revealables=[].slice.call(document.querySelectorAll(".r"));
  /* Cards and pills get pushed away from the cursor (see the antigravity
     cursor below), which caches their positions once. A card or pill
     revealed via IntersectionObserver still has its *entrance* transform
     (slid down, tilted, scaled) at the moment that cache is first taken —
     so this event tells that system when it's safe to recheck, once the
     entrance transition has actually settled. */
  function announceReveal(){window.dispatchEvent(new Event("app:reveal"))}
  function showAll(){
    revealables.forEach(function(el){el.classList.add("in")});
    document.querySelectorAll("section,.sec,.tl").forEach(function(el){el.classList.add("in")});
    announceReveal();
  }
  addEventListener("error",showAll);
  if(reduce||!("IntersectionObserver" in window)){
    showAll();
  }else{
    try{
      var io=new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(!en.isIntersecting)return;
          en.target.classList.add("in");
          io.unobserve(en.target);
          announceReveal();
        });
      },{rootMargin:"0px 0px -8% 0px",threshold:.08});
      revealables.forEach(function(el){io.observe(el)});
      /* sections drive their own decorative rules / timeline stroke */
      var secIO=new IntersectionObserver(function(es){
        es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");secIO.unobserve(e.target)}});
      },{threshold:.06});
      document.querySelectorAll("section,.sec,.tl").forEach(function(el){secIO.observe(el)});
      /* belt and braces: nothing stays hidden past 3s no matter what */
      setTimeout(showAll,3000);
    }catch(e){showAll()}
  }

  /* ── job durations, counted inclusively like LinkedIn; open-ended ones run to today ── */
  document.querySelectorAll(".dur[data-from]").forEach(function(el){
    var a=el.dataset.from.split("-"), b=el.dataset.to?el.dataset.to.split("-"):null, now=new Date();
    var m=((b?+b[0]:now.getFullYear())-a[0])*12+((b?+b[1]:now.getMonth()+1)-a[1])+1;
    if(m<1)return;
    var y=Math.floor(m/12), mo=m%12, out=[];
    if(y)out.push(y+" yr"+(y>1?"s":""));
    if(mo)out.push(mo+" mo"+(mo>1?"s":""));
    el.textContent=out.join(" ");
  });

  /* ── year ── */
  document.getElementById("yr").textContent=new Date().getFullYear();

  /* ── theme ── */
  try{var t=localStorage.getItem("theme");if(t)root.dataset.theme=t;}catch(e){}
  document.getElementById("theme").addEventListener("click",function(){
    var next=root.dataset.theme==="light"?"dark":"light";
    root.dataset.theme=next;
    try{localStorage.setItem("theme",next)}catch(e){}
  });

  /* ── scroll progress (fallback where animation-timeline is unsupported) ── */
  var prog=document.getElementById("prog"),nav=document.getElementById("nav"),ticking=false;
  var hasTimeline=CSS.supports("animation-timeline","scroll()");
  function onScroll(){
    if(!hasTimeline){
      var h=document.body.scrollHeight-innerHeight;
      prog.style.transform="scaleX("+(h>0?scrollY/h:0)+")";
    }
    nav.classList.toggle("stuck",scrollY>10);
    ticking=false;
  }
  addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
  onScroll();

  /* ── experience line ──
     Passes through every job's node and swings out to alternating sides
     between them. Rebuilt from real layout on resize/reveal (row heights
     depend on content); drawn up to a mark 55% down the viewport. */
  (function(){
    var xp=document.getElementById("xp");
    if(!xp)return;
    var svg=xp.querySelector(".xp-line"),bg=svg.querySelector(".bg"),fg=svg.querySelector(".fg"),
        head=svg.querySelector(".xp-head"),grad=svg.querySelector("linearGradient");
    var jobs=[].slice.call(xp.querySelectorAll(".job")),pts=[],len=0,ticking=false;
    function build(){
      var W=xp.offsetWidth,H=xp.offsetHeight;
      svg.setAttribute("width",W);svg.setAttribute("height",H);
      pts=jobs.map(function(j){
        var cs=getComputedStyle(j,"::before");
        return [j.offsetLeft+parseFloat(cs.left)+7, j.offsetTop+parseFloat(cs.top)+7];
      });
      if(!pts.length)return;
      /* a steady wave: every gap between nodes is split into a whole number of
         equal half-waves close to HALF px tall, so the line always crosses the
         centre exactly at a node. Each half-wave is the same mirrored bump,
         alternating sides, with matching tangents where they join. */
      var wide=innerWidth>880, amp=wide?16:9, HALF=wide?70:56, K=1.33, x=pts[0][0], side=1;
      function bump(y0,y1){
        var h=y1-y0, cx=(x+side*amp*K).toFixed(1);
        side=-side;
        return " C"+cx+","+(y0+h*.3).toFixed(1)+" "+cx+","+(y1-h*.3).toFixed(1)+" "+x+","+y1.toFixed(1);
      }
      var d="M"+x+","+pts[0][1];
      for(var i=1;i<pts.length;i++){
        var y0=pts[i-1][1],y1=pts[i][1],n=Math.max(1,Math.round((y1-y0)/HALF)),h=(y1-y0)/n;
        for(var k=0;k<n;k++)d+=bump(y0+h*k,y0+h*(k+1));
      }
      var yl=pts[pts.length-1][1];
      d+=bump(yl,yl+HALF);
      bg.setAttribute("d",d);fg.setAttribute("d",d);
      grad.setAttribute("y2",H);
      len=fg.getTotalLength();
      fg.style.strokeDasharray=len;
      update();
    }
    function lengthAtY(y){
      var lo=0,hi=len;
      for(var k=0;k<16;k++){var m=(lo+hi)/2;if(fg.getPointAtLength(m).y<y)lo=m;else hi=m}
      return lo;
    }
    function update(){
      ticking=false;
      if(!len)return;
      var y=reduce?1e9:innerHeight*.55-xp.getBoundingClientRect().top;
      var L=y<=0?0:lengthAtY(y);
      fg.style.strokeDashoffset=(len-L).toFixed(1);
      var pt=fg.getPointAtLength(L);
      head.setAttribute("cx",pt.x.toFixed(1));head.setAttribute("cy",pt.y.toFixed(1));
      head.style.opacity=L>2&&L<len-2?1:0;
      jobs.forEach(function(j,i){j.classList.toggle("lit",pt.y>=pts[i][1]-2)});
    }
    addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
    var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(build,120)},{passive:true});
    addEventListener("load",build);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(build);
    addEventListener("app:reveal",function(){setTimeout(build,900)},{passive:true});
    build();
  })();

  /* ── count-up stats ── */
  document.querySelectorAll("[data-count]").forEach(function(el){
    var target=parseFloat(el.dataset.count),suffix=el.dataset.suffix||"";
    var dec=(el.dataset.count.split(".")[1]||"").length;
    var fmt=function(v){return v.toLocaleString("en-IN",{minimumFractionDigits:dec,maximumFractionDigits:dec})+suffix};
    /* the markup already holds the true value — only zero it out if we can
       actually animate, and always restore the true value if anything stalls */
    if(reduce||!("IntersectionObserver" in window)){el.textContent=fmt(target);return}
    var done=false;
    function settle(){done=true;el.textContent=fmt(target)}
    try{
      el.textContent=fmt(0);
      var cIO=new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(!e.isIntersecting||done)return;
          cIO.disconnect();
          var t0=performance.now(),dur=1400;
          (function step(now){
            if(done)return;
            var p=Math.min((now-t0)/dur,1);
            el.textContent=fmt(target*(1-Math.pow(1-p,3)));
            if(p<1)requestAnimationFrame(step); else done=true;
          })(t0);
        });
      },{threshold:.5});
      cIO.observe(el);
      setTimeout(function(){if(!done)settle()},3000);
    }catch(e){settle()}
  });

  /* ── background field ──
     A loose scatter of deep-blue points, each with its own irregular life:
       - brightness/size: three detuned sines per point, bent by a per-point
         power and slowly gated by a fourth, so flares cluster unpredictably
       - position: own wander (radius itself pulsing) plus a gusting "wind"
       - pointer: points are shoved off a lumpy boundary whose overall size
         breathes on its own and swells with pointer speed; every point's
         push strength and angle also drift over time, so no two passes look
         alike. Displaced points glow a stronger blue while they're disturbed.
     Drawn in colour buckets: a few dozen fillStyle changes per frame. */
  (function(){
    var c=document.getElementById("bgfx");
    if(!c||reduce||!c.getContext)return;
    var ctx=c.getContext("2d");
    if(!ctx)return;

    var W=0,H=0,gap=50,dpr=1,dots=[],pal=[],neon=[],buckets=[],nbk=[];
    var px=-9999,py=-9999,lpx=0,lpy=0,wasOn=false,spd=0,moveAmt=0,pIn=0,running=true;
    var NC=7,NA=5,NB=NC*NA,NL=3;
    var R=285;
    /* clicks send a shockwave through the dots */
    var ripples=[], RIP_LIFE=1.4;

    function rgba(c,a){return "rgba("+c[0]+","+c[1]+","+c[2]+","+a+")"}
    function ramp(stops,n){
      var out=[];
      for(var i=0;i<n;i++){
        var f=i/(n-1)*(stops.length-1),i0=Math.min(stops.length-2,f|0),m=f-i0,col=[];
        for(var k=0;k<3;k++)col.push(Math.round(stops[i0][k]+(stops[i0+1][k]-stops[i0][k])*m));
        out.push(col);
      }
      return out;
    }

    function buildPalette(){
      var light=document.documentElement.dataset.theme==="light";
      /* resting field: deep blues only */
      var rest=ramp(light
        ?[[59,130,246],[37,99,235],[96,165,250],[29,78,216],[75,145,250]]
        :[[96,165,250],[59,130,246],[125,180,255],[37,99,235],[110,170,250]],NC);
      var aMin=light?.14:.13, aMax=light?.48:.46;
      pal=[];
      for(var ci=0;ci<NC;ci++)
        for(var ai=0;ai<NA;ai++)pal.push(rgba(rest[ci],(aMin+(aMax-aMin)*ai/(NA-1)).toFixed(3)));
      /* disturbed points: stronger blues, with a couple of violets mixed in */
      var N=light
        ?[[37,99,235],[29,78,216],[59,130,246],[124,77,219],[96,165,250],[99,102,241],[59,130,246]]
        :[[96,165,250],[59,130,246],[125,180,255],[167,139,250],[147,197,253],[129,140,248],[110,170,250]];      var lv=light?[.6,.8,.96]:[.65,.85,1];
      neon=[];
      for(var n=0;n<NC;n++)for(var l=0;l<NL;l++)neon.push(rgba(N[n],lv[l]));
    }

    function build(){
      var seed=20260919;
      function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
      var cols=Math.ceil(W/gap)+3, rows=Math.ceil(H/gap)+3;
      dots=[];
      for(var iy=0;iy<rows;iy++){
        for(var ix=0;ix<cols;ix++){
          var jx=(rnd()-.5)*gap*.92, jy=(rnd()-.5)*gap*.92;
          if(rnd()<.08)continue;
          dots.push({
            x:ix*gap-gap*1.5+jx, y:iy*gap-gap*1.5+jy,
            f1:.07+rnd()*.3, f2:.29+rnd()*.8, f3:.8+rnd()*1.9,
            p1:rnd()*6.283, p2:rnd()*6.283, p3:rnd()*6.283,
            ga:1.1+rnd()*3.0, am:.6+rnd()*1.0,
            hu:rnd(), hs:.008+rnd()*.05,
            dr:1.2+rnd()*5.5, dp:rnd()*6.283, ds:.07+rnd()*.34, fa:.25+rnd()*1.3,
            st:.45+rnd()*1.1, aj:(rnd()-.5)*1.1, ks:.04+rnd()*.19,
            ox:0, oy:0, glow:0
          });
        }
      }
      buckets=[];for(var i=0;i<NB;i++)buckets.push([]);
      nbk=[];for(var j=0;j<NC*NL;j++)nbk.push([]);
    }

    function resize(){
      W=innerWidth;H=innerHeight;
      dpr=Math.min(devicePixelRatio||1,2);
      gap=W<700?60:50;
      c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);
      c.style.width=W+"px";c.style.height=H+"px";
      ctx.setTransform(dpr,0,0,dpr,0,0);
      build();
    }

    addEventListener("resize",resize,{passive:true});
    addEventListener("pointermove",function(e){px=e.clientX;py=e.clientY},{passive:true});
    addEventListener("pointerdown",function(e){
      if(ripples.length<4)ripples.push({x:e.clientX,y:e.clientY,t:performance.now()*.001});
    },{passive:true});
    document.addEventListener("pointerleave",function(){px=py=-9999});
    addEventListener("blur",function(){px=py=-9999});
    document.addEventListener("visibilitychange",function(){running=!document.hidden});
    new MutationObserver(buildPalette).observe(document.documentElement,
      {attributes:true,attributeFilter:["data-theme"]});
    var mq=matchMedia("(prefers-color-scheme:dark)");
    if(mq.addEventListener)mq.addEventListener("change",buildPalette);

    buildPalette();resize();

    function draw(now){
      requestAnimationFrame(draw);
      if(!running)return;
      var t=now*.001, sy=(scrollY||0)*.025, sOff=sy%(gap*3);
      ctx.clearRect(0,0,W,H);
      var i,b,j;
      while(ripples.length&&t-ripples[0].t>RIP_LIFE)ripples.shift();
      for(i=0;i<NB;i++)buckets[i].length=0;
      for(i=0;i<nbk.length;i++)nbk[i].length=0;

      var on=px>-9000;
      pIn+=((on?1:0)-pIn)*.09;

      /* pointer speed, smoothed */
      if(on&&!wasOn){lpx=px;lpy=py}
      wasOn=on;
      var pv=on?Math.hypot(px-lpx,py-lpy):0;
      lpx=px;lpy=py;
      spd+=(pv-spd)*.1;

      /* still: the reach is 2x the base. moving: it settles to one fixed,
         smaller reach — not something that keeps changing while you move,
         just an eased switch between the two states. */
      var moving=spd>1.6?1:0;
      moveAmt+=(moving-moveAmt)*.035;                 /* slow ease both ways */
      var sprd=2-moveAmt*.5;                          /* 2.0 still -> 1.5 moving */
      var Rd=R*sprd, RB=Rd*1.62, RB2=RB*RB, PUSH=R*.36;
      var lobeShift=Math.sin(t*.31)*2;

      /* wind comes in gusts */
      var gust=.45+1.1*(.5+.5*Math.sin(t*.13))*(.5+.5*Math.sin(t*.41+2));

      for(i=0;i<dots.length;i++){
        var d=dots[i];

        /* irregular pulse; the slow gate makes flares bunch up unpredictably */
        var n=(Math.sin(t*d.f1+d.p1)+.6*Math.sin(t*d.f2+d.p2)+.35*Math.sin(t*d.f3+d.p3))*.5128;
        var gate=.5+.5*Math.sin(t*d.f1*.37+d.p2);
        var k=Math.pow((n+1)*.5,d.ga)*(.45+.55*gate);
        var size=.6+k*3.4*d.am;
        var ai=(k*(NA-1)+.5)|0; if(ai>=NA)ai=NA-1;

        /* own wander (its reach pulses too), then the gusting wind */
        var w=t*d.ds+d.dp, reach=d.dr*(.4+.9*Math.abs(Math.sin(t*d.ds*.7+d.p1)));
        var bx=d.x+Math.sin(w)*reach;
        var by=d.y+Math.cos(w*.83+d.p2)*reach+sOff;
        var g=gust*d.fa;
        bx+=(Math.sin(by*.0042+t*.23)*7+Math.sin((bx+by)*.0027-t*.17)*5)*g;
        by+=(Math.cos(bx*.0038-t*.19)*7+Math.sin((bx-by)*.0031+t*.14)*5)*g;

        /* shove off a lumpy, shifting boundary */
        var tx=0,ty=0;
        if(pIn>.01&&on){
          var dx=bx-px,dy=by-py,dd=dx*dx+dy*dy;
          if(dd<RB2){
            var dist=Math.sqrt(dd)||1,ang=Math.atan2(dy,dx);
            var Rt=Rd*(1+.24*Math.sin(3*ang+t*1.3+lobeShift)+.15*Math.sin(5*ang-t*.9+1.7)
                       +.1*Math.sin(2*ang+t*2.1)+.07*Math.sin(7*ang+t*1.7));
            if(dist<Rt){
              var f=1-dist/Rt; f=f*f*(3-2*f);
              /* strength and angle drift over time for each point */
              var a2=ang+d.aj*(.4+Math.sin(t*d.f1*2.3+d.p3))*(1-f*.5);
              var push=f*PUSH*d.st*(.65+.35*Math.sin(t*d.f2*1.7+d.p1))*pIn;
              tx=Math.cos(a2)*push; ty=Math.sin(a2)*push;
            }
          }
        }
        d.ox+=(tx-d.ox)*d.ks; d.oy+=(ty-d.oy)*d.ks;
        var x=bx+d.ox, y=by+d.oy;

        var disp=Math.sqrt(d.ox*d.ox+d.oy*d.oy)/PUSH;
        d.glow+=(Math.min(1,disp*1.7)-d.glow)*.14;

        /* shockwave: a ring races outward from each click, shoving and lighting what it crosses */
        for(var q=0;q<ripples.length;q++){
          var rp=ripples[q], age=t-rp.t, rdx=x-rp.x, rdy=y-rp.y, rd=Math.sqrt(rdx*rdx+rdy*rdy)||1;
          var rk=1-Math.abs(rd-age*640)/75;
          if(rk>0){rk*=1-age/RIP_LIFE;x+=rdx/rd*rk*24;y+=rdy/rd*rk*24;if(rk>d.glow)d.glow=rk}
        }

        if(x<-12||x>W+12||y<-12||y>H+12)continue;

        var h=d.hu+t*d.hs+.09*Math.sin(t*d.f1*.5+d.p3); h-=Math.floor(h);
        var ci=(h*NC)|0; if(ci>=NC)ci=NC-1;

        if(d.glow>.07){
          var gl=d.glow>.62?2:d.glow>.28?1:0;
          nbk[ci*NL+gl].push(x,y,Math.max(size,1.6)+d.glow*3.4);
        }else{
          buckets[ci*NA+ai].push(x,y,size);
        }
      }

      for(i=0;i<NB;i++){
        b=buckets[i]; if(!b.length)continue;
        ctx.fillStyle=pal[i];
        for(j=0;j<b.length;j+=3){var z=b[j+2];ctx.fillRect(b[j]-z*.5,b[j+1]-z*.5,z,z)}
      }
      /* disturbed points: one solid disc each */
      for(i=0;i<nbk.length;i++){
        b=nbk[i]; if(!b.length)continue;
        ctx.fillStyle=neon[i]; ctx.beginPath();
        for(j=0;j<b.length;j+=3){var r=b[j+2]*.5;ctx.moveTo(b[j]+r,b[j+1]);ctx.arc(b[j],b[j+1],r,0,6.2832)}
        ctx.fill();
      }
    }
    requestAnimationFrame(draw);
  })();

  /* ── headline breaks apart on scroll ──
     Each letter gets its own flight: direction, spin, scale, and the moment
     it lets go. The first few pixels of scroll crack the line slightly out of
     true; then letters break off one by one. Scrolling back reassembles it.
     The markup keeps the whole phrase as an aria-label, so it still reads
     as one sentence to screen readers. */
  (function(){
    var host=document.querySelector(".hero h1 .grad");
    if(!host||reduce)return;
    var h1=host.closest("h1");
    var text=host.textContent;
    /* a <br> contributes no text, so join the lines with a space ourselves */
    var label="";
    [].forEach.call(h1.childNodes,function(nd){label+=nd.nodeName==="BR"?" ":nd.textContent});
    h1.setAttribute("aria-label",label.replace(/\s+/g," ").trim());

    var seed=917;
    function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
    var chars=[];
    host.textContent="";
    host.classList.add("split");
    host.setAttribute("aria-hidden","true");
    text.split(" ").forEach(function(word,wi,all){
      var ws=document.createElement("span");ws.className="w";
      if(word.toLowerCase()==="faster.")ws.className+=" fast";
      for(var i=0;i<word.length;i++){
        var cs=document.createElement("span");cs.className="ch";cs.textContent=word[i];
        ws.appendChild(cs);
        var ang=rnd()*6.283;
        chars.push({el:cs,
          dx:Math.cos(ang)*(80+rnd()*300),
          dy:Math.sin(ang)*(50+rnd()*180)+60+rnd()*220,   /* most fall, some rise */
          rot:(rnd()-.5)*260, sc:.45+rnd()*.9,
          dl:rnd()*.55,                                   /* when it lets go */
          cx:(rnd()-.5)*7, cy:(rnd()-.5)*6, cr:(rnd()-.5)*9, /* first crack */
          on:false});
      }
      host.appendChild(ws);
      if(wi<all.length-1)host.appendChild(document.createTextNode(" "));
    });

    /* colour each letter along the heading's gradient */
    function hex(v,d){v=(v||"").trim();
      return /^#[0-9a-f]{6}$/i.test(v)?[parseInt(v.substr(1,2),16),parseInt(v.substr(3,2),16),parseInt(v.substr(5,2),16)]:d}
    function paint(){
      var cs=getComputedStyle(document.documentElement);
      var a=hex(cs.getPropertyValue("--accent"),[122,162,255]),b=hex(cs.getPropertyValue("--accent-2"),[167,139,250]);
      for(var i=0;i<chars.length;i++){
        var m=chars.length>1?i/(chars.length-1):0, col=[];
        for(var k=0;k<3;k++)col.push(Math.round(a[k]+(b[k]-a[k])*m));
        chars[i].el.style.color="rgb("+col.join(",")+")";
      }
    }
    paint();
    new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});

    /* The sentence assembles from scattered parts on arrival: every letter
       flies in from its own debris position (the same spread scroll throws
       it to), sharpens, and flashes as it locks. "faster." zips in quicker
       than the rest. Runs on translate/rotate/scale, so it composes with the
       scroll shatter (transform) and the "faster." shake (on the word). */
    var W=[].slice.call(host.querySelectorAll(".w")), sorted=true;
    if(typeof host.animate==="function"){
      sorted=false;
      var build=function(){
        var slow=chars.filter(function(c){return !c.el.parentNode.classList.contains("fast")});
        var fast=chars.filter(function(c){return c.el.parentNode.classList.contains("fast")});
        var end=0;
        function fly(c,delay,dur,spread){
          var dx=(c.dx*spread).toFixed(1), dy=((c.dy-150)*spread).toFixed(1);
          var a={translate:dx+"px "+dy+"px",rotate:(c.rot*1.4).toFixed(0)+"deg",scale:String(c.sc),opacity:0,filter:"blur(8px) brightness(1)"};
          var mid={translate:(dx*.12).toFixed(1)+"px "+(dy*.12).toFixed(1)+"px",rotate:(c.rot*.1).toFixed(0)+"deg",scale:"1",opacity:1,filter:"blur(1px) brightness(1)",offset:.62};
          var lock={translate:"0px 0px",rotate:"0deg",scale:"1.12",opacity:1,filter:"blur(0px) brightness(2.3)",offset:.84};
          var z={translate:"0px 0px",rotate:"0deg",scale:"1",opacity:1,filter:"blur(0px) brightness(1)"};
          c.el.animate([a,mid,lock,z],{duration:dur,delay:delay,easing:"cubic-bezier(.2,.8,.25,1)",fill:"backwards"});
          end=Math.max(end,delay+dur);
        }
        slow.forEach(function(c,i){fly(c,120+i*30,900,.8)});
        var t0=120+slow.length*30-200;
        fast.forEach(function(c,i){fly(c,t0+i*14,380,1.25)});
        setTimeout(function(){sorted=true},end+50);
      };
      if(h1.classList.contains("in"))build();
      else{
        var amo=new MutationObserver(function(){if(h1.classList.contains("in")){amo.disconnect();build()}});
        amo.observe(h1,{attributes:true,attributeFilter:["class"]});
      }
    }

    /* hover a word to take it apart; it snaps back faster than it left */
    W.forEach(function(w){
      w.addEventListener("pointerenter",function(){
        if(!sorted)return;
        w.classList.add("apart");
        [].forEach.call(w.children,function(c){
          c.style.translate=((Math.random()-.5)*34).toFixed(1)+"px "+(-(8+Math.random()*26)).toFixed(1)+"px";
          c.style.rotate=((Math.random()-.5)*70).toFixed(0)+"deg";
        });
      });
      w.addEventListener("pointerleave",function(){
        w.classList.remove("apart");
        [].forEach.call(w.children,function(c){c.style.translate="";c.style.rotate=""});
      });
    });

    var heroPin=document.getElementById("heroPin"),ticking=false;
    /* pin the hero at the top of the viewport for the length of the break
       sequence — plain scrollY would carry the heading off under the nav
       long before the animation had room to finish. */
    if(heroPin)document.documentElement.classList.add("pinbreak");

    function update(){
      ticking=false;
      var p=0;
      if(heroPin){
        /* the pin physically releases after this much scroll (~30% of
           the full sequence); progress keeps counting on the larger
           scale so the remaining 70% plays out as the user scrolls on,
           unpinned, rather than holding them in place for it */
        var releasePx=heroPin.offsetHeight-heroPin.firstElementChild.offsetHeight;
        var fullPx=releasePx/.3;
        if(fullPx>1){
          var top=heroPin.getBoundingClientRect().top;
          p=Math.min(1,Math.max(0,-top/fullPx));
        }
      }
      var crack=Math.min(1,p*7);
      for(var i=0;i<chars.length;i++){
        var c=chars[i];
        if(p<=0){ if(c.on){c.el.style.transform="";c.el.style.opacity="";c.on=false} continue; }
        var q=(p-c.dl)/(1-c.dl); q=q<0?0:q>1?1:q; q=q*q*(3-2*q);
        var X=c.cx*crack+c.dx*q, Y=c.cy*crack+c.dy*q, Rz=c.cr*crack+c.rot*q, S=1+(c.sc-1)*q;
        c.el.style.transform="translate3d("+X.toFixed(1)+"px,"+Y.toFixed(1)+"px,0) rotate("+Rz.toFixed(1)+"deg) scale("+S.toFixed(3)+")";
        c.el.style.opacity=q>.3?(1-(q-.3)/.7).toFixed(3):"";
        c.on=true;
      }
    }
    addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
    update();
  })();

  /* ── the terminal of truth ──
     Plays one small developer disaster at a time, ending on a # comment.
     Only runs while it's on screen. Scene lines are either {cmd} (typed out)
     or {out:[[text,class],…]} (printed); everything is built as text nodes. */
  (function(){
    var joke=document.getElementById("joke");
    if(!joke)return;
    var body=document.getElementById("ttyBody"), title=document.getElementById("ttyTitle");
    var bFix=document.getElementById("bFix"), bNew=document.getElementById("bNew"), cups=document.getElementById("cups");

    if(reduce)return;

    var S=[
      {t:"~/api — zsh",say:"99 little bugs in the code. patch one down… 127 little bugs in the code.",fix:1,add:28,l:[
        {cmd:"./fix.sh --the-one-bug"},
        {out:[["→ patching the bug… ","dm"],["done ✓","ok"]]},
        {out:[["→ running tests…","dm"]]},
        {out:[["✗ 127 failing, 3 flaky, 1 on fire","er"]]}]},
      {t:"~/app — zsh",say:"works on my machine ¯\\_(ツ)_/¯",fix:1,add:1,l:[
        {cmd:"npm run build"},
        {out:[["✓ compiled in 1.2s","ok"]]},
        {cmd:"ssh prod \"npm run build\""},
        {out:[["✗ Error: Cannot find module 'my-machine'","er"]]},
        {cmd:"docker build -t my-machine ."},
        {out:[["✓ shipping my machine to prod","ok"]]}]},
      {t:"~/sahil — zsh",say:"commit messages are a cry for help.",fix:1,add:2,l:[
        {cmd:"git log --oneline"},
        {out:[["a1f3c2e ","hl"],["fix",""]]},
        {out:[["b7e9d10 ","hl"],["fix again",""]]},
        {out:[["c3d4e5f ","hl"],["actually fix",""]]},
        {out:[["d9f8e7a ","hl"],["pls work",""]]},
        {out:[["e0a1b2c ","hl"],["final",""]]},
        {out:[["f1c2d3e ","hl"],["final_FINAL_v2",""]]}]},
      {t:"notes.txt — vim",say:"day 3 inside vim. send snacks.",fix:0,add:1,l:[
        {cmd:"vim notes.txt"},
        {cmd:":exit",pr:""},
        {out:[["E492: Not an editor command: exit","er"]]},
        {cmd:":quit please",pr:""},
        {out:[["E488: Trailing characters: please","er"]]},
        {cmd:"^C ^C ^C",pr:""},
        {out:[["Type :qa! and press <Enter> to exit Vim","dm"]]},
        {cmd:":qa!",pr:""},
        {out:[["✓ free at last","ok"]]}]},
      {t:"~/infra — zsh",say:"friday, 17:58, force push. bold. i'll be in #incidents.",fix:0,add:3,l:[
        {cmd:"date"},
        {out:[["Fri 17:58:04 IST","wa"]]},
        {cmd:"git push --force origin main"},
        {out:[["⚠ pushing to main on a friday. sure? [y/N] ","wa"],["y",""]]},
        {out:[["✓ deployed. see you monday.","ok"]]},
        {out:[["pager: 3 new alerts","er"]]}]},
      {t:"~/api — zsh",say:"it's not DNS. there's no way it's DNS. … it was DNS.",fix:1,add:0,l:[
        {cmd:"curl https://api.sahil.dev/health"},
        {out:[["✗ timed out after 30s","er"]]},
        {cmd:"./blame --everything"},
        {out:[["code ","dm"],["ok","ok"],["   db ","dm"],["ok","ok"],["   network ","dm"],["ok","ok"]]},
        {out:[["dns  ","dm"],["¯\\_(ツ)_/¯","wa"]]}]},
      {t:"~/jira — zsh",say:"it's not a bug. it's an undocumented feature.",fix:1,add:0,l:[
        {cmd:"jira close BUG-404 --reason \"works as intended\""},
        {out:[["✓ BUG-404 reclassified as FEATURE-404","ok"]]},
        {cmd:"git commit -am \"docs: feature, not a bug\""},
        {out:[["[main 404c0de] docs: feature, not a bug","dm"]]}]},
      {t:"~/app — zsh",say:"have you tried deleting node_modules?",fix:1,add:2,l:[
        {cmd:"du -sh node_modules"},
        {out:[["1.3T    node_modules","wa"]]},
        {cmd:"rm -rf node_modules && npm i"},
        {out:[["added 1,847 packages, 3 of them useful","dm"]]},
        {out:[["✓ works now. nobody knows why.","ok"]]}]},
      {t:"~/cs — zsh",say:"and naming things. and naming things.",fix:0,add:1,l:[
        {cmd:"cat hard_problems.txt"},
        {out:[["1. ","dm"],["cache invalidation",""]]},
        {out:[["2. ","dm"],["naming things",""]]},
        {out:[["3. ","dm"],["off-by-one errors",""]]},
        {out:[["4. ","dm"],["off-by-one errors",""]]}]},
      {t:"~/app — zsh",say:"javascript is working as intended. nobody knows what it intends.",fix:0,add:1,l:[
        {cmd:"node -p \"0.1 + 0.2\""},
        {out:[["0.30000000000000004","wa"]]},
        {cmd:"node -p \"[] + {}\""},
        {out:[["[object Object]","wa"]]},
        {cmd:"node -p \"typeof NaN\""},
        {out:[["'number'","wa"]]}]},
      {t:"~/app — zsh",say:"all green. by testing nothing.",fix:0,add:4,l:[
        {cmd:"npm test"},
        {out:[["✓ 142 passing (0.8s)","ok"]]},
        {cmd:"npm run coverage"},
        {out:[["statements  ","dm"],["3.1%","er"]]},
        {out:[["branches    ","dm"],["0%","er"]]}]},
      {t:"~/sprint — zsh",say:"\"it's a small change\" — famous last words.",fix:1,add:3,l:[
        {cmd:"estimate --task \"tiny css fix\""},
        {out:[["→ 2 hours","ok"]]},
        {cmd:"actual --task \"tiny css fix\""},
        {out:[["→ 3 sprints, 1 refactor, 2 existential crises","er"]]}]},
      {t:"~/auth — zsh",say:"you had one problem. you used regex. now you have two.",fix:0,add:2,l:[
        {cmd:"regex --explain '^(?=.*[A-Z])(?=.*\\d)(?!.*(.)\\1).{8,}$'"},
        {out:[["✗ explanation not found","er"]]},
        {out:[["✗ author not found either","er"]]}]},
      {t:"~/legacy — zsh",say:"later never came.",fix:0,add:1,l:[
        {cmd:"git blame utils.js | grep TODO"},
        {out:[["a91f00d (sahil 2022-03-14) ","hl"],["// TODO: fix later",""]]},
        {out:[["b02e11f (sahil 2023-01-09) ","hl"],["// TODO: seriously fix this",""]]},
        {out:[["c7d9e44 (sahil 2024-06-30) ","hl"],["// don't touch. it works. idk why.",""]]}]},
      {t:"~/prod — psql",say:"always check which terminal tab you're in.",fix:0,add:0,l:[
        {cmd:"psql prod -c \"DELETE FROM users\""},
        {out:[["⚠ no WHERE clause. this deletes 1,204,331 rows.","wa"]]},
        {out:[["continue? [y/N] ","wa"],["n",""]]},
        {out:[["✓ heart rate returning to normal","ok"]]}]},
      {t:"~/app — zsh",say:"confidently wrong, beautifully formatted.",fix:1,add:2,l:[
        {cmd:"ai \"fix my bug\""},
        {out:[["✓ Great question! Here's the fix:","ok"]]},
        {out:[["  - import { fix } from 'fix'","dm"]]},
        {cmd:"npm i fix"},
        {out:[["✗ 404 Not Found - 'fix' does not exist","er"]]}]},
      {t:"~/calendar — zsh",say:"wrote 0 lines of code. very productive day.",fix:0,add:0,l:[
        {cmd:"cal --today"},
        {out:[["10:00 ","dm"],["standup",""]]},
        {out:[["11:00 ","dm"],["sync about the standup",""]]},
        {out:[["14:00 ","dm"],["meeting that could've been an email",""]]},
        {out:[["16:00 ","dm"],["email about the meeting",""]]}]},
      {t:"~/app — zsh",say:"the code is the documentation. the code is also lying.",fix:0,add:1,l:[
        {cmd:"cat README.md"},
        {out:[["# my-app","hl"]]},
        {out:[["TODO: write docs","dm"]]},
        {cmd:"cat CONTRIBUTING.md"},
        {out:[["see README.md","dm"]]}]},
      {t:"~/kitchen — zsh",say:"the only honest status code.",fix:0,add:0,l:[
        {cmd:"curl -I http://coffee-pot.local"},
        {out:[["HTTP/1.1 418 I'm a teapot","wa"]]}]},
      {t:"~/review — zsh",say:"38 comments. 0 about the actual logic.",fix:0,add:1,l:[
        {cmd:"gh pr view 1337 --comments"},
        {out:[["reviewer: ","hl"],["nit: tabs, not spaces",""]]},
        {out:[["reviewer: ","hl"],["nit: spaces, not tabs",""]]},
        {out:[["reviewer: ","hl"],["LGTM (didn't read)",""]]}]},
      {t:"~/cs — zsh",say:"see: recursion.",fix:0,add:0,l:[
        {cmd:"man recursion"},
        {out:[["RECURSION(1)","hl"]]},
        {out:[["    see: ","dm"],["man recursion",""]]}]},
      {t:"~/oncall — zsh",say:"it's 3am. prod doesn't care about your feelings.",fix:1,add:1,l:[
        {cmd:"uptime"},
        {out:[["03:12 up 19 hours, load average: 4 coffees","wa"]]},
        {cmd:"sleep 8h"},
        {out:[["^C  pager: prod is down","er"]]}]}
    ];
    /* keep the first scene fixed for the first impression, shuffle the rest */
    for(var k=S.length-1;k>1;k--){var r=1+Math.floor(Math.random()*k),tmp=S[k];S[k]=S[r];S[r]=tmp}
    var COFFEE={t:"~/kitchen — zsh",say:"refuelled. back to writing bugs.",fix:0,add:0,l:[
      {cmd:"brew install coffee"},
      {out:[["==> Pouring coffee--5.0.espresso.bottle.tar.gz","dm"]]},
      {out:[["✓ coffee 5.0: 5 cups installed","ok"]]}]};

    var fixed=41, created=42, coffee=4, si=0;
    var live=false, pending=null, timer=0;
    function later(fn,ms){timer=setTimeout(function(){if(live)fn();else pending=fn},ms)}

    var cur=document.createElement("span");cur.className="cur";
    function add(text,cls){
      var n=cls?document.createElement("span"):document.createTextNode(text);
      if(cls){n.className=cls;n.textContent=text}
      body.insertBefore(n,cur);return n;
    }
    function scroll(){body.scrollTop=body.scrollHeight}
    function paintCups(){[].forEach.call(cups.children,function(c,i){c.className=i<coffee?"":"e"})}

    function play(sc){
      body.textContent="";body.appendChild(cur);title.textContent=sc.t;
      var li=0;
      (function next(){
        if(li>=sc.l.length){
          later(function(){
            add("# "+sc.say,"dm");add("\n");scroll();
            fixed+=sc.fix;created+=sc.add;
            bFix.textContent=fixed;bNew.textContent=created;
            later(nextScene,4200);
          },350);
          return;
        }
        var ln=sc.l[li++];
        if(ln.cmd!=null){
          var pr=ln.pr==null?"$ ":ln.pr;
          if(pr)add(pr,"p");
          var tn=add(""),ci=0;
          (function type(){
            if(ci<ln.cmd.length){tn.textContent+=ln.cmd[ci++];later(type,32+Math.random()*55);return}
            later(function(){add("\n");scroll();next()},380);
          })();
        }else{
          later(function(){
            ln.out.forEach(function(seg){add(seg[0],seg[1]||"")});
            add("\n");scroll();next();
          },300);
        }
      })();
    }
    function nextScene(){
      if(coffee<=0){coffee=5;paintCups();play(COFFEE);return}
      coffee--;paintCups();
      play(S[si]);si=(si+1)%S.length;
    }

    var started=false;
    function setLive(on){
      live=on;
      if(on&&!started){started=true;later(nextScene,2200);return}
      if(on&&pending){var f=pending;pending=null;f()}
    }
    if("IntersectionObserver" in window)
      new IntersectionObserver(function(es){setLive(es[0].isIntersecting)}).observe(joke);
    else setLive(true);
    document.addEventListener("visibilitychange",function(){
      if(document.hidden)live=false;else if(joke.getBoundingClientRect().bottom>0)setLive(true);
    });

    /* the terminal leans slightly toward the pointer */
    var tty=joke.querySelector(".tty"),tx=0,ty=0,cx=0,cy=0,raf=0;
    addEventListener("pointermove",function(e){
      tx=(e.clientX/innerWidth-.5)*9;ty=(e.clientY/innerHeight-.5)*-6;
      if(!raf)raf=requestAnimationFrame(ease);
    },{passive:true});
    function ease(){
      raf=0;cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;
      tty.style.setProperty("--tx",cx.toFixed(2)+"deg");tty.style.setProperty("--ty",cy.toFixed(2)+"deg");
      if(Math.abs(tx-cx)>.03||Math.abs(ty-cy)>.03)raf=requestAnimationFrame(ease);
    }
  })();

  /* ── name decodes in ──
     "Sahil Shahane" is set in the mono face; each letter cycles through
     random glyphs and locks into place left to right, like a terminal
     decrypting a string. Starts once the heading's own fade/slide reveal
     has landed (watched via its "in" class, same trigger the rest of the
     reveal system uses), so it doesn't fire while the letters are still
     sliding up into view. */
  (function(){
    var host=document.querySelector(".hero h1 .name");
    if(!host||reduce)return;
    var real=host.textContent;
    var glyphs="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&*+-/<>";
    var chars=real.split("").map(function(ch){
      var span=document.createElement("span");
      span.textContent=ch===" "?" ":ch;
      return {el:span,ch:ch,done:ch===" "};
    });
    host.textContent="";
    chars.forEach(function(c){host.appendChild(c.el)});

    function run(){
      var t0=performance.now(), perChar=55, headStart=220;
      function frame(now){
        var elapsed=now-t0, allDone=true;
        chars.forEach(function(c,i){
          if(c.done)return;
          if(elapsed>=i*perChar+headStart){c.el.textContent=c.ch;c.done=true;return}
          allDone=false;
          c.el.textContent=glyphs[(Math.random()*glyphs.length)|0];
        });
        if(!allDone)requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var h1=host.closest("h1");
    if(h1.classList.contains("in")){run()}
    else{
      var mo=new MutationObserver(function(){
        if(h1.classList.contains("in")){mo.disconnect();run()}
      });
      mo.observe(h1,{attributes:true,attributeFilter:["class"]});
    }
  })();

  /* ── typing line ──
     The markup already holds a readable first phrase; JS only takes over
     if it can actually animate, so a failure leaves real text on screen. */
  (function(){
    var el=document.getElementById("type");
    if(!el)return;
    var words=(el.dataset.words||"").split(";").filter(Boolean);
    if(reduce||words.length<2)return;
    var wi=0,ci=0,deleting=false,timer;
    function tick(){
      var word=words[wi];
      /* check the boundaries before moving, so any starting ci is safe */
      if(!deleting&&ci>=word.length){deleting=true;timer=setTimeout(tick,2100);return}
      if(deleting&&ci<=0){deleting=false;wi=(wi+1)%words.length;timer=setTimeout(tick,420);return}
      ci+=deleting?-1:1;
      el.textContent=word.slice(0,ci);
      timer=setTimeout(tick,deleting?38:78);
    }
    /* only run while the hero is on screen — no background timers */
    if("IntersectionObserver" in window){
      new IntersectionObserver(function(es){
        es.forEach(function(e){
          if(e.isIntersecting&&!timer){ci=words[0].length;tick()}
          else if(!e.isIntersecting&&timer){clearTimeout(timer);timer=null}
        });
      },{threshold:0}).observe(el);
    }else{ci=words[0].length;tick()}
  })();

  /* ── antigravity cursor ──
     A ring lags the pointer on a spring; nearby cards and pills drift away
     from it, so the page feels like it is repelling the cursor. */
  (function(){
    if(reduce||!matchMedia("(hover:hover)").matches||innerWidth<=720)return;
    var ring=document.createElement("div"); ring.className="agc agc-ring";
    var dot=document.createElement("div");  dot.className="agc agc-dot";
    document.body.appendChild(ring); document.body.appendChild(dot);

    var mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my;
    var floaters=[].slice.call(document.querySelectorAll(".card,.pill,.chip,.btn"));
    /* Each floater's dodge is driven entirely from here in plain JS —
       eased and written straight to el.style.transform every frame —
       rather than through a CSS custom property composed by a separate
       cascade of :hover / ".in" rules. That indirection is what broke
       silently before: several rules across the stylesheet all had a say
       in the same `transform`, and it took an exact, static :hover match
       (effectively, a click) for the right one to win. One JS-owned value
       has no cascade to get out of sync with. */
    var fstate=floaters.map(function(f){
      return {el:f, ox:0, oy:0, ready:false,
        hot:false, hoverLift:f.classList.contains("card")?-4:-2};
    });
    fstate.forEach(function(s){
      s.el.addEventListener("pointerenter",function(){s.hot=true});
      s.el.addEventListener("pointerleave",function(){s.hot=false});
    });

    /* Visibility is a state, not a one-way latch: show() and hide() can each
       run any number of times. The native cursor is only suppressed while our
       ring is actually visible, so the worst failure is a normal arrow. */
    var shown=false;
    function show(){
      if(shown)return; shown=true;
      ring.classList.remove("hide"); dot.classList.remove("hide");
      document.body.classList.add("agc-on");
    }
    function hide(){
      if(!shown)return; shown=false;
      ring.classList.add("hide"); dot.classList.add("hide");
      document.body.classList.remove("agc-on");
    }
    /* start hidden: until the pointer moves we don't know where it is, and
       hiding the real cursor before then just loses it */
    ring.classList.add("hide"); dot.classList.add("hide");

    addEventListener("pointermove",function(e){
      mx=e.clientX;my=e.clientY;
      show();
      dot.style.transform="translate3d("+mx+"px,"+my+"px,0)";
      var hot=e.target&&e.target.closest&&e.target.closest("a,button,.card");
      ring.classList.toggle("hot",!!hot);
    },{passive:true});
    addEventListener("pointerdown",function(){ring.classList.add("hot")},{passive:true});
    addEventListener("pointerup",function(){ring.classList.remove("hot")},{passive:true});

    /* every way the pointer can leave without a further pointermove */
    document.addEventListener("pointerleave",hide);
    document.addEventListener("mouseleave",hide);
    addEventListener("blur",hide);
    addEventListener("pointercancel",hide);
    document.addEventListener("visibilitychange",function(){if(document.hidden)hide()});

    /* Cache each floater's centre in DOCUMENT coordinates, so the rAF loop
       never reads layout — it only subtracts scroll. Re-measured on resize
       and after scrolling settles; transforms don't move layout, so these
       stay valid while the cursor pushes things around. */
    var pts=[],measured=false;
    function measure(){
      var sx=scrollX,sy=scrollY;
      for(var i=0;i<fstate.length;i++){
        var b=fstate[i].el.getBoundingClientRect();
        pts[i]={cx:b.left+b.width/2+sx, cy:b.top+b.height/2+sy};
      }
      measured=true;
    }
    var remeasure;
    function scheduleMeasure(){clearTimeout(remeasure);remeasure=setTimeout(measure,120)}
    addEventListener("resize",scheduleMeasure,{passive:true});
    addEventListener("scroll",scheduleMeasure,{passive:true});
    addEventListener("load",measure);
    /* a card or pill just revealed is still mid-entrance (slide/tilt/pop) —
       wait for that transition to actually finish before trusting its
       position, or the cached point ends up a little off from where the
       element actually settles and the dodge silently never triggers */
    var remeasureReveal;
    addEventListener("app:reveal",function(){
      clearTimeout(remeasureReveal); remeasureReveal=setTimeout(measure,950);
    },{passive:true});
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measure);
    measure();

    var frame=0;
    (function loop(){
      rx+=(mx-rx)*.16; ry+=(my-ry)*.16;
      ring.style.transform="translate3d("+rx.toFixed(1)+"px,"+ry.toFixed(1)+"px,0)";
      if(measured&&(frame++&1)===0){
        var sx=scrollX,sy=scrollY,vh=innerHeight,R=170;
        for(var i=0;i<fstate.length;i++){
          var p=pts[i],s=fstate[i],f=s.el;
          if(!p)continue;

          /* Leave the element to CSS (its entrance animation, or plain
             `transform:none` once settled) until that animation has
             actually finished — otherwise taking over immediately would
             cut the reveal short every time. Checked lazily, once, the
             first time we have reason to touch this element at all. */
          if(!s.ready){
            var ct=getComputedStyle(f).transform;
            if(ct==="none"||ct==="matrix(1, 0, 0, 1, 0, 0)")s.ready=true;
            else continue;
          }

          var vy=p.cy-sy;
          var offscreen=(vy<-120||vy>vh+120);
          var tx=0,ty=0;
          if(!offscreen){
            var dx=p.cx-sx-mx, dy=vy-my, d=Math.sqrt(dx*dx+dy*dy);
            if(d<R&&d>0){var push=(1-d/R)*14; tx=dx/d*push; ty=dy/d*push}
          }
          if(s.hot)ty+=s.hoverLift;

          /* ease this element's own offset toward wherever it should be
             right now — same idea as the ring's rx/ry spring above, just
             one instance per floater instead of one shared instance */
          s.ox+=(tx-s.ox)*.22; s.oy+=(ty-s.oy)*.22;

          if(Math.abs(s.ox)<.05&&Math.abs(s.oy)<.05&&!s.hot){
            s.ox=0;s.oy=0;
            if(f.style.transform)f.style.removeProperty("transform");
          }else{
            f.style.transform="translate3d("+s.ox.toFixed(2)+"px,"+s.oy.toFixed(2)+"px,0)";
          }
        }
      }
      requestAnimationFrame(loop);
    })();
  })();

  /* ── pointer-follow glow on cards ── */
  if(!reduce&&matchMedia("(hover:hover)").matches){
    document.querySelectorAll(".card,.job-card,.skillset").forEach(function(card){
      card.addEventListener("pointermove",function(ev){
        var r=card.getBoundingClientRect();
        card.style.setProperty("--mx",(ev.clientX-r.left)+"px");
        card.style.setProperty("--my",(ev.clientY-r.top)+"px");
      });
    });
  }

  /* ── project previews ──
     Each one only runs while its card is on screen and the tab is visible. */
  function onScreen(el,cb){
    if(!("IntersectionObserver" in window)){cb(true);return}
    new IntersectionObserver(function(es){cb(es[0].isIntersecting)},{threshold:.05}).observe(el);
  }
  var SVGNS="http://www.w3.org/2000/svg";
  function icon(d){
    var s=document.createElementNS(SVGNS,"svg");s.setAttribute("viewBox","0 0 24 24");
    var p=document.createElementNS(SVGNS,"path");p.setAttribute("d",d);s.appendChild(p);return s;
  }

  /* Jenga Icons: fill the wall, then send a diagonal wave through it */
  (function(){
    var wall=document.getElementById("iconWall");
    if(!wall)return;
    var P=["M3 11l9-8 9 8M5 10v10h14V10","M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5",
      "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
      "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
      "M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4","M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
      "M3 6h18v12H3zM3 7l9 6 9-6","M8 7l-5 5 5 5M16 7l5 5-5 5","M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z",
      "M13 2L4 14h7l-1 8 9-12h-7z","M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
      "M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10","M4 12l5 5L20 6",
      "M4 8h4l2-3h4l2 3h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
      "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M2 12h3M19 12h3"];
    function fill(){
      wall.textContent="";
      var cols=Math.max(1,Math.floor(wall.clientWidth/44)), rows=Math.ceil(wall.clientHeight/44)+1;
      for(var i=0;i<cols*rows;i++){
        var s=icon(P[(i*7+Math.floor(i/cols)*3)%P.length]);
        s.style.setProperty("--w",(i%cols)+Math.floor(i/cols));
        wall.appendChild(s);
      }
    }
    fill();
    var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(fill,200)},{passive:true});
    onScreen(wall,function(on){
      [].forEach.call(wall.children,function(s){s.style.animationPlayState=on?"running":"paused"})});
  })();

  /* Redis in Rust: a redis-cli session that types itself, forever */
  (function(){
    var pre=document.getElementById("redisTerm");
    if(!pre||reduce)return;
    var S=[["PING","PONG","o"],["SET user:42 \"sahil\"","OK","o"],["GET user:42","\"sahil\"","s"],
      ["INCR page:hits","(integer) 1337","s"],["EXPIRE session:9f 60","(integer) 1","s"],
      ["LPUSH queue job:7","(integer) 3","s"],["TTL session:9f","(integer) 58","s"],["DEL user:42","(integer) 1","s"]];
    var lines=[], si=0, ci=0, typing="", live=false, timer=0;
    function render(){
      pre.textContent="";
      var all=lines.slice(-4);
      all.forEach(function(l){
        if(l.cmd!=null){var p=document.createElement("span");p.className="p";p.textContent="> ";pre.appendChild(p);
          pre.appendChild(document.createTextNode(l.cmd));}
        else{var o=document.createElement("span");o.className=l.cls;o.textContent=l.text;pre.appendChild(o);}
        pre.appendChild(document.createTextNode("\n"));
      });
      var p2=document.createElement("span");p2.className="p";p2.textContent="> ";pre.appendChild(p2);
      pre.appendChild(document.createTextNode(typing));
      var c=document.createElement("span");c.className="cur";pre.appendChild(c);
    }
    function tick(){
      if(!live)return;
      var cmd=S[si][0];
      if(ci<cmd.length){typing+=cmd[ci++];render();timer=setTimeout(tick,40+Math.random()*60);return}
      lines.push({cmd:cmd});lines.push({text:S[si][1],cls:S[si][2]});
      typing="";ci=0;si=(si+1)%S.length;render();
      timer=setTimeout(tick,900);
    }
    render();
    onScreen(pre,function(on){
      if(on&&!live){live=true;timer=setTimeout(tick,400)}
      else if(!on){live=false;clearTimeout(timer)}
    });
  })();

  /* Rock Paper Scissors: both slots shuffle, land, and the winner lights up */
  (function(){
    var box=document.getElementById("rps");
    if(!box)return;
    var G=["M5 15l2-7 6-3 5 3 2 7-4 4H9zM10 9l2 3-1 3",
      "M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5",
      "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.1 7.9L20 18M8.1 16.1L20 6"];
    var NAMES=["rock","paper","scissors"];
    var you=box.querySelector('[data-side="you"]'), cpu=box.querySelector('[data-side="cpu"]');
    var sy=box.querySelector('[data-score="you"]'), sc=box.querySelector('[data-score="cpu"]');
    var res=box.querySelector(".rps-res"), score=[0,0], live=false, timer=0;
    function show(slot,i){slot.textContent="";slot.appendChild(icon(G[i]))}
    show(you,0);show(cpu,2);
    if(reduce)return;
    function round(){
      if(!live)return;
      you.className=cpu.className="rps-slot spin";res.textContent="…";
      var n=0;
      (function spin(){
        if(!live)return;
        show(you,n%3);show(cpu,(n+1)%3);
        if(++n<10){timer=setTimeout(spin,80);return}
        var a=Math.floor(Math.random()*3), b=Math.floor(Math.random()*3), r=(a-b+3)%3;
        show(you,a);show(cpu,b);
        you.className="rps-slot"+(r===1?" win":"");cpu.className="rps-slot"+(r===2?" win":"");
        if(r===1)score[0]++; if(r===2)score[1]++;
        sy.textContent=score[0];sc.textContent=score[1];
        res.textContent=r===0?"draw · "+NAMES[a]+" vs "+NAMES[b]:(r===1?"you win · ":"cpu wins · ")+NAMES[r===1?a:b]+" beats "+NAMES[r===1?b:a];
        timer=setTimeout(round,1900);
      })();
    }
    onScreen(box,function(on){
      if(on&&!live){live=true;timer=setTimeout(round,300)}
      else if(!on){live=false;clearTimeout(timer)}
    });
  })();

  /* Snake: plays itself — heads for the food, but checks with a flood fill
     that the move doesn't wall it in first */
  (function(){
    var cv=document.getElementById("snakeCv"), hud=document.getElementById("snakeScore");
    if(!cv||!cv.getContext)return;
    var ctx=cv.getContext("2d"), CELL=14, cols=0, rows=0, ox=0, oy=0, W=0, H=0;
    var snake=[], dir=[1,0], food=null, score=0, live=false, last=0, dead=0;
    function css(v){return getComputedStyle(root).getPropertyValue(v).trim()}
    function size(){
      var dpr=Math.min(devicePixelRatio||1,2);
      W=cv.clientWidth;H=cv.clientHeight;
      cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
      cols=Math.floor(W/CELL);rows=Math.floor(H/CELL);
      ox=(W-cols*CELL)/2;oy=(H-rows*CELL)/2;
      reset();
    }
    function key(x,y){return y*cols+x}
    function reset(){
      var y=Math.floor(rows/2);
      snake=[[4,y],[3,y],[2,y],[1,y]];dir=[1,0];score=0;dead=0;
      if(hud)hud.textContent=0;
      place();draw();
    }
    function place(){
      var taken={};snake.forEach(function(s){taken[key(s[0],s[1])]=1});
      var free=[];
      for(var y=0;y<rows;y++)for(var x=0;x<cols;x++)if(!taken[key(x,y)])free.push([x,y]);
      food=free.length?free[Math.floor(Math.random()*free.length)]:null;
    }
    function blocked(x,y,body){return x<0||y<0||x>=cols||y>=rows||body[key(x,y)]}
    function room(sx,sy,body){
      var seen={},stack=[[sx,sy]],n=0;seen[key(sx,sy)]=1;
      while(stack.length&&n<snake.length+4){
        var c=stack.pop();n++;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
          var x=c[0]+d[0],y=c[1]+d[1],k=key(x,y);
          if(!blocked(x,y,body)&&!seen[k]){seen[k]=1;stack.push([x,y])}
        });
      }
      return n;
    }
    function step(){
      if(dead){if(--dead===0)reset();return}
      var h=snake[0], body={};
      for(var i=0;i<snake.length-1;i++)body[key(snake[i][0],snake[i][1])]=1;
      var best=null,bestScore=-1e9;
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){
        if(d[0]===-dir[0]&&d[1]===-dir[1])return;
        var x=h[0]+d[0],y=h[1]+d[1];
        if(blocked(x,y,body))return;
        var r=room(x,y,body), dist=food?Math.abs(food[0]-x)+Math.abs(food[1]-y):0;
        var s=(r>=snake.length?1000:r*10)-dist+(d[0]===dir[0]&&d[1]===dir[1]?.5:0)+Math.random()*.3;
        if(s>bestScore){bestScore=s;best=d}
      });
      if(!best){dead=8;return}
      dir=best;
      var nh=[h[0]+dir[0],h[1]+dir[1]];
      snake.unshift(nh);
      if(food&&nh[0]===food[0]&&nh[1]===food[1]){
        score++;if(hud)hud.textContent=score;
        if(snake.length>Math.max(12,cols*rows*.3)){dead=6}
        place();
      }else snake.pop();
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      var a=css("--accent-3")||"#4ade80", b=css("--accent")||"#7aa2ff", f=css("--accent-2")||"#a78bfa";
      if(food){
        ctx.save();ctx.shadowColor=f;ctx.shadowBlur=14;ctx.fillStyle=f;
        ctx.beginPath();ctx.arc(ox+food[0]*CELL+CELL/2,oy+food[1]*CELL+CELL/2,CELL*.3,0,6.283);ctx.fill();ctx.restore();
      }
      var n=snake.length;
      for(var i=n-1;i>=0;i--){
        var s=snake[i],t=n>1?i/(n-1):0,pad=i===0?1:2;
        ctx.globalAlpha=dead&&dead%2?.25:1-t*.6;
        ctx.fillStyle=i===0?a:(t<.5?a:b);
        var x=ox+s[0]*CELL+pad,y=oy+s[1]*CELL+pad,w=CELL-pad*2;
        ctx.beginPath();
        if(ctx.roundRect)ctx.roundRect(x,y,w,w,3);else ctx.rect(x,y,w,w);
        ctx.fill();
      }
      ctx.globalAlpha=1;
    }
    function loop(now){
      if(!live)return;
      requestAnimationFrame(loop);
      if(document.hidden||now-last<95)return;
      last=now;step();draw();
    }
    size();
    var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(size,200)},{passive:true});
    new MutationObserver(draw).observe(root,{attributes:true,attributeFilter:["data-theme"]});
    if(reduce)return;
    onScreen(cv,function(on){
      if(on&&!live){live=true;requestAnimationFrame(loop)}
      else if(!on)live=false;
    });
  })();

  /* ── active nav link ── */
  var links=[].slice.call(document.querySelectorAll(".navlinks a")).filter(function(a){
    return a.getAttribute("href").charAt(0)==="#";
  });
  var targets=links.map(function(a){return document.querySelector(a.getAttribute("href"))}).filter(Boolean);
  if("IntersectionObserver" in window&&targets.length){
    var navIO=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(!en.isIntersecting)return;
        links.forEach(function(a){
          a.classList.toggle("active",a.getAttribute("href")==="#"+en.target.id);
        });
      });
    },{rootMargin:"-45% 0px -50% 0px"});
    targets.forEach(function(s){navIO.observe(s)});
  }
})();
