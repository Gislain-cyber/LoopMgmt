/**
 * Loop Automation - Project Management Application
 * Hierarchical Gantt Chart with Phase/Task Drill-down
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

// Project phases with their tasks
const defaultPhases = [
    {
        id: 1,
        name: "Project Initiation",
        description: "Project kickoff, planning and requirements gathering",
        startDate: "2026-02-03",
        endDate: "2026-02-07",
        color: "#7c3aed",
        priority: "High",
        tasks: [
            { id: 101, name: "Project Kickoff Meeting", assignedTo: "Bander Bakalka", startDate: "2026-02-03", endDate: "2026-02-03", estHours: 4, actualHours: 4, status: "Complete", priority: "High", notes: "Initial team meeting" },
            { id: 102, name: "Stakeholder Interviews", assignedTo: "Bander Bakalka", startDate: "2026-02-03", endDate: "2026-02-04", estHours: 8, actualHours: 6, status: "Complete", priority: "High", notes: "" },
            { id: 103, name: "Requirements Documentation", assignedTo: "Jon Klomfass", startDate: "2026-02-04", endDate: "2026-02-07", estHours: 16, actualHours: 12, status: "In Progress", priority: "High", notes: "" },
            { id: 104, name: "Project Charter", assignedTo: "Bander Bakalka", startDate: "2026-02-05", endDate: "2026-02-07", estHours: 8, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" }
        ]
    },
    {
        id: 2,
        name: "System Design",
        description: "Architecture design and technical specifications",
        startDate: "2026-02-08",
        endDate: "2026-02-14",
        color: "#00d4aa",
        priority: "High",
        tasks: [
            { id: 201, name: "Architecture Design", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-02-08", endDate: "2026-02-10", estHours: 16, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 202, name: "Database Schema Design", assignedTo: "Jon Klomfass", startDate: "2026-02-10", endDate: "2026-02-12", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 203, name: "API Specification", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-02-11", endDate: "2026-02-13", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 204, name: "UI/UX Wireframes", assignedTo: "Luke Kivell", startDate: "2026-02-08", endDate: "2026-02-12", estHours: 20, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" },
            { id: 205, name: "Design Review", assignedTo: "Jon Klomfass", startDate: "2026-02-13", endDate: "2026-02-14", estHours: 8, actualHours: 0, status: "Not Started", priority: "High", notes: "" }
        ]
    },
    {
        id: 3,
        name: "Development Phase 1",
        description: "Core functionality and backend development",
        startDate: "2026-02-15",
        endDate: "2026-02-28",
        color: "#f59e0b",
        priority: "High",
        tasks: [
            { id: 301, name: "Backend API Development", assignedTo: "Cirex Peroche", startDate: "2026-02-15", endDate: "2026-02-21", estHours: 32, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 302, name: "Database Implementation", assignedTo: "Davis Oliver", startDate: "2026-02-15", endDate: "2026-02-19", estHours: 24, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 303, name: "Authentication Module", assignedTo: "Josh Kavanagh", startDate: "2026-02-17", endDate: "2026-02-21", estHours: 20, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 304, name: "Core Business Logic", assignedTo: "Lucas Pasia", startDate: "2026-02-20", endDate: "2026-02-26", estHours: 28, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 305, name: "Unit Tests - Backend", assignedTo: "Anmol Singh Saini", startDate: "2026-02-22", endDate: "2026-02-28", estHours: 24, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" }
        ]
    },
    {
        id: 4,
        name: "Development Phase 2",
        description: "Frontend development and integration",
        startDate: "2026-02-22",
        endDate: "2026-03-07",
        color: "#ec407a",
        priority: "High",
        tasks: [
            { id: 401, name: "Frontend Framework Setup", assignedTo: "Sebastian Chandler", startDate: "2026-02-22", endDate: "2026-02-24", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 402, name: "UI Component Library", assignedTo: "Anton Makaranka", startDate: "2026-02-24", endDate: "2026-02-28", estHours: 24, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" },
            { id: 403, name: "Dashboard Implementation", assignedTo: "Blake Alexander", startDate: "2026-02-26", endDate: "2026-03-03", estHours: 28, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 404, name: "User Management UI", assignedTo: "Joel Reyes", startDate: "2026-02-28", endDate: "2026-03-04", estHours: 20, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 405, name: "API Integration", assignedTo: "Ren Falkenrath", startDate: "2026-03-01", endDate: "2026-03-05", estHours: 20, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 406, name: "Frontend Testing", assignedTo: "Sebastian Chandler", startDate: "2026-03-04", endDate: "2026-03-07", estHours: 16, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" }
        ]
    },
    {
        id: 5,
        name: "Testing & QA",
        description: "Quality assurance and bug fixing",
        startDate: "2026-03-08",
        endDate: "2026-03-14",
        color: "#17a2b8",
        priority: "High",
        tasks: [
            { id: 501, name: "Integration Testing", assignedTo: "Jon Klomfass", startDate: "2026-03-08", endDate: "2026-03-10", estHours: 16, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 502, name: "Performance Testing", assignedTo: "Cirex Peroche", startDate: "2026-03-09", endDate: "2026-03-11", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 503, name: "Security Audit", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-03-10", endDate: "2026-03-12", estHours: 16, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 504, name: "Bug Fixes", assignedTo: "Davis Oliver", startDate: "2026-03-11", endDate: "2026-03-14", estHours: 20, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 505, name: "User Acceptance Testing", assignedTo: "Bander Bakalka", startDate: "2026-03-12", endDate: "2026-03-14", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" }
        ]
    },
    {
        id: 6,
        name: "Deployment & Launch",
        description: "Production deployment and go-live",
        startDate: "2026-03-15",
        endDate: "2026-03-20",
        color: "#28a745",
        priority: "Critical",
        tasks: [
            { id: 601, name: "Production Environment Setup", assignedTo: "Josh Kavanagh", startDate: "2026-03-15", endDate: "2026-03-16", estHours: 12, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 602, name: "Data Migration", assignedTo: "Lucas Pasia", startDate: "2026-03-16", endDate: "2026-03-17", estHours: 8, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 603, name: "Documentation", assignedTo: "Anton Makaranka", startDate: "2026-03-15", endDate: "2026-03-18", estHours: 16, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" },
            { id: 604, name: "Training Materials", assignedTo: "Blake Alexander", startDate: "2026-03-16", endDate: "2026-03-18", estHours: 12, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" },
            { id: 605, name: "Go-Live Deployment", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-03-19", endDate: "2026-03-19", estHours: 8, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 606, name: "Post-Launch Monitoring", assignedTo: "Jon Klomfass", startDate: "2026-03-19", endDate: "2026-03-20", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 607, name: "Project Closure", assignedTo: "Bander Bakalka", startDate: "2026-03-20", endDate: "2026-03-20", estHours: 4, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" }
        ]
    }
];

// Load from localStorage or use defaults
let teamMembers = JSON.parse(localStorage.getItem('loopTeamMembers')) || [...defaultTeamMembers];
let phases = JSON.parse(localStorage.getItem('loopPhases')) || JSON.parse(JSON.stringify(defaultPhases));

// Current state
let currentPhaseId = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function saveData() {
    localStorage.setItem('loopTeamMembers', JSON.stringify(teamMembers));
    localStorage.setItem('loopPhases', JSON.stringify(phases));
}

function parseDate(dateStr) {
    return new Date(dateStr + 'T00:00:00');
}

function formatDateDisplay(dateStr) {
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysBetween(start, end) {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
}

function getTeamMemberByName(name) {
    return teamMembers.find(m => m.name === name);
}

function getMemberColor(memberName) {
    const member = getTeamMemberByName(memberName);
    return member ? member.color : '#3498db';
}

function getMemberRole(memberName) {
    const member = getTeamMemberByName(memberName);
    return member ? member.role : '';
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAllTasks() {
    return phases.flatMap(p => p.tasks);
}

function getAssignedHours(memberName) {
    return getAllTasks()
        .filter(t => t.assignedTo === memberName)
        .reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
}

function getPhaseProgress(phase) {
    if (!phase.tasks.length) return 0;
    const totalEst = phase.tasks.reduce((sum, t) => sum + (t.estHours || 0), 0);
    const totalActual = phase.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    return totalEst > 0 ? Math.round((totalActual / totalEst) * 100) : 0;
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

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const view = item.dataset.view;
        switchToView(view);
    });
});

function switchToView(view) {
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    // Refresh view
    if (view === 'dashboard') renderDashboard();
    if (view === 'gantt') renderGanttOverview();
    if (view === 'team') renderTeam();
}

function backToOverview() {
    currentPhaseId = null;
    switchToView('gantt');
}

// ============================================
// DASHBOARD RENDERING
// ============================================

function renderDashboard() {
    const allTasks = getAllTasks();
    
    // Stats
    document.getElementById('total-phases').textContent = phases.length;
    document.getElementById('total-tasks').textContent = allTasks.length;
    document.getElementById('completed-tasks').textContent = allTasks.filter(t => t.status === 'Complete').length;
    document.getElementById('in-progress-tasks').textContent = allTasks.filter(t => t.status === 'In Progress').length;
    
    // Hours
    const totalEstHours = allTasks.reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
    const totalActualHours = allTasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0);
    const remainingHours = totalEstHours - totalActualHours;
    
    document.getElementById('total-est-hours').textContent = totalEstHours.toFixed(0);
    document.getElementById('total-actual-hours').textContent = totalActualHours.toFixed(0);
    document.getElementById('remaining-hours').textContent = remainingHours.toFixed(0);
    
    const progressPercent = totalEstHours > 0 ? (totalActualHours / totalEstHours) * 100 : 0;
    document.getElementById('hours-progress').style.width = `${Math.min(progressPercent, 100)}%`;
    
    // Team workload
    const workloadTbody = document.getElementById('workload-tbody');
    workloadTbody.innerHTML = teamMembers.map(member => {
        const assignedHours = getAssignedHours(member.name);
        const variance = member.targetHours - assignedHours;
        const loadPercent = member.targetHours > 0 ? (assignedHours / member.targetHours) * 100 : 0;
        
        let loadClass = 'under';
        if (loadPercent >= 80 && loadPercent <= 100) loadClass = 'optimal';
        if (loadPercent > 100) loadClass = 'over';
        
        return `
            <tr>
                <td><span class="member-color" style="background: ${member.color}"></span>${member.name}</td>
                <td>${member.role}</td>
                <td>${member.targetHours}</td>
                <td>${assignedHours}</td>
                <td class="${variance >= 0 ? 'variance-positive' : 'variance-negative'}">${variance >= 0 ? '+' : ''}${variance}</td>
                <td><div class="load-bar-container"><div class="load-bar ${loadClass}" style="width: ${Math.min(loadPercent, 100)}%"></div></div></td>
            </tr>
        `;
    }).join('');
}

// ============================================
// GANTT OVERVIEW (PHASES)
// ============================================

function renderGanttOverview() {
    const container = document.getElementById('gantt-phases');
    
    // Calculate project timeline
    const projectStart = phases.reduce((min, p) => {
        const start = parseDate(p.startDate);
        return start < min ? start : min;
    }, parseDate(phases[0].startDate));
    
    const projectEnd = phases.reduce((max, p) => {
        const end = parseDate(p.endDate);
        return end > max ? end : max;
    }, parseDate(phases[0].endDate));
    
    const totalDays = daysBetween(projectStart.toISOString().split('T')[0], projectEnd.toISOString().split('T')[0]);
    
    container.innerHTML = phases.map(phase => {
        const progress = getPhaseProgress(phase);
        const taskCount = phase.tasks.length;
        const completedTasks = phase.tasks.filter(t => t.status === 'Complete').length;
        const totalHours = phase.tasks.reduce((sum, t) => sum + (t.estHours || 0), 0);
        
        // Get unique team members for this phase
        const phaseMembers = [...new Set(phase.tasks.map(t => t.assignedTo))];
        
        // Calculate bar position
        const phaseStart = parseDate(phase.startDate);
        const startOffset = daysBetween(projectStart.toISOString().split('T')[0], phase.startDate) - 1;
        const duration = daysBetween(phase.startDate, phase.endDate);
        const leftPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;
        
        return `
            <div class="phase-card" onclick="openPhaseDetail(${phase.id})" style="--phase-color: ${phase.color}">
                <div class="phase-card-header">
                    <div class="phase-info">
                        <div class="phase-name">
                            <span style="color: ${phase.color}">●</span>
                            ${phase.name}
                            <span class="priority-badge ${getPriorityClass(phase.priority)}">${phase.priority}</span>
                        </div>
                        <div class="phase-dates">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${formatDateDisplay(phase.startDate)} - ${formatDateDisplay(phase.endDate)}
                            <span style="margin-left: 8px; color: var(--text-muted);">(${duration} days)</span>
                        </div>
                    </div>
                    <div class="phase-meta">
                        <div class="phase-stat">
                            <span class="phase-stat-value">${completedTasks}/${taskCount}</span>
                            <span class="phase-stat-label">Tasks</span>
                        </div>
                        <div class="phase-stat">
                            <span class="phase-stat-value">${totalHours}h</span>
                            <span class="phase-stat-label">Hours</span>
                        </div>
                        <div class="phase-stat">
                            <span class="phase-stat-value">${progress}%</span>
                            <span class="phase-stat-label">Done</span>
                        </div>
                        <div class="phase-actions" onclick="event.stopPropagation()">
                            <button class="btn-icon" onclick="editPhase(${phase.id})" title="Edit Phase">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </button>
                            <button class="btn-icon delete" onclick="deletePhase(${phase.id})" title="Delete Phase">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="phase-timeline-bar">
                    <div class="timeline-bar-container">
                        <div class="timeline-bar-fill" style="left: ${leftPercent}%; width: ${widthPercent}%; background: ${phase.color};">
                            <div class="timeline-bar-progress" style="width: ${progress}%"></div>
                            ${phase.name}
                        </div>
                    </div>
                </div>
                <div class="phase-team-preview">
                    ${phaseMembers.slice(0, 6).map(name => {
                        const color = getMemberColor(name);
                        return `<div class="team-avatar-small" style="background: ${color}" title="${name}">${getInitials(name)}</div>`;
                    }).join('')}
                    ${phaseMembers.length > 6 ? `<span class="team-count-badge">+${phaseMembers.length - 6} more</span>` : ''}
                    <span class="team-count-badge">${phaseMembers.length} team members</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// PHASE DETAIL VIEW
// ============================================

function openPhaseDetail(phaseId) {
    currentPhaseId = phaseId;
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    // Update header
    document.getElementById('phase-detail-title').textContent = phase.name;
    document.getElementById('phase-detail-subtitle').textContent = phase.description || 'Phase details and task breakdown';
    
    // Hide other views, show phase detail
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('phase-detail-view').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    renderPhaseDetail(phase);
}

function renderPhaseDetail(phase) {
    // Summary cards
    const totalHours = phase.tasks.reduce((sum, t) => sum + (t.estHours || 0), 0);
    const actualHours = phase.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const completedTasks = phase.tasks.filter(t => t.status === 'Complete').length;
    const progress = getPhaseProgress(phase);
    const uniqueMembers = [...new Set(phase.tasks.map(t => t.assignedTo))].length;
    
    document.getElementById('phase-summary').innerHTML = `
        <div class="summary-card">
            <div class="summary-card-value">${phase.tasks.length}</div>
            <div class="summary-card-label">Total Tasks</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-value">${completedTasks}</div>
            <div class="summary-card-label">Completed</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-value">${totalHours}h</div>
            <div class="summary-card-label">Est. Hours</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-value">${actualHours}h</div>
            <div class="summary-card-label">Actual Hours</div>
        </div>
        <div class="summary-card">
            <div class="summary-card-value">${uniqueMembers}</div>
            <div class="summary-card-label">Team Members</div>
        </div>
    `;
    
    // Tasks table
    document.getElementById('phase-tasks-tbody').innerHTML = phase.tasks.map((task, idx) => `
        <tr>
            <td><span style="border-left: 3px solid ${getMemberColor(task.assignedTo)}; padding-left: 10px;">${task.name}</span></td>
            <td>${task.assignedTo}</td>
            <td>${getMemberRole(task.assignedTo)}</td>
            <td>${formatDateDisplay(task.startDate)}</td>
            <td>${formatDateDisplay(task.endDate)}</td>
            <td>${task.estHours}h</td>
            <td>${task.actualHours}h</td>
            <td><span class="status-badge ${getStatusClass(task.status)}">${task.status}</span></td>
            <td><span class="priority-badge ${getPriorityClass(task.priority)}">${task.priority}</span></td>
            <td>
                <button class="btn-icon" onclick="editTask(${phase.id}, ${task.id})" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="deleteTask(${phase.id}, ${task.id})" title="Delete">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Task timeline
    renderPhaseTimeline(phase);
    
    // Team assignments
    renderPhaseTeam(phase);
}

function renderPhaseTimeline(phase) {
    if (!phase.tasks.length) {
        document.getElementById('phase-timeline').innerHTML = '<p style="color: var(--text-muted);">No tasks in this phase</p>';
        return;
    }
    
    const phaseStart = parseDate(phase.startDate);
    const phaseEnd = parseDate(phase.endDate);
    const totalDays = daysBetween(phase.startDate, phase.endDate);
    
    document.getElementById('phase-timeline').innerHTML = phase.tasks.map(task => {
        const taskStart = parseDate(task.startDate);
        const startOffset = Math.max(0, daysBetween(phase.startDate, task.startDate) - 1);
        const duration = daysBetween(task.startDate, task.endDate);
        const leftPercent = (startOffset / totalDays) * 100;
        const widthPercent = (duration / totalDays) * 100;
        const color = getMemberColor(task.assignedTo);
        
        return `
            <div class="task-timeline-row">
                <div class="task-timeline-label" title="${task.name}">${task.name}</div>
                <div class="task-timeline-bar-container">
                    <div class="task-timeline-bar" style="left: ${leftPercent}%; width: ${widthPercent}%; background: ${color};">
                        ${task.estHours}h
                    </div>
                </div>
                <div class="task-timeline-assignee">
                    <div class="team-avatar-small" style="background: ${color}; width: 24px; height: 24px; font-size: 0.6rem;">${getInitials(task.assignedTo)}</div>
                    ${task.assignedTo.split(' ')[0]}
                </div>
            </div>
        `;
    }).join('');
}

function renderPhaseTeam(phase) {
    // Group tasks by team member
    const memberTasks = {};
    phase.tasks.forEach(task => {
        if (!memberTasks[task.assignedTo]) {
            memberTasks[task.assignedTo] = { tasks: [], hours: 0 };
        }
        memberTasks[task.assignedTo].tasks.push(task);
        memberTasks[task.assignedTo].hours += task.estHours || 0;
    });
    
    document.getElementById('phase-team-grid').innerHTML = Object.entries(memberTasks).map(([name, data]) => {
        const member = getTeamMemberByName(name);
        const color = member ? member.color : '#3498db';
        const role = member ? member.role : '';
        
        return `
            <div class="phase-team-card">
                <div class="phase-team-avatar" style="background: ${color}">${getInitials(name)}</div>
                <div class="phase-team-info">
                    <h4>${name}</h4>
                    <p>${role} • ${data.tasks.length} task${data.tasks.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="phase-team-hours">
                    <span>${data.hours}h</span>
                    <small>assigned</small>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// TEAM VIEW
// ============================================

function renderTeam() {
    const grid = document.getElementById('team-grid');
    
    grid.innerHTML = teamMembers.map((member, index) => {
        const assignedHours = getAssignedHours(member.name);
        const taskCount = getAllTasks().filter(t => t.assignedTo === member.name).length;
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

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ============================================
// PHASE MANAGEMENT
// ============================================

function addNewPhase() {
    document.getElementById('phase-modal-title').textContent = 'Add Phase';
    document.getElementById('phase-form').reset();
    document.getElementById('phase-id').value = '';
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('phase-start').value = today;
    document.getElementById('phase-end').value = today;
    document.getElementById('phase-color').value = '#00d4aa';
    
    openModal('phase-modal');
}

function editPhase(phaseId) {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    document.getElementById('phase-modal-title').textContent = 'Edit Phase';
    document.getElementById('phase-id').value = phase.id;
    document.getElementById('phase-name').value = phase.name;
    document.getElementById('phase-description').value = phase.description || '';
    document.getElementById('phase-start').value = phase.startDate;
    document.getElementById('phase-end').value = phase.endDate;
    document.getElementById('phase-color').value = phase.color;
    document.getElementById('phase-priority').value = phase.priority;
    
    openModal('phase-modal');
}

document.getElementById('phase-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const phaseId = document.getElementById('phase-id').value;
    const phaseData = {
        name: document.getElementById('phase-name').value,
        description: document.getElementById('phase-description').value,
        startDate: document.getElementById('phase-start').value,
        endDate: document.getElementById('phase-end').value,
        color: document.getElementById('phase-color').value,
        priority: document.getElementById('phase-priority').value
    };
    
    if (phaseId) {
        // Update existing
        const idx = phases.findIndex(p => p.id === parseInt(phaseId));
        if (idx !== -1) {
            phases[idx] = { ...phases[idx], ...phaseData };
        }
    } else {
        // Create new
        const maxId = phases.reduce((max, p) => Math.max(max, p.id), 0);
        phases.push({ id: maxId + 1, ...phaseData, tasks: [] });
    }
    
    saveData();
    closeModal('phase-modal');
    renderGanttOverview();
    renderDashboard();
});

function deletePhase(phaseId) {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    if (confirm(`Delete "${phase.name}" and all its ${phase.tasks.length} tasks?`)) {
        phases = phases.filter(p => p.id !== phaseId);
        saveData();
        renderGanttOverview();
        renderDashboard();
    }
}

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
    if (!currentPhaseId) return;
    
    const phase = phases.find(p => p.id === currentPhaseId);
    if (!phase) return;
    
    document.getElementById('task-modal-title').textContent = 'Add Task';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    document.getElementById('task-phase-id').value = currentPhaseId;
    document.getElementById('task-start').value = phase.startDate;
    document.getElementById('task-end').value = phase.endDate;
    
    populateAssignedDropdown();
    openModal('task-modal');
}

function editTask(phaseId, taskId) {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('task-modal-title').textContent = 'Edit Task';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-phase-id').value = phaseId;
    document.getElementById('task-name').value = task.name;
    document.getElementById('task-start').value = task.startDate;
    document.getElementById('task-end').value = task.endDate;
    document.getElementById('task-est-hours').value = task.estHours;
    document.getElementById('task-actual-hours').value = task.actualHours;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-notes').value = task.notes || '';
    
    populateAssignedDropdown();
    document.getElementById('task-assigned').value = task.assignedTo;
    
    openModal('task-modal');
}

document.getElementById('task-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const taskId = document.getElementById('task-id').value;
    const phaseId = parseInt(document.getElementById('task-phase-id').value);
    
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const taskData = {
        name: document.getElementById('task-name').value,
        assignedTo: document.getElementById('task-assigned').value,
        startDate: document.getElementById('task-start').value,
        endDate: document.getElementById('task-end').value,
        estHours: parseFloat(document.getElementById('task-est-hours').value) || 0,
        actualHours: parseFloat(document.getElementById('task-actual-hours').value) || 0,
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        notes: document.getElementById('task-notes').value
    };
    
    if (taskId) {
        // Update existing
        const idx = phase.tasks.findIndex(t => t.id === parseInt(taskId));
        if (idx !== -1) {
            phase.tasks[idx] = { ...phase.tasks[idx], ...taskData };
        }
    } else {
        // Create new
        const maxId = phase.tasks.reduce((max, t) => Math.max(max, t.id), phaseId * 100);
        phase.tasks.push({ id: maxId + 1, ...taskData });
    }
    
    saveData();
    closeModal('task-modal');
    renderPhaseDetail(phase);
    renderDashboard();
});

function deleteTask(phaseId, taskId) {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const task = phase.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (confirm(`Delete task "${task.name}"?`)) {
        phase.tasks = phase.tasks.filter(t => t.id !== taskId);
        saveData();
        renderPhaseDetail(phase);
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
        teamMembers.push(memberData);
    } else {
        teamMembers[memberIndex] = memberData;
        
        // Update tasks if name changed
        if (oldName && oldName !== memberData.name) {
            phases.forEach(phase => {
                phase.tasks.forEach(task => {
                    if (task.assignedTo === oldName) {
                        task.assignedTo = memberData.name;
                    }
                });
            });
        }
    }
    
    saveData();
    closeModal('team-modal');
    renderTeam();
    renderDashboard();
});

function deleteTeamMember(index) {
    const member = teamMembers[index];
    const assignedTasks = getAllTasks().filter(t => t.assignedTo === member.name).length;
    
    let message = `Remove ${member.name}?`;
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
    const allTasks = getAllTasks();
    
    // Check tasks
    allTasks.forEach(task => {
        if (task.estHours > 16) {
            issues.push(`Task "${task.name}" exceeds 16 hours (${task.estHours} hrs)`);
        }
        if (!task.assignedTo) {
            issues.push(`Task "${task.name}" has no assignment`);
        }
        if (task.startDate && task.endDate && parseDate(task.endDate) < parseDate(task.startDate)) {
            issues.push(`Task "${task.name}" has end date before start date`);
        }
    });
    
    // Check phases
    phases.forEach(phase => {
        if (phase.tasks.length === 0) {
            issues.push(`Phase "${phase.name}" has no tasks`);
        }
    });
    
    // Check team workload
    teamMembers.forEach(member => {
        const assignedHours = getAssignedHours(member.name);
        if (assignedHours > member.targetHours) {
            issues.push(`${member.name} is over target (${assignedHours}/${member.targetHours} hrs)`);
        }
    });
    
    const resultsEl = document.getElementById('validation-results');
    
    if (issues.length === 0) {
        resultsEl.innerHTML = `
            <div class="validation-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>
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
                            <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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
// EXPORT FUNCTIONS
// ============================================

function exportToPDF() {
    const element = document.getElementById('gantt-export-area');
    const opt = {
        margin: 10,
        filename: `LoopAutomation_ProjectOverview_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0d1117' },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
}

function exportPhaseToPDF() {
    const element = document.getElementById('phase-export-area');
    const phase = phases.find(p => p.id === currentPhaseId);
    const phaseName = phase ? phase.name.replace(/\s+/g, '_') : 'Phase';
    
    const opt = {
        margin: 10,
        filename: `LoopAutomation_${phaseName}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0d1117' },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save();
}

function exportToCSV() {
    let csv = 'Phase,Task,Assigned To,Role,Start Date,End Date,Est Hours,Actual Hours,Status,Priority\n';
    
    phases.forEach(phase => {
        phase.tasks.forEach(task => {
            csv += `"${phase.name}","${task.name}","${task.assignedTo}","${getMemberRole(task.assignedTo)}","${task.startDate}","${task.endDate}",${task.estHours},${task.actualHours},"${task.status}","${task.priority}"\n`;
        });
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LoopAutomation_Tasks_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    renderDashboard();
    renderGanttOverview();
    renderTeam();
}

document.addEventListener('DOMContentLoaded', init);
