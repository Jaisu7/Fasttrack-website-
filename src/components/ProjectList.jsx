import { useEffect, useState } from "react";
import { products } from "../lib/fasttrack-data";
import { projectSummary } from "../lib/project-list.mjs";

export default function ProjectList({ items, onChange, onEdit, onEnquire, storageAvailable }) {
  const [status, setStatus] = useState("");
  useEffect(() => { setStatus(""); }, [items]);
  if (!items.length) return <div id="project-list" className="project-list-panel project-list-empty"><h3>Your project list</h3><p>Save equipment and compare different sizes or layouts. Add a product above to start your quotation list.</p></div>;
  const text = projectSummary(items, products);
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "Fastrack-equipment-list.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Equipment list downloaded.");
  }
  async function copy() { try { await navigator.clipboard.writeText(text); setStatus("Equipment list copied."); } catch { setStatus("Copy is unavailable. Download the list instead."); } }
  return <div id="project-list" className="project-list-panel">
    <div className="project-list-heading"><div><span className="product-category-label">Plan your equipment</span><h3>Your project list</h3></div><span>{items.length} configurations · {total} units</span></div>
    <p className="quiet">{storageAvailable ? "Saved on this browser. Your list is restored when you return." : "Browser storage is unavailable. Download your list to keep a copy."}</p>
    <div className="project-comparison" role="region" aria-label="Compare saved equipment" tabIndex="0"><table><caption>Compare your saved sizes and arrangements</caption><thead><tr><th>Product</th><th>W × D × H, mm</th><th>Shelves</th><th>Finish</th><th>Quantity</th><th>Actions</th></tr></thead><tbody>{items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const c = item.configuration;
      return <tr key={item.id}><th scope="row">{product.name}</th><td data-label="W × D × H, mm">{c ? `${c.width} × ${c.depth} × ${c.height}` : "To discuss"}</td><td data-label="Shelves">{c ? c.shelves : "—"}</td><td data-label="Finish">{c ? c.finish ? "Satin" : "Brushed" : "To discuss"}</td><td data-label="Quantity"><input type="number" aria-label={`Quantity for ${product.name}`} min="1" max="100" value={item.quantity} onChange={(e) => onChange(items.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.max(1, Math.min(100, Math.round(Number(e.target.value) || 1))) } : entry))} /></td><td className="project-item-actions"><button className="text-control" onClick={() => onEdit(item)}>View{c ? " / adjust" : " product"}</button><button className="text-control remove-project-item" aria-label={`Remove ${product.name} from project`} onClick={() => onChange(items.filter((entry) => entry.id !== item.id))}>Remove</button></td></tr>;
    })}</tbody></table></div>
    <div className="project-list-actions"><button className="button button-green" onClick={() => onEnquire("Multiple equipment / project list", text)}>Enquire about this project list</button><button className="button button-outline" onClick={download}>Download list</button><button className="button button-outline" onClick={copy}>Copy summary</button></div>
    <p className="quiet">All sizes and layouts are requests for review. Our team confirms feasibility, specifications and prices.</p><p role="status" className="form-status">{status}</p>
  </div>;
}
