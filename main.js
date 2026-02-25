const BASE_API = "https://script.google.com/macros/s/AKfycbwLIi-v7B-J_t3QkGibDh3qDmFKAz6xEgmmO0bgt0wxQ25_oa-oC64Rok6H_Tx93FJG5g/exec";
const STUDENT_API   = BASE_API + "?type=students";
const SUBJECT_API   = BASE_API + "?type=subjects";
const SUBMITTED_API = BASE_API + "?type=submitted";   
const SAVE_API      = BASE_API;

const qs  = s => document.querySelector(s);



function showSpinner(message = "Loading...") {
    const overlay = qs("#appSpinnerOverlay");
    overlay.querySelector(".app-spinner-text").textContent = message;
    overlay.style.display = "flex";
    setTimeout(()=> overlay.style.opacity="1",10);
}

function hideSpinner() {
    const overlay = qs("#appSpinnerOverlay");
    overlay.style.opacity="0";
    setTimeout(()=> overlay.style.display="none",200);
}

function show(step){

    document.querySelectorAll(".panel")
        .forEach(p => p.classList.add("hidden"));

    qs("#step"+step).classList.remove("hidden");

    document.querySelectorAll("#mainTabs .nav-link")
        .forEach(btn => btn.classList.remove("active"));

    const activeTab = qs(`#mainTabs .nav-link[data-step='${step}']`);
    if(activeTab) activeTab.classList.add("active");

    const progressBar = document.querySelector(".progress-bar");
    progressBar.style.width = (step == 1) ? "50%" : "100%";
}



qs("#toStep2").addEventListener("click", function(){

    if(!qs("#sectionSelect").value){
        alert("Please select section");
        return;
    }

    if(!qs("#studentSelect").value){
        alert("Please select student");
        return;
    }

    show(2); 
});

qs("#backToStep1").addEventListener("click", function(){
    show(1); 
});



document.querySelectorAll("#mainTabs .nav-link")
.forEach(tab=>{
    tab.addEventListener("click", function(){

        const step = this.getAttribute("data-step");

        if(step === "2"){
            if(!qs("#sectionSelect").value) return;
            if(!qs("#studentSelect").value) return;
        }

        show(step);
    });
});



qs("#sectionSelect").addEventListener("change", async ()=>{

    const section = qs("#sectionSelect").value;
    if(!section) return;

    // 🔥 ONLY LOGIC ADDED
    const pec1Block = document.getElementById("pec1Block");
    const pec4Block = document.getElementById("pec4Block");

    if(section === "6BT AIML"){
        if(pec1Block) pec1Block.style.display = "block";
        if(pec4Block) pec4Block.style.display = "block";
    }else{
        if(pec1Block) pec1Block.style.display = "none";
        if(pec4Block) pec4Block.style.display = "none";
    }

    showSpinner("Loading students...");

    try{

        const res = await fetch(`${STUDENT_API}&section=${encodeURIComponent(section)}`);
        const data = await res.json();

        const submittedRes = await fetch(SUBMITTED_API);
        const submittedRegs = await submittedRes.json();

        qs("#studentSelect").innerHTML =
            `<option value="">Select Student</option>`;

        data.forEach(s=>{

            const opt = document.createElement("option");
            opt.value = s.reg;
            opt.textContent = `${s.reg} - ${s.name}`;
            opt.dataset.sem   = s.sem;
            opt.dataset.email = s.email;
            opt.dataset.acad  = s.acad_year;

           if(submittedRegs.includes(s.reg.toString().trim().toUpperCase())){
                opt.disabled = true;
                opt.textContent += " (Already Submitted)";
            }

            qs("#studentSelect").appendChild(opt);
        });

    }catch(e){ console.error(e); }

    hideSpinner();
});


qs("#studentSelect").addEventListener("change",()=>{
    const opt = qs("#studentSelect").selectedOptions[0];
    qs("#sem").value       = opt?.dataset.sem   || "";
    qs("#email").value     = opt?.dataset.email || "";
    qs("#acad_year").value = opt?.dataset.acad  || "";
});


let subjectData = {};

async function loadSubjects(){
    try{
        const res = await fetch(SUBJECT_API);
        subjectData = await res.json();

        loadCategory("PEC1", ["pe1_pref1","pe1_pref2","pe1_pref3"]);
        loadCategory("PEC2", ["pe2_pref1","pe2_pref2","pe2_pref3"]);
        loadCategory("PEC3", ["pe3_pref1","pe3_pref2","pe3_pref3"]);
        loadCategory("PEC4", ["pe4_pref1","pe4_pref2","pe4_pref3"]); // added PEC4

    }catch(e){ console.error(e); }
}

function loadCategory(category, ids){
    const subjects = subjectData[category] || [];

    ids.forEach((id,index)=>{
        const select = document.getElementById(id);
        if(!select) return;

        select.innerHTML =
          `<option value="">Select Preference ${index+1}</option>`;

        subjects.forEach(sub=>{
            const opt = document.createElement("option");
            opt.value = sub;
            opt.textContent = sub;
            select.appendChild(opt);
        });
    });
}



const allSelectIds = [
    "pe1_pref1","pe1_pref2","pe1_pref3",
    "pe2_pref1","pe2_pref2","pe2_pref3",
    "pe3_pref1","pe3_pref2","pe3_pref3",
    "pe4_pref1","pe4_pref2","pe4_pref3"
];

