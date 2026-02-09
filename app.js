/**
 * Loop Automation - Project Management Application
 * Full Inline Editing for Stations and Tasks
 * Firebase Real-Time Database Integration
 */

// ============================================
// FIREBASE SETUP
// ============================================

let app = null;
let db = null;
let auth = null;
let firebaseEnabled = false;

// Loading state
let isLoading = true;
let isSyncing = false;

// Admin state
let isAdmin = false;
let currentUser = null;

// Expanded stations state (for showing subtasks)
let expandedStations = new Set();

// Column visibility state
let visibleColumnGroup = 'core';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyD7DzKLTAtncmRNhcgADGWOFQvj9F1Aw",
    authDomain: "loopmgnt.firebaseapp.com",
    projectId: "loopmgnt",
    storageBucket: "loopmgnt.firebasestorage.app",
    messagingSenderId: "876125442433",
    appId: "1:876125442433:web:1a990fb0d186942a1a1880"
};

// Initialize Firebase asynchronously
async function initFirebaseSDK() {
    try {
        console.log('Loading Firebase SDK...');
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js");
        const { getFirestore, doc, setDoc, onSnapshot, getDoc } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
        const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js");
        
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        firebaseEnabled = true;
        
        // Store Firebase functions globally
        window.firebaseDoc = doc;
        window.firebaseSetDoc = setDoc;
        window.firebaseOnSnapshot = onSnapshot;
        window.firebaseGetDoc = getDoc;
        window.firebaseSignIn = signInWithEmailAndPassword;
        window.firebaseSignOut = signOut;
        window.firebaseOnAuthStateChanged = onAuthStateChanged;
        
        console.log('Firebase SDK loaded successfully');
        return true;
    } catch (error) {
        console.error('Failed to load Firebase SDK:', error);
        firebaseEnabled = false;
        return false;
    }
}

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

// Stations with their tasks
const defaultStations = [
    {
        id: 1,
        name: "Station 1 - Material Intake",
        description: "Raw material receiving and quality control",
        startDate: "2026-02-03",
        endDate: "2026-02-10",
        color: "#7c3aed",
        priority: "High",
        tasks: [
            { id: 101, name: "Material Inspection Setup", assignedTo: "Bander Bakalka", startDate: "2026-02-03", endDate: "2026-02-04", estHours: 8, actualHours: 6, status: "Complete", priority: "High", notes: "Initial setup complete" },
            { id: 102, name: "Conveyor System Integration", assignedTo: "Cirex Peroche", startDate: "2026-02-03", endDate: "2026-02-06", estHours: 16, actualHours: 12, status: "In Progress", priority: "High", notes: "" },
            { id: 103, name: "Barcode Scanner Configuration", assignedTo: "Josh Kavanagh", startDate: "2026-02-05", endDate: "2026-02-07", estHours: 12, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" },
            { id: 104, name: "PLC Programming - Intake", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-02-06", endDate: "2026-02-09", estHours: 14, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 105, name: "Sensor Calibration", assignedTo: "Davis Oliver", startDate: "2026-02-08", endDate: "2026-02-10", estHours: 10, actualHours: 0, status: "Not Started", priority: "High", notes: "" }
        ]
    },
    {
        id: 2,
        name: "Station 2 - Robotic Assembly",
        description: "Automated assembly and component placement",
        startDate: "2026-02-08",
        endDate: "2026-02-18",
        color: "#00d4aa",
        priority: "Critical",
        tasks: [
            { id: 201, name: "Robot Arm Programming", assignedTo: "Jon Klomfass", startDate: "2026-02-08", endDate: "2026-02-12", estHours: 20, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 202, name: "Vision System Setup", assignedTo: "Luke Kivell", startDate: "2026-02-09", endDate: "2026-02-13", estHours: 16, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 203, name: "Gripper Mechanism Testing", assignedTo: "Lucas Pasia", startDate: "2026-02-11", endDate: "2026-02-14", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 204, name: "Safety Interlock Configuration", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-02-13", endDate: "2026-02-16", estHours: 14, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" }
        ]
    },
    {
        id: 3,
        name: "Station 3 - Welding & Joining",
        description: "Automated welding and fastening operations",
        startDate: "2026-02-15",
        endDate: "2026-02-25",
        color: "#f59e0b",
        priority: "High",
        tasks: [
            { id: 301, name: "Welding Robot Calibration", assignedTo: "Sebastian Chandler", startDate: "2026-02-15", endDate: "2026-02-18", estHours: 16, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 302, name: "Welding Parameter Tuning", assignedTo: "Anton Makaranka", startDate: "2026-02-17", endDate: "2026-02-20", estHours: 14, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 303, name: "Fume Extraction System", assignedTo: "Blake Alexander", startDate: "2026-02-18", endDate: "2026-02-21", estHours: 10, actualHours: 0, status: "Not Started", priority: "High", notes: "" }
        ]
    },
    {
        id: 4,
        name: "Station 4 - Quality Control",
        description: "Automated inspection and defect detection",
        startDate: "2026-02-20",
        endDate: "2026-03-03",
        color: "#ec407a",
        priority: "Critical",
        tasks: [
            { id: 401, name: "3D Scanner Integration", assignedTo: "Jon Klomfass", startDate: "2026-02-20", endDate: "2026-02-24", estHours: 18, actualHours: 0, status: "Not Started", priority: "Critical", notes: "" },
            { id: 402, name: "AI Defect Detection Model", assignedTo: "Gislain Hotcho Nkenga", startDate: "2026-02-22", endDate: "2026-02-27", estHours: 20, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 403, name: "Measurement Probe Setup", assignedTo: "Cirex Peroche", startDate: "2026-02-24", endDate: "2026-02-28", estHours: 14, actualHours: 0, status: "Not Started", priority: "High", notes: "" }
        ]
    },
    {
        id: 5,
        name: "Station 5 - Packaging",
        description: "Automated packaging and labeling",
        startDate: "2026-02-28",
        endDate: "2026-03-10",
        color: "#17a2b8",
        priority: "High",
        tasks: [
            { id: 501, name: "Box Former Configuration", assignedTo: "Lucas Pasia", startDate: "2026-02-28", endDate: "2026-03-03", estHours: 12, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 502, name: "Product Placement Robot", assignedTo: "Sebastian Chandler", startDate: "2026-03-01", endDate: "2026-03-05", estHours: 16, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 503, name: "Label Printer Integration", assignedTo: "Anton Makaranka", startDate: "2026-03-03", endDate: "2026-03-06", estHours: 10, actualHours: 0, status: "Not Started", priority: "Medium", notes: "" }
        ]
    },
    {
        id: 6,
        name: "Station 6 - Shipping & Distribution",
        description: "Sorting, palletizing and warehouse integration",
        startDate: "2026-03-08",
        endDate: "2026-03-18",
        color: "#28a745",
        priority: "High",
        tasks: [
            { id: 601, name: "Palletizing Robot Setup", assignedTo: "Ren Falkenrath", startDate: "2026-03-08", endDate: "2026-03-11", estHours: 16, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 602, name: "Sorting System Programming", assignedTo: "Anmol Singh Saini", startDate: "2026-03-09", endDate: "2026-03-13", estHours: 18, actualHours: 0, status: "Not Started", priority: "High", notes: "" },
            { id: 603, name: "WMS Integration", assignedTo: "Bander Bakalka", startDate: "2026-03-11", endDate: "2026-03-15", estHours: 20, actualHours: 0, status: "Not Started", priority: "Critical", notes: "Warehouse Management System" }
        ]
    }
];

// Data will be loaded from Firestore
let teamMembers = [];
let stations = [];

// Current state
let currentStationId = null;
const DAY_WIDTH = 30;
const TIMELINE_DAYS = 60;
let zoomLevel = 100; // percentage

// ============================================
// FIREBASE DATA MANAGEMENT
// ============================================

async function initializeFirebase() {
    try {
        showLoadingState();
        
        // Try to initialize Firebase SDK
        const firebaseLoaded = await initFirebaseSDK();
        
        if (!firebaseLoaded) {
            throw new Error('Firebase SDK failed to load');
        }
        
        // Set up auth state listener
        window.firebaseOnAuthStateChanged(auth, (user) => {
            currentUser = user;
            isAdmin = !!user;
            updateUIForAuthState();
        });
        
        // Set up real-time listeners
        setupTeamMembersListener();
        setupStationsListener();
        
        // Check if data exists, if not, initialize with defaults
        const teamDoc = await window.firebaseGetDoc(window.firebaseDoc(db, 'projects', 'main-project'));
        if (!teamDoc.exists()) {
            console.log('Initializing project with default data...');
            await saveTeamMembers([...defaultTeamMembers]);
            await saveStations(JSON.parse(JSON.stringify(defaultStations)));
        }
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Using offline mode');
        // Fallback to localStorage
        teamMembers = JSON.parse(localStorage.getItem('loopTeamMembers')) || [...defaultTeamMembers];
        stations = JSON.parse(localStorage.getItem('loopStations')) || JSON.parse(JSON.stringify(defaultStations));
        hideLoadingState();
        renderAllViews();
    }
}

function updateUIForAuthState() {
    const adminBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const adminIndicator = document.getElementById('admin-indicator');
    
    if (isAdmin) {
        adminBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        adminIndicator.style.display = 'flex';
        console.log('Admin mode enabled');
    } else {
        adminBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        adminIndicator.style.display = 'none';
        console.log('Public view mode');
    }
    
    // Re-render current view
    renderAllViews();
}

async function adminLogin() {
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }
    
    if (!firebaseEnabled || !auth) {
        showError('Firebase not available. Try refreshing.');
        return;
    }
    
    try {
        await window.firebaseSignIn(auth, email, password);
        closeModal('admin-login-modal');
        showSuccess('Admin access granted');
        document.getElementById('admin-login-form').reset();
    } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            showError('Invalid email or password');
        } else if (error.code === 'auth/invalid-email') {
            showError('Invalid email format');
        } else {
            showError('Login failed: ' + error.message);
        }
    }
}

