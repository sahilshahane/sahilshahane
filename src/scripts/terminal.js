/* ── the terminal of truth ──
   Lives in the contact section (Contact.astro). While nobody's touching it,
   it plays one small developer disaster at a time, each ending on a
   # comment. Click it (or press ` anywhere) and it becomes a small working
   shell: help, ls, cd, cat, neofetch, sudo… Everything it prints is built
   as text nodes, never parsed HTML. */
(function(){
  "use strict";
  var term=document.getElementById("term");
  if(!term)return;
  var reduce=matchMedia("(prefers-reduced-motion:reduce)").matches;
  var body=document.getElementById("ttyBody"), title=document.getElementById("ttyTitle");
  var form=document.getElementById("ttyForm"), input=document.getElementById("ttyInput");
  var bFix=document.getElementById("bFix"), bNew=document.getElementById("bNew"), cups=document.getElementById("cups");

  var MAIL="sahilpshahane123@gmail.com";
  var RESUME="https://drive.google.com/file/d/1sKMw3bHdF0yt8C6r2aRPM7vS26wqnb0c/view?usp=drive_link";
  var LINKS={
    github:"https://github.com/sahilshahane",
    linkedin:"https://linkedin.com/in/sahilshahane",
    resume:RESUME,
    jenga:"https://github.com/outpostHQ/jengaicons",
    redis:"https://github.com/sahilshahane/valkey-rust",
    rps:"https://rock-paper-scissors-sahilbest999.vercel.app/",
    snake:"https://sahilshahane.github.io/Snake-Game/index.html"
  };
  var SECTIONS={work:"work",projects:"projects",toolkit:"skills",skills:"skills",contact:"contact",top:"top","~":"top"};

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
      {out:[["Fri 17:58:04","wa"]]},
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
  var live=false, pending=null, timer=0, engaged=false;
  function later(fn,ms){timer=setTimeout(function(){if(live&&!engaged)fn();else if(!engaged)pending=fn},ms)}

  var cur=document.createElement("span");cur.className="cur";
  function add(text,cls,href){
    var n;
    if(href){n=document.createElement("a");n.href=href;n.textContent=text;
      if(href.indexOf("mailto:")!==0){n.target="_blank";n.rel="noopener"}
      if(cls)n.className=cls}
    else if(cls){n=document.createElement("span");n.className=cls;n.textContent=text}
    else n=document.createTextNode(text);
    if(cur.parentNode===body)body.insertBefore(n,cur);else body.appendChild(n);
    return n;
  }
  function scroll(){body.scrollTop=body.scrollHeight}
  function paintCups(){[].forEach.call(cups.children,function(c,i){c.className=i<coffee?"":"e"})}
  function tally(sc){
    fixed+=sc.fix;created+=sc.add;
    bFix.textContent=fixed;bNew.textContent=created;
  }

  function play(sc){
    body.textContent="";body.appendChild(cur);title.textContent=sc.t;
    var li=0;
    (function next(){
      if(li>=sc.l.length){
        later(function(){
          add("# "+sc.say,"dm");add("\n");scroll();tally(sc);
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
    if(engaged)return;
    if(on&&!started){started=true;later(nextScene,1600);return}
    if(on&&pending){var f=pending;pending=null;f()}
  }
  if(!reduce){
    if("IntersectionObserver" in window)
      new IntersectionObserver(function(es){setLive(es[0].isIntersecting)}).observe(term);
    else setLive(true);
    document.addEventListener("visibilitychange",function(){
      if(document.hidden)live=false;else if(term.getBoundingClientRect().bottom>0)setLive(true);
    });
  }

  /* ── the shell ── */
  var hist=[], hi=0;
  function print(parts){
    /* parts: a string, or an array of [text, class, href] segments */
    if(typeof parts==="string")parts=[[parts]];
    parts.forEach(function(p){add(p[0],p[1]||"",p[2])});
    add("\n");
  }
  function lines(arr){arr.forEach(print)}
  function pad(s,n){s=String(s);while(s.length<n)s+=" ";return s}
  function since(y,m){
    var now=new Date(),mo=(now.getFullYear()-y)*12+(now.getMonth()+1-m),yr=Math.floor(mo/12);
    return yr+" yr"+(yr===1?"":"s")+(mo%12?" "+(mo%12)+" mo"+(mo%12===1?"":"s"):"");
  }
  function go(id){
    var el=document.getElementById(id);
    if(el)el.scrollIntoView({behavior:reduce?"auto":"smooth",block:"start"});
  }
  function open(url){window.open(url,url.indexOf("mailto:")===0?"_self":"_blank","noopener")}

  var CMDS={
    help:function(){
      lines([
        [["commands","hl"]],
        [["  whoami  about  neofetch   ","fg"],["who's this","dm"]],
        [["  ls  cd <dir>  cat <file>  ","fg"],["look around the site","dm"]],
        [["  open <thing>              ","fg"],["github, linkedin, resume, jenga, redis, rps, snake","dm"]],
        [["  email  resume             ","fg"],["the useful ones","dm"]],
        [["  joke  coffee  theme  clear","fg"]],
        [["  ↑/↓ history · tab completes · try sudo","dm"]]
      ]);
    },
    whoami:function(){print("sahil shahane — software engineer. billing, auth, kubernetes controllers, rust.")},
    about:function(){CMDS.cat(["about.txt"])},
    ls:function(a){
      var d=(a[0]||"").replace(/\/$/,"");
      if(d==="projects"){print([["jenga-icons/  redis-rust/  rock-paper-scissors/  snake/","hl"]]);return}
      if(d&&d!=="~"&&d!=="."){print([["ls: "+d+": nothing to see here, try ","dm"],["cd "+d,"fg"]]);return}
      print([["about.txt  contact.txt  resume.pdf  ","fg"],["work/  projects/  toolkit/  blog/","hl"]]);
    },
    cd:function(a){
      var d=(a[0]||"~").replace(/^~\//,"").replace(/\/$/,"");
      if(d==="blog"){print([["→ ~/blog","dm"]]);location.href=document.querySelector('.navlinks a[href$="blog/"]').href;return}
      if(!SECTIONS[d]){print([["cd: no such directory: "+d,"er"]]);return}
      print([["→ ~/"+(d==="~"?"":d),"dm"]]);
      go(SECTIONS[d]);
    },
    pwd:function(){print("/home/guest")},
    cat:function(a){
      var f=(a[0]||"").replace(/^~\//,"");
      if(f==="about.txt")lines([
        "I care how things actually behave under load, not how they're documented to.",
        "most of my work sits a layer below the product: billing pipelines, auth,",
        "kubernetes controllers, build tooling. currently at IIT Bombay."]);
      else if(f==="contact.txt")lines([
        [["email     ","dm"],[MAIL,"",'mailto:'+MAIL]],
        [["github    ","dm"],["github.com/sahilshahane","",LINKS.github]],
        [["linkedin  ","dm"],["linkedin.com/in/sahilshahane","",LINKS.linkedin]]]);
      else if(f==="resume.pdf")print([["cat: resume.pdf: binary file. try ","dm"],["resume","fg"]]);
      else if(!f)print([["usage: cat <file>","dm"]]);
      else print([["cat: "+f+": no such file","er"]]);
    },
    neofetch:function(){
      var info=[
        ["","sahil@blueprint","hl"],["","───────────────","dm"],
        ["os","SahilOS 26.09 (blueprint)"],["role","software engineer"],
        ["uptime",since(2022,7)+" shipping"],["stack","rust · go · ts · k8s"],
        ["shell","zsh, too many aliases"],["editor","vim (can exit)"]];
      var art=["  ┌────────┐","  │ ▄▀▀▀▀  │","  │  ▀▀▀▄  │","  │ ▀▀▀▀   │","  └────────┘","","",""];
      info.forEach(function(r,i){
        print([[pad(art[i],14),"hl"],[r[0]?pad(r[0],8):"","dm"],[r[1],r[2]||"fg"]]);
      });
    },
    email:function(){print([["→ opening mail to ","dm"],[MAIL,"",'mailto:'+MAIL]]);open("mailto:"+MAIL)},
    resume:function(){print([["→ opening résumé","dm"]]);open(RESUME)},
    open:function(a){
      var k=(a[0]||"").toLowerCase();
      if(k==="email"||k==="mail")return CMDS.email();
      if(!LINKS[k]){print([["open: what? try ","dm"],["open github","fg"]]);return}
      print([["→ "+LINKS[k].replace(/^https?:\/\//,""),"dm"]]);open(LINKS[k]);
    },
    github:function(){CMDS.open(["github"])},
    linkedin:function(){CMDS.open(["linkedin"])},
    joke:function(){
      var sc=S[Math.floor(Math.random()*S.length)];
      sc.l.forEach(function(ln){
        if(ln.cmd!=null)print([[ln.pr==null?"$ ":ln.pr,"p"],[ln.cmd]]);
        else print(ln.out.map(function(s){return [s[0],s[1]||""]}));
      });
      print([["# "+sc.say,"dm"]]);tally(sc);
    },
    coffee:function(){
      COFFEE.l.forEach(function(ln){print(ln.cmd!=null?[["$ ","p"],[ln.cmd]]:ln.out)});
      coffee=5;paintCups();
    },
    theme:function(a){
      var want=(a[0]||"").toLowerCase(), now=document.documentElement.dataset.theme==="light"?"light":"dark";
      if(want&&want!=="light"&&want!=="dark"&&want!=="toggle"){print([["usage: theme [light|dark]","dm"]]);return}
      if(!want||want==="toggle"||want!==now)document.getElementById("theme").click();
      print([["→ "+(document.documentElement.dataset.theme==="light"?"whiteprint":"blueprint"),"dm"]]);
    },
    date:function(){print(new Date().toString().replace(/ \(.*\)$/,""))},
    echo:function(a){print(a.join(" "))},
    uname:function(){print("SahilOS 26.09 blueprint x86_64")},
    history:function(){hist.forEach(function(h,i){print([[pad(i+1,4),"dm"],[h]])})},
    clear:function(){body.textContent=""},
    sudo:function(a){
      var rest=a.join(" ").toLowerCase();
      if(/^hire( sahil)?$/.test(rest)){print([["✓ permission granted. opening a draft…","ok"]]);setTimeout(function(){open("mailto:"+MAIL+"?subject=Let%27s%20build%20something")},700);return}
      if(/^rm -rf/.test(rest))return CMDS.rm(a.slice(1));
      print([["guest is not in the sudoers file. this incident will be reported.","er"]]);
      print([["(try ","dm"],["sudo hire sahil","fg"],[")","dm"]]);
    },
    hire:function(){CMDS.sudo(["hire","sahil"])},
    rm:function(a){
      if(/-r?f|-fr/.test(a.join(" ")))print([["nice try. this site is read-only.","wa"]]);
      else print([["rm: missing operand","er"]]);
    },
    vim:function(){print([["you'd never leave. ","dm"],["(that one's in ","dm"],["joke","fg"],[")","dm"]])},
    exit:function(){print([["there's no exit. only ","dm"],["sudo hire sahil","fg"]])},
    ping:function(){print([["PONG","ok"],[" — replies within a day, usually","dm"]])}
  };
  CMDS.mail=CMDS.email;CMDS.cv=CMDS.resume;CMDS.fortune=CMDS.joke;CMDS.quit=CMDS.exit;
  CMDS.nvim=CMDS.emacs=CMDS.nano=CMDS.vim;CMDS.ll=CMDS.ls;

  function run(line){
    var parts=line.trim().split(/\s+/), cmd=parts[0].toLowerCase(), args=parts.slice(1);
    print([["guest@sahil:~$ ","p"],[line]]);
    if(!cmd)return;
    hist.push(line);hi=hist.length;
    if(CMDS.hasOwnProperty(cmd))CMDS[cmd](args);
    else print([["zsh: command not found: "+cmd+"  ","er"],["(help lists what's here)","dm"]]);
  }

  /* the first interaction stops the autoplay and hands over the shell */
  function engage(){
    if(engaged)return;
    engaged=true;clearTimeout(timer);pending=null;
    body.textContent="";title.textContent="guest@sahil — zsh";
    body.removeAttribute("aria-hidden");body.setAttribute("aria-live","polite");body.setAttribute("role","log");
    print([["SahilOS 26.09 (blueprint) — tty1","hl"]]);
    print([["type ","dm"],["help","fg"],[" to see what's here. ↑↓ history, tab completes.","dm"]]);
    print("");
  }
  input.addEventListener("focus",engage);
  term.addEventListener("click",function(e){
    if(e.target.closest("a"))return;
    if(!getSelection().toString())input.focus({preventScroll:true});
  });
  form.addEventListener("submit",function(e){
    e.preventDefault();
    engage();
    var v=input.value;input.value="";
    run(v);scroll();
  });
  input.addEventListener("keydown",function(e){
    if(e.key==="ArrowUp"&&hi>0){hi--;input.value=hist[hi];e.preventDefault()}
    else if(e.key==="ArrowDown"){hi=Math.min(hist.length,hi+1);input.value=hist[hi]||"";e.preventDefault()}
    else if(e.key==="Tab"&&input.value&&input.value.indexOf(" ")<0){
      var m=Object.keys(CMDS).filter(function(k){return k.indexOf(input.value.toLowerCase())===0});
      if(m.length){e.preventDefault();if(m.length===1)input.value=m[0]+" ";else{print([[m.join("  "),"dm"]]);scroll()}}
    }
    else if(e.key==="l"&&e.ctrlKey){e.preventDefault();body.textContent=""}
  });

  /* ` from anywhere on the page opens the terminal */
  addEventListener("keydown",function(e){
    if(e.key!=="`"||e.ctrlKey||e.metaKey||e.altKey)return;
    var t=e.target;
    if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;
    e.preventDefault();
    term.scrollIntoView({behavior:reduce?"auto":"smooth",block:"center"});
    input.focus({preventScroll:true});
  });
})();
