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
        console.log('Step 1: Importing firebase-app.js...');
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js");
        console.log('Step 1 DONE: firebase-app.js loaded');
        
        console.log('Step 2: Importing firebase-firestore.js...');
        const { getFirestore, doc, setDoc, onSnapshot, getDoc } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js");
        console.log('Step 2 DONE: firebase-firestore.js loaded');
        
        console.log('Step 3: Importing firebase-auth.js...');
        const { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js");
        console.log('Step 3 DONE: firebase-auth.js loaded');
        
        console.log('Step 4: Initializing Firebase app...');
        app = initializeApp(firebaseConfig);
        console.log('Step 4 DONE: Firebase app initialized');
        
        console.log('Step 5: Getting Firestore...');
        db = getFirestore(app);
        console.log('Step 5 DONE: Firestore ready');
        
        console.log('Step 6: Getting Auth...');
        auth = getAuth(app);
        console.log('Step 6 DONE: Auth ready');
        
        firebaseEnabled = true;
        
        // Store Firebase functions globally
        window.firebaseDoc = doc;
        window.firebaseSetDoc = setDoc;
        window.firebaseOnSnapshot = onSnapshot;
        window.firebaseGetDoc = getDoc;
        window.firebaseSignIn = signInWithEmailAndPassword;
        window.firebaseSignOut = signOut;
        window.firebaseOnAuthStateChanged = onAuthStateChanged;
        
        console.log('Firebase SDK loaded successfully - ALL STEPS COMPLETE');
        return true;
    } catch (error) {
        console.error('❌ FIREBASE SDK LOAD FAILED:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
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

// Group Leads Data Structure
const defaultGroupLeads = [
    // Mechanical Group Leads (one per station)
    { id: 'mech-lead-1', username: 'mech1', password: 'mech1pass', name: '', category: 'mechanical', stationNum: 1, active: false },
    { id: 'mech-lead-2', username: 'mech2', password: 'mech2pass', name: '', category: 'mechanical', stationNum: 2, active: false },
    { id: 'mech-lead-3', username: 'mech3', password: 'mech3pass', name: '', category: 'mechanical', stationNum: 3, active: false },
    { id: 'mech-lead-4', username: 'mech4', password: 'mech4pass', name: '', category: 'mechanical', stationNum: 4, active: false },
    { id: 'mech-lead-5', username: 'mech5', password: 'mech5pass', name: '', category: 'mechanical', stationNum: 5, active: false },
    { id: 'mech-lead-6', username: 'mech6', password: 'mech6pass', name: '', category: 'mechanical', stationNum: 6, active: false },
    // Controls Group Leads (one per station)
    { id: 'ctrl-lead-1', username: 'ctrl1', password: 'ctrl1pass', name: '', category: 'controls', stationNum: 1, active: false },
    { id: 'ctrl-lead-2', username: 'ctrl2', password: 'ctrl2pass', name: '', category: 'controls', stationNum: 2, active: false },
    { id: 'ctrl-lead-3', username: 'ctrl3', password: 'ctrl3pass', name: '', category: 'controls', stationNum: 3, active: false },
    { id: 'ctrl-lead-4', username: 'ctrl4', password: 'ctrl4pass', name: '', category: 'controls', stationNum: 4, active: false },
    { id: 'ctrl-lead-5', username: 'ctrl5', password: 'ctrl5pass', name: '', category: 'controls', stationNum: 5, active: false },
    { id: 'ctrl-lead-6', username: 'ctrl6', password: 'ctrl6pass', name: '', category: 'controls', stationNum: 6, active: false }
];

let groupLeads = JSON.parse(localStorage.getItem('loopGroupLeads')) || JSON.parse(JSON.stringify(defaultGroupLeads));
let currentGroupLead = null; // Currently logged in group lead

// Project Phases Data (for Project Timeline view)
const defaultPhases = [
    {
        id: 'phase2',
        name: 'PHASE 2',
        color: '#7c3aed',
        expanded: true,
        categories: [
            {
                id: 'mechanical',
                name: 'MECHANICAL DESIGN',
                color: '#3b82f6',
                expanded: true,
                stations: [1, 2, 3, 4, 5, 6].map(stationNum => ({
                    id: `mech-station-${stationNum}`,
                    stationNum: stationNum,
                    name: `STATION ${stationNum} MECHANICAL DESIGN`,
                    color: '#60a5fa',
                    expanded: false,
                    groupLeadId: `mech-lead-${stationNum}`,
                    tasks: [
                        { id: `mech-${stationNum}-1`, name: 'Create Station Ideas', status: 'Not Started', progress: 0 },
                        { id: `mech-${stationNum}-2`, name: 'Evaluation of Ideas', status: 'Not Started', progress: 0 },
                        { id: `mech-${stationNum}-3`, name: 'Finalize', status: 'Not Started', progress: 0 },
                        { id: `mech-${stationNum}-4`, name: 'Integrate into Overall', status: 'Not Started', progress: 0 },
                        { id: `mech-${stationNum}-5`, name: 'Refine Concept', status: 'Not Started', progress: 0 }
                    ]
                }))
            },
            {
                id: 'controls',
                name: 'CONTROLS DESIGN',
                color: '#10b981',
                expanded: true,
                stations: [1, 2, 3, 4, 5, 6].map(stationNum => ({
                    id: `ctrl-station-${stationNum}`,
                    stationNum: stationNum,
                    name: `STATION ${stationNum} CONTROLS DESIGN`,
                    color: '#34d399',
                    expanded: false,
                    groupLeadId: `ctrl-lead-${stationNum}`,
                    tasks: [
                        { id: `ctrl-${stationNum}-1`, name: 'Control System Architecture', status: 'Not Started', progress: 0 },
                        { id: `ctrl-${stationNum}-2`, name: 'I/O Mapping', status: 'Not Started', progress: 0 },
                        { id: `ctrl-${stationNum}-3`, name: 'PLC Programming', status: 'Not Started', progress: 0 },
                        { id: `ctrl-${stationNum}-4`, name: 'HMI Design', status: 'Not Started', progress: 0 },
                        { id: `ctrl-${stationNum}-5`, name: 'Integration & Testing', status: 'Not Started', progress: 0 }
                    ]
                }))
            }
        ]
    }
];

let projectPhases = JSON.parse(localStorage.getItem('loopProjectPhases')) || JSON.parse(JSON.stringify(defaultPhases));

// Migration: Ensure all stations have groupLeadId
(function migrateProjectPhases() {
    let needsSave = false;
    projectPhases.forEach(phase => {
        phase.categories.forEach(category => {
            category.stations.forEach(station => {
                if (!station.groupLeadId) {
                    // Assign groupLeadId based on category and station number
                    if (category.id === 'mechanical') {
                        station.groupLeadId = `mech-lead-${station.stationNum}`;
                    } else if (category.id === 'controls') {
                        station.groupLeadId = `ctrl-lead-${station.stationNum}`;
                    }
                    needsSave = true;
                }
            });
        });
    });
    if (needsSave) {
        localStorage.setItem('loopProjectPhases', JSON.stringify(projectPhases));
        console.log('Migrated projectPhases to include groupLeadId');
    }
})();

// Current state
let currentStationId = null;
let zoomLevel = 100; // percentage

// ============================================
// FIREBASE DATA MANAGEMENT
// ============================================

async function initializeFirebase() {
    // Set a timeout - if Firebase takes too long, use localStorage
    // GitHub Pages can be slower, so give it more time
    const FIREBASE_TIMEOUT = 30000; // 30 seconds max for slow connections
    let timeoutId;
    
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error('Firebase connection timeout - using offline mode'));
        }, FIREBASE_TIMEOUT);
    });
    
    try {
        showLoadingState();
        
        // Race between Firebase init and timeout
        await Promise.race([
            (async () => {
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
                
                clearTimeout(timeoutId);
                console.log('Firebase connected successfully');
            })(),
            timeoutPromise
        ]);
        
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ FIREBASE INIT ERROR:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        
        // Show specific error to user
        if (error.message.includes('timeout')) {
            showError('Connection timeout - using offline mode');
        } else {
            showError('Firebase error: ' + error.message);
        }
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
    const groupLeadBtn = document.getElementById('groupLead-login-btn');
    
    if (isAdmin) {
        adminBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        adminIndicator.style.display = 'flex';
        // Hide group lead login when admin is logged in
        if (groupLeadBtn) groupLeadBtn.style.display = 'none';
        // Clear any group lead session when admin logs in
        currentGroupLead = null;
        updateGroupLeadUI();
        console.log('Admin mode enabled');
    } else {
        adminBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        adminIndicator.style.display = 'none';
        // Show group lead login only if not logged in as group lead
        if (groupLeadBtn && !currentGroupLead) {
            groupLeadBtn.style.display = 'flex';
        }
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
    // Don't show if already visible
    if (document.getElementById('firebase-loader')) return;
    
    const loader = document.createElement('div');
    loader.id = 'firebase-loader';
    loader.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(13, 17, 23, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        z-index: 10000;
    `;
    loader.innerHTML = `
        <div style="width: 50px; height: 50px; border: 3px solid #30363d; border-top-color: #00d4aa; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div style="color: #8b949e; font-size: 1rem;">Connecting to database...</div>
        <div style="color: #6e7681; font-size: 0.8rem;">First load may take up to 30 seconds</div>
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
    if (viewId === 'timeline-view') renderProjectTimeline();
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
    if (view === 'timeline') renderProjectTimeline();
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

// ============================================
// PROJECT TIMELINE VIEW (Phase-based Gantt)
// ============================================

const PHASE_DAY_WIDTH = 24;
const PHASE_TIMELINE_WEEKS = 16; // 16 weeks = ~4 months

function renderProjectTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    // Calculate timeline range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timelineStart = new Date(today);
    timelineStart.setDate(timelineStart.getDate() - 7); // Start 1 week before today
    
    let html = '<div class="phase-gantt-container">';
    
    // Build unified table like the task tracking view
    html += '<div class="phase-gantt-unified">';
    
    // Header row
    html += '<div class="phase-gantt-header-row">';
    html += '<div class="phase-gantt-info-header">';
    html += '<div class="pg-col pg-col-name">Phase / Category / Task</div>';
    html += '<div class="pg-col pg-col-status">Status</div>';
    html += '<div class="pg-col pg-col-progress">Progress</div>';
    html += '</div>';
    
    // Timeline header with weeks
    html += '<div class="phase-gantt-timeline-header">';
    for (let w = 0; w < PHASE_TIMELINE_WEEKS; w++) {
        const weekStart = new Date(timelineStart);
        weekStart.setDate(weekStart.getDate() + (w * 7));
        const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const isCurrentWeek = w === 1;
        
        html += `<div class="pg-week-header ${isCurrentWeek ? 'current' : ''}">
            <span class="pg-week-label">W${w + 1}</span>
            <span class="pg-week-date">${weekLabel}</span>
        </div>`;
    }
    html += '</div></div>';
    
    // Data rows
    projectPhases.forEach(phase => {
        const phaseProgress = calculatePhaseProgress(phase);
        
        // Phase row
        html += `<div class="phase-gantt-row phase-row ${phase.expanded ? 'expanded' : ''}" data-phase="${phase.id}">`;
        html += '<div class="phase-gantt-info-cells">';
        html += `<div class="pg-col pg-col-name pg-phase-name">
            <button class="pg-expand-btn ${phase.expanded ? 'expanded' : ''}" onclick="togglePhase('${phase.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
            <span class="pg-phase-icon" style="color: ${phase.color}">◆</span>
            <strong style="color: ${phase.color}" class="editable-name" ${isAdmin ? `contenteditable="true" onblur="updatePhaseName('${phase.id}', this.textContent)"` : ''}>${phase.name}</strong>
            ${isAdmin ? `<button class="pg-add-btn" onclick="addCategory('${phase.id}')" title="Add Category">+</button>` : ''}
        </div>`;
        html += `<div class="pg-col pg-col-status"><span class="phase-badge" style="background: ${phase.color}20; color: ${phase.color}">PHASE</span></div>`;
        html += `<div class="pg-col pg-col-progress">
            <div class="pg-progress-bar"><div class="pg-progress-fill" style="width: ${phaseProgress}%; background: ${phase.color}"></div></div>
            <span class="pg-progress-text">${phaseProgress}%</span>
        </div>`;
        html += '</div>';
        
        // Phase timeline bar
        html += '<div class="phase-gantt-timeline-cells">';
        for (let w = 0; w < PHASE_TIMELINE_WEEKS; w++) {
            html += `<div class="pg-week-cell ${w === 1 ? 'current' : ''}"></div>`;
        }
        // Phase bar spans entire timeline
        html += `<div class="pg-gantt-bar pg-phase-bar" style="left: 0; width: ${PHASE_TIMELINE_WEEKS * 7 * PHASE_DAY_WIDTH - 4}px; background: linear-gradient(135deg, ${phase.color}, ${phase.color}88);">${phase.name}</div>`;
        html += '</div></div>';
        
        // Categories and stations
        if (phase.expanded) {
            phase.categories.forEach((category, catIndex) => {
                const categoryProgress = calculateCategoryProgress(category);
                const catStartWeek = catIndex === 0 ? 0 : 8; // Mechanical starts week 0, Controls starts week 8
                const catDurationWeeks = 8;
                
                // Category row
                html += `<div class="phase-gantt-row category-row ${category.expanded ? 'expanded' : ''}" data-category="${category.id}">`;
                html += '<div class="phase-gantt-info-cells">';
                html += `<div class="pg-col pg-col-name pg-category-name">
                    <button class="pg-expand-btn ${category.expanded ? 'expanded' : ''}" onclick="toggleCategory('${phase.id}', '${category.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                    <span class="pg-category-icon" style="color: ${category.color}">▸</span>
                    <span style="color: ${category.color}" class="editable-name" ${isAdmin ? `contenteditable="true" onblur="updateCategoryName('${phase.id}', '${category.id}', this.textContent)"` : ''}>${category.name}</span>
                    ${isAdmin ? `<button class="pg-add-btn" onclick="addTimelineStation('${phase.id}', '${category.id}')" title="Add Station">+</button>` : ''}
                    ${isAdmin ? `<button class="pg-delete-btn" onclick="deleteCategory('${phase.id}', '${category.id}')" title="Delete Category">×</button>` : ''}
                </div>`;
                html += `<div class="pg-col pg-col-status"><span class="category-badge" style="background: ${category.color}20; color: ${category.color}">CATEGORY</span></div>`;
                html += `<div class="pg-col pg-col-progress">
                    <div class="pg-progress-bar"><div class="pg-progress-fill" style="width: ${categoryProgress}%; background: ${category.color}"></div></div>
                    <span class="pg-progress-text">${categoryProgress}%</span>
                </div>`;
                html += '</div>';
                
                // Category timeline bar
                html += '<div class="phase-gantt-timeline-cells">';
                for (let w = 0; w < PHASE_TIMELINE_WEEKS; w++) {
                    html += `<div class="pg-week-cell ${w === 1 ? 'current' : ''}"></div>`;
                }
                html += `<div class="pg-gantt-bar pg-category-bar" style="left: ${catStartWeek * 7 * PHASE_DAY_WIDTH}px; width: ${catDurationWeeks * 7 * PHASE_DAY_WIDTH - 4}px; background: linear-gradient(135deg, ${category.color}, ${category.color}88);">${category.name}</div>`;
                html += '</div></div>';
                
                // Stations
                                if (category.expanded) {
                                    category.stations.forEach((station, stationIndex) => {
                                        const stationProgress = calculateStationTasksProgress(station);
                                        const stationStartWeek = catStartWeek + Math.floor(stationIndex * 1.2);
                                        const stationDurationWeeks = 2;
                                        
                                        // Get group lead for this station
                                        const groupLead = groupLeads.find(gl => gl.id === station.groupLeadId);
                                        const hasGroupLead = groupLead && groupLead.active && groupLead.name;
                                        const isCurrentLeadStation = currentGroupLead && currentGroupLead.id === station.groupLeadId;
                                        
                                        // Station row
                                        html += `<div class="phase-gantt-row station-row ${station.expanded ? 'expanded' : ''} ${isCurrentLeadStation ? 'my-station' : ''}" data-station="${station.id}">`;
                                        html += '<div class="phase-gantt-info-cells">';
                                        html += `<div class="pg-col pg-col-name pg-station-name">
                                            <button class="pg-expand-btn ${station.expanded ? 'expanded' : ''}" onclick="toggleTimelineStation('${phase.id}', '${category.id}', '${station.id}')">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                                            </button>
                                            <span class="pg-station-number" style="background: ${station.color}">S${station.stationNum}</span>
                                            <span class="editable-name" ${isAdmin ? `contenteditable="true" onblur="updateTimelineStationName('${phase.id}', '${category.id}', '${station.id}', this.textContent)"` : ''}>${station.name}</span>
                                            ${hasGroupLead ? `<span class="pg-group-lead-badge" title="Group Lead: ${groupLead.name}">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;">
                                                    <circle cx="12" cy="7" r="4"/>
                                                    <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/>
                                                </svg>
                                                ${groupLead.name}
                                            </span>` : ''}
                                            ${isCurrentLeadStation ? '<span class="pg-my-station-badge">Your Station</span>' : ''}
                                            ${isAdmin ? `<button class="pg-add-btn" onclick="addTimelineTask('${phase.id}', '${category.id}', '${station.id}')" title="Add Task">+</button>` : ''}
                                            ${isAdmin ? `<button class="pg-delete-btn" onclick="deleteTimelineStation('${phase.id}', '${category.id}', '${station.id}')" title="Delete Station">×</button>` : ''}
                                        </div>`;
                                        html += `<div class="pg-col pg-col-status">
                                            <span class="status-badge ${getStatusClass(stationProgress === 100 ? 'Complete' : stationProgress > 0 ? 'In Progress' : 'Not Started')}">${stationProgress === 100 ? 'Complete' : stationProgress > 0 ? 'In Progress' : 'Not Started'}</span>
                                        </div>`;
                                        html += `<div class="pg-col pg-col-progress">
                                            <div class="pg-progress-bar"><div class="pg-progress-fill" style="width: ${stationProgress}%; background: ${station.color}"></div></div>
                                            <span class="pg-progress-text">${stationProgress}%</span>
                                        </div>`;
                                        html += '</div>';
                        
                        // Station timeline bar
                        html += '<div class="phase-gantt-timeline-cells">';
                        for (let w = 0; w < PHASE_TIMELINE_WEEKS; w++) {
                            html += `<div class="pg-week-cell ${w === 1 ? 'current' : ''}"></div>`;
                        }
                        html += `<div class="pg-gantt-bar pg-station-bar" style="left: ${stationStartWeek * 7 * PHASE_DAY_WIDTH}px; width: ${stationDurationWeeks * 7 * PHASE_DAY_WIDTH - 4}px; background: linear-gradient(135deg, ${station.color}, ${station.color}aa);">${station.name}</div>`;
                        html += '</div></div>';
                        
                        // Tasks
                        if (station.expanded) {
                            station.tasks.forEach((task, taskIndex) => {
                                const taskStartWeek = stationStartWeek + Math.floor(taskIndex * 0.3);
                                const taskDurationDays = 5;
                                
                                // Check if current user can edit this station
                                const canEdit = canEditStation(category.id, station.id);
                                
                                // Task row
                                html += `<div class="phase-gantt-row task-row ${canEdit ? 'editable' : ''}" data-task="${task.id}">`;
                                html += '<div class="phase-gantt-info-cells">';
                                html += `<div class="pg-col pg-col-name pg-task-name">
                                    <span class="pg-task-bullet" style="background: ${station.color}"></span>
                                    <span class="editable-name" ${isAdmin ? `contenteditable="true" onblur="updateTimelineTaskName('${phase.id}', '${category.id}', '${station.id}', '${task.id}', this.textContent)"` : ''}>${task.name}</span>
                                    ${isAdmin ? `<button class="pg-delete-btn small" onclick="deleteTimelineTask('${phase.id}', '${category.id}', '${station.id}', '${task.id}')" title="Delete Task">×</button>` : ''}
                                </div>`;
                                html += `<div class="pg-col pg-col-status">
                                    <select class="pg-status-select" onchange="updatePhaseTaskStatus('${phase.id}', '${category.id}', '${station.id}', '${task.id}', this.value)" ${canEdit ? '' : 'disabled'}>
                                        <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                                        <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                                    </select>
                                </div>`;
                                html += `<div class="pg-col pg-col-progress">
                                    <input type="range" min="0" max="100" value="${task.progress}" class="pg-progress-slider" 
                                        onchange="updatePhaseTaskProgress('${phase.id}', '${category.id}', '${station.id}', '${task.id}', this.value)" ${canEdit ? '' : 'disabled'}>
                                    <span class="pg-progress-text">${task.progress}%</span>
                                </div>`;
                                html += '</div>';
                                
                                // Task timeline bar
                                html += '<div class="phase-gantt-timeline-cells">';
                                for (let w = 0; w < PHASE_TIMELINE_WEEKS; w++) {
                                    html += `<div class="pg-week-cell ${w === 1 ? 'current' : ''}"></div>`;
                                }
                                const taskBarWidth = Math.max(taskDurationDays * PHASE_DAY_WIDTH, 60);
                                const taskOpacity = task.status === 'Complete' ? '1' : task.status === 'In Progress' ? '0.85' : '0.5';
                                html += `<div class="pg-gantt-bar pg-task-bar" style="left: ${taskStartWeek * 7 * PHASE_DAY_WIDTH + (taskIndex * 20)}px; width: ${taskBarWidth}px; background: ${station.color}; opacity: ${taskOpacity};" title="${task.name} - ${task.progress}%">${task.progress}%</div>`;
                                html += '</div></div>';
                            });
                        }
                    });
                }
            });
        }
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

function calculatePhaseProgress(phase) {
    let totalProgress = 0;
    let totalTasks = 0;
    
    phase.categories.forEach(cat => {
        cat.stations.forEach(station => {
            station.tasks.forEach(task => {
                totalProgress += task.progress;
                totalTasks++;
            });
        });
    });
    
    return totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
}

function calculateCategoryProgress(category) {
    let totalProgress = 0;
    let totalTasks = 0;
    
    category.stations.forEach(station => {
        station.tasks.forEach(task => {
            totalProgress += task.progress;
            totalTasks++;
        });
    });
    
    return totalTasks > 0 ? Math.round(totalProgress / totalTasks) : 0;
}

function calculateStationTasksProgress(station) {
    if (!station.tasks || station.tasks.length === 0) return 0;
    const total = station.tasks.reduce((sum, task) => sum + task.progress, 0);
    return Math.round(total / station.tasks.length);
}

function togglePhase(phaseId) {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        phase.expanded = !phase.expanded;
        saveProjectPhases();
        renderProjectTimeline();
    }
}

function toggleCategory(phaseId, categoryId) {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            category.expanded = !category.expanded;
            saveProjectPhases();
            renderProjectTimeline();
        }
    }
}

function toggleTimelineStation(phaseId, categoryId, stationId) {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                station.expanded = !station.expanded;
                saveProjectPhases();
                renderProjectTimeline();
            }
        }
    }
}