function preventAllDuplicates(){

    const selectedValues = allSelectIds
        .map(id => qs("#"+id)?.value)
        .filter(v => v);

    allSelectIds.forEach(id => {

        const select = qs("#"+id);
        if(!select) return;

        Array.from(select.options).forEach(opt=>{

            if(!opt.value) return;

            if(selectedValues.includes(opt.value) &&
               opt.value !== select.value){
                opt.disabled = true;
            }else{
                opt.disabled = false;
            }

        });
    });
}

document.addEventListener("change", preventAllDuplicates);


qs("#submitElectives").addEventListener("click", async ()=>{

    const btn = qs("#submitElectives");
    if(btn.disabled) return;

    btn.disabled = true;
    showSpinner("Submitting your electives... Please wait");

    const section = qs("#sectionSelect").value;

    const payload = {
    reg  : qs("#studentSelect").value,
    name : qs("#studentSelect").selectedOptions[0]?.text || "",
    section: qs("#sectionSelect").value,   // 🔥 ADD THIS LINE

    pe1_1: qs("#pe1_pref1")?.value || "",
    pe1_2: qs("#pe1_pref2")?.value || "",
    pe1_3: qs("#pe1_pref3")?.value || "",

    pe2_1: qs("#pe2_pref1").value,
    pe2_2: qs("#pe2_pref2").value,
    pe2_3: qs("#pe2_pref3").value,

    pe3_1: qs("#pe3_pref1").value,
    pe3_2: qs("#pe3_pref2").value,
    pe3_3: qs("#pe3_pref3").value,

    pe4_1: qs("#pe4_pref1")?.value || "",
    pe4_2: qs("#pe4_pref2")?.value || "",
    pe4_3: qs("#pe4_pref3")?.value || ""
    };

    if(
        !payload.reg ||
        !payload.pe2_1 || !payload.pe2_2 || !payload.pe2_3 ||
        !payload.pe3_1 || !payload.pe3_2 || !payload.pe3_3 ||
        (section === "6BT AIML" && (
            !payload.pe1_1 || !payload.pe1_2 || !payload.pe1_3 ||
            !payload.pe4_1 || !payload.pe4_2 || !payload.pe4_3
        ))
    ){
        hideSpinner();
        btn.disabled = false;
        alert("⚠ All preferences are mandatory. Please select all subjects.");
        return;
    }

    try{

        const response = await fetch(SAVE_API,{
            method:"POST",
            body:new URLSearchParams(payload)
        });

        if(!response.ok) throw new Error("Server error");

        setTimeout(()=>{
            hideSpinner();
            showSuccessPage(payload);
        }, 600);

    }catch(error){

        console.error(error);
        hideSpinner();
        btn.disabled = false;
        alert("Submission failed. Please try again.");
    }

});


function showSuccessPage(data){

    document.querySelector(".portal").classList.add("hidden");
    qs("#successPage").classList.remove("hidden");

    const downloadBtn = qs("#downloadPdfBtn");
    downloadBtn.classList.remove("hidden");

    downloadBtn.onclick = ()=> generatePDF(data);
}





async function generatePDF(data){

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setDrawColor(0, 0, 0);   
    doc.setLineWidth(0.8);
    doc.rect(12, 12, 186, 273);

    const cuLogo = "culogo.png";
    const deptLogo = "Dlogo.png";

    try {
        doc.addImage(cuLogo, "PNG", 15, 15, 30, 20);
        doc.addImage(deptLogo, "PNG", 165, 15, 26, 22);
    } catch(e){
        console.warn("Logo not loaded");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("CHRIST (Deemed to be University)", 105, 25, { align: "center" });

    doc.setFontSize(13);
    doc.text("AIML & DS Elective Subjects Submission", 105, 33, { align: "center" });

    doc.setDrawColor(150);
    doc.line(15, 40, 195, 40);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    const now = new Date();
    const timestamp = now.toLocaleString();  

    const section = qs("#sectionSelect").value;

    doc.text(`Register No & Name: ${data.name}`, 20, 50);
    doc.text(`Section: ${section}`, 20, 58);  
    doc.text(`Semester: ${qs("#sem").value}`, 20, 66);
    doc.text(`Academic Year: ${qs("#acad_year").value}`, 20, 74);
    doc.text(`Email: ${qs("#email").value}`, 20, 82);
    doc.text(`Submitted On: ${timestamp}`, 20, 90);

    // 🔥 Build table dynamically
    let tableBody = [];

    if(section === "6BT AIML"){
        tableBody.push(["PEC1", data.pe1_1, data.pe1_2, data.pe1_3]);
        tableBody.push(["PEC2", data.pe2_1, data.pe2_2, data.pe2_3]);
        tableBody.push(["PEC3", data.pe3_1, data.pe3_2, data.pe3_3]);
        tableBody.push(["PEC4", data.pe4_1, data.pe4_2, data.pe4_3]);
    }else{
        tableBody.push(["PEC2", data.pe2_1, data.pe2_2, data.pe2_3]);
        tableBody.push(["PEC3", data.pe3_1, data.pe3_2, data.pe3_3]);
    }

    doc.autoTable({
        startY: 105,
        head: [["Course", "Preference 1", "Preference 2", "Preference 3"]],
        body: tableBody,
        theme: "grid",
        headStyles: {
            fillColor: [75, 45, 183],
            textColor: 255,
            fontStyle: "bold"
        },
        styles: {
            halign: "center"
        }
    });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
        "This is a system generated confirmation of elective subjects selection.",
        105,
        280,
        { align: "center" }
    );

    doc.save("Elective_Subjects_Response.pdf");
}
document.addEventListener("DOMContentLoaded", ()=>{
    loadSubjects();
    show(1);
});
