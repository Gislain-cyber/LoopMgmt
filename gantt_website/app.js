/**
 * Loop Automation - Project Management Application
 * A comprehensive Gantt chart and team management system
 */

// ============================================
// DATA STORE
// ============================================

const defaultTeamMembers = [
    { name: "Bander Bakalka", role: "PM", color: "#ff5757", email: "", targetHours: 40 },
    { name: "Jon Klomfass", role: "Lead", color: "#ffbd59", email: "", targetHours: 40 },
    { name: "Gislain Hotcho Nkenga", role: "Lead", color: "#ffd666", email: "", targetHours: 40 },
    { name: "Cirex Peroche", role: "Member", color: "#64b5f6", email: "", targetHours: 40 },
    { name: "Davis Oliver", role: "Member", color: "#81c784", email: "", targetHours: 40 },
    { name: "Josh Kavanagh", role: "Member", color: "#ba68c8", email: "", targetHours: 40 },
    { name: "Lucas Pasia", role: "Member", color: "#ff8a80", email: "", targetHours: 40 },
    { name: "Luke Kivell", role: "Member", color: "#80deea", email: "", targetHours: 40 },
    { name: "Sebastian Chandler", role: "Member", color: "#ffb74d", email: "", targetHours: 40 },
    { name: "Anmol Singh Saini", role: "Member", color: "#aed581", email: "", targetHours: 40 },
    { name: "Anton Makaranka", role: "Member", color: "#9575cd", email: "", targetHours: 40 },
    { name: "Blake Alexander", role: "Member", color: "#4dd0e1", email: "", targetHours: 40 },
    { name: "Joel Reyes", role: "Member", color: "#ffa726", email: "", targetHours: 40 },
    { name: "Ren Falkenrath", role: "Member", color: "#ec407a", email: "", targetHours: 40 }
];

