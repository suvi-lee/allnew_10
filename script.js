const students = [
  "고우리", "기태경", "김수현", "김민준", "김서연",
  "남아엘", "박성우", "송지효", "안정우", "오태윤",
  "위승아", "이선아", "이유준", "임규민", "정별",
  "정시아", "정윤성", "최지원", "한지윤"
];

const sampleData = {
  schedule: [
    { date: "6/24(수)", title: "학급회의" },
    { date: "6/25(목)", title: "영어 단어시험" },
    { date: "6/26(금)", title: "독서기록장 제출" }
  ],
  supplies: {
    status: "input",
    items: ["체육복", "독서기록장"]
  },
  assignments: {
    status: "input",
    items: [
      { title: "영어 단어 외우기", dday: "D-1" },
      { title: "사회 활동지 제출", dday: "D-2" }
    ]
  },
  praiseTop3: ["김민준", "정시아", "송지효"]
};

function init() {
  renderStudents();
  renderClock();
  setInterval(renderClock, 1000);

  renderSchedule();
  renderSupplies();
  renderAssignments();
  renderPraiseRanking();
}

function renderStudents() {
  const select = document.getElementById("studentSelect");

  students.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });
}

function renderClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("clock").textContent = `${h}:${m}:${s}`;
}

function checkAttendance() {
  const name = document.getElementById("studentSelect").value;
  const result = document.getElementById("attendanceResult");

  if (!name) {
    result.textContent = "이름을 먼저 선택해주세요.";
    return;
  }

  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  const isLate = hour > 8 || (hour === 8 && minute >= 48);
  const status = isLate ? "🔴 지각" : "🟢 정시등교";

  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  result.textContent = `${name} ${time} 출석 완료! ${status}`;

  // 나중에 Google Apps Script로 전송할 부분
  console.log({
    type: "attendance",
    name,
    time,
    status
  });
}

function renderSchedule() {
  const list = document.getElementById("scheduleList");
  list.innerHTML = "";

  sampleData.schedule.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.date}</strong> ${item.title}`;
    list.appendChild(li);
  });
}

function renderSupplies() {
  const box = document.getElementById("supplyBox");
  const data = sampleData.supplies;

  if (data.status === "input") {
    box.innerHTML = data.items.map(item => `🎒 ${item}`).join("<br>");
  } else if (data.status === "none") {
    box.innerHTML = `<span class="empty">오늘 준비물 없음</span>`;
  } else {
    box.innerHTML = `<span class="warning">준비물 담당자 확인 필요</span>`;
  }
}

function renderAssignments() {
  const box = document.getElementById("assignmentBox");
  const data = sampleData.assignments;

  if (data.status === "input") {
    box.innerHTML = data.items
      .map(item => `📚 ${item.title} <strong>${item.dday}</strong>`)
      .join("<br>");
  } else if (data.status === "none") {
    box.innerHTML = `<span class="empty">마감임박 과제 없음</span>`;
  } else {
    box.innerHTML = `<span class="warning">과제 담당자 확인 필요</span>`;
  }
}

function renderPraiseRanking() {
  const ranking = document.getElementById("praiseRanking");
  ranking.innerHTML = "";

  sampleData.praiseTop3.forEach((name, index) => {
    const medal = ["🥇", "🥈", "🥉"][index];
    const li = document.createElement("li");
    li.textContent = `${medal} ${name}`;
    ranking.appendChild(li);
  });
}

function submitSupply() {
  const input = document.getElementById("supplyInput");
  const value = input.value.trim();

  if (!value) {
    alert("준비물을 입력해주세요.");
    return;
  }

  sampleData.supplies = {
    status: "input",
    items: value.split(",").map(v => v.trim()).filter(Boolean)
  };

  input.value = "";
  renderSupplies();

  console.log({
    type: "supply",
    status: "input",
    items: sampleData.supplies.items
  });
}

function submitNoSupply() {
  sampleData.supplies = {
    status: "none",
    items: []
  };

  renderSupplies();

  console.log({
    type: "supply",
    status: "none"
  });
}

function submitAssignment() {
  const title = document.getElementById("assignmentTitle").value.trim();
  const due = document.getElementById("assignmentDue").value;

  if (!title || !due) {
    alert("과제명과 마감일을 입력해주세요.");
    return;
  }

  const dday = calculateDday(due);

  sampleData.assignments = {
    status: "input",
    items: [{ title, dday }]
  };

  document.getElementById("assignmentTitle").value = "";
  document.getElementById("assignmentDue").value = "";

  renderAssignments();

  console.log({
    type: "assignment",
    status: "input",
    title,
    due,
    dday
  });
}

function submitNoAssignment() {
  sampleData.assignments = {
    status: "none",
    items: []
  };

  renderAssignments();

  console.log({
    type: "assignment",
    status: "none"
  });
}

function calculateDday(dateString) {
  const today = new Date();
  const due = new Date(dateString);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "D-DAY";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

init();
