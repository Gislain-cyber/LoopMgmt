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
// GANTT VIEW - UNIFIED (Info + Timeline together)
// ============================================

// Timeline configuration
const DAY_WIDTH = 28;
const TIMELINE_DAYS = 90; // Show 90 days

function renderGanttView() {
    const container = document.getElementById('gantt-unified');
    if (!container) return;
    
    if (stations.length === 0) {
        container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);">No stations yet. Add a station to get started.</div>';
        return;
    }
    
    // Calculate timeline range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const allDates = stations.flatMap(s => [parseDate(s.startDate), parseDate(s.endDate)]);
    const minDate = new Date(Math.min(...allDates));
    const timelineStart = new Date(minDate);
    timelineStart.setDate(timelineStart.getDate() - 7); // Start 1 week before first task
    
    let html = '';
    
    // === HEADER ROW ===
    html += '<div class="gantt-header-row">';
    
    // Info header (sticky left)
    html += '<div class="gantt-info-header">';
    html += '<div class="col col-id">#</div>';
    html += '<div class="col col-name">Station / Task</div>';
    html += '<div class="col col-progress">Progress</div>';
    html += `<div class="col col-date ${visibleColumnGroup === 'core' ? 'hidden' : ''}">Start</div>`;
    html += `<div class="col col-date ${visibleColumnGroup === 'core' ? 'hidden' : ''}">End</div>`;
    html += `<div class="col col-days ${visibleColumnGroup === 'core' ? 'hidden' : ''}">Days</div>`;
    html += '</div>';
    
    // Timeline header
    html += '<div class="gantt-timeline-header-cells">';
    for (let i = 0; i < TIMELINE_DAYS; i++) {
        const date = new Date(timelineStart);
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isToday = date.getTime() === today.getTime();
        
        const dayClass = isToday ? 'today' : (isWeekend ? 'weekend' : '');
        const dayNum = date.getDate();
        const monthLabel = dayNum === 1 ? date.toLocaleDateString('en-US', {month: 'short'}) : '';
        
        html += `<div class="gantt-day-header ${dayClass}">`;
        html += monthLabel ? `<div style="font-size:0.55rem;color:var(--accent-primary);font-weight:600;">${monthLabel}</div>` : '';
        html += `<div style="font-weight:${isToday ? '700' : '400'};">${dayNum}</div>`;
        html += '</div>';
    }
    html += '</div></div>';
    
    // === DATA ROWS ===
    stations.forEach(station => {
        const isExpanded = expandedStations.has(station.id);
        const days = daysBetween(station.startDate, station.endDate);
        const totalHours = station.tasks.reduce((s, t) => s + (t.estHours || 0), 0);
        const actualHours = station.tasks.reduce((s, t) => s + (t.actualHours || 0), 0);
        const progress = totalHours > 0 ? Math.round((actualHours / totalHours) * 100) : 0;
        const hasTasks = station.tasks.length > 0;
        
        // Station row
        html += `<div class="gantt-row station-row ${isExpanded ? 'expanded' : ''}" data-station="${station.id}">`;
        
        // Info cells (sticky)
        html += '<div class="gantt-info-cells">';
        html += `<div class="col col-id" style="color: ${station.color}; font-weight: 700;">`;
        if (hasTasks) {
            html += `<button class="gantt-expand-btn ${isExpanded ? 'expanded' : ''}" onclick="toggleStationExpand(${station.id}, event)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>`;
        }
        html += `${station.id}</div>`;
        
        html += `<div class="col col-name" style="cursor: pointer;" onclick="openStationDetail(${station.id})" title="${station.name}\n${station.description || ''}">`;
        html += `<div class="station-name-cell">`;
        html += `<strong style="color: ${station.color};">${station.name}</strong>`;
        html += `<span class="description">${station.description || ''}</span>`;
        html += `</div></div>`;
        
        html += '<div class="col col-progress">';
        html += `<div class="progress-mini">`;
        html += `<div class="progress-mini-bar"><div class="progress-mini-fill" style="width: ${progress}%; background: linear-gradient(90deg, ${station.color}, ${station.color}dd);"></div></div>`;
        html += `<span class="progress-mini-text">${progress}%</span>`;
        html += `</div></div>`;
        
        html += `<div class="col col-date ${visibleColumnGroup === 'core' ? 'hidden' : ''}">${formatDateDisplay(station.startDate)}</div>`;
        html += `<div class="col col-date ${visibleColumnGroup === 'core' ? 'hidden' : ''}">${formatDateDisplay(station.endDate)}</div>`;
        html += `<div class="col col-days ${visibleColumnGroup === 'core' ? 'hidden' : ''}">${days}d</div>`;
        html += '</div>';
        
        // Timeline cells
        html += '<div class="gantt-timeline-cells">';
        for (let i = 0; i < TIMELINE_DAYS; i++) {
            const date = new Date(timelineStart);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = date.getTime() === today.getTime();
            const dayClass = isToday ? 'today' : (isWeekend ? 'weekend' : '');
            html += `<div class="gantt-day-cell ${dayClass}"></div>`;
        }
        
        // Station bar
        const stationStart = parseDate(station.startDate);
        const stationEnd = parseDate(station.endDate);
        const startOffset = Math.floor((stationStart - timelineStart) / (1000 * 60 * 60 * 24));
        const duration = Math.ceil((stationEnd - stationStart) / (1000 * 60 * 60 * 24)) + 1;
        
        if (startOffset >= 0 && startOffset < TIMELINE_DAYS) {
            html += `<div class="gantt-bar" style="left: ${startOffset * DAY_WIDTH}px; width: ${duration * DAY_WIDTH - 4}px; background: linear-gradient(135deg, ${station.color}, ${station.color}cc);" onclick="openStationDetail(${station.id})" title="${station.name} (${formatDateDisplay(station.startDate)} - ${formatDateDisplay(station.endDate)})">${station.name}</div>`;
        }
        html += '</div></div>';
        
        // Subtask rows (if expanded)
        if (isExpanded && station.tasks.length > 0) {
            station.tasks.forEach(task => {
                const taskDays = daysBetween(task.startDate, task.endDate);
                const memberColor = getMemberColor(task.assignedTo);
                
                html += `<div class="gantt-row subtask-row" data-station="${station.id}" data-task="${task.id}">`;
                
                // Subtask info cells
                html += '<div class="gantt-info-cells">';
                html += `<div class="col col-id" style="padding-left: 25px; color: var(--text-muted);"><span style="color: ${station.color};">└</span> ${task.id}</div>`;
                
                html += `<div class="col col-name" style="padding-left: 20px;" title="${task.name}\nAssigned: ${task.assignedTo || 'Unassigned'}">`;
                html += `<div class="station-name-cell">`;
                html += `<span style="display: flex; align-items: center; gap: 6px;">`;
                html += `<span class="assignee-dot" style="background: ${memberColor};"></span>`;
                html += `<span class="task-name">${task.name}</span>`;
                html += `</span>`;
                html += `<span class="description" style="padding-left: 18px;">${task.assignedTo || 'Unassigned'}</span>`;
                html += `</div></div>`;
                
                html += '<div class="col col-progress">';
                html += `<span class="status-badge ${getStatusClass(task.status)}" style="font-size: 0.65rem; padding: 2px 6px;">${task.status}</span>`;
                html += '</div>';
                
                html += `<div class="col col-date ${visibleColumnGroup === 'core' ? 'hidden' : ''}">${formatDateDisplay(task.startDate)}</div>`;
                html += `<div class="col col-date ${visibleColumnGroup === 'core' ? 'hidden' : ''}">${formatDateDisplay(task.endDate)}</div>`;
                html += `<div class="col col-days ${visibleColumnGroup === 'core' ? 'hidden' : ''}">${taskDays}d</div>`;
                html += '</div>';
                
                // Subtask timeline cells
                html += '<div class="gantt-timeline-cells">';
        for (let i = 0; i < TIMELINE_DAYS; i++) {
            const date = new Date(timelineStart);
            date.setDate(date.getDate() + i);
            const dayOfWeek = date.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const isToday = date.getTime() === today.getTime();
                    const dayClass = isToday ? 'today' : (isWeekend ? 'weekend' : '');
                    html += `<div class="gantt-day-cell ${dayClass}"></div>`;
                }
                
                // Task bar
                const taskStart = parseDate(task.startDate);
                const taskEnd = parseDate(task.endDate);
                const taskStartOffset = Math.floor((taskStart - timelineStart) / (1000 * 60 * 60 * 24));
                const taskDuration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1;
                
                if (taskStartOffset >= 0 && taskStartOffset < TIMELINE_DAYS) {
                    html += `<div class="gantt-bar subtask-bar" style="left: ${taskStartOffset * DAY_WIDTH}px; width: ${taskDuration * DAY_WIDTH - 4}px; background: linear-gradient(135deg, ${memberColor}, ${memberColor}bb);" title="${task.name}\n${task.assignedTo || 'Unassigned'}\n${formatDateDisplay(task.startDate)} - ${formatDateDisplay(task.endDate)}">${task.name}</div>`;
                }
                html += '</div></div>';
            });
        }
    });
    
    container.innerHTML = html;
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

