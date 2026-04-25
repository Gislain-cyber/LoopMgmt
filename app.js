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
    { name: "Bander Bakalka", role: "PM", color: "#ff5757", email: "", targetHours: 40, username: "bander", password: "bander123" },
    { name: "Jon Klomfass", role: "Lead", color: "#ffbd59", email: "", targetHours: 40, username: "jon", password: "jon123" },
    { name: "Gislain Hotcho Nkenga", role: "Lead", color: "#ffd666", email: "", targetHours: 40, username: "gislain", password: "gislain123" },
    { name: "Cirex Peroche", role: "Member", color: "#64b5f6", email: "", targetHours: 40, username: "cirex", password: "cirex123" },
    { name: "Davis Oliver", role: "Member", color: "#81c784", email: "", targetHours: 40, username: "davis", password: "davis123" },
    { name: "Josh Kavanagh", role: "Member", color: "#ba68c8", email: "", targetHours: 40, username: "josh", password: "josh123" },
    { name: "Lucas Pasia", role: "Member", color: "#ff8a80", email: "", targetHours: 40, username: "lucas", password: "lucas123" },
    { name: "Luke Kivell", role: "Member", color: "#80deea", email: "", targetHours: 40, username: "luke", password: "luke123" },
    { name: "Sebastian Chandler", role: "Member", color: "#ffb74d", email: "", targetHours: 40, username: "sebastian", password: "sebastian123" },
    { name: "Anmol Singh Saini", role: "Member", color: "#aed581", email: "", targetHours: 40, username: "anmol", password: "anmol123" },
    { name: "Anton Makaranka", role: "Member", color: "#9575cd", email: "", targetHours: 40, username: "anton", password: "anton123" },
    { name: "Blake Alexander", role: "Member", color: "#4dd0e1", email: "", targetHours: 40, username: "blake", password: "blake123" },
    { name: "Joel Reyes", role: "Member", color: "#ffa726", email: "", targetHours: 40, username: "joel", password: "joel123" },
    { name: "Ren Falkenrath", role: "Member", color: "#ec407a", email: "", targetHours: 40, username: "ren", password: "ren123" }
];

let currentMember = null;

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

