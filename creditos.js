// Créditos e licenças: um <dialog> (#creditos) que abre com qualquer botão data-creditos.
// Os textos (cred.*) vêm de i18n.js e retraduzem-se com o resto da página.
const dlg = document.getElementById("creditos");
if (dlg) {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-creditos]")) { e.preventDefault(); dlg.showModal(); return; }
    if (e.target.closest("#creditos [data-fechar]") || e.target === dlg) dlg.close(); // botão ou clique fora do papel
  });
  if (new URLSearchParams(location.search).has("creditos")) dlg.showModal();
}
