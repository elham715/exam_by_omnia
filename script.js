// ====== Load exam set dynamically ======
const urlParams = new URLSearchParams(window.location.search);
const examSet = urlParams.get('set') || "exam1";

// Load the question file dynamically
const script = document.createElement("script");
script.src = `questions/${examSet}.js`;
script.onload = () => startExamApp();  // when loaded, run exam engine
document.head.appendChild(script);

// ====== Exam Engine ======
function startExamApp(){
  console.log("Loaded exam:", examSet, questions);

  const examForm=document.getElementById("examForm");
  const qc=document.getElementById("questionsContainer");
  const resultDiv=document.getElementById("result");
  const submitBtn=document.getElementById("submitBtn");

  function render(){
    qc.innerHTML="";
    questions.forEach(q=>{
      const div=document.createElement("div");
      div.className="question";
      div.innerHTML=`
        <p><strong>${q.text}</strong> <em style="color:#888">[${q.topic}]</em></p>
        ${Object.entries(q.options).map(([k,v])=>
          `<label><input type="radio" name="${q.id}" value="${k}"> ${v}</label>`
        ).join("")}
      `;
      qc.appendChild(div);
    });
  }

  function check(){
    let score=0,mistakes=[],weak={};
    let responses=[];
    const email=localStorage.getItem("omniaUserEmail");
    questions.forEach(q=>{
      const sel=document.querySelector(`input[name="${q.id}"]:checked`);
      let chosen="Not Answered", correct=false;
      if(sel){
        chosen=q.options[sel.value];
        if(sel.value===q.correct){score++; correct=true;}
      }
      if(!correct){
        mistakes.push(q);
        if(!weak[q.topic]) weak[q.topic]={count:0,video:q.video};
        weak[q.topic].count++;
      }
      responses.push({question:q.text, selectedAnswer:chosen, correctAnswer:q.options[q.correct]});
    });
    examForm.style.display="none";
    show(score,mistakes,weak);
    // save to Google Sheet
    submitToSheet({timestamp:new Date().toISOString(),email,score,total:questions.length,responses});
  }

  function show(score,mistakes,weak){
    resultDiv.style.display="block";
    resultDiv.innerHTML=`<h3>Your Score: ${score}/${questions.length}</h3>`;
    if(mistakes.length){
      resultDiv.innerHTML+=`<h4>Missed Questions</h4>`;
      mistakes.forEach(m=>{
        resultDiv.innerHTML+=`<p>${m.text} [${m.topic}]<br><em>Correct: ${m.options[m.correct]}</em></p>`;
      });
      resultDiv.innerHTML+=`<h4>📺 Recommended Videos</h4><ul>`;
      for(const [topic,info] of Object.entries(weak)){
        resultDiv.innerHTML+=`<li><b>${topic}</b> (${info.count} mistakes) → <a target="_blank" href="${info.video}">Watch Video</a></li>`;
      }
      resultDiv.innerHTML+="</ul>";
    } else resultDiv.innerHTML+="<p>🎉 Perfect score!</p>";
  }

  function submitToSheet(data){
    const SCRIPT_URL="YOUR_GOOGLE_SCRIPT_URL";
    fetch(SCRIPT_URL,{method:"POST",mode:"no-cors",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  }

  submitBtn.addEventListener("click", check);
  render();
}