function updatePhaseTaskStatus(phaseId, categoryId, stationId, taskId, newStatus) {
    // Check permissions
    if (!canEditStation(categoryId, stationId)) {
        showError('You do not have permission to edit this task');
        renderProjectTimeline(); // Re-render to reset the dropdown
        return;
    }
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                const task = station.tasks.find(t => t.id === taskId);
                if (task) {
                    task.status = newStatus;
                    // Auto-set progress based on status
                    if (newStatus === 'Complete') task.progress = 100;
                    else if (newStatus === 'Not Started') task.progress = 0;
                    saveProjectPhases();
                    renderProjectTimeline();
                    showSuccess('Task status updated');
                }
            }
        }
    }
}

function updatePhaseTaskProgress(phaseId, categoryId, stationId, taskId, newProgress) {
    // Check permissions
    if (!canEditStation(categoryId, stationId)) {
        showError('You do not have permission to edit this task');
        renderProjectTimeline(); // Re-render to reset the slider
        return;
    }
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                const task = station.tasks.find(t => t.id === taskId);
                if (task) {
                    task.progress = parseInt(newProgress);
                    // Auto-update status based on progress
                    if (task.progress === 100) task.status = 'Complete';
                    else if (task.progress > 0) task.status = 'In Progress';
                    else task.status = 'Not Started';
                    saveProjectPhases();
                    renderProjectTimeline();
                }
            }
        }
    }
}