async function adminLogout() {
    if (!firebaseEnabled || !auth) {
        isAdmin = false;
        currentUser = null;
        updateUIForAuthState();
        return;
    }
    
    try {
        await window.firebaseSignOut(auth);
        showSuccess('Logged out');
    } catch (error) {
        console.error('Logout error:', error);
        showError('Logout failed');
    }
}

function showAdminLoginModal() {
    openModal('admin-login-modal');
}

function setupTeamMembersListener() {
    if (!firebaseEnabled || !db) return;
    
    const teamDocRef = window.firebaseDoc(db, 'projects', 'main-project');
    
    window.firebaseOnSnapshot(teamDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.teamMembers) {
                teamMembers = data.teamMembers;
                if (!isLoading) {
                    console.log('Team members updated from server');
                    renderAllViews();
                }
            }
        }
        if (isLoading) {
            isLoading = false;
            hideLoadingState();
            renderAllViews();
        }
    }, (error) => {
        console.error('Error listening to team members:', error);
    });
}

function setupStationsListener() {
    if (!firebaseEnabled || !db) return;
    
    const stationsDocRef = window.firebaseDoc(db, 'projects', 'main-project-stations');
    
    window.firebaseOnSnapshot(stationsDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.stations) {
                stations = data.stations;
                if (!isLoading) {
                    console.log('Stations updated from server');
                    renderAllViews();
                }
            }
        }
    }, (error) => {
        console.error('Error listening to stations:', error);
    });
}

async function saveTeamMembers(members) {
    if (isSyncing) return;
    isSyncing = true;
    
    // Always save to localStorage
    localStorage.setItem('loopTeamMembers', JSON.stringify(members));
    
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project'), {
                teamMembers: members,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving team members to Firebase:', error);
        }
    }
    
    isSyncing = false;
}

async function saveStations(stationsData) {
    if (isSyncing) return;
    isSyncing = true;
    
    // Always save to localStorage
    localStorage.setItem('loopStations', JSON.stringify(stationsData));
    
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project-stations'), {
                stations: stationsData,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error saving stations to Firebase:', error);
        }
    }
    
    isSyncing = false;
}