// Global timesheet — array of time log entries
let timesheetEntries = [];

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
// Dates based on semester schedule - adjust as needed
const defaultPhases = [
    // ======================== SEMESTER A ========================
    {
        id: 'phase2', semester: 'A',
        name: 'PHASE 2 - CONCEPT DESIGN',
        color: '#7c3aed', startDate: '2026-01-20', endDate: '2026-03-02', expanded: false,
        categories: [
            { id: 'p2-mechanical', name: 'MECHANICAL DESIGN', color: '#3b82f6', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p2-mech-station-${n}`, stationNum: n, name: `STATION ${n} MECHANICAL DESIGN`, color: '#60a5fa', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `p2-mech-${n}-1`, name: 'Create Station Ideas', status: 'Not Started', progress: 0, startDate: '2026-01-20', endDate: '2026-01-24' },
                        { id: `p2-mech-${n}-2`, name: 'Evaluation of Ideas', status: 'Not Started', progress: 0, startDate: '2026-01-27', endDate: '2026-01-31' },
                        { id: `p2-mech-${n}-3`, name: 'Finalize', status: 'Not Started', progress: 0, startDate: '2026-02-03', endDate: '2026-02-07' },
                        { id: `p2-mech-${n}-4`, name: 'Integrate into Overall', status: 'Not Started', progress: 0, startDate: '2026-02-10', endDate: '2026-02-14' },
                        { id: `p2-mech-${n}-5`, name: 'Refine Concept', status: 'Not Started', progress: 0, startDate: '2026-02-17', endDate: '2026-02-21' }
                    ] }))
            },
            { id: 'p2-controls', name: 'CONTROLS DESIGN', color: '#10b981', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p2-ctrl-station-${n}`, stationNum: n, name: `STATION ${n} CONTROLS DESIGN`, color: '#34d399', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `p2-ctrl-${n}-1`, name: 'Control System Architecture', status: 'Not Started', progress: 0, startDate: '2026-01-20', endDate: '2026-01-24' },
                        { id: `p2-ctrl-${n}-2`, name: 'I/O Mapping', status: 'Not Started', progress: 0, startDate: '2026-01-27', endDate: '2026-01-31' },
                        { id: `p2-ctrl-${n}-3`, name: 'PLC Programming', status: 'Not Started', progress: 0, startDate: '2026-02-03', endDate: '2026-02-07' },
                        { id: `p2-ctrl-${n}-4`, name: 'HMI Design', status: 'Not Started', progress: 0, startDate: '2026-02-10', endDate: '2026-02-14' },
                        { id: `p2-ctrl-${n}-5`, name: 'Integration & Testing', status: 'Not Started', progress: 0, startDate: '2026-02-17', endDate: '2026-02-21' }
                    ] }))
            }
        ]
    },
    {
        id: 'phase3', semester: 'A',
        name: 'PHASE 3 - DETAIL DESIGN (25%)',
        color: '#f59e0b', startDate: '2026-02-25', endDate: '2026-03-20', expanded: true,
        categories: [
            { id: 'p3-mechanical', name: 'MECHANICAL DETAIL DESIGN', color: '#3b82f6', expanded: true,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p3-mech-station-${n}`, stationNum: n, name: `STATION ${n} MECHANICAL`, color: '#60a5fa', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `p3-mech-${n}-1`, name: 'Update concept based on feedback', status: 'Not Started', progress: 0, startDate: '2026-02-25', endDate: '2026-03-02' },
                        { id: `p3-mech-${n}-2`, name: 'Complete Mechanical BOM', status: 'Not Started', progress: 0, startDate: '2026-03-01', endDate: '2026-03-11' },
                        { id: `p3-mech-${n}-3`, name: 'Complete mechanical design', status: 'Not Started', progress: 0, startDate: '2026-03-11', endDate: '2026-03-14' },
                        { id: `p3-mech-${n}-4`, name: 'Update budgets with actual costs', status: 'Not Started', progress: 0, startDate: '2026-03-10', endDate: '2026-03-14' },
                        { id: `p3-mech-${n}-5`, name: 'Component list by power level', status: 'Not Started', progress: 0, startDate: '2026-03-05', endDate: '2026-03-12' },
                        { id: `p3-mech-${n}-6`, name: 'Safety Strategy to minimize risks', status: 'Not Started', progress: 0, startDate: '2026-03-12', endDate: '2026-03-20' }
                    ] }))
            },
            { id: 'p3-controls', name: 'CONTROLS DETAIL DESIGN', color: '#10b981', expanded: true,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p3-ctrl-station-${n}`, stationNum: n, name: `STATION ${n} CONTROLS`, color: '#34d399', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `p3-ctrl-${n}-1`, name: 'Update concept based on feedback', status: 'Not Started', progress: 0, startDate: '2026-02-25', endDate: '2026-03-02' },
                        { id: `p3-ctrl-${n}-2`, name: 'Complete IO list (panel & field)', status: 'Not Started', progress: 0, startDate: '2026-03-01', endDate: '2026-03-11' },
                        { id: `p3-ctrl-${n}-3`, name: 'Complete Electrical BOM', status: 'Not Started', progress: 0, startDate: '2026-03-05', endDate: '2026-03-14' },
                        { id: `p3-ctrl-${n}-4`, name: 'Update budgets with actual costs', status: 'Not Started', progress: 0, startDate: '2026-03-10', endDate: '2026-03-14' },
                        { id: `p3-ctrl-${n}-5`, name: 'Safety Strategy to minimize risks', status: 'Not Started', progress: 0, startDate: '2026-03-12', endDate: '2026-03-20' }
                    ] }))
            },
            { id: 'p3-project-mgmt', name: 'PROJECT MANAGEMENT', color: '#8b5cf6', expanded: false,
                stations: [{ id: 'p3-pm-station-1', stationNum: 1, name: 'PROJECT COORDINATION', color: '#a78bfa', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'p3-pm-1', name: 'Update project Gantt chart', status: 'Not Started', progress: 0, startDate: '2026-03-14', endDate: '2026-03-18' },
                        { id: 'p3-pm-2', name: 'Update project costs', status: 'Not Started', progress: 0, startDate: '2026-03-14', endDate: '2026-03-18' },
                        { id: 'p3-pm-3', name: 'Detailed Design Presentation', status: 'Not Started', progress: 0, startDate: '2026-03-18', endDate: '2026-03-20' }
                    ] }]
            },
            { id: 'p3-safety', name: 'SAFETY', color: '#f97316', expanded: false,
                stations: [{ id: 'p3-safety-station-1', stationNum: 1, name: 'SAFETY REVIEW', color: '#fb923c', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'p3-safety-1', name: 'Risk assessment review', status: 'Not Started', progress: 0, startDate: '2026-03-14', endDate: '2026-03-20' }
                    ] }]
            }
        ]
    },
    {
        id: 'phase4a', semester: 'A',
        name: 'PHASE 4A - DESIGN VALIDATION (25%)',
        color: '#ef4444', startDate: '2026-03-25', endDate: '2026-04-15', expanded: true,
        categories: [
            { id: 'p4a-analysis', name: 'DESIGN ANALYSIS (D&A)', color: '#f87171', expanded: true,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p4a-analysis-station-${n}`, stationNum: n, name: `STATION ${n} ANALYSIS`, color: '#fca5a5', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `p4a-${n}-1`, name: 'Cylinder load analysis', status: 'Not Started', progress: 0, startDate: '2026-03-25', endDate: '2026-03-28' },
                        { id: `p4a-${n}-2`, name: 'Moment of Inertia analysis', status: 'Not Started', progress: 0, startDate: '2026-03-27', endDate: '2026-04-01' },
                        { id: `p4a-${n}-3`, name: 'Normal and Shear Stress analysis', status: 'Not Started', progress: 0, startDate: '2026-03-30', endDate: '2026-04-04' },
                        { id: `p4a-${n}-4`, name: 'Static analysis', status: 'Not Started', progress: 0, startDate: '2026-04-02', endDate: '2026-04-07' },
                        { id: `p4a-${n}-5`, name: 'Update Gantt chart and costs', status: 'Not Started', progress: 0, startDate: '2026-04-07', endDate: '2026-04-10' },
                        { id: `p4a-${n}-6`, name: 'Design Analysis Report', status: 'Not Started', progress: 0, startDate: '2026-04-10', endDate: '2026-04-15' }
                    ] }))
            }
        ]
    },
    {
        id: 'phase4b', semester: 'A',
        name: 'PHASE 4B - DETAILED DRAWINGS (25%)',
        color: '#06b6d4', startDate: '2026-03-25', endDate: '2026-04-15', expanded: true,
        categories: [
            { id: 'p4b-mechanical-drawings', name: 'MECHANICAL DRAWINGS (R&A)', color: '#22d3ee', expanded: true,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p4b-mech-station-${n}`, stationNum: n, name: `STATION ${n} DRAWINGS`, color: '#67e8f9', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `p4b-${n}-1`, name: 'Complete part drawings (custom parts)', status: 'Not Started', progress: 0, startDate: '2026-03-25', endDate: '2026-04-02' },
                        { id: `p4b-${n}-2`, name: 'Complete assembly drawings', status: 'Not Started', progress: 0, startDate: '2026-04-01', endDate: '2026-04-07' },
                        { id: `p4b-${n}-3`, name: 'Create mechanical build package', status: 'Not Started', progress: 0, startDate: '2026-04-06', endDate: '2026-04-10' },
                        { id: `p4b-${n}-4`, name: 'Update Gantt chart and costs', status: 'Not Started', progress: 0, startDate: '2026-04-08', endDate: '2026-04-12' },
                        { id: `p4b-${n}-5`, name: 'Submit Mechanical Build Package', status: 'Not Started', progress: 0, startDate: '2026-04-12', endDate: '2026-04-15' }
                    ] }))
            }
        ]
    },
    {
        id: 'phase4c', semester: 'A',
        name: 'PHASE 4C - ELECTRICAL/PNEUMATIC DRAWINGS (25%)',
        color: '#84cc16', startDate: '2026-03-25', endDate: '2026-04-15', expanded: true,
        categories: [
            { id: 'p4c-electrical', name: 'ELECTRICAL/PNEUMATIC (R&A)', color: '#a3e635', expanded: true,
                stations: [1,2,3,4,5,6].map(n => ({ id: `p4c-ctrl-station-${n}`, stationNum: n, name: `STATION ${n} ELECTRICAL`, color: '#bef264', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `p4c-${n}-1`, name: 'Power consumption analysis', status: 'Not Started', progress: 0, startDate: '2026-03-25', endDate: '2026-03-30' },
                        { id: `p4c-${n}-2`, name: 'Develop detailed electrical drawings', status: 'Not Started', progress: 0, startDate: '2026-03-28', endDate: '2026-04-06' },
                        { id: `p4c-${n}-3`, name: 'Develop detailed pneumatic drawings', status: 'Not Started', progress: 0, startDate: '2026-04-03', endDate: '2026-04-10' },
                        { id: `p4c-${n}-4`, name: 'Update Gantt chart and costs', status: 'Not Started', progress: 0, startDate: '2026-04-08', endDate: '2026-04-12' },
                        { id: `p4c-${n}-5`, name: 'Submit Electrical/Pneumatic Drawings', status: 'Not Started', progress: 0, startDate: '2026-04-12', endDate: '2026-04-15' }
                    ] }))
            }
        ]
    },
    {
        id: 'phase5', semester: 'A',
        name: 'PHASE 5 - FINAL DESIGN CONSOLIDATION (10%)',
        color: '#ec4899', startDate: '2026-04-16', endDate: '2026-04-30', expanded: true,
        categories: [
            { id: 'p5-build-package', name: 'BUILD PACKAGE', color: '#f472b6', expanded: true,
                stations: [{ id: 'p5-build-station-1', stationNum: 1, name: 'DOCUMENTATION', color: '#f9a8d4', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'p5-build-1', name: 'Update drawings based on feedback', status: 'Not Started', progress: 0, startDate: '2026-04-16', endDate: '2026-04-18' },
                        { id: 'p5-build-2', name: 'Mechanical Assembly & Part Drawings (PDF)', status: 'Not Started', progress: 0, startDate: '2026-04-16', endDate: '2026-04-21' },
                        { id: 'p5-build-3', name: 'Electrical Drawings', status: 'Not Started', progress: 0, startDate: '2026-04-18', endDate: '2026-04-23' },
                        { id: 'p5-build-4', name: 'Pneumatic Drawings', status: 'Not Started', progress: 0, startDate: '2026-04-18', endDate: '2026-04-23' },
                        { id: 'p5-build-5', name: 'eAssemblies (whole machine & substations)', status: 'Not Started', progress: 0, startDate: '2026-04-21', endDate: '2026-04-25' }
                    ] }]
            },
            { id: 'p5-project-mgmt', name: 'PROJECT MANAGEMENT PACKAGE', color: '#a855f7', expanded: true,
                stations: [{ id: 'p5-pm-station-1', stationNum: 1, name: 'FINAL DELIVERABLES', color: '#c084fc', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'p5-pm-1', name: 'Design and Analysis Report', status: 'Not Started', progress: 0, startDate: '2026-04-20', endDate: '2026-04-25' },
                        { id: 'p5-pm-2', name: 'Updated Gantt Chart (Build/Commission)', status: 'Not Started', progress: 0, startDate: '2026-04-22', endDate: '2026-04-27' },
                        { id: 'p5-pm-3', name: 'Overall BOM by substation', status: 'Not Started', progress: 0, startDate: '2026-04-22', endDate: '2026-04-27' },
                        { id: 'p5-pm-4', name: 'Updated budgets (industry & college)', status: 'Not Started', progress: 0, startDate: '2026-04-24', endDate: '2026-04-28' },
                        { id: 'p5-pm-5', name: 'Design Phase Reflections', status: 'Not Started', progress: 0, startDate: '2026-04-27', endDate: '2026-04-30' }
                    ] }]
            },
            { id: 'p5-reflections', name: 'REFLECTIONS', color: '#14b8a6', expanded: false,
                stations: [{ id: 'p5-reflect-station-1', stationNum: 1, name: 'TEAM REFLECTIONS', color: '#2dd4bf', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'p5-ref-1', name: 'Compare original vs final Gantt', status: 'Not Started', progress: 0, startDate: '2026-04-27', endDate: '2026-04-29' },
                        { id: 'p5-ref-2', name: 'Compare proposed vs final budget', status: 'Not Started', progress: 0, startDate: '2026-04-27', endDate: '2026-04-29' },
                        { id: 'p5-ref-3', name: 'Compare initial concept to final design', status: 'Not Started', progress: 0, startDate: '2026-04-28', endDate: '2026-04-30' },
                        { id: 'p5-ref-4', name: 'Identify 3 things done well', status: 'Not Started', progress: 0, startDate: '2026-04-28', endDate: '2026-04-30' },
                        { id: 'p5-ref-5', name: 'Identify 3 things to improve', status: 'Not Started', progress: 0, startDate: '2026-04-29', endDate: '2026-04-30' }
                    ] }]
            }
        ]
    },

    // ======================== SEMESTER B ========================
    {
        id: 'sb-phase0', semester: 'B',
        name: 'PHASE 0 - FINAL DESIGN PRESENTATION',
        color: '#8b5cf6', startDate: '2026-09-08', endDate: '2026-09-26', expanded: false,
        categories: [
            { id: 'sb-p0-design', name: 'DESIGN COMPLETION', color: '#a78bfa', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p0-design-station-${n}`, stationNum: n, name: `STATION ${n} DESIGN COMPLETION`, color: '#c4b5fd', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `sb-p0-${n}-1`, name: 'Complete Phase 4 design recommendations', status: 'Not Started', progress: 0, startDate: '2026-09-08', endDate: '2026-09-16' },
                        { id: `sb-p0-${n}-2`, name: 'Semester B design presentation prep', status: 'Not Started', progress: 0, startDate: '2026-09-14', endDate: '2026-09-19' },
                        { id: `sb-p0-${n}-3`, name: 'Semester B design presentation', status: 'Not Started', progress: 0, startDate: '2026-09-19', endDate: '2026-09-22' }
                    ] }))
            },
            { id: 'sb-p0-procurement', name: 'PROCUREMENT', color: '#f59e0b', expanded: false,
                stations: [{ id: 'sb-p0-proc-station-1', stationNum: 1, name: 'COMPONENT PROCUREMENT', color: '#fbbf24', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'sb-p0-proc-1', name: 'Finalize procurement list', status: 'Not Started', progress: 0, startDate: '2026-09-08', endDate: '2026-09-12' },
                        { id: 'sb-p0-proc-2', name: 'Place orders for components', status: 'Not Started', progress: 0, startDate: '2026-09-12', endDate: '2026-09-16' },
                        { id: 'sb-p0-proc-3', name: 'Obtain components and materials', status: 'Not Started', progress: 0, startDate: '2026-09-16', endDate: '2026-09-26' }
                    ] }]
            }
        ]
    },
    {
        id: 'sb-phase1', semester: 'B',
        name: 'PHASE 1 - BUILD & OFFLINE PROGRAM DEVELOPMENT',
        color: '#3b82f6', startDate: '2026-09-22', endDate: '2026-11-06', expanded: false,
        categories: [
            { id: 'sb-p1-manufacture', name: 'MANUFACTURE / FABRICATION', color: '#60a5fa', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p1-fab-station-${n}`, stationNum: n, name: `STATION ${n} FABRICATION`, color: '#93c5fd', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `sb-p1-fab-${n}-1`, name: 'Machine/3D print custom parts', status: 'Not Started', progress: 0, startDate: '2026-09-22', endDate: '2026-10-06' },
                        { id: `sb-p1-fab-${n}-2`, name: 'Quality check fabricated parts', status: 'Not Started', progress: 0, startDate: '2026-10-05', endDate: '2026-10-09' }
                    ] }))
            },
            { id: 'sb-p1-assembly', name: 'MECHANICAL ASSEMBLY', color: '#14b8a6', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p1-asm-station-${n}`, stationNum: n, name: `STATION ${n} ASSEMBLY`, color: '#5eead4', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `sb-p1-asm-${n}-1`, name: 'Assemble substation', status: 'Not Started', progress: 0, startDate: '2026-10-06', endDate: '2026-10-17' },
                        { id: `sb-p1-asm-${n}-2`, name: 'Assemble guarding', status: 'Not Started', progress: 0, startDate: '2026-10-15', endDate: '2026-10-20' },
                        { id: `sb-p1-asm-${n}-3`, name: 'Overall system integration', status: 'Not Started', progress: 0, startDate: '2026-10-19', endDate: '2026-10-24' }
                    ] }))
            },
            { id: 'sb-p1-panels', name: 'PANEL BUILDING', color: '#f97316', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p1-panel-station-${n}`, stationNum: n, name: `STATION ${n} PANELS`, color: '#fb923c', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `sb-p1-panel-${n}-1`, name: 'Mount components in electrical panels', status: 'Not Started', progress: 0, startDate: '2026-10-06', endDate: '2026-10-17' },
                        { id: `sb-p1-panel-${n}-2`, name: 'Complete local panel wiring', status: 'Not Started', progress: 0, startDate: '2026-10-15', endDate: '2026-10-24' }
                    ] }))
            },
            { id: 'sb-p1-fieldwire', name: 'FIELD WIRING', color: '#eab308', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p1-fw-station-${n}`, stationNum: n, name: `STATION ${n} FIELD WIRING`, color: '#facc15', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `sb-p1-fw-${n}-1`, name: 'Wire sensors to network blocks / panels', status: 'Not Started', progress: 0, startDate: '2026-10-20', endDate: '2026-10-31' }
                    ] }))
            },
            { id: 'sb-p1-programming', name: 'PROGRAM DEVELOPMENT', color: '#10b981', expanded: false,
                stations: [{ id: 'sb-p1-prog-station-1', stationNum: 1, name: 'SOFTWARE DEVELOPMENT', color: '#34d399', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'sb-p1-prog-1', name: 'PLC program development', status: 'Not Started', progress: 0, startDate: '2026-09-22', endDate: '2026-10-31' },
                        { id: 'sb-p1-prog-2', name: 'HMI program development', status: 'Not Started', progress: 0, startDate: '2026-09-28', endDate: '2026-10-31' },
                        { id: 'sb-p1-prog-3', name: 'Robot program development', status: 'Not Started', progress: 0, startDate: '2026-10-05', endDate: '2026-11-06' }
                    ] }]
            }
        ]
    },
    {
        id: 'sb-phase2', semester: 'B',
        name: 'PHASE 2 - SETUP & COMMISSIONING',
        color: '#06b6d4', startDate: '2026-11-02', endDate: '2026-11-20', expanded: false,
        categories: [
            { id: 'sb-p2-commission', name: 'COMMISSIONING', color: '#22d3ee', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p2-comm-station-${n}`, stationNum: n, name: `STATION ${n} COMMISSIONING`, color: '#67e8f9', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `sb-p2-${n}-1`, name: 'Panel power up', status: 'Not Started', progress: 0, startDate: '2026-11-02', endDate: '2026-11-04' },
                        { id: `sb-p2-${n}-2`, name: 'IO checkout', status: 'Not Started', progress: 0, startDate: '2026-11-04', endDate: '2026-11-07' },
                        { id: `sb-p2-${n}-3`, name: 'Manual mode commissioning (HMI & fault diagnostics)', status: 'Not Started', progress: 0, startDate: '2026-11-07', endDate: '2026-11-14' },
                        { id: `sb-p2-${n}-4`, name: 'Mechanical fit up and validation', status: 'Not Started', progress: 0, startDate: '2026-11-14', endDate: '2026-11-20' }
                    ] }))
            }
        ]
    },
    {
        id: 'sb-phase3', semester: 'B',
        name: 'PHASE 3 - SYSTEM TESTING',
        color: '#ef4444', startDate: '2026-11-16', endDate: '2026-11-28', expanded: false,
        categories: [
            { id: 'sb-p3-testing', name: 'SYSTEM TESTING', color: '#f87171', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p3-test-station-${n}`, stationNum: n, name: `STATION ${n} TESTING`, color: '#fca5a5', expanded: false, groupLeadId: `ctrl-lead-${n}`,
                    tasks: [
                        { id: `sb-p3-${n}-1`, name: 'Automatic mode program testing', status: 'Not Started', progress: 0, startDate: '2026-11-16', endDate: '2026-11-20' },
                        { id: `sb-p3-${n}-2`, name: 'Track parts through system & identify rejects', status: 'Not Started', progress: 0, startDate: '2026-11-19', endDate: '2026-11-23' },
                        { id: `sb-p3-${n}-3`, name: 'Test "what ifs" (E-stop, power loss, operator error)', status: 'Not Started', progress: 0, startDate: '2026-11-22', endDate: '2026-11-26' },
                        { id: `sb-p3-${n}-4`, name: 'Mechanical troubleshooting', status: 'Not Started', progress: 0, startDate: '2026-11-24', endDate: '2026-11-28' }
                    ] }))
            }
        ]
    },
    {
        id: 'sb-phase4', semester: 'B',
        name: 'PHASE 4 - SYSTEM VALIDATION',
        color: '#84cc16', startDate: '2026-11-25', endDate: '2026-12-12', expanded: false,
        categories: [
            { id: 'sb-p4-validation', name: 'VALIDATION & DOCUMENTATION', color: '#a3e635', expanded: false,
                stations: [1,2,3,4,5,6].map(n => ({ id: `sb-p4-val-station-${n}`, stationNum: n, name: `STATION ${n} VALIDATION`, color: '#bef264', expanded: false, groupLeadId: `mech-lead-${n}`,
                    tasks: [
                        { id: `sb-p4-${n}-1`, name: 'Program & test machine statistics / bonus features', status: 'Not Started', progress: 0, startDate: '2026-11-25', endDate: '2026-11-30' },
                        { id: `sb-p4-${n}-2`, name: 'Durability/Reliability testing (run in auto)', status: 'Not Started', progress: 0, startDate: '2026-11-28', endDate: '2026-12-05' },
                        { id: `sb-p4-${n}-3`, name: 'Troubleshooting as needed', status: 'Not Started', progress: 0, startDate: '2026-12-01', endDate: '2026-12-06' },
                        { id: `sb-p4-${n}-4`, name: 'Mechanical As Builds', status: 'Not Started', progress: 0, startDate: '2026-12-03', endDate: '2026-12-08' },
                        { id: `sb-p4-${n}-5`, name: 'Electrical / Pneumatic As Builds', status: 'Not Started', progress: 0, startDate: '2026-12-05', endDate: '2026-12-10' },
                        { id: `sb-p4-${n}-6`, name: 'Final Design & Analysis Report', status: 'Not Started', progress: 0, startDate: '2026-12-08', endDate: '2026-12-12' }
                    ] }))
            }
        ]
    },
    {
        id: 'sb-phase5', semester: 'B',
        name: 'PHASE 5 - SAT',
        color: '#ec4899', startDate: '2026-12-14', endDate: '2026-12-19', expanded: false,
        categories: [
            { id: 'sb-p5-sat', name: 'SITE ACCEPTANCE TEST', color: '#f472b6', expanded: false,
                stations: [{ id: 'sb-p5-sat-station-1', stationNum: 1, name: 'SAT & SHOWCASE', color: '#f9a8d4', expanded: false, groupLeadId: null,
                    tasks: [
                        { id: 'sb-p5-sat-1', name: 'SAT (Site Acceptance Test) - Evaluation Day', status: 'Not Started', progress: 0, startDate: '2026-12-14', endDate: '2026-12-17' },
                        { id: 'sb-p5-sat-2', name: 'Showcase Day', status: 'Not Started', progress: 0, startDate: '2026-12-17', endDate: '2026-12-19' }
                    ] }]
            }
        ]
    }
];

const DATA_VERSION = 2; // Bump this to force Semester B phases to appear

let projectPhases = JSON.parse(localStorage.getItem('loopProjectPhases')) || JSON.parse(JSON.stringify(defaultPhases));

const REQUIRED_PHASE_IDS = ['phase2', 'phase3', 'phase4a', 'phase4b', 'phase4c', 'phase5',
    'sb-phase0', 'sb-phase1', 'sb-phase2', 'sb-phase3', 'sb-phase4', 'sb-phase5'];

function ensureSemesterBPhases(phases) {
    let changed = false;
    const ids = phases.map(p => p.id);

    phases.forEach(p => {
        if (!p.semester) {
            p.semester = p.id.startsWith('sb-') ? 'B' : 'A';
            changed = true;
        }
    });

    REQUIRED_PHASE_IDS.forEach(phaseId => {
        if (!ids.includes(phaseId)) {
            const defaultPhase = defaultPhases.find(p => p.id === phaseId);
            if (defaultPhase) {
                phases.push(JSON.parse(JSON.stringify(defaultPhase)));
                changed = true;
                console.log(`Added missing phase: ${phaseId}`);
            }
        }
    });

    phases.sort((a, b) => {
        const ai = REQUIRED_PHASE_IDS.indexOf(a.id);
        const bi = REQUIRED_PHASE_IDS.indexOf(b.id);
        if (ai === -1 && bi === -1) return 0;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
    });

    phases.forEach(phase => {
        if (phase.categories) {
            phase.categories.forEach(category => {
                if (category.stations) {
                    category.stations.forEach(station => {
                        if (!station.groupLeadId) {
                            if (category.id.includes('mechanical') || category.id.includes('mech') || category.id.includes('fab') || category.id.includes('asm')) {
                                station.groupLeadId = `mech-lead-${station.stationNum}`;
                            } else if (category.id.includes('controls') || category.id.includes('ctrl') || category.id.includes('electrical') || category.id.includes('panel') || category.id.includes('comm')) {
                                station.groupLeadId = `ctrl-lead-${station.stationNum}`;
                            }
                            changed = true;
                        }
                        if (station.tasks) {
                            station.tasks.forEach(task => {
                                if (!task.startDate) { task.startDate = phase.startDate || '2026-01-20'; changed = true; }
                                if (!task.endDate) { task.endDate = phase.endDate || '2026-04-18'; changed = true; }
                            });
                        }
                    });
                }
            });
        }
    });

    return changed;
}

// Force migration if data version is outdated
const storedVersion = parseInt(localStorage.getItem('loopDataVersion') || '0');
if (storedVersion < DATA_VERSION) {
    console.log(`Data version ${storedVersion} < ${DATA_VERSION}, forcing Semester B migration`);
    ensureSemesterBPhases(projectPhases);
    localStorage.setItem('loopProjectPhases', JSON.stringify(projectPhases));
    localStorage.setItem('loopDataVersion', String(DATA_VERSION));
}
ensureSemesterBPhases(projectPhases);

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
                setupProjectPhasesListener();
                setupTimesheetListener();

                // Check if data exists, if not, initialize with defaults
                const teamDoc = await window.firebaseGetDoc(window.firebaseDoc(db, 'projects', 'main-project'));
                if (!teamDoc.exists()) {
                    console.log('Initializing project with default data...');
                    await saveTeamMembers([...defaultTeamMembers]);
                    await saveStations(JSON.parse(JSON.stringify(defaultStations)));
                }
                
                // Check if phases exist in Firebase or need Semester B migration
                const phasesDoc = await window.firebaseGetDoc(window.firebaseDoc(db, 'projects', 'main-project-phases'));
                if (!phasesDoc.exists()) {
                    console.log('Initializing project phases in Firebase...');
                    ensureSemesterBPhases(projectPhases);
                    await saveProjectPhases();
                } else {
                    const fbPhases = phasesDoc.data().phases || [];
                    const hasSemB = fbPhases.some(p => p.id === 'sb-phase0');
                    if (!hasSemB) {
                        console.log('Semester B missing from Firebase — one-time migration');
                        projectPhases = fbPhases;
                        ensureSemesterBPhases(projectPhases);
                        await saveProjectPhases();
                    }
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
    const memberLoginBtn = document.getElementById('member-login-btn');
    
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    
    if (isAdmin) {
        adminBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        adminIndicator.style.display = 'flex';
        if (groupLeadBtn) groupLeadBtn.style.display = 'none';
        if (memberLoginBtn) memberLoginBtn.style.display = 'none';
        currentGroupLead = null;
        currentMember = null;
        updateGroupLeadUI();
        updateMemberUI();
        adminOnlyElements.forEach(el => el.style.display = 'inline-flex');
        console.log('Admin mode enabled');
    } else {
        adminBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        adminIndicator.style.display = 'none';
        if (groupLeadBtn && !currentGroupLead && !currentMember) {
            groupLeadBtn.style.display = 'flex';
        }
        if (memberLoginBtn && !currentGroupLead && !currentMember) {
            memberLoginBtn.style.display = 'flex';
        }
        adminOnlyElements.forEach(el => el.style.display = 'none');
        console.log('Public view mode');
    }
    
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

let _lastLocalRenderTime = 0;

function setupProjectPhasesListener() {
    if (!firebaseEnabled || !db) return;
    
    const phasesDocRef = window.firebaseDoc(db, 'projects', 'main-project-phases');
    
    window.firebaseOnSnapshot(phasesDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.phases) {
                projectPhases = data.phases;
                ensureSemesterBPhases(projectPhases);
                if (!isLoading) {
                    if (Date.now() - _lastLocalRenderTime < 2000) return;
                    renderProjectTimeline();
                }
            }
        }
    }, (error) => {
        console.error('Error listening to project phases:', error);
    });
}

function setupTimesheetListener() {
    if (!firebaseEnabled || !db) return;
    const tsDocRef = window.firebaseDoc(db, 'projects', 'main-project-timesheet');
    window.firebaseOnSnapshot(tsDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data.entries) {
                timesheetEntries = data.entries;
                localStorage.setItem('loopTimesheetEntries', JSON.stringify(timesheetEntries));
            }
        }
    }, (error) => {
        console.error('Error listening to timesheet entries:', error);
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

function saveScrollPositions() {
    const positions = {};
    // Save scroll for the active view itself
    const activeView = document.querySelector('.view.active');
    if (activeView) {
        positions['_activeView'] = { top: activeView.scrollTop, left: activeView.scrollLeft };
    }
    // Save scroll for known scrollable containers by selector
    const scrollSelectors = [
        '.dashboard-grid', '.phase-gantt-container',
        '.team-grid', '.workload-table-container'
    ];
    scrollSelectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el && (el.scrollTop > 0 || el.scrollLeft > 0)) {
            positions[sel] = { top: el.scrollTop, left: el.scrollLeft };
        }
    });
    return positions;
}

function restoreScrollPositions(positions) {
    if (!positions) return;
    requestAnimationFrame(() => {
        // Restore active view scroll
        const activeView = document.querySelector('.view.active');
        if (activeView && positions['_activeView']) {
            activeView.scrollTop = positions['_activeView'].top;
            activeView.scrollLeft = positions['_activeView'].left;
        }
        // Restore known containers
        Object.keys(positions).forEach(sel => {
            if (sel === '_activeView') return;
            const el = document.querySelector(sel);
            if (el) {
                el.scrollTop = positions[sel].top;
                el.scrollLeft = positions[sel].left;
            }
        });
    });
}

function renderAllViews() {
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    
    // Save scroll positions before re-render
    const savedScroll = saveScrollPositions();
    
    const viewId = activeView.id;
    if (viewId === 'dashboard-view') renderDashboard();
    if (viewId === 'timeline-view') renderProjectTimeline();
    if (viewId === 'team-view') renderTeam();
    
    // Restore scroll positions after render
    restoreScrollPositions(savedScroll);
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

async function saveTimesheetEntries() {
    localStorage.setItem('loopTimesheetEntries', JSON.stringify(timesheetEntries));
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project-timesheet'), {
                entries: timesheetEntries,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (e) { console.warn('Timesheet Firebase save failed:', e); }
    }
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
// PROJECT TIMELINE VIEW (Phase-based Gantt)
// ============================================

const PHASE_DAY_WIDTH = 20;
const PHASE_TIMELINE_WEEKS = 18; // 18 weeks for full project timeline

// Helper function to get the earliest start date from all phases
function getProjectTimelineRange() {
    let minDate = null;
    let maxDate = null;
    
    projectPhases.forEach(phase => {
        if (phase.startDate) {
            const start = new Date(phase.startDate);
            if (!minDate || start < minDate) minDate = start;
        }
        if (phase.endDate) {
            const end = new Date(phase.endDate);
            if (!maxDate || end > maxDate) maxDate = end;
        }
    });
    
    // Default to current semester if no dates found
    if (!minDate) minDate = new Date('2026-01-20');
    if (!maxDate) maxDate = new Date('2026-04-25');
    
    return { minDate, maxDate };
}

// Helper to calculate pixel position from date
function getDatePosition(date, timelineStart) {
    const d = new Date(date);
    const start = new Date(timelineStart);
    const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24));
    return diffDays * PHASE_DAY_WIDTH;
}

// Helper to calculate bar width from start/end dates
function getDateWidth(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diffDays * PHASE_DAY_WIDTH, 40); // Minimum 40px width
}

function renderProjectTimeline() {
    const container = document.getElementById('timeline-container');
    if (!container) return;
    
    _lastLocalRenderTime = Date.now();

    const deadlineBtn = document.getElementById('deadline-alerts-btn');
    if (deadlineBtn) deadlineBtn.style.display = isAdmin ? 'flex' : 'none';

    // Capture inner scroller position (the .phase-gantt-container that will be replaced)
    const innerScroller = container.querySelector('.phase-gantt-container');
    const innerScrollTop = innerScroller ? innerScroller.scrollTop : 0;
    const innerScrollLeft = innerScroller ? innerScroller.scrollLeft : 0;
    
    // Get the project timeline range
    const { minDate, maxDate } = getProjectTimelineRange();
    const timelineStart = new Date(minDate);
    timelineStart.setDate(timelineStart.getDate() - 7); // Start 1 week before first phase
    
    // Calculate total weeks needed
    const totalDays = Math.ceil((maxDate - timelineStart) / (1000 * 60 * 60 * 24)) + 14;
    const numWeeks = Math.ceil(totalDays / 7);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let html = '<div class="phase-gantt-container">';
    
    // Build unified table like the task tracking view
    html += '<div class="phase-gantt-unified">';
    
    // Header row
    html += '<div class="phase-gantt-header-row">';
    html += '<div class="phase-gantt-info-header">';
    html += '<div class="pg-col pg-col-name">Phase / Category / Task</div>';
    html += '<div class="pg-col pg-col-dates">Start Date</div>';
    html += '<div class="pg-col pg-col-dates">End Date</div>';
    html += '<div class="pg-col pg-col-status">Status</div>';
    html += '<div class="pg-col pg-col-progress">Progress</div>';
    html += '</div>';
    
    // Timeline header with weeks
    html += '<div class="phase-gantt-timeline-header">';
    for (let w = 0; w < numWeeks; w++) {
        const weekStart = new Date(timelineStart);
        weekStart.setDate(weekStart.getDate() + (w * 7));
        const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Check if current week
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const isCurrentWeek = today >= weekStart && today <= weekEnd;
        
        html += `<div class="pg-week-header ${isCurrentWeek ? 'current' : ''}">
            <span class="pg-week-label">W${w + 1}</span>
            <span class="pg-week-date">${weekLabel}</span>
        </div>`;
    }
    html += '</div></div>';
    
    // Data rows
    let lastSemester = null;
    projectPhases.forEach(phase => {
        if (phase.semester && phase.semester !== lastSemester) {
            lastSemester = phase.semester;
            const semLabel = phase.semester === 'A' ? 'SEMESTER A — Design Phase' : 'SEMESTER B — Build & Commission';
            const semColor = phase.semester === 'A' ? '#00d4aa' : '#f59e0b';
            html += `<div class="phase-gantt-row semester-header-row" style="background: ${semColor}12; border-bottom: 2px solid ${semColor}40;">`;
            html += '<div class="phase-gantt-info-cells" style="border-right-color: ${semColor}40;">';
            html += `<div class="pg-col" style="flex:1; padding: 8px 12px; font-weight: 800; font-size: 0.85rem; color: ${semColor}; letter-spacing: 1.5px; text-transform: uppercase; display: flex; align-items: center; gap: 10px;">
                <span style="display:inline-block;width:4px;height:20px;background:${semColor};border-radius:2px;"></span>
                ${semLabel}
            </div>`;
            html += '</div>';
            html += `<div class="phase-gantt-timeline-cells" style="border-bottom: none;">`;
            for (let w = 0; w < numWeeks; w++) {
                html += `<div class="pg-week-cell" style="background: ${semColor}06; border-color: ${semColor}15;"></div>`;
            }
            html += '</div></div>';
        }

        const phaseProgress = calculatePhaseProgress(phase);
        const phaseStart = phase.startDate || '2026-01-20';
        const phaseEnd = phase.endDate || '2026-04-18';
        
        // Format dates for display
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        
        // Calculate phase bar position
        const phaseBarLeft = getDatePosition(phaseStart, timelineStart);
        const phaseBarWidth = getDateWidth(phaseStart, phaseEnd);
        
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
            ${isAdmin && phaseProgress < 100 ? `<button class="pg-complete-phase-btn" onclick="event.stopPropagation(); completePhase('${phase.id}')" title="Mark entire phase as complete">✓ Complete</button>` : ''}
        </div>`;
        html += `<div class="pg-col pg-col-dates">
            ${isAdmin ? `<input type="date" class="pg-date-input" value="${phaseStart}" onchange="updatePhaseDate('${phase.id}', 'startDate', this.value)">` : `<span>${formatDate(phaseStart)}</span>`}
        </div>`;
        html += `<div class="pg-col pg-col-dates">
            ${isAdmin ? `<input type="date" class="pg-date-input" value="${phaseEnd}" onchange="updatePhaseDate('${phase.id}', 'endDate', this.value)">` : `<span>${formatDate(phaseEnd)}</span>`}
        </div>`;
        html += `<div class="pg-col pg-col-status"><span class="phase-badge" style="background: ${phase.color}20; color: ${phase.color}">PHASE</span></div>`;
        html += `<div class="pg-col pg-col-progress">
            <div class="pg-progress-bar"><div class="pg-progress-fill" style="width: ${phaseProgress}%; background: ${phase.color}"></div></div>
            <span class="pg-progress-text">${phaseProgress}%</span>
        </div>`;
        html += '</div>';
        
        // Phase timeline bar
        html += '<div class="phase-gantt-timeline-cells">';
        for (let w = 0; w < numWeeks; w++) {
            const weekStart = new Date(timelineStart);
            weekStart.setDate(weekStart.getDate() + (w * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            const isCurrentWeek = today >= weekStart && today <= weekEnd;
            html += `<div class="pg-week-cell ${isCurrentWeek ? 'current' : ''}"></div>`;
        }
        html += `<div class="pg-gantt-bar pg-phase-bar" style="left: ${phaseBarLeft}px; width: ${phaseBarWidth}px; background: linear-gradient(135deg, ${phase.color}, ${phase.color}88);" title="${phase.name}: ${formatDate(phaseStart)} - ${formatDate(phaseEnd)}">${phase.name}</div>`;
        html += '</div></div>';
        
        // Categories and stations
        if (phase.expanded) {
            phase.categories.forEach((category, catIndex) => {
                const categoryProgress = calculateCategoryProgress(category);
                
                let catStartDate = category.startDate || null;
                let catEndDate = category.endDate || null;
                if (!catStartDate || !catEndDate) {
                    let calcStart = phaseStart;
                    let calcEnd = phaseEnd;
                    if (category.stations && category.stations.length > 0) {
                        category.stations.forEach(station => {
                            if (station.startDate) {
                                if (!calcStart || station.startDate < calcStart) calcStart = station.startDate;
                            }
                            if (station.endDate) {
                                if (!calcEnd || station.endDate > calcEnd) calcEnd = station.endDate;
                            }
                            if (station.tasks) {
                                station.tasks.forEach(task => {
                                    if (task.startDate && (!calcStart || task.startDate < calcStart)) calcStart = task.startDate;
                                    if (task.endDate && (!calcEnd || task.endDate > calcEnd)) calcEnd = task.endDate;
                                });
                            }
                        });
                    }
                    if (!catStartDate) catStartDate = calcStart;
                    if (!catEndDate) catEndDate = calcEnd;
                }
                
                const catBarLeft = getDatePosition(catStartDate, timelineStart);
                const catBarWidth = getDateWidth(catStartDate, catEndDate);
                
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
                html += `<div class="pg-col pg-col-dates">
                    ${isAdmin ? `<input type="date" class="pg-date-input" value="${catStartDate}" onchange="updateCategoryDate('${phase.id}', '${category.id}', 'startDate', this.value)">` : `<span class="pg-date-display">${formatDate(catStartDate)}</span>`}
                </div>`;
                html += `<div class="pg-col pg-col-dates">
                    ${isAdmin ? `<input type="date" class="pg-date-input" value="${catEndDate}" onchange="updateCategoryDate('${phase.id}', '${category.id}', 'endDate', this.value)">` : `<span class="pg-date-display">${formatDate(catEndDate)}</span>`}
                </div>`;
                html += `<div class="pg-col pg-col-status"><span class="category-badge" style="background: ${category.color}20; color: ${category.color}">CATEGORY</span></div>`;
                html += `<div class="pg-col pg-col-progress">
                    <div class="pg-progress-bar"><div class="pg-progress-fill" style="width: ${categoryProgress}%; background: ${category.color}"></div></div>
                    <span class="pg-progress-text">${categoryProgress}%</span>
                </div>`;
                html += '</div>';
                
                // Category timeline bar
                html += '<div class="phase-gantt-timeline-cells">';
                for (let w = 0; w < numWeeks; w++) {
                    const weekStart = new Date(timelineStart);
                    weekStart.setDate(weekStart.getDate() + (w * 7));
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    const isCurrentWeek = today >= weekStart && today <= weekEnd;
                    html += `<div class="pg-week-cell ${isCurrentWeek ? 'current' : ''}"></div>`;
                }
                html += `<div class="pg-gantt-bar pg-category-bar" style="left: ${catBarLeft}px; width: ${catBarWidth}px; background: linear-gradient(135deg, ${category.color}, ${category.color}88);" title="${category.name}: ${formatDate(catStartDate)} - ${formatDate(catEndDate)}">${category.name}</div>`;
                html += '</div></div>';
                
                // Stations
                if (category.expanded) {
                    category.stations.forEach((station, stationIndex) => {
                        const stationProgress = calculateStationTasksProgress(station);
                        
                        let stationStartDate = station.startDate || null;
                        let stationEndDate = station.endDate || null;
                        if (!stationStartDate || !stationEndDate) {
                            let calcStart = catStartDate;
                            let calcEnd = catEndDate;
                            if (station.tasks && station.tasks.length > 0) {
                                const taskStarts = station.tasks.filter(t => t.startDate).map(t => t.startDate);
                                const taskEnds = station.tasks.filter(t => t.endDate).map(t => t.endDate);
                                if (taskStarts.length > 0) calcStart = taskStarts.sort()[0];
                                if (taskEnds.length > 0) calcEnd = taskEnds.sort().reverse()[0];
                            }
                            if (!stationStartDate) stationStartDate = calcStart;
                            if (!stationEndDate) stationEndDate = calcEnd;
                        }
                        
                        const stationBarLeft = getDatePosition(stationStartDate, timelineStart);
                        const stationBarWidth = getDateWidth(stationStartDate, stationEndDate);
                        
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
                        html += `<div class="pg-col pg-col-dates">
                            ${isAdmin ? `<input type="date" class="pg-date-input" value="${stationStartDate}" onchange="updateStationDate('${phase.id}', '${category.id}', '${station.id}', 'startDate', this.value)">` : `<span class="pg-date-display">${formatDate(stationStartDate)}</span>`}
                        </div>`;
                        html += `<div class="pg-col pg-col-dates">
                            ${isAdmin ? `<input type="date" class="pg-date-input" value="${stationEndDate}" onchange="updateStationDate('${phase.id}', '${category.id}', '${station.id}', 'endDate', this.value)">` : `<span class="pg-date-display">${formatDate(stationEndDate)}</span>`}
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
                        for (let w = 0; w < numWeeks; w++) {
                            const weekStart = new Date(timelineStart);
                            weekStart.setDate(weekStart.getDate() + (w * 7));
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekEnd.getDate() + 6);
                            const isCurrentWeek = today >= weekStart && today <= weekEnd;
                            html += `<div class="pg-week-cell ${isCurrentWeek ? 'current' : ''}"></div>`;
                        }
                        html += `<div class="pg-gantt-bar pg-station-bar" style="left: ${stationBarLeft}px; width: ${stationBarWidth}px; background: linear-gradient(135deg, ${station.color}, ${station.color}aa);" title="${station.name}: ${formatDate(stationStartDate)} - ${formatDate(stationEndDate)}">${station.name}</div>`;
                        html += '</div></div>';
                        
                        // Tasks
                        if (station.expanded) {
                            station.tasks.forEach((task, taskIndex) => {
                                const taskStart = task.startDate || stationStartDate;
                                const taskEnd = task.endDate || stationEndDate;
                                
                                const taskBarLeft = getDatePosition(taskStart, timelineStart);
                                const taskBarWidth = getDateWidth(taskStart, taskEnd);
                                
                                const canEdit = canEditStation(category.id, station.id);
                                const canEditTask = canEdit || canMemberEditTask(task);
                                
                                html += `<div class="phase-gantt-row task-row ${canEditTask ? 'editable' : ''}" data-task="${task.id}">`;
                                html += '<div class="phase-gantt-info-cells">';
                                const assignedMember = task.assignedTo ? teamMembers.find(m => m.name === task.assignedTo) : null;
                                const assignBadge = task.assignedTo ? `<span style="font-size:0.6rem;padding:1px 5px;border-radius:3px;background:${assignedMember?.color || '#666'}30;color:${assignedMember?.color || '#aaa'};white-space:nowrap;" title="Assigned to ${task.assignedTo}">${task.assignedTo.split(' ')[0]}</span>` : '';
                                html += `<div class="pg-col pg-col-name pg-task-name">
                                    <span class="pg-task-bullet" style="background: ${station.color}"></span>
                                    <span class="editable-name" ${isAdmin ? `contenteditable="true" onblur="updateTimelineTaskName('${phase.id}', '${category.id}', '${station.id}', '${task.id}', this.textContent)"` : ''}>${task.name}</span>
                                    ${assignBadge}
                                    ${isAdmin ? `<select class="pg-assign-select" onchange="updateTaskAssignment('${phase.id}','${category.id}','${station.id}','${task.id}',this.value)" title="Assign to member" style="font-size:0.65rem;padding:1px 2px;max-width:70px;background:var(--bg-primary);color:var(--text-secondary);border:1px solid var(--border-primary);border-radius:3px;cursor:pointer;">
                                        <option value="">—</option>
                                        ${teamMembers.map(m => `<option value="${m.name}" ${task.assignedTo === m.name ? 'selected' : ''}>${m.name.split(' ')[0]}</option>`).join('')}
                                    </select>` : ''}
                                    ${isAdmin ? `<button class="pg-delete-btn small" onclick="deleteTimelineTask('${phase.id}', '${category.id}', '${station.id}', '${task.id}')" title="Delete Task">×</button>` : ''}
                                </div>`;
                                html += `<div class="pg-col pg-col-dates">
                                    ${canEdit ? `<input type="date" class="pg-date-input small" value="${taskStart}" onchange="updateTaskDate('${phase.id}', '${category.id}', '${station.id}', '${task.id}', 'startDate', this.value)">` : `<span class="pg-date-display">${formatDate(taskStart)}</span>`}
                                </div>`;
                                html += `<div class="pg-col pg-col-dates">
                                    ${canEdit ? `<input type="date" class="pg-date-input small" value="${taskEnd}" onchange="updateTaskDate('${phase.id}', '${category.id}', '${station.id}', '${task.id}', 'endDate', this.value)">` : `<span class="pg-date-display">${formatDate(taskEnd)}</span>`}
                                </div>`;
                                html += `<div class="pg-col pg-col-status">
                                    <select class="pg-status-select" onchange="updatePhaseTaskStatus('${phase.id}', '${category.id}', '${station.id}', '${task.id}', this.value)" ${canEditTask ? '' : 'disabled'}>
                                        <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                        <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                                        <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                                    </select>
                                </div>`;
                                html += `<div class="pg-col pg-col-progress">
                                    <input type="range" min="0" max="100" value="${task.progress}" class="pg-progress-slider" 
                                        onchange="updatePhaseTaskProgress('${phase.id}', '${category.id}', '${station.id}', '${task.id}', this.value)" ${canEditTask ? '' : 'disabled'}>
                                    <span class="pg-progress-text">${task.progress}%</span>
                                </div>`;
                                html += '</div>';
                                
                                // Task timeline bar
                                html += '<div class="phase-gantt-timeline-cells">';
                                for (let w = 0; w < numWeeks; w++) {
                                    const weekStart = new Date(timelineStart);
                                    weekStart.setDate(weekStart.getDate() + (w * 7));
                                    const weekEnd = new Date(weekStart);
                                    weekEnd.setDate(weekEnd.getDate() + 6);
                                    const isCurrentWeek = today >= weekStart && today <= weekEnd;
                                    html += `<div class="pg-week-cell ${isCurrentWeek ? 'current' : ''}"></div>`;
                                }
                                const taskOpacity = task.status === 'Complete' ? '1' : task.status === 'In Progress' ? '0.85' : '0.5';
                                html += `<div class="pg-gantt-bar pg-task-bar" style="left: ${taskBarLeft}px; width: ${taskBarWidth}px; background: ${station.color}; opacity: ${taskOpacity};" title="${task.name}: ${formatDate(taskStart)} - ${formatDate(taskEnd)} (${task.progress}%)">${task.progress}%</div>`;
                                html += '</div></div>';
                            });
                        }
                    });
                }
            });
        }
    });
    
    html += '</div></div>';

    // Swap content without clearing — prevents browser from clamping scrollTop to 0
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const newContent = tmp.firstElementChild;
    const oldContent = container.firstElementChild;
    if (oldContent) {
        container.replaceChild(newContent, oldContent);
    } else {
        container.appendChild(newContent);
    }

    // Restore inner .phase-gantt-container scroll (horizontal timeline scroll)
    if (newContent) {
        newContent.scrollTop = innerScrollTop;
        newContent.scrollLeft = innerScrollLeft;
    }
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
        renderProjectTimeline();
        saveProjectPhases();
    }
}

function toggleCategory(phaseId, categoryId) {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            category.expanded = !category.expanded;
            renderProjectTimeline();
            saveProjectPhases();
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
                renderProjectTimeline();
                saveProjectPhases();
            }
        }
    }
}

function updatePhaseTaskStatus(phaseId, categoryId, stationId, taskId, newStatus) {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;
    const category = phase.categories.find(c => c.id === categoryId);
    if (!category) return;
    const station = category.stations.find(s => s.id === stationId);
    if (!station) return;
    const task = station.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!canEditStation(categoryId, stationId) && !canMemberEditTask(task)) {
        showError('You do not have permission to edit this task');
        renderProjectTimeline();
        return;
    }

    const oldStatus = task.status;
    task.status = newStatus;
    if (newStatus === 'Complete') task.progress = 100;
    else if (newStatus === 'Not Started') task.progress = 0;
    saveProjectPhases();
    renderProjectTimeline();
    showSuccess('Task status updated');
    sendTaskNotificationEmail(task.assignedTo || '', task.name, phase.name, newStatus);

    if (newStatus === 'Complete' && oldStatus !== 'Complete' && currentMember) {
        sendTaskCompletedEmailToAdmins(currentMember.name, task.name, phase.name);
    }
}

function updatePhaseTaskProgress(phaseId, categoryId, stationId, taskId, newProgress) {
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;
    const category = phase.categories.find(c => c.id === categoryId);
    if (!category) return;
    const station = category.stations.find(s => s.id === stationId);
    if (!station) return;
    const task = station.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!canEditStation(categoryId, stationId) && !canMemberEditTask(task)) {
        showError('You do not have permission to edit this task');
        renderProjectTimeline();
        return;
    }

    const oldStatus = task.status;
    task.progress = parseInt(newProgress);
    if (task.progress === 100) task.status = 'Complete';
    else if (task.progress > 0) task.status = 'In Progress';
    else task.status = 'Not Started';
    saveProjectPhases();
    renderProjectTimeline();

    if (task.status === 'Complete' && oldStatus !== 'Complete' && currentMember) {
        sendTaskCompletedEmailToAdmins(currentMember.name, task.name, phase.name);
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

async function saveProjectPhases() {
    // Always save to localStorage first
    localStorage.setItem('loopProjectPhases', JSON.stringify(projectPhases));
    console.log('Project phases saved to localStorage');
    
    // Also save to Firebase if connected
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project-phases'), {
                phases: projectPhases,
                lastUpdated: new Date().toISOString()
            });
            console.log('Project phases saved to Firebase');
        } catch (error) {
            console.error('Error saving project phases to Firebase:', error);
            showError('Changes saved locally. Cloud sync failed.');
        }
    }
}

// ============================================
// EMAIL SERVICE (EmailJS — browser-side, no CORS issues)
// ============================================

async function sendEmail(to, subject, body) {
    const publicKey = localStorage.getItem('loopEmailPublicKey');
    const serviceId = localStorage.getItem('loopEmailServiceId');
    const templateId = localStorage.getItem('loopEmailTemplateId');
    if (!publicKey || !serviceId || !templateId) {
        console.warn('EmailJS not configured — email not sent');
        return false;
    }
    if (typeof emailjs === 'undefined') {
        console.warn('EmailJS SDK not loaded');
        return false;
    }
    try {
        const toAddr = Array.isArray(to) ? to.join(',') : to;
        const escaped = body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
        await emailjs.send(serviceId, templateId, {
            to_email: toAddr,
            subject: subject,
            message_html: `<div style="font-family:Consolas,monospace;font-size:14px;line-height:1.5;white-space:pre-wrap;color:#222;">${escaped}</div>`
        }, publicKey);
        console.log(`Email sent to ${toAddr}: ${subject}`);
        return true;
    } catch (error) {
        console.error('EmailJS send failed:', error);
        return false;
    }
}

function buildPlainEmail(title, lines) {
    const dashboardUrl = `${window.location.origin}${window.location.pathname}`;
    return [
        `LOOP AUTOMATION — ${title}`,
        '─'.repeat(40),
        '',
        ...lines,
        '',
        '─'.repeat(40),
        `Dashboard: ${dashboardUrl}`,
        '',
        'This is an automated message from Loop Automation Project Management.'
    ].join('\n');
}

async function sendTaskNotificationEmail(memberName, taskName, phaseName, newStatus) {
    const member = teamMembers.find(m => m.name === memberName);
    if (!member || !member.email) return;

    const body = buildPlainEmail('Task Status Updated', [
        `Hi ${memberName},`,
        '',
        'A task assigned to you has been updated:',
        '',
        `  Task:   ${taskName}`,
        `  Phase:  ${phaseName}`,
        `  Status: ${newStatus}`,
        '',
        'Please log in to the dashboard to view details.'
    ]);

    await sendEmail(member.email, `Task Update: ${taskName} - ${newStatus}`, body);
}

async function sendInvitationEmail(email, memberName, role, username, password) {
    const credLines = (username && password) ? [
        '',
        'YOUR LOGIN CREDENTIALS:',
        `  Username: ${username}`,
        `  Password: ${password}`,
        '',
        'Use the "Member Login" button on the sidebar to sign in.',
    ] : [];

    const body = buildPlainEmail('Welcome to the Team!', [
        `Hi ${memberName},`,
        '',
        `You've been added to the Loop Automation project team as: ${role}`,
        ...credLines,
        '',
        'What you can do:',
        '  - View the project timeline and phase progress',
        '  - Track your assigned tasks',
        '  - Update task status and progress',
        '  - Edit your profile and add your email',
        '',
        'Log in to the dashboard to get started.'
    ]);

    return await sendEmail(email, `You've been added to Loop Automation`, body);
}

async function sendDeadlineAlerts() {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertDays = 7;
    const upcoming = [];
    const overdue = [];

    projectPhases.forEach(phase => {
        if (!phase.categories) return;
        phase.categories.forEach(category => {
            if (!category.stations) return;
            category.stations.forEach(station => {
                if (!station.tasks) return;
                station.tasks.forEach(task => {
                    if (task.status === 'Complete') return;
                    if (!task.endDate) return;
                    const end = new Date(task.endDate);
                    end.setHours(0, 0, 0, 0);
                    const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
                    const entry = {
                        taskName: task.name,
                        phaseName: phase.name,
                        categoryName: category.name,
                        endDate: task.endDate,
                        status: task.status,
                        daysLeft,
                        assignedTo: task.assignedTo || 'Unassigned'
                    };
                    if (daysLeft < 0) overdue.push(entry);
                    else if (daysLeft <= alertDays) upcoming.push(entry);
                });
            });
        });
    });

    if (overdue.length === 0 && upcoming.length === 0) {
        showSuccess('No deadline alerts — all tasks are on track!');
        return;
    }

    const adminMembers = teamMembers.filter(m => m.email && (m.role === 'PM' || m.role === 'Lead'));
    if (adminMembers.length === 0) {
        showError('No team members with PM/Lead role have email addresses set. Add emails in Team Members.');
        return;
    }

    const lines = [];
    if (overdue.length > 0) {
        lines.push(`OVERDUE TASKS (${overdue.length}):`);
        overdue.forEach(t => {
            lines.push(`  - ${t.taskName} | ${t.phaseName} | Due: ${t.endDate} | ${Math.abs(t.daysLeft)} days overdue | ${t.assignedTo}`);
        });
        lines.push('');
    }
    if (upcoming.length > 0) {
        lines.push(`UPCOMING DEADLINES (${upcoming.length}):`);
        upcoming.forEach(t => {
            lines.push(`  - ${t.taskName} | ${t.phaseName} | Due: ${t.endDate} | ${t.daysLeft} days left | ${t.assignedTo}`);
        });
    }

    const body = buildPlainEmail('Deadline Alert Report', [
        'Here is the current deadline report for Loop Automation:',
        '',
        ...lines
    ]);

    let sentCount = 0;
    for (const member of adminMembers) {
        const sent = await sendEmail(member.email, `Deadline Alert: ${overdue.length} overdue, ${upcoming.length} upcoming`, body);
        if (sent) sentCount++;
    }

    if (sentCount > 0) {
        showSuccess(`Deadline alerts sent to ${sentCount} team lead(s)`);
    } else {
        showError('Failed to send deadline alerts. Check email settings.');
    }
}

async function sendTaskAssignedEmail(toEmail, memberName, taskName, phaseName, categoryName, stationName, startDate, endDate, status) {
    const details = [
        `  Task:       ${taskName}`,
        `  Phase:      ${phaseName}`,
    ];
    if (categoryName) details.push(`  Category:   ${categoryName}`);
    if (stationName) details.push(`  Station:    ${stationName}`);
    if (startDate) details.push(`  Start Date: ${startDate}`);
    if (endDate) details.push(`  Due Date:   ${endDate}`);
    details.push(`  Status:     ${status}`);

    const body = buildPlainEmail('New Task Assignment', [
        `Hi ${memberName},`,
        '',
        'You have been assigned a new task on the Loop Automation project:',
        '',
        ...details,
        '',
        'Please log in to the dashboard to view full details and update your progress.'
    ]);

    return await sendEmail(toEmail, `New Task Assigned: ${taskName}`, body);
}

async function sendTaskCompletedEmailToAdmins(memberName, taskName, phaseName) {
    const adminMembers = teamMembers.filter(m => m.email && (m.role === 'PM' || m.role === 'Lead'));
    if (adminMembers.length === 0) return;

    const now = new Date();
    const timestamp = now.toLocaleString();

    const body = buildPlainEmail('Task Completed', [
        'A task has been marked as Complete:',
        '',
        `  Task:         ${taskName}`,
        `  Phase:        ${phaseName}`,
        `  Completed By: ${memberName}`,
        `  Completed At: ${timestamp}`,
    ]);

    const emails = adminMembers.map(m => m.email);
    await sendEmail(emails, `Task Completed: ${taskName} by ${memberName}`, body);
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

function updatePhaseDate(phaseId, dateType, newDate) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase && newDate) {
        phase[dateType] = newDate;
        saveProjectPhases();
        renderProjectTimeline();
        showSuccess('Phase date updated');
    }
}

function updateCategoryDate(phaseId, categoryId, dateType, newDate) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;
    const category = phase.categories.find(c => c.id === categoryId);
    if (category && newDate) {
        category[dateType] = newDate;
        saveProjectPhases();
        renderProjectTimeline();
        showSuccess('Category date updated');
    }
}

function updateStationDate(phaseId, categoryId, stationId, dateType, newDate) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;
    const category = phase.categories.find(c => c.id === categoryId);
    if (!category) return;
    const station = category.stations.find(s => s.id === stationId);
    if (station && newDate) {
        station[dateType] = newDate;
        saveProjectPhases();
        renderProjectTimeline();
        showSuccess('Station date updated');
    }
}

function completePhase(phaseId) {
    if (!isAdmin) return;
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;
    
    // Count total tasks for confirmation
    let taskCount = 0;
    phase.categories.forEach(cat => {
        cat.stations.forEach(station => {
            taskCount += station.tasks.length;
        });
    });
    
    if (taskCount === 0) {
        showError('This phase has no tasks to complete.');
        return;
    }
    
    if (!confirm(`Mark ALL ${taskCount} tasks in "${phase.name}" as Complete (100%)?\n\nThis will set every task's status to "Complete" and progress to 100%.`)) {
        return;
    }
    
    // Set every task in this phase to Complete / 100%
    phase.categories.forEach(cat => {
        cat.stations.forEach(station => {
            station.tasks.forEach(task => {
                task.status = 'Complete';
                task.progress = 100;
            });
        });
    });
    
    saveProjectPhases();
    renderProjectTimeline();
    showSuccess(`${phase.name}: All ${taskCount} tasks marked as complete!`);
}

function updateTaskDate(phaseId, categoryId, stationId, taskId, dateType, newDate) {
    const canEdit = canEditStation(categoryId, stationId);
    if (!canEdit) return;
    
    const phase = projectPhases.find(p => p.id === phaseId);
    if (phase) {
        const category = phase.categories.find(c => c.id === categoryId);
        if (category) {
            const station = category.stations.find(s => s.id === stationId);
            if (station) {
                const task = station.tasks.find(t => t.id === taskId);
                if (task && newDate) {
                    task[dateType] = newDate;
                    saveProjectPhases();
                    renderProjectTimeline();
                    showSuccess('Task date updated');
                }
            }
        }
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

async function updateTaskAssignment(phaseId, categoryId, stationId, taskId, newAssignee) {
    if (!isAdmin) return;
    const phase = projectPhases.find(p => p.id === phaseId);
    if (!phase) return;
    const category = phase.categories.find(c => c.id === categoryId);
    if (!category) return;
    const station = category.stations.find(s => s.id === stationId);
    if (!station) return;
    const task = station.tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldAssignee = task.assignedTo;
    task.assignedTo = newAssignee;
    saveProjectPhases();
    renderProjectTimeline();

    if (newAssignee && newAssignee !== oldAssignee) {
        const member = teamMembers.find(m => m.name === newAssignee);
        if (member && member.email) {
            const taskStart = task.startDate || station.startDate || category.startDate || phase.startDate || '';
            const taskEnd = task.endDate || station.endDate || category.endDate || phase.endDate || '';
            await sendTaskAssignedEmail(member.email, member.name, task.name, phase.name, category.name || '', station.name || '', taskStart, taskEnd, task.status || 'Not Started');
            showSuccess(`Task assigned to ${newAssignee} — email sent`);
        } else {
            showSuccess(`Task assigned to ${newAssignee}`);
        }
    } else {
        showSuccess('Task assignment updated');
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
window.updatePhaseDate = updatePhaseDate;
window.updateCategoryDate = updateCategoryDate;
window.updateStationDate = updateStationDate;
window.updateTaskDate = updateTaskDate;
window.updateCategoryName = updateCategoryName;
window.updateTimelineStationName = updateTimelineStationName;
window.updateTimelineTaskName = updateTimelineTaskName;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addTimelineStation = addTimelineStation;
window.deleteTimelineStation = deleteTimelineStation;
window.addTimelineTask = addTimelineTask;
window.updateTaskAssignment = updateTaskAssignment;
window.deleteTimelineTask = deleteTimelineTask;
window.completePhase = completePhase;

function exportTimelinePDF() {
    showSuccess('Generating professional timeline PDF...');
    
    // Create print-friendly content in new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showError('Pop-up blocked. Please allow pop-ups for this site.');
        return;
    }
    
    // Calculate timeline metrics
    const totalPhases = projectPhases.length;
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    
    projectPhases.forEach(phase => {
        phase.categories.forEach(cat => {
            cat.stations.forEach(station => {
                station.tasks.forEach(task => {
                    totalTasks++;
                    if (task.status === 'Complete') completedTasks++;
                    else if (task.status === 'In Progress') inProgressTasks++;
                });
            });
        });
    });
    
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Get timeline date range
    const { minDate, maxDate } = getProjectTimelineRange();
    const timelineStart = new Date(minDate);
    timelineStart.setDate(timelineStart.getDate() - 7);
    const totalDays = Math.ceil((maxDate - timelineStart) / (1000 * 60 * 60 * 24)) + 14;
    const dayWidth = Math.max(4, Math.min(12, 700 / totalDays));
    
    // Helper to format dates
    const fmtDate = (d) => {
        if (!d) return '-';
        const date = new Date(d);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    
    // Helper to calculate bar position
    const getBarLeft = (dateStr) => {
        const d = new Date(dateStr);
        const diffDays = Math.floor((d - timelineStart) / (1000 * 60 * 60 * 24));
        return diffDays * dayWidth;
    };
    
    const getBarWidth = (start, end) => {
        const s = new Date(start);
        const e = new Date(end);
        const days = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return Math.max(days * dayWidth, 30);
    };
    
    // ========================================
    // BUILD GANTT OVERVIEW CHART
    // ========================================
    const ganttTimelineWidth = totalDays * dayWidth;
    
    // Generate week markers
    let weekMarkersHTML = '';
    let weekGridLinesHTML = '';
    const weekStart = new Date(timelineStart);
    // Align to Monday
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    
    while (weekStart <= new Date(maxDate.getTime() + 14 * 24 * 60 * 60 * 1000)) {
        const offsetDays = Math.floor((weekStart - timelineStart) / (1000 * 60 * 60 * 24));
        const leftPx = offsetDays * dayWidth;
        const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        weekMarkersHTML += `<div style="position:absolute;left:${leftPx}px;top:0;font-size:8px;color:#666;white-space:nowrap;transform:translateX(-50%)">${weekLabel}</div>`;
        weekGridLinesHTML += `<div style="position:absolute;left:${leftPx}px;top:0;bottom:0;width:1px;background:#e0e0e0"></div>`;
        
        weekStart.setDate(weekStart.getDate() + 7);
    }
    
    // Generate month markers
    let monthMarkersHTML = '';
    const monthStart = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
    while (monthStart <= new Date(maxDate.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        const offsetDays = Math.floor((monthStart - timelineStart) / (1000 * 60 * 60 * 24));
        const leftPx = offsetDays * dayWidth;
        const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        // Calculate month width
        const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
        const monthDays = Math.floor((nextMonth - monthStart) / (1000 * 60 * 60 * 24));
        const monthWidth = monthDays * dayWidth;
        
        monthMarkersHTML += `<div style="position:absolute;left:${leftPx}px;top:0;width:${monthWidth}px;text-align:center;font-size:10px;font-weight:bold;color:#333;border-left:2px solid #999;padding-left:4px">${monthLabel}</div>`;
        
        monthStart.setMonth(monthStart.getMonth() + 1);
    }
    
    // Build Gantt rows for overview
    let ganttRowsHTML = '';
    let rowIndex = 0;
    
    // Today marker position
    const today = new Date();
    const todayOffset = Math.floor((today - timelineStart) / (1000 * 60 * 60 * 24));
    const todayLeft = todayOffset * dayWidth;
    
    projectPhases.forEach(phase => {
        const phaseProgress = calculatePhaseProgress(phase);
        const phaseBarLeft = getBarLeft(phase.startDate || '2026-01-20');
        const phaseBarWidth = getBarWidth(phase.startDate || '2026-01-20', phase.endDate || '2026-04-30');
        const bgColor = rowIndex % 2 === 0 ? '#fafafa' : '#fff';
        
        // Phase row
        ganttRowsHTML += `
            <div style="display:flex;min-height:26px;border-bottom:1px solid #e8e8e8;background:${bgColor}">
                <div style="width:260px;min-width:260px;padding:4px 8px;font-size:10px;font-weight:bold;color:${phase.color};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-right:1px solid #ddd;display:flex;align-items:center;gap:4px">
                    <span style="display:inline-block;width:10px;height:10px;background:${phase.color};border-radius:2px;flex-shrink:0"></span>
                    ${phase.name}
                </div>
                <div style="flex:1;position:relative;min-width:${ganttTimelineWidth}px">
                    ${weekGridLinesHTML}
                    <div style="position:absolute;left:${phaseBarLeft}px;top:3px;height:20px;width:${phaseBarWidth}px;background:linear-gradient(90deg,${phase.color},${phase.color}bb);border-radius:3px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.15)">
                        <span style="color:white;font-size:7px;font-weight:bold;text-shadow:0 1px 1px rgba(0,0,0,0.3)">${phaseProgress}%</span>
                    </div>
                </div>
            </div>`;
        rowIndex++;
        
        // Category rows
        phase.categories.forEach(category => {
            const catProgress = calculateCategoryProgress(category);
            let catStart = phase.startDate, catEnd = phase.endDate;
            category.stations.forEach(station => {
                station.tasks.forEach(task => {
                    if (task.startDate && task.startDate < catStart) catStart = task.startDate;
                    if (task.endDate && task.endDate > catEnd) catEnd = task.endDate;
                });
            });
            const catBarLeft = getBarLeft(catStart);
            const catBarWidth = getBarWidth(catStart, catEnd);
            const bgColor2 = rowIndex % 2 === 0 ? '#fafafa' : '#fff';
            
            ganttRowsHTML += `
                <div style="display:flex;min-height:22px;border-bottom:1px solid #f0f0f0;background:${bgColor2}">
                    <div style="width:260px;min-width:260px;padding:3px 8px 3px 24px;font-size:9px;font-weight:600;color:${category.color};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-right:1px solid #ddd;display:flex;align-items:center">
                        ├ ${category.name}
                    </div>
                    <div style="flex:1;position:relative;min-width:${ganttTimelineWidth}px">
                        ${weekGridLinesHTML}
                        <div style="position:absolute;left:${catBarLeft}px;top:3px;height:16px;width:${catBarWidth}px;background:linear-gradient(90deg,${category.color}cc,${category.color}88);border-radius:2px;display:flex;align-items:center;justify-content:center;overflow:hidden">
                            <span style="color:white;font-size:7px;font-weight:bold;text-shadow:0 1px 1px rgba(0,0,0,0.2)">${catProgress}%</span>
                        </div>
                    </div>
                </div>`;
            rowIndex++;
            
            // Station rows
            category.stations.forEach(station => {
                const stationProgress = calculateStationTasksProgress(station);
                let stationStart = catStart, stationEnd = catEnd;
                if (station.tasks && station.tasks.length > 0) {
                    const taskStarts = station.tasks.filter(t => t.startDate).map(t => t.startDate).sort();
                    const taskEnds = station.tasks.filter(t => t.endDate).map(t => t.endDate).sort().reverse();
                    if (taskStarts.length > 0) stationStart = taskStarts[0];
                    if (taskEnds.length > 0) stationEnd = taskEnds[0];
                }
                const sBarLeft = getBarLeft(stationStart);
                const sBarWidth = getBarWidth(stationStart, stationEnd);
                const bgColor3 = rowIndex % 2 === 0 ? '#fafafa' : '#fff';
                const progressColor = stationProgress === 100 ? '#28a745' : stationProgress > 0 ? station.color : '#aaa';
                
                ganttRowsHTML += `
                    <div style="display:flex;min-height:20px;border-bottom:1px solid #f5f5f5;background:${bgColor3}">
                        <div style="width:260px;min-width:260px;padding:2px 8px 2px 44px;font-size:8px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border-right:1px solid #ddd;display:flex;align-items:center">
                            └ ${station.name}
                        </div>
                        <div style="flex:1;position:relative;min-width:${ganttTimelineWidth}px">
                            ${weekGridLinesHTML}
                            <div style="position:absolute;left:${sBarLeft}px;top:3px;height:14px;width:${sBarWidth}px;background:${progressColor}88;border-radius:2px;overflow:hidden">
                                <div style="height:100%;width:${stationProgress}%;background:${progressColor};border-radius:2px"></div>
                            </div>
                        </div>
                    </div>`;
                rowIndex++;
            });
        });
    });
    
    // Build the complete Gantt overview section
    const ganttOverviewHTML = `
        <div style="margin-bottom:30px;page-break-inside:avoid">
            <h2 style="color:#00a080;font-size:18px;margin:0 0 15px;display:flex;align-items:center;gap:10px">
                <span style="font-size:22px">📊</span> Project Timeline Overview
            </h2>
            <div style="border:1px solid #ddd;border-radius:8px;overflow:hidden;background:white">
                <div style="overflow-x:auto">
                    <div style="min-width:${260 + ganttTimelineWidth}px">
                        <!-- Month headers -->
                        <div style="display:flex;border-bottom:2px solid #ccc;background:#f0f4f8">
                            <div style="width:260px;min-width:260px;padding:6px 8px;font-size:10px;font-weight:bold;color:#333;border-right:1px solid #ddd">Phase / Category / Station</div>
                            <div style="flex:1;position:relative;height:24px;min-width:${ganttTimelineWidth}px">
                                ${monthMarkersHTML}
                            </div>
                        </div>
                        <!-- Week headers -->
                        <div style="display:flex;border-bottom:1px solid #ddd;background:#f8f9fa">
                            <div style="width:260px;min-width:260px;padding:4px 8px;font-size:8px;color:#999;border-right:1px solid #ddd">Timeline →</div>
                            <div style="flex:1;position:relative;height:20px;min-width:${ganttTimelineWidth}px">
                                ${weekMarkersHTML}
                            </div>
                        </div>
                        <!-- Gantt bars -->
                        ${ganttRowsHTML}
                        <!-- Today marker -->
                        ${todayLeft > 0 && todayLeft < ganttTimelineWidth ? `
                        <div style="position:absolute;left:${260 + todayLeft}px;top:48px;bottom:0;width:2px;background:#ff4444;z-index:10;opacity:0.7">
                            <div style="position:absolute;top:-16px;left:-20px;background:#ff4444;color:white;font-size:7px;padding:2px 5px;border-radius:3px;white-space:nowrap">Today</div>
                        </div>` : ''}
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:20px;margin-top:8px;justify-content:center">
                <div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#666">
                    <span style="display:inline-block;width:12px;height:8px;background:#28a745;border-radius:2px"></span> Complete
                </div>
                <div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#666">
                    <span style="display:inline-block;width:12px;height:8px;background:#17a2b8;border-radius:2px"></span> In Progress
                </div>
                <div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#666">
                    <span style="display:inline-block;width:12px;height:8px;background:#aaa;border-radius:2px"></span> Not Started
                </div>
                <div style="display:flex;align-items:center;gap:4px;font-size:8px;color:#666">
                    <span style="display:inline-block;width:12px;height:2px;background:#ff4444;border-radius:1px"></span> Today
                </div>
            </div>
        </div>`;

    // Build phase sections
    let phasesHTML = '';
    projectPhases.forEach(phase => {
        const phaseProgress = calculatePhaseProgress(phase);
        const phaseStart = phase.startDate || '2026-01-20';
        const phaseEnd = phase.endDate || '2026-04-18';
        const phaseDays = Math.ceil((new Date(phaseEnd) - new Date(phaseStart)) / (1000 * 60 * 60 * 24)) + 1;
        
        // Phase Gantt bar
        const phaseBarLeft = getBarLeft(phaseStart);
        const phaseBarWidth = getBarWidth(phaseStart, phaseEnd);
        
        // Count phase stats
        let phaseTasks = 0, phaseComplete = 0, phaseInProgress = 0;
        phase.categories.forEach(cat => {
            cat.stations.forEach(station => {
                station.tasks.forEach(task => {
                    phaseTasks++;
                    if (task.status === 'Complete') phaseComplete++;
                    else if (task.status === 'In Progress') phaseInProgress++;
                });
            });
        });
        
        let categoriesHTML = '';
        phase.categories.forEach(category => {
            const catProgress = calculateCategoryProgress(category);
            
            // Get category date range
            let catStart = phaseStart, catEnd = phaseEnd;
            category.stations.forEach(station => {
                station.tasks.forEach(task => {
                    if (task.startDate && task.startDate < catStart) catStart = task.startDate;
                    if (task.endDate && task.endDate > catEnd) catEnd = task.endDate;
                });
            });
            
            let stationsHTML = '';
            category.stations.forEach(station => {
                const stationProgress = calculateStationTasksProgress(station);
                
                // Get station date range
                let stationStart = catStart, stationEnd = catEnd;
                if (station.tasks && station.tasks.length > 0) {
                    const taskStarts = station.tasks.filter(t => t.startDate).map(t => t.startDate).sort();
                    const taskEnds = station.tasks.filter(t => t.endDate).map(t => t.endDate).sort().reverse();
                    if (taskStarts.length > 0) stationStart = taskStarts[0];
                    if (taskEnds.length > 0) stationEnd = taskEnds[0];
                }
                
                const stationBarLeft = getBarLeft(stationStart);
                const stationBarWidth = getBarWidth(stationStart, stationEnd);
                
                // Task rows
                let taskRows = '';
                station.tasks.forEach(task => {
                    const statusColor = task.status === 'Complete' ? '#28a745' : 
                                       task.status === 'In Progress' ? '#17a2b8' : 
                                       task.status === 'On Hold' ? '#ffc107' : '#6c757d';
                    const taskStart = task.startDate || stationStart;
                    const taskEnd = task.endDate || stationEnd;
                    const taskBarLeft = getBarLeft(taskStart);
                    const taskBarWidth = getBarWidth(taskStart, taskEnd);
                    const taskOpacity = task.status === 'Complete' ? '1' : task.status === 'In Progress' ? '0.85' : '0.5';
                    
                    taskRows += `
                        <tr>
                            <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:10px;padding-left:40px">• ${task.name}</td>
                            <td style="padding:5px;border-bottom:1px solid #eee;text-align:center;font-size:9px">${fmtDate(taskStart)}</td>
                            <td style="padding:5px;border-bottom:1px solid #eee;text-align:center;font-size:9px">${fmtDate(taskEnd)}</td>
                            <td style="padding:5px;border-bottom:1px solid #eee;text-align:center">
                                <span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:bold;background:${statusColor}22;color:${statusColor}">${task.status}</span>
                            </td>
                            <td style="padding:5px;border-bottom:1px solid #eee;text-align:center;font-size:9px;font-weight:bold;color:${statusColor}">${task.progress}%</td>
                            <td style="padding:5px;border-bottom:1px solid #eee;width:200px">
                                <div style="position:relative;height:12px;background:#f0f0f0;border-radius:2px;overflow:hidden">
                                    <div style="position:absolute;left:${taskBarLeft}px;top:1px;height:10px;width:${taskBarWidth}px;background:${station.color};opacity:${taskOpacity};border-radius:2px"></div>
                                </div>
                            </td>
                        </tr>`;
                });
                
                const statusText = stationProgress === 100 ? 'Complete' : stationProgress > 0 ? 'In Progress' : 'Not Started';
                const statusColor = stationProgress === 100 ? '#28a745' : stationProgress > 0 ? '#17a2b8' : '#6c757d';
                
                stationsHTML += `
                    <div style="margin-left:15px;margin-bottom:12px;padding:10px;background:#fdfdfd;border-radius:6px;border:1px solid #e8e8e8">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                            <div style="display:flex;align-items:center;gap:8px">
                                <span style="display:inline-block;width:24px;height:24px;background:${station.color};color:white;border-radius:4px;text-align:center;line-height:24px;font-size:10px;font-weight:bold">S${station.stationNum}</span>
                                <span style="font-weight:600;font-size:11px;color:#333">${station.name}</span>
                            </div>
                            <div style="display:flex;align-items:center;gap:10px">
                                <span style="font-size:9px;color:#666">${fmtDate(stationStart)} - ${fmtDate(stationEnd)}</span>
                                <span style="padding:3px 8px;border-radius:4px;font-size:9px;font-weight:bold;background:${statusColor}22;color:${statusColor}">${statusText}</span>
                                <span style="font-size:12px;font-weight:bold;color:${station.color}">${stationProgress}%</span>
                            </div>
                        </div>
                        <div style="position:relative;height:14px;background:#f5f5f5;border-radius:3px;margin-bottom:8px;overflow:hidden">
                            <div style="position:absolute;left:${stationBarLeft}px;top:2px;height:10px;width:${stationBarWidth}px;background:linear-gradient(90deg,${station.color},${station.color}cc);border-radius:2px"></div>
                        </div>
                        ${station.tasks.length > 0 ? `
                        <table style="width:100%;border-collapse:collapse;margin-top:5px">
                            <tr style="background:#f8f8f8">
                                <th style="padding:5px 8px;text-align:left;font-size:9px;color:#666;font-weight:600">Task</th>
                                <th style="padding:5px;text-align:center;font-size:9px;color:#666;font-weight:600">Start</th>
                                <th style="padding:5px;text-align:center;font-size:9px;color:#666;font-weight:600">End</th>
                                <th style="padding:5px;text-align:center;font-size:9px;color:#666;font-weight:600">Status</th>
                                <th style="padding:5px;text-align:center;font-size:9px;color:#666;font-weight:600">Progress</th>
                                <th style="padding:5px;text-align:center;font-size:9px;color:#666;font-weight:600;width:200px">Timeline</th>
                            </tr>
                            ${taskRows}
                        </table>` : '<p style="font-size:10px;color:#999;font-style:italic;margin:5px 0">No tasks defined</p>'}
                    </div>`;
            });
            
            categoriesHTML += `
                <div style="margin-bottom:15px">
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:${category.color}15;border-left:3px solid ${category.color};border-radius:0 4px 4px 0;margin-bottom:8px">
                        <span style="font-weight:600;font-size:12px;color:${category.color}">${category.name}</span>
                        <div style="display:flex;align-items:center;gap:15px">
                            <span style="font-size:10px;color:#666">${fmtDate(catStart)} - ${fmtDate(catEnd)}</span>
                            <span style="font-size:11px;font-weight:bold;color:${category.color}">${catProgress}%</span>
                        </div>
                    </div>
                    ${stationsHTML}
                </div>`;
        });
        
        phasesHTML += `
            <div style="margin-bottom:25px;page-break-inside:avoid">
                <div style="background:linear-gradient(135deg,${phase.color}18,${phase.color}08);border:1px solid ${phase.color}40;border-radius:8px;padding:15px;margin-bottom:12px">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <h3 style="margin:0;color:${phase.color};font-size:16px;display:flex;align-items:center;gap:8px">
                                <span style="font-size:20px">◆</span>
                                ${phase.name}
                            </h3>
                            <p style="margin:8px 0 0;font-size:11px;color:#666">
                                <strong>Duration:</strong> ${fmtDate(phaseStart)} → ${fmtDate(phaseEnd)} (${phaseDays} days)
                            </p>
                        </div>
                        <div style="text-align:right">
                            <div style="font-size:28px;font-weight:bold;color:${phase.color}">${phaseProgress}%</div>
                            <div style="font-size:10px;color:#666">${phaseComplete}/${phaseTasks} tasks complete</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:15px;margin-top:12px">
                        <div style="flex:1;text-align:center;padding:8px;background:white;border-radius:4px">
                            <div style="font-size:18px;font-weight:bold;color:#17a2b8">${phaseTasks}</div>
                            <div style="font-size:9px;color:#666">Total Tasks</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:8px;background:white;border-radius:4px">
                            <div style="font-size:18px;font-weight:bold;color:#28a745">${phaseComplete}</div>
                            <div style="font-size:9px;color:#666">Completed</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:8px;background:white;border-radius:4px">
                            <div style="font-size:18px;font-weight:bold;color:#ffc107">${phaseInProgress}</div>
                            <div style="font-size:9px;color:#666">In Progress</div>
                        </div>
                        <div style="flex:1;text-align:center;padding:8px;background:white;border-radius:4px">
                            <div style="font-size:18px;font-weight:bold;color:#6c757d">${phaseTasks - phaseComplete - phaseInProgress}</div>
                            <div style="font-size:9px;color:#666">Not Started</div>
                        </div>
                    </div>
                    <div style="margin-top:12px">
                        <div style="font-size:9px;color:#666;margin-bottom:4px">PHASE TIMELINE</div>
                        <div style="position:relative;height:20px;background:#f5f5f5;border-radius:4px;overflow:hidden">
                            <div style="position:absolute;left:${phaseBarLeft}px;top:3px;height:14px;width:${phaseBarWidth}px;background:linear-gradient(90deg,${phase.color},${phase.color}aa);border-radius:3px;display:flex;align-items:center;justify-content:center;color:white;font-size:8px;font-weight:bold">${phase.name}</div>
                        </div>
                    </div>
                </div>
                ${categoriesHTML}
            </div>`;
    });
    
    // Write the print document
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
    <title>Loop Automation - Project Timeline Report</title>
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
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 25px; 
            color: #333;
            line-height: 1.4;
        }
        div, span, td, th, tr, table {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        @media print {
            body { padding: 15px; }
            .no-print { display: none !important; }
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }
        @page {
            margin: 0.5in;
        }
    </style>
</head>
<body>
    <div style="text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:4px solid #00d4aa">
        <h1 style="color:#00d4aa;margin:0;font-size:28px;letter-spacing:2px">LOOP AUTOMATION</h1>
        <p style="color:#666;margin-top:10px;font-size:14px">Project Timeline Report</p>
        <p style="color:#999;font-size:11px;margin-top:5px">Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
    
    <div style="background:linear-gradient(135deg,#f8f9fa,#e9ecef);padding:25px;margin-bottom:30px;border-radius:10px;border:1px solid #dee2e6">
        <h2 style="color:#00a080;margin:0 0 20px;font-size:16px;border-bottom:2px solid #00d4aa;padding-bottom:10px;display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">📊</span> Executive Summary
        </h2>
        <table style="width:100%;border-collapse:separate;border-spacing:12px 0">
            <tr>
                <td style="text-align:center;padding:20px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                    <div style="font-size:36px;font-weight:bold;color:#7c3aed">${totalPhases}</div>
                    <div style="font-size:11px;color:#666;margin-top:5px;text-transform:uppercase;letter-spacing:1px">Phases</div>
                </td>
                <td style="text-align:center;padding:20px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                    <div style="font-size:36px;font-weight:bold;color:#17a2b8">${totalTasks}</div>
                    <div style="font-size:11px;color:#666;margin-top:5px;text-transform:uppercase;letter-spacing:1px">Total Tasks</div>
                </td>
                <td style="text-align:center;padding:20px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                    <div style="font-size:36px;font-weight:bold;color:#28a745">${completedTasks}</div>
                    <div style="font-size:11px;color:#666;margin-top:5px;text-transform:uppercase;letter-spacing:1px">Completed</div>
                </td>
                <td style="text-align:center;padding:20px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                    <div style="font-size:36px;font-weight:bold;color:#ffc107">${inProgressTasks}</div>
                    <div style="font-size:11px;color:#666;margin-top:5px;text-transform:uppercase;letter-spacing:1px">In Progress</div>
                </td>
                <td style="text-align:center;padding:20px;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
                    <div style="font-size:36px;font-weight:bold;color:#00d4aa">${overallProgress}%</div>
                    <div style="font-size:11px;color:#666;margin-top:5px;text-transform:uppercase;letter-spacing:1px">Overall Progress</div>
                </td>
            </tr>
        </table>
        <div style="margin-top:20px">
            <div style="font-size:10px;color:#666;margin-bottom:5px">OVERALL PROJECT PROGRESS</div>
            <div style="height:24px;background:#e0e0e0;border-radius:12px;overflow:hidden;position:relative">
                <div style="height:100%;width:${overallProgress}%;background:linear-gradient(90deg,#00d4aa,#00a080);border-radius:12px;display:flex;align-items:center;justify-content:center">
                    <span style="color:white;font-size:11px;font-weight:bold">${overallProgress}% Complete</span>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:9px;color:#999;margin-top:3px">
                <span>Project Start: ${fmtDate(minDate)}</span>
                <span>Project End: ${fmtDate(maxDate)}</span>
            </div>
        </div>
    </div>
    
    ${ganttOverviewHTML}
    
    <h2 style="color:#00a080;font-size:18px;margin:25px 0 20px;display:flex;align-items:center;gap:10px">
        <span style="font-size:22px">📋</span> Phase Details
    </h2>
    
    ${phasesHTML}
    
    <div style="text-align:center;margin-top:40px;padding-top:25px;border-top:2px solid #e0e0e0;color:#999;font-size:10px">
        <p style="margin-bottom:5px"><strong style="color:#00d4aa">Loop Automation</strong> Project Management System</p>
        <p>This report was automatically generated. For questions, contact your project administrator.</p>
    </div>
    
    <div class="no-print" style="position:fixed;top:0;left:0;right:0;background:linear-gradient(90deg,#ffe066,#ffcc00);color:#333;padding:12px 20px;text-align:center;font-size:12px;z-index:9999;border-bottom:2px solid #cc9900;box-shadow:0 2px 10px rgba(0,0,0,0.2)">
        <strong>⚠️ Print Tip:</strong> In the print dialog, expand "More settings" and enable <strong>"Background graphics"</strong> to see all colors and timeline bars in your PDF.
        <button onclick="window.print()" style="margin-left:20px;padding:6px 15px;background:#00d4aa;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold">🖨️ Print Now</button>
    </div>
    
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`);
    
    printWindow.document.close();
}

async function exportTimelineImage() {
    showSuccess('Preparing HD projector image — capturing current view...');

    const container = document.getElementById('timeline-container');
    if (!container) {
        showError('Timeline not found. Switch to the Project Timeline view first.');
        return;
    }

    const ganttEl = container.querySelector('.phase-gantt-container') || container;
    const unifiedEl = container.querySelector('.phase-gantt-unified') || ganttEl;

    const projectorCSS = document.createElement('style');
    projectorCSS.id = 'projector-export-overrides';
    projectorCSS.textContent = `
        .timeline-container,
        .phase-gantt-container,
        .phase-gantt-unified { overflow: visible !important; max-height: none !important; height: auto !important; }

        .phase-gantt-unified {
            --bg-primary: #141e2b !important;
            --bg-secondary: #1a2636 !important;
            --text-primary: #ffffff !important;
            --text-secondary: #d0d8e0 !important;
            --border-primary: #3e5068 !important;
        }
        .phase-gantt-unified * { font-weight: inherit; }
        .phase-gantt-unified .phase-gantt-header-row,
        .phase-gantt-unified .pg-week-header { background: #1a2636 !important; border-color: #3e5068 !important; }
        .phase-gantt-unified .pg-week-header .pg-week-label,
        .phase-gantt-unified .pg-week-header .pg-week-date { color: #e8ecf0 !important; font-weight: 600 !important; }
        .phase-gantt-unified .pg-week-header.current { background: #1e3a28 !important; }
        .phase-gantt-unified .pg-week-header.current .pg-week-label,
        .phase-gantt-unified .pg-week-header.current .pg-week-date { color: #4afa9a !important; }

        .phase-gantt-unified .phase-gantt-info-header { background: #1a2636 !important; border-color: #3e5068 !important; }
        .phase-gantt-unified .phase-gantt-info-header .pg-col { color: #e8ecf0 !important; font-weight: 700 !important; }

        .phase-gantt-unified .phase-gantt-row { border-color: #2a3a50 !important; }
        .phase-gantt-unified .phase-gantt-row.phase-row { background: #141e2b !important; }
        .phase-gantt-unified .phase-gantt-row.category-row { background: #172030 !important; }
        .phase-gantt-unified .phase-gantt-row.station-row { background: #1a2438 !important; }
        .phase-gantt-unified .phase-gantt-row.task-row { background: #1c2840 !important; }

        .phase-gantt-unified .phase-gantt-info-cells { border-color: #3e5068 !important; }

        .phase-gantt-unified .pg-phase-name strong { font-weight: 800 !important; text-shadow: 0 0 8px currentColor; }
        .phase-gantt-unified .pg-category-name span { font-weight: 700 !important; }
        .phase-gantt-unified .pg-station-name span.editable-name { color: #e0e8f0 !important; font-weight: 600 !important; }
        .phase-gantt-unified .pg-task-name span.editable-name { color: #ccd4dc !important; font-weight: 500 !important; }

        .phase-gantt-unified .pg-date-display { color: #b0bcc8 !important; }
        .phase-gantt-unified .pg-date-input { color: #d0d8e4 !important; background: #1e2e42 !important; border-color: #3e5068 !important; }

        .phase-gantt-unified .pg-progress-text { color: #e0e8f0 !important; font-weight: 600 !important; }
        .phase-gantt-unified .pg-progress-bar { background: #253040 !important; }

        .phase-gantt-unified .phase-badge,
        .phase-gantt-unified .category-badge { font-weight: 700 !important; }

        .phase-gantt-unified .status-badge { font-weight: 600 !important; }

        .phase-gantt-unified .pg-gantt-bar { font-weight: 700 !important; text-shadow: 0 1px 3px rgba(0,0,0,0.5) !important; box-shadow: 0 0 6px rgba(255,255,255,0.15) !important; }
        .phase-gantt-unified .pg-gantt-bar.pg-phase-bar { filter: brightness(1.15) saturate(1.2) !important; }
        .phase-gantt-unified .pg-gantt-bar.pg-category-bar { filter: brightness(1.15) saturate(1.2) !important; }
        .phase-gantt-unified .pg-gantt-bar.pg-station-bar { filter: brightness(1.1) saturate(1.15) !important; }
        .phase-gantt-unified .pg-gantt-bar.pg-task-bar { filter: brightness(1.2) saturate(1.2) !important; opacity: 1 !important; }

        .phase-gantt-unified .pg-week-cell { border-color: #253040 !important; }
        .phase-gantt-unified .pg-week-cell.current { background: rgba(0,212,170,0.08) !important; }

        .phase-gantt-unified .pg-station-number { font-weight: 700 !important; filter: brightness(1.2) saturate(1.2) !important; }
        .phase-gantt-unified .pg-group-lead-badge { color: #a0c0e0 !important; }
        .phase-gantt-unified .pg-my-station-badge { filter: brightness(1.2) !important; }
        .phase-gantt-unified .pg-expand-btn { display: none !important; }
        .phase-gantt-unified .pg-add-btn,
        .phase-gantt-unified .pg-delete-btn,
        .phase-gantt-unified .pg-complete-phase-btn { display: none !important; }
        .phase-gantt-unified .pg-status-select { color: #d0d8e4 !important; background: #1e2e42 !important; border-color: #3e5068 !important; font-weight: 600 !important; }
    `;
    document.head.appendChild(projectorCSS);

    await new Promise(r => setTimeout(r, 400));

    const captureW = unifiedEl.scrollWidth || unifiedEl.offsetWidth;
    const captureH = unifiedEl.scrollHeight || unifiedEl.offsetHeight;

    try {
        showSuccess('Rendering HD image at 3x resolution...');
        const canvas = await html2canvas(unifiedEl, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#141e2b',
            logging: false,
            width: captureW,
            height: captureH,
            windowWidth: captureW + 40,
            windowHeight: captureH + 40,
            x: 0, y: 0, scrollX: 0, scrollY: 0,
        });

        const headerH = 90;
        const pad = 30;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = canvas.width + pad * 2;
        finalCanvas.height = canvas.height + headerH + pad * 2;
        const ctx = finalCanvas.getContext('2d');

        ctx.fillStyle = '#141e2b';
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        const scale = 3;
        ctx.fillStyle = '#00d4aa';
        ctx.font = `bold ${22 * scale}px "DM Sans", sans-serif`;
        ctx.fillText('Loop Automation — Project Timeline', pad, pad + 28 * scale);

        ctx.fillStyle = '#8899aa';
        ctx.font = `${11 * scale}px "DM Sans", sans-serif`;
        const genDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        ctx.fillText(`Generated: ${genDate}    |    HD Export for Projector Presentation`, pad, pad + 48 * scale);

        let totalTasks = 0, completedTasks = 0;
        projectPhases.forEach(ph => ph.categories.forEach(c => c.stations.forEach(s => s.tasks.forEach(t => {
            totalTasks++;
            if (t.status === 'Complete') completedTasks++;
        }))));
        const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        ctx.fillStyle = '#00d4aa';
        ctx.font = `bold ${28 * scale}px "DM Sans", sans-serif`;
        const pctText = `${pct}%`;
        const pctW = ctx.measureText(pctText).width;
        ctx.fillText(pctText, finalCanvas.width - pad - pctW, pad + 28 * scale);
        ctx.fillStyle = '#8899aa';
        ctx.font = `${10 * scale}px "DM Sans", sans-serif`;
        const subText = `${completedTasks}/${totalTasks} tasks complete`;
        const subW = ctx.measureText(subText).width;
        ctx.fillText(subText, finalCanvas.width - pad - subW, pad + 45 * scale);

        ctx.strokeStyle = '#00d4aa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pad, headerH - 10);
        ctx.lineTo(finalCanvas.width - pad, headerH - 10);
        ctx.stroke();

        ctx.drawImage(canvas, pad, headerH + 4);

        finalCanvas.toBlob(function(blob) {
            if (!blob) { showError('Image generation failed.'); return; }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LoopAutomation_ProjectTimeline_HD_${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSuccess(`HD projector image exported! (${finalCanvas.width}x${finalCanvas.height}px)`);
        }, 'image/png');
    } catch (err) {
        console.error('HD image export failed:', err);
        showError('Image export failed: ' + err.message);
    }

    document.head.removeChild(projectorCSS);
}

window.togglePhase = togglePhase;
window.toggleCategory = toggleCategory;
window.toggleTimelineStation = toggleTimelineStation;
window.updatePhaseTaskStatus = updatePhaseTaskStatus;
window.updatePhaseTaskProgress = updatePhaseTaskProgress;
window.expandAllPhases = expandAllPhases;
window.collapseAllPhases = collapseAllPhases;
window.exportTimelinePDF = exportTimelinePDF;
window.exportTimelineImage = exportTimelineImage;

// ============================================
// GROUP LEAD MANAGEMENT
// ============================================

function saveGroupLeads() {
    localStorage.setItem('loopGroupLeads', JSON.stringify(groupLeads));
}

function canEditStation(categoryId, stationId) {
    if (isAdmin) return true;
    
    if (currentGroupLead) {
        const station = findStationInPhases(categoryId, stationId);
        if (station && station.groupLeadId === currentGroupLead.id) {
            return true;
        }
    }
    
    return false;
}

function canMemberEditTask(task) {
    if (isAdmin) return true;
    if (currentGroupLead) return true;
    if (currentMember && task.assignedTo === currentMember.name) return true;
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
    const memberLoginBtn = document.getElementById('member-login-btn');
    
    if (currentGroupLead) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (memberLoginBtn) memberLoginBtn.style.display = 'none';
        currentMember = null;
        updateMemberUI();
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
        if (memberLoginBtn && !isAdmin && !currentMember) memberLoginBtn.style.display = 'flex';
        if (indicator) indicator.style.display = 'none';
    }
}

// ============================================
// MEMBER LOGIN
// ============================================

function showMemberLoginModal() {
    let modal = document.getElementById('member-login-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'member-login-modal';
        modal.className = 'modal-overlay';
        modal.onclick = (e) => { if (e.target === modal) closeModal('member-login-modal'); };
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
        <div class="modal" style="max-width: 400px;">
            <div class="modal-header">
                <h2>Member Login</h2>
                <button class="modal-close" onclick="closeModal('member-login-modal')">&times;</button>
            </div>
            <form id="member-login-form" class="modal-body" onsubmit="memberLogin(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label for="ml-username">Username</label>
                        <input type="text" id="ml-username" required placeholder="Enter your username">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="ml-password">Password</label>
                        <input type="password" id="ml-password" required placeholder="Enter your password">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary" onclick="closeModal('member-login-modal')">Cancel</button>
                    <button type="submit" class="btn-primary">Login</button>
                </div>
            </form>
        </div>
    `;
    openModal('member-login-modal');
}

function memberLogin(event) {
    event.preventDefault();
    const username = document.getElementById('ml-username').value.trim();
    const password = document.getElementById('ml-password').value;

    const member = teamMembers.find(m => m.username === username && m.password === password);
    if (member) {
        currentMember = member;
        closeModal('member-login-modal');
        updateMemberUI();
        renderAllViews();
        showSuccess(`Welcome, ${member.name}!`);
    } else {
        showError('Invalid username or password');
    }
}

function memberLogout() {
    currentMember = null;
    updateMemberUI();
    renderAllViews();
    showSuccess('Logged out');
}

function updateMemberUI() {
    const loginBtn = document.getElementById('member-login-btn');
    const indicator = document.getElementById('member-indicator');
    const groupLeadBtn = document.getElementById('groupLead-login-btn');

    if (currentMember) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (groupLeadBtn) groupLeadBtn.style.display = 'none';
        if (indicator) {
            indicator.style.display = 'flex';
            indicator.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: ${currentMember.color}15; border-radius: 6px; border: 1px solid ${currentMember.color}40;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: ${currentMember.color}; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; color: #fff;">
                        ${currentMember.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                        <div style="color: ${currentMember.color}; font-size: 0.8rem; font-weight: 600;">${currentMember.name}</div>
                        <div style="color: var(--text-muted); font-size: 0.65rem;">${currentMember.role}</div>
                    </div>
                </div>
                <button class="btn-logout" onclick="memberLogout()" style="margin-top: 4px;">
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
        if (loginBtn) loginBtn.style.display = (isAdmin || currentGroupLead) ? 'none' : 'flex';
        if (indicator) indicator.style.display = 'none';
        if (groupLeadBtn && !isAdmin) groupLeadBtn.style.display = currentGroupLead ? 'none' : 'flex';
    }
}

function editMemberProfile() {
    if (!currentMember) return;
    const index = teamMembers.findIndex(m => m.name === currentMember.name);
    if (index === -1) return;

    const member = teamMembers[index];
    document.getElementById('team-modal-title').textContent = 'Edit My Profile';
    document.getElementById('member-index').value = index;
    document.getElementById('member-name').value = member.name;
    document.getElementById('member-role').value = member.role;
    document.getElementById('member-target').value = member.targetHours;
    document.getElementById('member-email').value = member.email || '';
    document.getElementById('member-username').value = member.username || '';
    document.getElementById('member-password').value = member.password || '';
    document.getElementById('member-color').value = member.color;

    // Disable admin-only fields for self-edit
    document.getElementById('member-role').disabled = true;
    document.getElementById('member-target').disabled = true;
    document.getElementById('member-username').disabled = true;
    document.getElementById('member-password').disabled = true;

    openModal('team-modal');
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
// STATION TASK MANAGEMENT
// ============================================

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
    
    // Save scroll position before re-render
    const prevScrollTop = grid ? grid.scrollTop : 0;
    const prevScrollLeft = grid ? grid.scrollLeft : 0;
    
    // Hide admin-only buttons if not admin
    const addMemberBtn = document.querySelector('#team-view .header-actions .btn-primary');
    if (addMemberBtn) {
        addMemberBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    const clearTaskBtn = document.getElementById('clear-task-data-btn');
    if (clearTaskBtn) {
        clearTaskBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    const emailSettingsBtn = document.getElementById('email-settings-btn');
    if (emailSettingsBtn) {
        emailSettingsBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    const exportTsBtn = document.getElementById('export-timesheet-btn');
    if (exportTsBtn) {
        exportTsBtn.style.display = isAdmin ? 'flex' : 'none';
    }
    
    grid.innerHTML = teamMembers.map((member, index) => {
        const assignedHours = getAssignedHours(member.name);
        const taskCount = getAllTasks().filter(t => t.assignedTo === member.name).length;
        const loadPercent = member.targetHours > 0 ? (assignedHours / member.targetHours) * 100 : 0;
        
        let loadColor = '#28a745';
        if (loadPercent > 80 && loadPercent <= 100) loadColor = '#00d4aa';
        if (loadPercent > 100) loadColor = '#dc3545';
        
        const isOwnCard = currentMember && currentMember.name === member.name;
        let headerButtons = '';
        if (isAdmin) {
            headerButtons = `
                <div style="display:flex;gap:4px;margin-left:auto;" onclick="event.stopPropagation()">
                    <button onclick="editTeamMember(${index}); event.stopPropagation();" style="padding:4px 10px;font-size:0.7rem;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-primary);border-radius:5px;cursor:pointer;font-family:inherit;">Edit</button>
                    ${member.email ? `<button onclick="resendInvite(${index}); event.stopPropagation();" title="Send invitation email" style="padding:4px 8px;font-size:0.7rem;background:#00d4aa15;color:#00d4aa;border:1px solid #00d4aa30;border-radius:5px;cursor:pointer;font-family:inherit;">Invite</button>` : ''}
                    <button onclick="deleteTeamMember(${index}); event.stopPropagation();" style="padding:4px 8px;font-size:0.7rem;background:#dc354515;color:#dc3545;border:1px solid #dc354530;border-radius:5px;cursor:pointer;font-family:inherit;">✕</button>
                </div>`;
        } else if (isOwnCard) {
            headerButtons = `
                <div style="margin-left:auto;" onclick="event.stopPropagation()">
                    <button onclick="editMemberProfile(); event.stopPropagation();" style="padding:4px 10px;font-size:0.7rem;background:${member.color}15;color:${member.color};border:1px solid ${member.color}30;border-radius:5px;cursor:pointer;font-family:inherit;">Edit Profile</button>
                </div>`;
        }
        
        return `
            <div class="team-card" style="--member-color: ${member.color}" onclick="openMemberTasks('${member.name.replace(/'/g, "\\'")}', ${index})">
                <div class="team-card-header">
                    <div class="team-avatar" style="background: ${member.color}">${getInitials(member.name)}</div>
                    <div class="team-info">
                        <h4>${member.name}</h4>
                        <span class="team-role">${member.role}</span>
                    </div>
                    ${headerButtons}
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
            </div>
        `;
    }).join('');
    
    // Restore scroll position after re-render
    requestAnimationFrame(() => {
        if (grid) {
            grid.scrollTop = prevScrollTop;
            grid.scrollLeft = prevScrollLeft;
        }
    });
}

async function clearAllTaskData() {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }
    
    if (!confirm('This will reset ALL task assignments, statuses, hours, and progress for every station.\n\nThis action cannot be undone. Continue?')) {
        return;
    }
    
    let cleared = 0;
    stations.forEach(station => {
        if (station.tasks) {
            station.tasks.forEach(task => {
                task.assignedTo = '';
                task.status = 'Not Started';
                task.progress = 0;
                task.estHours = 0;
                task.actualHours = 0;
                cleared++;
            });
        }
    });
    
    await saveStations(stations);
    renderTeam();
    showSuccess(`Cleared task data for ${cleared} tasks across ${stations.length} stations`);
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
                                id="hours-${task.stationId}-${task.id}"
                                style="width:60px"> / ${task.estHours || 0}h
                        </div>
                        <div class="member-task-progress-bar">
                            <div class="progress-fill" style="width:${Math.min(taskProgress, 100)}%;background:${task.stationColor}"></div>
                        </div>
                        <span class="progress-percent">${taskProgress}%</span>
                    </div>
                    <div class="member-task-status-update">
                        <label>Status:</label>
                        <select id="status-${task.stationId}-${task.id}">
                            <option value="Not Started" ${task.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Complete" ${task.status === 'Complete' ? 'selected' : ''}>Complete</option>
                            <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            <option value="Delayed" ${task.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                        </select>
                        <button class="btn-save-task" onclick="saveMemberTaskUpdate('${task.stationId}', '${task.id}')">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;">
                                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                                <polyline points="17 21 17 13 7 13 7 21"/>
                                <polyline points="7 3 7 8 15 8"/>
                            </svg>
                            Save
                        </button>
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
                    ${isAdmin ? `<div style="display:flex;gap:6px;margin-top:8px;">
                        <button onclick="closeModal('member-tasks-modal'); editTeamMember(${memberIndex});" style="padding:5px 14px;font-size:0.8rem;background:rgba(0,212,170,0.15);color:#00d4aa;border:1px solid rgba(0,212,170,0.3);border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600;">Edit Member</button>
                        <button onclick="closeModal('member-tasks-modal'); deleteTeamMember(${memberIndex});" style="padding:5px 14px;font-size:0.8rem;background:rgba(220,53,69,0.15);color:#dc3545;border:1px solid rgba(220,53,69,0.3);border-radius:6px;cursor:pointer;font-family:inherit;">Remove</button>
                    </div>` : ''}
                    ${(currentMember && currentMember.name === memberName) ? `<div style="margin-top:8px;">
                        <button onclick="closeModal('member-tasks-modal'); editMemberProfile();" style="padding:5px 14px;font-size:0.8rem;background:${member.color}20;color:${member.color};border:1px solid ${member.color}40;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600;">Edit My Profile</button>
                    </div>` : ''}
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

            ${buildTimesheetSection(memberName, member)}
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
    renderDashboard();
    
    // Refresh the modal
    if (currentMemberName) {
        const memberIndex = teamMembers.findIndex(m => m.name === currentMemberName);
        if (memberIndex >= 0) {
            openMemberTasks(currentMemberName, memberIndex);
        }
    }
}

async function saveMemberTaskUpdate(stationId, taskId) {
    console.log('=== SAVE MEMBER TASK UPDATE ===');
    console.log('Station ID:', stationId);
    console.log('Task ID:', taskId);
    
    // Get values from the form
    const statusSelect = document.getElementById(`status-${stationId}-${taskId}`);
    const hoursInput = document.getElementById(`hours-${stationId}-${taskId}`);
    
    if (!statusSelect || !hoursInput) {
        console.error('Could not find form elements');
        showError('Error: Form elements not found');
        return;
    }
    
    const newStatus = statusSelect.value;
    const newHours = parseFloat(hoursInput.value) || 0;
    
    console.log('New Status:', newStatus);
    console.log('New Hours:', newHours);
    console.log('All stations:', stations);
    
    // Find station
    let foundStation = null;
    let foundTask = null;
    
    for (let i = 0; i < stations.length; i++) {
        if (String(stations[i].id) === String(stationId)) {
            foundStation = stations[i];
            console.log('Found station:', foundStation.name);
            
            for (let j = 0; j < foundStation.tasks.length; j++) {
                if (String(foundStation.tasks[j].id) === String(taskId)) {
                    foundTask = foundStation.tasks[j];
                    console.log('Found task:', foundTask.name);
                    break;
                }
            }
            break;
        }
    }
    
    if (!foundStation) {
        console.error('Station not found! ID:', stationId);
        console.log('Available stations:', stations.map(s => ({ id: s.id, type: typeof s.id })));
        showError('Station not found');
        return;
    }
    
    if (!foundTask) {
        console.error('Task not found! ID:', taskId);
        console.log('Available tasks:', foundStation.tasks.map(t => ({ id: t.id, type: typeof t.id })));
        showError('Task not found');
        return;
    }
    
    // Update the task
    foundTask.status = newStatus;
    foundTask.actualHours = newHours;
    
    // Auto-update progress
    if (newStatus === 'Complete') {
        foundTask.progress = 100;
    } else if (newStatus === 'Not Started') {
        foundTask.progress = 0;
    } else if (newStatus === 'In Progress' && foundTask.progress === 0) {
        foundTask.progress = 10; // Start with 10% if moving to in progress
    }
    
    console.log('Updated task:', foundTask);
    
    // Save to localStorage
    try {
        localStorage.setItem('loopStations', JSON.stringify(stations));
        console.log('Saved to localStorage');
    } catch (e) {
        console.error('localStorage save error:', e);
    }
    
    // Save to Firebase (for all users - team members can update their tasks)
    if (firebaseEnabled && db) {
        try {
            await window.firebaseSetDoc(window.firebaseDoc(db, 'projects', 'main-project-stations'), {
                stations: stations,
                lastUpdated: new Date().toISOString()
            });
            console.log('Saved to Firebase successfully');
            showSuccess(`Task "${foundTask.name}" saved!`);
        } catch (error) {
            console.error('Firebase save error:', error);
            showError('Cloud sync failed - saved locally only');
        }
    } else {
        showSuccess(`Task "${foundTask.name}" saved locally!`);
    }
    
    // Refresh all views
    renderDashboard();
    
    // Refresh the modal to show updated data
    if (currentMemberName) {
        const memberIndex = teamMembers.findIndex(m => m.name === currentMemberName);
        if (memberIndex >= 0) {
            setTimeout(() => {
                openMemberTasks(currentMemberName, memberIndex);
            }, 100);
        }
    }
}

window.openMemberTasks = openMemberTasks;
window.updateMemberTaskStatus = updateMemberTaskStatus;
window.updateMemberTaskHours = updateMemberTaskHours;
window.saveMemberTaskUpdate = saveMemberTaskUpdate;

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

function resetTeamFormFieldStates() {
    document.getElementById('member-role').disabled = false;
    document.getElementById('member-target').disabled = false;
    document.getElementById('member-username').disabled = false;
    document.getElementById('member-password').disabled = false;
}

function addNewTeamMember() {
    if (!isAdmin) {
        showError('Admin access required');
        return;
    }
    
    resetTeamFormFieldStates();
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
    
    resetTeamFormFieldStates();
    const member = teamMembers[index];
    
    document.getElementById('team-modal-title').textContent = 'Edit Team Member';
    document.getElementById('member-index').value = index;
    document.getElementById('member-name').value = member.name;
    document.getElementById('member-role').value = member.role;
    document.getElementById('member-target').value = member.targetHours;
    document.getElementById('member-email').value = member.email || '';
    document.getElementById('member-username').value = member.username || '';
    document.getElementById('member-password').value = member.password || '';
    document.getElementById('member-color').value = member.color;
    
    openModal('team-modal');
}

document.getElementById('team-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const memberIndex = document.getElementById('member-index').value;
    const isSelfEdit = currentMember && memberIndex !== '' && teamMembers[memberIndex]?.name === currentMember.name;

    if (!isAdmin && !isSelfEdit) {
        showError('Access denied');
        closeModal('team-modal');
        return;
    }
    
    const oldName = memberIndex !== '' ? teamMembers[memberIndex].name : null;
    
    if (isAdmin) {
        var memberData = {
            name: document.getElementById('member-name').value,
            role: document.getElementById('member-role').value,
            targetHours: parseInt(document.getElementById('member-target').value) || 40,
            email: document.getElementById('member-email').value,
            username: document.getElementById('member-username').value,
            password: document.getElementById('member-password').value,
            color: document.getElementById('member-color').value
        };
    } else {
        var memberData = {
            ...teamMembers[memberIndex],
            name: document.getElementById('member-name').value,
            email: document.getElementById('member-email').value,
            color: document.getElementById('member-color').value
        };
    }
    
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
    
    if (isSelfEdit && currentMember) {
        currentMember = memberData;
    }

    await saveTeamMembers(teamMembers);
    closeModal('team-modal');

    if (memberIndex === '' && memberData.email) {
        const sent = await sendInvitationEmail(memberData.email, memberData.name, memberData.role, memberData.username, memberData.password);
        showSuccess(sent ? `Team member added — invitation sent to ${memberData.email}` : 'Team member added (email not sent — check email settings)');
    } else {
        showSuccess(memberIndex === '' ? 'Team member added' : 'Team member updated');
    }
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

async function resendInvite(index) {
    if (!isAdmin) return;
    const member = teamMembers[index];
    if (!member || !member.email) {
        showError('This member has no email address. Edit the member to add one.');
        return;
    }
    const sent = await sendInvitationEmail(member.email, member.name, member.role, member.username, member.password);
    if (sent) {
        showSuccess(`Invitation sent to ${member.email}`);
    } else {
        showError('Failed to send invitation. Configure email settings in Team Members page.');
    }
}

function openEmailSettings() {
    if (!isAdmin) return;
    document.getElementById('emailjs-public-key').value = localStorage.getItem('loopEmailPublicKey') || '';
    document.getElementById('emailjs-service-id').value = localStorage.getItem('loopEmailServiceId') || '';
    document.getElementById('emailjs-template-id').value = localStorage.getItem('loopEmailTemplateId') || '';
    const statusEl = document.getElementById('email-settings-status');
    if (statusEl) statusEl.textContent = '';
    openModal('email-settings-modal');
}

function saveEmailSettings() {
    const publicKey = document.getElementById('emailjs-public-key').value.trim();
    const serviceId = document.getElementById('emailjs-service-id').value.trim();
    const templateId = document.getElementById('emailjs-template-id').value.trim();

    const store = (key, val) => val ? localStorage.setItem(key, val) : localStorage.removeItem(key);
    store('loopEmailPublicKey', publicKey);
    store('loopEmailServiceId', serviceId);
    store('loopEmailTemplateId', templateId);

    closeModal('email-settings-modal');
    showSuccess('Email settings saved');
}

async function testEmailSettings() {
    const publicKey = document.getElementById('emailjs-public-key').value.trim();
    const serviceId = document.getElementById('emailjs-service-id').value.trim();
    const templateId = document.getElementById('emailjs-template-id').value.trim();
    const statusEl = document.getElementById('email-settings-status');

    if (!publicKey || !serviceId || !templateId) {
        if (statusEl) statusEl.innerHTML = '<span style="color:#dc3545">Fill in all three fields first</span>';
        return;
    }
    if (typeof emailjs === 'undefined') {
        if (statusEl) statusEl.innerHTML = '<span style="color:#dc3545">EmailJS SDK not loaded — check internet connection</span>';
        return;
    }

    if (statusEl) statusEl.innerHTML = '<span style="color:#ffc107">Sending test email...</span>';

    const adminMember = teamMembers.find(m => m.email && (m.role === 'PM' || m.role === 'Lead'));
    const testTo = adminMember ? adminMember.email : prompt('Enter an email address to send the test to:');
    if (!testTo) {
        if (statusEl) statusEl.innerHTML = '<span style="color:#dc3545">No email address provided</span>';
        return;
    }

    try {
        const testBody = buildPlainEmail('Test Email', [
            'If you received this, your email settings are configured correctly.',
            '',
            'Email service is working!'
        ]);
        const escaped = testBody.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
        await emailjs.send(serviceId, templateId, {
            to_email: testTo,
            subject: 'Loop Automation - Test Email',
            message_html: `<div style="font-family:Consolas,monospace;font-size:14px;line-height:1.5;white-space:pre-wrap;color:#222;">${escaped}</div>`
        }, publicKey);
        if (statusEl) statusEl.innerHTML = `<span style="color:#28a745">Test email sent to ${testTo}</span>`;
    } catch (e) {
        const msg = e.text || e.message || 'Unknown error';
        if (statusEl) statusEl.innerHTML = `<span style="color:#dc3545">Failed: ${msg}</span>`;
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
// LEGACY EXPORT FUNCTIONS (kept for data utility)
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
// AI ASSISTANT
// ============================================

let aiChatHistory = [];
let aiIsProcessing = false;

function toggleAIPanel() {
    const panel = document.getElementById('ai-panel');
    const btn = document.getElementById('ai-toggle-btn');
    if (!panel) return;
    
    panel.classList.toggle('open');
    if (btn) btn.classList.toggle('active');
    
    // Load saved settings
    if (panel.classList.contains('open')) {
        loadAISettings();
    }
}

function toggleAISettings() {
    const settings = document.getElementById('ai-settings');
    if (!settings) return;
    settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
}

function loadAISettings() {
    const savedProvider = localStorage.getItem('loopAI_provider') || 'groq';
    const savedKey = localStorage.getItem('loopAI_apiKey') || '';
    const savedModel = localStorage.getItem('loopAI_model') || 'llama-3.3-70b-versatile';
    
    const providerSelect = document.getElementById('ai-provider');
    const keyInput = document.getElementById('ai-api-key');
    const modelSelect = document.getElementById('ai-model');
    
    if (providerSelect) providerSelect.value = savedProvider;
    if (keyInput && savedKey) keyInput.value = savedKey;
    
    // Update UI for the selected provider
    updateProviderUI(savedProvider);
    
    if (modelSelect) modelSelect.value = savedModel;
}

function switchAIProvider() {
    const providerSelect = document.getElementById('ai-provider');
    if (!providerSelect) return;
    
    const provider = providerSelect.value;
    localStorage.setItem('loopAI_provider', provider);
    
    // Clear old API key when switching providers
    localStorage.removeItem('loopAI_apiKey');
    const keyInput = document.getElementById('ai-api-key');
    if (keyInput) keyInput.value = '';
    
    // Reset chat history since provider changed
    aiChatHistory = [];
    
    updateProviderUI(provider);
}

function updateProviderUI(provider) {
    const keyLabel = document.getElementById('ai-key-label');
    const keyInput = document.getElementById('ai-api-key');
    const keyHelp = document.getElementById('ai-key-help');
    const modelSelect = document.getElementById('ai-model');
    
    if (provider === 'groq') {
        if (keyLabel) keyLabel.textContent = 'Groq API Key';
        if (keyInput) keyInput.placeholder = 'gsk_...';
        if (keyHelp) keyHelp.innerHTML = 'Free & fast! Get your key at <a href="https://console.groq.com/keys" target="_blank">console.groq.com/keys</a> — 30 requests/min, no credit card needed.';
        if (modelSelect) {
            modelSelect.innerHTML = `
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Best Quality)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Fastest)</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B (Balanced)</option>
            `;
        }
        localStorage.setItem('loopAI_model', 'llama-3.3-70b-versatile');
    } else if (provider === 'gemini') {
        if (keyLabel) keyLabel.textContent = 'Google Gemini API Key';
        if (keyInput) keyInput.placeholder = 'AIza...';
        if (keyHelp) keyHelp.innerHTML = 'Free! Get your key at <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a> — 15 requests/min, no credit card needed.';
        if (modelSelect) {
            modelSelect.innerHTML = `
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash-Lite (Fastest)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Stable)</option>
            `;
        }
        localStorage.setItem('loopAI_model', 'gemini-2.0-flash');
    } else {
        if (keyLabel) keyLabel.textContent = 'OpenAI API Key';
        if (keyInput) keyInput.placeholder = 'sk-...';
        if (keyHelp) keyHelp.innerHTML = 'Requires paid credits. <a href="https://platform.openai.com/api-keys" target="_blank">Get a key</a>';
        if (modelSelect) {
            modelSelect.innerHTML = `
                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
                <option value="gpt-4o">GPT-4o (Best Quality)</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
            `;
        }
        localStorage.setItem('loopAI_model', 'gpt-4o-mini');
    }
}

function saveAIApiKey() {
    const keyInput = document.getElementById('ai-api-key');
    if (!keyInput) return;
    
    const key = keyInput.value.trim();
    if (key) {
        localStorage.setItem('loopAI_apiKey', key);
        const provider = localStorage.getItem('loopAI_provider') || 'groq';
        const providerNames = { groq: 'Groq', gemini: 'Gemini', openai: 'OpenAI' };
        showSuccess(`${providerNames[provider] || provider} API key saved securely to your browser.`);
        document.getElementById('ai-settings').style.display = 'none';
    } else {
        showError('Please enter a valid API key.');
    }
}

function saveAIModel() {
    const modelSelect = document.getElementById('ai-model');
    if (!modelSelect) return;
    localStorage.setItem('loopAI_model', modelSelect.value);
}

function getProjectContext() {
    const allTasks = getAllTasks();
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Complete').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;
    const notStartedTasks = allTasks.filter(t => t.status === 'Not Started').length;
    const delayedTasks = allTasks.filter(t => t.status === 'Delayed').length;
    const onHoldTasks = allTasks.filter(t => t.status === 'On Hold').length;
    
    const totalEstHours = allTasks.reduce((sum, t) => sum + (parseFloat(t.estHours) || 0), 0);
    const totalActualHours = allTasks.reduce((sum, t) => sum + (parseFloat(t.actualHours) || 0), 0);
    const overallProgress = totalEstHours > 0 ? Math.round((totalActualHours / totalEstHours) * 100) : 0;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Build compact station summaries (one line per task to save tokens)
    const stationLines = stations.map(s => {
        const tasks = s.tasks || [];
        const done = tasks.filter(t => t.status === 'Complete').length;
        const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
        
        let lines = `\n## ${s.name} [${s.startDate} to ${s.endDate}] Priority:${s.priority} Progress:${pct}% (${done}/${tasks.length})`;
        tasks.forEach(t => {
            lines += `\n  - ${t.name} | ${t.assignedTo || 'Unassigned'} | ${t.status} | ${t.startDate}-${t.endDate} | Est:${t.estHours}h Act:${t.actualHours}h | P:${t.priority}${t.notes ? ' | '+t.notes : ''}`;
        });
        return lines;
    }).join('');
    
    // Build compact team summaries
    const teamLines = teamMembers.map(m => {
        const assignedHrs = getAssignedHours(m.name);
        const memberTasks = allTasks.filter(t => t.assignedTo === m.name);
        const completedCount = memberTasks.filter(t => t.status === 'Complete').length;
        const load = Math.round((assignedHrs / m.targetHours) * 100);
        return `  - ${m.name} (${m.role}) | Target:${m.targetHours}h Assigned:${assignedHrs}h Avail:${m.targetHours - assignedHrs}h Load:${load}% | Tasks:${memberTasks.length} Done:${completedCount}`;
    }).join('\n');
    
    // Identify overdue tasks (compact)
    const overdueTasks = allTasks.filter(t => {
        if (t.status === 'Complete') return false;
        return t.endDate && t.endDate < today;
    });
    const overdueLines = overdueTasks.length > 0 
        ? overdueTasks.map(t => `  - ${t.name} (${t.assignedTo || 'Unassigned'}) due:${t.endDate} status:${t.status}`).join('\n')
        : 'None';
    
    return `PROJECT: Loop Automation | Date: ${today}
OVERVIEW: ${stations.length} stations, ${totalTasks} tasks | Done:${completedTasks} InProg:${inProgressTasks} NotStarted:${notStartedTasks} Delayed:${delayedTasks} OnHold:${onHoldTasks} | EstHrs:${totalEstHours} ActHrs:${totalActualHours} Progress:${overallProgress}%

STATIONS:${stationLines}

TEAM:
${teamLines}

OVERDUE:
${overdueLines}`;
}

async function sendAIMessage(userMessage) {
    if (aiIsProcessing) return;
    
    const inputEl = document.getElementById('ai-input');
    const messagesEl = document.getElementById('ai-messages');
    
    // Get message from input or parameter
    const message = userMessage || (inputEl ? inputEl.value.trim() : '');
    if (!message) return;
    
    // Check API key
    const apiKey = localStorage.getItem('loopAI_apiKey');
    const provider = localStorage.getItem('loopAI_provider') || 'groq';
    if (!apiKey) {
        const providerNames = { groq: 'Groq', gemini: 'Google Gemini', openai: 'OpenAI' };
        appendAIMessage('error', `Please configure your ${providerNames[provider] || provider} API key first. Click the ⚙️ button above to add it.`);
        return;
    }
    
    // Clear input
    if (inputEl && !userMessage) {
        inputEl.value = '';
        inputEl.style.height = 'auto';
    }
    
    // Add user message to UI
    appendAIMessage('user', message);
    
    // Add typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-message assistant';
    typingEl.id = 'ai-typing-indicator';
    typingEl.innerHTML = `
        <div class="ai-message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7 7 0 0113 22h-2a7 7 0 01-6.93-6H3a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                <circle cx="9" cy="14" r="1" fill="currentColor"/>
                <circle cx="15" cy="14" r="1" fill="currentColor"/>
            </svg>
        </div>
        <div class="ai-message-content">
            <div class="ai-typing">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
            </div>
        </div>
    `;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    aiIsProcessing = true;
    document.getElementById('ai-send-btn').disabled = true;
    
    try {
        const defaultModels = { groq: 'llama-3.3-70b-versatile', gemini: 'gemini-2.0-flash', openai: 'gpt-4o-mini' };
        const model = localStorage.getItem('loopAI_model') || defaultModels[provider] || 'llama-3.3-70b-versatile';
        const projectContext = getProjectContext();
        
        const systemPrompt = `You are a project management AI for "Loop Automation" (industrial automation). You have the project data below. Be concise and specific. Use markdown, bullet points, bold key info. Answer about status, workload, risks, assignments, reports, and planning.

${projectContext}`;

        // Keep last 20 messages for context
        aiChatHistory.push({ role: 'user', content: message });
        if (aiChatHistory.length > 20) {
            aiChatHistory = aiChatHistory.slice(-20);
        }
        
        let assistantMessage;
        
        if (provider === 'groq') {
            assistantMessage = await callGroqAPI(apiKey, model, systemPrompt, aiChatHistory);
        } else if (provider === 'gemini') {
            assistantMessage = await callGeminiAPI(apiKey, model, systemPrompt, aiChatHistory);
        } else {
            assistantMessage = await callOpenAIAPI(apiKey, model, systemPrompt, aiChatHistory);
        }
        
        // Remove typing indicator
        const typing = document.getElementById('ai-typing-indicator');
        if (typing) typing.remove();
        
        // Store in chat history
        aiChatHistory.push({ role: 'assistant', content: assistantMessage });
        
        // Render assistant message
        appendAIMessage('assistant', assistantMessage);
        
    } catch (error) {
        // Remove typing indicator
        const typing = document.getElementById('ai-typing-indicator');
        if (typing) typing.remove();
        
        console.error('AI Error:', error);
        appendAIMessage('error', error.message || 'Connection error. Please check your internet connection.');
    } finally {
        aiIsProcessing = false;
        document.getElementById('ai-send-btn').disabled = false;
    }
}

// ---- Groq API (OpenAI-compatible, free) ----
async function callGroqAPI(apiKey, model, systemPrompt, chatHistory) {
    const systemMessage = { role: 'system', content: systemPrompt };
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [systemMessage, ...chatHistory],
            max_tokens: 2048,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `API Error: ${response.status}`;
        
        console.error('Groq API error:', response.status, errorMsg);
        
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your Groq key in settings (⚙️). Get a free key at console.groq.com/keys');
        } else if (response.status === 429) {
            throw new Error('Rate limit reached. Please wait a moment and try again (free tier: 30 req/min).');
        } else if (response.status === 413) {
            throw new Error('Message too long. Try asking a shorter question or switch to a model with a larger context window.');
        } else {
            throw new Error(errorMsg);
        }
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received.';
}

// ---- Google Gemini API ----
async function callGeminiAPI(apiKey, model, systemPrompt, chatHistory) {
    // Build Gemini conversation format
    const contents = chatHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: contents,
            generationConfig: {
                maxOutputTokens: 2048,
                temperature: 0.7
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `API Error: ${response.status}`;
        const errorStatus = errorData.error?.status || '';
        
        console.error('Gemini API error:', response.status, errorMsg, errorStatus);
        
        if (response.status === 400) {
            if (errorMsg.includes('API key')) {
                throw new Error('Invalid API key. Please check your Gemini API key in settings (⚙️). Get a free key at aistudio.google.com/apikey');
            }
            throw new Error('Bad request: ' + errorMsg);
        } else if (response.status === 403) {
            throw new Error('API key not authorized. Make sure the Generative Language API is enabled in your Google Cloud project. Get a new free key at aistudio.google.com/apikey');
        } else if (response.status === 429) {
            if (errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('resource') || errorMsg.toLowerCase().includes('exceeded')) {
                throw new Error('Free quota exceeded for today. The Gemini free tier resets daily. You can try again tomorrow, or try switching to a different model (e.g. Gemini 1.5 Flash) in settings (⚙️). Details: ' + errorMsg);
            }
            throw new Error('Rate limit reached. Please wait a minute and try again. If this persists, try Gemini 1.5 Flash model. Details: ' + errorMsg);
        } else {
            throw new Error(errorMsg);
        }
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        const blockReason = data.candidates?.[0]?.finishReason;
        if (blockReason === 'SAFETY') {
            throw new Error('Response was blocked by safety filters. Please try rephrasing your question.');
        }
        throw new Error('No response received from Gemini.');
    }
    
    return text;
}

// ---- OpenAI API ----
async function callOpenAIAPI(apiKey, model, systemPrompt, chatHistory) {
    const systemMessage = { role: 'system', content: systemPrompt };
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: [systemMessage, ...chatHistory],
            max_tokens: 1500,
            temperature: 0.7
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `API Error: ${response.status}`;
        
        if (response.status === 401) {
            throw new Error('Invalid API key. Please check your OpenAI key in settings (⚙️).');
        } else if (response.status === 429) {
            const isQuota = errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('billing') || errorMsg.toLowerCase().includes('exceeded');
            if (isQuota) {
                throw new Error('Your OpenAI account has no credits. Add credits at platform.openai.com/settings/organization/billing ($5 minimum).');
            } else {
                throw new Error('Rate limit exceeded. Please wait and try again.');
            }
        } else if (response.status === 402) {
            throw new Error('Your OpenAI account requires payment. Add credits at platform.openai.com/settings/organization/billing');
        } else {
            throw new Error(errorMsg);
        }
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received.';
}

function appendAIMessage(type, content) {
    const messagesEl = document.getElementById('ai-messages');
    if (!messagesEl) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = `ai-message ${type}`;
    
    if (type === 'user') {
        messageEl.innerHTML = `
            <div class="ai-message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                    <circle cx="12" cy="7" r="4"/>
                    <path d="M5 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/>
                </svg>
            </div>
            <div class="ai-message-content"><p>${escapeHtml(content)}</p></div>
        `;
    } else {
        const formattedContent = formatAIResponse(content);
        messageEl.innerHTML = `
            <div class="ai-message-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7 7 0 0113 22h-2a7 7 0 01-6.93-6H3a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                    <circle cx="9" cy="14" r="1" fill="currentColor"/>
                    <circle cx="15" cy="14" r="1" fill="currentColor"/>
                </svg>
            </div>
            <div class="ai-message-content">${formattedContent}</div>
        `;
    }
    
    messagesEl.appendChild(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function formatAIResponse(text) {
    // Convert markdown to HTML (basic formatting)
    let html = escapeHtml(text);
    
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text*
    html = html.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
    
    // Code blocks: ```code```
    html = html.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');
    
    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Headers: ### Header
    html = html.replace(/^### (.*$)/gm, '<strong style="font-size: 1rem; display: block; margin-top: 12px;">$1</strong>');
    html = html.replace(/^## (.*$)/gm, '<strong style="font-size: 1.05rem; display: block; margin-top: 12px;">$1</strong>');
    
    // Bullet points: - item or * item
    html = html.replace(/^[\-\*] (.+)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>');
    
    // Numbered lists: 1. item
    html = html.replace(/^\d+\. (.+)/gm, '<li>$1</li>');
    
    // Line breaks: convert double newlines to paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*<br>\s*<\/p>/g, '');
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleAIInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAIMessage();
    }
    
    // Auto-resize textarea
    const textarea = event.target;
    setTimeout(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }, 0);
}

function sendAIQuickAction(message) {
    const inputEl = document.getElementById('ai-input');
    if (inputEl) inputEl.value = message;
    sendAIMessage(message);
}

// ============================================
// TIMESHEET IMPORT & ANALYSIS
// ============================================

let uploadedTimesheets = []; // { fileName, personName, rows: [{date, hours, description}] }

function toggleTimesheetUpload() {
    const upload = document.getElementById('ai-timesheet-upload');
    const body = document.getElementById('ai-timesheet-body');
    if (!body) return;
    
    const isExpanded = body.style.display !== 'none';
    body.style.display = isExpanded ? 'none' : 'block';
    if (upload) upload.classList.toggle('expanded', !isExpanded);
}

function handleTimesheetFiles(files) {
    if (!files || files.length === 0) return;
    
    for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext)) {
            showError(`"${file.name}" is not a supported format. Use .xlsx, .xls, or .csv`);
            continue;
        }
        parseTimesheetFile(file);
    }
    
    // Reset file input so same file can be re-uploaded
    document.getElementById('timesheet-file-input').value = '';
}

function parseTimesheetFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array', cellDates: true });
            
            // Process each sheet
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                
                // Read ALL rows as raw arrays (no header assumption)
                const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
                
                if (allRows.length === 0) return;
                
                // 1) Extract person name from header area (look for "Name" label)
                let personName = extractPersonFromHeader(allRows, file.name, sheetName);
                
                // 2) Find the data table header row (look for row containing "Phase", "Date", "Hours")
                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(allRows.length, 30); i++) {
                    const rowStr = allRows[i].map(c => String(c).toLowerCase().trim());
                    // Look for a row that has at least "date" and "hours" as column headers
                    const hasDate = rowStr.some(c => c === 'date');
                    const hasHours = rowStr.some(c => c === 'hours');
                    if (hasDate && hasHours) {
                        headerRowIdx = i;
                        break;
                    }
                }
                
                if (headerRowIdx === -1) {
                    // Fallback: try standard sheet_to_json parsing
                    const jsonRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                    if (jsonRows.length > 0) {
                        const normalizedRows = normalizeTimesheetRows(jsonRows);
                        if (normalizedRows.length > 0) {
                            uploadedTimesheets.push({
                                fileName: file.name,
                                sheetName: sheetName,
                                personName: personName,
                                rows: normalizedRows,
                                rawHeaders: Object.keys(jsonRows[0])
                            });
                            renderUploadedTimesheets();
                            return;
                        }
                    }
                    showError(`Could not find data table in "${file.name}" (sheet: ${sheetName}). Expected columns: Phase, Date, Hours, Description.`);
                    return;
                }
                
                // 3) Build column map from the header row
                const headerCells = allRows[headerRowIdx].map(c => String(c).trim());
                const colMap = {};
                headerCells.forEach((h, idx) => {
                    const hl = h.toLowerCase();
                    if (hl === 'phase') colMap.phase = idx;
                    else if (hl === 'date') colMap.date = idx;
                    else if (hl === 'start time') colMap.startTime = idx;
                    else if (hl === 'end time') colMap.endTime = idx;
                    else if (hl === 'hours') colMap.hours = idx;
                    else if (hl === 'station') colMap.station = idx;
                    else if (hl === 'workset') colMap.workset = idx;
                    else if (hl === 'category') colMap.category = idx;
                    else if (hl === 'description') colMap.description = idx;
                    // Also handle alternative names
                    else if (/hour|hrs|duration/i.test(hl) && colMap.hours === undefined) colMap.hours = idx;
                    else if (/desc|task|activity|detail|note|summary/i.test(hl) && colMap.description === undefined) colMap.description = idx;
                    else if (/categor|type/i.test(hl) && colMap.category === undefined) colMap.category = idx;
                });
                
                // 4) Parse data rows (everything after header row)
                const normalizedRows = [];
                for (let i = headerRowIdx + 1; i < allRows.length; i++) {
                    const row = allRows[i];
                    if (!row || row.length === 0) continue;
                    
                    // Get hours
                    let hours = 0;
                    if (colMap.hours !== undefined) {
                        hours = parseFloat(row[colMap.hours]) || 0;
                    }
                    
                    // Get description
                    let description = '';
                    if (colMap.description !== undefined) {
                        description = String(row[colMap.description] || '').trim();
                    }
                    
                    // Skip empty/summary rows
                    if (hours === 0 && !description) continue;
                    // Skip "Total Hours" rows
                    const firstCell = String(row[0] || '').toLowerCase().trim();
                    if (firstCell.includes('total')) continue;
                    
                    // Get date
                    let date = '';
                    if (colMap.date !== undefined) {
                        date = parseTimesheetDate(row[colMap.date]);
                    }
                    
                    // Get other fields
                    let phase = colMap.phase !== undefined ? String(row[colMap.phase] || '').trim() : '';
                    let station = colMap.station !== undefined ? String(row[colMap.station] || '').trim() : '';
                    let workset = colMap.workset !== undefined ? String(row[colMap.workset] || '').trim() : '';
                    let category = colMap.category !== undefined ? String(row[colMap.category] || '').trim() : '';
                    let startTime = colMap.startTime !== undefined ? String(row[colMap.startTime] || '').trim() : '';
                    let endTime = colMap.endTime !== undefined ? String(row[colMap.endTime] || '').trim() : '';
                    
                    normalizedRows.push({
                        date, hours, description, phase, station, workset, category, startTime, endTime
                    });
                }
                
                if (normalizedRows.length === 0) {
                    showError(`No data rows found in "${file.name}" (sheet: ${sheetName}).`);
                    return;
                }
                
                // Add to uploaded timesheets
                uploadedTimesheets.push({
                    fileName: file.name,
                    sheetName: sheetName,
                    personName: personName,
                    rows: normalizedRows,
                    rawHeaders: headerCells.filter(h => h)
                });
                
                renderUploadedTimesheets();
                showSuccess(`Loaded ${normalizedRows.length} entries for ${personName} from "${file.name}"`);
            });
            
        } catch (err) {
            console.error('Error parsing timesheet:', err);
            showError(`Error reading "${file.name}": ${err.message}`);
        }
    };
    reader.readAsArrayBuffer(file);
}

function extractPersonFromHeader(allRows, fileName, sheetName) {
    // Look for "Name" label in the first ~15 rows of the sheet
    for (let i = 0; i < Math.min(allRows.length, 15); i++) {
        const row = allRows[i];
        for (let j = 0; j < row.length - 1; j++) {
            const cell = String(row[j] || '').trim().toLowerCase();
            if (cell === 'name' || cell === 'student name' || cell === 'employee name') {
                const nameVal = String(row[j + 1] || '').trim();
                if (nameVal) {
                    // Try to match against team members
                    for (const member of teamMembers) {
                        const memberLower = member.name.toLowerCase();
                        const valLower = nameVal.toLowerCase();
                        if (memberLower === valLower || memberLower.includes(valLower) || valLower.includes(memberLower)) {
                            return member.name;
                        }
                        // Try last name / first name match
                        const memberParts = member.name.toLowerCase().split(' ');
                        const valParts = valLower.split(' ');
                        if (memberParts.some(p => valParts.includes(p) && p.length > 2)) {
                            return member.name;
                        }
                    }
                    return nameVal; // Return raw name if no team member match
                }
            }
        }
    }
    
    // Fallback: try file name or sheet name against team members
    const cleanFile = fileName.replace(/\.(xlsx|xls|csv)$/i, '').replace(/[_\-]/g, ' ').trim();
    for (const member of teamMembers) {
        const nameLower = member.name.toLowerCase();
        const fileLower = cleanFile.toLowerCase();
        const sheetLower = sheetName.toLowerCase();
        
        if (fileLower.includes(nameLower) || sheetLower.includes(nameLower)) return member.name;
        
        const parts = member.name.split(' ');
        const lastName = parts[parts.length - 1].toLowerCase();
        const firstName = parts[0].toLowerCase();
        
        if (fileLower.includes(lastName) || fileLower.includes(firstName)) return member.name;
        if (sheetLower.includes(lastName) || sheetLower.includes(firstName)) return member.name;
    }
    
    return cleanFile; // Fall back to file name
}

function parseTimesheetDate(raw) {
    if (!raw) return '';
    
    if (raw instanceof Date) {
        return raw.toISOString().split('T')[0];
    }
    
    if (typeof raw === 'number') {
        // Excel serial date
        const d = XLSX.SSF.parse_date_code(raw);
        if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
        return '';
    }
    
    const str = String(raw).trim();
    
    // Handle "FRIDAY, January 30, 2026" or "SUNDAY, February 1, 2026" format
    const longMatch = str.match(/(?:\w+,\s*)?(\w+)\s+(\d{1,2})\s*,?\s*(\d{4})/i);
    if (longMatch) {
        const months = { january:1, february:2, march:3, april:4, may:5, june:6, july:7, august:8, september:9, october:10, november:11, december:12 };
        const month = months[longMatch[1].toLowerCase()];
        if (month) {
            return `${longMatch[3]}-${String(month).padStart(2,'0')}-${String(longMatch[2]).padStart(2,'0')}`;
        }
    }
    
    // Handle "MM/DD/YYYY" or "DD/MM/YYYY" or "YYYY-MM-DD"
    const slashMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
        // Assume MM/DD/YYYY
        return `${slashMatch[3]}-${String(slashMatch[1]).padStart(2,'0')}-${String(slashMatch[2]).padStart(2,'0')}`;
    }
    
    const isoMatch = str.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${String(isoMatch[2]).padStart(2,'0')}-${String(isoMatch[3]).padStart(2,'0')}`;
    }
    
    return str;
}

function normalizeTimesheetRows(jsonRows) {
    // Fallback parser for simpler formats
    if (jsonRows.length === 0) return [];
    
    const headers = Object.keys(jsonRows[0]);
    
    const dateCol = headers.find(h => /^date$/i.test(h)) || headers.find(h => /date|day|when/i.test(h));
    const hoursCol = headers.find(h => /^hours$/i.test(h)) || headers.find(h => /hour|hrs|duration/i.test(h));
    const descCol = headers.find(h => /^description$/i.test(h)) || headers.find(h => /desc|task|activity|detail|note/i.test(h));
    const categoryCol = headers.find(h => /^category$/i.test(h)) || headers.find(h => /categor|type/i.test(h));
    const stationCol = headers.find(h => /^station$/i.test(h));
    const worksetCol = headers.find(h => /^workset$/i.test(h));
    const phaseCol = headers.find(h => /^phase$/i.test(h));
    
    return jsonRows.map(row => {
        let date = dateCol ? parseTimesheetDate(row[dateCol]) : '';
        let hours = hoursCol ? (parseFloat(row[hoursCol]) || 0) : 0;
        let description = descCol ? String(row[descCol] || '').trim() : '';
        let category = categoryCol ? String(row[categoryCol] || '').trim() : '';
        let station = stationCol ? String(row[stationCol] || '').trim() : '';
        let workset = worksetCol ? String(row[worksetCol] || '').trim() : '';
        let phase = phaseCol ? String(row[phaseCol] || '').trim() : '';
        
        return { date, hours, description, phase, station, workset, category, startTime: '', endTime: '' };
    }).filter(r => r.hours > 0 || r.description);
}

function renderUploadedTimesheets() {
    const container = document.getElementById('ai-timesheet-files');
    const analyzeBtn = document.getElementById('ai-timesheet-analyze-btn');
    if (!container) return;
    
    if (uploadedTimesheets.length === 0) {
        container.innerHTML = '';
        if (analyzeBtn) analyzeBtn.style.display = 'none';
        return;
    }
    
    container.innerHTML = uploadedTimesheets.map((ts, i) => `
        <div class="ai-timesheet-file">
            <span class="ai-timesheet-file-icon">📄</span>
            <span class="ai-timesheet-file-name" title="${ts.fileName} - ${ts.personName}">${ts.personName}</span>
            <span class="ai-timesheet-file-rows">${ts.rows.length} rows</span>
            <button class="ai-timesheet-file-remove" onclick="removeTimesheet(${i})" title="Remove">×</button>
        </div>
    `).join('');
    
    if (analyzeBtn) analyzeBtn.style.display = 'block';
}

function removeTimesheet(index) {
    uploadedTimesheets.splice(index, 1);
    renderUploadedTimesheets();
}

// Setup drag-and-drop on timesheet drop zone
function setupTimesheetDragDrop() {
    const dropZone = document.getElementById('ai-timesheet-drop');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleTimesheetFiles(e.dataTransfer.files);
    });
}

// ============================================
// TIMESHEET ANALYSIS & REPORT GENERATION
// ============================================

async function analyzeTimesheets() {
    if (uploadedTimesheets.length === 0) {
        showError('Please upload at least one timesheet first.');
        return;
    }
    
    const apiKey = localStorage.getItem('loopAI_apiKey');
    const provider = localStorage.getItem('loopAI_provider') || 'groq';
    if (!apiKey) {
        const providerNames = { groq: 'Groq', gemini: 'Google Gemini', openai: 'OpenAI' };
        showError(`Please configure your ${providerNames[provider] || provider} API key first.`);
        return;
    }
    
    const analyzeBtn = document.getElementById('ai-timesheet-analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = '⏳ Analyzing timesheets...';
    }
    
    appendAIMessage('user', `Analyze ${uploadedTimesheets.length} timesheet(s) against Gantt chart tasks and generate a comparison report.`);
    
    // Add typing indicator
    const messagesEl = document.getElementById('ai-messages');
    const typingEl = document.createElement('div');
    typingEl.className = 'ai-message assistant';
    typingEl.id = 'ai-typing-indicator';
    typingEl.innerHTML = `
        <div class="ai-message-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 110 2h-1.07A7 7 0 0113 22h-2a7 7 0 01-6.93-6H3a1 1 0 110-2h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                <circle cx="9" cy="14" r="1" fill="currentColor"/>
                <circle cx="15" cy="14" r="1" fill="currentColor"/>
            </svg>
        </div>
        <div class="ai-message-content">
            <div class="ai-typing"><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div><div class="ai-typing-dot"></div></div>
        </div>
    `;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    
    try {
        // Build comparison data
        const comparisonData = buildTimesheetComparison();
        
        const model = localStorage.getItem('loopAI_model') || 'llama-3.3-70b-versatile';
        
        const analysisPrompt = `You are analyzing timesheet data vs Gantt chart planned tasks for a project management tool.

GANTT CHART TASKS (what was planned):
${comparisonData.ganttSummary}

TIMESHEET DATA (what was actually reported):
${comparisonData.timesheetSummary}

Analyze the data and provide a structured response in EXACTLY this JSON format (no other text, just valid JSON):
{
  "summary": "Brief overall assessment (2-3 sentences)",
  "personAnalysis": [
    {
      "name": "Person Name",
      "ganttHours": 0,
      "timesheetHours": 0,
      "hoursDiff": 0,
      "matchedTasks": ["task names that match between gantt and timesheet"],
      "unmatchedGantt": ["gantt tasks with no timesheet entry"],
      "unmatchedTimesheet": ["timesheet entries with no gantt task"],
      "assessment": "Brief assessment for this person",
      "flag": "green|yellow|red"
    }
  ],
  "risks": ["list of concerns or risks identified"],
  "recommendations": ["list of actionable recommendations"]
}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation before or after.`;

        let aiResponse;
        if (provider === 'groq') {
            aiResponse = await callGroqAPI(apiKey, model, analysisPrompt, [{ role: 'user', content: 'Analyze the timesheets now.' }]);
        } else if (provider === 'gemini') {
            aiResponse = await callGeminiAPI(apiKey, model, analysisPrompt, [{ role: 'user', content: 'Analyze the timesheets now.' }]);
        } else {
            aiResponse = await callOpenAIAPI(apiKey, model, analysisPrompt, [{ role: 'user', content: 'Analyze the timesheets now.' }]);
        }
        
        // Remove typing indicator
        const typing = document.getElementById('ai-typing-indicator');
        if (typing) typing.remove();
        
        // Parse AI response
        let analysis;
        try {
            // Extract JSON from response (handle markdown code blocks)
            let jsonStr = aiResponse.trim();
            const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) jsonStr = jsonMatch[1].trim();
            // Also try to extract from plain response
            const braceStart = jsonStr.indexOf('{');
            const braceEnd = jsonStr.lastIndexOf('}');
            if (braceStart !== -1 && braceEnd !== -1) {
                jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
            }
            analysis = JSON.parse(jsonStr);
        } catch (parseErr) {
            console.error('Failed to parse AI response as JSON:', aiResponse);
            // If JSON parsing fails, show the raw response and still generate a basic report
            appendAIMessage('assistant', aiResponse);
            generateBasicExcelReport(comparisonData);
            return;
        }
        
        // Show summary in chat
        let chatSummary = `**📊 Timesheet Analysis Complete**\n\n${analysis.summary}\n\n`;
        
        if (analysis.personAnalysis) {
            chatSummary += '**Per-Person Summary:**\n';
            for (const person of analysis.personAnalysis) {
                const flag = person.flag === 'red' ? '🔴' : person.flag === 'yellow' ? '🟡' : '🟢';
                chatSummary += `- ${flag} **${person.name}**: Gantt ${person.ganttHours}h vs Timesheet ${person.timesheetHours}h (${person.hoursDiff >= 0 ? '+' : ''}${person.hoursDiff}h) — ${person.assessment}\n`;
            }
        }
        
        if (analysis.risks && analysis.risks.length > 0) {
            chatSummary += '\n**⚠️ Risks:**\n';
            analysis.risks.forEach(r => chatSummary += `- ${r}\n`);
        }
        
        if (analysis.recommendations && analysis.recommendations.length > 0) {
            chatSummary += '\n**💡 Recommendations:**\n';
            analysis.recommendations.forEach(r => chatSummary += `- ${r}\n`);
        }
        
        chatSummary += '\n📥 **Excel report is downloading now...**';
        
        appendAIMessage('assistant', chatSummary);
        
        // Generate and download Excel report
        generateExcelReport(analysis, comparisonData);
        
    } catch (error) {
        const typing = document.getElementById('ai-typing-indicator');
        if (typing) typing.remove();
        
        console.error('Timesheet analysis error:', error);
        appendAIMessage('error', `Analysis error: ${error.message}`);
    } finally {
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = '🤖 Analyze & Generate Report';
        }
    }
}

function buildTimesheetComparison() {
    const allTasks = getAllTasks();
    
    // Build compact Gantt summary per person
    const ganttByPerson = {};
    allTasks.forEach(t => {
        const person = t.assignedTo || 'Unassigned';
        if (!ganttByPerson[person]) ganttByPerson[person] = [];
        ganttByPerson[person].push({
            task: t.name,
            station: stations.find(s => s.tasks && s.tasks.some(st => st.id === t.id))?.name || '',
            start: t.startDate,
            end: t.endDate,
            estH: t.estHours,
            actH: t.actualHours,
            status: t.status
        });
    });
    
    let ganttSummary = '';
    for (const [person, tasks] of Object.entries(ganttByPerson)) {
        const totalEst = tasks.reduce((s, t) => s + (t.estH || 0), 0);
        const totalAct = tasks.reduce((s, t) => s + (t.actH || 0), 0);
        ganttSummary += `${person} (Est:${totalEst}h Act:${totalAct}h):\n`;
        tasks.forEach(t => {
            ganttSummary += `  - ${t.task} | ${t.start}-${t.end} | Est:${t.estH}h Act:${t.actH}h | ${t.status}\n`;
        });
    }
    
    // Build compact timesheet summary per person
    let timesheetSummary = '';
    uploadedTimesheets.forEach(ts => {
        const totalHours = ts.rows.reduce((s, r) => s + r.hours, 0);
        timesheetSummary += `${ts.personName} (Total: ${totalHours}h, File: ${ts.fileName}):\n`;
        ts.rows.forEach(r => {
            const extras = [r.station, r.workset, r.category].filter(Boolean).join(', ');
            timesheetSummary += `  - ${r.date} | ${r.hours}h | ${r.description}${extras ? ' [' + extras + ']' : ''}${r.phase ? ' ('+r.phase+')' : ''}\n`;
        });
    });
    
    return { ganttByPerson, ganttSummary, timesheetSummary };
}

// ============================================
// GLOBAL TIMESHEET — LOG HOURS & EXPORT
// ============================================

function buildTimesheetSection(memberName, member) {
    const canLog = isAdmin || currentGroupLead || (currentMember && currentMember.name === memberName);
    const entries = timesheetEntries.filter(e => e.memberName === memberName);
    entries.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.startTime || '').localeCompare(a.startTime || ''));

    const stationOptions = stations.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    const categoryOptions = ['Administrative', 'Mechanical', 'Controls', 'General'].map(c =>
        `<option value="${c}">${c}</option>`).join('');
    const worksetOptions = ['Administrative Tasks', 'Project Meeting', 'Meeting With Faculty', 'Meeting With Leadership',
        'CAD Modelling', 'R&D', 'Brainstorming', 'Prototyping', 'Assembly Setup', 'Troubleshooting',
        'Electrical Design', 'Electrical Drafting', 'Product Design', 'Time Sheets', 'Mechanical Minor Team Meeting',
        'Mechanical Major Team Meeting', 'Attending Presentations', 'Meeting Minutes', 'Concept Testing',
        'Detailing', 'Mentoring/Helping', 'Other'].map(w =>
        `<option value="${w}">${w}</option>`).join('');

    const phaseOptions = projectPhases.map(p =>
        `<option value="${p.name}">${p.name}</option>`).join('');

    let logFormHTML = '';
    if (canLog) {
        logFormHTML = `
        <div style="background:var(--bg-secondary);border:1px solid var(--border-primary);border-radius:10px;padding:16px;margin-bottom:16px;">
            <h4 style="margin:0 0 12px;font-size:0.9rem;color:var(--text-primary);">Log New Time Entry</h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;">
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Phase</label>
                    <select id="ts-phase" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;">${phaseOptions}</select></div>
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Date</label>
                    <input type="date" id="ts-date" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;"></div>
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Start Time</label>
                    <input type="time" id="ts-start" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;"></div>
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">End Time</label>
                    <input type="time" id="ts-end" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;"></div>
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Station</label>
                    <select id="ts-station" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;">
                        <option value="Other">Other</option>${stationOptions}</select></div>
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Workset</label>
                    <select id="ts-workset" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;">${categoryOptions}</select></div>
                <div><label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Category</label>
                    <select id="ts-category" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;">${worksetOptions}</select></div>
            </div>
            <div style="margin-top:8px;">
                <label style="font-size:0.75rem;color:var(--text-muted);display:block;margin-bottom:3px;">Description</label>
                <input type="text" id="ts-description" placeholder="What did you work on?" style="width:100%;padding:6px 8px;background:var(--bg-primary);border:1px solid var(--border-primary);border-radius:6px;color:var(--text-primary);font-size:0.82rem;">
            </div>
            <button onclick="addTimesheetEntry('${memberName.replace(/'/g, "\\'")}')" style="margin-top:10px;padding:7px 18px;background:var(--accent);color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.82rem;">Add Entry</button>
        </div>`;
    }

    let entriesHTML = '';
    if (entries.length > 0) {
        entriesHTML = `
        <div style="overflow-x:auto;max-height:300px;overflow-y:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
                <thead><tr style="background:var(--bg-primary);position:sticky;top:0;">
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Phase</th>
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Date</th>
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Start</th>
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">End</th>
                    <th style="padding:6px 8px;text-align:right;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Hours</th>
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Station</th>
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Category</th>
                    <th style="padding:6px 8px;text-align:left;border-bottom:1px solid var(--border-primary);color:var(--text-muted);">Description</th>
                    ${canLog ? '<th style="padding:6px 8px;border-bottom:1px solid var(--border-primary);"></th>' : ''}
                </tr></thead>
                <tbody>
                    ${entries.map(e => `<tr style="border-bottom:1px solid var(--border-primary)20;">
                        <td style="padding:5px 8px;color:var(--text-secondary);white-space:nowrap;max-width:120px;overflow:hidden;text-overflow:ellipsis;" title="${e.phase || ''}">${(e.phase || '').replace(/^(PHASE \d+).*/, '$1')}</td>
                        <td style="padding:5px 8px;color:var(--text-primary);white-space:nowrap;">${e.date || ''}</td>
                        <td style="padding:5px 8px;color:var(--text-secondary);">${e.startTime || ''}</td>
                        <td style="padding:5px 8px;color:var(--text-secondary);">${e.endTime || ''}</td>
                        <td style="padding:5px 8px;color:var(--accent);text-align:right;font-weight:600;">${(e.hours || 0).toFixed(2)}</td>
                        <td style="padding:5px 8px;color:var(--text-secondary);white-space:nowrap;max-width:100px;overflow:hidden;text-overflow:ellipsis;">${e.station || ''}</td>
                        <td style="padding:5px 8px;color:var(--text-secondary);">${e.category || ''}</td>
                        <td style="padding:5px 8px;color:var(--text-secondary);max-width:180px;overflow:hidden;text-overflow:ellipsis;" title="${(e.description || '').replace(/"/g, '&quot;')}">${e.description || ''}</td>
                        ${canLog ? `<td style="padding:5px 4px;text-align:center;"><button onclick="deleteTimesheetEntry('${e.id}','${memberName.replace(/'/g, "\\'")}')" style="background:none;border:none;color:#dc3545;cursor:pointer;font-size:1rem;" title="Delete entry">&times;</button></td>` : ''}
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
    } else {
        entriesHTML = `<p style="text-align:center;color:var(--text-muted);padding:16px 0;font-size:0.85rem;">No time entries logged yet.</p>`;
    }

    const totalLogged = entries.reduce((s, e) => s + (e.hours || 0), 0);

    return `
        <div class="member-tasks-body" style="margin-top:0;">
            <h3 style="display:flex;justify-content:space-between;align-items:center;">
                Timesheet Log
                <span style="font-size:0.85rem;font-weight:600;color:var(--accent);">${totalLogged.toFixed(1)}h logged</span>
            </h3>
            ${logFormHTML}
            ${entriesHTML}
        </div>`;
}

function parseTimeToDecimal(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h + (m || 0) / 60;
}

async function addTimesheetEntry(memberName) {
    const phase = document.getElementById('ts-phase')?.value || '';
    const date = document.getElementById('ts-date')?.value || '';
    const startTime = document.getElementById('ts-start')?.value || '';
    const endTime = document.getElementById('ts-end')?.value || '';
    const station = document.getElementById('ts-station')?.value || 'Other';
    const workset = document.getElementById('ts-workset')?.value || '';
    const category = document.getElementById('ts-category')?.value || '';
    const description = document.getElementById('ts-description')?.value || '';

    if (!date) { showError('Please enter a date.'); return; }
    if (!startTime || !endTime) { showError('Please enter start and end times.'); return; }

    let hours = parseTimeToDecimal(endTime) - parseTimeToDecimal(startTime);
    if (hours <= 0) hours += 24;

    const entry = {
        id: 'ts-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        memberName,
        phase, date, startTime, endTime,
        hours: Math.round(hours * 100) / 100,
        station, workset, category, description,
        createdAt: new Date().toISOString()
    };

    timesheetEntries.push(entry);
    await saveTimesheetEntries();
    showSuccess(`Logged ${entry.hours.toFixed(2)}h for ${date}`);

    const memberIndex = teamMembers.findIndex(m => m.name === memberName);
    if (memberIndex >= 0) openMemberTasks(memberName, memberIndex);
}

async function deleteTimesheetEntry(entryId, memberName) {
    timesheetEntries = timesheetEntries.filter(e => e.id !== entryId);
    await saveTimesheetEntries();

    const memberIndex = teamMembers.findIndex(m => m.name === memberName);
    if (memberIndex >= 0) openMemberTasks(memberName, memberIndex);
}

function getWeekNumber(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / 86400000);
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function exportGlobalTimesheet() {
    if (!isAdmin) { showError('Only admins can export timesheets.'); return; }
    if (timesheetEntries.length === 0) { showError('No timesheet entries to export. Members need to log hours first.'); return; }

    const wb = XLSX.utils.book_new();

    const memberEntries = {};
    timesheetEntries.forEach(e => {
        if (!memberEntries[e.memberName]) memberEntries[e.memberName] = [];
        memberEntries[e.memberName].push(e);
    });

    // Collect all unique weeks across all entries
    const weekSet = new Set();
    timesheetEntries.forEach(e => { if (e.date) weekSet.add(getWeekNumber(e.date)); });
    const allWeeks = [...weekSet].sort((a, b) => a - b);

    // Determine current phase groupings from entries
    const phaseGroups = {};
    timesheetEntries.forEach(e => {
        const phaseKey = (e.phase || 'Unknown').replace(/^(PHASE \d+).*$/i, '$1').toUpperCase();
        if (!phaseGroups[phaseKey]) phaseGroups[phaseKey] = new Set();
        if (e.date) phaseGroups[phaseKey].add(getWeekNumber(e.date));
    });

    // Build Breakdown Summary sheet
    const summaryRows = [[''], ['']];

    Object.keys(phaseGroups).sort().forEach(phaseKey => {
        const phaseWeeks = [...phaseGroups[phaseKey]].sort((a, b) => a - b);

        // Phase header row
        const headerRow = ['', `${phaseKey} Summary`, '', ''];
        summaryRows.push(headerRow);
        summaryRows.push(['']);

        // Column headers: #, Names, Class/Role, Week N Summary..., Scheduled Hours, Actual/Estimate..., Grand Total
        const colHeaders = ['', '', 'Names', 'Role'];
        phaseWeeks.forEach(w => {
            colHeaders.push(`Week ${w} Summary`);
            colHeaders.push('Scheduled Hours');
            colHeaders.push(`Actual/Estimate*100% WK ${w}`);
        });
        colHeaders.push('Grand Total');
        summaryRows.push(colHeaders);

        // One data row per member
        let rowNum = 0;
        teamMembers.forEach(member => {
            const mEntries = (memberEntries[member.name] || []).filter(e => {
                const pk = (e.phase || '').replace(/^(PHASE \d+).*$/i, '$1').toUpperCase();
                return pk === phaseKey;
            });
            if (mEntries.length === 0) return;

            rowNum++;
            const row = ['', rowNum, member.name, member.role];
            let grandTotal = 0;
            phaseWeeks.forEach(w => {
                const weekHours = mEntries.filter(e => e.date && getWeekNumber(e.date) === w)
                    .reduce((s, e) => s + (e.hours || 0), 0);
                grandTotal += weekHours;
                const scheduled = member.targetHours || 40;
                const pct = scheduled > 0 ? (weekHours / scheduled) * 100 : 0;
                row.push(Math.round(weekHours * 100) / 100);
                row.push(scheduled);
                row.push(Math.round(pct * 100) / 100);
            });
            row.push(Math.round(grandTotal * 100) / 100);
            summaryRows.push(row);
        });
        summaryRows.push(['']);
    });

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 3 }, { wch: 4 }, { wch: 25 }, { wch: 12 },
        ...Array(allWeeks.length * 3 + 1).fill({ wch: 16 })];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Breakdown Summary');

    // Per-member sheets
    teamMembers.forEach(member => {
        const entries = (memberEntries[member.name] || []).sort((a, b) =>
            (a.date || '').localeCompare(b.date || '') || (a.startTime || '').localeCompare(b.startTime || ''));
        if (entries.length === 0) return;

        const rows = [];
        rows.push(['']);
        rows.push(['']);
        rows.push(['', '', '2026 CAPSTONE AUTOMATION PROJECT - TIME TRACKING']);
        rows.push(['']);
        // Calculate hours by phase
        const phaseHours = {};
        let totalHours = 0;
        entries.forEach(e => {
            const pk = (e.phase || 'Unknown').replace(/^(PHASE \d+).*$/i, '$1');
            phaseHours[pk] = (phaseHours[pk] || 0) + (e.hours || 0);
            totalHours += (e.hours || 0);
        });
        const sortedPhases = Object.keys(phaseHours).sort();

        // Rows 5-11 (idx 4-10): Name/Student/Email/Program/Role/Station/blank + HOURS SUMMARY on right
        // col E(4)='HOURS SUMMARY', col F(5)=label, col G(6)=value
        rows.push(['', 'Name', '', member.name, '', 'HOURS SUMMARY']);  // row 5
        rows.push(['', 'Student #', '', '']);  // row 6
        rows.push(['', 'Email', '', member.email || '']);  // row 7
        rows.push(['', 'Program', '', '']);  // row 8
        rows.push(['', 'Role', '', member.role]);  // row 9
        rows.push(['', 'Station Focus', '', '']);  // row 10

        sortedPhases.forEach((pk, i) => {
            const rowIdx = 6 + i; // rows 7,8,9... (0-indexed: 6,7,8...)
            while (rows.length <= rowIdx) rows.push([]);
            rows[rowIdx][6] = pk;
            rows[rowIdx][7] = Math.round(phaseHours[pk] * 100) / 100;
        });
        rows.push(['', '', '', '', '', 'Total Hours', '', Math.round(totalHours * 100) / 100]);

        // Weekly breakdown on right side
        const weekHrs = {};
        entries.forEach(e => {
            if (e.date) {
                const w = getWeekNumber(e.date);
                weekHrs[w] = (weekHrs[w] || 0) + (e.hours || 0);
            }
        });
        const memberWeeks = Object.keys(weekHrs).sort((a, b) => a - b);
        memberWeeks.forEach((w, i) => {
            const r = 4 + i;
            while (rows.length <= r) rows.push([]);
            rows[r][9] = `WEEK ${w}`;
            rows[r][10] = Math.round(weekHrs[w] * 100) / 100;
        });

        rows.push(['']);
        rows.push(['']);
        rows.push(['', 'Phase', 'Week', 'Date', 'Start Time', 'End Time', 'Hours ', 'Station', 'Workset', 'Category', 'Description']);

        entries.forEach(e => {
            rows.push([
                '',
                (e.phase || '').replace(/^(PHASE \d+).*$/i, '$1'),
                e.date ? getWeekNumber(e.date) : '',
                e.date || '',
                e.startTime || '',
                e.endTime || '',
                e.hours || 0,
                e.station || '',
                e.workset || '',
                e.category || '',
                e.description || ''
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 3 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 12 },
            { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 10 },
            { wch: 22 }, { wch: 50 }];

        const sheetName = member.name.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const fileName = `Time_Sheet_Summary_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showSuccess(`Timesheet exported: ${fileName}`);
}

function generateExcelReport(analysis, comparisonData) {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
        ['TIMESHEET vs GANTT ANALYSIS REPORT'],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['OVERALL SUMMARY'],
        [analysis.summary],
        ['']
    ];
    
    if (analysis.risks && analysis.risks.length > 0) {
        summaryData.push(['RISKS & CONCERNS']);
        analysis.risks.forEach((r, i) => summaryData.push([`${i + 1}. ${r}`]));
        summaryData.push(['']);
    }
    
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        summaryData.push(['RECOMMENDATIONS']);
        analysis.recommendations.forEach((r, i) => summaryData.push([`${i + 1}. ${r}`]));
    }
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
    
    // Sheet 2: Person-by-Person Analysis
    const personHeaders = ['Name', 'Gantt Hours', 'Timesheet Hours', 'Difference', 'Status', 'Matched Tasks', 'Unmatched Gantt Tasks', 'Unmatched Timesheet Entries', 'Assessment'];
    const personRows = [personHeaders];
    
    if (analysis.personAnalysis) {
        analysis.personAnalysis.forEach(p => {
            personRows.push([
                p.name,
                p.ganttHours,
                p.timesheetHours,
                p.hoursDiff,
                p.flag === 'red' ? '❌ Concern' : p.flag === 'yellow' ? '⚠️ Review' : '✅ OK',
                (p.matchedTasks || []).join('; '),
                (p.unmatchedGantt || []).join('; '),
                (p.unmatchedTimesheet || []).join('; '),
                p.assessment
            ]);
        });
    }
    
    const personSheet = XLSX.utils.aoa_to_sheet(personRows);
    personSheet['!cols'] = [
        { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
        { wch: 40 }, { wch: 40 }, { wch: 40 }, { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(wb, personSheet, 'Person Analysis');
    
    // Sheet 3: Gantt Tasks (all planned work)
    const ganttHeaders = ['Person', 'Station', 'Task', 'Start Date', 'End Date', 'Est Hours', 'Actual Hours', 'Status'];
    const ganttRows = [ganttHeaders];
    
    for (const [person, tasks] of Object.entries(comparisonData.ganttByPerson)) {
        tasks.forEach(t => {
            ganttRows.push([person, t.station, t.task, t.start, t.end, t.estH, t.actH, t.status]);
        });
    }
    
    const ganttSheet = XLSX.utils.aoa_to_sheet(ganttRows);
    ganttSheet['!cols'] = [
        { wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ganttSheet, 'Gantt Tasks');
    
    // Sheet 4: Timesheet Data (all reported work)
    const tsHeaders = ['Person', 'Phase', 'Date', 'Start Time', 'End Time', 'Hours', 'Station', 'Workset', 'Category', 'Description'];
    const tsRows = [tsHeaders];
    
    uploadedTimesheets.forEach(ts => {
        ts.rows.forEach(r => {
            tsRows.push([ts.personName, r.phase || '', r.date, r.startTime || '', r.endTime || '', r.hours, r.station || '', r.workset || '', r.category || '', r.description]);
        });
    });
    
    const tsSheet = XLSX.utils.aoa_to_sheet(tsRows);
    tsSheet['!cols'] = [
        { wch: 25 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 50 }
    ];
    XLSX.utils.book_append_sheet(wb, tsSheet, 'Timesheet Data');
    
    // Download
    const fileName = `Timesheet_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    showSuccess(`Report downloaded: ${fileName}`);
}

function generateBasicExcelReport(comparisonData) {
    // Fallback report when AI JSON parsing fails
    const wb = XLSX.utils.book_new();
    
    // Gantt Tasks sheet
    const ganttHeaders = ['Person', 'Station', 'Task', 'Start', 'End', 'Est Hours', 'Actual Hours', 'Status'];
    const ganttRows = [ganttHeaders];
    for (const [person, tasks] of Object.entries(comparisonData.ganttByPerson)) {
        tasks.forEach(t => {
            ganttRows.push([person, t.station, t.task, t.start, t.end, t.estH, t.actH, t.status]);
        });
    }
    const ganttSheet = XLSX.utils.aoa_to_sheet(ganttRows);
    ganttSheet['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ganttSheet, 'Gantt Tasks');
    
    // Timesheet Data sheet
    const tsHeaders = ['Person', 'Phase', 'Date', 'Start Time', 'End Time', 'Hours', 'Station', 'Workset', 'Category', 'Description'];
    const tsRows = [tsHeaders];
    uploadedTimesheets.forEach(ts => {
        ts.rows.forEach(r => {
            tsRows.push([ts.personName, r.phase || '', r.date, r.startTime || '', r.endTime || '', r.hours, r.station || '', r.workset || '', r.category || '', r.description]);
        });
    });
    const tsSheet = XLSX.utils.aoa_to_sheet(tsRows);
    tsSheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, tsSheet, 'Timesheet Data');
    
    const fileName = `Timesheet_Comparison_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    showSuccess(`Basic report downloaded: ${fileName}`);
}

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE (for onclick handlers)
// ============================================

window.switchToView = switchToView;
window.updateStation = updateStation;
window.addNewStation = addNewStation;
window.deleteStation = deleteStation;
window.updateTask = updateTask;
window.addNewTaskToStation = addNewTaskToStation;
window.deleteTask = deleteTask;
window.openModal = openModal;
window.closeModal = closeModal;
window.addNewTeamMember = addNewTeamMember;
window.clearAllTaskData = clearAllTaskData;
window.resendInvite = resendInvite;
window.openEmailSettings = openEmailSettings;
window.saveEmailSettings = saveEmailSettings;
window.testEmailSettings = testEmailSettings;
window.sendDeadlineAlerts = sendDeadlineAlerts;
window.showMemberLoginModal = showMemberLoginModal;
window.memberLogin = memberLogin;
window.memberLogout = memberLogout;
window.editMemberProfile = editMemberProfile;
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
window.toggleAIPanel = toggleAIPanel;
window.toggleAISettings = toggleAISettings;
window.switchAIProvider = switchAIProvider;
window.saveAIApiKey = saveAIApiKey;
window.saveAIModel = saveAIModel;
window.sendAIMessage = sendAIMessage;
window.sendAIQuickAction = sendAIQuickAction;
window.handleAIInputKeydown = handleAIInputKeydown;
window.toggleTimesheetUpload = toggleTimesheetUpload;
window.handleTimesheetFiles = handleTimesheetFiles;
window.removeTimesheet = removeTimesheet;
window.analyzeTimesheets = analyzeTimesheets;
window.addTimesheetEntry = addTimesheetEntry;
window.deleteTimesheetEntry = deleteTimesheetEntry;
window.exportGlobalTimesheet = exportGlobalTimesheet;

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
        
        // Migrate: ensure each team member has username/password fields
        teamMembers.forEach((m, i) => {
            if (!m.username) {
                const def = defaultTeamMembers.find(d => d.name === m.name);
                m.username = def ? def.username : m.name.split(' ')[0].toLowerCase();
                m.password = def ? def.password : m.username + '123';
            }
        });
        
        // Load group leads
        groupLeads = JSON.parse(localStorage.getItem('loopGroupLeads')) || JSON.parse(JSON.stringify(defaultGroupLeads));

        // Load timesheet entries
        timesheetEntries = JSON.parse(localStorage.getItem('loopTimesheetEntries')) || [];
        
        // Render initial views
        renderAllViews();
        console.log('Initial render complete');
        
        // Initialize group lead UI
        updateGroupLeadUI();
        updateMemberUI();
        
        // Setup timesheet drag-drop
        setupTimesheetDragDrop();
        
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
