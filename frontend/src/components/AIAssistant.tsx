
import { useState } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "How can I save money as a student?",
  "Explain mutual funds simply",
  "How do I create a monthly budget?",
  "What is an emergency fund?",
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your MicroVest AI financial assistant. Ask me about budgeting, saving, investments or personal finance!",
    },
  ]);

  const [input, setInput] = useState("");

  const getReply = (question: string) => {
    const q = question.toLowerCase();

    if (q.includes("budget")) {
      return "A budget helps you manage your money. Start by listing your monthly income, essential expenses, savings and entertainment costs. A simple starting point is the 50/30/20 rule.";
    }

    if (q.includes("save")) {
      return "Start saving by setting a monthly target, tracking daily expenses and reducing unnecessary purchases. Even saving ₹20–₹50 daily can build a useful habit.";
    }

    if (q.includes("mutual fund")) {
      return "A mutual fund pools money from many investors and invests it in assets such as stocks or bonds. Returns are not guaranteed, and investments carry risk.";
    }

    if (q.includes("emergency")) {
      return "An emergency fund is money kept aside for unexpected expenses. Gradually aim to build savings covering 3–6 months of essential expenses.";
    }

    if (q.includes("invest")) {
      return "Before investing, understand your goals, risk tolerance and time horizon. Learn about fixed deposits, mutual funds and index funds before making decisions.";
    }

    return "That's a good financial question! Start by understanding your income, expenses and financial goals. I can help explain budgeting, saving, investments and personal finance concepts. This demo assistant uses predefined responses rather than a live AI model.";
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const question = input.trim();

    setMessages((previous) => [
      ...previous,
      { role: "user", content: question },
      { role: "assistant", content: getReply(question) },
    ]);

    setInput("");
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-purple-100 p-3 rounded-xl">
          <Bot className="text-purple-600" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">MicroVest AI Assistant</h2>
          <p className="text-sm text-gray-500">
            Your personal financial learning companion
          </p>
        </div>
        <Sparkles className="ml-auto text-purple-500" />
      </div>

      <div className="h-96 overflow-y-auto space-y-4 bg-gray-50 rounded-xl p-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="bg-purple-100 p-2 rounded-full h-fit">
                <Bot size={18} className="text-purple-600" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-xl p-3 text-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-700"
              }`}
            >
              {message.content}
            </div>

            {message.role === "user" && (
              <div className="bg-blue-100 p-2 rounded-full h-fit">
                <User size={18} className="text-blue-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setInput(suggestion);
            }}
            className="text-xs border rounded-full px-3 py-2 hover:bg-purple-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Ask anything about personal finance..."
          className="flex-1 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={sendMessage}
          className="bg-purple-600 text-white px-5 rounded-xl hover:bg-purple-700"
        >
          <Send size={20} />
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Demo assistant: responses are predefined educational guidance, not live AI or financial advice.
      </p>
    </div>
  );
}