function expandAllPhases() {
    projectPhases.forEach(phase => {
        phase.expanded = true;
        phase.categories.forEach(cat => {
            cat.expanded = true;
            cat.stations.forEach(station => {
                station.expanded = true;
            });
        });
    });
    saveProjectPhases();
    renderProjectTimeline();
}

function collapseAllPhases() {
    projectPhases.forEach(phase => {
        phase.expanded = false;
        phase.categories.forEach(cat => {
            cat.expanded = false;
            cat.stations.forEach(station => {
                station.expanded = false;
            });
        });
    });
    saveProjectPhases();
    renderProjectTimeline();
}

function saveProjectPhases() {
    localStorage.setItem('loopProjectPhases', JSON.stringify(projectPhases));
}

// ============================================
// PROJECT TIMELINE EDITING FUNCTIONS (Admin Only)
// ============================================

function updatePhaseName(phaseId, newName) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase && newName.trim()) {
        phase.name = newName.trim();
        saveProjectPhases();
        showSuccess('Phase name updated');
    }
}

function updateCategoryName(phaseId, categoryId, newName) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category && newName.trim()) {
            category.name = newName.trim();
            saveProjectPhases();
            showSuccess('Category name updated');
        }
    }
}

function updateTimelineStationName(phaseId, categoryId, stationId, newName) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station && newName.trim()) {
                station.name = newName.trim();
                saveProjectPhases();
                showSuccess('Station name updated');
            }
        }
    }
}

