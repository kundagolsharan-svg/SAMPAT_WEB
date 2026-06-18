"use client";

import { useEffect, useState } from "react";
import { getGoals, createGoal, deleteGoal, getGoalPlan } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Trash2, 
  Calendar, 
  Plus, 
  LayoutList, 
  Sparkles, 
  Loader2,
  Trophy,
  AlertTriangle,
  X
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [plan, setPlan] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    currentAmount: "",
    deadline: ""
  });

  const fetchGoals = async () => {
    const data = await getGoals();
    setGoals(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.targetAmount) {
      toast.error("Please fill in name and target amount");
      return;
    }
    try {
      await createGoal(formData);
      toast.success("Goal set successfully! AI is ready to help you achieve it.");
      setFormData({ name: "", targetAmount: "", currentAmount: "", deadline: "" });
      setShowAdd(false);
      fetchGoals();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to remove this goal?")) return;
    try {
      await deleteGoal(id);
      toast.success("Goal removed.");
      fetchGoals();
    } catch (e) {
      toast.error("Failed to delete goal");
    }
  };

    const handleGetPlan = async (id) => {
    setIsPlanning(true);
    setPlan(null);
    setError(null);
    try {
      const planRes = await getGoalPlan(id);
      setPlan(planRes);
      // Scroll to plan
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (e) {
      console.error("Failed to generate goal plan", e);
      setError(e.message);
      toast.error("AI couldn't generate a plan right now.");
    } finally {
      setIsPlanning(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
      <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Your Ambitions...</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-10 max-w-6xl animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <Target className="h-10 w-10" />
            </div>
            Financial Goals
          </h1>
          <p className="text-slate-500 mt-3 text-lg font-medium max-w-lg">
            SAMPAT AI uses your spending patterns to create actionable roadmaps for your biggest dreams.
          </p>
        </div>
        <Button 
          onClick={() => setShowAdd(!showAdd)} 
          className="bg-indigo-600 hover:bg-indigo-700 shadow-xl px-8 py-7 rounded-2xl h-auto text-lg font-black uppercase tracking-tight flex items-center gap-3 transition-all active:scale-95 whitespace-nowrap"
        >
          {showAdd ? "Cancel" : <><Plus className="h-6 w-6 stroke-[3]" /> Set New Goal</>}
        </Button>
      </div>

      {showAdd && (
        <Card className="animate-in slide-in-from-top-10 duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border-indigo-100 bg-white max-w-3xl mx-auto rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-indigo-600 text-white p-8">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-indigo-300" />
              Goal Configuration
            </CardTitle>
            <CardDescription className="text-indigo-100 font-medium">Input your target and let AI handle the math.</CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Goal Name</label>
                <Input 
                  placeholder="e.g. New Home Deposit" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="rounded-2xl border-slate-200 h-14 px-5 text-lg font-semibold focus:ring-indigo-500 h-14"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Target Amount (₹)</label>
                <Input 
                  type="number"
                  placeholder="50,000" 
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                  className="rounded-2xl border-slate-200 h-14 px-5 text-lg font-semibold focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Current Savings (₹)</label>
                <Input 
                  type="number"
                  placeholder="2,500" 
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                  className="rounded-2xl border-slate-200 h-14 px-5 text-lg font-semibold focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Desired Deadline</label>
                <Input 
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="rounded-2xl border-slate-200 h-14 px-5 text-lg font-semibold focus:ring-indigo-500"
                />
              </div>
            </div>
            <Button onClick={handleCreate} className="w-full mt-10 h-16 text-xl font-black uppercase tracking-widest bg-slate-900 border-none hover:bg-black rounded-2xl shadow-lg transition-transform active:scale-[0.98]">
              Initialize Journey
            </Button>
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card className="animate-in slide-in-from-right duration-500 border-none shadow-[0_30px_70px_rgba(0,0,0,0.2)] bg-slate-900 text-white rounded-[2.5rem] overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
            <Trophy className="h-80 w-80" />
          </div>
          <CardHeader className="p-12 pb-0 flex flex-row justify-between items-start">
             <div className="space-y-4">
               <div className="inline-flex items-center gap-2.5 bg-indigo-500/20 px-5 py-2.5 rounded-full border border-indigo-500/30">
                 <Sparkles className="h-5 w-5 text-indigo-400" />
                 <span className="text-xs font-black tracking-widest uppercase text-indigo-300">AI Personal Strategy</span>
               </div>
               <CardTitle className="text-4xl font-extrabold tracking-tight">Your Success Roadmap</CardTitle>
             </div>
             <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-12 w-12" onClick={() => setPlan(null)}>
               <X className="h-6 w-6" />
             </Button>
          </CardHeader>
          <CardContent className="p-12 pt-10 prose prose-invert prose-slate max-w-none prose-headings:text-indigo-400 prose-headings:font-black prose-strong:text-indigo-300 prose-p:text-slate-300 text-lg leading-relaxed">
             <ReactMarkdown>{plan}</ReactMarkdown>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="animate-in slide-in-from-right duration-500 border-none shadow-[0_30px_70px_rgba(0,0,0,0.1)] bg-rose-50 text-rose-900 rounded-[2.5rem] overflow-hidden">
           <div className="bg-rose-500 h-2 w-full" />
           <CardHeader className="p-10 pb-4 flex flex-row justify-between items-start">
             <div className="space-y-4">
               <CardTitle className="text-3xl font-black flex items-center gap-3">
                 <AlertTriangle className="h-8 w-8" />
                 Strategy Generation Error
               </CardTitle>
             </div>
             <Button variant="ghost" className="text-rose-300 hover:text-rose-600 hover:bg-rose-100 rounded-full h-10 w-10" onClick={() => setError(null)}>
               <X className="h-5 w-5" />
             </Button>
           </CardHeader>
           <CardContent className="p-10 pt-0 space-y-6">
             <div className="bg-white/50 p-6 rounded-2xl border border-rose-100 font-bold text-rose-800 text-lg">
                {error}
             </div>
              <div className="space-y-2">
                <p className="text-sm font-black underline uppercase">Troubleshooting Your Local AI</p>
                <p className="text-sm font-medium leading-relaxed opacity-80">
                  Ensure that **Ollama** is running on your machine and you have downloaded the model by running:
                  <code className="block mt-2 bg-black/20 p-2 rounded text-xs font-mono">ollama run llama3.2</code>
                </p>
                <p className="text-xs font-black uppercase tracking-tighter opacity-50 mt-4">
                  Once the model is ready, refresh this page to try again.
                </p>
              </div>
           </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {goals.map((goal) => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          return (
            <Card key={goal.id} className="group relative overflow-hidden rounded-[2.5rem] border-none shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-60" />
              
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-indigo-50 rounded-[1.2rem] text-indigo-600 group-hover:scale-110 transition-transform shadow-inner">
                    <Target className="h-8 w-8" />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <CardTitle className="mt-6 text-2xl font-black text-slate-800 tracking-tight leading-tight">{goal.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  Due: {goal.deadline ? new Date(goal.deadline).toLocaleDateString() : "Flexible Time"}
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-4 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Progress</div>
                      <div className="text-4xl font-black text-slate-900 tracking-tighter">₹{goal.currentAmount.toLocaleString("en-IN")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-300 uppercase tracking-widest">Target</div>
                      <div className="text-lg font-extrabold text-slate-400">₹{goal.targetAmount.toLocaleString("en-IN")}</div>
                    </div>
                  </div>
                  
                  <div className="relative pt-1">
                    <Progress value={progress} className="h-4 rounded-full bg-slate-100" />
                    <div className="flex justify-between mt-2">
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{progress.toFixed(0)}% Complete</span>
                       {progress >= 100 && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Goal Reached!</span>}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Button 
                  onClick={() => handleGetPlan(goal.id)} 
                  disabled={isPlanning}
                  className="w-full bg-slate-100 hover:bg-indigo-600 group-hover:bg-indigo-600 text-slate-500 group-hover:text-white h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border-none transition-all shadow-none group-hover:shadow-lg group-hover:shadow-indigo-200"
                >
                  {isPlanning ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sparkles className="h-5 w-5" /> Generate AI Strategy</>}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        
        {goals.length === 0 && !showAdd && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[4rem] text-slate-300 bg-slate-50/30">
            <LayoutList className="h-32 w-32 mb-6 opacity-[0.05]" />
            <p className="text-xl font-bold uppercase tracking-[0.3em] opacity-20">Ambition Void Detected</p>
            <Button onClick={() => setShowAdd(true)} variant="link" className="text-indigo-400 font-extrabold mt-4 text-lg hover:text-indigo-600">Start Your First Journey →</Button>
          </div>
        )}
      </div>
    </div>
  );
}
