// --- Global Elements ---
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskDate = document.getElementById('task-date');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const motivationalMsg = document.getElementById('motivational-msg');

const statAssigned = document.getElementById('stat-assigned');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');

// Theme Toggle
const themeBtn = document.getElementById('theme-toggle-btn');
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
});

// Motivational Messages
const messages = [
    "Ready to crush it today? 🔥", 
    "You're doing great! 💪", 
    "Stay focused! 🧠", 
    "Small steps every day! 🚶‍♂️",
    "Keep that momentum going! 🚀"
];
function updateMotivation() {
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    motivationalMsg.textContent = randomMsg;
}

// Web Audio API Sounds
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    
    if (type === 'start') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(440, audioCtx.currentTime); 
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'complete') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start(); osc.stop(audioCtx.currentTime + 0.15);
    }
}

// Notifications
function showNotification(msg) {
    const toast = document.getElementById('notification-toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
}

// Streak System
function updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    let lastActive = localStorage.getItem('lastActiveDate');
    let streak = parseInt(localStorage.getItem('studyStreak')) || 0;

    if (lastActive !== today) {
        let yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toISOString().split('T')[0]) {
            streak++; 
        } else if (lastActive) {
            streak = 1; 
        } else {
            streak = 1; 
        }
        localStorage.setItem('studyStreak', streak);
        localStorage.setItem('lastActiveDate', today);
    }
    document.getElementById('streak-display').textContent = `🔥 ${streak} Day Streak`;
}

// Mini Calendar View
function renderCalendar() {
    const grid = document.getElementById('mini-calendar');
    grid.innerHTML = '';
    const date = new Date();
    const todayStr = date.toISOString().split('T')[0];
    
    document.getElementById('calendar-month').textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const taskDates = Array.from(taskList.querySelectorAll('li')).map(li => li.getAttribute('data-date')).filter(d => d);

    for (let i = -6; i <= 7; i++) {
        const day = new Date();
        day.setDate(date.getDate() + i);
        const dayStr = day.toISOString().split('T')[0];
        
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = day.getDate();
        
        if (dayStr === todayStr) dayDiv.classList.add('today');
        if (taskDates.includes(dayStr)) dayDiv.classList.add('has-task');
        
        grid.appendChild(dayDiv);
    }
}

// Check for Overdue AND Due Today Tasks
function refreshOverdueStatus() {
    const today = new Date().toISOString().split('T')[0]; 
    const tasks = taskList.querySelectorAll('li');
    
    tasks.forEach(li => {
        const dateAttr = li.getAttribute('data-date');
        const isCompleted = li.classList.contains('completed');
        
        // Reset classes first
        li.classList.remove('overdue', 'due-today');
        
        if (dateAttr && !isCompleted) {
            if (dateAttr < today) {
                li.classList.add('overdue'); // Past due (Red)
            } else if (dateAttr === today) {
                li.classList.add('due-today'); // Due today (Orange)
            }
        }
    });
}

// Empty State Check
function checkEmptyState() {
    const hasTasks = taskList.querySelectorAll('li').length > 0;
    emptyState.style.display = hasTasks ? 'none' : 'block';
}

// Update Stats
function updateSystem() {
    const total = taskList.querySelectorAll('li').length;
    const completed = taskList.querySelectorAll('li.completed').length;

    document.getElementById('stat-assigned').textContent = total;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-pending').textContent = total - completed;
    
    checkEmptyState();
    localStorage.setItem("savedTasks", taskList.innerHTML);
    renderCalendar();
}

// Load System
function initSystem() {
    taskList.innerHTML = localStorage.getItem("savedTasks") || "";
    refreshOverdueStatus(); 
    updateSystem();
    updateStreak();
    
    const today = new Date().toISOString().split('T')[0];
    let tasksDueToday = 0;
    taskList.querySelectorAll('li').forEach(li => {
        if (li.getAttribute('data-date') === today && !li.classList.contains('completed')) tasksDueToday++;
    });
    
    if (tasksDueToday > 0) setTimeout(() => showNotification(`⚠️ You have ${tasksDueToday} tasks due today!`), 1000);
}
initSystem();