function updateTimelineTaskName(phaseId, categoryId, stationId, taskId, newName) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                const task = station.tasks.find(t => t.id === taskId);
                if (task && newName.trim()) {
                    task.name = newName.trim();
                    saveProjectPhases();
                    showSuccess('Task name updated');
                }
            }
        }
    }
}

function addCategory(phaseId) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const newId = 'cat-' + Date.now();
        phase.categories.push({
            id: newId,
            name: 'New Category',
            color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'),
            expanded: true,
            stations: []
        });
        saveProjectPhases();
        renderProjectTimeline();
        showSuccess('Category added');
    }
}

function deleteCategory(phaseId, categoryId) {
    if (!isAdmin) return;
    if (!confirm('Delete this category and all its stations/tasks?')) return;
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        phase.categories = phase.categories.filter(c => c.id !== categoryId);
        saveProjectPhases();
        renderProjectTimeline();
        showSuccess('Category deleted');
    }
}

function addTimelineStation(phaseId, categoryId) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const newStationNum = category.stations.length + 1;
            const newId = 'station-' + Date.now();
            category.stations.push({
                id: newId,
                stationNum: newStationNum,
                name: `Station ${newStationNum}`,
                color: category.color,
                expanded: true,
                groupLeadId: null,
                tasks: [
                    { id: newId + '-t1', name: 'Task 1', status: 'Not Started', progress: 0 }
                ]
            });
            saveProjectPhases();
            renderProjectTimeline();
            showSuccess('Station added');
        }
    }
}