// Column visibility toggle
function toggleColumnGroup(group) {
    visibleColumnGroup = group;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.columns === group) {
            btn.classList.add('active');
        }
    });
    
    // Re-render to apply column visibility
    renderGanttView();
}

window.toggleStationExpand = toggleStationExpand;
window.expandAllStations = expandAllStations;
window.collapseAllStations = collapseAllStations;
window.toggleColumnGroup = toggleColumnGroup;

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const date = parseDate(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    // Use browser print dialog - most reliable PDF method
    showSuccess('Opening print dialog...');
    
    // Create print-friendly content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showError('Pop-up blocked. Please allow pop-ups for this site.');
        return;
    }
    
    // Calculate metrics
    const totalTasks = stations.reduce((sum, s) => sum + s.tasks.length, 0);
    const completedTasks = stations.reduce((sum, s) => sum + s.tasks.filter(t => t.status === 'Complete').length, 0);
    const inProgressTasks = stations.reduce((sum, s) => sum + s.tasks.filter(t => t.status === 'In Progress').length, 0);
    const totalHours = stations.reduce((sum, s) => sum + s.tasks.reduce((h, t) => h + (t.estHours || 0), 0), 0);
    const actualHours = stations.reduce((sum, s) => sum + s.tasks.reduce((h, t) => h + (t.actualHours || 0), 0), 0);
    const overallProgress = totalHours > 0 ? Math.round((actualHours / totalHours) * 100) : 0;
    
    // Calculate timeline range for Gantt visualization
    const allDates = stations.flatMap(s => {
        const dates = [parseDate(s.startDate), parseDate(s.endDate)];
        s.tasks.forEach(t => {
            if (t.startDate) dates.push(parseDate(t.startDate));
            if (t.endDate) dates.push(parseDate(t.endDate));
        });
        return dates;
    });
    const minDate = new Date(Math.min(...allDates));
    const maxDate = new Date(Math.max(...allDates));
    const timelineStart = new Date(minDate);
    timelineStart.setDate(timelineStart.getDate() - 3);
    const totalDays = Math.ceil((maxDate - timelineStart) / (1000 * 60 * 60 * 24)) + 7;
    const dayWidth = Math.max(8, Math.min(20, 600 / totalDays)); // Scale to fit
    
    // Build station sections
    let stationHTML = '';
    stations.forEach(station => {
        const stationHours = station.tasks.reduce((s, t) => s + (t.estHours || 0), 0);
        const stationActual = station.tasks.reduce((s, t) => s + (t.actualHours || 0), 0);
        const stationProg = stationHours > 0 ? Math.round((stationActual / stationHours) * 100) : 0;
        const days = daysBetween(station.startDate, station.endDate);
        
        let taskRows = '';
        station.tasks.forEach(task => {
            const sc = task.status === 'Complete' ? '#28a745' : task.status === 'In Progress' ? '#17a2b8' : '#666';
            taskRows += `<tr>
                <td style="padding:6px;border-bottom:1px solid #ddd">${task.name}</td>
                <td style="padding:6px;border-bottom:1px solid #ddd">${task.assignedTo || '-'}</td>
                <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center">${formatDateDisplay(task.startDate)}</td>
                <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center">${formatDateDisplay(task.endDate)}</td>
                <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center">${task.estHours || 0}h</td>
                <td style="padding:6px;border-bottom:1px solid #ddd;text-align:center;color:${sc};font-weight:bold">${task.status}</td>
            </tr>`;
        });
        
        // Build Gantt timeline for this station
        const stationStart = parseDate(station.startDate);
        const stationEnd = parseDate(station.endDate);
        const stationOffset = Math.floor((stationStart - timelineStart) / (1000 * 60 * 60 * 24));
        const stationDuration = Math.ceil((stationEnd - stationStart) / (1000 * 60 * 60 * 24)) + 1;
        
        let ganttHTML = `
            <div style="margin-top:12px;background:#fff;padding:10px;border-radius:4px;border:1px solid #e0e0e0">
                <div style="font-size:10px;font-weight:bold;color:#666;margin-bottom:8px">TIMELINE</div>
                <div style="position:relative;height:24px;background:linear-gradient(90deg,#f5f5f5 50%,#eee 50%);background-size:${dayWidth*2}px 100%;border-radius:3px;overflow:hidden">
                    <div style="position:absolute;left:${stationOffset * dayWidth}px;top:2px;height:20px;width:${stationDuration * dayWidth}px;background:${station.color};border-radius:3px;display:flex;align-items:center;padding:0 6px;font-size:9px;color:white;font-weight:bold;overflow:hidden;white-space:nowrap">
                        ${station.name}
                    </div>
                </div>`;
        
        // Add task bars if station has tasks
        if (station.tasks.length > 0) {
            ganttHTML += `<div style="margin-top:6px">`;
            station.tasks.forEach(task => {
                const taskStart = parseDate(task.startDate);
                const taskEnd = parseDate(task.endDate);
                const taskOffset = Math.floor((taskStart - timelineStart) / (1000 * 60 * 60 * 24));
                const taskDuration = Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1;
                const memberColor = getMemberColor(task.assignedTo);
                const statusOpacity = task.status === 'Complete' ? '1' : task.status === 'In Progress' ? '0.85' : '0.6';
                
                ganttHTML += `
                    <div style="position:relative;height:18px;background:#f9f9f9;margin-bottom:3px;border-radius:2px">
                        <div style="position:absolute;left:${taskOffset * dayWidth}px;top:2px;height:14px;width:${taskDuration * dayWidth}px;background:${memberColor};opacity:${statusOpacity};border-radius:2px;display:flex;align-items:center;padding:0 4px;font-size:8px;color:white;overflow:hidden;white-space:nowrap">
                            ${task.name}
                        </div>
                    </div>`;
            });
            ganttHTML += `</div>`;
        }
        
        // Add date scale
        ganttHTML += `
                <div style="display:flex;margin-top:4px;font-size:8px;color:#999">
                    <span>${formatDateDisplay(station.startDate)}</span>
                    <span style="flex:1;text-align:center">← ${days} days →</span>
                    <span>${formatDateDisplay(station.endDate)}</span>
                </div>
            </div>`;
        
        stationHTML += `
            <div style="border-left:4px solid ${station.color};background:#f8f8f8;padding:15px;margin-bottom:15px;page-break-inside:avoid">
                <div style="display:flex;justify-content:space-between">
                    <div>
                        <h3 style="margin:0;color:#333"><span style="color:${station.color}">${station.id}.</span> ${station.name}</h3>
                        <p style="margin:5px 0 0;color:#666;font-size:12px">${station.description}</p>
                    </div>
                    <div style="text-align:right">
                        <div style="font-size:22px;font-weight:bold;color:${station.color}">${stationProg}%</div>
                    </div>
                </div>
                <div style="font-size:11px;color:#666;margin:10px 0">
                    <span style="margin-right:15px">Duration: ${days} days</span>
                    <span style="margin-right:15px">Start: ${formatDateDisplay(station.startDate)}</span>
                    <span style="margin-right:15px">End: ${formatDateDisplay(station.endDate)}</span>
                    <span>Hours: ${stationHours}h</span>
                </div>
                ${ganttHTML}
                ${station.tasks.length > 0 ? `
                <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:12px">
                    <tr style="background:#e8e8e8">
                        <th style="padding:8px;text-align:left">Task</th>
                        <th style="padding:8px;text-align:left">Assigned</th>
                        <th style="padding:8px;text-align:center">Start</th>
                        <th style="padding:8px;text-align:center">End</th>
                        <th style="padding:8px;text-align:center">Hours</th>
                        <th style="padding:8px;text-align:center">Status</th>
                    </tr>
                    ${taskRows}
                </table>` : ''}
            </div>`;
    });
    
    // Build team section
    let teamHTML = '';
    teamMembers.forEach(m => {
        const mTasks = stations.flatMap(s => s.tasks.filter(t => t.assignedTo === m.name)).length;
        teamHTML += `<div style="display:inline-block;width:30%;background:#fff;padding:10px;margin:5px;border-left:3px solid ${m.color};vertical-align:top">
            <div style="font-weight:bold">${m.name}</div>
            <div style="font-size:11px;color:#666">${m.role}</div>
            <div style="font-size:10px;color:#999;margin-top:5px">${mTasks} tasks</div>
        </div>`;
    });
    
    // Write the print document
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Loop Automation - Project Report</title>
    <style>
        * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            color: #333;
        }
        /* Force background colors to print */
        div, span, td, th, tr, table {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }
    </style>
