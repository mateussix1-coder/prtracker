export type SetType = 'warmup' | 'work';

export interface ExerciseSet {
  id: string;
  type: SetType;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  targetReps: number;
  increment: number;
  lastWeight: number;
  lastReps: number;
  prWeight: number;
}

export interface WorkoutDay {
  id: string;
  title: string;
  dayName: string;
  exercises: Exercise[];
}

export interface TrainingSession {
  id: string;
  date: string;
  workoutId: string;
  logs: {
    exerciseId: string;
    sets: ExerciseSet[];
  }[];
}