// Create Task
function createNewTask() {
    const text = taskInput.value.trim(); 
    const dateVal = taskDate.value; 
    const catVal = taskCategory.value;
    
    if (text !== "") {
        const li = document.createElement('li');
        if (dateVal) li.setAttribute('data-date', dateVal); // Required for date highlighting!
        
        let dateHTML = "";
        if (dateVal !== "") {
            dateHTML = `<span class="task-date-display">🗓️ Due: ${dateVal}</span>`;
        }
        
        li.innerHTML = `
            <div class="task-info">
                <span class="task-name">${text}</span>
                <div class="task-meta">
                    <span class="category-badge">${catVal}</span>
                    ${dateHTML}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn edit-btn" title="Edit">✏️</button>
                <button class="action-btn delete-btn" title="Delete">❌</button>
            </div>
        `;
        taskList.appendChild(li);
        taskInput.value = ""; taskDate.value = ""; 
        
        refreshOverdueStatus();
        updateSystem(); 
    }
}
addTaskBtn.addEventListener('click', createNewTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') createNewTask(); });

// Task Interaction (Edit, Complete, Delete)
taskList.addEventListener('click', function(e) {
    let li = e.target.closest('li'); 
    if (!li) return;

    if (e.target.classList.contains("delete-btn")) {
        li.remove();
        updateSystem(); return;
    } 
    
    if (e.target.classList.contains("edit-btn")) {
        const nameSpan = li.querySelector('.task-name');
        const currentText = nameSpan.textContent;
        const input = document.createElement('input');
        input.type = 'text'; input.value = currentText; input.className = 'edit-input';
        
        nameSpan.replaceWith(input);
        input.focus();
        
        const saveEdit = () => {
            const newSpan = document.createElement('span');
            newSpan.className = 'task-name'; newSpan.textContent = input.value || currentText;
            input.replaceWith(newSpan);
            updateSystem();
        };
        input.addEventListener('blur', saveEdit);
        input.addEventListener('keypress', ev => { if(ev.key === 'Enter') saveEdit(); });
        return;
    }
    
    if (!e.target.classList.contains("edit-input")) {
        li.classList.toggle('completed');
        refreshOverdueStatus(); 
        if (li.classList.contains('completed')) {
            playSound('complete');
            updateStreak(); 
            updateMotivation();
        }
        updateSystem(); 
    }
});

// Today Filter
document.getElementById('filter-all').addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    taskList.querySelectorAll('li').forEach(li => li.style.display = 'flex');
});

document.getElementById('filter-today').addEventListener('click', (e) => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const today = new Date().toISOString().split('T')[0];
    taskList.querySelectorAll('li').forEach(li => {
        li.style.display = li.getAttribute('data-date') === today ? 'flex' : 'none';
    });
});

// --- Timer & Goal Logic ---

// 🔥 MISSING VARIABLES RESTORED HERE 🔥
const timerDisplay = document.getElementById('timer-display');
const goalInput = document.getElementById('goal-input');
const progressBar = document.getElementById('study-progress');
const progressText = document.getElementById('progress-text');

let timerInterval;
let totalSeconds = parseInt(localStorage.getItem('savedTimer')) || 0;
let isRunning = false; 

function formatTime(s) { return new Date(s * 1000).toISOString().substr(11, 8); }
goalInput.value = localStorage.getItem('savedGoal') || "";
timerDisplay.textContent = formatTime(totalSeconds);

function updateProgress() {
    const goalSecs = parseFloat(goalInput.value) * 60; 
    
    if (goalSecs > 0) {
        const pct = Math.min((totalSeconds / goalSecs) * 100, 100);
        progressBar.value = pct; 
        progressText.textContent = Math.floor(pct) + '%';
    } else { 
        progressBar.value = 0; 
        progressText.textContent = '0%'; 
    }
}
updateProgress(); 
goalInput.addEventListener('input', () => { localStorage.setItem('savedGoal', goalInput.value); updateProgress(); });


document.getElementById('start-btn').addEventListener('click', () => {
    if (isRunning) return; 
    isRunning = true; 
    playSound('start'); 
    updateStreak();
    
    document.body.classList.add('timer-running'); 
    
    clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        totalSeconds++; 
        localStorage.setItem('savedTimer', totalSeconds);
        timerDisplay.textContent = formatTime(totalSeconds); 
        updateProgress(); 
        
        const goalSecs = parseFloat(goalInput.value) * 60;
        if (goalSecs > 0 && totalSeconds >= goalSecs) {
            clearInterval(timerInterval);
            isRunning = false;
            
            document.body.classList.remove('timer-running'); 
            
            playSound('complete'); 
            showNotification("🎉 Goal Reached! Amazing job!");
            motivationalMsg.textContent = "Goal crushed! Take a well-deserved break. ☕";
        }
    }, 1000); 
});

document.getElementById('stop-btn').addEventListener('click', () => { 
    clearInterval(timerInterval); 
    isRunning = false; 
    document.body.classList.remove('timer-running'); 
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("Reset current timer?")) {
        clearInterval(timerInterval); 
        isRunning = false; 
        totalSeconds = 0;
        localStorage.removeItem('savedTimer'); 
        timerDisplay.textContent = formatTime(0); 
        updateProgress(); 
        document.body.classList.remove('timer-running'); 
    }
});

document.getElementById('new-day-btn').addEventListener('click', () => {
    if (confirm("Start a new day? (Timer & Goal will reset)")) {
        clearInterval(timerInterval); 
        isRunning = false; 
        totalSeconds = 0;
        localStorage.removeItem('savedTimer'); 
        goalInput.value = ""; 
        localStorage.removeItem('savedGoal');
        timerDisplay.textContent = formatTime(0); 
        updateProgress();
        document.body.classList.remove('timer-running'); 
        showNotification("🌅 New Day Started!");
    }
});

// Focus Mode
document.getElementById('focus-btn').addEventListener('click', function() {
    const elementsToHide = ['.sidebar', '.stats-section', '#motivational-msg', '#new-day-btn'];
    const isFocus = this.textContent === 'Toggle Focus Mode';
    
    elementsToHide.forEach(sel => document.querySelector(sel).style.display = isFocus ? 'none' : (sel === '.sidebar' || sel === '.stats-section' ? 'flex' : 'block'));
    this.textContent = isFocus ? 'Exit Focus Mode' : 'Toggle Focus Mode';
    this.style.background = isFocus ? '#ef4444' : '#10b981';
});