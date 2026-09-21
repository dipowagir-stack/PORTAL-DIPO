export interface RuleResult {
  passed: boolean;
  message?: string;
  details?: any;
  score?: number;
  type?: 'hard' | 'soft';
}
