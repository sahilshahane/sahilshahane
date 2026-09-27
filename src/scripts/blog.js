(function(){
  "use strict";
  var root=document.documentElement;
  try{var t=localStorage.getItem("theme");if(t)root.dataset.theme=t;}catch(e){}
  document.getElementById("theme").addEventListener("click",function(){
    var next=root.dataset.theme==="light"?"dark":"light";
    root.dataset.theme=next;
    try{localStorage.setItem("theme",next)}catch(e){}
  });
  var yr=document.getElementById("yr");
  if(yr)yr.textContent=new Date().getFullYear();
})();
