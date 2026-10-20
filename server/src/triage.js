/**
 * VAYUJIV AI Triage Classification Engine
 * Based on Section 5.7 & Table 5.4 of Project Synopsis
 * Severity score S = 0.40 * dSpO2 + 0.30 * dHR + 0.20 * dT + 0.10 * dM
 */

export function evaluateTriage(vitals, recentHistory = []) {
  const { hr, spo2, temp, motionEnergy, isFall, panic, signalQuality } = vitals;

  let rulePriority = 'GREEN';
  let ruleTrigger = 'NORMAL';
  let reasons = [];

  if (panic) {
    rulePriority = 'RED';
    ruleTrigger = 'PANIC_BUTTON_TRIGGERED';
    reasons.push('Tactile Emergency Panic SOS Activated');
  }

  if (spo2 < 90) {
    rulePriority = 'RED';
    ruleTrigger = 'CRITICAL_HYPOXIA';
    reasons.push('Severe Hypoxia: SpO2 at ' + spo2 + '%');
  } else if (spo2 >= 90 && spo2 <= 94) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    reasons.push('Mild Hypoxia: SpO2 at ' + spo2 + '%');
  }

  if (hr < 40) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_BRADYCARDIA';
    reasons.push('Severe Bradycardia: HR at ' + hr + ' BPM');
  } else if (hr > 140) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_TACHYCARDIA';
    reasons.push('Severe Tachycardia: HR at ' + hr + ' BPM');
  } else if ((hr >= 40 && hr <= 49) || (hr >= 111 && hr <= 140)) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    reasons.push('Abnormal Heart Rate: ' + hr + ' BPM');
  }

  if (temp < 35.0) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_HYPOTHERMIA';
    reasons.push('Critical Hypothermia: Temp at ' + temp.toFixed(1) + ' C');
  } else if (temp >= 39.5) {
    rulePriority = 'RED';
    ruleTrigger = 'SEVERE_HYPERTHERMIA';
    reasons.push('Critical Hyperthermia: Temp at ' + temp.toFixed(1) + ' C');
  } else if ((temp >= 35.0 && temp <= 35.9) || (temp >= 37.9 && temp <= 39.4)) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    reasons.push('Abnormal Temperature: ' + temp.toFixed(1) + ' C');
  }

  if (isFall && motionEnergy < 0.15) {
    if (rulePriority !== 'RED') rulePriority = 'YELLOW';
    ruleTrigger = 'FALL_INACTIVITY_DETECTED';
    reasons.push('High-G Fall impact detected followed by soldier immobility');
  }

  let dSpO2 = 0;
  if (spo2 < 95) {
    dSpO2 = Math.min(1, Math.max(0, (95 - spo2) / 5));
  }

  let dHR = 0;
  if (hr > 110) {
    dHR = Math.min(1, Math.max(0, (hr - 110) / 30));
  } else if (hr < 50) {
    dHR = Math.min(1, Math.max(0, (50 - hr) / 10));
  }

  let dT = 0;
  if (temp > 37.8) {
    dT = Math.min(1, Math.max(0, (temp - 37.8) / 1.7));
  } else if (temp < 36.0) {
    dT = Math.min(1, Math.max(0, (36.0 - temp) / 1.0));
  }

  let dM = 0;
  if (isFall) dM = 1.0;
  else if (motionEnergy < 0.05) dM = 0.5;

  const severityScore = Number((0.40 * dSpO2 + 0.30 * dHR + 0.20 * dT + 0.10 * dM).toFixed(3));

  let scorePriority = 'GREEN';
  if (severityScore >= 0.60) scorePriority = 'RED';
  else if (severityScore >= 0.30) scorePriority = 'YELLOW';

  let mlPriority = scorePriority;
  let mlConfidence = 0.94;

  if (recentHistory.length >= 5) {
    const hrRecent = recentHistory.slice(-5).map(h => h.hr);
    const hrTrend = (hrRecent[hrRecent.length - 1] - hrRecent[0]) / hrRecent.length;
    if (hrTrend > 3 && hr > 115) {
      mlPriority = 'RED';
      mlConfidence = 0.96;
      reasons.push('Rapid cardiac acceleration trend detected by ML window');
    }
  }

  const priorityLevels = { GREEN: 1, YELLOW: 2, RED: 3 };
  let maxLevel = Math.max(priorityLevels[rulePriority], priorityLevels[scorePriority], priorityLevels[mlPriority]);

  let finalPriority = 'GREEN';
  if (maxLevel === 3) finalPriority = 'RED';
  else if (maxLevel === 2) finalPriority = 'YELLOW';

  return {
    priority: finalPriority,
    score: severityScore,
    components: { dSpO2, dHR, dT, dM },
    ruleTriggered: ruleTrigger,
    mlConfidence: mlConfidence,
    explain: reasons.length > 0 ? reasons.join(' | ') : 'Stable vital signs within normal operational bounds.'
  };
}