function deleteTimelineStation(phaseId, categoryId, stationId) {
    if (!isAdmin) return;
    if (!confirm('Delete this station and all its tasks?')) return;
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            category.stations = category.stations.filter(s => s.id !== stationId);
            // Renumber remaining stations
            category.stations.forEach((s, i) => s.stationNum = i + 1);
            saveProjectPhases();
            renderProjectTimeline();
            showSuccess('Station deleted');
        }
    }
}

function addTimelineTask(phaseId, categoryId, stationId) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                const newId = 'task-' + Date.now();
                station.tasks.push({
                    id: newId,
                    name: 'New Task',
                    status: 'Not Started',
                    progress: 0
                });
                saveProjectPhases();
                renderProjectTimeline();
                showSuccess('Task added');
            }
        }
    }
}

function deleteTimelineTask(phaseId, categoryId, stationId, taskId) {
    if (!isAdmin) return;
    if (!confirm('Delete this task?')) return;
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                station.tasks = station.tasks.filter(t => t.id !== taskId);
                saveProjectPhases();
                renderProjectTimeline();
                showSuccess('Task deleted');
            }
        }
    }
}

// Expose editing functions to window
window.updatePhaseName = updatePhaseName;
window.updateCategoryName = updateCategoryName;
window.updateTimelineStationName = updateTimelineStationName;
window.updateTimelineTaskName = updateTimelineTaskName;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addTimelineStation = addTimelineStation;
window.deleteTimelineStation = deleteTimelineStation;
window.addTimelineTask = addTimelineTask;
window.deleteTimelineTask = deleteTimelineTask;

function exportTimelinePDF() {
    showSuccess('Generating timeline PDF...');
    
    // Expand all for export
    const originalState = JSON.stringify(projectPhases);
    expandAllPhases();
    
    setTimeout(() => {
        window.print();
        // Restore state
        projectPhases = JSON.parse(originalState);
        renderProjectTimeline();
    }, 500);
}

window.togglePhase = togglePhase;
window.toggleCategory = toggleCategory;
window.toggleTimelineStation = toggleTimelineStation;
window.updatePhaseTaskStatus = updatePhaseTaskStatus;
window.updatePhaseTaskProgress = updatePhaseTaskProgress;
window.expandAllPhases = expandAllPhases;
window.collapseAllPhases = collapseAllPhases;
window.exportTimelinePDF = exportTimelinePDF;

