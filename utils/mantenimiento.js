export function calcularProximoMantenimiento(actual) {
  if (actual === 50) return 100;
  if (actual === 100) return 50;
  if (actual === 200) return 50;
  return 50;
}
