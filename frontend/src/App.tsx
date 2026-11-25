import Auth from "./components/Auth";
import ReportsAnalytics from "./components/ReportsAnalytics";
import LearnFinance from "./components/LearnFinance";
import AIAssistant from "./components/AIAssistant";
import { useEffect, useState, type FormEvent } from "react";
import { checkBackend } from "./services/api";
import API from "./services/api";

import {
  LayoutDashboard,
  Wallet,
  Target,
  TrendingUp,
  BookOpen,
  Users,
  Bot,
  Bell,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Menu,
  X,
  PiggyBank,
  GraduationCap,
  Trash2,
  RefreshCw,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// TYPES
type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  expense_date: string;
};

type SavingsGoal = {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
};

type Investment = {
  id: number;
  asset_name: string;
  asset_type: string;
  amount_invested: number;
  current_value: number;
  created_at: string;
};

type SavingsGroup = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
};

// NAVIGATION
const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Expenses", icon: Wallet },
  { name: "Savings Goals", icon: Target },
  { name: "Investments", icon: TrendingUp },
  { name: "Group Savings", icon: Users },
  { name: "AI Assistant", icon: Bot },
  { name: "AI Spending Analysis", icon: TrendingUp },
  { name: "Reports & Analytics", icon: TrendingUp },
  { name: "Learn Finance", icon: BookOpen },
];

// SAMPLE CHART DATA
const chartData = [
  { day: "Mon", amount: 350 },
  { day: "Tue", amount: 520 },
  { day: "Wed", amount: 400 },
  { day: "Thu", amount: 700 },
  { day: "Fri", amount: 480 },
  { day: "Sat", amount: 850 },
  { day: "Sun", amount: 600 },
];

// SAMPLE TRANSACTIONS
const transactions = [
  { name: "Food & Dining", detail: "Cafe Coffee Day", amount: -250, icon: "🍔" },
  { name: "Transportation", detail: "Uber", amount: -180, icon: "🚕" },
  { name: "Entertainment", detail: "Netflix", amount: -199, icon: "🎬" },
  { name: "Allowance", detail: "Monthly allowance", amount: 5000, icon: "💰" },
];