// ============================================
// GROUP LEAD MANAGEMENT
// ============================================

function saveGroupLeads() {
    localStorage.setItem('loopGroupLeads', JSON.stringify(groupLeads));
}

function canEditStation(categoryId, stationId) {
    // Admin can edit everything
    if (isAdmin) {
        console.log('canEditStation: Admin has full access');
        return true;
    }
    
    // Group lead can only edit their assigned station
    if (currentGroupLead) {
        const station = findStationInPhases(categoryId, stationId);
        console.log('canEditStation check:', {
            categoryId,
            stationId,
            stationFound: !!station,
            stationGroupLeadId: station?.groupLeadId,
            currentGroupLeadId: currentGroupLead.id,
            match: station?.groupLeadId === currentGroupLead.id
        });
        if (station && station.groupLeadId === currentGroupLead.id) {
            return true;
        }
    }
    
    return false;
}

function findStationInPhases(categoryId, stationId) {
    for (const phase of projectPhases) {
        for (const category of phase.categories) {
            if (category.id === categoryId) {
                return category.stations.find(s => s.id === stationId);
            }
        }
    }
    return null;
}

function showGroupLeadLoginModal() {
    let modal = document.getElementById('groupLead-login-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'groupLead-login-modal';
        modal.className = 'modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) closeModal('groupLead-login-modal');
        };
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Group Lead Login</h2>
                <button class="modal-close" onclick="closeModal('groupLead-login-modal')">&times;</button>
            </div>
            <form id="groupLead-login-form" class="modal-body" onsubmit="groupLeadLogin(event)">
                <div class="form-group">
                    <label for="gl-username">Username</label>
                    <input type="text" id="gl-username" required placeholder="Enter your username">
                </div>
                <div class="form-group">
                    <label for="gl-password">Password</label>
                    <input type="password" id="gl-password" required placeholder="Enter your password">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="closeModal('groupLead-login-modal')">Cancel</button>
                    <button type="submit" class="btn-primary">Login</button>
                </div>
            </form>
        </div>
    `;
    
    openModal('groupLead-login-modal');
}

function groupLeadLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('gl-username').value;
    const password = document.getElementById('gl-password').value;
    
    console.log('Group Lead Login attempt:', { username, groupLeadsCount: groupLeads.length });
    console.log('Available group leads:', groupLeads.map(gl => ({ id: gl.id, username: gl.username, active: gl.active })));
    
    const lead = groupLeads.find(gl => gl.username === username && gl.password === password && gl.active);
    
    if (lead) {
        currentGroupLead = lead;
        console.log('Group Lead logged in:', lead);
        closeModal('groupLead-login-modal');
        updateGroupLeadUI();
        renderProjectTimeline();
        showSuccess(`Welcome, ${lead.name || lead.username}! You can now update Station ${lead.stationNum} ${lead.category === 'mechanical' ? 'Mechanical' : 'Controls'} tasks.`);
    } else {
        console.log('Group Lead login failed - no matching active account');
        showError('Invalid credentials or account not active');
    }
}

function groupLeadLogout() {
    currentGroupLead = null;
    updateGroupLeadUI();
    renderProjectTimeline();
    showSuccess('Logged out successfully');
}

function updateGroupLeadUI() {
    const loginBtn = document.getElementById('groupLead-login-btn');
    const indicator = document.getElementById('groupLead-indicator');
    
    if (currentGroupLead) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (indicator) {
            indicator.style.display = 'flex';
            indicator.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.3);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" style="width: 16px; height: 16px;">
                        <circle cx="12" cy="7" r="4"/>
                        <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/>
                    </svg>
                    <span style="color: #3b82f6; font-size: 0.8rem; font-weight: 600;">${currentGroupLead.name || currentGroupLead.username}</span>
                </div>
                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
                    ${currentGroupLead.category === 'mechanical' ? 'Mechanical' : 'Controls'} - Station ${currentGroupLead.stationNum}
                </div>
                <button class="btn-logout" onclick="groupLeadLogout()" style="margin-top: 8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                </button>
            `;
        }
    } else {
        if (loginBtn) loginBtn.style.display = isAdmin ? 'none' : 'flex';
        if (indicator) indicator.style.display = 'none';
    }
}

