/* ======================================
   🔧 CONFIGURATION
====================================== */

const BASE_API = "https://script.google.com/macros/s/AKfycbxlLG34R0I7FRFoyV154lTnxQU1p9pIZzjuSfgTBojeEi2BTEuq4Oyy5zHhs82ZEpVr/exec";
const STUDENT_API = BASE_API + "?type=students";
const SUBJECT_API = BASE_API + "?type=subjects";
const SAVE_API    = BASE_API;

const qs  = s => document.querySelector(s);


/* ======================================
   🌐 SPINNER CONTROL
====================================== */

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


/* ======================================
   🔄 NAVIGATION
====================================== */

function show(step){

    // Hide all panels
    document.querySelectorAll(".panel")
        .forEach(p => p.classList.add("hidden"));

    // Show selected panel
    qs("#step"+step).classList.remove("hidden");

    // Update active tab
    document.querySelectorAll("#mainTabs .nav-link")
        .forEach(btn => btn.classList.remove("active"));

    const activeTab = qs(`#mainTabs .nav-link[data-step='${step}']`);
    if(activeTab) activeTab.classList.add("active");

    // Update progress bar
    const progressBar = document.querySelector(".progress-bar");
    progressBar.style.width = (step == 1) ? "50%" : "100%";
}

/* ======================================
   ➡ STEP 1 NEXT BUTTON FIX
====================================== */

qs("#toStep2").addEventListener("click", function(){

    if(!qs("#sectionSelect").value){
        alert("Please select section");
        return;
    }

    if(!qs("#studentSelect").value){
        alert("Please select student");
        return;
    }

    show(2); // go to step 2
});

qs("#backToStep1").addEventListener("click", function(){
    show(1); // go back to step 1
});

/* ======================================
   🖱 TAB CLICK HANDLER (FIXED)
====================================== */

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


/* ======================================
   👨‍🎓 LOAD STUDENTS
====================================== */

qs("#sectionSelect").addEventListener("change", async ()=>{

    const section = qs("#sectionSelect").value;
    if(!section) return;

    showSpinner("Loading students...");

    try{
        const res = await fetch(`${STUDENT_API}&section=${encodeURIComponent(section)}`);
        const data = await res.json();

        qs("#studentSelect").innerHTML =
            `<option value="">Select Student</option>`;

        data.forEach(s=>{
            const opt = document.createElement("option");
            opt.value = s.reg;
            opt.textContent = `${s.reg} - ${s.name}`;
            opt.dataset.sem   = s.sem;
            opt.dataset.email = s.email;
            opt.dataset.acad  = s.acad_year;
            qs("#studentSelect").appendChild(opt);
        });

    }catch(e){ console.error(e); }

    hideSpinner();
});


/* ======================================
   🧾 AUTO FILL
====================================== */

qs("#studentSelect").addEventListener("change",()=>{
    const opt = qs("#studentSelect").selectedOptions[0];
    qs("#sem").value       = opt?.dataset.sem   || "";
    qs("#email").value     = opt?.dataset.email || "";
    qs("#acad_year").value = opt?.dataset.acad  || "";
});


/* ======================================
   📚 LOAD SUBJECTS
====================================== */

let subjectData = {};

async function loadSubjects(){
    try{
        const res = await fetch(SUBJECT_API);
        subjectData = await res.json();

        loadCategory("PEC1", ["pe1_pref1","pe1_pref2","pe1_pref3"]);
        loadCategory("PEC2", ["pe2_pref1","pe2_pref2","pe2_pref3"]);
        loadCategory("PEC3", ["pe3_pref1","pe3_pref2","pe3_pref3"]);

    }catch(e){ console.error(e); }
}

function loadCategory(category, ids){
    const subjects = subjectData[category] || [];

    ids.forEach((id,index)=>{
        const select = document.getElementById(id);

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


/* ======================================
   🚫 GLOBAL DUPLICATE PREVENTION
====================================== */

const allSelectIds = [
    "pe1_pref1","pe1_pref2","pe1_pref3",
    "pe2_pref1","pe2_pref2","pe2_pref3",
    "pe3_pref1","pe3_pref2","pe3_pref3"
];

function preventAllDuplicates(){

    const selectedValues = allSelectIds
        .map(id => qs("#"+id).value)
        .filter(v => v);

    allSelectIds.forEach(id => {

        const select = qs("#"+id);

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


/* ======================================
   💾 SAVE ELECTIVES
====================================== */

qs("#submitElectives").addEventListener("click", async ()=>{

    const btn = qs("#submitElectives");
    if(btn.disabled) return;

    btn.disabled = true;
    showSpinner("Submitting your electives... Please wait");

    const payload = {
        reg  : qs("#studentSelect").value,
        name : qs("#studentSelect").selectedOptions[0]?.text || "",

        pe1_1: qs("#pe1_pref1").value,
        pe1_2: qs("#pe1_pref2").value,
        pe1_3: qs("#pe1_pref3").value,

        pe2_1: qs("#pe2_pref1").value,
        pe2_2: qs("#pe2_pref2").value,
        pe2_3: qs("#pe2_pref3").value,

        pe3_1: qs("#pe3_pref1").value,
        pe3_2: qs("#pe3_pref2").value,
        pe3_3: qs("#pe3_pref3").value
    };

    /* 🔒 MANDATORY VALIDATION */
    if(
        !payload.reg ||
        !payload.pe1_1 || !payload.pe1_2 || !payload.pe1_3 ||
        !payload.pe2_1 || !payload.pe2_2 || !payload.pe2_3 ||
        !payload.pe3_1 || !payload.pe3_2 || !payload.pe3_3
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

/* ======================================
   🎉 SUCCESS PAGE
====================================== */

function showSuccessPage(data){

    document.querySelector(".portal").classList.add("hidden");
    qs("#successPage").classList.remove("hidden");

    const downloadBtn = qs("#downloadPdfBtn");
    downloadBtn.classList.remove("hidden");

    downloadBtn.onclick = ()=> generatePDF(data);
}


/* ======================================
   📄 GENERATE PDF
====================================== */

function generatePDF(data){

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Elective Subjects Response",20,20);

    doc.setFontSize(12);
    doc.text(`Student: ${data.name}`,20,35);
    doc.text(`PEC1: ${data.pe1_1}, ${data.pe1_2}, ${data.pe1_3}`,20,50);
    doc.text(`PEC2: ${data.pe2_1}, ${data.pe2_2}, ${data.pe2_3}`,20,65);
    doc.text(`PEC3: ${data.pe3_1}, ${data.pe3_2}, ${data.pe3_3}`,20,80);

    doc.save("Elective_Subjects_response.pdf");
}


/* ======================================
   🚀 INITIAL LOAD
====================================== */

document.addEventListener("DOMContentLoaded", ()=>{
    loadSubjects();
    show(1);
});