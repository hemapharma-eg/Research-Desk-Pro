import jsPDF from 'jspdf';
import type { StudyState } from '../context/PowerWizardContext';
import html2canvas from 'html2canvas';

function getGuidelinesCitation(state: StudyState): string {
  const guidelines: string[] = [];
  
  // Always cite CONSORT for clinical RCTs
  if (state.researchSetting === 'human') {
    guidelines.push('CONSORT 2010 Statement (Schulz KF, Altman DG, Moher D. BMJ 2010;340:c332)');
    guidelines.push('ICH E9 Statistical Principles for Clinical Trials');
  }
  
  // Always cite ARRIVE for preclinical
  if (state.researchSetting === 'preclinical') {
    guidelines.push('ARRIVE Guidelines 2.0 (Percie du Sert N, et al. PLoS Biol 2020;18(7):e3000410)');
    guidelines.push('NC3Rs Experimental Design Assistant (https://eda.nc3rs.org.uk)');
    guidelines.push('PREPARE Guidelines (Smith AJ, et al. Lab Anim 2018;52(2):135-141)');
  }
  
  // General sample size references
  guidelines.push('Chow SC, Shao J, Wang H, Lokhnygina Y. Sample Size Calculations in Clinical Research, 3rd Ed. CRC Press, 2017');
  guidelines.push('Cohen J. Statistical Power Analysis for the Behavioral Sciences, 2nd Ed. Routledge, 1988');
  
  return guidelines.map((g, i) => `[${i + 1}] ${g}`).join('\n');
}

export function generateMethodsText(state: StudyState, results: any): string {
  const { 
    researchSetting, 
    endpointFamily, 
    analysisModel, 
    alpha, 
    power, 
    sidedness, 
    allocationRatio, 
    attrition, 
    assumptions,
    speciesModel,
    trueExperimentalUnit,
    nestingStructure 
  } = state;

  let text = `Sample size was calculated a priori using Power Analysis Studio (ReseolabX). `;

  // 1. General Framework & Operating Characteristics
  text += `To achieve ${power * 100}% statistical power at a ${sidedness || 'two-sided'} alpha level of ${alpha}, `;
  
  // 2. Preclinical Specific Details (if applicable)
  if (researchSetting === 'preclinical') {
    const species = speciesModel?.species ? speciesModel.species : 'an animal model';
    text += `the study will utilize ${species} with the true experimental unit defined as the ${trueExperimentalUnit?.replace('_', ' ') || 'individual animal'}. `;
    if (nestingStructure?.repeatedMeasures || nestingStructure?.groupedHousing) {
      text += `Due to ${nestingStructure.repeatedMeasures ? 'repeated measures' : ''} ${nestingStructure.groupedHousing ? 'and grouped housing' : ''}, a mixed-effects model or appropriate cluster adjustment is mandated to prevent pseudoreplication. `;
    }
    text += `This calculation adheres to the ARRIVE Guidelines 2.0 and NC3Rs recommendations for transparent reporting of animal research. `;
  }

  if (researchSetting === 'human') {
    text += `reporting follows CONSORT 2010 recommendations for transparent trial methodology. `;
  }

  // 3. Mathematical Core
  const modelName = analysisModel ? analysisModel.replace(/_/g, ' ') : 'standard parametric test';
  text += `A ${modelName} will be the primary analysis method for the ${endpointFamily} endpoint. `;

  if (endpointFamily === 'continuous') {
    text += `Under the assumption of a mean difference of ${assumptions?.meanDifference || 'X'} and a pooled standard deviation of ${assumptions?.standardDeviation || 'Y'}, `;
  } else if (endpointFamily === 'binary') {
    text += `Assuming baseline event rates of ${(assumptions?.p1 || 0) * 100}% and ${(assumptions?.p2 || 0) * 100}%, `;
  } else if (endpointFamily === 'survival') {
    text += `Assuming a hazard ratio of ${assumptions?.hazardRatio || 'X'} against a median control survival of ${assumptions?.medianSurvival || 'Y'} months, `;
  }

  // 4. Sample Size Declarations
  if (state.designStructure === 'multi_arm') {
    const nGroups = state.numberOfGroups || 3;
    const perGroup = results.n1 || Math.ceil(results.totalN / nGroups);
    text += `a total of ${results.totalN} subjects across ${nGroups} groups (${perGroup} per group) are required. `;
  } else if (results.n1 && results.n2) {
    const ratioText = allocationRatio !== 1 ? ` (allocation ratio ${allocationRatio}:1)` : ` (1:1 allocation)`;
    text += `the required total sample size lies at ${results.totalN - (state.attrition ? Math.ceil(results.totalN * (state.attrition / (1 + state.attrition))) : 0)}${ratioText}. `;
  } else {
    text += `the required raw sample size lies at ${results.totalN - (state.attrition ? Math.ceil(results.totalN * (state.attrition / (1 + state.attrition))) : 0)}. `;
  }

  // 5. Attrition / Logistics Buffer
  if (attrition && attrition > 0) {
    text += `To account for an anticipated attrition or dropout rate of ${(attrition * 100).toFixed(0)}%, the final target sample size is inflated to ${results.totalN}.`;
  }

  return text;
}