// Admin function to manage group leads
function showManageGroupLeadsModal() {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }
    
    let modal = document.getElementById('manage-leads-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'manage-leads-modal';
        modal.className = 'modal-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) closeModal('manage-leads-modal');
        };
        document.body.appendChild(modal);
    }
    
    const mechLeads = groupLeads.filter(gl => gl.category === 'mechanical');
    const ctrlLeads = groupLeads.filter(gl => gl.category === 'controls');
    
    modal.innerHTML = `
        <div class="modal manage-leads-modal">
            <div class="modal-header">
                <h2>Manage Group Leads</h2>
                <button class="modal-close" onclick="closeModal('manage-leads-modal')">&times;</button>
            </div>
            <div class="modal-body manage-leads-body">
                <div class="leads-section">
                    <h3 style="color: #3b82f6; margin-bottom: 12px;">
                        <span style="margin-right: 8px;">⚙️</span> Mechanical Design Leads
                    </h3>
                    <div class="leads-grid">
                        ${mechLeads.map(lead => `
                            <div class="lead-card ${lead.active ? 'active' : ''}" data-lead="${lead.id}">
                                <div class="lead-card-header">
                                    <span class="lead-station-badge" style="background: #3b82f6;">S${lead.stationNum}</span>
                                    <label class="lead-toggle">
                                        <input type="checkbox" ${lead.active ? 'checked' : ''} onchange="toggleGroupLead('${lead.id}', this.checked)">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="lead-card-body">
                                    <div class="lead-field">
                                        <label>Name</label>
                                        <input type="text" value="${lead.name}" placeholder="Lead name" onchange="updateGroupLead('${lead.id}', 'name', this.value)">
                                    </div>
                                    <div class="lead-field">
                                        <label>Username</label>
                                        <input type="text" value="${lead.username}" onchange="updateGroupLead('${lead.id}', 'username', this.value)">
                                    </div>
                                    <div class="lead-field">
                                        <label>Password</label>
                                        <input type="text" value="${lead.password}" onchange="updateGroupLead('${lead.id}', 'password', this.value)">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="leads-section" style="margin-top: 24px;">
                    <h3 style="color: #10b981; margin-bottom: 12px;">
                        <span style="margin-right: 8px;">🔌</span> Controls Design Leads
                    </h3>
                    <div class="leads-grid">
                        ${ctrlLeads.map(lead => `
                            <div class="lead-card ${lead.active ? 'active' : ''}" data-lead="${lead.id}">
                                <div class="lead-card-header">
                                    <span class="lead-station-badge" style="background: #10b981;">S${lead.stationNum}</span>
                                    <label class="lead-toggle">
                                        <input type="checkbox" ${lead.active ? 'checked' : ''} onchange="toggleGroupLead('${lead.id}', this.checked)">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="lead-card-body">
                                    <div class="lead-field">
                                        <label>Name</label>
                                        <input type="text" value="${lead.name}" placeholder="Lead name" onchange="updateGroupLead('${lead.id}', 'name', this.value)">
                                    </div>
                                    <div class="lead-field">
                                        <label>Username</label>
                                        <input type="text" value="${lead.username}" onchange="updateGroupLead('${lead.id}', 'username', this.value)">
                                    </div>
                                    <div class="lead-field">
                                        <label>Password</label>
                                        <input type="text" value="${lead.password}" onchange="updateGroupLead('${lead.id}', 'password', this.value)">
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" onclick="closeModal('manage-leads-modal')">Done</button>
            </div>
        </div>
    `;
    
    openModal('manage-leads-modal');
}

function toggleGroupLead(leadId, active) {
    const lead = groupLeads.find(gl => gl.id === leadId);
    if (lead) {
        lead.active = active;
        saveGroupLeads();
        showSuccess(`Group lead ${active ? 'activated' : 'deactivated'}`);
    }
}

function updateGroupLead(leadId, field, value) {
    const lead = groupLeads.find(gl => gl.id === leadId);
    if (lead) {
        lead[field] = value;
        saveGroupLeads();
    }
}

window.showGroupLeadLoginModal = showGroupLeadLoginModal;
window.groupLeadLogin = groupLeadLogin;
window.groupLeadLogout = groupLeadLogout;
window.showManageGroupLeadsModal = showManageGroupLeadsModal;
window.toggleGroupLead = toggleGroupLead;
window.updateGroupLead = updateGroupLead;

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
            <div class="team-card-actions admin-actions" onclick="event.stopPropagation()">
                <button onclick="editTeamMember(${index}); event.stopPropagation();">Edit</button>
                <button class="delete" onclick="deleteTeamMember(${index}); event.stopPropagation();">Remove</button>
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
            <div class="team-card" style="--member-color: ${member.color}" onclick="openMemberTasks('${member.name.replace(/'/g, "\\'")}', ${index})">
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
                <div class="team-card-click-hint">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                    Click to view tasks
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

// Member Tasks View
let currentMemberName = null;

