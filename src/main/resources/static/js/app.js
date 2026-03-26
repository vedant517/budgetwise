/**
 * BUDGETWISE - Main Application Script
 * Handles Authentication, CRUD operations, and UI rendering.
 */

// --- STATE MANAGEMENT ---
const State = {
    user: null,
    token: localStorage.getItem('bw_token') || null,
    expenses: [],
    incomes: [],
    budgets: [],
    savingsGoals: [],
    activePage: 'dashboard',
    charts: {}
};

// --- CONFIG ---
const API_URL = ''; // Relative to origin

// --- UTILS ---
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount || 0);
};


const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const showLoading = (btnId, show) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (show) {
        text.classList.add('hidden');
        loader.classList.remove('hidden');
        btn.disabled = true;
    } else {
        text.classList.remove('hidden');
        loader.classList.add('hidden');
        btn.disabled = false;
    }
};

const showToast = (message, type = 'info') => {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toastMsg');
    msg.textContent = message;
    toast.className = `toast visible ${type}`;
    setTimeout(() => {
        toast.className = 'toast hidden';
    }, 3000);
};

// --- API HELPER ---
const api = async (endpoint, method = 'GET', body = null) => {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (State.token) {
        headers['Authorization'] = `Bearer ${State.token}`;
    }

    const options = {
        method,
        headers
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, options);
    } catch (err) {
        if (err.message.includes('Failed to fetch')) {
            throw new Error('Could not connect to the server. Please ensure the backend is running.');
        }
        throw err;
    }
    
    if (response.status === 401 || response.status === 403) {
        logout();
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Request failed');
    }

    if (response.status === 204) return null;
    return response.json();
};

// --- AUTH LOGIC ---
const login = async (email, password) => {
    try {
        showLoading('loginBtn', true);
        
        // MOCK AUTH: Skip API call
        // const data = await api('/auth/login', 'POST', { email, password });
        
        const data = {
            token: "mock-token-123",
            email: email,
            firstName: "Demo",
            lastName: "User",
            role: "ROLE_ADMIN",
            income: 5000,
            targetExpenses: 3000,
            savingsGoal: 1000
        };
        
        State.token = data.token;
        State.user = data; 
        localStorage.setItem('bw_token', data.token);
        
        await initApp();
        navigatePage('dashboard');
        showToast('Welcome back (Mock Mode)!', 'success');
    } catch (err) {
        const errEl = document.getElementById('loginError');
        errEl.textContent = 'Invalid email or password';
        errEl.classList.remove('hidden');
    } finally {
        showLoading('loginBtn', false);
    }
};

const register = async (formData) => {
    try {
        showLoading('registerBtn', true);
        
        // MOCK AUTH: Skip API call
        // const data = await api('/auth/register', 'POST', formData);
        
        const data = {
            token: "mock-token-123",
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: "ROLE_USER",
            income: formData.income,
            targetExpenses: formData.targetExpenses,
            savingsGoal: formData.savingsGoal
        };
        
        State.token = data.token;
        State.user = data;
        localStorage.setItem('bw_token', data.token);
        
        await initApp();
        navigatePage('dashboard');
        showToast('Account created successfully (Mock Mode)!', 'success');
    } catch (err) {
        const errEl = document.getElementById('registerError');
        errEl.textContent = err.message || 'Registration failed';
        errEl.classList.remove('hidden');
    } finally {
        showLoading('registerBtn', false);
    }
};

const logout = () => {
    State.token = null;
    State.user = null;
    State.expenses = [];
    State.incomes = [];
    localStorage.removeItem('bw_token');
    
    document.getElementById('appSection').classList.add('hidden');
    document.getElementById('authSection').classList.remove('hidden');
    navigatePage('dashboard');
};