export function exportToTxt(state: StudyState, results: any) {
  const methodsText = generateMethodsText(state, results);
  const citations = getGuidelinesCitation(state);
  
  const content = 
    `================================================================\n` +
    `  POWER ANALYSIS — Calculation Report\n` +
    `  Generated by Power Analysis Studio (ReseolabX)\n` +
    `  Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n` +
    `================================================================\n\n` +
    `1. MANUSCRIPT-READY METHODS TEXT\n` +
    `--------------------------------\n\n` +
    `${methodsText}\n\n` +
    `================================================================\n` +
    `2. STATISTICAL PARAMETERS\n` +
    `--------------------------------\n\n` +
    `Total N: ${results.totalN}\n` +
    (state.designStructure === 'multi_arm'
      ? `Per Group N: ${results.n1} × ${state.numberOfGroups} groups\n`
      : (results.n1 ? `Group 1 N: ${results.n1}\n` : '') + (results.n2 ? `Group 2 N: ${results.n2}\n` : '')) +
    `Power: ${state.power * 100}%\n` +
    `Alpha: ${state.alpha}\n` +
    `Sidedness: ${state.sidedness}\n` +
    `Attrition buffer: ${(state.attrition * 100).toFixed(0)}%\n` +
    `Design: ${state.designStructure || 'N/A'}\n` +
    `Endpoint Family: ${state.endpointFamily || 'N/A'}\n` +
    `Analysis Model: ${state.analysisModel || 'N/A'}\n\n` +
    `================================================================\n` +
    `3. REGULATORY GUIDELINES & REFERENCES\n` +
    `--------------------------------\n\n` +
    `${citations}\n\n` +
    `================================================================\n` +
    `  End of Report\n` +
    `================================================================\n`;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `power_analysis_report_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportToPdf(state: StudyState, results: any, element?: HTMLElement | null) {
  const doc = new jsPDF();
  const methodsText = generateMethodsText(state, results);
  const citations = getGuidelinesCitation(state);
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- PAGE 1: Header + Methods + Summary ---
  
  // Header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('POWER ANALYSIS', 20, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Calculation Report — ReseolabX', 20, 28);

  // Date line
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 42);

  // Section 1: Methods Text
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Manuscript-Ready Methods Text', 20, 55);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const splitText = doc.splitTextToSize(methodsText, 170);
  doc.text(splitText, 20, 65);

  // Calculate Y position after methods text
  const methodsEndY = 65 + (splitText.length * 5);

  // Section 2: Statistical Summary
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Statistical Summary', 20, methodsEndY + 10);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  
  let summaryY = methodsEndY + 20;
  doc.text(`Total Sample Size (N): ${results.totalN}`, 20, summaryY);
  summaryY += 8;
  
  if (state.designStructure === 'multi_arm') {
    doc.text(`Per Group (N): ${results.n1} × ${state.numberOfGroups} groups`, 20, summaryY);
  } else {
    if (results.n1) doc.text(`Group 1 (N): ${results.n1}`, 20, summaryY);
    summaryY += 8;
    if (results.n2) doc.text(`Group 2 (N): ${results.n2}`, 20, summaryY);
  }
  summaryY += 12;
  
  doc.text(`Target Power: ${state.power * 100}%`, 20, summaryY);
  doc.text(`Type I Error (Alpha): ${state.alpha} (${state.sidedness})`, 20, summaryY + 8);
  doc.text(`Attrition Buffer: ${(state.attrition * 100).toFixed(0)}%`, 20, summaryY + 16);
  doc.text(`Design Structure: ${state.designStructure || 'N/A'}`, 20, summaryY + 24);
  doc.text(`Analysis Model: ${state.analysisModel?.replace(/_/g, ' ') || 'N/A'}`, 20, summaryY + 32);

  // Section 3: Guidelines (bottom of page 1)
  const guidelinesY = summaryY + 50;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Regulatory Guidelines & References', 20, guidelinesY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const splitCitations = doc.splitTextToSize(citations, 170);
  doc.text(splitCitations, 20, guidelinesY + 10);

  // Footer on page 1
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Power Analysis Studio — ReseolabX', 20, 290);
  doc.text('Page 1', pageWidth - 30, 290);

  // --- PAGE 2: Dashboard Visuals ---
  if (element) {
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      doc.addPage();
      
      // Header bar on page 2
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('POWER ANALYSIS — Dashboard Visuals', 20, 16);
      
      const imgWidth = 170;
      const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 240);
      doc.addImage(imgData, 'PNG', 20, 35, imgWidth, imgHeight);

      // Footer on page 2
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Power Analysis Studio — ReseolabX', 20, 290);
      doc.text('Page 2', pageWidth - 30, 290);
    } catch (e) {
      console.error("Failed to capture visuals for PDF:", e);
    }
  }

  doc.save(`power_analysis_report_${new Date().toISOString().slice(0,10)}.pdf`);
}
