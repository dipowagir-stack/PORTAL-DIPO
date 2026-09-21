import { RuleContext } from '../../../foundation/ruleEngine/RuleContext';
import { RuleResult } from '../../../foundation/ruleEngine/RuleResult';
import { IRule } from '../../../foundation/ruleEngine/types';
import { AcademicSchedule } from '../types';

export class BlockIntegrityRule implements IRule {
  id = 'block-integrity-rule';
  name = 'Block Integrity';
  description = 'Penalti jika pelajaran yang sama terpecah dalam satu hari.';

  evaluate(context: RuleContext): RuleResult {
    const schedule = context.params.schedule as AcademicSchedule[];
    if (!schedule) return { passed: true, score: 0, type: 'soft' };

    let penalty = 0;
    const scheduleByClassDaySubject: Record<string, AcademicSchedule[]> = {};

    schedule.forEach(s => {
      const key = `${s.classId || s.className}-${s.dayIndex}-${s.subject}`;
      if (!scheduleByClassDaySubject[key]) scheduleByClassDaySubject[key] = [];
      scheduleByClassDaySubject[key].push(s);
    });

    Object.values(scheduleByClassDaySubject).forEach(slots => {
      if (slots.length <= 1) return;
      
      // Sort by periodIndex
      slots.sort((a, b) => a.periodIndex - b.periodIndex);
      
      // Check for gaps
      for (let i = 1; i < slots.length; i++) {
        if (slots[i].periodIndex - slots[i - 1].periodIndex > 1) {
          penalty -= 20; // 20 points penalty per gap
        }
      }
    });

    return {
      passed: true,
      score: penalty,
      type: 'soft',
      message: penalty < 0 ? 'Beberapa jam pelajaran terpecah (tidak berurutan).' : 'Block integrity terjaga.',
      details: { penalty }
    };
  }
}

export class TeacherIdleTimeRule implements IRule {
  id = 'teacher-idle-time-rule';
  name = 'Teacher Idle Time';
  description = 'Penalti jika ada jam kosong di antara jam mengajar guru.';

  evaluate(context: RuleContext): RuleResult {
    const schedule = context.params.schedule as AcademicSchedule[];
    if (!schedule) return { passed: true, score: 0, type: 'soft' };

    let penalty = 0;
    const scheduleByTeacherDay: Record<string, AcademicSchedule[]> = {};

    schedule.forEach(s => {
      const key = `${s.teacherId}-${s.dayIndex}`;
      if (!scheduleByTeacherDay[key]) scheduleByTeacherDay[key] = [];
      scheduleByTeacherDay[key].push(s);
    });

    Object.values(scheduleByTeacherDay).forEach(slots => {
      if (slots.length <= 1) return;
      
      slots.sort((a, b) => a.periodIndex - b.periodIndex);
      
      let dayPenalty = 0;
      for (let i = 1; i < slots.length; i++) {
        const gap = slots[i].periodIndex - slots[i - 1].periodIndex - 1;
        if (gap > 0) {
          dayPenalty -= (10 * gap); // 10 points penalty per idle hour
        }
      }
      penalty += dayPenalty;
    });

    return {
      passed: true,
      score: penalty,
      type: 'soft',
      message: penalty < 0 ? 'Terdapat jam bolong (idle time) pada jadwal guru.' : 'Tidak ada jam bolong.',
      details: { penalty }
    };
  }
}

export class CognitiveLoadRule implements IRule {
  id = 'cognitive-load-rule';
  name = 'Cognitive Load';
  description = 'Penalti jika mata pelajaran berat ditaruh di jam siang.';

  private heavySubjects = ['MATEMATIKA', 'FISIKA', 'KIMIA', 'BIOLOGI']; // Bisa diambil dari config

  evaluate(context: RuleContext): RuleResult {
    const schedule = context.params.schedule as AcademicSchedule[];
    if (!schedule) return { passed: true, score: 0, type: 'soft' };

    let penalty = 0;

    schedule.forEach(s => {
      const isHeavy = this.heavySubjects.some(h => s.subject.toUpperCase().includes(h));
      // Jika berat tapi di jam 5 atau 6
      if (isHeavy && s.periodIndex >= 5) {
        penalty -= 5;
      }
    });

    return {
      passed: true,
      score: penalty,
      type: 'soft',
      message: penalty < 0 ? 'Ada pelajaran berat di jam rawan (siang).' : 'Distribusi kognitif baik.',
      details: { penalty }
    };
  }
}

export class SubjectSpreadRule implements IRule {
  id = 'subject-spread-rule';
  name = 'Subject Spread';
  description = 'Penalti jika satu mapel muncul terlalu banyak dalam satu hari.';

  evaluate(context: RuleContext): RuleResult {
    const schedule = context.params.schedule as AcademicSchedule[];
    if (!schedule) return { passed: true, score: 0, type: 'soft' };

    let penalty = 0;
    const scheduleByClassDaySubject: Record<string, number> = {};

    schedule.forEach(s => {
      const key = `${s.classId || s.className}-${s.dayIndex}-${s.subject}`;
      scheduleByClassDaySubject[key] = (scheduleByClassDaySubject[key] || 0) + 1;
    });

    Object.values(scheduleByClassDaySubject).forEach(count => {
      if (count > 2) {
        // Jika lebih dari 2 jam di hari yang sama, penalti (kecuali mapel khusus, but for now simple check)
        penalty -= (count - 2) * 15; 
      }
    });

    return {
      passed: true,
      score: penalty,
      type: 'soft',
      message: penalty < 0 ? 'Beberapa mapel menumpuk di hari yang sama.' : 'Distribusi mapel per hari baik.',
      details: { penalty }
    };
  }
}
