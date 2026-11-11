const aliases = {
  worktable: 'workbench prep table preparation bench stainless steel table ss table',
  refrigerator: 'fridge fridges chiller chillers cold storage cabinet refrigeration',
  'hot-cabinet': 'heated cabinet food warmer warming cabinet hot cupboard',
  display: 'display case deli counter showcase refrigerated counter',
  sink: 'basin washbasin wash basin washing station',
  'sink-shelf': 'washbasin wash basin washing station sink shelf storage',
  rack: 'racking shelving unit storage shelves',
  shelves: 'wall shelf wall shelving',
  'produce-shelf': 'produce stand vegetable rack fruit rack grocery display',
  cabinets: 'cupboard cupboards locker lockers storage counter',
  custom: 'bespoke metalwork retail fitout fit out fabrication',
};
const normalize = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const stopWords = new Set(['a', 'an', 'the', 'and', 'for', 'of', 'with']);

// Accept small typing mistakes in longer words, including adjacent swaps.
// Short queries keep exact matching so unrelated equipment is not suggested.
function nearWord(query, candidate) {
  if (query.length < 5) return false;
  const limit = query.length >= 9 ? 2 : 1;
  if (Math.abs(query.length - candidate.length) > limit) return false;
  let previousPrevious;
  let previous = Array.from({ length: candidate.length + 1 }, (_, i) => i);
  for (let i = 1; i <= query.length; i++) {
    const current = [i];
    for (let j = 1; j <= candidate.length; j++) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + Number(query[i - 1] !== candidate[j - 1]));
      if (i > 1 && j > 1 && query[i - 1] === candidate[j - 2] && query[i - 2] === candidate[j - 1]) current[j] = Math.min(current[j], previousPrevious[j - 2] + 1);
    }
    previousPrevious = previous;
    previous = current;
  }
  return previous[candidate.length] <= limit;
}

export function createEquipmentSearch(products) {
  const entries = products.map(product => {
    const text = normalize([product.name, product.description, product.detail, ...(product.options || []), aliases[product.id] || ''].join(' '));
    return { product, text, words: [...new Set(text.split(' '))] };
  });
  return query => {
    const words = normalize(String(query || '').slice(0, 160)).split(' ').filter(word => word && !stopWords.has(word));
    if (!words.length) return products;
    return entries.filter(entry => words.every(word => entry.text.includes(word) || entry.words.some(candidate => nearWord(word, candidate)))).map(entry => entry.product);
  };
}