// --- DATA FETCHING ---
const refreshData = async () => {
    try {
        // MOCK DATA: Skip actual dashboard fetch
        /*
        const [profile, expenses, incomes, budgets, savingsGoals] = await Promise.all([
            api('/api/profile'),
            api('/api/expenses'),
            api('/api/incomes'),
            api('/api/budgets'),
            api('/api/savings-goals')
        ]);
        */
        const profile = State.user || { firstName: "Demo", lastName: "User", role: "ROLE_ADMIN", income: 5000, savingsGoal: 1000, targetExpenses: 3000 };
        const _d = new Date();
        const yyyymm = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-01`;
        const lastMonth = new Date(_d.getFullYear(), _d.getMonth() - 1, 1).toISOString().split('T')[0];
        
        const expenses = [
            { id: 1, amount: 200, category: "Food", description: "Lunch", createdAt: yyyymm },
            { id: 2, amount: 900, category: "Housing", description: "Rent", createdAt: yyyymm },
            { id: 3, amount: 1500, category: "Travel", description: "Flight", createdAt: lastMonth },
            { id: 4, amount: 300, category: "Food", description: "Dinner", createdAt: lastMonth }
        ];
        const incomes = [
            { id: 1, amount: 5000, category: "Salary", description: "Salary", createdAt: yyyymm },
            { id: 2, amount: 5000, category: "Salary", description: "Salary", createdAt: lastMonth }
        ];
        const budgets = [
            { category: "Food", budgetAmount: 1000, spentAmount: 500, remainingAmount: 500 },
            { category: "Housing", budgetAmount: 1200, spentAmount: 900, remainingAmount: 300 }
        ];
        const savingsGoals = [];

        State.user = profile;
        State.expenses = expenses;
        State.incomes = incomes;
        State.budgets = budgets;
        State.savingsGoals = savingsGoals;
        
        updateUI();
    } catch (err) {
        console.error('Failed to refresh data', err);
        // If profile fails, it will likely logout via api helper 403
    }
};

// --- NAVIGATION ---
const navigatePage = (pageId) => {
    State.activePage = pageId;
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`nav-${pageId}`).classList.add('active');
    
    const titles = {
        dashboard: 'Dashboard',
        expenses: 'Expenses & Income',
        budgets: 'Monthly Budgets',
        savings: 'Savings Goals',
        analytics: 'Analytics',
        profile: 'User Profile'
    };
    document.getElementById('pageTitle').textContent = titles[pageId];
    
    if (pageId === 'analytics') {
        const range = document.getElementById('analyticsRange').value;
        renderAnalytics(range);
    }
    if (pageId === 'expenses') renderExpensesTable();
    if (pageId === 'budgets') renderBudgets();
    if (pageId === 'savings') renderSavingsGoals();
};

// --- UI UPDATES ---
const updateUI = () => {
    const user = State.user;
    if (!user) return;

    // Sidebar
    document.getElementById('sidebarUserName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('sidebarUserRole').textContent = user.role === 'ROLE_ADMIN' ? 'Administrator' : 'Premium Member';
    document.getElementById('userAvatar').textContent = `${user.firstName[0]}${user.lastName[0]}`;

    // Dashboard KPIs
    const totalExpenses = State.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = State.incomes.reduce((sum, i) => sum + i.amount, 0); // Combined log and base
    const monthlyIncome = user.income;
    const balance = (monthlyIncome + totalIncome) - totalExpenses;
    
    document.getElementById('kpiIncome').textContent = formatCurrency(monthlyIncome + totalIncome);
    document.getElementById('kpiExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('kpiBalance').textContent = formatCurrency(balance);
    
    // Savings Goals KPI - Aggregated from all goals
    const totalTarget = (State.savingsGoals && State.savingsGoals.length > 0) 
        ? State.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0) 
        : user.savingsGoal;
    const totalSaved = (State.savingsGoals && State.savingsGoals.length > 0)
        ? State.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0)
        : balance; // Fallback to balance if no goals defined

    document.getElementById('kpiSavings').textContent = formatCurrency(totalTarget);

    const savingsPct = Math.min(100, Math.max(0, (totalSaved / totalTarget) * 100));
    document.getElementById('savingsProgressFill').style.width = `${savingsPct}%`;
    document.getElementById('kpiSavingsText').textContent = `${savingsPct.toFixed(1)}% achieved`;

    const expensesPct = ((totalExpenses / (monthlyIncome + totalIncome)) * 100).toFixed(1);
    document.getElementById('kpiExpensesChange').textContent = `${expensesPct}% of total income`;

    // Charts & Recent
    renderCharts();
    renderRecentTransactions();
    
    // Profile
    document.getElementById('profileFullName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRole').textContent = user.role.replace('ROLE_', '');
    document.getElementById('profileAvatarLg').textContent = `${user.firstName[0]}${user.lastName[0]}`;
    document.getElementById('profileExpCount').textContent = State.expenses.length;
    document.getElementById('profileTotalSpent').textContent = formatCurrency(totalExpenses);
    
    document.getElementById('detailIncome').textContent = formatCurrency(user.income);
    document.getElementById('detailSavings').textContent = formatCurrency(user.savingsGoal);
    document.getElementById('detailTarget').textContent = formatCurrency(user.targetExpenses);
    
    document.getElementById('profileSavPct').textContent = `${savingsPct.toFixed(1)}%`;
    document.getElementById('profileSavFill').style.width = `${savingsPct}%`;

    // Budget Progress Bars
    document.getElementById('budgetIncomeLbl').textContent = formatCurrency(monthlyIncome + totalIncome);
    document.getElementById('budgetExpLbl').textContent = formatCurrency(totalExpenses);
    document.getElementById('budgetSavLbl').textContent = formatCurrency(user.savingsGoal);
    document.getElementById('budgetTargLbl').textContent = formatCurrency(user.targetExpenses);

    document.getElementById('budgetExpFill').style.width = `${Math.min(100, (totalExpenses / (monthlyIncome + totalIncome)) * 100)}%`;
    document.getElementById('budgetSavFill').style.width = `${savingsPct}%`;
    document.getElementById('budgetTargFill').style.width = `${Math.min(100, (totalExpenses / user.targetExpenses) * 100)}%`;
};

const renderRecentTransactions = () => {
    const list = document.getElementById('recentTransactions');
    // Combine both and sort by date
    const all = [
        ...State.expenses.map(e => ({ ...e, type: 'expense' })),
        ...State.incomes.map(i => ({ ...i, type: 'income' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    if (all.length === 0) {
        list.innerHTML = '<div class="empty-state">No transactions yet</div>';
        return;
    }

    list.innerHTML = all.map(tx => `
        <div class="tx-item">
            <div class="tx-icon cat-icon-${tx.category}">${getCategoryEmoji(tx.category)}</div>
            <div class="tx-info">
                <div class="tx-desc">${tx.description}</div>
                <div class="tx-meta">${formatDate(tx.createdAt)} • ${tx.type.toUpperCase()}</div>
            </div>
            <div class="tx-amount" style="color: ${tx.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'}">
                ${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
            </div>
            <div class="tx-category badge-${tx.category}">${tx.category}</div>
        </div>
    `).join('');
};

const renderExpensesTable = () => {
    const container = document.getElementById('expensesTable');
    
    const all = [
        ...State.expenses.map(e => ({ ...e, type: 'expense' })),
        ...State.incomes.map(i => ({ ...i, type: 'income' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (all.length === 0) {
        container.innerHTML = '<div class="empty-state">No transactions found</div>';
        return;
    }

    container.innerHTML = `
        <table class="expense-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${all.map(tx => `
                    <tr>
                        <td>${formatDate(tx.createdAt)}</td>
                        <td>${tx.description}</td>
                        <td><span class="badge badge-${tx.category}">${tx.category}</span></td>
                        <td style="color: ${tx.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'}; font-weight: 600;">
                            ${tx.type.toUpperCase()}
                        </td>
                        <td style="font-weight: 700;">${formatCurrency(tx.amount)}</td>
                        <td>
                            <button class="btn-logout" onclick="openEditModal('${tx.id}', '${tx.type}')" title="Edit" style="color: var(--accent-light);">✏️</button>
                            <button class="btn-logout" onclick="deleteTransaction('${tx.id}', '${tx.type}')" title="Delete">🗑️</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
};

const renderBudgets = () => {
    const list = document.getElementById('budgetList');
    const picker = document.getElementById('budgetMonthPicker');
    
    if (!picker.value) {
        const now = new Date();
        picker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const categories = ['Food', 'Travel', 'Housing', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other'];
    
    list.innerHTML = categories.map(cat => {
        const b = State.budgets.find(b => b.category === cat) || { budgetAmount: 0, spentAmount: 0, remainingAmount: 0 };
        const pct = b.budgetAmount > 0 ? (b.spentAmount / b.budgetAmount) * 100 : 0;
        const color = pct > 100 ? 'var(--expense-color)' : pct > 80 ? '#f1c40f' : 'var(--income-color)';

        return `
            <div class="budget-item glass-card" style="margin-bottom: 16px; padding: 20px;">
                <div class="budget-item-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">${getCategoryEmoji(cat)}</span>
                        <h4 style="margin: 0; font-size: 18px; font-weight: 600;">${cat}</h4>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; color: var(--text-muted);">Budget Limit</div>
                        <input type="number" class="form-input budget-input" data-category="${cat}" value="${b.budgetAmount}" 
                            style="width: 100px; padding: 4px 8px; text-align: right; font-weight: 700;">
                    </div>
                </div>
                <div class="budget-progress-container">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                        <span>Spent: <strong>${formatCurrency(b.spentAmount)}</strong></span>
                        <span>Remaining: <strong style="color: ${b.remainingAmount < 0 ? 'var(--expense-color)' : 'var(--income-color)'}">${formatCurrency(b.remainingAmount)}</strong></span>
                    </div>
                    <div class="kpi-progress-bar" style="height: 8px; background: rgba(255,255,255,0.05);">
                        <div class="kpi-progress-fill" style="width: ${Math.min(100, pct)}%; background: ${color}"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Add listeners to budget inputs
    document.querySelectorAll('.budget-input').forEach(input => {
        input.onchange = async (e) => {
            const cat = e.target.dataset.category;
            const amount = parseFloat(e.target.value);
            const [year, month] = picker.value.split('-').map(Number);
            
            try {
                await api('/api/budgets', 'POST', { category: cat, amount, month, year });
                showToast(`Budget updated for ${cat}`, 'success');
                refreshData();
            } catch (err) {
                showToast('Failed to update budget', 'error');
            }
        };
    });

    picker.onchange = async () => {
        const [year, month] = picker.value.split('-').map(Number);
        const budgets = await api(`/api/budgets?month=${month}&year=${year}`);
        State.budgets = budgets;
        renderBudgets();
    };
};

const renderSavingsGoals = () => {
    const grid = document.getElementById('savingsGoalsGrid');
    
    if (State.savingsGoals.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon">🎯</div>
                <p>No savings goals found. Create one to start tracking!</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = State.savingsGoals.map(goal => `
        <div class="goal-card glass-card" style="padding: 24px; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                <div>
                    <h3 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 700;">${goal.name}</h3>
                    <div style="font-size: 13px; color: var(--text-muted);">Deadline: ${formatDate(goal.deadline)}</div>
                </div>
                <button class="btn-logout" onclick="deleteGoal('${goal.id}')" title="Delete Goal">🗑️</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                    <div style="font-size: 24px; font-weight: 800; color: var(--accent-light);">
                        ${formatCurrency(goal.currentAmount)}
                        <span style="font-size: 14px; font-weight: 400; color: var(--text-muted);">/ ${formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div style="font-weight: 700; color: var(--income-color);">${goal.progressPercentage.toFixed(1)}%</div>
                </div>
                <div class="kpi-progress-bar" style="height: 10px; background: rgba(255,255,255,0.05);">
                    <div class="kpi-progress-fill" style="width: ${Math.min(100, goal.progressPercentage)}%; background: linear-gradient(90deg, var(--accent-light), var(--income-color));"></div>
                </div>
            </div>

            <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary btn-full" style="padding: 8px; font-size: 13px;" onclick="addSavings('${goal.id}')">+ Add Savings</button>
            </div>
        </div>
    `).join('');
};

const deleteGoal = async (id) => {
    if (!confirm('Delete this savings goal?')) return;
    try {
        await api(`/api/savings-goals/${id}`, 'DELETE');
        showToast('Goal deleted', 'success');
        refreshData();
    } catch (err) {
        showToast('Failed to delete goal', 'error');
    }
};

const addSavings = async (id) => {
    const amount = prompt('Enter amount to add to this goal:');
    if (!amount || isNaN(amount)) return;
    
    try {
        await api(`/api/savings-goals/${id}?amount=${amount}`, 'PATCH');
        showToast('Savings added!', 'success');
        refreshData();
    } catch (err) {
        showToast('Failed to add savings', 'error');
    }
};

let editingTx = null;

const openEditModal = (id, type) => {
    const tx = type === 'expense' ? State.expenses.find(e => e.id === id) : State.incomes.find(i => i.id === id);
    if (!tx) return;
    
    editingTx = { ...tx, type };
    
    if (type === 'expense') {
        document.getElementById('expDesc').value = tx.description;
        document.getElementById('expAmount').value = tx.amount;
        document.getElementById('expCategory').value = tx.category;
        document.querySelector('#expenseModal .modal-title').textContent = '✏️ Edit Expense';
        document.getElementById('saveExpenseBtn').querySelector('.btn-text').textContent = 'Update Expense';
        document.getElementById('expenseModal').classList.remove('hidden');
    } else {
        document.getElementById('incDesc').value = tx.description;
        document.getElementById('incAmount').value = tx.amount;
        document.getElementById('incCategory').value = tx.category;
        document.querySelector('#incomeModal .modal-title').textContent = '✏️ Edit Income';
        document.getElementById('saveIncomeBtn').querySelector('.btn-text').textContent = 'Update Income';
        document.getElementById('incomeModal').classList.remove('hidden');
    }
};

const deleteTransaction = async (id, type) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
        const endpoint = type === 'expense' ? `/api/expenses/${id}` : `/api/incomes/${id}`;
        await api(endpoint, 'DELETE');
        showToast('Transaction deleted', 'success');
        refreshData();
    } catch (err) {
        showToast('Failed to delete transaction', 'error');
    }
};

const getCategoryEmoji = (cat) => {
    const m = {
        Food: '🍔', Travel: '✈️', Housing: '🏠', Entertainment: '🎬',
        Healthcare: '🏥', Shopping: '🛍️', Education: '📚', Other: '📦',

        Salary: '💼', Freelance: '💻', Investment: '📈', Gift: '🎁'
    };
    return m[cat] || '💰';
};

// --- CHARTS ---
const renderCharts = () => {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    // Aggregate by category
    const cats = {};
    State.expenses.forEach(e => {
        cats[e.category] = (cats[e.category] || 0) + e.amount;
    });

    const data = {
        labels: Object.keys(cats),
        datasets: [{
            data: Object.values(cats),
            backgroundColor: [
                '#ff6b6b', '#4ecdc4', '#ffd93d', '#a29bfe', '#fd79a8', '#6c5ce7', '#00b894', '#74b9ff'
            ],
            borderWidth: 0,
            hoverOffset: 10
        }]
    };

    if (State.charts.category) State.charts.category.destroy();
    
    State.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
            cutout: '75%',
            plugins: { legend: { display: false } },
            maintainAspectRatio: false
        }
    });

    document.getElementById('donutTotal').textContent = formatCurrency(State.expenses.reduce((s, e) => s + e.amount, 0));
    
    const legend = document.getElementById('chartLegend');
    legend.innerHTML = Object.keys(cats).map((c, i) => `
        <div class="legend-item">
            <span class="legend-dot" style="background: ${data.datasets[0].backgroundColor[i % 8]}"></span>
            <span>${c}</span>
        </div>
    `).join('');
};

const renderAnalytics = (months = 6) => {
    // 1. Data Processing
    const now = new Date();
    const periodLabels = [];
    const expenseTotals = [];
    const incomeTotals = [];
    
    // For "Current Year", we go from Jan to Current Month
    let limit = months === 'year' ? now.getMonth() + 1 : parseInt(months);
    
    for (let i = limit - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = d.toISOString().split('T')[0].substring(0, 7); // "YYYY-MM"
        periodLabels.push(d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }));
        
        const mExps = State.expenses.filter(e => e.createdAt.startsWith(monthKey));
        const mIncs = State.incomes.filter(i => i.createdAt.startsWith(monthKey));
        
        expenseTotals.push(mExps.reduce((s, e) => s + e.amount, 0));
        incomeTotals.push(mIncs.reduce((s, i) => s + i.amount, 0));
    }

    // 2. Chart: Monthly Spending Comparison (Line/Bar)
    const spendingCtx = document.getElementById('monthlySpendingChart');
    if (spendingCtx) {
        if (State.charts.spending) State.charts.spending.destroy();
        State.charts.spending = new Chart(spendingCtx, {
            type: 'bar',
            data: {
                labels: periodLabels,
                datasets: [{
                    label: 'Total Expenses',
                    data: expenseTotals,
                    backgroundColor: 'rgba(255, 87, 87, 0.4)',
                    borderColor: '#ff5757',
                    borderWidth: 2,
                    borderRadius: 8,
                    fill: true
                }]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b92b5', callback: val => '₹' + val } },
                    x: { grid: { display: false }, ticks: { color: '#8b92b5' } }
                }
            }
        });
    }

    // 3. Chart: Category Pie
    const pieCtx = document.getElementById('analyticsCategoryPie');
    if (pieCtx) {
        const cats = {};
        State.expenses.forEach(e => {
            cats[e.category] = (cats[e.category] || 0) + e.amount;
        });

        const data = {
            labels: Object.keys(cats),
            datasets: [{
                data: Object.values(cats),
                backgroundColor: [
                    '#ff6b6b', '#4ecdc4', '#ffd93d', '#a29bfe', '#fd79a8', '#6c5ce7', '#00b894', '#74b9ff'
                ],
                borderWidth: 0,
                hoverOffset: 15
            }]
        };

        if (State.charts.analyticsPie) State.charts.analyticsPie.destroy();
        State.charts.analyticsPie = new Chart(pieCtx, {
            type: 'doughnut',
            data: data,
            options: {
                cutout: '65%',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

        // Legend with amounts
        const legend = document.getElementById('analyticsPieLegend');
        const total = Object.values(cats).reduce((s, a) => s + a, 0);
        legend.innerHTML = Object.keys(cats).map((c, i) => {
            const val = cats[c];
            const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
            return `
                <div class="legend-item-rich">
                    <span class="legend-dot" style="background: ${data.datasets[0].backgroundColor[i % 8]}"></span>
                    <div class="legend-info">
                        <span class="legend-label">${c}</span>
                        <span class="legend-val">${formatCurrency(val)} <small>(${pct}%)</small></span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Chart: Income vs Expenses (Grouped Bar)
    const cashFlowCtx = document.getElementById('incomeVsExpenseChart');
    if (cashFlowCtx) {
        if (State.charts.cashFlow) State.charts.cashFlow.destroy();
        State.charts.cashFlow = new Chart(cashFlowCtx, {
            type: 'bar',
            data: {
                labels: periodLabels,
                datasets: [
                    { label: 'Income', data: incomeTotals, backgroundColor: '#00d9a0', borderRadius: 4 },
                    { label: 'Expense', data: expenseTotals, backgroundColor: '#ff5757', borderRadius: 4 }
                ]
            },
            options: {
                maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top', labels: { color: '#8b92b5', boxWidth: 12, usePointStyle: true } } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8b92b5' } },
                    x: { grid: { display: false }, ticks: { color: '#8b92b5' } }
                }
            }
        });
    }

    // 5. Summary Stats
    const summaryRow = document.getElementById('analyticsSummaryRow');
    if (summaryRow) {
        const totalExp = expenseTotals.reduce((s, a) => s + a, 0);
        const totalInc = incomeTotals.reduce((s, a) => s + a, 0);
        const avgExp = totalExp / (expenseTotals.length || 1);
        const savingsRate = totalInc > 0 ? (((totalInc - totalExp) / totalInc) * 100).toFixed(1) : 0;

        summaryRow.innerHTML = `
            <div class="summary-stat">
                <span class="summary-label">Total Spent (Period)</span>
                <span class="summary-value">${formatCurrency(totalExp)}</span>
            </div>
            <div class="summary-stat">
                <span class="summary-label">Avg. Monthly Spent</span>
                <span class="summary-value">${formatCurrency(avgExp)}</span>
            </div>
            <div class="summary-stat">
                <span class="summary-label">Total Earned (Period)</span>
                <span class="summary-value" style="color: var(--income-color)">${formatCurrency(totalInc)}</span>
            </div>
            <div class="summary-stat">
                <span class="summary-label">Savings Rate</span>
                <span class="summary-value" style="color: ${savingsRate > 0 ? 'var(--income-color)' : 'var(--expense-color)'}">${savingsRate}%</span>
            </div>
        `;
    }
};


// --- INITIALIZATION ---
const initApp = async () => {
    if (!State.token) {
        document.getElementById('authSection').classList.remove('hidden');
        document.getElementById('appSection').classList.add('hidden');
        return;
    }

    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('appSection').classList.remove('hidden');
    
    document.getElementById('pageDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    await refreshData();
};

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            navigatePage(btn.dataset.page);
        };
    });

    document.getElementById('sidebarToggle').onclick = () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    };

    // Auth Switch
    document.querySelectorAll('.goToRegisterBtn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            document.getElementById('loginPage').classList.remove('active');
            document.getElementById('registerPage').classList.add('active');
        };
    });
    
    document.querySelectorAll('.goToLoginBtn').forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            document.getElementById('registerPage').classList.remove('active');
            document.getElementById('loginPage').classList.add('active');
        };
    });

    // Forms
    document.getElementById('loginForm').onsubmit = (e) => {
        e.preventDefault();
        login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    };

    document.getElementById('registerForm').onsubmit = (e) => {
        e.preventDefault();
        const data = {
            firstName: document.getElementById('regFirstName').value,
            lastName: document.getElementById('regLastName').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            income: parseFloat(document.getElementById('regIncome').value),
            savingsGoal: parseFloat(document.getElementById('regSavings').value),
            targetExpenses: parseFloat(document.getElementById('regTarget').value)
        };
        register(data);
    };

    document.getElementById('logoutBtn').onclick = logout;

    // Modals
    const expenseModal = document.getElementById('expenseModal');
    const incomeModal = document.getElementById('incomeModal');

    document.getElementById('addExpenseTopBtn').onclick = () => {
        editingTx = null;
        document.querySelector('#expenseModal .modal-title').textContent = '✏️ Add New Expense';
        document.getElementById('saveExpenseBtn').querySelector('.btn-text').textContent = 'Save Expense';
        expenseModal.classList.remove('hidden');
    };
    document.getElementById('addExpensePageBtn').onclick = () => {
        editingTx = null;
        document.querySelector('#expenseModal .modal-title').textContent = '✏️ Add New Expense';
        document.getElementById('saveExpenseBtn').querySelector('.btn-text').textContent = 'Save Expense';
        expenseModal.classList.remove('hidden');
    };
    document.getElementById('closeModal').onclick = () => expenseModal.classList.add('hidden');
    document.getElementById('cancelExpense').onclick = () => expenseModal.classList.add('hidden');

    document.getElementById('addIncomeTopBtn').onclick = () => {
        editingTx = null;
        document.querySelector('#incomeModal .modal-title').textContent = '💰 Add New Income';
        document.getElementById('saveIncomeBtn').querySelector('.btn-text').textContent = 'Save Income';
        incomeModal.classList.remove('hidden');
    };
    document.getElementById('closeIncomeModal').onclick = () => incomeModal.classList.add('hidden');
    document.getElementById('cancelIncome').onclick = () => incomeModal.classList.add('hidden');

    // Savings Goal Modal
    const goalModal = document.getElementById('goalModal');
    document.getElementById('addGoalBtn').onclick = () => {
        goalModal.classList.remove('hidden');
    };
    document.getElementById('closeGoalModal').onclick = () => goalModal.classList.add('hidden');
    document.getElementById('cancelGoal').onclick = () => goalModal.classList.add('hidden');

    document.getElementById('goalForm').onsubmit = async (e) => {
        e.preventDefault();
        const body = {
            name: document.getElementById('goalName').value,
            targetAmount: parseFloat(document.getElementById('goalTarget').value),
            currentAmount: parseFloat(document.getElementById('goalCurrent').value || 0),
            deadline: document.getElementById('goalDeadline').value
        };
        try {
            showLoading('saveGoalBtn', true);
            await api('/api/savings-goals', 'POST', body);
            showToast('Savings goal created!', 'success');
            goalModal.classList.add('hidden');
            e.target.reset();
            refreshData();
        } catch (err) {
            document.getElementById('goalModalError').textContent = err.message;
            document.getElementById('goalModalError').classList.remove('hidden');
        } finally {
            showLoading('saveGoalBtn', false);
        }
    };

    document.getElementById('expenseForm').onsubmit = async (e) => {
        e.preventDefault();
        const body = {
            description: document.getElementById('expDesc').value,
            amount: parseFloat(document.getElementById('expAmount').value),
            category: document.getElementById('expCategory').value
        };
        try {
            showLoading('saveExpenseBtn', true);
            if (editingTx && editingTx.type === 'expense') {
                await api(`/api/expenses/${editingTx.id}`, 'PUT', body);
                showToast('Expense updated!', 'success');
            } else {
                await api('/api/expenses', 'POST', body);
                showToast('Expense added!', 'success');
            }
            expenseModal.classList.add('hidden');
            e.target.reset();
            refreshData();
        } catch (err) {
            document.getElementById('expenseModalError').textContent = err.message;
            document.getElementById('expenseModalError').classList.remove('hidden');
        } finally {
            showLoading('saveExpenseBtn', false);
        }
    };

    document.getElementById('incomeForm').onsubmit = async (e) => {
        e.preventDefault();
        const body = {
            description: document.getElementById('incDesc').value,
            amount: parseFloat(document.getElementById('incAmount').value),
            category: document.getElementById('incCategory').value
        };
        try {
            showLoading('saveIncomeBtn', true);
            if (editingTx && editingTx.type === 'income') {
                await api(`/api/incomes/${editingTx.id}`, 'PUT', body);
                showToast('Income updated!', 'success');
            } else {
                await api('/api/incomes', 'POST', body);
                showToast('Income added!', 'success');
            }
            incomeModal.classList.add('hidden');
            e.target.reset();
            refreshData();
        } catch (err) {
            document.getElementById('incomeModalError').textContent = err.message;
            document.getElementById('incomeModalError').classList.remove('hidden');
        } finally {
            showLoading('saveIncomeBtn', false);
        }
    };

    // Analytics Range
    const rangeSelect = document.getElementById('analyticsRange');
    if (rangeSelect) {
        rangeSelect.onchange = (e) => {
            renderAnalytics(e.target.value);
        };
    }

    // Init Page Logic
    initApp();
});