</head>
<body>
    <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #00d4aa">
        <h1 style="color:#00d4aa;margin:0">LOOP AUTOMATION</h1>
        <p style="color:#666;margin-top:8px">Project Management Report</p>
        <p style="color:#999;font-size:11px;margin-top:5px">Generated: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <div style="background:#f0f0f0;padding:20px;margin-bottom:25px">
        <h2 style="color:#00a080;margin:0 0 15px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:8px">Executive Summary</h2>
        <table style="width:100%">
            <tr>
                <td style="text-align:center;padding:15px;background:#fff">
                    <div style="font-size:28px;font-weight:bold;color:#00d4aa">${stations.length}</div>
                    <div style="font-size:10px;color:#666">STATIONS</div>
                </td>
                <td style="width:10px"></td>
                <td style="text-align:center;padding:15px;background:#fff">
                    <div style="font-size:28px;font-weight:bold;color:#17a2b8">${totalTasks}</div>
                    <div style="font-size:10px;color:#666">TASKS</div>
                </td>
                <td style="width:10px"></td>
                <td style="text-align:center;padding:15px;background:#fff">
                    <div style="font-size:28px;font-weight:bold;color:#28a745">${completedTasks}</div>
                    <div style="font-size:10px;color:#666">COMPLETED</div>
                </td>
                <td style="width:10px"></td>
                <td style="text-align:center;padding:15px;background:#fff">
                    <div style="font-size:28px;font-weight:bold;color:#ffc107">${inProgressTasks}</div>
                    <div style="font-size:10px;color:#666">IN PROGRESS</div>
                </td>
                <td style="width:10px"></td>
                <td style="text-align:center;padding:15px;background:#fff">
                    <div style="font-size:28px;font-weight:bold;color:#7c3aed">${overallProgress}%</div>
                    <div style="font-size:10px;color:#666">PROGRESS</div>
                </td>
            </tr>
        </table>
    </div>
    
    <h2 style="color:#00a080;font-size:16px;margin:20px 0 15px">Station Details</h2>
    ${stationHTML}
    
    <div style="background:#f0f0f0;padding:20px;margin-top:25px;page-break-inside:avoid">
        <h2 style="color:#00a080;margin:0 0 15px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:8px">Team Members (${teamMembers.length})</h2>
        ${teamHTML}
    </div>
    
    <div style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #ddd;color:#999;font-size:10px">
        <p>Loop Automation Project Management System</p>
    </div>
    
    <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:#ffe066;color:#333;padding:10px;text-align:center;font-size:12px;z-index:9999;border-bottom:2px solid #cc9900">
        <strong>⚠️ Print Tip:</strong> In the print dialog, expand "More settings" and enable <strong>"Background graphics"</strong> to see timeline colors in your PDF.
    </div>
    <script>
        window.onload = function() {
            // Small delay to ensure styles are loaded
            setTimeout(function() {
                window.print();
            }, 300);
        };
    </script>
</body>
</html>`);
    
    printWindow.document.close();
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
    const ganttContainer = document.querySelector('.gantt-unified');
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
