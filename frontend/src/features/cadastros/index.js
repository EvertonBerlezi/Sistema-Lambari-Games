import jogos from "./jogos";
import plataformas from "./plataformas";
import generos from "./generos";
import distribuidoras from "./distribuidoras";
import criticos from "./criticos";
import estoque from "./estoque";
import avaliacoes from "./avaliacoes";
import usuarios from "./usuarios";
const cadastros = [
  jogos,
  plataformas,
  generos,
  distribuidoras,
  criticos,
  estoque,
  avaliacoes,
  usuarios,
];
export const kinds = Object.fromEntries(
  cadastros.map((c) => [c.tipo, c.titulo]),
);
export const fields = Object.fromEntries(
  cadastros.map((c) => [c.tipo, c.campos]),
);
