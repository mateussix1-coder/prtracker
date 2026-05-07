import { useState, useEffect, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { Trophy, Dumbbell, History, ChevronRight, CheckCircle2, Zap, Flame, Save, Calendar, Download, Upload, RotateCcw, Sparkles, AlertTriangle, ArrowUpCircle, X, Target, Edit2, Trash2, Plus, LogOut, LogIn, Minus } from "lucide-react";
import { INITIAL_WORKOUTS } from "./constants";
import { WorkoutDay, ExerciseSet, TrainingSession, Exercise } from "./types";
import { auth, db } from "./firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, doc, setDoc, getDocs, getDoc, serverTimestamp, deleteDoc, writeBatch } from "firebase/firestore";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const MovementIcon = ({ name, index }: { name: string, index: number }) => {
  const n = name.toLowerCase();
  
  let IconContent;
  let transitionProps = { duration: 2.5, repeat: Infinity, ease: "easeInOut" };

  if (n.includes('puxada') || n.includes('pulley')) {
    // Cable pull down
    IconContent = (
      <div className="flex flex-col items-center -mt-2">
        <motion.div 
           className="w-0.5 bg-zinc-500 origin-top" 
           animate={{ height: [8, 22, 8] }}
           transition={transitionProps}
        />
        <motion.div
           animate={{ y: [0, 14, 0] }}
           transition={transitionProps}
        >
          <div className="flex items-start">
             <div className="w-1.5 h-5 bg-zinc-300 rounded-full origin-top -rotate-45 translate-x-[3px]" />
             <div className="w-1.5 h-5 bg-zinc-300 rounded-full origin-top rotate-45 -translate-x-[3px]" />
          </div>
        </motion.div>
      </div>
    );
  } else if (n.includes('supino')) {
    // Barbell Push
    IconContent = (
      <motion.div
        animate={{ y: [6, -6, 6] }}
        transition={transitionProps}
        className="flex items-center shadow-lg"
      >
         <div className="w-1 h-4 bg-zinc-400 rounded-sm" />
         <div className="w-1.5 h-6 bg-gradient-to-b from-brand-primary to-rose-600 rounded-sm -ml-0.5" />
         <div className="w-6 h-1.5 bg-zinc-300" />
         <div className="w-1.5 h-6 bg-gradient-to-b from-brand-primary to-rose-600 rounded-sm -mr-0.5" />
         <div className="w-1 h-4 bg-zinc-400 rounded-sm" />
      </motion.div>
    );
  } else if (n.includes('remada')) {
    // Cable pull horizontal
    IconContent = (
      <motion.div
        animate={{ x: [6, -6, 6] }}
        transition={transitionProps}
        className="flex items-center gap-1"
      >
        <div className="w-6 h-0.5 bg-zinc-500 shadow-sm" />
        <div className="w-2.5 h-6 bg-zinc-300 rounded-sm shadow-md" />
      </motion.div>
    );
  } else if (n.includes('agachamento') || n.includes('leg press') || n.includes('stiff') || n.includes('pélvica')) {
    // Barbell Squat / Heavy lower body
    IconContent = (
      <motion.div
        animate={{ y: [-6, 6, -6] }}
        transition={transitionProps}
        className="flex items-center shadow-xl"
      >
         <div className="w-1 h-5 bg-zinc-400 rounded-sm" />
         <div className="w-2 h-8 bg-gradient-to-b from-brand-primary to-rose-600 rounded-sm -ml-0.5" />
         <div className="w-8 h-1.5 bg-zinc-300" />
         <div className="w-2 h-8 bg-gradient-to-b from-brand-primary to-rose-600 rounded-sm -mr-0.5" />
         <div className="w-1 h-5 bg-zinc-400 rounded-sm" />
      </motion.div>
    );
  } else if (n.includes('elevação lateral') || n.includes('crucifixo')) {
    // Fly / Lateral Raise
    IconContent = (
      <div className="flex gap-1.5 relative top-2">
         {/* Left DB */}
         <motion.div
           animate={{ rotate: [0, 60, 0], x: [0, -6, 0], y: [0, -8, 0] }}
           transition={transitionProps}
           className="flex items-center origin-right shadow-md"
         >
            <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
            <div className="w-2.5 h-1 bg-zinc-300" />
            <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
         </motion.div>
         {/* Right DB */}
         <motion.div
           animate={{ rotate: [0, -60, 0], x: [0, 6, 0], y: [0, -8, 0] }}
           transition={transitionProps}
           className="flex items-center origin-left shadow-md"
         >
            <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
            <div className="w-2.5 h-1 bg-zinc-300" />
            <div className="w-1.5 h-3 bg-brand-primary rounded-sm" />
         </motion.div>
      </div>
    );
  } else if (n.includes('extensora') || n.includes('flexora')) {
    // Leg Extension / Curl (rotating arm)
    IconContent = (
      <div className="flex flex-col items-center">
        <div className="w-3 h-3 rounded-full bg-zinc-700 mb-[-6px] z-10" />
        <motion.div
          animate={n.includes('extensora') ? { rotate: [45, -10, 45] } : { rotate: [0, 60, 0] }}
          transition={transitionProps}
          className="flex items-center origin-left -ml-2"
        >
          <div className="w-6 h-1.5 bg-zinc-500 rounded-full" />
          <div className="w-4 h-5 bg-brand-primary rounded-md -ml-2 shadow-md" />
        </motion.div>
      </div>
    );
  } else if (n.includes('adutora') || n.includes('abdutora')) {
    // Machine Pads spreading
    const isAdutora = n.includes('adutora');
    IconContent = (
      <div className="flex gap-1 relative">
         <motion.div
           animate={{ x: isAdutora ? [-6, 0, -6] : [0, -6, 0] }}
           transition={transitionProps}
           className="w-3 h-6 bg-gradient-to-r from-brand-primary to-rose-600 rounded-md shadow-md"
         />
         <motion.div
           animate={{ x: isAdutora ? [6, 0, 6] : [0, 6, 0] }}
           transition={transitionProps}
           className="w-3 h-6 bg-gradient-to-l from-brand-primary to-rose-600 rounded-md shadow-md"
         />
      </div>
    );
  } else if (n.includes('panturrilha')) {
    // Calf Raise
     IconContent = (
      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={transitionProps}
        className="flex flex-col items-center gap-1.5"
      >
         <div className="w-5 h-4 bg-gradient-to-b from-brand-primary to-rose-500 rounded-md shadow-md" />
         <div className="w-8 h-1 bg-zinc-400 rounded-full" />
      </motion.div>
    );
  } else {
    // Default Dumbbell Curl (roscas, francês, others)
    IconContent = (
      <motion.div
         animate={{ rotate: [-45, 45, -45] }}
         transition={transitionProps}
         className="flex items-center drop-shadow-md origin-bottom-left"
       >
          <div className="w-[8px] h-5 bg-gradient-to-br from-brand-primary to-rose-700 rounded-sm border-t border-l border-white/20 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.5)]" />
          <div className="w-4 h-1.5 bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-600 shadow-[inset_0_2px_2px_rgba(255,255,255,0.8)]" />
          <div className="w-[8px] h-5 bg-gradient-to-br from-brand-primary to-rose-700 rounded-sm border-t border-r border-white/20 shadow-[inset_2px_-2px_4px_rgba(0,0,0,0.5)]" />
       </motion.div>
    );
  }

  return (
    <div className="relative w-[50px] h-[50px] shrink-0 bg-gradient-to-br from-zinc-900 to-[#0a0a0a] border border-zinc-800 rounded-[18px] flex items-center justify-center overflow-hidden shadow-inner">
       <span className="absolute text-[40px] -right-2 -bottom-2 font-black italic text-zinc-800/40 leading-none select-none z-0">{index}</span>
       <div className="relative z-10 flex items-center justify-center w-full h-full">
         {IconContent}
       </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // sync from firestore
        try {
          const wPath = `users/${u.uid}/workouts`;
          const hPath = `users/${u.uid}/history`;

          const wSnapshot = await getDocs(collection(db, wPath)).catch(e => handleFirestoreError(e, OperationType.LIST, wPath));
          const wList = wSnapshot.docs.map(doc => doc.data() as WorkoutDay);
          if (wList.length > 0) {
            setWorkouts(wList);
          } else {
             // Create default ones in firestore
             for (const w of INITIAL_WORKOUTS) {
               await setDoc(doc(db, wPath, w.id), { ...w, userId: u.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(e => handleFirestoreError(e, OperationType.WRITE, `${wPath}/${w.id}`));
             }
          }
          
          const hSnapshot = await getDocs(collection(db, hPath)).catch(e => handleFirestoreError(e, OperationType.LIST, hPath));
          const hList = hSnapshot.docs.map(doc => doc.data() as TrainingSession).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (hList.length > 0) {
            setHistory(hList);
          }
        } catch (e) {
          console.error("Erro sincronizando do Firestore", e);
        }
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e.code === 'auth/popup-closed-by-user') {
        console.log("Login cancelado pelo usuário.");
        return;
      }
      console.error("Erro no login:", e);
    }
  };

  const [workouts, setWorkouts] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem("pr_tracker_workouts");
    return saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
  });

  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(() => {
    const saved = localStorage.getItem("pr_tracker_active_id");
    return saved ? JSON.parse(saved) : null;
  });
  const [editingWorkout, setEditingWorkout] = useState<WorkoutDay | null>(null);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(
    () => {
      const saved = localStorage.getItem("pr_tracker_session");
      return saved ? JSON.parse(saved) : null;
    },
  );
  const [showHistory, setShowHistory] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [pendingSave, setPendingSave] = useState<{ newWorkouts: WorkoutDay[], session: TrainingSession } | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [history, setHistory] = useState<TrainingSession[]>(() => {
    const saved = localStorage.getItem("pr_tracker_history");
    return saved ? JSON.parse(saved) : [];
  });

  const [prAlert, setPrAlert] = useState<string | null>(null);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const [isAddingEx, setIsAddingEx] = useState(false);
  const [newExName, setNewExName] = useState("");
  const [newExTarget, setNewExTarget] = useState(8);
  const [newExPr, setNewExPr] = useState(20);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const addSet = (exerciseId: string, type: "warmup" | "work") => {
    if (!currentSession) return;
    const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);
    const exercise = activeWorkout?.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newLogs = currentSession.logs.map((log) => {
      if (log.exerciseId === exerciseId) {
        const lastSet = log.sets.length > 0 ? log.sets[log.sets.length - 1] : null;
        const newSet: ExerciseSet = {
          id: crypto.randomUUID(),
          type: type,
          weight: lastSet ? lastSet.weight : exercise.prWeight,
          reps: type === "warmup" ? exercise.targetReps : 0,
          completed: false,
        };
        return { ...log, sets: [...log.sets, newSet] };
      }
      return log;
    });
    setCurrentSession({ ...currentSession, logs: newLogs });
  };

  const removeSet = (exerciseId: string, setId: string) => {
    if (!currentSession) return;
    const newLogs = currentSession.logs.map((log) => {
      if (log.exerciseId === exerciseId) {
        return { ...log, sets: log.sets.filter((s) => s.id !== setId) };
      }
      return log;
    });
    setCurrentSession({ ...currentSession, logs: newLogs });
  };

  useEffect(() => {
    localStorage.setItem("pr_tracker_workouts", JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem("pr_tracker_history", JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(
      "pr_tracker_active_id",
      JSON.stringify(activeWorkoutId),
    );
  }, [activeWorkoutId]);

  useEffect(() => {
    localStorage.setItem("pr_tracker_session", JSON.stringify(currentSession));
  }, [currentSession]);

  const [isResetting, setIsResetting] = useState(false);

  const handleResetToFullBody = async () => {
    try {
      // 1. Local data update
      setWorkouts(INITIAL_WORKOUTS);
      localStorage.setItem("pr_tracker_workouts", JSON.stringify(INITIAL_WORKOUTS));

      // 2. Firestore data update if logged in
      if (user) {
        const wPath = `users/${user.uid}/workouts`;
        const snapshot = await getDocs(collection(db, wPath));
        
        // Use batch for efficiency
        const batch = writeBatch(db);
        
        // Delete old workouts
        snapshot.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        
        // Add new full body workouts
        for (const w of INITIAL_WORKOUTS) {
          const newDocRef = doc(db, wPath, w.id);
          batch.set(newDocRef, { 
            ...w, 
            userId: user.uid, 
            createdAt: serverTimestamp(), 
            updatedAt: serverTimestamp() 
          });
        }
        
        await batch.commit();
      }
      
      setIsResetting(false);
      // We don't use alert to follow guidelines, just visual feedback
    } catch (e) {
      console.error("Erro ao resetar treinos", e);
      setIsResetting(false);
    }
  };

  const startWorkout = (workout: WorkoutDay) => {
    setActiveWorkoutId(workout.id);
    const newSession: TrainingSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      workoutId: workout.id,
      logs: workout.exercises.map((ex) => {
        let lastWorkWeight = ex.prWeight || 20;
        let lastWorkReps = ex.targetReps;
        
        for (const s of history) {
           const log = s.logs.find(l => l.exerciseId === ex.id);
           if (log && log.sets) {
             const workSets = log.sets.filter(ws => ws.type === "work");
             if (workSets.length > 0) {
               lastWorkWeight = workSets[0].weight;
               lastWorkReps = workSets[0].reps;
               break;
             }
           }
        }

        const baseWeight = lastWorkWeight;
        return {
          exerciseId: ex.id,
          sets: [
            {
              id: crypto.randomUUID(),
              type: "warmup",
              weight: Math.max(1, Math.round(baseWeight * 0.5)),
              reps: Math.min(ex.targetReps, 8),
              completed: false,
            },
            {
              id: crypto.randomUUID(),
              type: "warmup",
              weight: Math.max(1, Math.round(baseWeight * 0.7)),
              reps: Math.min(ex.targetReps, Math.round(ex.targetReps * 0.7)),
              completed: false,
            },
            {
              id: crypto.randomUUID(),
              type: "warmup",
              weight: Math.max(1, Math.round(baseWeight * 0.85)),
              reps: 2,
              completed: false,
            },
            {
              id: crypto.randomUUID(),
              type: "work",
              weight: baseWeight,
              reps: lastWorkReps,
              completed: false,
            },
          ],
        };
      }),
    };
    setCurrentSession(newSession);
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    updates: Partial<ExerciseSet>,
  ) => {
    if (!currentSession) return;
    const newLogs = currentSession.logs.map((log) => {
      if (log.exerciseId === exerciseId) {
        return {
          ...log,
          sets: log.sets.map((s) =>
            s.id === setId ? { ...s, ...updates } : s,
          ),
        };
      }
      return log;
    });
    setCurrentSession({ ...currentSession, logs: newLogs });

    const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);
    const exercise = activeWorkout?.exercises.find((e) => e.id === exerciseId);
    const log = currentSession.logs.find((l) => l.exerciseId === exerciseId);
    const setBeforeUpdate = log?.sets.find((s) => s.id === setId);

    if (exercise && setBeforeUpdate && setBeforeUpdate.type === "work") {
      const expectedWeight =
        updates.weight !== undefined ? updates.weight : setBeforeUpdate.weight;
      const expectedReps =
        updates.reps !== undefined ? updates.reps : setBeforeUpdate.reps;

      // Start rest timer if checking as completed
      if (updates.completed === true && !setBeforeUpdate.completed) {
        setRestTimer(180); // 3 minutes default for HIT
      }

      const isPrNow =
        expectedWeight > 0 &&
        expectedReps > 0 &&
        (expectedWeight > exercise.prWeight ||
          (expectedWeight === exercise.prWeight &&
            expectedReps >= exercise.targetReps));

      const wasPrBefore =
        setBeforeUpdate.weight > 0 &&
        setBeforeUpdate.reps > 0 &&
        (setBeforeUpdate.weight > exercise.prWeight ||
          (setBeforeUpdate.weight === exercise.prWeight &&
            setBeforeUpdate.reps >= exercise.targetReps));

      if (isPrNow && !wasPrBefore) {
        setPrAlert("🎉 " + exercise.name + " (" + expectedWeight + "KG)");
        setTimeout(() => setPrAlert(null), 4000);
      }
    }
  };

  const getAiCoachFeedback = async (
    session: TrainingSession,
    exercises: Exercise[],
    prsBatidos: number,
  ) => {
    setIsAiLoading(true);
    setAiFeedback("");
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        setAiFeedback(
          "Coach IA indisponível: Chave da API GEMINI_API_KEY não configurada no ambiente. Mas continue treinando pesado!",
        );
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const summaryText = session.logs
        .map((log) => {
          const ex = exercises.find((e) => e.id === log.exerciseId);
          const workSets = log.sets.filter(
            (s) => s.type === "work" && s.completed,
          );
          const best =
            workSets.length > 0
              ? workSets.reduce((p, c) => (c.weight > p.weight || (c.weight === p.weight && c.reps >= p.reps) ? c : p))
              : null;
          return `${ex?.name}: ${best ? `${best.weight}kg x ${best.reps} (Meta: ${ex?.targetReps})` : "Não concluído"}`;
        })
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é um Coach de Musculação estilo "Tóxico/Sarcástico" focado em HIT/Heavy Duty. 
        Analise o treino de hoje focado em progressão de cargas e baixo volume.
        O usuário bateu ${prsBatidos} PRs (Recordes Pessoais/Metas) hoje.
        Resultados de hoje:\n${summaryText}\n
        
        Seja BEM CURTO (1 a 2 frases no máximo) e BEM AGRESSIVO (xingue se for preciso):
        - Se bateu 1 ou mais PRs: Elogie de forma dura/agressiva (ex: "Parabéns seu merda, fez o mínimo esperado.").
        - Se bateu 0 PRs: Xingue sem dó, diga que ele foi um lixo, fraco, passeou na academia, etc. Varie sempre!
        Fale em PORTUGUÊS.`,
      });
      setAiFeedback(
        response.text || "O Coach está sem palavras com seu treino hoje!",
      );
    } catch (error) {
      console.error("AI Coach Error:", error);
      setAiFeedback(
        "Erro ao conectar com o Coach IA. Mas continue treinando pesado!",
      );
    } finally {
      setIsAiLoading(false);
    }
  };

  const previewSummary = () => {
    if (!currentSession) return;

    let sessionPrs = 0;
    let sessionMissed = 0;

    const newWorkouts = [...workouts];
    const workoutIdx = newWorkouts.findIndex(
      (w) => w.id === currentSession.workoutId,
    );

    if (workoutIdx !== -1) {
      const workout = { ...newWorkouts[workoutIdx] };
      workout.exercises = workout.exercises.map((ex) => {
        const log = currentSession.logs.find((l) => l.exerciseId === ex.id);
        if (log) {
          const workSets = log.sets.filter(
            (s) => s.type === "work" && s.completed,
          );
          if (workSets.length > 0) {
            const bestSet = workSets.reduce((prev, curr) =>
              curr.weight > prev.weight ||
              (curr.weight === prev.weight && curr.reps >= prev.reps)
                ? curr
                : prev,
            );

            let newPrWeight = ex.prWeight;

            if (
              bestSet.weight > ex.prWeight ||
              (bestSet.weight === ex.prWeight && bestSet.reps >= ex.targetReps)
            ) {
              sessionPrs++;
              newPrWeight =
                bestSet.weight +
                (bestSet.reps > ex.targetReps
                  ? ex.increment * 2
                  : ex.increment);
            } else if (bestSet.weight > ex.prWeight) {
              sessionPrs++;
              newPrWeight = bestSet.weight;
            } else {
              sessionMissed++;
            }

            return {
              ...ex,
              lastWeight: bestSet.weight,
              lastReps: bestSet.reps,
              prWeight: newPrWeight,
            };
          }
        }
        return ex;
      });
      newWorkouts[workoutIdx] = workout;
      
      currentSession.stats = { prs: sessionPrs, missed: sessionMissed };

      const sessionWithSummary = {
        ...currentSession,
        date: new Date().toISOString(),
      };
      
      setPendingSave({ newWorkouts, session: sessionWithSummary });
      getAiCoachFeedback(sessionWithSummary, workout.exercises, sessionPrs);
    }

    setShowSummary(true);
  };

  const closeSummary = () => {
    setShowSummary(false);
  };

  const saveAndCloseWorkout = async () => {
    if (pendingSave) {
       setWorkouts(pendingSave.newWorkouts);
       setHistory([pendingSave.session, ...history]);
       
       if (user) {
         try {
           // Save modified workouts
           for (const w of pendingSave.newWorkouts) {
             const wPath = `users/${user.uid}/workouts/${w.id}`;
             await setDoc(doc(db, `users/${user.uid}/workouts`, w.id), { ...w, userId: user.uid, updatedAt: serverTimestamp() }, { merge: true })
               .catch(e => handleFirestoreError(e, OperationType.WRITE, wPath));
           }
           // Save session
           const sPath = `users/${user.uid}/history/${pendingSave.session.id}`;
           await setDoc(doc(db, `users/${user.uid}/history`, pendingSave.session.id), { ...pendingSave.session, userId: user.uid, createdAt: serverTimestamp(), workoutId: pendingSave.session.workoutId })
             .catch(e => handleFirestoreError(e, OperationType.WRITE, sPath));
         } catch (e) {
           console.error("Error saving to firestore", e);
         }
       }
    }
    setShowSummary(false);
    setActiveWorkoutId(null);
    setCurrentSession(null);
    setAiFeedback("");
    setPendingSave(null);
  };

  const exportData = () => {
    const data = { workouts, history };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pr_tracker_backup_${new Date().toISOString().split("T")[0]}.json`;
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
          alert("Dados importados com sucesso!");
        }
      } catch (err) {
        alert("Erro ao importar arquivo.");
      }
    };
    reader.readAsText(file);
  };

  const activeWorkout = workouts.find((w) => w.id === activeWorkoutId);

  const getSummaryStats = () => {
    if (currentSession?.stats) return currentSession.stats;
    if (!currentSession || !activeWorkout) return { prs: 0, missed: 0 };
    return { prs: 0, missed: 0 };
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen pt-12 pb-32 px-6 relative">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 bg-[#050505]">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-brand-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] bg-brand-secondary/10 rounded-full blur-[100px] animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <AnimatePresence>
        {prAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-4 right-4 z-[200] flex justify-center pointer-events-none"
          >
            <div className="bg-brand-primary text-white pl-5 pr-6 py-4 rounded-2xl shadow-2xl shadow-brand-primary/40 flex items-center gap-4">
              <Trophy
                size={28}
                className="text-amber-300 animate-pulse"
                fill="currentColor"
              />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-200 leading-none mb-1">
                  NOVO RECORDE
                </p>
                <p className="font-black italic uppercase leading-none text-xl">
                  {prAlert}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* REST TIMER */}
        {restTimer !== null && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-32 left-4 right-4 z-[150] flex justify-center pointer-events-none"
          >
            <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-brand-primary/20 p-4 px-6 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(244,114,182,0.3)] flex items-center gap-4 pointer-events-auto">
              <div className="w-10 h-10 rounded-full border-2 border-brand-primary/30 flex items-center justify-center relative">
                 <motion.div 
                    className="absolute inset-0 border-2 border-brand-primary rounded-full border-t-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                 />
                 <div className="w-4 h-4 bg-brand-primary rounded-sm shadow-[0_0_10px_rgba(244,114,182,0.5)] animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">
                  Descanso HIT
                </span>
                <span className="text-3xl font-black font-mono tracking-tighter text-white leading-none">
                  {Math.floor(restTimer / 60)}:{(restTimer % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <button
                 onClick={() => setRestTimer(null)}
                 className="ml-4 w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!activeWorkoutId && !showHistory && !editingWorkout && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                    {user?.displayName ? `Treinador: ${user.displayName}` : 'Alto Rendimento'}
                  </span>
                </motion.div>
                <h1 className="text-5xl font-black italic tracking-tighter leading-none">
                  REGISTRO <span className="text-brand-primary">DE RECORDES</span>
                </h1>
              </div>
              <div className="flex gap-2 mb-1">
                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => signOut(auth)}
                    className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 transition-colors text-rose-500/80"
                  >
                    <LogOut size={20} />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={login}
                    className="p-3 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary rounded-2xl hover:bg-brand-primary/20 transition-colors"
                  >
                    <LogIn size={20} />
                  </motion.button>
                )}
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
              className="grid grid-cols-1 gap-3"
              variants={{
                show: { transition: { staggerChildren: 0.1 } },
              }}
              initial="hidden"
              animate="show"
            >
              {workouts.map((workout, idx) => (
                <motion.div
                  key={workout.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 },
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startWorkout(workout)}
                  role="button"
                  tabIndex={0}
                  className="glass-card p-4 flex items-center gap-4 text-left hover:border-brand-primary/30 transition-all group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-brand-primary/50 cursor-pointer w-full"
                >
                  <div className="shrink-0 relative z-10">
                     <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-brand-primary border border-zinc-800 transition-colors group-hover:border-brand-primary/30">
                        <Dumbbell size={24} />
                     </div>
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-[0.2em] block mb-0.5">
                      {workout.dayName}
                    </span>
                    <h3 className="text-xl font-black italic tracking-tight truncate uppercase leading-none">
                      {workout.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Zap size={10} className="text-amber-500" fill="currentColor" />
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                        {workout.exercises.length} EXERCÍCIOS
                      </p>
                    </div>
                  </div>
                  <div className="relative z-20 flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                         e.stopPropagation();
                         setEditingWorkout(workout);
                      }}
                      className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-500 hover:text-brand-primary hover:bg-black transition-colors"
                    >
                       <Edit2 size={16} />
                    </button>
                    <ChevronRight size={16} className="text-zinc-800 group-hover:text-brand-primary transition-colors ml-auto mr-1" />
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity rotate-12 pointer-events-none">
                    <Dumbbell size={100} weight="fill" />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => document.getElementById("import-input")?.click()}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                >
                  <Upload size={14} /> Importar
                  <input
                    id="import-input"
                    type="file"
                    className="hidden"
                    onChange={importData}
                    accept=".json"
                  />
                </button>
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                >
                  <Download size={14} /> Backup
                </button>
              </div>

              {!isResetting ? (
                <button
                  onClick={() => setIsResetting(true)}
                  className="flex items-center gap-2 px-6 py-2 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/10 transition-all"
                >
                  <RotateCcw size={12} /> Resetar para FULL BODY
                </button>
              ) : (
                <div className="flex gap-3 items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 animate-pulse">Confirmar reset?</span>
                  <button
                    onClick={handleResetToFullBody}
                    className="px-4 py-2 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest"
                  >
                    SIM
                  </button>
                  <button
                    onClick={() => setIsResetting(false)}
                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest"
                  >
                    NÃO
                  </button>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-900 rounded-full bg-[#030303]">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                  DESENVOLVIDO POR
                </span>
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em]">
                  MATEUS
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {editingWorkout && (
          <motion.div
            key="editing"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="space-y-6 pb-20"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditingWorkout(null)}
                  className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center hover:bg-zinc-800"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <div>
                   <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                     Editar <span className="text-brand-primary">{editingWorkout.dayName}</span>
                   </h2>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               {editingWorkout.exercises.map((ex, exIdx) => (
                  <div key={ex.id} className="glass-card p-4 flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <MovementIcon name={ex.name} index={exIdx + 1} />
                        <div>
                           <h4 className="font-black italic uppercase text-lg leading-tight">{ex.name}</h4>
                           <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Alvo: {ex.targetReps} reps</p>
                        </div>
                     </div>
                     <button
                        onClick={async () => {
                           if(confirm(`Remover ${ex.name}?`)) {
                              const newWorkouts = workouts.map(w => {
                                 if(w.id === editingWorkout.id) {
                                    return { ...w, exercises: w.exercises.filter(e => e.id !== ex.id) };
                                 }
                                 return w;
                              });
                              setWorkouts(newWorkouts);
                              setEditingWorkout({ ...editingWorkout, exercises: editingWorkout.exercises.filter(e => e.id !== ex.id) });

                              if (user) {
                                 try {
                                    const updatedWorkout = newWorkouts.find(w => w.id === editingWorkout.id);
                                    if (updatedWorkout) {
                                       const wPath = `users/${user.uid}/workouts/${editingWorkout.id}`;
                                       await setDoc(doc(db, `users/${user.uid}/workouts`, editingWorkout.id), { 
                                          ...updatedWorkout, 
                                          userId: user.uid, 
                                          updatedAt: serverTimestamp() 
                                       }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, wPath));
                                    }
                                 } catch (e) {
                                    console.error("Erro ao remover exercício no Firestore", e);
                                 }
                              }
                           }
                        }}
                        className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/20 flex items-center justify-center transition-all"
                     >
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))}
               {isAddingEx ? (
                  <div className="glass-card p-6 space-y-4 border-zinc-800/50">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Nome do Exercício</label>
                        <input 
                           autoFocus
                           type="text" 
                           value={newExName}
                           onChange={(e) => setNewExName(e.target.value)}
                           className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-tight focus:border-brand-primary/50 focus:outline-none text-zinc-200"
                           placeholder="Ex: Supino Inclinado"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Meta Reps</label>
                           <input 
                              type="number" 
                              value={newExTarget}
                              onChange={(e) => setNewExTarget(parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-primary/50 focus:outline-none text-zinc-200"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Carga Inicial (KG)</label>
                           <input 
                              type="number" 
                              value={newExPr}
                              onChange={(e) => setNewExPr(parseInt(e.target.value) || 0)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold focus:border-brand-primary/50 focus:outline-none text-zinc-200"
                           />
                        </div>
                     </div>
                     <div className="flex gap-2 pt-2">
                        <button 
                           onClick={() => setIsAddingEx(false)}
                           className="flex-1 py-3 bg-zinc-900 text-zinc-500 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-colors"
                        >
                           Cancelar
                        </button>
                        <button 
                           onClick={async () => {
                              if (!newExName) return;
                              
                              const newEx: Exercise = {
                                 id: crypto.randomUUID(),
                                 name: newExName,
                                 targetReps: newExTarget,
                                 increment: 1,
                                 prWeight: newExPr,
                                 lastWeight: 0,
                                 lastReps: 0
                              };
                              
                              const newWorkouts = workouts.map(w => {
                                 if(w.id === editingWorkout.id) {
                                    return { ...w, exercises: [...w.exercises, newEx] };
                                 }
                                 return w;
                              });

                              setWorkouts(newWorkouts);
                              setEditingWorkout({ ...editingWorkout, exercises: [...editingWorkout.exercises, newEx] });
                              
                              if (user) {
                                 try {
                                    const updatedWorkout = newWorkouts.find(w => w.id === editingWorkout.id);
                                    if (updatedWorkout) {
                                       const wPath = `users/${user.uid}/workouts/${editingWorkout.id}`;
                                       await setDoc(doc(db, `users/${user.uid}/workouts`, editingWorkout.id), { 
                                          ...updatedWorkout, 
                                          userId: user.uid, 
                                          updatedAt: serverTimestamp() 
                                       }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.WRITE, wPath));
                                    }
                                 } catch (e) {
                                    console.error("Erro ao salvar exercício no Firestore", e);
                                 }
                              }

                              setIsAddingEx(false);
                              setNewExName("");
                              setNewExTarget(8);
                              setNewExPr(20);
                           }}
                           className="flex-1 py-3 bg-brand-primary text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                           Salvar
                        </button>
                     </div>
                  </div>
               ) : (
                  <button
                     onClick={() => setIsAddingEx(true)}
                     className="w-full py-4 border-2 border-dashed border-zinc-800 rounded-[2rem] text-zinc-500 uppercase font-black text-xs tracking-widest flex items-center justify-center gap-2 hover:border-brand-primary/50 hover:text-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                     <Plus size={16} /> Adicionar Exercício
                  </button>
               )}
            </div>
            
            <div className="pt-8">
               <button 
                  onClick={() => setEditingWorkout(null)}
                  className="w-full py-4 bg-white text-zinc-950 font-black rounded-[2rem] text-sm uppercase tracking-widest"
               >
                  Concluir Edição
               </button>
            </div>
          </motion.div>
        )}

        {showHistory && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-secondary/20 flex items-center justify-center text-brand-secondary">
                  <History size={24} />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">
                  MEU LOG
                </h2>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="p-3 bg-zinc-900 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center glass-card border-dashed">
                  <RotateCcw className="text-zinc-700 mb-4" size={40} />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">
                    Vazio por enquanto
                  </p>
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
                        <h4 className="font-black italic text-xl uppercase tracking-tighter">
                          {
                            workouts.find((w) => w.id === session.workoutId)
                              ?.title
                          }
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                          {new Date(session.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="p-2 px-3 bg-zinc-800 rounded-lg text-[10px] font-black text-brand-primary">
                        HISTÓRICO
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {session.logs.slice(0, 3).map((log) => {
                        const exercise = workouts
                          .flatMap((w) => w.exercises)
                          .find((e) => e.id === log.exerciseId);
                        const bestWorkSet = log.sets
                          .filter((s) => s.type === "work" && s.completed)
                          .reduce(
                            (prev, curr) =>
                              curr.weight >= prev.weight ? curr : prev,
                            log.sets[0],
                          );

                        return (
                          <div
                            key={log.exerciseId}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="text-zinc-400 font-medium">
                              {exercise?.name}
                            </span>
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="pb-40"
          >
            <div className="sticky top-6 z-50 glass-card p-4 flex items-center justify-between mb-12 shadow-2xl shadow-black">
              <button
                onClick={() => {
                  if (showAbortConfirm) {
                    setActiveWorkoutId(null);
                    setCurrentSession(null);
                    setShowAbortConfirm(false);
                  } else {
                    setShowAbortConfirm(true);
                    setTimeout(() => setShowAbortConfirm(false), 3000);
                  }
                }}
                className={`text-[10px] font-black uppercase tracking-widest px-4 transition-colors ${showAbortConfirm ? 'text-rose-500' : 'text-zinc-500'}`}
              >
                {showAbortConfirm ? "Certeza?" : "Sair"}
              </button>
              <div className="text-center">
                <h2 className="text-lg font-black italic tracking-tighter uppercase text-brand-primary leading-none">
                  {activeWorkout.title}
                </h2>
                <p className="text-[8px] font-black tracking-[0.3em] uppercase text-zinc-500 mt-1">
                  Sessão Ativa
                </p>
              </div>
              <button
                onClick={previewSummary}
                className="bg-white text-zinc-950 text-[10px] px-5 py-2.5 rounded-xl font-black uppercase tracking-widest"
              >
                Finalizar
              </button>
            </div>

            <div className="space-y-4">
              {activeWorkout.exercises.map((exercise, exIdx) => {
                const log = currentSession.logs.find(
                  (l) => l.exerciseId === exercise.id,
                );
                return (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: exIdx * 0.05 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 bg-zinc-900 rounded flex items-center justify-center text-[10px] font-black text-brand-primary border border-zinc-800">
                          {exIdx + 1}
                        </div>
                        <h3 className="text-sm font-black tracking-tight italic uppercase truncate">
                          {exercise.name}
                        </h3>
                      </div>
                      <div className="inner-glass px-1.5 py-0.5 flex items-center gap-1 border-amber-500/20 bg-amber-500/5">
                        <Trophy size={8} className="text-amber-500" />
                        <span className="text-[8px] font-black uppercase text-amber-500">
                          PR: {exercise.prWeight}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {log?.sets.map((set, setIdx) => (
                        <motion.div
                          key={set.id}
                          layout
                          className={`flex items-center gap-1.5 p-1.5 rounded-xl transition-all ${
                            set.completed
                              ? "bg-zinc-900/40 border border-brand-primary/20"
                              : "bg-[#050505] border border-zinc-900"
                          }`}
                        >
                          <div className="w-10 flex flex-col items-center justify-center gap-0.5">
                            <span className="text-[6px] font-black text-zinc-700 uppercase leading-none">SEQ</span>
                            <span className="text-xs font-black text-brand-primary leading-none">{setIdx + 1}</span>
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-1.5">
                            <div className="relative">
                              <button 
                                onClick={() => updateSet(exercise.id, set.id, { weight: Math.max(0, (set.weight || 0) - 1) })}
                                className="absolute left-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center text-zinc-600 active:bg-brand-primary/20 rounded-l-lg"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                value={set.weight || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  updateSet(exercise.id, set.id, {
                                    weight: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-[#0a0a0a] text-center py-3.5 px-8 rounded-lg font-mono text-lg font-black focus:ring-1 focus:ring-brand-primary/40 placeholder:text-zinc-800"
                              />
                              <button 
                                onClick={() => updateSet(exercise.id, set.id, { weight: (set.weight || 0) + 1 })}
                                className="absolute right-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center text-zinc-600 active:bg-brand-primary/20 rounded-r-lg"
                              >
                                <Plus size={16} />
                              </button>
                              <span className="absolute -top-1 left-2 text-[6px] font-black text-zinc-700 uppercase bg-[#050505] px-1">
                                KG
                              </span>
                            </div>
                            <div className="relative">
                              <button 
                                onClick={() => updateSet(exercise.id, set.id, { reps: Math.max(0, (set.reps || 0) - 1) })}
                                className="absolute left-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center text-zinc-600 active:bg-brand-primary/20 rounded-l-lg"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                value={set.reps || ""}
                                placeholder="0"
                                onChange={(e) =>
                                  updateSet(exercise.id, set.id, {
                                    reps: Number(e.target.value),
                                  })
                                }
                                className="w-full bg-[#0a0a0a] text-center py-3.5 px-8 rounded-lg font-mono text-lg font-black focus:ring-1 focus:ring-brand-primary/40 placeholder:text-zinc-800"
                              />
                              <button 
                                onClick={() => updateSet(exercise.id, set.id, { reps: (set.reps || 0) + 1 })}
                                className="absolute right-0 top-0 bottom-0 w-10 z-10 flex items-center justify-center text-zinc-600 active:bg-brand-primary/20 rounded-r-lg"
                              >
                                <Plus size={16} />
                              </button>
                              <span className="absolute -top-1 left-2 text-[6px] font-black text-zinc-700 uppercase bg-[#050505] px-1">
                                REPS
                              </span>
                            </div>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              updateSet(exercise.id, set.id, {
                                completed: !set.completed,
                              })
                            }
                            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-all shrink-0 ${
                              set.completed
                                ? "bg-brand-primary text-white"
                                : "bg-zinc-800 text-zinc-600"
                            }`}
                          >
                            {set.completed ? (
                              <CheckCircle2 size={24} />
                            ) : (
                              <div className="w-6 h-6 border-2 border-zinc-700 rounded-full" />
                            )}
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>

                    <div className="flex gap-2 justify-center py-1">
                      <button 
                        onClick={() => addSet(exercise.id, "warmup")}
                        className="px-2 py-1 rounded-md border border-zinc-800 text-zinc-700 text-[8px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-colors"
                      >
                        + AQUEL.
                      </button>
                      <button 
                        onClick={() => addSet(exercise.id, "work")}
                        className="px-2 py-1 rounded-md bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest hover:bg-brand-primary/10 transition-colors"
                      >
                        + SÉRIE
                      </button>
                      <button 
                        onClick={() => {
                          const log = currentSession.logs.find(l => l.exerciseId === exercise.id);
                          if (log && log.sets.length > 0) {
                            removeSet(exercise.id, log.sets[log.sets.length - 1].id);
                          }
                        }}
                        className="px-2 py-1 rounded-md border border-rose-500/10 text-rose-500/30 text-[8px] font-black uppercase hover:bg-rose-500/5 transition-colors"
                      >
                         Remover
                      </button>
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
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#050505] flex flex-col pt-12 px-5 sm:px-8 overflow-y-auto pb-12"
          >
            <header className="mb-8 flex justify-between items-center mt-4">
              <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                TREINO
                <br />
                <span className="text-brand-primary">FINALIZADO</span>
              </h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                onClick={closeSummary}
                className="p-4 bg-zinc-900 rounded-full"
              >
                <X size={24} />
              </motion.button>
            </header>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="glass-card p-6 flex flex-col items-center justify-center gap-2 border-emerald-500/20 bg-emerald-500/5">
                <ArrowUpCircle size={28} className="text-emerald-500" />
                <span className="text-4xl font-black font-mono tracking-tighter">
                  {getSummaryStats().prs}
                </span>
                <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-[0.2em] text-center">
                  RECORDES BATIDOS
                </span>
              </div>
              <div className="glass-card p-6 flex flex-col items-center justify-center gap-2 border-zinc-800 bg-zinc-900/10">
                <RotateCcw size={28} className="text-zinc-500" />
                <span className="text-4xl font-black font-mono tracking-tighter">
                  {getSummaryStats().missed}
                </span>
                <span className="text-[9px] font-black text-zinc-500/50 uppercase tracking-[0.2em] text-center">
                  SEM PROGRESSO
                </span>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6 mb-12 relative border-brand-secondary/30 premium-gradient overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-[0.05] pointer-events-none">
                <Sparkles className="text-brand-secondary" size={120} />
              </div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-8 h-8 shrink-0 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                  <Zap size={16} fill="currentColor" />
                </div>
                <h3 className="text-[11px] sm:text-sm font-black uppercase tracking-[0.1em] text-brand-secondary">
                  ANÁLISE DO COACH IA
                </h3>
              </div>

              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3 relative z-10">
                  <div className="w-8 h-8 border-4 border-brand-secondary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(20,184,166,0.3)]" />
                  <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest text-center mt-2 animate-pulse">
                    Analisando intensidade...
                  </p>
                </div>
              ) : (
                <div className="relative z-10 p-4 sm:p-5 bg-black/40 rounded-2xl border border-brand-secondary/10 shadow-inner">
                  <p className="text-xs sm:text-sm font-medium leading-relaxed italic text-zinc-200">
                    "{aiFeedback}"
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4 mb-16">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] ml-2">
                DETALHAMENTO DO TREINO
              </h4>
              {currentSession?.logs.map((log) => {
                const ex = activeWorkout?.exercises.find(
                  (e) => e.id === log.exerciseId,
                );
                const workSets = log.sets.filter(
                  (s) => s.type === "work" && s.completed,
                );
                const bestSet =
                  workSets.length > 0
                    ? workSets.reduce((p, c) => (c.reps >= p.reps ? c : p))
                    : null;
                const success = ex && bestSet && bestSet.reps >= ex.targetReps;

                return (
                  <div
                    key={log.exerciseId}
                    className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-[2rem] border border-zinc-800/50 backdrop-blur-sm"
                  >
                    <div>
                      <p className="font-black italic uppercase tracking-tighter text-xl">
                        {ex?.name}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                        {bestSet
                          ? `${bestSet.weight}KG × ${bestSet.reps}`
                          : "N/A"}{" "}
                        <span className="mx-2">|</span> META: {ex?.targetReps}
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
                        <span className="text-[8px] font-black text-emerald-500/60 uppercase">
                          EVOLUIU
                        </span>
                      </motion.div>
                    ) : (
                      <div className="px-3 py-1 bg-zinc-800 text-zinc-500 font-black text-[10px] rounded-full uppercase">
                        MANTER
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeSummary}
                className="w-full py-6 bg-zinc-900 border border-zinc-800 text-zinc-300 font-black rounded-3xl text-sm uppercase tracking-widest shadow-xl"
              >
                VOLTAR AO TREINO
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveAndCloseWorkout}
                className="w-full py-6 bg-brand-primary text-zinc-950 font-black rounded-3xl text-sm uppercase tracking-widest shadow-xl shadow-brand-primary/20"
              >
                SALVAR E SAIR
              </motion.button>
            </div>
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
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1">
                  INTENSIDADE MÁXIMA
                </p>
                <p className="font-black italic text-sm uppercase tracking-tighter text-zinc-200">
                  {activeWorkout?.title}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              onClick={previewSummary}
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