function showLoadingState() {
    const loader = document.createElement('div');
    loader.id = 'firebase-loader';
    loader.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(13, 17, 23, 0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        flex-direction: column;
        gap: 20px;
    `;
    loader.innerHTML = `
        <div style="width: 50px; height: 50px; border: 3px solid #30363d; border-top-color: #00d4aa; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="color: #8b949e; font-size: 1rem;">Connecting to database...</div>
        <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `;
    document.body.appendChild(loader);
}

function hideLoadingState() {
    const loader = document.getElementById('firebase-loader');
    if (loader) loader.remove();
}

function showError(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showSuccess(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #00d4aa;
        color: #0d1117;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        font-weight: 600;
        font-size: 0.9rem;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
}

function renderAllViews() {
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    
    const viewId = activeView.id;
    if (viewId === 'dashboard-view') renderDashboard();
    if (viewId === 'gantt-view') renderGanttView();
    if (viewId === 'team-view') renderTeam();
    if (viewId === 'station-detail-view' && currentStationId) {
        const station = stations.find(s => s.id === currentStationId);
        if (station) {
            renderStationTasks(station);
            renderTaskTimeline(station);
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function saveData() {
    await Promise.all([
        saveTeamMembers(teamMembers),
        saveStations(stations)
    ]);
}

function parseDate(dateStr) {
    if (!dateStr) return new Date();
    return new Date(dateStr + 'T00:00:00');
}

function formatDateISO(dateStr) {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
}

function daysBetween(start, end) {
    if (!start || !end) return 0;
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
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAllTasks() {
    return stations.flatMap(s => s.tasks);
}

function getAssignedHours(memberName) {
    return getAllTasks()
        .filter(t => t.assignedTo === memberName)
        .reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
}

function getStatusClass(status) {
    const map = {
        'Complete': 'status-complete',
        'In Progress': 'status-progress',
        'Not Started': 'status-pending',
        'Delayed': 'status-delayed',
        'On Hold': 'status-hold'
    };
    return map[status] || 'status-pending';
}

function getPriorityClass(priority) {
    const map = {
        'Critical': 'priority-critical',
        'High': 'priority-high',
        'Medium': 'priority-medium',
        'Low': 'priority-low'
    };
    return map[priority] || 'priority-medium';
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchToView(view);
        });
    });
}

function switchToView(view) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');
    
    // Hide/show action buttons based on admin status
    updateViewActions();
    
    if (view === 'dashboard') renderDashboard();
    if (view === 'gantt') renderGanttView();
    if (view === 'team') renderTeam();
}

function updateViewActions() {
    // Hide "Add" buttons and edit actions if not admin
    const actionButtons = document.querySelectorAll('.header-actions .btn-primary, .header-actions .btn-secondary');
    actionButtons.forEach(btn => {
        if (!isAdmin && (btn.textContent.includes('Add') || btn.textContent.includes('Export'))) {
            if (btn.textContent.includes('Add')) {
                btn.style.display = 'none';
            }
        } else {
            btn.style.display = 'flex';
        }
    });
}

function backToGantt() {
    currentStationId = null;
    switchToView('gantt');
}

// ============================================
// DASHBOARD
// ============================================

function renderDashboard() {
    const allTasks = getAllTasks();
    
    document.getElementById('total-phases').textContent = stations.length;
    document.getElementById('total-tasks').textContent = allTasks.length;
    document.getElementById('completed-tasks').textContent = allTasks.filter(t => t.status === 'Complete').length;
    document.getElementById('in-progress-tasks').textContent = allTasks.filter(t => t.status === 'In Progress').length;
    
    const totalEstHours = allTasks.reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
    const totalActualHours = allTasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0);
    const remainingHours = totalEstHours - totalActualHours;
    
    document.getElementById('total-est-hours').textContent = totalEstHours.toFixed(0);
    document.getElementById('total-actual-hours').textContent = totalActualHours.toFixed(0);
    document.getElementById('remaining-hours').textContent = remainingHours.toFixed(0);
    
    const progressPercent = totalEstHours > 0 ? (totalActualHours / totalEstHours) * 100 : 0;
    document.getElementById('hours-progress').style.width = `${Math.min(progressPercent, 100)}%`;
    
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
// GANTT VIEW - STATION OVERVIEW
// ============================================

function renderGanttView() {
    renderStationTable();
    renderGanttTimeline();
    
    // Apply current column visibility state
    toggleColumnGroup(visibleColumnGroup);
}

function toggleStationExpand(stationId, event) {
    if (event) event.stopPropagation();
    
    if (expandedStations.has(stationId)) {
        expandedStations.delete(stationId);
    } else {
        expandedStations.add(stationId);
    }
    
    renderGanttView();
}

function expandAllStations() {
    stations.forEach(s => expandedStations.add(s.id));
    renderGanttView();
}

function collapseAllStations() {
    expandedStations.clear();
    renderGanttView();
}

// Column group toggle for compact/expanded view
function toggleColumnGroup(group) {
    visibleColumnGroup = group;
    
    // Update toggle button states
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.columns === group) {
            btn.classList.add('active');
        }
    });
    
    // Get all column elements
    const datesCols = document.querySelectorAll('.col-dates');
    const metricsCols = document.querySelectorAll('.col-metrics');
    const tableScroll = document.querySelector('.station-table-scroll');
    
    // Reset all
    datesCols.forEach(col => col.classList.add('col-hidden'));
    metricsCols.forEach(col => col.classList.add('col-hidden'));
    
    // Show based on selection
    if (group === 'dates' || group === 'all') {
        datesCols.forEach(col => col.classList.remove('col-hidden'));
    }
    if (group === 'metrics' || group === 'all') {
        metricsCols.forEach(col => col.classList.remove('col-hidden'));
    }
    
    // Adjust table width
    if (tableScroll) {
        tableScroll.classList.remove('compact-view', 'expanded-view');
        if (group === 'core') {
            tableScroll.classList.add('compact-view');
        } else if (group === 'all') {
            tableScroll.classList.add('expanded-view');
        }
    }
}

window.toggleStationExpand = toggleStationExpand;
window.expandAllStations = expandAllStations;
window.collapseAllStations = collapseAllStations;
window.toggleColumnGroup = toggleColumnGroup;

function renderStationTable() {
    const tbody = document.getElementById('station-tbody');
    let html = '';
    
    stations.forEach((station, idx) => {
        const days = daysBetween(station.startDate, station.endDate);
        const totalHours = station.tasks.reduce((sum, t) => sum + (t.estHours || 0), 0);
        const actualHours = station.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
        const progress = totalHours > 0 ? Math.round((actualHours / totalHours) * 100) : 0;
        const isExpanded = expandedStations.has(station.id);
        const hasSubtasks = station.tasks.length > 0;
        
        // Expand/collapse chevron
        const chevron = hasSubtasks ? `
            <button class="expand-toggle ${isExpanded ? 'expanded' : ''}" onclick="toggleStationExpand(${station.id}, event)" title="${isExpanded ? 'Collapse' : 'Expand'} tasks">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18l6-6-6-6"/>
                </svg>
            </button>
        ` : '<span style="width: 28px; display: inline-block;"></span>';
        
        if (!isAdmin) {
            // Public view - station row (compact with column classes)
            html += `
                <tr data-station-id="${station.id}" class="station-row ${isExpanded ? 'expanded' : ''}">
                    <td class="col-core" style="color: ${station.color}; font-weight: 700;">
                        ${chevron}${station.id}
                    </td>
                    <td class="col-core" style="font-weight: 600; cursor: pointer;" onclick="openStationDetail(${station.id})">
                        <div style="display: flex; flex-direction: column;">
                            <span>${station.name}</span>
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400;">${station.description.substring(0, 40)}${station.description.length > 40 ? '...' : ''}</span>
                        </div>
                    </td>
                    <td class="col-dates col-hidden">${formatDateDisplay(station.startDate)}</td>
                    <td class="col-dates col-hidden">${formatDateDisplay(station.endDate)}</td>
                    <td class="col-metrics col-hidden">${days}</td>
                    <td class="col-metrics col-hidden">${station.tasks.length}</td>
                    <td class="col-metrics col-hidden">${totalHours}h</td>
                    <td class="col-core">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="flex: 1; min-width: 40px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                                <div style="height: 100%; width: ${progress}%; background: ${station.color};"></div>
                            </div>
                            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.75rem;">${progress}%</span>
                        </div>
                    </td>
                    <td class="col-metrics col-hidden"><span class="priority-badge ${getPriorityClass(station.priority)}">${station.priority}</span></td>
                    <td class="col-metrics col-hidden"></td>
                </tr>
            `;
        } else {
            // Admin view - station row (compact with column classes)
            html += `
                <tr data-station-id="${station.id}" class="station-row ${isExpanded ? 'expanded' : ''}">
                    <td class="col-core">
                        ${chevron}${station.id}
                    </td>
                    <td class="col-core editable-cell">
                        <input type="text" value="${station.name}" style="font-weight: 600;"
                               onchange="updateStation(${station.id}, 'name', this.value)">
                    </td>
                    <td class="col-dates col-hidden editable-cell">
                        <input type="date" value="${station.startDate}" 
                               onchange="updateStation(${station.id}, 'startDate', this.value)">
                    </td>
                    <td class="col-dates col-hidden editable-cell">
                        <input type="date" value="${station.endDate}" 
                               onchange="updateStation(${station.id}, 'endDate', this.value)">
                    </td>
                    <td class="col-metrics col-hidden">${days}</td>
                    <td class="col-metrics col-hidden">${station.tasks.length}</td>
                    <td class="col-metrics col-hidden">${totalHours}h</td>
                    <td class="col-core">${progress}%</td>
                    <td class="col-metrics col-hidden editable-cell">
                        <select onchange="updateStation(${station.id}, 'priority', this.value)">
                            <option value="Low" ${station.priority === 'Low' ? 'selected' : ''}>Low</option>
                            <option value="Medium" ${station.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                            <option value="High" ${station.priority === 'High' ? 'selected' : ''}>High</option>
                            <option value="Critical" ${station.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                        </select>
                    </td>
                    <td class="col-metrics col-hidden">
                        <button class="btn-icon delete" onclick="deleteStation(${station.id})" title="Delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                        </button>
                    </td>
                </tr>
            `;
        }
        
        // Subtask rows (shown when expanded)
        if (isExpanded && hasSubtasks) {
            station.tasks.forEach(task => {
                const taskDays = daysBetween(task.startDate, task.endDate);
                const memberColor = getMemberColor(task.assignedTo);
                
                if (!isAdmin) {
                    // Public view - subtask row (compact with column classes)
                    html += `
                        <tr class="subtask-row" data-station-id="${station.id}" data-task-id="${task.id}">
                            <td class="col-core" style="padding-left: 30px; color: var(--text-muted);">
                                <span style="color: ${station.color};">└</span> ${task.id}
                            </td>
                            <td class="col-core">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="display: inline-block; width: 8px; height: 8px; background: ${memberColor}; border-radius: 50%; flex-shrink: 0;"></span>
                                    <div>
                                        <div style="font-weight: 500;">${task.name}</div>
                                        <div style="font-size: 0.7rem; color: var(--text-muted);">${task.assignedTo || 'Unassigned'}</div>
                                    </div>
                                </div>
                            </td>
                            <td class="col-dates col-hidden">${formatDateDisplay(task.startDate)}</td>
                            <td class="col-dates col-hidden">${formatDateDisplay(task.endDate)}</td>
                            <td class="col-metrics col-hidden">${taskDays}</td>
                            <td class="col-metrics col-hidden">${task.estHours || 0}h</td>
                            <td class="col-metrics col-hidden">${task.actualHours || 0}h</td>
                            <td class="col-core"><span class="status-badge ${getStatusClass(task.status)}" style="font-size: 0.65rem; padding: 2px 6px;">${task.status}</span></td>
                            <td class="col-metrics col-hidden"><span class="priority-badge ${getPriorityClass(task.priority)}">${task.priority}</span></td>
                            <td class="col-metrics col-hidden"></td>
                        </tr>
                    `;
                } else {
                    // Admin view - subtask row (compact with column classes)
                    html += `
                        <tr class="subtask-row" data-station-id="${station.id}" data-task-id="${task.id}">
                            <td class="col-core" style="padding-left: 30px; color: var(--text-muted);">
                                <span style="color: ${station.color};">└</span> ${task.id}
                            </td>
                            <td class="col-core editable-cell">
                                <input type="text" value="${task.name}" style="font-size: 0.85rem;"
                                       onchange="updateTask(${station.id}, ${task.id}, 'name', this.value)">
                            </td>
                            <td class="col-dates col-hidden editable-cell">
                                <input type="date" value="${task.startDate}" 
                                       onchange="updateTask(${station.id}, ${task.id}, 'startDate', this.value)">
                            </td>
                            <td class="col-dates col-hidden editable-cell">
                                <input type="date" value="${task.endDate}" 
                                       onchange="updateTask(${station.id}, ${task.id}, 'endDate', this.value)">
                            </td>
                            <td class="col-metrics col-hidden">${taskDays}</td>
                            <td class="col-metrics col-hidden">${task.estHours || 0}h</td>
                            <td class="col-metrics col-hidden">${task.actualHours || 0}h</td>
                            <td class="col-core editable-cell">
                                <select onchange="updateTask(${station.id}, ${task.id}, 'status', this.value)" style="font-size: 0.75rem; padding: 4px;">
                                    <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                                    <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                                </select>
                            </td>
                            <td class="col-metrics col-hidden editable-cell">
                                <select onchange="updateTask(${station.id}, ${task.id}, 'priority', this.value)">
                                    <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                                    <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                                    <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
                                    <option value="Critical" ${task.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                                </select>
                            </td>
                            <td class="col-metrics col-hidden">
                                <button class="btn-icon delete" onclick="deleteTask(${station.id}, ${task.id})" title="Delete">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    `;
                }
            });
        }
    });
    
    tbody.innerHTML = html;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderGanttTimeline() {
    const headerEl = document.getElementById('gantt-timeline-header');
    const bodyEl = document.getElementById('gantt-timeline-body');
    
    if (!stations.length) {
        headerEl.innerHTML = '';
        bodyEl.innerHTML = '';
        return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const earliestDate = stations.reduce((min, s) => {
        const start = parseDate(s.startDate);
        return start < min ? start : min;
    }, parseDate(stations[0].startDate));
    
    const timelineStart = new Date(earliestDate);
    timelineStart.setDate(timelineStart.getDate() - 3);
    
    // Header
    let headerHTML = '';
    for (let i = 0; i < TIMELINE_DAYS; i++) {
        const date = new Date(timelineStart);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday = date.getTime() === today.getTime();
        
        headerHTML += `<div class="timeline-day-cell ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">${date.getDate()}</div>`;
    }
    headerEl.innerHTML = headerHTML;
    
    // Body
    let bodyHTML = '';
    stations.forEach(station => {
        const isExpanded = expandedStations.has(station.id);
        
        // Station row
        let rowHTML = `<div class="gantt-timeline-row station-timeline-row ${isExpanded ? 'expanded' : ''}">`;
        
        for (let i = 0; i < TIMELINE_DAYS; i++) {
            const date = new Date(timelineStart);
            date.setDate(date.getDate() + i);
            
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = date.getTime() === today.getTime();
            
            rowHTML += `<div class="timeline-cell ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}"></div>`;
        }
        
        // Add station Gantt bar
        const stationStart = parseDate(station.startDate);
        const startOffset = Math.floor((stationStart - timelineStart) / (1000 * 60 * 60 * 24));
        const duration = daysBetween(station.startDate, station.endDate);
        
        if (startOffset < TIMELINE_DAYS && startOffset + duration > 0) {
            const left = Math.max(0, startOffset) * DAY_WIDTH;
            const width = Math.min(duration, TIMELINE_DAYS - Math.max(0, startOffset)) * DAY_WIDTH - 4;
            
            rowHTML += `
                <div class="gantt-bar station-bar" 
                     style="left: ${left + 2}px; width: ${width}px; background: ${station.color};"
                     title="${station.name}">
                    ${width > 80 ? station.name.substring(0, 15) : ''}
                </div>
            `;
        }
        
        rowHTML += '</div>';
        bodyHTML += rowHTML;
        
        // Task rows (when expanded)
        if (isExpanded && station.tasks.length > 0) {
            station.tasks.forEach(task => {
                let taskRowHTML = '<div class="gantt-timeline-row subtask-timeline-row">';
                
                for (let i = 0; i < TIMELINE_DAYS; i++) {
                    const date = new Date(timelineStart);
                    date.setDate(date.getDate() + i);
                    
                    const dayOfWeek = date.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isToday = date.getTime() === today.getTime();
                    
                    taskRowHTML += `<div class="timeline-cell subtask-cell ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}"></div>`;
                }
                
                // Add task Gantt bar
                const taskStart = parseDate(task.startDate);
                const taskStartOffset = Math.floor((taskStart - timelineStart) / (1000 * 60 * 60 * 24));
                const taskDuration = daysBetween(task.startDate, task.endDate);
                const memberColor = getMemberColor(task.assignedTo);
                
                if (taskStartOffset < TIMELINE_DAYS && taskStartOffset + taskDuration > 0) {
                    const left = Math.max(0, taskStartOffset) * DAY_WIDTH;
                    const width = Math.min(taskDuration, TIMELINE_DAYS - Math.max(0, taskStartOffset)) * DAY_WIDTH - 4;
                    
                    // Get status color modifier
                    let opacity = '1';
                    let borderStyle = '';
                    if (task.status === 'Complete') {
                        borderStyle = 'border: 2px solid #28a745;';
                    } else if (task.status === 'On Hold') {
                        opacity = '0.5';
                        borderStyle = 'border: 2px dashed #ffc107;';
                    } else if (task.status === 'In Progress') {
                        borderStyle = 'border-left: 4px solid #17a2b8;';
                    }
                    
                    taskRowHTML += `
                        <div class="gantt-bar subtask-bar" 
                             style="left: ${left + 2}px; width: ${width}px; background: ${memberColor}; opacity: ${opacity}; ${borderStyle}"
                             title="${task.name} (${task.assignedTo || 'Unassigned'})">
                            ${width > 60 ? task.name.substring(0, 10) : ''}
                        </div>
                    `;
                }
                
                taskRowHTML += '</div>';
                bodyHTML += taskRowHTML;
            });
        }
    });
    
    bodyEl.innerHTML = bodyHTML;
}

async function updateStation(stationId, field, value) {
    const station = stations.find(s => s.id === stationId);
    if (station) {
        station[field] = value;
        await saveStations(stations);
        showSuccess('Station updated');
    }
}

async function addNewStation() {
    const maxId = stations.reduce((max, s) => Math.max(max, s.id), 0);
    const today = new Date().toISOString().split('T')[0];
    
    stations.push({
        id: maxId + 1,
        name: `Station ${maxId + 1}`,
        description: "Description",
        startDate: today,
        endDate: today,
        color: "#00d4aa",
        priority: "Medium",
        tasks: []
    });
    
    await saveStations(stations);
    showSuccess('Station added');
}

async function deleteStation(stationId) {
    if (confirm('Delete this station and all its tasks?')) {
        stations = stations.filter(s => s.id !== stationId);
        await saveStations(stations);
        showSuccess('Station deleted');
    }
}

// ============================================
// STATION DETAIL VIEW
// ============================================

function openStationDetail(stationId) {
    currentStationId = stationId;
    const station = stations.find(s => s.id === stationId);
    if (!station) return;
    
    document.getElementById('station-detail-title').textContent = station.name;
    document.getElementById('station-detail-subtitle').textContent = `${station.tasks.length} tasks • ${station.description}`;
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('station-detail-view').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    renderStationTasks(station);
    renderTaskTimeline(station);
}

function renderStationTasks(station) {
    const tbody = document.getElementById('station-tasks-tbody');
    
    if (!isAdmin) {
        // Public view - professional read-only display
        tbody.innerHTML = station.tasks.map((task, idx) => {
            const days = daysBetween(task.startDate, task.endDate);
            const remaining = (task.estHours || 0) - (task.actualHours || 0);
            const percentDone = task.estHours > 0 ? Math.round((task.actualHours / task.estHours) * 100) : 0;
            const memberColor = getMemberColor(task.assignedTo);
            
            return `
                <tr class="public-view-row">
                    <td>${idx + 1}</td>
                    <td style="border-left: 3px solid ${memberColor}; padding-left: 10px; font-weight: 500;">${task.name}</td>
                    <td>${task.assignedTo}</td>
                    <td>${getMemberRole(task.assignedTo)}</td>
                    <td>${formatDateDisplay(task.startDate)}</td>
                    <td>${formatDateDisplay(task.endDate)}</td>
                    <td>${days}</td>
                    <td style="font-family: 'JetBrains Mono', monospace;">${task.estHours}h</td>
                    <td style="font-family: 'JetBrains Mono', monospace;">${task.actualHours}h</td>
                    <td style="font-family: 'JetBrains Mono', monospace;">${remaining}h</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div style="width: 40px; height: 6px; background: var(--bg-tertiary); border-radius: 3px; overflow: hidden;">
                                <div style="height: 100%; width: ${percentDone}%; background: ${memberColor};"></div>
                            </div>
                            <span style="font-size: 0.8rem;">${percentDone}%</span>
                        </div>
                    </td>
                    <td><span class="status-badge ${getStatusClass(task.status)}">${task.status}</span></td>
                    <td><span class="priority-badge ${getPriorityClass(task.priority)}">${task.priority}</span></td>
                    <td style="color: var(--text-muted); font-size: 0.85rem;">${task.notes || '-'}</td>
                    <td></td>
                </tr>
            `;
        }).join('');
        return;
    }
    
    // Admin view - editable
    const teamOptions = teamMembers.map(m => `<option value="${m.name}">${m.name}</option>`).join('');
    
    tbody.innerHTML = station.tasks.map((task, idx) => {
        const days = daysBetween(task.startDate, task.endDate);
        const remaining = (task.estHours || 0) - (task.actualHours || 0);
        const percentDone = task.estHours > 0 ? Math.round((task.actualHours / task.estHours) * 100) : 0;
        const role = getMemberRole(task.assignedTo);
        
        return `
            <tr>
                <td>${idx + 1}</td>
                <td><input type="text" value="${task.name}" onchange="updateTask(${station.id}, ${task.id}, 'name', this.value)"></td>
                <td>
                    <select onchange="updateTask(${station.id}, ${task.id}, 'assignedTo', this.value)">
                        ${teamMembers.map(m => `<option value="${m.name}" ${task.assignedTo === m.name ? 'selected' : ''}>${m.name}</option>`).join('')}
                    </select>
                </td>
                <td>${role}</td>
                <td><input type="date" value="${task.startDate}" onchange="updateTask(${station.id}, ${task.id}, 'startDate', this.value)"></td>
                <td><input type="date" value="${task.endDate}" onchange="updateTask(${station.id}, ${task.id}, 'endDate', this.value)"></td>
                <td>${days}</td>
                <td><input type="number" value="${task.estHours}" min="0" step="0.5" onchange="updateTask(${station.id}, ${task.id}, 'estHours', parseFloat(this.value))"></td>
                <td><input type="number" value="${task.actualHours}" min="0" step="0.5" onchange="updateTask(${station.id}, ${task.id}, 'actualHours', parseFloat(this.value))"></td>
                <td>${remaining}h</td>
                <td>${percentDone}%</td>
                <td>
                    <select onchange="updateTask(${station.id}, ${task.id}, 'status', this.value)">
                        <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                        <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                        <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                        <option value="Delayed" ${task.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                    </select>
                </td>
                <td>
                    <select onchange="updateTask(${station.id}, ${task.id}, 'priority', this.value)">
                        <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                        <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                        <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Critical" ${task.priority === 'Critical' ? 'selected' : ''}>Critical</option>
                    </select>
                </td>
                <td><input type="text" value="${task.notes || ''}" onchange="updateTask(${station.id}, ${task.id}, 'notes', this.value)"></td>
                <td>
                    <button class="btn-icon delete" onclick="deleteTask(${station.id}, ${task.id})" title="Delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTaskTimeline(station) {
    if (!station.tasks.length) {
        document.getElementById('task-timeline-header').innerHTML = '<p style="padding: 20px; color: var(--text-muted);">No tasks in this station</p>';
        document.getElementById('task-timeline-body').innerHTML = '';
        return;
    }
    
    const stationStart = parseDate(station.startDate);
    const totalDays = daysBetween(station.startDate, station.endDate);
    const daysToShow = Math.max(totalDays, 30);
    
    // Header
    let headerHTML = '';
    for (let i = 0; i < daysToShow; i++) {
        const date = new Date(stationStart);
        date.setDate(date.getDate() + i);
        
        headerHTML += `<div class="timeline-day-cell">${date.getDate()}</div>`;
    }
    document.getElementById('task-timeline-header').innerHTML = headerHTML;
    
    // Body
    let bodyHTML = '';
    station.tasks.forEach(task => {
        const taskStart = parseDate(task.startDate);
        const startOffset = Math.max(0, Math.floor((taskStart - stationStart) / (1000 * 60 * 60 * 24)));
        const duration = daysBetween(task.startDate, task.endDate);
        const color = getMemberColor(task.assignedTo);
        
        let rowHTML = '<div class="task-timeline-row-gantt">';
        
        for (let i = 0; i < daysToShow; i++) {
            rowHTML += '<div class="timeline-cell"></div>';
        }
        
        if (startOffset < daysToShow) {
            const left = startOffset * DAY_WIDTH;
            const width = Math.min(duration, daysToShow - startOffset) * DAY_WIDTH - 4;
            
            rowHTML += `
                <div class="gantt-bar" 
                     style="left: ${left + 2}px; width: ${width}px; background: ${color};"
                     title="${task.name}">
                    ${width > 60 ? task.name.substring(0, 8) : ''}
                </div>
            `;
        }
        
        rowHTML += '</div>';
        bodyHTML += rowHTML;
    });
    
    document.getElementById('task-timeline-body').innerHTML = bodyHTML;
}

async function updateTask(stationId, taskId, field, value) {
    const station = stations.find(s => s.id === stationId);
    if (station) {
        const task = station.tasks.find(t => t.id === taskId);
        if (task) {
            task[field] = value;
            await saveStations(stations);
            showSuccess('Task updated');
        }
    }
}

async function addNewTaskToStation() {
    if (!currentStationId) return;
    
    const station = stations.find(s => s.id === currentStationId);
    if (!station) return;
    
    const maxId = station.tasks.reduce((max, t) => Math.max(max, t.id), currentStationId * 100);
    
    station.tasks.push({
        id: maxId + 1,
        name: "New Task",
        assignedTo: teamMembers[0]?.name || "Unassigned",
        startDate: station.startDate,
        endDate: station.endDate,
        estHours: 8,
        actualHours: 0,
        status: "Not Started",
        priority: "Medium",
        notes: ""
    });
    
    await saveStations(stations);
    showSuccess('Task added');
}

async function deleteTask(stationId, taskId) {
    if (confirm('Delete this task?')) {
        const station = stations.find(s => s.id === stationId);
        if (station) {
            station.tasks = station.tasks.filter(t => t.id !== taskId);
            await saveStations(stations);
            showSuccess('Task deleted');
        }
    }
}

// ============================================
// TEAM MANAGEMENT
// ============================================

function renderTeam() {
    const grid = document.getElementById('team-grid');
    console.log('renderTeam called, isAdmin:', isAdmin);
    
    // Hide "Add Member" button if not admin
    const addMemberBtn = document.querySelector('#team-view .header-actions .btn-primary');
    if (addMemberBtn) {
        addMemberBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    
    grid.innerHTML = teamMembers.map((member, index) => {
        const assignedHours = getAssignedHours(member.name);
        const taskCount = getAllTasks().filter(t => t.assignedTo === member.name).length;
        const loadPercent = member.targetHours > 0 ? (assignedHours / member.targetHours) * 100 : 0;
        
        let loadColor = '#28a745';
        if (loadPercent > 80 && loadPercent <= 100) loadColor = '#00d4aa';
        if (loadPercent > 100) loadColor = '#dc3545';
        
        // Only show edit/delete buttons for admins
        const actionsHTML = isAdmin ? `
            <div class="team-card-actions admin-actions">
                <button onclick="editTeamMember(${index})">Edit</button>
                <button class="delete" onclick="deleteTeamMember(${index})">Remove</button>
            </div>
        ` : `
            <div class="team-card-actions public-actions">
                <span style="color: var(--text-muted); font-size: 0.8rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; vertical-align: middle; margin-right: 4px;">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    Admin only
                </span>
            </div>
        `;
        
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
                ${actionsHTML}
            </div>
        `;
    }).join('');
}

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

function addNewTeamMember() {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }
    
    document.getElementById('team-modal-title').textContent = 'Add Team Member';
    document.getElementById('team-form').reset();
    document.getElementById('member-index').value = '';
    document.getElementById('member-color').value = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    
    openModal('team-modal');
}

function editTeamMember(index) {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }
    
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

document.getElementById('team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
        showError('Admin access required');
        closeModal('team-modal');
        return;
    }
    
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
        
        if (oldName && oldName !== memberData.name) {
            stations.forEach(station => {
                station.tasks.forEach(task => {
                    if (task.assignedTo === oldName) {
                        task.assignedTo = memberData.name;
                    }
                });
            });
            await saveStations(stations);
        }
    }
    
    await saveTeamMembers(teamMembers);
    closeModal('team-modal');
    showSuccess(memberIndex === '' ? 'Team member added' : 'Team member updated');
});

async function deleteTeamMember(index) {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }
    
    const member = teamMembers[index];
    const assignedTasks = getAllTasks().filter(t => t.assignedTo === member.name).length;
    
    let message = `Remove ${member.name}?`;
    if (assignedTasks > 0) {
        message += `\n\nWarning: This member has ${assignedTasks} task(s) assigned.`;
    }
    
    if (confirm(message)) {
        teamMembers.splice(index, 1);
        await saveTeamMembers(teamMembers);
        showSuccess('Team member removed');
    }
}

// ============================================
// VALIDATION
// ============================================

function validateProject() {
    const issues = [];
    const allTasks = getAllTasks();
    
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
    
    stations.forEach(station => {
        if (station.tasks.length === 0) {
            issues.push(`Station "${station.name}" has no tasks`);
        }
    });
    
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
    showSuccess('Generating professional report...');
    
    // Calculate project metrics
    const totalTasks = stations.reduce((sum, s) => sum + s.tasks.length, 0);
    const completedTasks = stations.reduce((sum, s) => sum + s.tasks.filter(t => t.status === 'Complete').length, 0);
    const inProgressTasks = stations.reduce((sum, s) => sum + s.tasks.filter(t => t.status === 'In Progress').length, 0);
    const totalHours = stations.reduce((sum, s) => sum + s.tasks.reduce((h, t) => h + (t.estHours || 0), 0), 0);
    const actualHours = stations.reduce((sum, s) => sum + s.tasks.reduce((h, t) => h + (t.actualHours || 0), 0), 0);
    const overallProgress = totalHours > 0 ? Math.round((actualHours / totalHours) * 100) : 0;
    
    // Find date range
    const allDates = stations.flatMap(s => [parseDate(s.startDate), parseDate(s.endDate)]);
    const projectStart = new Date(Math.min(...allDates));
    const projectEnd = new Date(Math.max(...allDates));
    
    // Generate PDF content as structured HTML
    const reportHTML = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #0d1117; color: #f0f6fc; padding: 40px; min-height: 100%;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 3px solid #00d4aa;">
                <h1 style="font-size: 36px; margin: 0; color: #00d4aa; letter-spacing: 2px;">LOOP AUTOMATION</h1>
                <p style="font-size: 14px; color: #8b949e; margin-top: 10px;">PROJECT MANAGEMENT REPORT</p>
                <p style="font-size: 12px; color: #6e7681; margin-top: 5px;">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <!-- Executive Summary -->
            <div style="background: #161b22; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <h2 style="font-size: 18px; color: #00d4aa; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 1px solid #30363d;">📊 EXECUTIVE SUMMARY</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <div style="flex: 1; min-width: 150px; background: #21262d; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #00d4aa;">${stations.length}</div>
                        <div style="font-size: 12px; color: #8b949e; text-transform: uppercase;">Stations</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: #21262d; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #17a2b8;">${totalTasks}</div>
                        <div style="font-size: 12px; color: #8b949e; text-transform: uppercase;">Total Tasks</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: #21262d; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #28a745;">${completedTasks}</div>
                        <div style="font-size: 12px; color: #8b949e; text-transform: uppercase;">Completed</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: #21262d; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #f59e0b;">${inProgressTasks}</div>
                        <div style="font-size: 12px; color: #8b949e; text-transform: uppercase;">In Progress</div>
                    </div>
                    <div style="flex: 1; min-width: 150px; background: #21262d; padding: 20px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 32px; font-weight: 700; color: #7c3aed;">${overallProgress}%</div>
                        <div style="font-size: 12px; color: #8b949e; text-transform: uppercase;">Progress</div>
                    </div>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #21262d; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="color: #8b949e; font-size: 12px;">PROJECT TIMELINE</span>
                        <span style="color: #f0f6fc; font-size: 12px;">${formatDateDisplay(projectStart.toISOString().split('T')[0])} → ${formatDateDisplay(projectEnd.toISOString().split('T')[0])}</span>
                    </div>
                    <div style="height: 8px; background: #30363d; border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${overallProgress}%; background: linear-gradient(90deg, #00d4aa, #7c3aed);"></div>
                    </div>
                </div>
            </div>
            
            <!-- Station Details -->
            ${stations.map((station, idx) => {
                const stationTotalHours = station.tasks.reduce((sum, t) => sum + (t.estHours || 0), 0);
                const stationActualHours = station.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
                const stationProgress = stationTotalHours > 0 ? Math.round((stationActualHours / stationTotalHours) * 100) : 0;
                const days = daysBetween(station.startDate, station.endDate);
                
                return `
                <div style="background: #161b22; border-radius: 12px; padding: 25px; margin-bottom: 20px; border-left: 4px solid ${station.color};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
                        <div>
                            <h3 style="font-size: 18px; color: #f0f6fc; margin: 0;">
                                <span style="color: ${station.color}; font-weight: 700;">${station.id}.</span> ${station.name}
                            </h3>
                            <p style="font-size: 13px; color: #8b949e; margin: 8px 0 0 0;">${station.description}</p>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: 700; color: ${station.color};">${stationProgress}%</div>
                            <div style="font-size: 11px; color: #8b949e;">PROGRESS</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 30px; margin-bottom: 20px; padding: 15px; background: #21262d; border-radius: 8px;">
                        <div>
                            <span style="color: #6e7681; font-size: 11px;">DURATION</span>
                            <div style="color: #f0f6fc; font-size: 13px; font-weight: 500;">${days} days</div>
                        </div>
                        <div>
                            <span style="color: #6e7681; font-size: 11px;">START</span>
                            <div style="color: #f0f6fc; font-size: 13px; font-weight: 500;">${formatDateDisplay(station.startDate)}</div>
                        </div>
                        <div>
                            <span style="color: #6e7681; font-size: 11px;">END</span>
                            <div style="color: #f0f6fc; font-size: 13px; font-weight: 500;">${formatDateDisplay(station.endDate)}</div>
                        </div>
                        <div>
                            <span style="color: #6e7681; font-size: 11px;">EST HOURS</span>
                            <div style="color: #f0f6fc; font-size: 13px; font-weight: 500;">${stationTotalHours}h</div>
                        </div>
                        <div>
                            <span style="color: #6e7681; font-size: 11px;">PRIORITY</span>
                            <div style="color: ${station.priority === 'Critical' ? '#dc3545' : station.priority === 'High' ? '#ffc107' : station.priority === 'Medium' ? '#17a2b8' : '#28a745'}; font-size: 13px; font-weight: 500;">${station.priority}</div>
                        </div>
                    </div>
                    
                    ${station.tasks.length > 0 ? `
                    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                        <thead>
                            <tr style="background: #21262d;">
                                <th style="padding: 10px; text-align: left; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">Task</th>
                                <th style="padding: 10px; text-align: left; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">Assigned To</th>
                                <th style="padding: 10px; text-align: center; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">Start</th>
                                <th style="padding: 10px; text-align: center; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">End</th>
                                <th style="padding: 10px; text-align: center; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">Hours</th>
                                <th style="padding: 10px; text-align: center; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">Status</th>
                                <th style="padding: 10px; text-align: center; color: #8b949e; font-weight: 600; border-bottom: 1px solid #30363d;">Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${station.tasks.map(task => {
                                const statusColor = task.status === 'Complete' ? '#28a745' : task.status === 'In Progress' ? '#17a2b8' : task.status === 'On Hold' ? '#fd7e14' : '#6c757d';
                                const priorityColor = task.priority === 'Critical' ? '#dc3545' : task.priority === 'High' ? '#ffc107' : task.priority === 'Medium' ? '#17a2b8' : '#28a745';
                                return `
                                <tr style="border-bottom: 1px solid #21262d;">
                                    <td style="padding: 12px 10px; color: #f0f6fc;">${task.name}</td>
                                    <td style="padding: 12px 10px; color: #8b949e;">${task.assignedTo || 'Unassigned'}</td>
                                    <td style="padding: 12px 10px; text-align: center; color: #8b949e;">${formatDateDisplay(task.startDate)}</td>
                                    <td style="padding: 12px 10px; text-align: center; color: #8b949e;">${formatDateDisplay(task.endDate)}</td>
                                    <td style="padding: 12px 10px; text-align: center; color: #f0f6fc; font-family: monospace;">${task.estHours || 0}h</td>
                                    <td style="padding: 12px 10px; text-align: center;">
                                        <span style="background: ${statusColor}22; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">${task.status}</span>
                                    </td>
                                    <td style="padding: 12px 10px; text-align: center;">
                                        <span style="color: ${priorityColor}; font-size: 11px; font-weight: 600;">${task.priority}</span>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    ` : '<p style="color: #6e7681; font-style: italic; font-size: 12px;">No tasks assigned to this station.</p>'}
                </div>
                `;
            }).join('')}
            
            <!-- Team Members -->
            <div style="background: #161b22; border-radius: 12px; padding: 25px; margin-bottom: 30px; page-break-before: always;">
                <h2 style="font-size: 18px; color: #00d4aa; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 1px solid #30363d;">👥 TEAM MEMBERS (${teamMembers.length})</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
                    ${teamMembers.map(member => {
                        const memberTasks = stations.flatMap(s => s.tasks.filter(t => t.assignedTo === member.name));
                        const completedMemberTasks = memberTasks.filter(t => t.status === 'Complete').length;
                        return `
                        <div style="flex: 0 0 calc(33% - 10px); background: #21262d; padding: 15px; border-radius: 8px; border-left: 3px solid ${member.color};">
                            <div style="font-weight: 600; color: #f0f6fc; margin-bottom: 5px;">${member.name}</div>
                            <div style="font-size: 12px; color: #8b949e;">${member.role}</div>
                            <div style="font-size: 11px; color: #6e7681; margin-top: 8px;">${memberTasks.length} tasks (${completedMemberTasks} complete)</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding-top: 30px; border-top: 1px solid #30363d; color: #6e7681; font-size: 11px;">
                <p>Loop Automation Project Management System</p>
                <p>Confidential - For Internal Use Only</p>
            </div>
        </div>
    `;
    
    // Create a temporary container for the PDF
    const container = document.createElement('div');
    container.innerHTML = reportHTML;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '1100px';
    document.body.appendChild(container);
    
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `LoopAutomation_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#0d1117'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    html2pdf().set(opt).from(container).save().then(() => {
        document.body.removeChild(container);
        showSuccess('Report exported successfully!');
    }).catch(err => {
        console.error('PDF export error:', err);
        document.body.removeChild(container);
        showError('Export failed');
    });
}

function exportStationToPDF() {
    showSuccess('Preparing PDF export...');
    
    const element = document.getElementById('station-export-area');
    const station = stations.find(s => s.id === currentStationId);
    const stationName = station ? station.name.replace(/\s+/g, '_') : 'Station';
    
    // Get scrollable elements
    const tableWrapper = element.querySelector('.tasks-table-wrapper');
    const timelineWrapper = element.querySelector('.task-timeline-wrapper');
    
    // Save original styles
    const originalTableStyle = tableWrapper ? tableWrapper.style.cssText : '';
    const originalTimelineStyle = timelineWrapper ? timelineWrapper.style.cssText : '';
    const originalElementStyle = element.style.cssText;
    
    // Make everything visible
    if (element) {
        element.style.overflow = 'visible';
        element.style.height = 'auto';
    }
    if (tableWrapper) {
        tableWrapper.style.overflow = 'visible';
        tableWrapper.style.height = 'auto';
        tableWrapper.style.maxHeight = 'none';
    }
    if (timelineWrapper) {
        timelineWrapper.style.overflow = 'visible';
        timelineWrapper.style.height = 'auto';
    }
    
    const opt = {
        margin: 5,
        filename: `LoopAutomation_${stationName}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.92 },
        html2canvas: { 
            scale: 1.5, 
            useCORS: true, 
            backgroundColor: '#0d1117',
            scrollX: 0,
            scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a2', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(element).save().then(() => {
        // Restore styles
        element.style.cssText = originalElementStyle;
        if (tableWrapper) tableWrapper.style.cssText = originalTableStyle;
        if (timelineWrapper) timelineWrapper.style.cssText = originalTimelineStyle;
        showSuccess('PDF exported!');
    }).catch(err => {
        console.error('PDF export error:', err);
        element.style.cssText = originalElementStyle;
        if (tableWrapper) tableWrapper.style.cssText = originalTableStyle;
        if (timelineWrapper) timelineWrapper.style.cssText = originalTimelineStyle;
        showError('Export failed');
    });
}

function exportToCSV() {
    let csv = 'Station,Task,Assigned To,Role,Start Date,End Date,Est Hours,Actual Hours,Status,Priority,Notes\n';
    
    stations.forEach(station => {
        station.tasks.forEach(task => {
            csv += `"${station.name}","${task.name}","${task.assignedTo}","${getMemberRole(task.assignedTo)}","${task.startDate}","${task.endDate}",${task.estHours},${task.actualHours},"${task.status}","${task.priority}","${task.notes || ''}"\n`;
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
// ZOOM CONTROLS
// ============================================

function zoomIn() {
    if (zoomLevel < 200) {
        zoomLevel += 10;
        applyZoom();
    }
}

function zoomOut() {
    if (zoomLevel > 50) {
        zoomLevel -= 10;
        applyZoom();
    }
}

function applyZoom() {
    const ganttContainer = document.querySelector('.gantt-table-wrapper');
    const stationDetailContainer = document.querySelector('.station-detail-content');
    
    if (ganttContainer) {
        ganttContainer.style.transform = `scale(${zoomLevel / 100})`;
        ganttContainer.style.transformOrigin = 'top left';
    }
    
    if (stationDetailContainer) {
        stationDetailContainer.style.transform = `scale(${zoomLevel / 100})`;
        stationDetailContainer.style.transformOrigin = 'top left';
    }
    
    const zoomLevelEl = document.getElementById('zoom-level');
    if (zoomLevelEl) {
        zoomLevelEl.textContent = `${zoomLevel}%`;
    }
}

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE (for onclick handlers)
// ============================================

window.switchToView = switchToView;
window.openStationDetail = openStationDetail;
window.backToGantt = backToGantt;
window.updateStation = updateStation;
window.addNewStation = addNewStation;
window.deleteStation = deleteStation;
window.updateTask = updateTask;
window.addNewTaskToStation = addNewTaskToStation;
window.deleteTask = deleteTask;
window.openModal = openModal;
window.closeModal = closeModal;
window.addNewTeamMember = addNewTeamMember;
window.editTeamMember = editTeamMember;
window.deleteTeamMember = deleteTeamMember;
window.validateProject = validateProject;
window.exportToPDF = exportToPDF;
window.exportStationToPDF = exportStationToPDF;
window.exportToCSV = exportToCSV;
window.showAdminLoginModal = showAdminLoginModal;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    console.log('Initializing app...');
    
    try {
        // Setup navigation event listeners FIRST
        setupNavigation();
        console.log('Navigation setup complete');
        
        // Load data from localStorage immediately (so UI works right away)
        teamMembers = JSON.parse(localStorage.getItem('loopTeamMembers')) || [...defaultTeamMembers];
        stations = JSON.parse(localStorage.getItem('loopStations')) || JSON.parse(JSON.stringify(defaultStations));
        
        // Render initial views
        renderAllViews();
        console.log('Initial render complete');
        
        // Then try Firebase (this can fail without breaking the app)
        initializeFirebase().catch(err => {
            console.error('Firebase error:', err);
        });
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Init error:', error);
        alert('Error initializing app: ' + error.message);
    }
}

document.addEventListener('DOMContentLoaded', init);
