import { useState, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Trophy, 
  Dumbbell, 
  History, 
  ChevronRight, 
  CheckCircle2, 
  Zap, 
  Flame, 
  Save, 
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  ArrowUpCircle,
  X,
  Target
} from 'lucide-react';
import { INITIAL_WORKOUTS } from './constants';
import { WorkoutDay, ExerciseSet, TrainingSession, Exercise } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem('pr_tracker_workouts');
    return saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
  });

  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<TrainingSession[]>(() => {
    const saved = localStorage.getItem('pr_tracker_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('pr_tracker_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('pr_tracker_history', JSON.stringify(history));
  }, [history]);

  const startWorkout = (workout: WorkoutDay) => {
    setActiveWorkoutId(workout.id);
    const newSession: TrainingSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      workoutId: workout.id,
      logs: workout.exercises.map(ex => ({
        exerciseId: ex.id,
        sets: [
          { id: crypto.randomUUID(), type: 'warmup', weight: Math.round(ex.prWeight * 0.5), reps: ex.targetReps, completed: false },
          { id: crypto.randomUUID(), type: 'warmup', weight: Math.round(ex.prWeight * 0.75), reps: Math.max(1, ex.targetReps - 2), completed: false },
          { id: crypto.randomUUID(), type: 'work', weight: ex.prWeight || 20, reps: ex.targetReps, completed: false },
          { id: crypto.randomUUID(), type: 'work', weight: ex.prWeight || 20, reps: ex.targetReps, completed: false },
        ]
      }))
    };
    setCurrentSession(newSession);
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<ExerciseSet>) => {
    if (!currentSession) return;
    const newLogs = currentSession.logs.map(log => {
      if (log.exerciseId === exerciseId) {
        return {
          ...log,
          sets: log.sets.map(s => s.id === setId ? { ...s, ...updates } : s)
        };
      }
      return log;
    });
    setCurrentSession({ ...currentSession, logs: newLogs });
  };

  const getAiCoachFeedback = async (session: TrainingSession, exercises: Exercise[]) => {
    setIsAiLoading(true);
    setAiFeedback('');
    try {
      const summaryText = session.logs.map(log => {
        const ex = exercises.find(e => e.id === log.exerciseId);
        const workSets = log.sets.filter(s => s.type === 'work' && s.completed);
        const best = workSets.length > 0 ? workSets.reduce((p, c) => (c.weight >= p.weight) ? c : p) : null;
        return `${ex?.name}: ${best ? `${best.weight}kg x ${best.reps} (Meta: ${ex?.targetReps})` : 'Não concluído'}`;
      }).join('\n');

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é um Coach de Musculação especialista em Treino de Alta Intensidade (HIT). 
        Analise o treino de hoje de um atleta que foca em progressão de cargas (PR).
        Aqui estão os resultados de hoje:\n${summaryText}\n
        Forneça um feedback curto (máximo 4 sentenças), motivador e técnico em PORTUGUÊS. 
        Mencione como a baixa frequência e alta intensidade exigem paciência.
        Se ele não bateu uma meta, diga que "repetir a carga faz parte do processo". 
        Use gírias do meio fitness de forma moderada.`,
      });
      setAiFeedback(response.text || 'O Coach está sem palavras com seu treino hoje!');
    } catch (error) {
      setAiFeedback('Erro ao conectar com o Coach IA. Mas continue treinando pesado!');
    } finally {
      setIsAiLoading(false);
    }
  };

  const finishWorkout = () => {
    if (!currentSession) return;

    const newWorkouts = [...workouts];
    const workoutIdx = newWorkouts.findIndex(w => w.id === currentSession.workoutId);
    
    if (workoutIdx !== -1) {
      const workout = { ...newWorkouts[workoutIdx] };
      workout.exercises = workout.exercises.map(ex => {
        const log = currentSession.logs.find(l => l.exerciseId === ex.id);
        if (log) {
          const workSets = log.sets.filter(s => s.type === 'work' && s.completed);
          if (workSets.length > 0) {
            const bestSet = workSets.reduce((prev, curr) => (curr.weight >= prev.weight && curr.reps >= prev.reps) ? curr : prev);
            
            let newPrWeight = ex.prWeight;
            if (bestSet.reps >= ex.targetReps) {
              newPrWeight = bestSet.weight + (bestSet.reps > ex.targetReps ? ex.increment * 2 : ex.increment);
            } else if (bestSet.weight > ex.prWeight) {
                newPrWeight = bestSet.weight;
            }

            return {
              ...ex,
              lastWeight: bestSet.weight,
              lastReps: bestSet.reps,
              prWeight: newPrWeight
            };
          }
        }
        return ex;
      });
      newWorkouts[workoutIdx] = workout;
      setWorkouts(newWorkouts);
      
      const sessionWithSummary = { ...currentSession, date: new Date().toISOString() };
      getAiCoachFeedback(sessionWithSummary, workout.exercises);
    }

    setHistory([currentSession, ...history]);
    setShowSummary(true);
  };

  const closeSummary = () => {
    setShowSummary(false);
    setActiveWorkoutId(null);
    setCurrentSession(null);
    setAiFeedback('');
  };

  const exportData = () => {
    const data = { workouts, history };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pr_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const importData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.workouts && data.history) {
          setWorkouts(data.workouts);
          setHistory(data.history);
          alert('Dados importados com sucesso!');
        }
      } catch (err) {
        alert('Erro ao importar arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const activeWorkout = workouts.find(w => w.id === activeWorkoutId);

  const getSummaryStats = () => {
    if (!currentSession || !activeWorkout) return { prs: 0, missed: 0 };
    let prs = 0;
    let missed = 0;
    currentSession.logs.forEach(log => {
      const ex = activeWorkout.exercises.find(e => e.id === log.exerciseId);
      const workSets = log.sets.filter(s => s.type === 'work' && s.completed);
      if (workSets.length > 0) {
        const best = workSets.reduce((p, c) => (c.reps >= p.reps) ? c : p);
        if (ex && best.reps >= ex.targetReps) prs++;
        else missed++;
      }
    });
    return { prs, missed };
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pt-12 pb-32 px-6 relative">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-[#050505]">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-brand-primary/10 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-brand-secondary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <AnimatePresence mode="wait">
        {!activeWorkoutId && !showHistory && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <header className="mb-12 flex justify-between items-end">
              <div>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mb-2"
                >
                  <span className="w-8 h-1 bg-brand-primary rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Peak Performance</span>
                </motion.div>
                <h1 className="text-5xl font-black italic tracking-tighter leading-none">
                  PR <span className="text-brand-primary">TRACKER</span>
                </h1>
              </div>
              <div className="flex gap-2 mb-1">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowHistory(true)} 
                  className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors"
                >
                  <History size={20} />
                </motion.button>
              </div>
            </header>

            <motion.div 
              className="grid grid-cols-1 gap-6"
              variants={{
                show: { transition: { staggerChildren: 0.1 } }
              }}
              initial="hidden"
              animate="show"
            >
              {workouts.map((workout, idx) => (
                <motion.button
                  key={workout.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startWorkout(workout)}
                  className="glass-card p-8 text-left hover:border-brand-primary/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12">
                     <Dumbbell size={120} weight="fill" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] block mb-2">{workout.dayName}</span>
                    <h3 className="text-3xl font-black italic tracking-tight group-hover:translate-x-1 transition-transform">{workout.title}</h3>
                    <div className="flex items-center gap-4 mt-6">
                       <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center">
                               <Zap size={10} className="text-zinc-500" />
                            </div>
                          ))}
                       </div>
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{workout.exercises.length} EXERCÍCIOS</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex justify-center gap-6"
            >
              <button onClick={() => document.getElementById('import-input')?.click()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                <Upload size={14} /> Importar
                <input id="import-input" type="file" className="hidden" onChange={importData} accept=".json" />
              </button>
              <button onClick={exportData} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                <Download size={14} /> Backup
              </button>
            </motion.div>
          </motion.div>
        )}

        {showHistory && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                     <History size={24} />
                  </div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase">MEU LOG</h2>
               </div>
               <button onClick={() => setShowHistory(false)} className="p-3 bg-zinc-900 rounded-full">
                 <X size={20} />
               </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center glass-card border-dashed">
                  <RotateCcw className="text-zinc-700 mb-4" size={40} />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Vazio por enquanto</p>
                </div>
              ) : (
                history.map((session, sIdx) => (
                  <motion.div 
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sIdx * 0.05 }}
                    className="glass-card p-6"
                  >
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-zinc-800/50">
                      <div>
                        <h4 className="font-black italic text-xl uppercase tracking-tighter">{workouts.find(w => w.id === session.workoutId)?.title}</h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                          {new Date(session.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="p-2 px-3 bg-zinc-800 rounded-lg text-[10px] font-black text-brand-primary">
                        PR
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {session.logs.slice(0, 3).map(log => {
                        const exercise = workouts.flatMap(w => w.exercises).find(e => e.id === log.exerciseId);
                        const bestWorkSet = log.sets
                          .filter(s => s.type === 'work' && s.completed)
                          .reduce((prev, curr) => (curr.weight >= prev.weight) ? curr : prev, log.sets[0]);
                        
                        return (
                          <div key={log.exerciseId} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400 font-medium">{exercise?.name}</span>
                            <span className="font-mono font-black text-zinc-200">
                              {bestWorkSet.weight}kg × {bestWorkSet.reps}
                            </span>
                          </div>
                        );
                      })}
                      {session.logs.length > 3 && (
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-2">
                          + {session.logs.length - 3} exercícios
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}

        {currentSession && activeWorkout && !showSummary && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="pb-40"
          >
            <div className="sticky top-6 z-50 glass-card p-4 flex items-center justify-between mb-12 shadow-2xl shadow-black">
              <button 
                onClick={() => {
                  if(confirm('Abortar treino? Dados atuais serão perdidos.')) {
                    setActiveWorkoutId(null);
                    setCurrentSession(null);
                  }
                }}
                className="text-zinc-500 text-[10px] font-black uppercase tracking-widest px-4"
              >
                Sair
              </button>
              <div className="text-center">
                 <h2 className="text-lg font-black italic tracking-tighter uppercase text-brand-primary leading-none">{activeWorkout.title}</h2>
                 <p className="text-[8px] font-black tracking-[0.3em] uppercase text-zinc-500 mt-1">Sessão Ativa</p>
              </div>
              <button 
                onClick={finishWorkout}
                className="bg-white text-zinc-950 text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest"
              >
                Finalizar
              </button>
            </div>

            <div className="space-y-16">
              {activeWorkout.exercises.map((exercise, exIdx) => {
                const log = currentSession.logs.find(l => l.exerciseId === exercise.id);
                return (
                  <motion.div 
                    key={exercise.id} 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: exIdx * 0.1 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                           <span className="text-5xl font-black italic text-zinc-800/50 leading-none">{exIdx + 1}</span>
                           <h3 className="text-3xl font-black tracking-tighter leading-tight italic">
                             {exercise.name}
                           </h3>
                        </div>
                        <div className="flex gap-2">
                           <div className="inner-glass px-3 py-1.5 flex items-center gap-2">
                             <Trophy size={14} className="text-amber-400" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">PR: {exercise.prWeight}KG</span>
                           </div>
                           <div className="inner-glass px-3 py-1.5 flex items-center gap-2">
                             <Target size={14} className="text-brand-primary" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">META: {exercise.targetReps} REPS</span>
                           </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                      {log?.sets.map((set, setIdx) => (
                        <motion.div 
                          key={set.id}
                          layout
                          className={`flex items-center gap-3 p-3 rounded-3xl transition-all ${
                            set.completed ? 'bg-zinc-900 border border-brand-primary/20 scale-[0.98]' : 'bg-transparent border border-zinc-900'
                          }`}
                        >
                          <div className="w-12 flex flex-col items-center">
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${
                              set.type === 'warmup' ? 'text-zinc-600 font-mono' : 'text-brand-primary'
                            }`}>
                              {set.type === 'warmup' ? `AQ${setIdx + 1}` : `WORK`}
                            </span>
                          </div>
                          
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div className="relative">
                               <input 
                                type="number"
                                value={set.weight || ''}
                                placeholder="0"
                                onChange={(e) => updateSet(exercise.id, set.id, { weight: Number(e.target.value) })}
                                className="w-full bg-[#0a0a0a] text-center py-5 rounded-2xl font-mono text-2xl font-black focus:ring-2 focus:ring-brand-primary/40 transition-all placeholder:text-zinc-800"
                               />
                               <span className="absolute bottom-2 right-4 text-[8px] font-black text-zinc-700 uppercase">KG</span>
                            </div>
                            <div className="relative">
                               <input 
                                type="number"
                                value={set.reps || ''}
                                placeholder="0"
                                onChange={(e) => updateSet(exercise.id, set.id, { reps: Number(e.target.value) })}
                                className="w-full bg-[#0a0a0a] text-center py-5 rounded-2xl font-mono text-2xl font-black focus:ring-2 focus:ring-brand-primary/40 transition-all placeholder:text-zinc-800"
                               />
                               <span className="absolute bottom-2 right-4 text-[8px] font-black text-zinc-700 uppercase">REPS</span>
                            </div>
                          </div>

                          <motion.button 
                            whileTap={{ scale: 0.8 }}
                            onClick={() => updateSet(exercise.id, set.id, { completed: !set.completed })}
                            className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all ${
                              set.completed ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-zinc-800 text-zinc-600'
                            }`}
                          >
                            {set.completed ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 border-2 border-zinc-700 rounded-full" />}
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {showSummary && (
          <motion.div 
            key="summary"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col pt-16 px-8 overflow-y-auto pb-12"
          >
            <header className="mb-12 flex justify-between items-center">
               <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">WORKOUT<br/><span className="text-brand-primary">DONE</span></h2>
               <motion.button 
                whileHover={{ rotate: 90 }}
                onClick={closeSummary} 
                className="p-4 bg-zinc-900 rounded-full"
               >
                 <X size={24} />
               </motion.button>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 border-emerald-500/20 bg-emerald-500/5">
                  <ArrowUpCircle size={32} className="text-emerald-500" />
                  <span className="text-5xl font-black font-mono tracking-tighter">{getSummaryStats().prs}</span>
                  <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.2em] text-center">PRs BATIDOS</span>
               </div>
               <div className="glass-card p-8 flex flex-col items-center justify-center gap-3 border-zinc-800 bg-zinc-900/10">
                  <RotateCcw size={32} className="text-zinc-500" />
                  <span className="text-5xl font-black font-mono tracking-tighter">{getSummaryStats().missed}</span>
                  <span className="text-[10px] font-black text-zinc-500/50 uppercase tracking-[0.2em] text-center">REPETIÇÕES</span>
               </div>
            </div>

            <div className="glass-card p-8 mb-12 relative border-brand-secondary/30 premium-gradient overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles className="text-brand-secondary" size={60} />
               </div>
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                    <Zap size={20} fill="currentColor" />
                 </div>
                 <h3 className="text-sm font-black uppercase tracking-widest text-brand-secondary">AI COACH ANALYTICS</h3>
               </div>
               
               {isAiLoading ? (
                 <div className="flex flex-col items-center py-8 gap-4">
                   <div className="w-10 h-10 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin" />
                   <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Analisando sua intensidade...</p>
                 </div>
               ) : (
                 <p className="text-xl font-medium leading-relaxed italic text-zinc-200 indent-4">
                    "{aiFeedback}"
                 </p>
               )}
            </div>

            <div className="space-y-4 mb-16">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">DATA BREAKDOWN</h4>
               {currentSession?.logs.map(log => {
                 const ex = activeWorkout?.exercises.find(e => e.id === log.exerciseId);
                 const workSets = log.sets.filter(s => s.type === 'work' && s.completed);
                 const bestSet = workSets.length > 0 ? workSets.reduce((p, c) => (c.reps >= p.reps) ? c : p) : null;
                 const success = ex && bestSet && bestSet.reps >= ex.targetReps;

                 return (
                   <div key={log.exerciseId} className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-[2rem] border border-zinc-800/50 backdrop-blur-sm">
                      <div>
                        <p className="font-black italic uppercase tracking-tighter text-xl">{ex?.name}</p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                          {bestSet ? `${bestSet.weight}KG × ${bestSet.reps}` : 'DNP'} <span className="mx-2">|</span> TARGET: {ex?.targetReps}
                        </p>
                      </div>
                      {success ? (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="flex flex-col items-end gap-1"
                        >
                           <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 font-black text-xs rounded-full border border-emerald-500/20">
                             + {ex?.increment}KG
                           </div>
                           <span className="text-[8px] font-black text-emerald-500/60 uppercase">EVOLUIU</span>
                        </motion.div>
                      ) : (
                        <div className="px-3 py-1 bg-zinc-800 text-zinc-500 font-black text-[10px] rounded-full uppercase">MANTER</div>
                      )}
                   </div>
                 );
               })}
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={closeSummary}
              className="mt-auto w-full py-6 bg-white text-zinc-950 font-black rounded-[2rem] text-2xl shadow-2xl shadow-brand-primary/20 mb-8"
            >
              FECHAR RELATÓRIO
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Floating Action Button */}
      {currentSession && !showSummary && (
        <div className="fixed bottom-0 left-0 right-0 p-8 z-[60] pointer-events-none">
           <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="max-w-md mx-auto glass-card p-4 flex items-center justify-between shadow-[0_32px_64px_-16px_rgba(244,114,182,0.3)] pointer-events-auto border-brand-primary/40 bg-zinc-950/80"
           >
              <div className="flex items-center gap-4 ml-2">
                <div className="relative">
                   <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                     <Flame className="animate-pulse" fill="currentColor" />
                   </div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">INTENSIDADE MÁXIMA</p>
                   <p className="font-black italic text-sm uppercase tracking-tighter text-zinc-200">{activeWorkout?.title}</p>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={finishWorkout}
                className="bg-white text-zinc-950 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all"
              >
                SALVAR
              </motion.button>
           </motion.div>
        </div>
      )}
    </div>
  );
}
