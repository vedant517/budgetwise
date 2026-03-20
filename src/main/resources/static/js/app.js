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

    const response = await fetch(`${API_URL}${endpoint}`, options);
    
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
        const data = await api('/auth/login', 'POST', { email, password });
        State.token = data.token;
        State.user = data; // email, role, token
        localStorage.setItem('bw_token', data.token);
        
        await initApp();
        navigatePage('dashboard');
        showToast('Welcome back!', 'success');
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
        const data = await api('/auth/register', 'POST', formData);
        State.token = data.token;
        State.user = data;
        localStorage.setItem('bw_token', data.token);
        
        await initApp();
        navigatePage('dashboard');
        showToast('Account created successfully!', 'success');
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
        const [profile, expenses, incomes, budgets, savingsGoals] = await Promise.all([
            api('/api/profile'),
            api('/api/expenses'),
            api('/api/incomes'),
            api('/api/budgets'),
            api('/api/savings-goals')
        ]);
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
    
    if (pageId === 'analytics') renderAnalytics();
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
                            <button class="btn-logout" onclick="openEditModal(${tx.id}, '${tx.type}')" title="Edit" style="color: var(--accent-light);">✏️</button>
                            <button class="btn-logout" onclick="deleteTransaction(${tx.id}, '${tx.type}')" title="Delete">🗑️</button>
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
                <button class="btn-logout" onclick="deleteGoal(${goal.id})" title="Delete Goal">🗑️</button>
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
                <button class="btn btn-primary btn-full" style="padding: 8px; font-size: 13px;" onclick="addSavings(${goal.id})">+ Add Savings</button>
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

const renderAnalytics = () => {
    // Trends Chart
    const trendsCtx = document.getElementById('trendsChart');
    if (!trendsCtx) return;

    const last7 = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
    }).reverse();

    const expData = last7.map(day => State.expenses.filter(e => e.createdAt.startsWith(day)).reduce((s, e) => s + e.amount, 0));
    const incData = last7.map(day => State.incomes.filter(i => i.createdAt.startsWith(day)).reduce((s, i) => s + i.amount, 0));

    if (State.charts.trends) State.charts.trends.destroy();
    State.charts.trends = new Chart(trendsCtx, {
        type: 'line',
        data: {
            labels: last7.map(d => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })),
            datasets: [
                { label: 'Expenses', data: expData, borderColor: '#ff5757', tension: 0.4, fill: true, backgroundColor: 'rgba(255, 87, 87, 0.1)' },
                { label: 'Income', data: incData, borderColor: '#00d9a0', tension: 0.4, fill: true, backgroundColor: 'rgba(0, 217, 160, 0.1)' }
            ]
        },
        options: { plugins: { legend: { display: true, labels: { color: '#8b92b5' } } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4a5175' } }, x: { grid: { display: false }, ticks: { color: '#4a5175' } } } }
    });

    // Category Bar Chart
    const barCtx = document.getElementById('categoryBarChart');
    if (barCtx) {
        const cats = {};
        State.expenses.forEach(e => cats[e.category] = (cats[e.category] || 0) + e.amount);
        
        if (State.charts.categoryBar) State.charts.categoryBar.destroy();
        State.charts.categoryBar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(cats),
                datasets: [{
                    label: 'Amount Spent',
                    data: Object.values(cats),
                    backgroundColor: '#4ecdc4',
                    borderRadius: 6
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#4a5175' } },
                    x: { grid: { display: false }, ticks: { color: '#4a5175' } }
                }
            }
        });
    }

    // Budget vs Actual
    const statList = document.getElementById('analyticsStatList');
    if (statList) {
        const totalExpenses = State.expenses.reduce((sum, e) => sum + e.amount, 0);
        const target = State.user.targetExpenses;
        const remaining = Math.max(0, target - totalExpenses);
        const pct = ((totalExpenses / target) * 100).toFixed(1);

        statList.innerHTML = `
            <div class="stat-item">
                <div class="stat-info">
                    <div class="stat-label">Monthly Budget</div>
                    <div class="stat-value">${formatCurrency(target)}</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-info">
                    <div class="stat-label">Current Spending</div>
                    <div class="stat-value" style="color: ${totalExpenses > target ? 'var(--expense-color)' : 'var(--accent-light)'}">
                        ${formatCurrency(totalExpenses)}
                    </div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-info">
                    <div class="stat-label">Budget Used</div>
                    <div class="stat-value">${pct}%</div>
                </div>
            </div>
            <div class="stat-item">
                <div class="stat-info">
                    <div class="stat-label">Remaining</div>
                    <div class="stat-value" style="color: var(--income-color)">${formatCurrency(remaining)}</div>
                </div>
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
    document.getElementById('goToRegister').onclick = (e) => {
        e.preventDefault();
        document.getElementById('loginPage').classList.remove('active');
        document.getElementById('registerPage').classList.add('active');
    };
    document.getElementById('goToLogin').onclick = (e) => {
        e.preventDefault();
        document.getElementById('registerPage').classList.remove('active');
        document.getElementById('loginPage').classList.add('active');
    };

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

    // Init Page Logic
    initApp();
});
