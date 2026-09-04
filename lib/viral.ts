import {
  type DemographicsPayload,
  isShareable,
} from "./demographics";

export interface DemographicContrast {
  type: "gender" | "age_broad";
  title: string;
  labelA: string;
  scoreA: number;
  countA: number;
  labelB: string;
  scoreB: number;
  countB: number;
  difference: number;
  leadLabel: string;
}

/**
 * Encuentra la mayor discrepancia estadística entre grupos demográficos
 * verificados de una película. Si la película no cumple los requisitos de
 * compartición (isShareable), devuelve null para evitar viralizar datos no sólidos.
 */
export function getTopDemographicContrast(payload: DemographicsPayload): DemographicContrast | null {
  if (!isShareable(payload)) {
    return null;
  }

  const contrasts: DemographicContrast[] = [];

  // 1. Brecha por genero (mujeres vs hombres)
  const female = payload.real.byGender.female;
  const male = payload.real.byGender.male;
  if (female.avg !== null && male.avg !== null && female.count >= 3 && male.count >= 3) {
    const diff = parseFloat(Math.abs(female.avg - male.avg).toFixed(1));
    const leadLabel = female.avg >= male.avg ? "Mujeres" : "Hombres";
    contrasts.push({
      type: "gender",
      title: "Brecha por Genero",
      labelA: "Mujeres",
      scoreA: female.avg,
      countA: female.count,
      labelB: "Hombres",
      scoreB: male.avg,
      countB: male.count,
      difference: diff,
      leadLabel,
    });
  }

  // 2. Brecha generacional (jovenes vs mayores o jovenes vs adultos)
  const young = payload.real.byAgeBroad.young;
  const senior = payload.real.byAgeBroad.senior;
  const adult = payload.real.byAgeBroad.adult;

  if (young.avg !== null && senior.avg !== null && young.count >= 3 && senior.count >= 3) {
    const diff = parseFloat(Math.abs(young.avg - senior.avg).toFixed(1));
    const leadLabel = young.avg >= senior.avg ? "Jovenes (18-34)" : "Mayores (55+)";
    contrasts.push({
      type: "age_broad",
      title: "Brecha Generacional",
      labelA: "Jovenes (18-34)",
      scoreA: young.avg,
      countA: young.count,
      labelB: "Mayores (55+)",
      scoreB: senior.avg,
      countB: senior.count,
      difference: diff,
      leadLabel,
    });
  } else if (young.avg !== null && adult.avg !== null && young.count >= 3 && adult.count >= 3) {
    const diff = parseFloat(Math.abs(young.avg - adult.avg).toFixed(1));
    const leadLabel = young.avg >= adult.avg ? "Jovenes (18-34)" : "Adultos (35-54)";
    contrasts.push({
      type: "age_broad",
      title: "Brecha Generacional",
      labelA: "Jovenes (18-34)",
      scoreA: young.avg,
      countA: young.count,
      labelB: "Adultos (35-54)",
      scoreB: adult.avg,
      countB: adult.count,
      difference: diff,
      leadLabel,
    });
  }

  if (contrasts.length === 0) return null;

  // Ordenar de mayor a menor diferencia
  contrasts.sort((a, b) => b.difference - a.difference);
  return contrasts[0];
}