function openMemberTasks(memberName, memberIndex) {
    currentMemberName = memberName;
    const member = teamMembers[memberIndex];
    
    // Get all tasks assigned to this member
    const memberTasks = [];
    stations.forEach(station => {
        station.tasks.forEach(task => {
            if (task.assignedTo === memberName) {
                memberTasks.push({
                    ...task,
                    stationId: station.id,
                    stationName: station.name,
                    stationColor: station.color
                });
        }
    });
});

    // Calculate stats
    const totalTasks = memberTasks.length;
    const completedTasks = memberTasks.filter(t => t.status === 'Complete').length;
    const inProgressTasks = memberTasks.filter(t => t.status === 'In Progress').length;
    const totalHours = memberTasks.reduce((sum, t) => sum + (t.estHours || 0), 0);
    const actualHours = memberTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const progressPercent = totalHours > 0 ? Math.round((actualHours / totalHours) * 100) : 0;
    
    // Build tasks table
    let tasksHTML = '';
    if (memberTasks.length === 0) {
        tasksHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:48px;height:48px;margin-bottom:16px;opacity:0.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            <p>No tasks assigned to this member</p>
        </div>`;
    } else {
        tasksHTML = `
        <div class="member-tasks-list">
            ${memberTasks.map(task => {
                const statusClass = getStatusClass(task.status);
                const taskProgress = task.estHours > 0 ? Math.round((task.actualHours / task.estHours) * 100) : 0;
                
                return `
                <div class="member-task-card" data-station="${task.stationId}" data-task="${task.id}">
                    <div class="member-task-header">
                        <div class="member-task-station" style="color: ${task.stationColor}">
                            <span style="display:inline-block;width:8px;height:8px;background:${task.stationColor};border-radius:2px;margin-right:6px"></span>
                            ${task.stationName}
                        </div>
                        <span class="status-badge ${statusClass}">${task.status}</span>
                    </div>
                    <h4 class="member-task-name">${task.name}</h4>
                    <div class="member-task-dates">
                        <span>${formatDateDisplay(task.startDate)}</span>
                        <span>→</span>
                        <span>${formatDateDisplay(task.endDate)}</span>
                    </div>
                    <div class="member-task-progress-section">
                        <div class="member-task-hours">
                            <label>Hours: </label>
                            <input type="number" min="0" value="${task.actualHours || 0}" 
                                onchange="updateMemberTaskHours('${task.stationId}', '${task.id}', this.value)"
                                style="width:60px"> / ${task.estHours || 0}h
                        </div>
                        <div class="member-task-progress-bar">
                            <div class="progress-fill" style="width:${Math.min(taskProgress, 100)}%;background:${task.stationColor}"></div>
                        </div>
                        <span class="progress-percent">${taskProgress}%</span>
                    </div>
                    <div class="member-task-status-update">
                        <label>Status:</label>
                        <select onchange="updateMemberTaskStatus('${task.stationId}', '${task.id}', this.value)">
                            <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                            <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            <option value="Delayed" ${task.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                        </select>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }
    
    // Create modal content
    const modalContent = `
        <div class="member-tasks-modal-content">
            <div class="member-tasks-header" style="border-left: 4px solid ${member.color}">
                <div class="member-avatar-large" style="background: ${member.color}">${getInitials(memberName)}</div>
                <div class="member-header-info">
                    <h2>${memberName}</h2>
                    <span class="member-role-badge">${member.role}</span>
                </div>
                <button class="modal-close" onclick="closeModal('member-tasks-modal')">&times;</button>
            </div>
            
            <div class="member-tasks-stats">
                <div class="member-stat-card">
                    <div class="member-stat-value">${totalTasks}</div>
                    <div class="member-stat-label">Total Tasks</div>
                </div>
                <div class="member-stat-card complete">
                    <div class="member-stat-value">${completedTasks}</div>
                    <div class="member-stat-label">Completed</div>
                </div>
                <div class="member-stat-card in-progress">
                    <div class="member-stat-value">${inProgressTasks}</div>
                    <div class="member-stat-label">In Progress</div>
                </div>
                <div class="member-stat-card">
                    <div class="member-stat-value">${actualHours}/${totalHours}h</div>
                    <div class="member-stat-label">Hours</div>
                </div>
                <div class="member-stat-card">
                    <div class="member-stat-value" style="color: ${member.color}">${progressPercent}%</div>
                    <div class="member-stat-label">Progress</div>
                </div>
            </div>
            
            <div class="member-tasks-body">
                <h3>Assigned Tasks</h3>
                ${tasksHTML}
            </div>
        </div>
    `;
    
    // Get or create modal
    let modal = document.getElementById('member-tasks-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'member-tasks-modal';
        modal.className = 'modal-overlay member-tasks-overlay';
        modal.onclick = (e) => {
            if (e.target === modal) closeModal('member-tasks-modal');
        };
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `<div class="modal member-tasks-modal-wrapper">${modalContent}</div>`;
    openModal('member-tasks-modal');
}

async function updateMemberTaskStatus(stationId, taskId, newStatus) {
    console.log('updateMemberTaskStatus called:', { stationId, taskId, newStatus });
    console.log('Current stations:', JSON.stringify(stations.map(s => ({ id: s.id, name: s.name }))));
    
    // Find station - handle both string and number IDs
    const station = stations.find(s => String(s.id) === String(stationId));
    if (!station) {
        console.error('Station not found:', stationId);
        console.log('Available station IDs:', stations.map(s => s.id));
        showError('Station not found');
        return;
    }
    
    // Find task - handle both string and number IDs
    const task = station.tasks.find(t => String(t.id) === String(taskId));
    if (!task) {
        console.error('Task not found:', taskId);
        console.log('Available task IDs in station:', station.tasks.map(t => t.id));
        showError('Task not found');
        return;
    }
    
    // Update the task
    task.status = newStatus;
    
    // Auto-update progress based on status
    if (newStatus === 'Complete') {
        task.progress = 100;
    } else if (newStatus === 'Not Started') {
        task.progress = 0;
    }
    
    console.log('Task updated:', task);
    
    // Save to localStorage and Firebase
    localStorage.setItem('loopStations', JSON.stringify(stations));
    
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project-stations'), {
                stations: stations,
                lastUpdated: new Date().toISOString()
            });
            console.log('Saved to Firebase');
        } catch (error) {
            console.error('Firebase save error:', error);
        }
    }
    
    showSuccess(`Task status updated to "${newStatus}"`);
    
    // Refresh views
    renderGanttView();
    renderDashboard();
    
    // Refresh the modal
    if (currentMemberName) {
        const memberIndex = teamMembers.findIndex(m => m.name === currentMemberName);
        if (memberIndex >= 0) {
            openMemberTasks(currentMemberName, memberIndex);
        }
    }
}

async function updateMemberTaskHours(stationId, taskId, newHours) {
    console.log('updateMemberTaskHours called:', { stationId, taskId, newHours });
    
    // Find station - handle both string and number IDs
    const station = stations.find(s => String(s.id) === String(stationId));
    if (!station) {
        console.error('Station not found:', stationId);
        console.log('Available station IDs:', stations.map(s => s.id));
        showError('Station not found');
        return;
    }
    
    // Find task - handle both string and number IDs
    const task = station.tasks.find(t => String(t.id) === String(taskId));
    if (!task) {
        console.error('Task not found:', taskId);
        console.log('Available task IDs in station:', station.tasks.map(t => t.id));
        showError('Task not found');
        return;
    }
    
    task.actualHours = parseFloat(newHours) || 0;
    console.log('Task hours updated:', task);
    
    // Save to localStorage and Firebase
    localStorage.setItem('loopStations', JSON.stringify(stations));
    
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project-stations'), {
                stations: stations,
                lastUpdated: new Date().toISOString()
            });
            console.log('Saved to Firebase');
        } catch (error) {
            console.error('Firebase save error:', error);
        }
    }
    
    showSuccess('Hours updated');
    
    // Refresh views
    renderGanttView();
    renderDashboard();
    
    // Refresh the modal
    if (currentMemberName) {
        const memberIndex = teamMembers.findIndex(m => m.name === currentMemberName);
        if (memberIndex >= 0) {
            openMemberTasks(currentMemberName, memberIndex);
        }
    }
}

window.openMemberTasks = openMemberTasks;
window.updateMemberTaskStatus = updateMemberTaskStatus;
window.updateMemberTaskHours = updateMemberTaskHours;

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
        
        // Load group leads
        groupLeads = JSON.parse(localStorage.getItem('loopGroupLeads')) || JSON.parse(JSON.stringify(defaultGroupLeads));
        
        // Render initial views
        renderAllViews();
        console.log('Initial render complete');
        
        // Initialize group lead UI
        updateGroupLeadUI();
        
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
