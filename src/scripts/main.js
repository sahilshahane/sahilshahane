(function(){
  "use strict";
  var root=document.documentElement;
  var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ── reveal on scroll ──
     Set up FIRST and guarded: content must never be stuck invisible.
     showAll() is the failsafe — on error, on timeout, or where IO is missing. */
  var revealables=[].slice.call(document.querySelectorAll(".r"));
  /* Layout-measuring code (the experience line) listens for this: a block
     that has just been revealed is still mid-entrance, so it re-measures
     once the transition has settled. */
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

  /* ── scroll progress (fallback where animation-timeline is unsupported) ── */
  var prog=document.getElementById("prog"),ticking=false;
  if(!CSS.supports("animation-timeline","scroll()")){
    var onScroll=function(){
      var h=document.body.scrollHeight-innerHeight;
      prog.style.transform="scaleX("+(h>0?scrollY/h:0)+")";
      ticking=false;
    };
    addEventListener("scroll",function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});
    onScroll();
  }

  /* ── experience line ──
     A centre line (long dash, dot) runs down through every job's datum
     mark and inks itself in up to a mark 55% down the viewport. Rebuilt
     from real layout on resize/reveal (row heights depend on content). */
  (function(){
    var xp=document.getElementById("xp");
    if(!xp)return;
    var svg=xp.querySelector(".xp-line"),bg=svg.querySelector(".bg"),fg=svg.querySelector(".fg"),
        head=svg.querySelector(".xp-head");
    var jobs=[].slice.call(xp.querySelectorAll(".job")),pts=[],x=0,y0=0,y1=0,ticking=false;
    function build(){
      svg.setAttribute("width",xp.offsetWidth);svg.setAttribute("height",xp.offsetHeight);
      pts=jobs.map(function(j){
        var cs=getComputedStyle(j,"::before"),h=parseFloat(cs.width)/2;
        return [j.offsetLeft+parseFloat(cs.left)+h, j.offsetTop+parseFloat(cs.top)+h];
      });
      if(!pts.length)return;
      x=pts[0][0];y0=pts[0][1];y1=pts[pts.length-1][1]+70;
      var d="M"+x+","+y0+"V"+y1;
      bg.setAttribute("d",d);fg.setAttribute("d",d);
      update();
    }
    function update(){
      ticking=false;
      if(!pts.length)return;
      var y=reduce?1e9:innerHeight*.55-xp.getBoundingClientRect().top;
      var yy=Math.max(y0,Math.min(y1,y)),L=yy-y0;
      fg.style.strokeDasharray=L.toFixed(1)+" "+(y1-y0+10);
      head.setAttribute("transform","translate("+x+" "+yy.toFixed(1)+") rotate(45)");
      head.style.opacity=L>2&&yy<y1-2?1:0;
      jobs.forEach(function(j,i){j.classList.toggle("lit",yy>=pts[i][1]-2)});
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

  /* ── FIG. 01: the stack comes apart ──
     The hero's diagram (StackDiagram.astro) rests with its plates packed
     close. Scrolling spreads them apart, draws the assembly lines, labels
     each plate, measures the stack and starts requests (down the front
     edge) and responses (up the right) moving between layers; scrolling
     back packs it up again. On desktop the hero is pinned while this plays;
     on narrow screens the figure's own position drives it. */
  (function(){
    var fig=document.getElementById("stack");
    if(!fig)return;
    var GAP0=26, GAP1=78;          /* plate spacing packed / exploded; GAP0 matches StackDiagram.astro */
    var layers=[],calls=[];
    [].forEach.call(fig.querySelectorAll(".layer"),function(g){layers[+g.dataset.i]=g});
    [].forEach.call(fig.querySelectorAll(".callout"),function(g){calls[+g.dataset.i]=g});
    var N=layers.length;
    var asm=fig.querySelectorAll(".asm line"),R=+asm[2].getAttribute("x1");
    var dn=fig.querySelectorAll(".pk.dn"),up=fig.querySelectorAll(".pk.up");
    var dim=fig.querySelector(".dim"),dl=dim.querySelector(".dl"),t1=dim.querySelector(".t1"),t2=dim.querySelector(".t2"),dv=dim.querySelector(".dv");
    var pct=document.getElementById("stackPct"),heroPin=document.getElementById("heroPin");
    var wide=matchMedia("(min-width:981px) and (min-height:600px)");
    var target=0,p=0,live=true,raf=0,last=-1;

    function clamp(v){return v<0?0:v>1?1:v}
    function Y(i,gap){return (i-(N-1)/2)*gap}

    function pin(){root.classList.toggle("pinbreak",!!heroPin&&wide.matches&&!reduce)}
    function measure(){
      if(reduce){target=.85;return}
      if(root.classList.contains("pinbreak")){
        var extra=heroPin.offsetHeight-heroPin.firstElementChild.offsetHeight;
        target=extra>1?clamp(-heroPin.getBoundingClientRect().top/extra):0;
      }else{
        var b=fig.getBoundingClientRect();
        target=clamp((innerHeight*.9-b.top)/(innerHeight*.6));
      }
    }

    function render(now){
      var e=p*p*(3-2*p),gap=GAP0+(GAP1-GAP0)*e,i,y;
      if(e!==last){
        last=e;
        for(i=0;i<N;i++){
          y="translate(0 "+Y(i,gap).toFixed(2)+")";
          layers[i].setAttribute("transform",y);calls[i].setAttribute("transform",y);
        }
        var shown=clamp((e-.35)/.45),yt=Y(0,gap),yb=Y(N-1,gap);
        for(i=0;i<N;i++)calls[i].style.opacity=shown;
        for(i=0;i<3;i++){
          var off=i===1?90:0;
          asm[i].setAttribute("y1",(yt+off).toFixed(1));asm[i].setAttribute("y2",(yb+off).toFixed(1));
          asm[i].style.opacity=clamp((e-.12)/.4);
        }
        /* overall height, top of the top plate to the foot of the bottom one */
        var a=yt-90,b=yb+102,m=(a+b)/2;
        dl.setAttribute("y1",a.toFixed(1));dl.setAttribute("y2",b.toFixed(1));
        t1.setAttribute("d","M-176 "+a.toFixed(1)+"H-6M-173 "+(a+6).toFixed(1)+"L-170 "+a.toFixed(1)+"L-167 "+(a+6).toFixed(1));
        t2.setAttribute("d","M-176 "+b.toFixed(1)+"H-6M-173 "+(b-6).toFixed(1)+"L-170 "+b.toFixed(1)+"L-167 "+(b-6).toFixed(1));
        dv.setAttribute("y",m.toFixed(1));dv.setAttribute("transform","rotate(-90 -176 "+m.toFixed(1)+")");
        dv.textContent="H = "+Math.round(b-a);
        dim.style.opacity=shown;
        if(pct)pct.textContent=Math.round(e*100)+"%";
      }
      /* traffic between layers, only once there's room to see it */
      var show=reduce?0:clamp((e-.4)/.3),t=now/1000;
      for(i=0;i<dn.length;i++){
        var len=gap-12,f=(t*.55+i*.27)%1,g=(t*.45+i*.31+.5)%1;
        dn[i].setAttribute("transform","translate(0 "+(Y(i,gap)+102+f*len).toFixed(1)+") rotate(45)");
        up[i].setAttribute("transform","translate("+R+" "+(Y(i+1,gap)-g*len).toFixed(1)+") rotate(45)");
        dn[i].style.opacity=show*(1-Math.abs(f-.5)*1.6);   /* fade in and out at each end */
        up[i].style.opacity=show*(1-Math.abs(g-.5)*1.6);
      }
    }
    function loop(now){
      raf=0;
      p+=(target-p)*(reduce?1:.14);
      if(Math.abs(target-p)<.0005)p=target;
      render(now);
      if(live&&(p!==target||p>.3))raf=requestAnimationFrame(loop);
    }
    function kick(){if(!raf&&live)raf=requestAnimationFrame(loop)}

    /* point at a plate to find its label, and the other way round */
    function hot(i,on){layers[i].classList.toggle("hot",on);calls[i].classList.toggle("hot",on)}
    layers.forEach(function(g,i){
      g.addEventListener("pointerenter",function(){hot(i,true)});
      g.addEventListener("pointerleave",function(){hot(i,false)});
    });

    pin();measure();render(performance.now());
    if(wide.addEventListener)wide.addEventListener("change",function(){pin();measure();kick()});
    addEventListener("scroll",function(){measure();kick()},{passive:true});
    addEventListener("resize",function(){measure();kick()},{passive:true});
    if("IntersectionObserver" in window)
      new IntersectionObserver(function(es){live=es[0].isIntersecting;if(live)kick()}).observe(fig);
    document.addEventListener("visibilitychange",function(){live=!document.hidden;if(live)kick()});
    kick();
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
