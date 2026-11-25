
import { useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  GraduationCap,
  Trophy,
  ArrowLeft,
} from "lucide-react";

type Lesson = {
  id: number;
  title: string;
  description: string;
  content: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

const lessons: Lesson[] = [
  {
    id: 1,
    title: "Budgeting Basics",
    description: "Learn how to plan and manage your money.",
    content:
      "A budget is a plan for how you will spend and save your money. Track your income, list your expenses, and set limits for different spending categories.",
    question: "What is the main purpose of a budget?",
    options: [
      "To spend all your money",
      "To plan income and expenses",
      "To increase unnecessary spending",
      "To avoid saving money",
    ],
    answer: 1,
    explanation:
      "A budget helps you manage income, control expenses, and save money.",
  },
  {
    id: 2,
    title: "Saving Money",
    description: "Build good saving habits.",
    content:
      "Saving means keeping aside a portion of your income for future needs. Try saving regularly instead of waiting until the end of the month.",
    question: "Which is a good saving habit?",
    options: [
      "Save whatever is left randomly",
      "Spend before saving",
      "Save a fixed amount regularly",
      "Borrow money to save",
    ],
    answer: 2,
    explanation:
      "Regularly setting aside a fixed amount helps build a consistent saving habit.",
  },
  {
    id: 3,
    title: "Emergency Fund",
    description: "Prepare for unexpected expenses.",
    content:
      "An emergency fund is money kept aside for unexpected situations such as medical bills, urgent repairs, or sudden loss of income. A common goal is 3–6 months of essential expenses.",
    question: "What is an emergency fund used for?",
    options: [
      "Shopping and entertainment",
      "Unexpected essential expenses",
      "Buying luxury products",
      "Daily unnecessary purchases",
    ],
    answer: 1,
    explanation:
      "An emergency fund provides financial protection when unexpected expenses arise.",
  },
  {
    id: 4,
    title: "Understanding Investments",
    description: "Discover how investing works.",
    content:
      "Investing means putting money into assets with the goal of growing its value over time. Examples include stocks, mutual funds, and bonds. Investments involve risk.",
    question: "What is the main objective of investing?",
    options: [
      "To guarantee instant profit",
      "To grow money over time",
      "To avoid all financial risk",
      "To spend money immediately",
    ],
    answer: 1,
    explanation:
      "Investing aims to grow wealth over time, but returns are not guaranteed.",
  },
  {
    id: 5,
    title: "Risk and Diversification",
    description: "Understand investment risk.",
    content:
      "Diversification means spreading investments across different assets instead of putting all your money into one investment. It can help reduce the impact of poor performance in one area.",
    question: "What does diversification mean?",
    options: [
      "Investing everything in one stock",
      "Avoiding investments completely",
      "Spreading money across different assets",
      "Only investing in cash",
    ],
    answer: 2,
    explanation:
      "Diversification spreads risk across different investments, though it cannot eliminate risk.",
  },
  {
    id: 6,
    title: "Credit and Debt",
    description: "Learn responsible borrowing.",
    content:
      "Credit allows you to borrow money and repay it later. Debt can become expensive when interest and late fees accumulate. Always understand repayment terms before borrowing.",
    question: "What should you check before taking a loan?",
    options: [
      "Only the loan amount",
      "Interest rate and repayment terms",
      "The colour of the bank card",
      "Nothing, just borrow",
    ],
    answer: 1,
    explanation:
      "Interest rates, fees, and repayment terms help you understand the actual cost of borrowing.",
  },
];

export default function LearnFinance() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("microvest_completed_lessons") || "[]"
      );

      return Array.isArray(saved)
        ? saved.filter(
            (id): id is number =>
              typeof id === "number" &&
              lessons.some((lesson) => lesson.id === id)
          )
        : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "microvest_completed_lessons",
      JSON.stringify(completed)
    );
  }, [completed]);

  const progress = Math.round(
    (completed.length / lessons.length) * 100
  );

  const openLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  const submitQuiz = () => {
    if (selectedAnswer === null || !selectedLesson) return;

    setSubmitted(true);

    if (
      selectedAnswer === selectedLesson.answer &&
      !completed.includes(selectedLesson.id)
    ) {
      setCompleted((previous) => [
        ...previous,
        selectedLesson.id,
      ]);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Learn Finance
        </h2>
        <p className="text-gray-500 mt-1">
          Improve your financial knowledge one lesson at a time.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-lg">
              Your Learning Progress
            </h3>
            <p className="text-sm text-gray-500">
              {completed.length} of {lessons.length} lessons completed
            </p>
          </div>

          <Trophy className="text-yellow-500" size={30} />
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-right text-sm font-semibold mt-2">
          {progress}%
        </p>
      </div>

      {selectedLesson ? (
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <button
            onClick={() => setSelectedLesson(null)}
            className="flex items-center gap-2 text-purple-600 font-medium hover:underline"
          >
            <ArrowLeft size={18} />
            Back to lessons
          </button>

          <div>
            <h3 className="text-xl font-bold">
              {selectedLesson.title}
            </h3>
            <p className="text-gray-500 mt-1">
              {selectedLesson.description}
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-5">
            <h4 className="font-bold mb-2">Lesson</h4>
            <p className="text-gray-700 leading-relaxed">
              {selectedLesson.content}
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-3">
              Quick Knowledge Check
            </h4>

            <p className="mb-4">
              {selectedLesson.question}
            </p>

            <div className="space-y-3">
              {selectedLesson.options.map((option, index) => (
                <button
                  key={index}
                  disabled={submitted}
                  onClick={() => setSelectedAnswer(index)}
                  className={`w-full text-left border rounded-lg p-3 transition ${
                    selectedAnswer === index
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-purple-400"
                  }`}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          </div>

          {!submitted && (
            <button
              onClick={submitQuiz}
              disabled={selectedAnswer === null}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              Submit Answer
            </button>
          )}

          {submitted && (
            <div
              className={`rounded-xl p-4 ${
                selectedAnswer === selectedLesson.answer
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <p className="font-bold">
                {selectedAnswer === selectedLesson.answer
                  ? "Correct! Lesson completed."
                  : "Incorrect answer. Review and try again."}
              </p>

              <p className="text-sm mt-2">
                {selectedLesson.explanation}
              </p>

              <button
                onClick={() => openLesson(selectedLesson)}
                className="mt-3 underline font-medium"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white border rounded-xl p-5 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <BookOpen className="text-purple-600" />
                </div>

                {completed.includes(lesson.id) && (
                  <CheckCircle className="text-green-500" />
                )}
              </div>

              <h3 className="font-bold text-lg mt-4">
                {lesson.title}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                {lesson.description}
              </p>

              <button
                onClick={() => openLesson(lesson)}
                className="mt-5 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
              >
                {completed.includes(lesson.id)
                  ? "Review Lesson"
                  : "Start Learning"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-3">
        <GraduationCap
          className="text-blue-600 shrink-0"
          size={28}
        />

        <div>
          <h3 className="font-bold text-blue-900">
            MicroVest Learning Academy
          </h3>
          <p className="text-sm text-blue-800 mt-1">
            Learn at your own pace. Your completed lessons are saved
            in this browser.
          </p>
        </div>
      </div>
    </div>
  );
}