const sampleTasks = [
    { id: 1, name: "Project Kickoff", assignedTo: "Bander Bakalka", startDate: "2026-02-03", endDate: "2026-02-03", estHours: 4, actualHours: 4, status: "Complete", priority: "High" },
    { id: 2, name: "Requirements Gathering", assignedTo: "Jon Klomfass", startDate: "2026-02-04", endDate: "2026-02-07", estHours: 16, actualHours: 12, status: "In Progress", priority: "High" },
    { id: 3, name: "System Design", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-02-08", endDate: "2026-02-14", estHours: 24, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 4, name: "Task Assignment", assignedTo: "Bander Bakalka", startDate: "2026-02-10", endDate: "2026-02-11", estHours: 8, actualHours: 0, status: "Not Started", priority: "Medium" },
    { id: 5, name: "Development Phase 1", assignedTo: "Cirex Peroche", startDate: "2026-02-15", endDate: "2026-02-21", estHours: 32, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 6, name: "Development Phase 2", assignedTo: "Davis Oliver", startDate: "2026-02-15", endDate: "2026-02-21", estHours: 32, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 7, name: "Testing Module A", assignedTo: "Josh Kavanagh", startDate: "2026-02-22", endDate: "2026-02-25", estHours: 16, actualHours: 0, status: "Not Started", priority: "Medium" },
    { id: 8, name: "Testing Module B", assignedTo: "Lucas Pasia", startDate: "2026-02-22", endDate: "2026-02-25", estHours: 16, actualHours: 0, status: "Not Started", priority: "Medium" },
    { id: 9, name: "Integration Work", assignedTo: "Luke Kivell", startDate: "2026-02-26", endDate: "2026-03-01", estHours: 20, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 10, name: "Documentation", assignedTo: "Sebastian Chandler", startDate: "2026-02-20", endDate: "2026-03-05", estHours: 24, actualHours: 0, status: "Not Started", priority: "Medium" },
    { id: 11, name: "Quality Review", assignedTo: "Jon Klomfass", startDate: "2026-03-02", endDate: "2026-03-04", estHours: 12, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 12, name: "Bug Fixes", assignedTo: "Anmol Singh Saini", startDate: "2026-03-05", endDate: "2026-03-08", estHours: 16, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 13, name: "User Training Prep", assignedTo: "Anton Makaranka", startDate: "2026-03-01", endDate: "2026-03-07", estHours: 20, actualHours: 0, status: "Not Started", priority: "Medium" },
    { id: 14, name: "Final Testing", assignedTo: "Blake Alexander", startDate: "2026-03-09", endDate: "2026-03-11", estHours: 12, actualHours: 0, status: "Not Started", priority: "High" },
    { id: 15, name: "Deployment", assignedTo: "Joel Reyes", startDate: "2026-03-12", endDate: "2026-03-13", estHours: 8, actualHours: 0, status: "Not Started", priority: "Critical" },
    { id: 16, name: "Project Review", assignedTo: "Bander Bakalka", startDate: "2026-03-14", endDate: "2026-03-14", estHours: 4, actualHours: 0, status: "Not Started", priority: "High" }
];

// Load from localStorage or use defaults
let teamMembers = JSON.parse(localStorage.getItem('loopTeamMembers')) || [...defaultTeamMembers];
let tasks = JSON.parse(localStorage.getItem('loopTasks')) || [...sampleTasks];

// Timeline configuration
const TIMELINE_DAYS = 60;
const DAY_WIDTH = 28;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function saveData() {
    localStorage.setItem('loopTeamMembers', JSON.stringify(teamMembers));
    localStorage.setItem('loopTasks', JSON.stringify(tasks));
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toISOString().split('T')[0];
}

function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

function daysBetween(start, end) {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
}

function getTeamMemberByName(name) {
    return teamMembers.find(m => m.name === name);
}

function getRoleByMember(memberName) {
    const member = getTeamMemberByName(memberName);
    return member ? member.role : '';
}

function getMemberColor(memberName) {
    const member = getTeamMemberByName(memberName);
    return member ? member.color : '#3498db';
}

function getAssignedHours(memberName) {
    return tasks
        .filter(t => t.assignedTo === memberName)
        .reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
}

function getStatusClass(status) {
    const statusMap = {
        'Complete': 'status-complete',
        'In Progress': 'status-progress',
        'Not Started': 'status-pending',
        'Delayed': 'status-delayed',
        'On Hold': 'status-hold'
    };
    return statusMap[status] || 'status-pending';
}

function getPriorityClass(priority) {
    const priorityMap = {
        'Critical': 'priority-critical',
        'High': 'priority-high',
        'Medium': 'priority-medium',
        'Low': 'priority-low'
    };
    return priorityMap[priority] || 'priority-medium';
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        
        // Update nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
        
        // Refresh view
        if (view === 'dashboard') renderDashboard();
        if (view === 'gantt') renderGantt();
        if (view === 'team') renderTeam();
    });
});

// ============================================
// DASHBOARD RENDERING
// ============================================

