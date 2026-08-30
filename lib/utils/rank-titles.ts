export interface RankMilestone {
  percentage: number;
  title: string;
  threatLevel: string;
  flavorText: string;
  colorClass: string;
}

export function getRankMilestone(percentage: number): RankMilestone {
  if (percentage > 100) {
    return {
      percentage,
      title: 'Super-Science Overdrive',
      threatLevel: 'MISSION OVERACHIEVED / BONUS SIGHTINGS!',
      flavorText: 'Exceeded required parameters! Dr. Venture is taking all the credit.',
      colorClass: 'text-amber-300 bg-purple-950 border-amber-400 animate-pulse',
    };
  }

  if (percentage >= 100) {
    return {
      percentage: 100,
      title: 'Guild Sovereign',
      threatLevel: 'MISSION ACCOMPLISHED',
      flavorText: 'Required target goal acquired! Pure super-science perfection.',
      colorClass: 'text-amber-400 bg-slate-950 border-amber-400',
    };
  }

  if (percentage >= 80) {
    return {
      percentage,
      title: 'Council of 13 Leader',
      threatLevel: 'THREAT LEVEL: CRITICAL',
      flavorText: 'The Guild stands in awe of your squad.',
      colorClass: 'text-purple-300 bg-purple-950 border-purple-500',
    };
  }

  if (percentage >= 60) {
    return {
      percentage,
      title: 'Super-Scientist',
      threatLevel: 'THREAT LEVEL: HIGH',
      flavorText: 'Go Team Venture! You are dominating the con floor.',
      colorClass: 'text-orange-400 bg-slate-900 border-orange-500',
    };
  }

  if (percentage >= 40) {
    return {
      percentage,
      title: 'OSI Special Agent',
      threatLevel: 'THREAT LEVEL: ELEVATED',
      flavorText: 'Solid sightings logged across the host hotels.',
      colorClass: 'text-cyan-300 bg-slate-900 border-cyan-500',
    };
  }

  if (percentage >= 20) {
    return {
      percentage,
      title: 'Henchman Squad Leader (Two-Ton 21)',
      threatLevel: 'THREAT LEVEL: ACTIVE',
      flavorText: 'The butterfly wings are flapping. Keep hunting!',
      colorClass: 'text-amber-300 bg-slate-900 border-amber-400',
    };
  }

  return {
    percentage,
    title: 'Level 1 Henchman',
    threatLevel: 'THREAT LEVEL: STANDBY',
    flavorText: 'Report to your assigned hotel lobby post immediately.',
    colorClass: 'text-slate-300 bg-slate-900 border-slate-600',
  };
}
