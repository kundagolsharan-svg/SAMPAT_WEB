"use client";

import { useEffect, useState } from "react";
import { getBehaviorAnalysis } from "@/actions/behavior-analyzer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarLoader } from "react-spinners";
import { BrainCircuit, TrendingDown, PieChart, Info, AlertTriangle, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function BehaviorAnalyzerPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getBehaviorAnalysis();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch behavior analysis", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarLoader width={200} color="#6366f1" />
        <p className="text-slate-500 font-medium animate-pulse">SAMPAT AI is analyzing your spending patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <Card className="border-rose-100 bg-rose-50 text-rose-900 shadow-2xl rounded-[2.5rem] overflow-hidden max-w-2xl w-full">
           <div className="bg-rose-500 h-2 w-full" />
           <CardHeader className="p-8 pb-4">
             <CardTitle className="text-2xl font-black flex items-center gap-3">
               <AlertTriangle className="h-8 w-8" />
               AI Insight Error
             </CardTitle>
           </CardHeader>
           <CardContent className="p-8 pt-0 space-y-4">
             <div className="bg-white/50 p-4 rounded-2xl border border-rose-100 font-bold text-rose-800">
                {error}
             </div>
             <p className="text-sm font-medium leading-relaxed opacity-80">
               <span className="font-black underline uppercase">Troubleshooting Your Local AI</span><br/>
               Ensure that **Ollama** is running on your computer and you have downloaded the model:
               <code className="block mt-2 bg-black/20 p-2 rounded text-xs font-mono">ollama run llama3.2</code>
             </p>
             <p className="text-xs font-black uppercase tracking-tighter opacity-50">
               Once ready, refresh this page to start the analysis.
             </p>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <BrainCircuit className="h-10 w-10 text-indigo-600" />
          Financial Behavior Analyzer
        </h1>
        <p className="text-slate-500 text-lg">
          AI-driven insights into your spending habits and financial health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Object.keys(data?.categoryTotals || {}).sort((a,b) => data.categoryTotals[b] - data.categoryTotals[a])[0] || "None"}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80 uppercase tracking-wider">Total Evaluated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
               ₹{Object.values(data?.categoryTotals || {}).reduce((a, b) => a + b, 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white border-slate-100">
          <CardHeader className="pb-2 text-slate-800">
            <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-60">AI Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">High</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed AI Analysis */}
        <Card className="lg:col-span-2 shadow-2xl border-none overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-indigo-400" />
              <div>
                <CardTitle className="text-xl">AI Insights & Suggestions</CardTitle>
                <CardDescription className="text-slate-400">Deep dive into your financial psychology</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 prose prose-slate max-w-none prose-headings:text-indigo-600 prose-strong:text-indigo-700">
            <ReactMarkdown>{data?.analysis}</ReactMarkdown>
          </CardContent>
        </Card>

        {/* Breakdown & Tips */}
        <div className="space-y-6">
          <Card className="shadow-xl border-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                Category Split
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(data?.categoryTotals || {}).map(([category, amount]) => (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="capitalize">{category}</span>
                    <span>₹{amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${Math.min(100, (amount / Object.values(data.categoryTotals).reduce((a,b)=>a+b,0)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-xl border-none bg-indigo-50 text-indigo-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                SAMPAT PRO TIP
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium leading-relaxed">
              Consistently categorizing your transactions allows the AI to provide up to 40% more accurate savings suggestions.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Sparkles(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
