const API_URL = "https://script.google.com/macros/s/AKfycbzDn-8zPiHMvVcg7VJ9gYKxiHC8vqD3l2gV6OHC0Q6fi9eNlIJSk5ZCsJ_BePb8T_AOiQ/exec";

let students = [];
let homeData = null;

function init() {
  renderClock();
  setInterval(renderClock, 1000);
  loadHomeData();
}

function renderClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  document.getElementById("clock").textContent = `${h}:${m}:${s}`;
}

async function loadHomeData() {
  try {
    const res = await fetch(`${API_URL}?action=home`);
    const data = await res.json();

    homeData = data;
    students = data.students || [];

    renderStudents();
    renderSchedule(data.schedule || []);
    renderSupplies(data.supplies || { status: "missing", items: [] });
    renderAssignments(data.assignments || []);
    renderPraiseRanking(data.praiseTop3 || []);
  } catch (error) {
    console.error(error);
    renderSchedule([]);
    renderSupplies({ status: "missing", items: [] });
    renderAssignments([]);
    renderPraiseRanking([]);
  }
}

function renderStudents() {
  const select = document.getElementById("studentSelect");
  select.innerHTML = `<option value="">이름을 선택하세요</option>`;

  students.forEach(student => {
    const option = document.createElement("option");
    option.value = student.name;
    option.textContent = `${student.number}. ${student.name}`;
    select.appendChild(option);
  });
}

async function postData(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return await res.json();
}

async function checkAttendance() {
  const name = document.getElementById("studentSelect").value;
  const result = document.getElementById("attendanceResult");

  if (!name) {
    result.textContent = "이름을 먼저 선택해주세요.";
    return;
  }

  result.textContent = "출석 기록 중...";

  try {
    const data = await postData({
      action: "attendance",
      name
    });

    if (!data.ok) {
      result.textContent = "출석 기록에 실패했습니다.";
      return;
    }

    const statusIcon = data.status === "지각" ? "🔴" : "🟢";
    result.textContent = `${name} ${data.time} 출석 완료! ${statusIcon} ${data.status}`;
  } catch (error) {
    console.error(error);
    result.textContent = "연결 오류가 발생했습니다.";
  }
}

function renderSchedule(schedule) {
  const list = document.getElementById("scheduleList");
  list.innerHTML = "";

  if (!schedule.length) {
    list.innerHTML = `<li class="empty">이번 주 학사일정이 없습니다.</li>`;
    return;
  }

  schedule.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${formatShortDate(item.date)}</strong> ${item.title || item.content || ""}`;
    list.appendChild(li);
  });
}

function renderSupplies(data) {
  const box = document.getElementById("supplyBox");

  if (data.status === "input") {
    box.innerHTML = data.items.map(item => `🎒 ${item}`).join("<br>");
  } else if (data.status === "none") {
    box.innerHTML = `<span class="empty">오늘 준비물 없음</span>`;
  } else {
    box.innerHTML = `<span class="warning">준비물 담당자 확인 필요</span>`;
  }
}

function renderAssignments(assignments) {
  const box = document.getElementById("assignmentBox");

  if (!assignments.length) {
    box.innerHTML = `<span class="empty">마감임박 과제 없음</span>`;
    return;
  }

  box.innerHTML = assignments
    .map(item => `📚 ${item.title} <strong>${item.dday}</strong>`)
    .join("<br>");
}

function renderPraiseRanking(rankingData) {
  const ranking = document.getElementById("praiseRanking");
  ranking.innerHTML = "";

  if (!rankingData.length) {
    ranking.innerHTML = `<li class="empty">아직 칭찬 기록이 없습니다.</li>`;
    return;
  }

  rankingData.forEach((item, index) => {
    const medal = ["🥇", "🥈", "🥉"][index] || "✨";
    const li = document.createElement("li");

    if (typeof item === "string") {
      li.textContent = `${medal} ${item}`;
    } else {
      li.textContent = `${medal} ${item.name} ${item.score}점 ${item.level || ""}`;
    }

    ranking.appendChild(li);
  });
}

async function submitSupply() {
  const writer = document.getElementById("supplyWriter").value.trim();
  const input = document.getElementById("supplyInput");
  const value = input.value.trim();
  const result = document.getElementById("supplyResult");

  if (!writer) {
    result.textContent = "작성자 이름을 입력해주세요.";
    return;
  }

  if (!value) {
    result.textContent = "준비물을 입력해주세요.";
    return;
  }

  result.textContent = "저장 중...";

  try {
    const data = await postData({
      action: "studentInput",
      type: "준비물",
      content: value,
      writer,
      status: "입력"
    });

    if (!data.ok) {
      result.textContent = "저장에 실패했습니다.";
      return;
    }

    input.value = "";
    result.textContent = "준비물이 등록되었습니다.";
    await loadHomeData();
  } catch (error) {
    console.error(error);
    result.textContent = "연결 오류가 발생했습니다.";
  }
}

async function submitNoSupply() {
  const writer = document.getElementById("supplyWriter").value.trim();
  const result = document.getElementById("supplyResult");

  if (!writer) {
    result.textContent = "작성자 이름을 입력해주세요.";
    return;
  }

  result.textContent = "저장 중...";

  try {
    const data = await postData({
      action: "studentInput",
      type: "준비물",
      content: "없음",
      writer,
      status: "없음"
    });

    if (!data.ok) {
      result.textContent = "저장에 실패했습니다.";
      return;
    }

    result.textContent = "오늘 준비물 없음으로 등록되었습니다.";
    await loadHomeData();
  } catch (error) {
    console.error(error);
    result.textContent = "연결 오류가 발생했습니다.";
  }
}

async function submitAssignment() {
  const writer = document.getElementById("assignmentWriter").value.trim();
  const title = document.getElementById("assignmentTitle").value.trim();
  const due = document.getElementById("assignmentDue").value;
  const result = document.getElementById("assignmentResult");

  if (!writer) {
    result.textContent = "작성자 이름을 입력해주세요.";
    return;
  }

  if (!title || !due) {
    result.textContent = "과제명과 마감일을 입력해주세요.";
    return;
  }

  result.textContent = "저장 중...";

  try {
    const data = await postData({
      action: "studentInput",
      type: "과제",
      content: title,
      dueDate: due,
      writer,
      status: "입력"
    });

    if (!data.ok) {
      result.textContent = "저장에 실패했습니다.";
      return;
    }

    document.getElementById("assignmentTitle").value = "";
    document.getElementById("assignmentDue").value = "";
    result.textContent = "과제가 등록되었습니다.";
    await loadHomeData();
  } catch (error) {
    console.error(error);
    result.textContent = "연결 오류가 발생했습니다.";
  }
}

async function submitNoAssignment() {
  const writer = document.getElementById("assignmentWriter").value.trim();
  const result = document.getElementById("assignmentResult");

  if (!writer) {
    result.textContent = "작성자 이름을 입력해주세요.";
    return;
  }

  result.textContent = "저장 중...";

  try {
    const data = await postData({
      action: "studentInput",
      type: "과제",
      content: "없음",
      writer,
      status: "없음"
    });

    if (!data.ok) {
      result.textContent = "저장에 실패했습니다.";
      return;
    }

    result.textContent = "마감임박 과제 없음으로 등록되었습니다.";
    await loadHomeData();
  } catch (error) {
    console.error(error);
    result.textContent = "연결 오류가 발생했습니다.";
  }
}

function formatShortDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date)) return dateString;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];

  return `${month}/${day}(${weekday})`;
}

init();