function renderDashboard() {
    // Task stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Complete').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const notStartedTasks = tasks.filter(t => t.status === 'Not Started').length;
    
    document.getElementById('total-tasks').textContent = totalTasks;
    document.getElementById('completed-tasks').textContent = completedTasks;
    document.getElementById('in-progress-tasks').textContent = inProgressTasks;
    document.getElementById('not-started-tasks').textContent = notStartedTasks;
    
    // Hours stats
    const totalEstHours = tasks.reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
    const totalActualHours = tasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0);
    const remainingHours = totalEstHours - totalActualHours;
    
    document.getElementById('total-est-hours').textContent = totalEstHours.toFixed(0);
    document.getElementById('total-actual-hours').textContent = totalActualHours.toFixed(0);
    document.getElementById('remaining-hours').textContent = remainingHours.toFixed(0);
    
    const progressPercent = totalEstHours > 0 ? (totalActualHours / totalEstHours) * 100 : 0;
    document.getElementById('hours-progress').style.width = `${Math.min(progressPercent, 100)}%`;
    
    // Team workload table
    const workloadTbody = document.getElementById('workload-tbody');
    workloadTbody.innerHTML = teamMembers.map(member => {
        const assignedHours = getAssignedHours(member.name);
        const variance = member.targetHours - assignedHours;
        const loadPercent = member.targetHours > 0 ? (assignedHours / member.targetHours) * 100 : 0;
        
        let loadClass = 'under';
        if (loadPercent >= 80 && loadPercent <= 100) loadClass = 'optimal';
        if (loadPercent > 100) loadClass = 'over';
        
        const varianceClass = variance >= 0 ? 'variance-positive' : 'variance-negative';
        
        return `
            <tr>
                <td>
                    <span class="member-color" style="background: ${member.color}"></span>
                    ${member.name}
                </td>
                <td>${member.role}</td>
                <td>${member.targetHours}</td>
                <td>${assignedHours}</td>
                <td class="${varianceClass}">${variance >= 0 ? '+' : ''}${variance}</td>
                <td>
                    <div class="load-bar-container">
                        <div class="load-bar ${loadClass}" style="width: ${Math.min(loadPercent, 100)}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// GANTT CHART RENDERING
// ============================================

function renderGantt() {
    renderTaskTable();
    renderTimeline();
}

function renderTaskTable() {
    const tbody = document.getElementById('task-tbody');
    
    tbody.innerHTML = tasks.map((task, index) => {
        const days = task.startDate && task.endDate ? daysBetween(task.startDate, task.endDate) : '';
        const remaining = (task.estHours || 0) - (task.actualHours || 0);
        const percentComplete = task.estHours > 0 ? Math.round((task.actualHours / task.estHours) * 100) : 0;
        const role = getRoleByMember(task.assignedTo);
        const memberColor = getMemberColor(task.assignedTo);
        
        return `
            <tr data-task-id="${task.id}">
                <td class="col-id">${task.id}</td>
                <td class="col-name">
                    <span style="border-left: 3px solid ${memberColor}; padding-left: 8px;">${task.name}</span>
                </td>
                <td class="col-assigned">${task.assignedTo}</td>
                <td class="col-role">${role}</td>
                <td class="col-date">${task.startDate}</td>
                <td class="col-date">${task.endDate}</td>
                <td class="col-num">${days}</td>
                <td class="col-num">${task.estHours || ''}</td>
                <td class="col-num">${task.actualHours || ''}</td>
                <td class="col-num">${remaining || ''}</td>
                <td class="col-pct">${percentComplete}%</td>
                <td class="col-status">
                    <span class="status-badge ${getStatusClass(task.status)}">${task.status}</span>
                </td>
                <td class="col-priority">
                    <span class="priority-badge ${getPriorityClass(task.priority)}">${task.priority}</span>
                </td>
                <td class="col-actions">
                    <button class="btn-icon" onclick="editTask(${index})" title="Edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTimeline() {
    const headerEl = document.getElementById('timeline-header');
    const bodyEl = document.getElementById('timeline-body');
    
    // Calculate timeline range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find earliest task start
    let earliestDate = new Date(today);
    tasks.forEach(task => {
        if (task.startDate) {
            const start = parseDate(task.startDate);
            if (start < earliestDate) earliestDate = start;
        }
    });
    
    // Start timeline 3 days before earliest date
    const timelineStart = new Date(earliestDate);
    timelineStart.setDate(timelineStart.getDate() - 3);
    
    // Build header with months and days
    let headerHTML = '';
    let currentMonth = -1;
    let monthDays = [];
    
    for (let i = 0; i < TIMELINE_DAYS; i++) {
        const date = new Date(timelineStart);
        date.setDate(date.getDate() + i);
        
        const month = date.getMonth();
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday = date.getTime() === today.getTime();
        
        if (month !== currentMonth) {
            if (monthDays.length > 0) {
                const monthName = new Date(timelineStart);
                monthName.setDate(monthName.getDate() + monthDays[0].index);
                headerHTML += `
                    <div class="month-header">
                        <div class="month-label">${monthName.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                        <div class="days-row">
                            ${monthDays.map(d => `
                                <div class="day-cell ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}">${d.day}</div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            monthDays = [];
            currentMonth = month;
        }
        
        monthDays.push({
            day: date.getDate(),
            isWeekend,
            isToday,
            index: i
        });
    }
    
    // Add last month
    if (monthDays.length > 0) {
        const monthName = new Date(timelineStart);
        monthName.setDate(monthName.getDate() + monthDays[0].index);
        headerHTML += `
            <div class="month-header">
                <div class="month-label">${monthName.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
                <div class="days-row">
                    ${monthDays.map(d => `
                        <div class="day-cell ${d.isWeekend ? 'weekend' : ''} ${d.isToday ? 'today' : ''}">${d.day}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    headerEl.innerHTML = headerHTML;
    
    // Build body rows with Gantt bars
    let bodyHTML = '';
    
    tasks.forEach(task => {
        let rowHTML = '<div class="timeline-row">';
        
        for (let i = 0; i < TIMELINE_DAYS; i++) {
            const date = new Date(timelineStart);
            date.setDate(date.getDate() + i);
            
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = date.getTime() === today.getTime();
            
            rowHTML += `<div class="timeline-cell ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}"></div>`;
        }
        
        // Add Gantt bar if task has dates
        if (task.startDate && task.endDate) {
            const taskStart = parseDate(task.startDate);
            const taskEnd = parseDate(task.endDate);
            
            const startOffset = Math.floor((taskStart - timelineStart) / (1000 * 60 * 60 * 24));
            const duration = daysBetween(task.startDate, task.endDate);
            
            if (startOffset < TIMELINE_DAYS && startOffset + duration > 0) {
                const left = Math.max(0, startOffset) * DAY_WIDTH;
                const width = Math.min(duration, TIMELINE_DAYS - Math.max(0, startOffset)) * DAY_WIDTH - 4;
                const color = getMemberColor(task.assignedTo);
                
                rowHTML += `
                    <div class="gantt-bar" 
                         style="left: ${left + 2}px; width: ${width}px; background: ${color};"
                         title="${task.name} (${task.assignedTo})">
                        ${width > 60 ? task.name.substring(0, 10) + (task.name.length > 10 ? '...' : '') : ''}
                    </div>
                `;
            }
        }
        
        rowHTML += '</div>';
        bodyHTML += rowHTML;
    });
    
    bodyEl.innerHTML = bodyHTML;
}

// ============================================
// TEAM RENDERING
// ============================================

function renderTeam() {
    const grid = document.getElementById('team-grid');
    
    grid.innerHTML = teamMembers.map((member, index) => {
        const assignedHours = getAssignedHours(member.name);
        const taskCount = tasks.filter(t => t.assignedTo === member.name).length;
        const loadPercent = member.targetHours > 0 ? (assignedHours / member.targetHours) * 100 : 0;
        
        let loadColor = '#28a745';
        if (loadPercent > 80 && loadPercent <= 100) loadColor = '#00d4aa';
        if (loadPercent > 100) loadColor = '#dc3545';
        
        return `
            <div class="team-card" style="--member-color: ${member.color}">
                <div class="team-card-header">
                    <div class="team-avatar" style="background: ${member.color}">${getInitials(member.name)}</div>
                    <div class="team-info">
                        <h4>${member.name}</h4>
                        <span class="team-role">${member.role}</span>
                    </div>
                </div>
                <div class="team-stats">
                    <div class="team-stat">
                        <span class="team-stat-value">${taskCount}</span>
                        <span class="team-stat-label">Tasks</span>
                    </div>
                    <div class="team-stat">
                        <span class="team-stat-value">${assignedHours}/${member.targetHours}</span>
                        <span class="team-stat-label">Hours</span>
                    </div>
                </div>
                <div class="team-progress">
                    <div class="team-progress-bar">
                        <div class="team-progress-fill" style="width: ${Math.min(loadPercent, 100)}%; background: ${loadColor}"></div>
                    </div>
                </div>
                <div class="team-card-actions">
                    <button onclick="editTeamMember(${index})">Edit</button>
                    <button class="delete" onclick="deleteTeamMember(${index})">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// MODAL HANDLING
// ============================================

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ============================================
// TASK MANAGEMENT
// ============================================

function populateAssignedDropdown() {
    const select = document.getElementById('task-assigned');
    select.innerHTML = teamMembers.map(m => 
        `<option value="${m.name}">${m.name} (${m.role})</option>`
    ).join('');
}

function addNewTask() {
    document.getElementById('modal-title').textContent = 'Add Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('task-start').value = today;
    document.getElementById('task-end').value = today;
    
    populateAssignedDropdown();
    openModal('task-modal');
}

function editTask(index) {
    const task = tasks[index];
    
    document.getElementById('modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = index;
    document.getElementById('task-name').value = task.name;
    document.getElementById('task-start').value = task.startDate;
    document.getElementById('task-end').value = task.endDate;
    document.getElementById('task-est-hours').value = task.estHours;
    document.getElementById('task-actual-hours').value = task.actualHours;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    
    populateAssignedDropdown();
    document.getElementById('task-assigned').value = task.assignedTo;
    
    openModal('task-modal');
}

document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskIndex = document.getElementById('task-id').value;
    const taskData = {
        name: document.getElementById('task-name').value,
        assignedTo: document.getElementById('task-assigned').value,
        startDate: document.getElementById('task-start').value,
        endDate: document.getElementById('task-end').value,
        estHours: parseFloat(document.getElementById('task-est-hours').value) || 0,
        actualHours: parseFloat(document.getElementById('task-actual-hours').value) || 0,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value
    };
    
    if (taskIndex === '') {
        // New task
        const maxId = tasks.reduce((max, t) => Math.max(max, t.id), 0);
        taskData.id = maxId + 1;
        tasks.push(taskData);
    } else {
        // Update existing task
        taskData.id = tasks[taskIndex].id;
        tasks[taskIndex] = taskData;
    }
    
    saveData();
    closeModal('task-modal');
    renderGantt();
    renderDashboard();
});

function deleteTask(index) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks.splice(index, 1);
        saveData();
        renderGantt();
        renderDashboard();
    }
}

// ============================================
// TEAM MEMBER MANAGEMENT
// ============================================

function addNewTeamMember() {
    document.getElementById('team-modal-title').textContent = 'Add Team Member';
    document.getElementById('team-form').reset();
    document.getElementById('member-index').value = '';
    document.getElementById('member-color').value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    openModal('team-modal');
}

function editTeamMember(index) {
    const member = teamMembers[index];
    
    document.getElementById('team-modal-title').textContent = 'Edit Team Member';
    document.getElementById('member-index').value = index;
    document.getElementById('member-name').value = member.name;
    document.getElementById('member-role').value = member.role;
    document.getElementById('member-target').value = member.targetHours;
    document.getElementById('member-email').value = member.email || '';
    document.getElementById('member-color').value = member.color;
    
    openModal('team-modal');
}

document.getElementById('team-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const memberIndex = document.getElementById('member-index').value;
    const oldName = memberIndex !== '' ? teamMembers[memberIndex].name : null;
    
    const memberData = {
        name: document.getElementById('member-name').value,
        role: document.getElementById('member-role').value,
        targetHours: parseInt(document.getElementById('member-target').value) || 40,
        email: document.getElementById('member-email').value,
        color: document.getElementById('member-color').value
    };
    
    if (memberIndex === '') {
        // New member
        teamMembers.push(memberData);
    } else {
        // Update existing member
        teamMembers[memberIndex] = memberData;
        
        // Update tasks if name changed
        if (oldName && oldName !== memberData.name) {
            tasks.forEach(task => {
                if (task.assignedTo === oldName) {
                    task.assignedTo = memberData.name;
                }
            });
        }
    }
    
    saveData();
    closeModal('team-modal');
    renderTeam();
    renderDashboard();
    renderGantt();
});

function deleteTeamMember(index) {
    const member = teamMembers[index];
    const assignedTasks = tasks.filter(t => t.assignedTo === member.name).length;
    
    let message = `Are you sure you want to remove ${member.name}?`;
    if (assignedTasks > 0) {
        message += `\n\nWarning: This member has ${assignedTasks} task(s) assigned.`;
    }
    
    if (confirm(message)) {
        teamMembers.splice(index, 1);
        saveData();
        renderTeam();
        renderDashboard();
    }
}

// ============================================
// VALIDATION
// ============================================

function validateProject() {
    const issues = [];
    
    // Check tasks
    tasks.forEach((task, index) => {
        // Check hours > 16 per task
        if (task.estHours > 16) {
            issues.push(`Task "${task.name}" exceeds 16 hours (${task.estHours} hrs)`);
        }
        
        // Check no assignment
        if (!task.assignedTo) {
            issues.push(`Task "${task.name}" has no assignment`);
        }
        
        // Check invalid date range
        if (task.startDate && task.endDate) {
            const start = parseDate(task.startDate);
            const end = parseDate(task.endDate);
            if (end < start) {
                issues.push(`Task "${task.name}" has end date before start date`);
            }
        }
        
        // Check missing dates
        if (!task.startDate || !task.endDate) {
            issues.push(`Task "${task.name}" is missing dates`);
        }
    });
    
    // Check team over target
    teamMembers.forEach(member => {
        const assignedHours = getAssignedHours(member.name);
        if (assignedHours > member.targetHours) {
            issues.push(`${member.name} is over target hours (${assignedHours}/${member.targetHours} hrs)`);
        }
    });
    
    // Display results
    const resultsEl = document.getElementById('validation-results');
    
    if (issues.length === 0) {
        resultsEl.innerHTML = `
            <div class="validation-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
                <h3>All Validations Passed!</h3>
                <p>Your project configuration looks good.</p>
            </div>
        `;
    } else {
        resultsEl.innerHTML = `
            <div class="validation-issues">
                ${issues.map(issue => `
                    <div class="validation-issue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>${issue}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    openModal('validation-modal');
}

// ============================================
// EXPORT
// ============================================

function exportToCSV() {
    const headers = ['ID', 'Task Name', 'Assigned To', 'Role', 'Start Date', 'End Date', 'Days', 'Est Hours', 'Actual Hours', 'Remaining', '% Complete', 'Status', 'Priority'];
    
    const rows = tasks.map(task => {
        const days = task.startDate && task.endDate ? daysBetween(task.startDate, task.endDate) : '';
        const remaining = (task.estHours || 0) - (task.actualHours || 0);
        const percentComplete = task.estHours > 0 ? Math.round((task.actualHours / task.estHours) * 100) : 0;
        const role = getRoleByMember(task.assignedTo);
        
        return [
            task.id,
            `"${task.name}"`,
            `"${task.assignedTo}"`,
            role,
            task.startDate,
            task.endDate,
            days,
            task.estHours,
            task.actualHours,
            remaining,
            `${percentComplete}%`,
            task.status,
            task.priority
        ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoopAutomation_GanttChart_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    renderDashboard();
    renderGantt();
    renderTeam();
}

// Run on load
document.addEventListener('DOMContentLoaded', init);
