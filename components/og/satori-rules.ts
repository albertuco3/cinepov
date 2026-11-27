import { Children, isValidElement, type ReactNode } from "react";

/**
 * Satori (el motor de las imágenes OG) falla en tiempo de ejecución si un
 * <div> no tiene display: flex (o contents/none) y su contenido no es una
 * única cadena de texto: un número, un elemento o varios hijos bastan. Es la
 * regla exacta de su código. El build no lo detecta, así que se comprueba aquí.
 */
export function findSatoriViolations(node: ReactNode, path = "raíz"): string[] {
  if (!isValidElement<{ style?: { display?: string }; children?: ReactNode }>(node)) return [];
  const { children, style } = node.props;
  const display = style?.display ?? "";
  const problems: string[] = [];

  if (node.type === "div" && children && typeof children !== "string" && !["flex", "contents", "none"].includes(display)) {
    problems.push(`${path} <div> sin display: flex con contenido ${JSON.stringify(children).slice(0, 80)}`);
  }
  Children.toArray(children).forEach((child, i) => {
    problems.push(...findSatoriViolations(child, `${path} > ${String(node.type)}[${i}]`));
  });
  return problems;
}
