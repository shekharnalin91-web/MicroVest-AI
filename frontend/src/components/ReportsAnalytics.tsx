
import jsPDF from "jspdf";

type Expense = {
  amount: number;
  category?: string;
  expense_date: string;
};

type Investment = {
  asset_name: string;
  amount_invested: number;
  current_value: number;
};

type Props = {
  expenses: Expense[];
  investments: Investment[];
};

export default function ReportsAnalytics({
  expenses,
  investments,
}: Props) {
  const money = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const now = new Date();

  const monthlyData = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - (5 - index),
      1
    );

    const total = expenses
      .filter((expense) => {
        const expenseDate = new Date(
          `${expense.expense_date}T00:00:00`
        );

        return (
          expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear()
        );
      })
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    return {
      month: date.toLocaleString("en-IN", { month: "short" }),
      total,
    };
  });

  const currentMonthExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.expense_date}T00:00:00`);

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  });

  const totalExpenses = currentMonthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const categoryData = currentMonthExpenses.reduce(
    (result, expense) => {
      const category = expense.category || "Other";

      result[category] =
        (result[category] || 0) + Number(expense.amount);

      return result;
    },
    {} as Record<string, number>
  );

  const totalInvested = investments.reduce(
    (sum, item) => sum + Number(item.amount_invested),
    0
  );

  const currentValue = investments.reduce(
    (sum, item) => sum + Number(item.current_value),
    0
  );

  const profitLoss = currentValue - totalInvested;

  const maxMonthlyExpense = Math.max(
    ...monthlyData.map((item) => item.total),
    1
  );

  const downloadCSV = () => {
    const rows = [
      ["Date", "Category", "Amount"],
      ...expenses.map((expense) => [
        expense.expense_date,
        expense.category || "Other",
        String(expense.amount),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) =>
          `"${String(value).replace(/"/g, '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "microvest-expense-report.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    let y = 20;

    const addLine = (text: string, size = 11) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(size);
      doc.text(text, 15, y);
      y += size > 15 ? 12 : 9;
    };

    doc.setFont("helvetica", "bold");
    addLine("MICROVEST AI", 20);

    doc.setFont("helvetica", "normal");
    addLine("Financial Reports & Analytics", 15);
    addLine(`Generated: ${now.toLocaleDateString("en-IN")}`);
    y += 5;

    doc.setFont("helvetica", "bold");
    addLine("MONTHLY FINANCIAL SUMMARY", 14);

    doc.setFont("helvetica", "normal");
    addLine(`This Month's Expenses: ${money(totalExpenses)}`);
    addLine(`Total Invested: ${money(totalInvested)}`);
    addLine(`Current Investment Value: ${money(currentValue)}`);
    addLine(`Investment Profit / Loss: ${money(profitLoss)}`);
    y += 5;

    doc.setFont("helvetica", "bold");
    addLine("MONTHLY EXPENSE TREND", 14);

    doc.setFont("helvetica", "normal");

    monthlyData.forEach((item) => {
      addLine(`${item.month}: ${money(item.total)}`);
    });

    y += 5;

    doc.setFont("helvetica", "bold");
    addLine("CATEGORY-WISE SPENDING", 14);

    doc.setFont("helvetica", "normal");

    const sortedCategories = Object.entries(categoryData)
      .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
      addLine("No expenses recorded this month.");
    } else {
      sortedCategories.forEach(([category, amount]) => {
        addLine(`${category}: ${money(amount)}`);
      });
    }

    y += 5;

    doc.setFont("helvetica", "bold");
    addLine("INVESTMENT DETAILS", 14);

    doc.setFont("helvetica", "normal");

    if (investments.length === 0) {
      addLine("No investments recorded.");
    } else {
      investments.forEach((item) => {
        addLine(item.asset_name);
        addLine(`Invested: ${money(item.amount_invested)}`);
        addLine(`Current Value: ${money(item.current_value)}`);
        y += 2;
      });
    }

    y += 5;
    doc.setFontSize(9);
    doc.text(
      "Educational simulation only. Investment values are manually entered and are not live market or brokerage data.",
      15,
      Math.min(y, 285),
      { maxWidth: 180 }
    );

    doc.save("microvest-financial-report.pdf");
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold">Reports & Analytics</h2>
          <p className="text-gray-500 text-sm mt-1">
            Understand your spending and investment performance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadCSV}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            Download Expense CSV
          </button>

          <button
            onClick={downloadPDF}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Download PDF Report
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            This Month's Expenses
          </p>
          <h3 className="text-2xl font-bold mt-2">
            {money(totalExpenses)}
          </h3>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-gray-500 text-sm">Total Invested</p>
          <h3 className="text-2xl font-bold mt-2">
            {money(totalInvested)}
          </h3>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-gray-500 text-sm">
            Investment Profit / Loss
          </p>
          <h3
            className={`text-2xl font-bold mt-2 ${
              profitLoss >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {profitLoss >= 0 ? "+" : ""}
            {money(profitLoss)}
          </h3>
        </div>
      </div>

      {/* MONTHLY EXPENSE CHART */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-bold text-lg mb-5">
          Monthly Expense Trend
        </h3>

        <div className="flex items-end justify-between gap-3 h-52">
          {monthlyData.map((item, index) => (
            <div
              key={`${item.month}-${index}`}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <span className="text-xs text-gray-500 mb-2">
                {money(item.total)}
              </span>

              <div
                className="w-full max-w-12 bg-purple-500 rounded-t-md"
                style={{
                  height: `${Math.max(
                    (item.total / maxMonthlyExpense) * 100,
                    item.total > 0 ? 4 : 0
                  )}%`,
                }}
              />

              <span className="text-xs text-gray-500 mt-2">
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORY BREAKDOWN */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4">
          Category-wise Spending
        </h3>

        {Object.entries(categoryData).length === 0 ? (
          <p className="text-gray-500 text-sm">
            No expenses recorded this month.
          </p>
        ) : (
          Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => (
              <div key={category} className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{category}</span>
                  <span>{money(amount)}</span>
                </div>

                <div className="w-full h-2 bg-gray-100 rounded-full">
                  <div
                    className="h-2 bg-purple-500 rounded-full"
                    style={{
                      width: `${
                        totalExpenses > 0
                          ? (amount / totalExpenses) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))
        )}
      </div>

      <p className="text-xs text-gray-500">
        Investment reports use manually entered portfolio values.
        They are not live market or brokerage data.
      </p>
    </div>
  );
}
