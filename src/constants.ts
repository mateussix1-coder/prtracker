import { WorkoutDay } from './types';

export const INITIAL_WORKOUTS: WorkoutDay[] = [
  {
    id: 'fb-a',
    title: 'Full Body - Estímulo A',
    dayName: 'Sessão 1',
    exercises: [
      { id: 'a1', name: 'Agachamento Livre', targetReps: 6, increment: 4, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'a2', name: 'Supino Reto', targetReps: 6, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'a3', name: 'Remada Curvada', targetReps: 8, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'a4', name: 'Desenvolvimento Halter', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  },
  {
    id: 'fb-b',
    title: 'Full Body - Estímulo B',
    dayName: 'Sessão 2',
    exercises: [
      { id: 'b1', name: 'Leg Press 45°', targetReps: 10, increment: 10, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'b2', name: 'Supino Inclinado Máquina', targetReps: 8, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'b3', name: 'Puxada Alta Unilateral', targetReps: 10, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'b4', name: 'Elevação Lateral', targetReps: 12, increment: 1, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  },
  {
    id: 'fb-c',
    title: 'Full Body - Estímulo C',
    dayName: 'Sessão 3',
    exercises: [
      { id: 'c1', name: 'Stiff (Posterior)', targetReps: 8, increment: 4, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'c2', name: 'Paralelas / Mergulho', targetReps: 8, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'c3', name: 'Remada Baixa', targetReps: 8, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'c4', name: 'Rosca Direta Polia', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  },
  {
    id: 'fb-d',
    title: 'Full Body - Estímulo D',
    dayName: 'Sessão 4',
    exercises: [
      { id: 'd1', name: 'Cadeira Extensora', targetReps: 12, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'd2', name: 'Crossover Polia Alta', targetReps: 12, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'd3', name: 'Barra Fixa / Graviton', targetReps: 8, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'd4', name: 'Tríceps Pulley', targetReps: 12, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  }
];