function App() {
  // NAVIGATION STATE
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState("Checking...");

  // AUTH STATE
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem("microvest_token")
  );

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem("microvest_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authChecking, setAuthChecking] = useState(true);

  const handleAuthenticated = (token: string, user: AuthUser) => {
    localStorage.setItem("microvest_token", token);
    localStorage.setItem("microvest_user", JSON.stringify(user));
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setAuthToken(token);
    setAuthUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("microvest_token");
    localStorage.removeItem("microvest_user");
    delete API.defaults.headers.common["Authorization"];
    setAuthToken(null);
    setAuthUser(null);
    setActivePage("Dashboard");
  };

  // EXPENSE STATES
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [expenseError, setExpenseError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  // SAVINGS GOAL STATES
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [savingsError, setSavingsError] = useState("");
  const [savingsSuccess, setSavingsSuccess] = useState("");

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  const [contributionAmounts, setContributionAmounts] = useState<
    Record<string, string>
  >({});

  const [submittingGoal, setSubmittingGoal] = useState(false);
  const [submittingContribution, setSubmittingContribution] = useState<
    Record<string, boolean>
  >({});

  // INVESTMENT STATES
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loadingInvestments, setLoadingInvestments] = useState(false);
  const [investmentError, setInvestmentError] = useState("");
  const [investmentSuccess, setInvestmentSuccess] = useState("");

  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("Mutual Fund");
  const [amountInvested, setAmountInvested] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [submittingInvestment, setSubmittingInvestment] = useState(false);

  // GROUP SAVINGS STATES
  const [savingsGroups, setSavingsGroups] = useState<SavingsGroup[]>(() => {
    try {
      const saved = localStorage.getItem("microvest_groups");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [groupName, setGroupName] = useState("");
  const [groupTarget, setGroupTarget] = useState("");
  const [groupContributions, setGroupContributions] = useState<
    Record<string, string>
  >({});

  const [groupError, setGroupError] = useState("");
  const [groupSuccess, setGroupSuccess] = useState("");

  // CURRENCY FORMAT
  const money = (value: number) =>
    "₹" +
    Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  // RESTORE SESSION (runs once on mount)
  useEffect(() => {
    const restoreSession = async () => {
      if (!authToken) {
        setAuthChecking(false);
        return;
      }

      API.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

      try {
        const response = await API.get("/auth/me");
        setAuthUser(response.data);
      } catch (error: any) {
        // Only log out if the token is actually rejected,
        // not on network errors.
        if (error?.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setAuthChecking(false);
      }
    };

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CHECK BACKEND CONNECTION
  useEffect(() => {
    checkBackend()
      .then(() => setBackendStatus("Connected"))
      .catch(() => setBackendStatus("Disconnected"));
  }, []);

  // SAVE GROUPS IN BROWSER STORAGE
  useEffect(() => {
    localStorage.setItem("microvest_groups", JSON.stringify(savingsGroups));
  }, [savingsGroups]);

  // CREATE SAVINGS GROUP
  const handleCreateGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setGroupError("");
    setGroupSuccess("");

    const target = Number(groupTarget);

    if (
      !groupName.trim() ||
      !groupTarget ||
      !Number.isFinite(target) ||
      target <= 0
    ) {
      setGroupError("Please enter a valid group name and target.");
      return;
    }

    const newGroup: SavingsGroup = {
      id: crypto.randomUUID(),
      name: groupName.trim(),
      target_amount: target,
      current_amount: 0,
      created_at: new Date().toLocaleDateString("en-IN"),
    };

    setSavingsGroups((previous) => [...previous, newGroup]);
    setGroupName("");
    setGroupTarget("");
    setGroupSuccess("Savings group created successfully!");
  };

  // ADD GROUP CONTRIBUTION
  const handleGroupContribution = (groupId: string) => {
    const contribution = Number(groupContributions[groupId]);

    setGroupError("");
    setGroupSuccess("");

    if (!Number.isFinite(contribution) || contribution <= 0) {
      setGroupError("Enter a valid contribution amount.");
      return;
    }

    const selectedGroup = savingsGroups.find((group) => group.id === groupId);

    if (!selectedGroup) {
      setGroupError("Savings group not found.");
      return;
    }

    if (selectedGroup.current_amount >= selectedGroup.target_amount) {
      setGroupError("This group has already achieved its target.");
      return;
    }

    setSavingsGroups((previous) =>
      previous.map((group) =>
        group.id === groupId
          ? {
              ...group,
              current_amount: Math.min(
                group.current_amount + contribution,
                group.target_amount
              ),
            }
          : group
      )
    );

    setGroupContributions((previous) => ({
      ...previous,
      [groupId]: "",
    }));

    setGroupSuccess("Contribution added successfully!");
  };

  // DELETE GROUP
  const handleDeleteGroup = (groupId: string) => {
    if (!window.confirm("Are you sure you want to delete this group?")) {
      return;
    }

    setSavingsGroups((previous) =>
      previous.filter((group) => group.id !== groupId)
    );

    setGroupSuccess("Savings group deleted successfully!");
    setGroupError("");
  };

  // FETCH EXPENSES
  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    setExpenseError("");

    try {
      const response = await API.get<Expense[]>("/expenses/");
      setExpenses(response.data);
    } catch {
      setExpenseError(
        "Unable to load expenses. Check your backend connection."
      );
    } finally {
      setLoadingExpenses(false);
    }
  };

  // FETCH SAVINGS GOALS
  const fetchSavingsGoals = async () => {
    setLoadingGoals(true);
    setSavingsError("");

    try {
      const response = await API.get<SavingsGoal[]>("/savings/");
      setSavingsGoals(response.data);
    } catch {
      setSavingsError(
        "Unable to load savings goals. Check your backend connection."
      );
    } finally {
      setLoadingGoals(false);
    }
  };

  // FETCH INVESTMENTS
  const fetchInvestments = async () => {
    setLoadingInvestments(true);
    setInvestmentError("");

    try {
      const response = await API.get<Investment[]>("/investments/");
      setInvestments(response.data);
    } catch {
      setInvestmentError(
        "Unable to load investments. Check your backend connection."
      );
    } finally {
      setLoadingInvestments(false);
    }
  };

  // LOAD DATA WHEN PAGE OPENS (only when logged in)
  useEffect(() => {
    if (!authUser) return;

    if (["Dashboard", "Expenses", "Reports & Analytics"].includes(activePage)) {
      fetchExpenses();
    }

    if (["Dashboard", "Savings Goals"].includes(activePage)) {
      fetchSavingsGoals();
    }

    if (["Investments", "Reports & Analytics"].includes(activePage)) {
      fetchInvestments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, authUser]);

  // ADD EXPENSE
  const handleAddExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setExpenseError("");
    setSuccessMessage("");

    if (
      !title.trim() ||
      !amount ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      !expenseDate
    ) {
      setExpenseError("Please enter valid expense details.");
      return;
    }

    try {
      await API.post("/expenses/", {
        title: title.trim(),
        category,
        amount: Number(amount),
        expense_date: expenseDate,
      });

      setTitle("");
      setCategory("Food");
      setAmount("");
      setExpenseDate(new Date().toLocaleDateString("en-CA"));

      setSuccessMessage("Expense added successfully!");
      await fetchExpenses();
    } catch {
      setExpenseError("Could not add expense. Please try again.");
    }
  };

  // DELETE EXPENSE
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    setExpenseError("");
    setSuccessMessage("");

    try {
      await API.delete(`/expenses/${id}`);
      setSuccessMessage("Expense deleted successfully!");
      await fetchExpenses();
    } catch {
      setExpenseError("Could not delete expense. Please try again.");
    }
  };

  // CREATE SAVINGS GOAL
  const handleCreateGoal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSavingsError("");
    setSavingsSuccess("");

    if (
      !goalTitle.trim() ||
      !goalTarget ||
      !Number.isFinite(Number(goalTarget)) ||
      Number(goalTarget) <= 0
    ) {
      setSavingsError("Please enter a valid goal name and target amount.");
      return;
    }

    setSubmittingGoal(true);

    try {
      await API.post("/savings/", {
        title: goalTitle.trim(),
        target_amount: Number(goalTarget),
        deadline: goalDeadline || null,
      });

      setGoalTitle("");
      setGoalTarget("");
      setGoalDeadline("");

      setSavingsSuccess("Savings goal created successfully!");
      await fetchSavingsGoals();
    } catch {
      setSavingsError("Could not create savings goal. Please try again.");
    } finally {
      setSubmittingGoal(false);
    }
  };

  // ADD MONEY TO SAVINGS GOAL
  const handleContribution = async (goalId: string) => {
    const contribution = Number(contributionAmounts[goalId]);

    setSavingsError("");
    setSavingsSuccess("");

    if (!Number.isFinite(contribution) || contribution <= 0) {
      setSavingsError("Please enter a valid contribution amount.");
      return;
    }

    setSubmittingContribution((previous) => ({
      ...previous,
      [goalId]: true,
    }));

    try {
      await API.post(`/savings/${goalId}/contribute`, {
        amount: contribution,
      });

      setContributionAmounts((previous) => ({
        ...previous,
        [goalId]: "",
      }));

      setSavingsSuccess("Money added to your savings goal successfully!");
      await fetchSavingsGoals();
    } catch {
      setSavingsError("Could not add money. Please try again.");
    } finally {
      setSubmittingContribution((previous) => ({
        ...previous,
        [goalId]: false,
      }));
    }
  };

  // DELETE SAVINGS GOAL
  const handleDeleteGoal = async (goalId: string) => {
    if (!window.confirm("Are you sure you want to delete this savings goal?")) {
      return;
    }

    setSavingsError("");
    setSavingsSuccess("");

    try {
      await API.delete(`/savings/${goalId}`);
      setSavingsSuccess("Savings goal deleted successfully!");
      await fetchSavingsGoals();
    } catch {
      setSavingsError("Could not delete savings goal. Please try again.");
    }
  };

  // ADD INVESTMENT
  const handleAddInvestment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setInvestmentError("");
    setInvestmentSuccess("");

    const invested = Number(amountInvested);
    const current = Number(currentValue);

    if (
      !assetName.trim() ||
      !amountInvested ||
      !currentValue ||
      !Number.isFinite(invested) ||
      !Number.isFinite(current) ||
      invested <= 0 ||
      current < 0
    ) {
      setInvestmentError("Please enter valid investment details.");
      return;
    }

    setSubmittingInvestment(true);

    try {
      await API.post("/investments/", {
        asset_name: assetName.trim(),
        asset_type: assetType,
        amount_invested: invested,
        current_value: current,
      });

      setAssetName("");
      setAssetType("Mutual Fund");
      setAmountInvested("");
      setCurrentValue("");

      setInvestmentSuccess("Investment added successfully!");
      await fetchInvestments();
    } catch {
      setInvestmentError("Could not add investment. Please try again.");
    } finally {
      setSubmittingInvestment(false);
    }
  };

  // DELETE INVESTMENT
  const handleDeleteInvestment = async (investmentId: number) => {
    if (!window.confirm("Are you sure you want to delete this investment?")) {
      return;
    }

    setInvestmentError("");
    setInvestmentSuccess("");

    try {
      await API.delete(`/investments/${investmentId}`);
      setInvestmentSuccess("Investment deleted successfully!");
      await fetchInvestments();
    } catch {
      setInvestmentError("Could not delete investment. Please try again.");
    }
  };

  // EXPENSE CALCULATIONS
  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyExpenseRecords = expenses.filter((expense) => {
    const date = new Date(`${expense.expense_date}T00:00:00`);

    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  const monthlyExpenses = monthlyExpenseRecords.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  // MONTHLY BUDGET
  const monthlyBudget = 15000;
  const remainingBudget = monthlyBudget - monthlyExpenses;

  const budgetPercentage = Math.min(
    (monthlyExpenses / monthlyBudget) * 100,
    100
  );

  // SAVINGS CALCULATIONS
  const totalSaved = savingsGoals.reduce(
    (total, goal) => total + Number(goal.current_amount || 0),
    0
  );

  const totalSavingsTarget = savingsGoals.reduce(
    (total, goal) => total + Number(goal.target_amount || 0),
    0
  );

  // INVESTMENT CALCULATIONS
  const totalInvested = investments.reduce(
    (total, investment) => total + Number(investment.amount_invested || 0),
    0
  );

  const totalInvestmentValue = investments.reduce(
    (total, investment) => total + Number(investment.current_value || 0),
    0
  );

  const investmentProfitLoss = totalInvestmentValue - totalInvested;

  const investmentReturnPercentage =
    totalInvested > 0 ? (investmentProfitLoss / totalInvested) * 100 : 0;

  // GROUP SAVINGS CALCULATIONS
  const totalGroupSavings = savingsGroups.reduce(
    (total, group) => total + group.current_amount,
    0
  );

  const totalGroupTarget = savingsGroups.reduce(
    (total, group) => total + group.target_amount,
    0
  );

  // AI SPENDING ANALYSIS
  // Only use expenses from the current month.
  const categorySpending = monthlyExpenseRecords.reduce((acc, expense) => {
    const cat = expense.category || "Other";

    acc[cat] = (acc[cat] || 0) + Number(expense.amount);

    return acc;
  }, {} as Record<string, number>);

  const totalMonthlySpending = monthlyExpenses;

  const highestSpendingCategory = Object.entries(categorySpending).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const suggestedSavings = totalMonthlySpending * 0.1;

  const spendingAdvice =
    totalMonthlySpending === 0
      ? "Start recording expenses to receive spending insights."
      : highestSpendingCategory
        ? `Your highest spending category is ${
            highestSpendingCategory[0]
          }, accounting for ${(
            (highestSpendingCategory[1] / totalMonthlySpending) *
            100
          ).toFixed(1)}% of your monthly spending. Review this category to identify possible savings.`
        : "Keep tracking your expenses to receive insights.";

  // AUTH GATE (all hooks have run above, so this is safe)
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading MicroVest AI...
      </div>
    );
  }

  if (!authToken || !authUser) {
    return <Auth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800">
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-navy text-white flex flex-col transition-transform ${
          menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald flex items-center justify-center">
              <PiggyBank size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold">MicroVest</h1>
              <p className="text-xs text-mint">AI FINANCE</p>
            </div>
          </div>

          <button className="lg:hidden" onClick={() => setMenuOpen(false)}>
            <X />
          </button>
        </div>

        <div className="px-4 mt-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest px-3 mb-3">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActivePage(item.name);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition ${
                    activePage === item.name
                      ? "bg-emerald text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-4">
            <GraduationCap size={26} />
            <h3 className="font-semibold mt-3">Financial Freedom</h3>
            <p className="text-xs text-emerald-100 mt-1">
              Learn today. Build your future.
            </p>

            <button
              onClick={() => setActivePage("Learn Finance")}
              className="mt-3 text-xs bg-white text-emerald-800 px-3 py-2 rounded-lg font-semibold"
            >
              Start Learning
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-5">
            MicroVest AI · Demo
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0">
        <header className="h-20 bg-white border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMenuOpen(true)}>
              <Menu />
            </button>

            <div>
              <h2 className="font-bold text-lg">{activePage}</h2>
              <p className="text-xs text-gray-400 hidden sm:block">
                Welcome back, {authUser.name}! Here's your financial overview.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold ${
                backendStatus === "Connected"
                  ? "bg-emerald-50 text-emerald-700"
                  : backendStatus === "Disconnected"
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "Connected"
                    ? "bg-emerald-500"
                    : backendStatus === "Disconnected"
                      ? "bg-red-500"
                      : "bg-gray-400"
                }`}
              />
              Backend: {backendStatus}
            </div>

            <button className="text-gray-400">
              <Search size={20} />
            </button>

            <button className="relative text-gray-400">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            <div
              title={authUser.email}
              className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold"
            >
              {authUser.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-gray-500 hover:text-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* DASHBOARD */}
          {activePage === "Dashboard" && (
            <>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Financial Dashboard
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Take control of your money, one step at a time.
                  </p>
                </div>

                <button
                  onClick={() => setActivePage("Expenses")}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl text-sm font-semibold"
                >
                  <Plus size={18} /> Add Transaction
                </button>
              </div>

              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs">
                Demo mode: Balances, income and charts are sample data, not real
                bank information. Monthly expenses and savings goals use your
                saved records.
              </div>

              {/* FINANCIAL SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                <div className="bg-navy text-white p-5 rounded-2xl">
                  <div className="flex justify-between">
                    <p className="text-gray-400 text-sm">Total Balance</p>
                    <Wallet className="text-emerald-400" />
                  </div>
                  <h2 className="text-3xl font-bold mt-4">₹24,580</h2>
                  <p className="text-xs text-emerald-400 mt-2">
                    Demo wallet balance
                  </p>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <div className="flex justify-between">
                    <p className="text-gray-500 text-sm">Monthly Income</p>
                    <ArrowUpRight className="text-emerald-500" />
                  </div>
                  <h2 className="text-3xl font-bold mt-4">₹18,000</h2>
                  <p className="text-xs text-emerald-600 mt-2">Demo income</p>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <div className="flex justify-between">
                    <p className="text-gray-500 text-sm">Monthly Expenses</p>
                    <ArrowDownRight className="text-red-500" />
                  </div>
                  <h2 className="text-3xl font-bold mt-4">
                    {loadingExpenses ? "Loading..." : money(monthlyExpenses)}
                  </h2>
                  <p className="text-xs text-red-500 mt-2">
                    Actual spending this month
                  </p>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <div className="flex justify-between">
                    <p className="text-gray-500 text-sm">Total Saved</p>
                    <PiggyBank className="text-blue-500" />
                  </div>
                  <h2 className="text-3xl font-bold mt-4">
                    {loadingGoals ? "Loading..." : money(totalSaved)}
                  </h2>
                  <p className="text-xs text-blue-600 mt-2">
                    Across your savings goals
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-7">
                {/* SPENDING CHART */}
                <div className="xl:col-span-2 bg-white border rounded-2xl p-5">
                  <h3 className="font-bold text-gray-900">Spending Overview</h3>
                  <p className="text-xs text-gray-400 mt-1 mb-5">
                    Sample weekly spending data
                  </p>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="spendingGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#10B981"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10B981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip formatter={(value) => [`₹${value}`, "Spent"]} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#10B981"
                          strokeWidth={3}
                          fill="url(#spendingGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* MONTHLY BUDGET */}
                <div className="bg-white border rounded-2xl p-5">
                  <h3 className="font-bold">Monthly Budget</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Your spending limit
                  </p>

                  <div className="my-7">
                    <div className="flex justify-between text-sm mb-2">
                      <span>{money(monthlyExpenses)} spent</span>
                      <span>{money(monthlyBudget)}</span>
                    </div>

                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          monthlyExpenses > monthlyBudget
                            ? "bg-red-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${budgetPercentage}%` }}
                      />
                    </div>

                    <p
                      className={`text-sm mt-3 font-semibold ${
                        remainingBudget < 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {remainingBudget >= 0
                        ? `${money(remainingBudget)} remaining`
                        : `${money(Math.abs(remainingBudget))} over budget`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {/* RECENT TRANSACTIONS */}
                <div className="bg-white border rounded-2xl p-5">
                  <div className="flex justify-between mb-5">
                    <h3 className="font-bold">Recent Transactions</h3>
                    <button
                      onClick={() => setActivePage("Expenses")}
                      className="text-xs text-emerald-600 font-semibold"
                    >
                      View all
                    </button>
                  </div>

                  <div className="space-y-5">
                    {transactions.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-xl">
                            {item.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.name}</p>
                            <p className="text-xs text-gray-400">
                              {item.detail}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`font-semibold text-sm ${
                            item.amount > 0
                              ? "text-emerald-600"
                              : "text-gray-800"
                          }`}
                        >
                          {item.amount > 0 ? "+" : "-"}
                          {money(Math.abs(item.amount))}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 mt-5">
                    These transactions are sample data.
                  </p>
                </div>

                {/* REAL SAVINGS GOALS */}
                <div className="bg-white border rounded-2xl p-5">
                  <div className="flex justify-between mb-5">
                    <h3 className="font-bold">Savings Goals</h3>
                    <button
                      onClick={() => setActivePage("Savings Goals")}
                      className="text-xs text-emerald-600 font-semibold"
                    >
                      View all
                    </button>
                  </div>

                  {loadingGoals ? (
                    <p className="text-gray-400 text-sm">
                      Loading savings goals...
                    </p>
                  ) : savingsGoals.length === 0 ? (
                    <div className="text-center py-6">
                      <Target size={35} className="mx-auto text-gray-300" />
                      <p className="font-semibold mt-3">No savings goals yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Create your first goal and start saving.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {savingsGoals.slice(0, 3).map((goal) => {
                        const percentage =
                          goal.target_amount > 0
                            ? Math.min(
                                (goal.current_amount / goal.target_amount) * 100,
                                100
                              )
                            : 0;

                        return (
                          <div key={goal.id}>
                            <div className="flex justify-between text-sm mb-2 gap-2">
                              <span className="font-semibold">{goal.title}</span>
                              <span className="text-gray-500">
                                {Math.round(percentage)}%
                              </span>
                            </div>

                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>

                            <p className="text-xs text-gray-400 mt-2">
                              {money(goal.current_amount)} /{" "}
                              {money(goal.target_amount)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => setActivePage("Savings Goals")}
                    className="w-full mt-6 border border-emerald-200 text-emerald-700 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-50"
                  >
                    + Create a savings goal
                  </button>
                </div>
              </div>
            </>
          )}

          {/* EXPENSES PAGE */}
          {activePage === "Expenses" && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Expense Tracker
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Record and manage your daily expenses.
                  </p>
                </div>

                <button
                  onClick={fetchExpenses}
                  disabled={loadingExpenses}
                  className="flex items-center gap-2 border bg-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  <RefreshCw
                    size={16}
                    className={loadingExpenses ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-xs mb-6">
                Your expenses are saved permanently in a local SQLite database.
              </div>

              {expenseError && (
                <p className="mb-5 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  {expenseError}
                </p>
              )}

              <div className="bg-navy text-white rounded-2xl p-6 mb-7">
                <p className="text-gray-300 text-sm">Total Recorded Expenses</p>
                <h2 className="text-3xl font-bold mt-3">
                  {money(totalExpenses)}
                </h2>
                <p className="text-emerald-300 text-xs mt-2">
                  {expenses.length} expense{expenses.length !== 1 ? "s" : ""}{" "}
                  recorded
                </p>
              </div>

              <div className="bg-white border rounded-2xl p-5 md:p-7 mb-7">
                <h2 className="text-lg font-bold mb-5">Add New Expense</h2>

                <form
                  onSubmit={handleAddExpense}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Expense Name
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Lunch"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="w-full border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Education">Education</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Health">Health</option>
                      <option value="Bills">Bills</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="Enter amount"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Expense Date
                    </label>
                    <input
                      type="date"
                      value={expenseDate}
                      onChange={(event) => setExpenseDate(event.target.value)}
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                    <button
                      type="submit"
                      disabled={loadingExpenses}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        backgroundColor: "#059669",
                        color: "#ffffff",
                        padding: "14px 24px",
                        borderRadius: "12px",
                        fontWeight: "600",
                        border: "none",
                        width: "100%",
                        cursor: loadingExpenses ? "not-allowed" : "pointer",
                        fontSize: "16px",
                        opacity: loadingExpenses ? 0.6 : 1,
                      }}
                    >
                      <Plus size={18} />
                      Add Expense
                    </button>
                  </div>
                </form>

                {successMessage && (
                  <p className="mt-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                    {successMessage}
                  </p>
                )}

                {expenseError && (
                  <p className="mt-4 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                    {expenseError}
                  </p>
                )}
              </div>

              <div className="bg-white border rounded-2xl p-5 md:p-7">
                <h2 className="text-lg font-bold mb-5">Your Expenses</h2>

                {loadingExpenses ? (
                  <p className="text-gray-500 text-center py-8">
                    Loading expenses...
                  </p>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-10">
                    <Wallet size={40} className="mx-auto text-gray-300" />
                    <p className="font-semibold mt-4">
                      No expenses recorded yet
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add your first expense using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex flex-wrap items-center justify-between gap-3 border rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <Wallet size={20} />
                          </div>

                          <div>
                            <p className="font-semibold">{expense.title}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {expense.category} · {expense.expense_date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-bold text-red-600">
                            -{money(expense.amount)}
                          </span>

                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            title="Delete expense"
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SAVINGS GOALS PAGE */}
          {activePage === "Savings Goals" && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Savings Goals
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Set targets, save regularly and track your progress.
                  </p>
                </div>

                <button
                  onClick={fetchSavingsGoals}
                  disabled={loadingGoals}
                  className="flex items-center gap-2 border bg-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  <RefreshCw
                    size={16}
                    className={loadingGoals ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-xs mb-6">
                Your savings goals and contributions are saved permanently in
                your local SQLite database. This is a savings tracker
                simulation, not a real money transfer.
              </div>

              {savingsError && (
                <p className="mb-5 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  {savingsError}
                </p>
              )}

              {savingsSuccess && (
                <p className="mb-5 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                  {savingsSuccess}
                </p>
              )}

              {/* SAVINGS SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <div className="bg-navy text-white p-5 rounded-2xl">
                  <p className="text-gray-300 text-sm">Total Saved</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {money(totalSaved)}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Total Target</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {money(totalSavingsTarget)}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Active Goals</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {savingsGoals.length}
                  </h2>
                </div>
              </div>

              {/* CREATE GOAL FORM */}
              <div className="bg-white border rounded-2xl p-5 md:p-7 mb-7">
                <h2 className="text-lg font-bold mb-5">
                  <Target className="inline mr-2 text-emerald-600" size={21} />
                  Create a New Goal
                </h2>

                <form
                  onSubmit={handleCreateGoal}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Goal Name
                    </label>
                    <input
                      type="text"
                      value={goalTitle}
                      onChange={(event) => setGoalTitle(event.target.value)}
                      placeholder="e.g. New Laptop"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Target Amount (₹)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={goalTarget}
                      onChange={(event) => setGoalTarget(event.target.value)}
                      placeholder="e.g. 50000"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Target Deadline (Optional)
                    </label>
                    <input
                      type="date"
                      min={new Date().toLocaleDateString("en-CA")}
                      value={goalDeadline}
                      onChange={(event) => setGoalDeadline(event.target.value)}
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1", marginTop: "12px" }}>
                    <button
                      type="submit"
                      disabled={submittingGoal}
                      style={{
                        display: "flex",
                        width: "100%",
                        minHeight: "50px",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        padding: "14px 24px",
                        backgroundColor: submittingGoal ? "#6ee7b7" : "#059669",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "12px",
                        fontWeight: "600",
                        fontSize: "16px",
                        cursor: submittingGoal ? "not-allowed" : "pointer",
                      }}
                    >
                      <Plus size={18} />
                      {submittingGoal ? "Creating..." : "Create Goal"}
                    </button>
                  </div>
                </form>
              </div>

              {/* GOALS LIST */}
              <div className="bg-white border rounded-2xl p-5 md:p-7">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold">Your Savings Goals</h2>
                  <span className="text-xs text-gray-400">
                    {savingsGoals.length} goal
                    {savingsGoals.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingGoals ? (
                  <p className="text-gray-500 text-center py-8">
                    Loading savings goals...
                  </p>
                ) : savingsGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <PiggyBank size={48} className="mx-auto text-gray-300" />
                    <h3 className="font-bold text-lg mt-4">
                      No savings goals yet
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      Create your first goal using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {savingsGoals.map((goal) => {
                      const currentAmount = Number(goal.current_amount || 0);
                      const targetAmount = Number(goal.target_amount || 0);

                      const percentage =
                        targetAmount > 0
                          ? Math.min((currentAmount / targetAmount) * 100, 100)
                          : 0;

                      const completed = currentAmount >= targetAmount;

                      return (
                        <div
                          key={goal.id}
                          className="border rounded-2xl p-5 hover:shadow-sm transition"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <Target size={23} />
                              </div>

                              <div>
                                <h3 className="font-bold text-gray-900">
                                  {goal.title}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                  {goal.deadline
                                    ? `Deadline: ${goal.deadline}`
                                    : "No deadline set"}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(goal.id)}
                              title="Delete goal"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "8px",
                                color: "#ef4444",
                                background: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="flex justify-between items-end mt-6 mb-2">
                            <div>
                              <p className="text-xs text-gray-400">
                                Amount saved
                              </p>
                              <p className="text-xl font-bold text-gray-900 mt-1">
                                {money(currentAmount)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-400">
                                Target amount
                              </p>
                              <p className="font-semibold text-gray-700 mt-1">
                                {money(targetAmount)}
                              </p>
                            </div>
                          </div>

                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                completed ? "bg-blue-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between mt-2 text-xs">
                            <span className="font-semibold text-emerald-700">
                              {percentage.toFixed(1)}% completed
                            </span>
                            <span className="text-gray-400">
                              {completed
                                ? "Goal achieved!"
                                : `${money(
                                    Math.max(targetAmount - currentAmount, 0)
                                  )} to go`}
                            </span>
                          </div>

                          {/* CONTRIBUTION SECTION */}
                          <div className="w-full mt-5 pt-5 border-t relative">
                            <label className="block text-sm font-semibold mb-2 text-gray-900">
                              Add Savings (₹)
                            </label>

                            <div className="flex items-stretch gap-2">
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Enter amount"
                                value={contributionAmounts[goal.id] || ""}
                                onChange={(event) =>
                                  setContributionAmounts((previous) => ({
                                    ...previous,
                                    [goal.id]: event.target.value,
                                  }))
                                }
                                className="flex-1 min-w-0 border rounded-xl px-3 py-3 text-gray-900 bg-white text-sm"
                              />

                              <button
                                type="button"
                                disabled={!!submittingContribution[goal.id]}
                                onClick={() => handleContribution(goal.id)}
                                className="w-24 shrink-0 rounded-xl bg-emerald-600 text-white font-bold text-sm disabled:opacity-60"
                              >
                                {submittingContribution[goal.id]
                                  ? "Saving..."
                                  : "Add"}
                              </button>
                            </div>
                          </div>

                          {completed && (
                            <div className="mt-4 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl p-3 text-center">
                              Congratulations! You achieved this goal.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* INVESTMENTS PAGE */}
          {activePage === "Investments" && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Investment Tracker
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Track your investments and understand your portfolio
                    performance.
                  </p>
                </div>

                <button
                  onClick={fetchInvestments}
                  disabled={loadingInvestments}
                  className="flex items-center gap-2 border bg-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  <RefreshCw
                    size={16}
                    className={loadingInvestments ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs mb-6">
                Simulation only: enter investment values manually. This page
                does not connect to a broker or execute real trades. It is for
                tracking and financial education, not investment advice.
              </div>

              {investmentError && (
                <p className="mb-5 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  {investmentError}
                </p>
              )}

              {investmentSuccess && (
                <p className="mb-5 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                  {investmentSuccess}
                </p>
              )}

              {/* INVESTMENT SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
                <div className="bg-navy text-white p-5 rounded-2xl">
                  <p className="text-gray-300 text-sm">Total Invested</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {loadingInvestments ? "Loading..." : money(totalInvested)}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Current Value</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {loadingInvestments
                      ? "Loading..."
                      : money(totalInvestmentValue)}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Profit / Loss</p>
                  <h2
                    className={`text-2xl font-bold mt-3 ${
                      investmentProfitLoss >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {loadingInvestments
                      ? "Loading..."
                      : `${investmentProfitLoss >= 0 ? "+" : "-"}${money(
                          Math.abs(investmentProfitLoss)
                        )}`}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Total Return</p>
                  <h2
                    className={`text-2xl font-bold mt-3 ${
                      investmentReturnPercentage >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {loadingInvestments
                      ? "Loading..."
                      : `${
                          investmentReturnPercentage >= 0 ? "+" : ""
                        }${investmentReturnPercentage.toFixed(2)}%`}
                  </h2>
                </div>
              </div>

              {/* ADD INVESTMENT FORM */}
              <div className="bg-white border rounded-2xl p-5 md:p-7 mb-7">
                <h2 className="text-lg font-bold mb-5">
                  <TrendingUp
                    className="inline mr-2 text-emerald-600"
                    size={21}
                  />
                  Add Investment
                </h2>

                <form
                  onSubmit={handleAddInvestment}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Asset Name
                    </label>
                    <input
                      type="text"
                      value={assetName}
                      onChange={(event) => setAssetName(event.target.value)}
                      placeholder="e.g. Nifty 50"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Investment Type
                    </label>
                    <select
                      value={assetType}
                      onChange={(event) => setAssetType(event.target.value)}
                      className="w-full border rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Mutual Fund">Mutual Fund</option>
                      <option value="Stocks">Stocks</option>
                      <option value="Fixed Deposit">Fixed Deposit</option>
                      <option value="Gold">Gold</option>
                      <option value="ETF">ETF</option>
                      <option value="Bonds">Bonds</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Amount Invested (₹)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amountInvested}
                      onChange={(event) => setAmountInvested(event.target.value)}
                      placeholder="e.g. 1000"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Current Value (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentValue}
                      onChange={(event) => setCurrentValue(event.target.value)}
                      placeholder="e.g. 1050"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      width: "100%",
                      marginTop: "15px",
                    }}
                  >
                    <button
                      type="submit"
                      disabled={submittingInvestment}
                      style={{
                        display: "flex",
                        visibility: "visible",
                        opacity: 1,
                        position: "relative",
                        zIndex: 10,
                        width: "100%",
                        minHeight: "52px",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        backgroundColor: "#059669",
                        color: "#ffffff",
                        padding: "14px 24px",
                        borderRadius: "12px",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: 600,
                        cursor: submittingInvestment ? "not-allowed" : "pointer",
                      }}
                    >
                      <Plus size={18} />
                      {submittingInvestment ? "Adding..." : "Add Investment"}
                    </button>
                  </div>
                </form>
              </div>

              {/* INVESTMENT LIST */}
              <div className="bg-white border rounded-2xl p-5 md:p-7">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                  <h2 className="text-lg font-bold">Your Investments</h2>
                  <span className="text-xs text-gray-400">
                    {investments.length} investment
                    {investments.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {loadingInvestments ? (
                  <p className="text-gray-500 text-center py-8">
                    Loading investments...
                  </p>
                ) : investments.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp size={45} className="mx-auto text-gray-300" />
                    <h3 className="font-bold text-lg mt-4">
                      No investments recorded yet
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      Add your first investment using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {investments.map((investment) => {
                      const profitLoss =
                        investment.current_value - investment.amount_invested;

                      const returnPercentage =
                        investment.amount_invested > 0
                          ? (profitLoss / investment.amount_invested) * 100
                          : 0;

                      return (
                        <div
                          key={investment.id}
                          className="flex flex-wrap items-center justify-between gap-4 border rounded-xl p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                              <TrendingUp size={21} />
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900">
                                {investment.asset_name}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {investment.asset_type} · Added{" "}
                                {investment.created_at}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-5">
                            <div>
                              <p className="text-xs text-gray-400">Invested</p>
                              <p className="font-semibold">
                                {money(investment.amount_invested)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400">
                                Current value
                              </p>
                              <p className="font-semibold">
                                {money(investment.current_value)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-gray-400">Return</p>
                              <p
                                className={`font-semibold ${
                                  profitLoss >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {profitLoss >= 0 ? "+" : "-"}
                                {money(Math.abs(profitLoss))}
                                <span className="text-xs ml-1">
                                  ({returnPercentage.toFixed(2)}%)
                                </span>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteInvestment(investment.id)
                              }
                              title="Delete investment"
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GROUP SAVINGS PAGE */}
          {activePage === "Group Savings" && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Group Savings
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Save together and achieve financial goals as a group.
                  </p>
                </div>

                <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                  {savingsGroups.length} Active Groups
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs mb-6">
                Demo mode: Group savings are stored in this browser only.
                Contributions are simulated and do not transfer real money.
              </div>

              {groupError && (
                <p className="mb-5 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                  {groupError}
                </p>
              )}

              {groupSuccess && (
                <p className="mb-5 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                  {groupSuccess}
                </p>
              )}

              {/* GROUP SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
                <div className="bg-navy text-white p-5 rounded-2xl">
                  <p className="text-gray-300 text-sm">Total Groups</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {savingsGroups.length}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Total Group Savings</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {money(totalGroupSavings)}
                  </h2>
                </div>

                <div className="bg-white border p-5 rounded-2xl">
                  <p className="text-gray-500 text-sm">Combined Target</p>
                  <h2 className="text-2xl font-bold mt-3">
                    {money(totalGroupTarget)}
                  </h2>
                </div>
              </div>

              {/* CREATE GROUP FORM */}
              <div className="bg-white border rounded-2xl p-5 md:p-7 mb-7">
                <h2 className="text-lg font-bold mb-5">
                  <Users className="inline mr-2 text-emerald-600" size={21} />
                  Create a Savings Group
                </h2>

                <form
                  onSubmit={handleCreateGroup}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Group Name
                    </label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      placeholder="e.g. College Friends"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Group Savings Target (₹)
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={groupTarget}
                      onChange={(event) => setGroupTarget(event.target.value)}
                      placeholder="e.g. 50000"
                      required
                      className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        width: "100%",
                        minHeight: "50px",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "10px",
                        backgroundColor: "#059669",
                        color: "white",
                        padding: "14px 24px",
                        borderRadius: "12px",
                        border: "none",
                        fontWeight: 600,
                        fontSize: "16px",
                        cursor: "pointer",
                      }}
                    >
                      <Plus size={18} />
                      Create Group
                    </button>
                  </div>
                </form>
              </div>

              {/* GROUP LIST */}
              <div className="bg-white border rounded-2xl p-5 md:p-7">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold">Your Savings Groups</h2>
                  <span className="text-xs text-gray-400">
                    {savingsGroups.length} groups
                  </span>
                </div>

                {savingsGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users size={45} className="mx-auto text-gray-300" />
                    <h3 className="font-bold text-lg mt-4">
                      No savings groups yet
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      Create your first group to start tracking shared savings.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {savingsGroups.map((group) => {
                      const percentage =
                        group.target_amount > 0
                          ? Math.min(
                              (group.current_amount / group.target_amount) *
                                100,
                              100
                            )
                          : 0;

                      const completed =
                        group.current_amount >= group.target_amount;

                      return (
                        <div
                          key={group.id}
                          className="border rounded-2xl p-5"
                        >
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                <Users size={23} />
                              </div>

                              <div>
                                <h3 className="font-bold text-gray-900">
                                  {group.name}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">
                                  Created {group.created_at}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group.id)}
                              title="Delete group"
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>

                          <div className="flex justify-between items-end mt-6 mb-2">
                            <div>
                              <p className="text-xs text-gray-400">
                                Total saved
                              </p>
                              <p className="text-xl font-bold mt-1">
                                {money(group.current_amount)}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-xs text-gray-400">Target</p>
                              <p className="font-semibold mt-1">
                                {money(group.target_amount)}
                              </p>
                            </div>
                          </div>

                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                completed ? "bg-blue-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="flex justify-between mt-2 text-xs">
                            <span className="font-semibold text-emerald-700">
                              {percentage.toFixed(1)}% completed
                            </span>
                            <span className="text-gray-400">
                              {completed
                                ? "Target achieved!"
                                : `${money(
                                    Math.max(
                                      group.target_amount -
                                        group.current_amount,
                                      0
                                    )
                                  )} to go`}
                            </span>
                          </div>

                          {!completed && (
                            <div className="mt-5 pt-5 border-t">
                              <label className="block text-sm font-semibold mb-2">
                                Add Group Contribution (₹)
                              </label>

                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  placeholder="Enter amount"
                                  value={groupContributions[group.id] || ""}
                                  onChange={(event) =>
                                    setGroupContributions((previous) => ({
                                      ...previous,
                                      [group.id]: event.target.value,
                                    }))
                                  }
                                  className="flex-1 min-w-0 border rounded-xl px-3 py-3 text-sm"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGroupContribution(group.id)
                                  }
                                  className="px-5 rounded-xl bg-emerald-600 text-white font-bold text-sm"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}

                          {completed && (
                            <div className="mt-4 bg-blue-50 text-blue-700 text-sm font-semibold rounded-xl p-3 text-center">
                              Congratulations! Your group achieved its target.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI ASSISTANT */}
          {activePage === "AI Assistant" && <AIAssistant />}

          {/* LEARN FINANCE */}
          {activePage === "Learn Finance" && <LearnFinance />}

          {/* AI SPENDING ANALYSIS */}
          {activePage === "AI Spending Analysis" && (
            <div className="mt-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold">AI Spending Analysis</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Understand your spending patterns for the current month.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-5">
                  <p className="text-gray-500">Total Monthly Spending</p>
                  <h3 className="text-2xl font-bold">
                    {money(totalMonthlySpending)}
                  </h3>
                </div>

                <div className="bg-white border rounded-xl p-5">
                  <p className="text-gray-500">Highest Spending Category</p>
                  <h3 className="text-xl font-bold">
                    {highestSpendingCategory?.[0] || "No data"}
                  </h3>
                </div>

                <div className="bg-white border rounded-xl p-5">
                  <p className="text-gray-500">Potential Savings (10%)</p>
                  <h3 className="text-2xl font-bold text-green-600">
                    {money(suggestedSavings)}
                  </h3>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4">
                  Monthly Spending Breakdown
                </h3>

                {Object.entries(categorySpending).length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No expenses recorded this month. Add expenses to see your
                    spending breakdown.
                  </p>
                ) : (
                  Object.entries(categorySpending).map(([cat, catAmount]) => (
                    <div key={cat} className="mb-4">
                      <div className="flex justify-between">
                        <span>{cat}</span>
                        <span>{money(catAmount)}</span>
                      </div>

                      <div className="bg-gray-100 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              totalMonthlySpending > 0
                                ? (catAmount / totalMonthlySpending) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-2">
                  ✨ MicroVest Smart Insights
                </h3>

                <p>{spendingAdvice}</p>

                <p className="text-sm mt-2 text-gray-600">
                  The 10% savings figure is an illustrative target, not a
                  guarantee. Insights are currently rule-based, not generated by
                  a live AI model.
                </p>
              </div>
            </div>
          )}

          {/* REPORTS & ANALYTICS */}
          {activePage === "Reports & Analytics" && (
            <ReportsAnalytics expenses={expenses} investments={investments} />
          )}

          {/* OTHER PAGES */}
          {activePage !== "Dashboard" &&
            activePage !== "Expenses" &&
            activePage !== "Savings Goals" &&
            activePage !== "Investments" &&
            activePage !== "Group Savings" &&
            activePage !== "AI Assistant" &&
            activePage !== "AI Spending Analysis" &&
            activePage !== "Reports & Analytics" &&
            activePage !== "Learn Finance" && (
              <div className="bg-white border rounded-2xl p-10 text-center mt-8">
                <h2 className="text-2xl font-bold">{activePage}</h2>
                <p className="text-gray-500 mt-2">
                  This section is under development.
                </p>

                <button
                  onClick={() => setActivePage("Dashboard")}
                  className="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  Back to Dashboard
                </button>
              </div>
            )}

          <footer className="text-center text-xs text-gray-400 py-8 mt-5">
            © 2026 MicroVest AI. Financial education and simulations only. Not
            financial advice.
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
