import { WorkoutDay } from './types';

export const INITIAL_WORKOUTS: WorkoutDay[] = [
  {
    id: 'upper-1',
    title: 'Superior 1',
    dayName: 'Segunda-feira',
    exercises: [
      { id: 'u1-1', name: 'Remada Curvada', targetReps: 6, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u1-2', name: 'Supino Inclinado Máquina', targetReps: 8, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u1-3', name: 'Puxada Alta Triângulo', targetReps: 8, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u1-4', name: 'Crucifixo', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u1-5', name: 'Tríceps Francês', targetReps: 10, increment: 1, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u1-6', name: 'Rosca Scott', targetReps: 8, increment: 1, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u1-7', name: 'Elevação Lateral Polia', targetReps: 12, increment: 1, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  },
  {
    id: 'lower-1',
    title: 'Inferior 1',
    dayName: 'Terça-feira',
    exercises: [
      { id: 'l1-1', name: 'Stiff', targetReps: 8, increment: 4, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l1-2', name: 'Leg Press 45°', targetReps: 8, increment: 10, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l1-3', name: 'Mesa Flexora', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l1-4', name: 'Extensora Unilateral', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l1-5', name: 'Cadeira Abdutora', targetReps: 12, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l1-6', name: 'Panturrilha Smith', targetReps: 10, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  },
  {
    id: 'upper-2',
    title: 'Superior 2',
    dayName: 'Quinta-feira',
    exercises: [
      { id: 'u2-1', name: 'Supino Reto', targetReps: 6, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u2-2', name: 'Puxada Alta', targetReps: 8, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u2-3', name: 'Remada Baixa Unilateral', targetReps: 8, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u2-4', name: 'Crossover Polia Alta', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u2-5', name: 'Tríceps Pulley', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u2-6', name: 'Rosca Banco Inclinado', targetReps: 10, increment: 1, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'u2-7', name: 'Elevação Lateral Halteres', targetReps: 12, increment: 1, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  },
  {
    id: 'lower-2',
    title: 'Inferior 2',
    dayName: 'Sexta-feira',
    exercises: [
      { id: 'l2-1', name: 'Agachamento Livre', targetReps: 6, increment: 4, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l2-2', name: 'Elevação Pélvica', targetReps: 8, increment: 10, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l2-3', name: 'Cadeira Flexora Unilateral', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l2-4', name: 'Mesa Flexora', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l2-5', name: 'Extensora Unilateral', targetReps: 10, increment: 2, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l2-6', name: 'Cadeira Adutora', targetReps: 12, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
      { id: 'l2-7', name: 'Panturrilha Smith', targetReps: 10, increment: 5, lastWeight: 0, lastReps: 0, prWeight: 0 },
    ]
  }
];
