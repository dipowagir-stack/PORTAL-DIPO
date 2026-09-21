import { RulePipeline } from '../../../foundation/ruleEngine/RulePipeline';
import { RuleContext } from '../../../foundation/ruleEngine/RuleContext';
import { AcademicSchedule } from '../types';
import { 
  BlockIntegrityRule, 
  TeacherIdleTimeRule, 
  CognitiveLoadRule, 
  SubjectSpreadRule 
} from '../rules/SchedulingRules';

export class ScheduleOptimizerService {
  private pipeline: RulePipeline;

  constructor() {
    // Pipeline with failFast = false so we evaluate all soft constraints
    this.pipeline = new RulePipeline(false);
    this.pipeline.addRule(new BlockIntegrityRule());
    this.pipeline.addRule(new TeacherIdleTimeRule());
    this.pipeline.addRule(new CognitiveLoadRule());
    this.pipeline.addRule(new SubjectSpreadRule());
  }

  /**
   * Evaluates a schedule and returns its total score
   */
  async evaluateSchedule(schedule: AcademicSchedule[]): Promise<number> {
    const context: RuleContext = {
      params: { schedule },
      state: {}
    };
    
    const result = await this.pipeline.execute(context);
    
    let totalScore = 0;
    Object.values(result.results).forEach(r => {
      if (r.score !== undefined) {
        totalScore += r.score;
      }
    });

    return totalScore;
  }

  /**
   * Attempts to repair (patch) a flawed schedule using a Hill Climbing approach
   */
  async optimize(initialSchedule: AcademicSchedule[], maxIterations: number = 1000): Promise<{ optimizedSchedule: AcademicSchedule[], initialScore: number, finalScore: number }> {
    let currentSchedule = JSON.parse(JSON.stringify(initialSchedule)) as AcademicSchedule[];
    let currentScore = await this.evaluateSchedule(currentSchedule);
    const initialScore = currentScore;

    if (currentScore === 0 || initialSchedule.length === 0) {
      return { optimizedSchedule: currentSchedule, initialScore, finalScore: currentScore };
    }

    for (let i = 0; i < maxIterations; i++) {
      // Pick a random class to swap within
      const classes = Array.from(new Set(currentSchedule.map(s => s.className)));
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      
      const classSlots = currentSchedule.filter(s => s.className === randomClass);
      if (classSlots.length < 2) continue;

      // Pick two random slots in that class
      const idx1 = Math.floor(Math.random() * classSlots.length);
      let idx2 = Math.floor(Math.random() * classSlots.length);
      while (idx1 === idx2) {
        idx2 = Math.floor(Math.random() * classSlots.length);
      }

      const slot1 = classSlots[idx1];
      const slot2 = classSlots[idx2];

      // Deep copy to test swap
      const candidateSchedule = JSON.parse(JSON.stringify(currentSchedule)) as AcademicSchedule[];
      
      // Find these slots in the candidate
      const candSlot1 = candidateSchedule.find(s => s.id === slot1.id || (s.className === slot1.className && s.dayIndex === slot1.dayIndex && s.periodIndex === slot1.periodIndex));
      const candSlot2 = candidateSchedule.find(s => s.id === slot2.id || (s.className === slot2.className && s.dayIndex === slot2.dayIndex && s.periodIndex === slot2.periodIndex));

      if (!candSlot1 || !candSlot2) continue;

      // Check HARD CONFLICTS: If we swap, will the teachers be double-booked?
      const slot1NewDay = candSlot2.dayIndex;
      const slot1NewPeriod = candSlot2.periodIndex;
      
      const slot2NewDay = candSlot1.dayIndex;
      const slot2NewPeriod = candSlot1.periodIndex;

      const teacher1Conflict = candidateSchedule.some(s => 
        s.teacherId === candSlot1.teacherId && 
        s.className !== candSlot1.className &&
        s.dayIndex === slot1NewDay && 
        s.periodIndex === slot1NewPeriod
      );

      const teacher2Conflict = candidateSchedule.some(s => 
        s.teacherId === candSlot2.teacherId && 
        s.className !== candSlot2.className &&
        s.dayIndex === slot2NewDay && 
        s.periodIndex === slot2NewPeriod
      );

      if (teacher1Conflict || teacher2Conflict) {
        continue; // Invalid swap, try another
      }

      // Perform swap
      const tempDay = candSlot1.dayIndex;
      const tempPeriod = candSlot1.periodIndex;
      candSlot1.dayIndex = candSlot2.dayIndex;
      candSlot1.periodIndex = candSlot2.periodIndex;
      candSlot2.dayIndex = tempDay;
      candSlot2.periodIndex = tempPeriod;

      // Evaluate candidate
      const candidateScore = await this.evaluateSchedule(candidateSchedule);

      // If better, accept the swap
      if (candidateScore > currentScore) {
        currentSchedule = candidateSchedule;
        currentScore = candidateScore;
        
        // If we reached perfect score (0 penalties), stop early
        if (currentScore === 0) {
          break;
        }
      }
    }

    return {
      optimizedSchedule: currentSchedule,
      initialScore,
      finalScore: currentScore
    };
  }
}
